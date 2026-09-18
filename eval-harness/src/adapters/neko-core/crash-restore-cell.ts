/**
 * E2 seal fixture — controlled crash/restore using real neko-core sealDanglingToolCalls.
 * Lab mocks + EffectJournal remain beside Agent (Option A dual-stack).
 *
 * F01 × M-pay × {B2,B3}:
 *   - Pre-tool durableCheckpoint leaves assistant tool_call unanswered on disk
 *   - Mock may commit then CrashSignal before tool-result append
 *   - Restore → sealDanglingToolCalls (real API)
 *   - B2: blind re-invoke (Action Replay)
 *   - B3: journal sealUnknown + reconcile-by-inspect; no blind re-invoke
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import type { BaselineId, CellMetrics, CrashMarker, RunMeta } from "../../types.ts";
import { BASELINE_TAGS } from "../../types.ts";
import { createWorld, snapshotCounters } from "../../mocks/store.ts";
import {
  armCrash,
  counterFor,
  createRegistry,
  CrashSignal,
  defaultPayload,
  inspectMock,
  invokeMock,
} from "../../mocks/tools.ts";
import { EffectJournal, canonicalArgs } from "../../journal/effect-journal.ts";
import { scriptedToolCall, toolName } from "../../agent/scripted.ts";
import { createEvalAgent, restoreMessagesOntoAgent } from "./agent-shim.ts";
import { applySealAfterRestore } from "./seal-bridge.ts";
import { mockPhaseForFault } from "./fault-hooks.ts";
import { metricsFromNekoCell } from "./metrics-bridge.ts";
import {
  NEKO_CORE_COMMIT,
  NEKO_CORE_COMMIT_SHORT,
  harnessIdForAdapter,
} from "./pin.ts";

function ictNow(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const ict = new Date(utc + 7 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ict.getFullYear()}-${pad(ict.getMonth() + 1)}-${pad(ict.getDate())}T${pad(ict.getHours())}:${pad(ict.getMinutes())}:${pad(ict.getSeconds())}+07:00`;
}

function labShaShort(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: "/workspace/research/wiii-lab",
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export interface NekoCellConfig {
  baseline: Extract<BaselineId, "B2" | "B3">;
  seed?: number;
  evidenceId?: string;
  workDir?: string;
  /** Lab git short SHA for harness_id (default: live git). */
  labSha?: string;
}

export interface NekoCellResult {
  meta: RunMeta;
  metricsJson: CellMetrics;
  seal: ReturnType<typeof applySealAfterRestore>;
  trajectory: {
    messages_pre_crash: unknown[];
    messages_post_seal: unknown[];
    barrier: string;
    policy: string;
  };
  diffs_from_full_neko_session: string[];
}

