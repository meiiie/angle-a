/**
 * Cell runner: baselines B0–B3 × faults F01–F03 (+ F04 stub) × mocks.
 * Scripted agent by default; optional --driver llm (z.ai GLM) for confirmatory
 * Action Replay cells. Crash/restore simulated in-process.
 *
 * --resynthesize: on retry after crash, slightly mutate tool args and mint a
 * new idempotency key (ACRFence semantic re-synthesis / Action Replay).
 * With driver=llm, the LLM proposes the mutated args (scripted fallback unused).
 */

import { randomUUID } from "node:crypto";
import type {
  AuthorityState,
  CellConfig,
  CellMetrics,
  CrashMarker,
  RunMeta,
} from "../types.ts";
import { BASELINE_TAGS } from "../types.ts";
import { createWorld, snapshotCounters } from "../mocks/store.ts";
import {
  armCrash,
  counterFor,
  createRegistry,
  CrashSignal,
  inspectMock,
  invokeMock,
  defaultPayload,
  type MockToolRegistry,
} from "../mocks/tools.ts";
import { EffectJournal, canonicalArgs } from "../journal/effect-journal.ts";
import { SessionStore, type SessionState } from "../baselines/session.ts";
import { crashPhaseFor, isHarnessResumeFault } from "../faults/injector.ts";
import {
  scriptedToolCall,
  toolName,
  resynthesizePayload,
  resynthesizeIdemKey,
} from "../agent/scripted.ts";
import {
  llmResynthesizeToolArgs,
  type LlmUsage,
} from "../agent/llm.ts";

function ictNow(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const ict = new Date(utc + 7 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ict.getFullYear()}-${pad(ict.getMonth() + 1)}-${pad(ict.getDate())}T${pad(ict.getHours())}:${pad(ict.getMinutes())}:${pad(ict.getSeconds())}+07:00`;
}

function makeIdemKey(mockId: string, effectId: string): string {
  return `idem:${mockId}:${effectId}`;
}

export interface CellResult {
  meta: RunMeta;
  metricsJson: CellMetrics;
}

export async function runCell(cfg: CellConfig): Promise<CellResult> {
  const seed = cfg.seed ?? 0;
  const run_id = randomUUID();
  const evidence_id = cfg.evidenceId ?? `E-dry-${cfg.baseline}-${cfg.fault}-${cfg.mock}`;
  const driver = cfg.driver ?? "scripted";
  const resynth = !!cfg.resynthesize || driver === "llm";
  const llmModel = cfg.model ?? cfg.modelId ?? "glm-5.3";
  const reasoningEffort = cfg.reasoningEffort ?? "low";
  let llmUsageAcc: LlmUsage & { calls: number; base_url_used?: string } = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    calls: 0,
  };
  const model_id =
    cfg.modelId ??
    (driver === "llm"
      ? `llm/${llmModel}@z.ai`
      : resynth
        ? "scripted/always-issue-tool+resynth@scaffold"
        : "scripted/always-issue-tool@scaffold");
  const harness_id = cfg.harnessId ?? "eval-harness@scaffold";
  const started = ictNow();
  const t0 = Date.now();

  const world = createWorld();
  const honorIdem = cfg.baseline === "B2" || cfg.baseline === "B3";
  const reg = createRegistry(world, { honorIdempotency: honorIdem });
  const journal = new EffectJournal();
  const session = new SessionStore();

  const effect_id = `e-${cfg.mock}-${seed}`;
  const mockCountersPre = snapshotCounters(world);

  let crashMarker: CrashMarker | null = null;
  let sealUnknown = false;
  let reApproval = false;
  let retryInvokeCount = 0;
  let harnessOutcome = "pending";
  let authorityState: AuthorityState = "absent";
  let recoveryStart: number | null = null;
  let recoveryEnd: number | null = null;
  let resynthApplied = false;
  let notes_llm_blocked: string | null = null;

  const phase = crashPhaseFor(cfg.fault);
  if (phase !== "none") {
    armCrash(reg, cfg.fault, phase);
  }

  const first = await attemptExecute({
    cfg,
    reg,
    journal,
    session,
    effect_id,
    attempt: 1,
    resynthesize: false,
    seed,
    driver,
    llmModel,
    reasoningEffort,
    onLlmUsage: (u, base) => {
      llmUsageAcc.prompt_tokens += u.prompt_tokens;
      llmUsageAcc.completion_tokens += u.completion_tokens;
      llmUsageAcc.total_tokens += u.total_tokens;
      if (u.reasoning_tokens !== undefined) {
        llmUsageAcc.reasoning_tokens =
          (llmUsageAcc.reasoning_tokens ?? 0) + u.reasoning_tokens;
      }
      llmUsageAcc.calls += 1;
      llmUsageAcc.base_url_used = base;
    },
  });

  authorityState = first.authorityState;
  if (first.sealUnknown) sealUnknown = true;
  crashMarker = first.crashMarker;
  harnessOutcome = first.outcome;

  if (cfg.baseline !== "B0" && first.sessionAfter) {
    session.save(first.sessionAfter);
  }

  // F04 stub: first execute confirmed; then harness-level "resume" with re-synthesis
  const f04Resume =
    isHarnessResumeFault(cfg.fault) &&
    !first.crashed &&
    first.outcome === "confirmed";

  const needsRestore =
    first.crashed ||
    f04Resume ||
    (cfg.fault === "F03" && first.approved && !first.executed);

  if (needsRestore) {
    recoveryStart = Date.now();

    if (f04Resume) {
      // Mark synthetic post-confirm crash for evidence
      crashMarker = {
        fault_id: cfg.fault,
        mock_id: cfg.mock,
        baseline: cfg.baseline,
        t_inject_ms: Date.now(),
        signal: "SIGKILL",
        gitsha: "scaffold",
        phase: "after_confirm_resume_resynth",
      };
      // Force resynthesis on F04 (semantic re-issue after durable result)
      const doResynth = true;
      resynthApplied = true;
      retryInvokeCount += 1;
      await recoverAfterConfirmResynth({
        cfg,
        reg,
        journal,
        session,
        effect_id,
        seed,
        doResynth,
        driver,
        llmModel,
        reasoningEffort,
        onLlmUsage: (u, base) => {
          llmUsageAcc.prompt_tokens += u.prompt_tokens;
          llmUsageAcc.completion_tokens += u.completion_tokens;
          llmUsageAcc.total_tokens += u.total_tokens;
          if (u.reasoning_tokens !== undefined) {
            llmUsageAcc.reasoning_tokens =
              (llmUsageAcc.reasoning_tokens ?? 0) + u.reasoning_tokens;
          }
          llmUsageAcc.calls += 1;
          llmUsageAcc.base_url_used = base;
        },
        setOutcome: (v) => {
          harnessOutcome = v;
        },
        setAuth: (v) => {
          authorityState = v;
        },
        setReApproval: (v) => {
          reApproval = reApproval || v;
        },
        setSeal: (v) => {
          sealUnknown = sealUnknown || v;
        },
      });
    } else if (cfg.baseline === "B0") {
      journal.effects.clear();
      session.clear();
      const effect_id2 = `${effect_id}-retry`;
      retryInvokeCount += 1;
      reg.crash.armed = false;
      const second = await attemptExecute({
        cfg,
        reg,
        journal,
        session,
        effect_id: effect_id2,
        attempt: 2,
        resynthesize: resynth,
        seed,
        driver,
        llmModel,
        reasoningEffort,
        onLlmUsage: (u, base) => {
          llmUsageAcc.prompt_tokens += u.prompt_tokens;
          llmUsageAcc.completion_tokens += u.completion_tokens;
          llmUsageAcc.total_tokens += u.total_tokens;
          if (u.reasoning_tokens !== undefined) {
            llmUsageAcc.reasoning_tokens =
              (llmUsageAcc.reasoning_tokens ?? 0) + u.reasoning_tokens;
          }
          llmUsageAcc.calls += 1;
          llmUsageAcc.base_url_used = base;
        },
      });
      if (resynth) resynthApplied = true;
      authorityState = second.authorityState;
      harnessOutcome = second.outcome;
      if (second.sealUnknown) sealUnknown = true;
    } else {
      const restored = session.load();
      reg.crash.armed = false;

      if (cfg.baseline === "B3") {
        // Optional: ask LLM what it *would* re-issue (Action Replay intent),
        // but still reconcile — never blind-invoke the mock under B3.
        if (resynth && driver === "llm") {
          try {
            const proposed = await resolveResynthArgs({
              driver,
              mockId: cfg.mock,
              effectId: effect_id,
              attempt: 2,
              seed,
              priorPayload: defaultPayload(cfg.mock),
              priorIdem: restored.idempotency_key,
              crashPhase: crashMarker?.phase ?? "after_success_before_receipt",
              llmModel,
              reasoningEffort,
              onLlmUsage: (u, base) => {
                llmUsageAcc.prompt_tokens += u.prompt_tokens;
                llmUsageAcc.completion_tokens += u.completion_tokens;
                llmUsageAcc.total_tokens += u.total_tokens;
                if (u.reasoning_tokens !== undefined) {
                  llmUsageAcc.reasoning_tokens =
                    (llmUsageAcc.reasoning_tokens ?? 0) + u.reasoning_tokens;
                }
                llmUsageAcc.calls += 1;
                llmUsageAcc.base_url_used = base;
              },
            });
            resynthApplied = true;
            notes_llm_blocked = JSON.stringify({
              blocked_by: "B3_reconcile",
              proposed_payload: proposed.payload,
              proposed_idempotency_key: proposed.idempotency_key,
            });
          } catch (e) {
            notes_llm_blocked = `llm_propose_failed:${e instanceof Error ? e.message : String(e)}`;
          }
        }
        recoverB3({
          cfg,
          reg,
          journal,
          restored,
          effect_id,
          setSeal: (v) => {
            sealUnknown = sealUnknown || v;
          },
          setOutcome: (v) => {
            harnessOutcome = v;
          },
          setAuth: (v) => {
            authorityState = v;
          },
          setReApproval: (v) => {
            reApproval = reApproval || v;
          },
        });
        // B3 F01/F02: journal/reconcile — do NOT blind re-invoke even if
        // --resynthesize is set (semantic re-issue blocked until reconcile).
      } else {
        const eid = restored.turn?.effect_id ?? effect_id;
        if (restored.turn && !restored.turn.result_durable) {
          retryInvokeCount += 1;
          const attempt = 2;
          let payload = defaultPayload(cfg.mock);
          let idem: string | undefined;
          if (cfg.baseline === "B2") {
            if (resynth) {
              const resolved = await resolveResynthArgs({
                driver,
                mockId: cfg.mock,
                effectId: eid,
                attempt,
                seed,
                priorPayload: payload,
                priorIdem: restored.idempotency_key,
                crashPhase: crashMarker?.phase ?? "after_success_before_receipt",
                llmModel,
                reasoningEffort,
                onLlmUsage: (u, base) => {
                  llmUsageAcc.prompt_tokens += u.prompt_tokens;
                  llmUsageAcc.completion_tokens += u.completion_tokens;
                  llmUsageAcc.total_tokens += u.total_tokens;
                  if (u.reasoning_tokens !== undefined) {
                    llmUsageAcc.reasoning_tokens =
                      (llmUsageAcc.reasoning_tokens ?? 0) + u.reasoning_tokens;
                  }
                  llmUsageAcc.calls += 1;
                  llmUsageAcc.base_url_used = base;
                },
              });
              payload = resolved.payload;
              idem = resolved.idempotency_key;
              resynthApplied = true;
            } else {
              idem = restored.idempotency_key ?? makeIdemKey(cfg.mock, eid);
            }
          } else if (resynth) {
            // B1: mutate args on retry (no idem key)
            const resolved = await resolveResynthArgs({
              driver,
              mockId: cfg.mock,
              effectId: eid,
              attempt,
              seed,
              priorPayload: payload,
              priorIdem: restored.idempotency_key,
              crashPhase: crashMarker?.phase ?? "after_success_before_receipt",
              llmModel,
              reasoningEffort,
              onLlmUsage: (u, base) => {
                llmUsageAcc.prompt_tokens += u.prompt_tokens;
                llmUsageAcc.completion_tokens += u.completion_tokens;
                llmUsageAcc.total_tokens += u.total_tokens;
                if (u.reasoning_tokens !== undefined) {
                  llmUsageAcc.reasoning_tokens =
                    (llmUsageAcc.reasoning_tokens ?? 0) + u.reasoning_tokens;
                }
                llmUsageAcc.calls += 1;
                llmUsageAcc.base_url_used = base;
              },
            });
            payload = resolved.payload;
            resynthApplied = true;
          }
          const args = scriptedToolCall(cfg.mock, eid, {
            idempotency_key: idem,
            payload,
          });
          try {
            const result = invokeMock(reg, cfg.mock, args);
            harnessOutcome = "confirmed";
            restored.turn.result_durable = true;
            restored.turn.result = result;
            session.save(restored);
          } catch {
            harnessOutcome = "crashed_again";
          }
        } else {
          harnessOutcome = "confirmed";
        }
        if (cfg.fault === "F03" && restored.turn?.approved) {
          authorityState = "resurrected_attempt";
        }
      }
    }
    recoveryEnd = Date.now();
  } else if (!first.crashed) {
    harnessOutcome = first.outcome;
  }

  // B3 F01/F10 safety net: seal + reconcile if still not terminal
  if (
    cfg.baseline === "B3" &&
    crashMarker &&
    (cfg.fault === "F01" || cfg.fault === "F10" || cfg.fault === "F02") &&
    ![
      "confirmed",
      "confirmed_via_reconcile",
      "rejected_via_reconcile",
      "re_approval_required",
    ].includes(harnessOutcome)
  ) {
    ensureB3Reconcile(journal, reg, cfg, effect_id, crashMarker);
    const rec = journal.get(effect_id);
    if (rec?.state === "confirmed") {
      harnessOutcome = "confirmed_via_reconcile";
      authorityState = "spent";
      sealUnknown = true;
    } else if (rec?.state === "rejected") {
      harnessOutcome = "rejected_via_reconcile";
      sealUnknown = true;
    }
    if (recoveryStart === null) recoveryStart = t0;
    recoveryEnd = Date.now();
  }

  const mockCountersPost = snapshotCounters(world);
  const finalCount = counterFor(cfg.mock, world);
  const duplicate = finalCount > 1;
  const falseSuccess =
    (harnessOutcome === "confirmed" || harnessOutcome === "confirmed_via_reconcile") &&
    finalCount === 0;
  const falseSuccessAdj =
    harnessOutcome === "re_approval_required" ? false : falseSuccess;

  const metrics: CellMetrics = {
    duplicate_effect: duplicate,
    duplicate_effect_rate: duplicate ? 1 : 0,
    false_success: falseSuccessAdj,
    false_success_rate: falseSuccessAdj ? 1 : 0,
    recovery_latency_ms:
      recoveryStart !== null && recoveryEnd !== null ? recoveryEnd - recoveryStart : null,
    re_approval: reApproval,
    re_approval_rate: reApproval ? 1 : 0,
    authority_resurrection_count:
      journal.resurrectionAttempts +
      (authorityState === "resurrected_attempt" && cfg.baseline !== "B3" ? 1 : 0),
    retry_invoke_count: retryInvokeCount,
    seal_unknown_emitted: sealUnknown,
  };

  const notesParts: string[] = [];
  if (cfg.dry && driver === "scripted") {
    notesParts.push("dry-cell scaffold (scripted agent, no LLM)");
  }
  if (driver === "llm") {
    notesParts.push(`driver=llm model=${llmModel} reasoning_effort=${reasoningEffort}`);
  }
  if (resynth || resynthApplied) {
    notesParts.push(
      resynthApplied
        ? driver === "llm"
          ? "resynthesize=on via LLM (Action Replay)"
          : "resynthesize=on (semantic args mutated on retry)"
        : "resynthesize=requested (B3 reconcile path; no blind re-issue)",
    );
  }
  if (cfg.fault === "F04") notesParts.push("F04 stub: post-confirm resume+resynth");
  if (notes_llm_blocked) {
    notesParts.push(
      notes_llm_blocked.startsWith("llm_propose_failed")
        ? notes_llm_blocked
        : `llm_action_replay_proposed_but_blocked:${notes_llm_blocked}`,
    );
  }

  const meta: RunMeta = {
    evidence_id,
    run_id,
    model_id,
    harness_id,
    baseline: BASELINE_TAGS[cfg.baseline],
    baseline_id: cfg.baseline,
    fault_id: cfg.fault,
    mock_id: cfg.mock,
    seed,
    started_at_ict: started,
    crash_marker: crashMarker,
    metrics,
    mock_counters_pre: mockCountersPre,
    mock_counters_post: mockCountersPost,
    authority_token_state: authorityState,
    harness_declared_outcome: harnessOutcome,
    notes: notesParts.join("; "),
    driver,
    llm_usage: driver === "llm" ? llmUsageAcc : undefined,
  };

  return { meta, metricsJson: metrics };
}

/**
 * F04 stub: after durable confirm, scripted agent re-issues with mutated args.
 * B2: new idem key → often duplicate. B3: spent authority / confirmed ledger blocks.
 */
async function recoverAfterConfirmResynth(opts: {
  cfg: CellConfig;
  reg: MockToolRegistry;
  journal: EffectJournal;
  session: SessionStore;
  effect_id: string;
  seed: number;
  doResynth: boolean;
  driver: "scripted" | "llm";
  llmModel: string;
  reasoningEffort: "low" | "high" | "max";
  onLlmUsage: (u: LlmUsage, base: string) => void;
  setOutcome: (v: string) => void;
  setAuth: (v: AuthorityState) => void;
  setReApproval: (v: boolean) => void;
  setSeal: (v: boolean) => void;
}) {
  const { cfg, reg, journal, effect_id, seed, doResynth } = opts;
  const attempt = 2;
  const base = defaultPayload(cfg.mock);
  let payload = base;
  let llmIdem: string | undefined;
  if (doResynth) {
    const resolved = await resolveResynthArgs({
      driver: opts.driver,
      mockId: cfg.mock,
      effectId: `${effect_id}-resynth`,
      attempt,
      seed,
      priorPayload: base,
      crashPhase: "after_confirm_resume_resynth",
      llmModel: opts.llmModel,
      reasoningEffort: opts.reasoningEffort,
      onLlmUsage: opts.onLlmUsage,
    });
    payload = resolved.payload;
    llmIdem = resolved.idempotency_key;
  }
  const eid2 = `${effect_id}-resynth`;

  if (cfg.baseline === "B3") {
    // Ledger already confirmed for effect_id; second execute needs new authority.
    // Scaffold: refuse blind second mutate — require re-approval (no counter bump).
    opts.setReApproval(true);
    opts.setAuth("resurrected_attempt");
    journal.resurrectionAttempts += 1;
    opts.setOutcome("re_approval_required");
    return;
  }

  let idem: string | undefined;
  if (cfg.baseline === "B2") {
    idem = doResynth
      ? (llmIdem ?? resynthesizeIdemKey(cfg.mock, eid2, attempt))
      : makeIdemKey(cfg.mock, effect_id);
  }
  const args = scriptedToolCall(cfg.mock, eid2, {
    idempotency_key: idem,
    payload,
  });
  try {
    invokeMock(reg, cfg.mock, args);
    opts.setOutcome("confirmed_resynth_replay");
  } catch {
    opts.setOutcome("crashed_again");
  }
}

function ensureB3Reconcile(
  journal: EffectJournal,
  reg: MockToolRegistry,
  cfg: CellConfig,
  effect_id: string,
  _marker: CrashMarker,
) {
  let rec = journal.get(effect_id);
  if (!rec) return;
  if (rec.state === "confirmed" || rec.state === "rejected") return;
  if (rec.state === "executing" || rec.state === "proposed") {
    journal.sealUnknown(effect_id);
  }
  rec = journal.get(effect_id)!;
  if (rec.state === "unknown") journal.beginReconcile(effect_id);
  const insp = inspectMock(reg, cfg.mock, effect_id);
  journal.finishReconcile(effect_id, insp.found, insp.detail);
}

function recoverB3(opts: {
  cfg: CellConfig;
  reg: MockToolRegistry;
  journal: EffectJournal;
  restored: SessionState;
  effect_id: string;
  setSeal: (v: boolean) => void;
  setOutcome: (v: string) => void;
  setAuth: (v: AuthorityState) => void;
  setReApproval: (v: boolean) => void;
}) {
  const { cfg, reg, journal, restored, effect_id } = opts;
  if (restored.journal_snap) journal.restore(restored.journal_snap);

  // F03: approved before execute
  if (cfg.fault === "F03" && restored.turn?.approved && !restored.turn.result_durable) {
    const eid = restored.turn.effect_id;
    const token = restored.authority_token;
    const rec = journal.get(eid);
    if (token && rec) {
      const wasExecuting = rec.state === "executing";
      if (!wasExecuting) {
        opts.setReApproval(true);
        opts.setAuth("resurrected_attempt");
        journal.resurrectionAttempts += 0;
        opts.setOutcome("re_approval_required");
        return;
      }
      const usable = journal.assertAuthorityUsable(token, eid, rec.artifact_hash);
      if (!usable) {
        opts.setReApproval(true);
        opts.setAuth("resurrected_attempt");
        opts.setOutcome("re_approval_required");
        return;
      }
      journal.beginExec(eid);
      const args = scriptedToolCall(cfg.mock, eid, {
        idempotency_key: restored.idempotency_key,
        authority_token: token,
      });
      const result = invokeMock(reg, cfg.mock, args);
      journal.confirm(eid, result.receipt ?? {}, token);
      opts.setAuth("spent");
      opts.setOutcome("confirmed");
      return;
    }
  }

  // F01/F02/F10: seal unknown + reconcile by inspect (no blind re-issue)
  const eid = restored.turn?.effect_id ?? effect_id;
  const rec = journal.get(eid);
  if (
    rec &&
    (rec.state === "executing" ||
      rec.state === "proposed" ||
      restored.crash_committed ||
      restored.crash_partial)
  ) {
    if (rec.state !== "unknown" && rec.state !== "reconciling") {
      journal.sealUnknown(eid);
      opts.setSeal(true);
    }
    const cur = journal.get(eid)!;
    if (cur.state === "unknown") journal.beginReconcile(eid);
    const insp = inspectMock(reg, cfg.mock, eid);
    const found = insp.found || !!restored.crash_committed;
    journal.finishReconcile(eid, found, insp.detail);
    opts.setOutcome(found ? "confirmed_via_reconcile" : "rejected_via_reconcile");
    if (found) opts.setAuth("spent");
    return;
  }

  if (rec?.state === "confirmed") opts.setOutcome("confirmed");
}

interface AttemptOpts {
  cfg: CellConfig;
  reg: MockToolRegistry;
  journal: EffectJournal;
  session: SessionStore;
  effect_id: string;
  attempt: number;
  resynthesize: boolean;
  seed: number;
  driver: "scripted" | "llm";
  llmModel: string;
  reasoningEffort: "low" | "high" | "max";
  onLlmUsage: (u: LlmUsage, base: string) => void;
}

async function resolveResynthArgs(opts: {
  driver: "scripted" | "llm";
  mockId: import("../types.ts").MockId;
  effectId: string;
  attempt: number;
  seed: number;
  priorPayload: Record<string, unknown>;
  priorIdem?: string;
  crashPhase: string;
  llmModel: string;
  reasoningEffort: "low" | "high" | "max";
  onLlmUsage: (u: LlmUsage, base: string) => void;
}): Promise<{ payload: Record<string, unknown>; idempotency_key: string }> {
  if (opts.driver === "llm") {
    const r = await llmResynthesizeToolArgs({
      mockId: opts.mockId,
      effectId: opts.effectId,
      attempt: opts.attempt,
      seed: opts.seed,
      priorPayload: opts.priorPayload,
      priorIdem: opts.priorIdem,
      crashPhase: opts.crashPhase,
      model: opts.llmModel,
      reasoningEffort: opts.reasoningEffort,
    });
    opts.onLlmUsage(r.usage, r.base_url_used);
    return {
      payload: r.payload,
      idempotency_key:
        r.idempotency_key ??
        resynthesizeIdemKey(opts.mockId, opts.effectId, opts.attempt),
    };
  }
  return {
    payload: resynthesizePayload(
      opts.mockId,
      opts.priorPayload,
      opts.attempt,
      opts.seed,
    ),
    idempotency_key: resynthesizeIdemKey(
      opts.mockId,
      opts.effectId,
      opts.attempt,
    ),
  };
}

interface AttemptResult {
  crashed: boolean;
  approved: boolean;
  executed: boolean;
  outcome: string;
  authorityState: AuthorityState;
  sealUnknown: boolean;
  crashMarker: CrashMarker | null;
  sessionAfter: SessionState | null;
}

async function attemptExecute(o: AttemptOpts): Promise<AttemptResult> {
  const { cfg, reg, journal, effect_id, attempt, resynthesize, seed } = o;
  const tool = toolName(cfg.mock);
  let payload = defaultPayload(cfg.mock);
  let resynthIdem: string | undefined;
  if (resynthesize && attempt > 1) {
    const resolved = await resolveResynthArgs({
      driver: o.driver,
      mockId: cfg.mock,
      effectId: effect_id,
      attempt,
      seed,
      priorPayload: payload,
      crashPhase: "retry_after_crash",
      llmModel: o.llmModel,
      reasoningEffort: o.reasoningEffort,
      onLlmUsage: o.onLlmUsage,
    });
    payload = resolved.payload;
    resynthIdem = resolved.idempotency_key;
  }
  const argsCanon = canonicalArgs(payload);
  const artifact = `artifact:${cfg.mock}:${effect_id}`;

  let authorityState: AuthorityState = "absent";
  let token: string | undefined;
  let idem: string | undefined;

  if (cfg.baseline === "B2" || cfg.baseline === "B3") {
    if (resynthesize && attempt > 1) {
      idem = resynthIdem ?? resynthesizeIdemKey(cfg.mock, effect_id, attempt);
    } else {
      idem = makeIdemKey(cfg.mock, effect_id);
    }
  }

  if (cfg.baseline === "B3") {
    token = journal.issueAuthority(effect_id, tool, argsCanon, artifact);
    journal.propose(effect_id, tool, argsCanon, artifact, token);
    authorityState = "proposed";
  } else if (cfg.baseline === "B1" || cfg.baseline === "B2") {
    journal.propose(effect_id, tool, argsCanon, artifact);
  }

  const approved = true;

  // F03: crash after approval before execute (before beginExec)
  if (
    cfg.fault === "F03" &&
    reg.crash.armed &&
    reg.crash.phase === "after_approval_before_execute"
  ) {
    reg.crash.fired = true;
    const sess: SessionState = {
      turn: {
        effect_id,
        tool_call_pending: true,
        result_durable: false,
        approved: true,
      },
      journal_snap: cfg.baseline !== "B0" ? journal.snapshot() : null,
      idempotency_key: idem,
      authority_token: token,
    };
    return {
      crashed: true,
      approved: true,
      executed: false,
      outcome: "crashed",
      authorityState,
      sealUnknown: false,
      crashMarker: {
        fault_id: cfg.fault,
        mock_id: cfg.mock,
        baseline: cfg.baseline,
        t_inject_ms: Date.now(),
        signal: "SIGKILL",
        gitsha: "scaffold",
        phase: "after_approval_before_execute",
      },
      sessionAfter: sess,
    };
  }

  // Pre-effect durability (I1) for B1–B3
  if (cfg.baseline === "B3") {
    journal.beginExec(effect_id);
  }
  if (cfg.baseline !== "B0") {
    o.session.save({
      turn: {
        effect_id,
        tool_call_pending: true,
        result_durable: false,
        approved,
      },
      journal_snap: journal.snapshot(),
      idempotency_key: idem,
      authority_token: token,
    });
  }

  const args = scriptedToolCall(cfg.mock, effect_id, {
    idempotency_key: idem,
    authority_token: token,
    artifact,
    payload,
  });

  try {
    const result = invokeMock(reg, cfg.mock, args);

    if (cfg.baseline === "B3") {
      journal.confirm(effect_id, result.receipt ?? {}, token);
      authorityState = "spent";
    }

    const sess: SessionState = {
      turn: {
        effect_id,
        tool_call_pending: false,
        result_durable: true,
        approved,
        result,
      },
      journal_snap: journal.snapshot(),
      idempotency_key: idem,
      authority_token: token,
    };

    return {
      crashed: false,
      approved,
      executed: true,
      outcome: "confirmed",
      authorityState,
      sealUnknown: false,
      crashMarker: null,
      sessionAfter: sess,
    };
  } catch (e) {
    if (e instanceof CrashSignal) {
      const marker: CrashMarker = {
        fault_id: cfg.fault,
        mock_id: cfg.mock,
        baseline: cfg.baseline,
        t_inject_ms: Date.now(),
        signal: "SIGKILL",
        gitsha: "scaffold",
        phase: e.phase,
      };
      const sess: SessionState = {
        turn: {
          effect_id,
          tool_call_pending: true,
          result_durable: false,
          approved,
        },
        journal_snap: journal.snapshot(),
        idempotency_key: idem,
        authority_token: token,
        crash_committed: e.committed,
        crash_partial: e.partial,
      };
      return {
        crashed: true,
        approved,
        executed: e.committed || e.partial,
        outcome: "crashed",
        authorityState,
        sealUnknown: false,
        crashMarker: marker,
        sessionAfter: sess,
      };
    }
    throw e;
  }
}