export async function runNekoSealCrashRestoreCell(
  cfg: NekoCellConfig,
): Promise<NekoCellResult> {
  const seed = cfg.seed ?? 1;
  const baseline = cfg.baseline;
  const fault = "F01" as const;
  const mock = "M-pay" as const;
  const run_id = randomUUID();
  const labSha = cfg.labSha ?? labShaShort();
  const harness_id = harnessIdForAdapter(labSha);
  const evidence_id =
    cfg.evidenceId ??
    `E-20260918-neko-seal-F01-Mpay-${baseline}`;
  const workDir =
    cfg.workDir ??
    join("/tmp", "wiii-neko-adapter", evidence_id, run_id);
  mkdirSync(workDir, { recursive: true });

  const started = ictNow();
  const t0 = Date.now();
  const effect_id = `e-neko-${mock}-${seed}`;
  const tool_call_id = `call_${effect_id}`;

  const world = createWorld();
  const honorIdem = baseline === "B2" || baseline === "B3";
  const reg = createRegistry(world, { honorIdempotency: honorIdem });
  const journal = new EffectJournal();

  const { agent, durableCheckpoint, checkpoint } = createEvalAgent(
    join(workDir, "session"),
  );

  const payload = defaultPayload(mock);
  const tool = toolName(mock);
  const argsCanonical = canonicalArgs(payload);
  const artifact = `artifact:${effect_id}`;
  let authority_token: string | undefined;

  // --- Scripted assistant emits tool_call (no LLM) ---
  agent.messages = [
    { role: "user", content: `Please charge once (effect ${effect_id}).` },
    {
      role: "assistant",
      content: "",
      tool_calls: [
        {
          id: tool_call_id,
          type: "function",
          function: {
            name: tool,
            arguments: JSON.stringify({
              effect_id,
              payload,
              ...(baseline === "B2"
                ? { idempotency_key: `idem:${mock}:${effect_id}` }
                : {}),
            }),
          },
        },
      ],
    },
  ];

  // I1-ish: durable barrier before tool work (messages with dangling call on disk)
  await durableCheckpoint();

  if (baseline === "B3") {
    authority_token = journal.issueAuthority(effect_id, tool, argsCanonical, artifact);
    journal.propose(effect_id, tool, argsCanonical, artifact, authority_token);
    journal.beginExec(effect_id);
  }

  // Persist journal + world sidecar (lab effect state closer to production than scaffold-only)
  const sidePath = join(workDir, "effect-side.json");
  const writeSide = (extra: Record<string, unknown> = {}) => {
    writeFileSync(
      sidePath,
      JSON.stringify(
        {
          effect_id,
          tool_call_id,
          baseline,
          journal: journal.snapshot(),
          world: snapshotCounters(world),
          authority_token,
          crash_committed: false,
          ...extra,
        },
        null,
        2,
      ),
    );
  };
  writeSide();

  armCrash(reg, fault, mockPhaseForFault(fault));
  const mockArgs = scriptedToolCall(mock, effect_id, {
    idempotency_key:
      baseline === "B2" ? `idem:${mock}:${effect_id}` : undefined,
    authority_token,
    payload,
  });

  let crashMarker: CrashMarker | null = null;
  let crashCommitted = false;
  try {
    invokeMock(reg, mock, mockArgs);
    // If no crash, we would append tool result — but F01 must fire.
    throw new Error("expected F01 CrashSignal did not fire");
  } catch (e) {
    if (!(e instanceof CrashSignal)) throw e;
    crashCommitted = e.committed;
    crashMarker = {
      fault_id: fault,
      mock_id: mock,
      baseline,
      t_inject_ms: Date.now() - t0,
      signal: e.message,
      gitsha: NEKO_CORE_COMMIT_SHORT,
      phase: e.phase,
    };
    // Intentionally do NOT append role:tool result — dangling call remains.
    await durableCheckpoint();
    writeSide({
      crash_committed: crashCommitted,
      crash_partial: e.partial,
      crash_marker: crashMarker,
    });
  }

  const messagesPreCrash = structuredClone(agent.messages);
  const counterAfterCrash = counterFor(mock, world);

  // --- Restore cell (simulates process restart) ---
  const restoredMsgs = checkpoint.read();
  if (!restoredMsgs) throw new Error("checkpoint missing after crash");
  const side = JSON.parse(readFileSync(sidePath, "utf8")) as {
    journal: ReturnType<EffectJournal["snapshot"]>;
    crash_committed: boolean;
    authority_token?: string;
  };

  const { agent: agent2 } = createEvalAgent(join(workDir, "session-restore"));
  restoreMessagesOntoAgent(agent2, restoredMsgs);
  const seal = applySealAfterRestore(agent2);
  // Persist sealed trajectory (ACP-like)
  writeFileSync(
    join(workDir, "session-restore", "messages-sealed.json"),
    JSON.stringify(agent2.messages, null, 2),
  );

  journal.restore(side.journal);

  let retryInvokeCount = 0;
  let harnessOutcome = "pending";
  let authorityState: RunMeta["authority_token_state"] = "absent";
  let reApproval = false;
  let policy = "";

  if (baseline === "B2") {
    policy = "B2_blind_reinvoke_action_replay";
    // Action Replay: re-issue with new idem key (semantic resynth stub)
    retryInvokeCount = 1;
    const args2 = scriptedToolCall(mock, effect_id, {
      idempotency_key: `idem:${mock}:${effect_id}:retry`,
      payload: { ...payload, amount: Number(payload.amount ?? 42) },
    });
    invokeMock(reg, mock, args2);
    harnessOutcome = "blind_replay_invoked";
  } else {
    policy = "B3_seal_reconcile_no_blind_replay";
    // Prefer neko trajectory seal; also seal lab journal (dual-stack)
    const rec = journal.get(effect_id);
    if (rec && (rec.state === "executing" || rec.state === "proposed")) {
      journal.sealUnknown(effect_id);
    }
    const cur = journal.get(effect_id);
    if (cur?.state === "unknown") journal.beginReconcile(effect_id);
    const insp = inspectMock(reg, mock, effect_id);
    const found = insp.found || side.crash_committed;
    if (cur) {
      journal.finishReconcile(effect_id, found, insp.detail);
    }
    // Critical: do NOT blind re-invoke
    retryInvokeCount = 0;
    harnessOutcome = found
      ? "confirmed_via_reconcile"
      : "rejected_via_reconcile";
    if (found) {
      authorityState = "spent";
    } else {
      authorityState = side.authority_token ? "proposed" : "absent";
    }
    // F01 B3: no blind re-invoke; authority consume happens inside finishReconcile→confirm.
    // Do not probe resurrection here (that is F03).
  }

  const counterPost = counterFor(mock, world);
  const counterPre = 0;
  const metricsJson = metricsFromNekoCell({
    counterPre,
    counterPost,
    seal,
    retryInvokeCount,
    authorityResurrectionCount: journal.resurrectionAttempts,
    reApproval,
    recoveryLatencyMs: Date.now() - t0,
  });

  // Override duplicate detection with clear F01 semantics
  metricsJson.duplicate_effect = counterPost >= 2;
  metricsJson.duplicate_effect_rate = metricsJson.duplicate_effect ? 1 : 0;
  metricsJson.seal_unknown_emitted =
    seal.sealed_unknown_outcome && seal.seal_text_matches_neko_core;

  writeSide({
    crash_committed: crashCommitted,
    journal: journal.snapshot(),
    world: snapshotCounters(world),
    seal,
    policy,
    harness_outcome: harnessOutcome,
    retry_invoke_count: retryInvokeCount,
  });

  const diffs_from_full_neko_session = [
    "No ACP session activate/persist (acp.ts restore path not driven end-to-end)",
    "No real Provider.complete / runLoop — scripted tool_call fixture only",
    "ToolRegistry does not execute mock_payment_charge; lab MockToolRegistry does",
    "EffectJournal + authority consume (I5) remain lab-side, not in neko Agent",
    "Crash is in-process CrashSignal, not OS process kill / session writer lease",
    "Session durability is adapter JSON checkpoint of messages, not neko session.ts atomic primary/backup",
  ];

  const meta: RunMeta = {
    evidence_id,
    run_id,
    model_id: "scripted/neko-seal-fixture@adapter",
    harness_id,
    baseline: BASELINE_TAGS[baseline],
    baseline_id: baseline,
    fault_id: fault,
    mock_id: mock,
    seed,
    started_at_ict: started,
    crash_marker: crashMarker,
    metrics: metricsJson,
    mock_counters_pre: snapshotCounters(createWorld()),
    mock_counters_post: snapshotCounters(world),
    authority_token_state: authorityState,
    harness_declared_outcome: harnessOutcome,
    notes: `neko-core@${NEKO_CORE_COMMIT_SHORT} sealDanglingToolCalls; dual-stack B3 journal; workDir=${workDir}`,
    driver: "scripted",
  };

  // Attach adapter-specific fields into a sidecar for evidence
  writeFileSync(
    join(workDir, "adapter-meta.json"),
    JSON.stringify(
      {
        neko_core_commit: NEKO_CORE_COMMIT,
        lab_sha: labSha,
        harness_id,
        seal,
        policy,
        diffs_from_full_neko_session,
        counter_after_crash: counterAfterCrash,
        counter_post: counterPost,
      },
      null,
      2,
    ),
  );

  return {
    meta,
    metricsJson,
    seal,
    trajectory: {
      messages_pre_crash: messagesPreCrash,
      messages_post_seal: seal.messages_after,
      barrier: "after_durable_checkpoint_before_tool_result_append",
      policy,
    },
    diffs_from_full_neko_session,
  };
}

export function writeNekoEvidence(
  result: NekoCellResult,
  evidenceRoot: string,
): string {
  const root = join(evidenceRoot, result.meta.evidence_id);
  mkdirSync(join(root, "crash-markers"), { recursive: true });
  writeFileSync(join(root, "meta.json"), JSON.stringify(result.meta, null, 2));
  writeFileSync(
    join(root, "counters-pre.json"),
    JSON.stringify(result.meta.mock_counters_pre, null, 2),
  );
  writeFileSync(
    join(root, "counters-post.json"),
    JSON.stringify(result.meta.mock_counters_post, null, 2),
  );
  writeFileSync(
    join(root, "stdout.log"),
    JSON.stringify(
      {
        metrics: result.metricsJson,
        outcome: result.meta.harness_declared_outcome,
        seal: {
          sealed_unknown_outcome: result.seal.sealed_unknown_outcome,
          seal_text: result.seal.seal_text,
          seal_text_matches_neko_core: result.seal.seal_text_matches_neko_core,
        },
        policy: result.trajectory.policy,
        diffs_from_full_neko_session: result.diffs_from_full_neko_session,
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(root, "trajectory.json"),
    JSON.stringify(result.trajectory, null, 2),
  );
  if (result.meta.crash_marker) {
    writeFileSync(
      join(
        root,
        "crash-markers",
        `${result.meta.fault_id}-${result.meta.run_id}.json`,
      ),
      JSON.stringify(result.meta.crash_marker, null, 2),
    );
  }
  return root;
}
