#!/usr/bin/env bun
/**
 * Confirmatory neko-core-faithful adapter matrix (scripted).
 * Defaults: F01 × M-pay × {B2,B3} × N=30
 * Resume-safe: skips cells with existing meta.json + stdout.log.
 *
 * Usage:
 *   bun run src/cli/confirmatory-neko-seal.ts [--n 30] [--concurrency 1]
 *   bun run src/cli/confirmatory-neko-seal.ts --n 30
 *
 * Evidence IDs: E-confirm-neko-seal-F01-Mpay-{B2|B3}-sNN
 * Summary: evidence/runs/confirmatory-neko-seal-F01-Mpay-N30-summary.json
 *
 * Goal: seal+policy fidelity vs scaffold rates — NOT LLM Action Replay.
 * harness_id stays neko-core@c863cc6+eval-adapter@…
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runNekoSealCrashRestoreCell,
  writeNekoEvidence,
  type NekoCellResult,
} from "../adapters/neko-core/crash-restore-cell.ts";
import {
  NEKO_CORE_COMMIT,
  NEKO_CORE_COMMIT_SHORT,
} from "../adapters/neko-core/pin.ts";

const evidenceRoot = join(import.meta.dir, "../../../evidence/runs");

type Baseline = "B2" | "B3";

function usage(): never {
  console.error(
    `Usage: confirmatory-neko-seal [--n 30] [--concurrency 1]
  Defaults: F01 × M-pay × {B2,B3} × N=30 (scripted; no ZAI)
  Resume: skips cells with existing meta.json + stdout.log under evidence/runs/
  Evidence IDs: E-confirm-neko-seal-F01-Mpay-{B2|B3}-sNN
  Summary: evidence/runs/confirmatory-neko-seal-F01-Mpay-N\${n}-summary.json`,
  );
  process.exit(2);
}

function parseArgs(argv: string[]) {
  let n = 30;
  let concurrency = 1;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--n") n = Number(argv[++i]);
    else if (a === "--concurrency") concurrency = Number(argv[++i]);
    else if (a === "--help" || a === "-h") usage();
    else if (a.startsWith("-")) {
      console.error(`Unknown flag: ${a}`);
      usage();
    }
  }
  if (!Number.isFinite(n) || n < 1) {
    console.error(`Invalid --n ${n}`);
    usage();
  }
  return { n, concurrency: Math.max(1, concurrency) };
}

function ictNow(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const ict = new Date(utc + 7 * 3600_000);
  const pad = (nn: number) => String(nn).padStart(2, "0");
  return `${ict.getFullYear()}-${pad(ict.getMonth() + 1)}-${pad(ict.getDate())}T${pad(ict.getHours())}:${pad(ict.getMinutes())}:${pad(ict.getSeconds())}+07:00`;
}

function seedPad(s: number): string {
  return String(s).padStart(2, "0");
}

function evidenceId(baseline: string, seed: number): string {
  return `E-confirm-neko-seal-F01-Mpay-${baseline}-s${seedPad(seed)}`;
}

function summaryPath(n: number): string {
  return join(evidenceRoot, `confirmatory-neko-seal-F01-Mpay-N${n}-summary.json`);
}

type CellRow = {
  evidence_id: string;
  seed: number;
  baseline: string;
  fault_id: string;
  mock_id: string;
  duplicate_effect: boolean;
  duplicate_effect_rate: number;
  false_success: boolean;
  seal_unknown_emitted: boolean;
  seal_text_matches_neko_core: boolean;
  seal_text: string;
  authority_resurrection_count: number;
  retry_invoke_count: number;
  effect_count: number;
  charge_count: number;
  outcome: string;
  policy: string;
  notes: string;
  harness_id: string;
  model_id: string;
  error?: string;
  resumed: boolean;
};

function loadExistingCell(
  eid: string,
  baseline: string,
  seed: number,
): CellRow | null {
  const root = join(evidenceRoot, eid);
  const stdoutPath = join(root, "stdout.log");
  const metaPath = join(root, "meta.json");
  if (!existsSync(stdoutPath) || !existsSync(metaPath)) return null;
  try {
    const stdout = JSON.parse(readFileSync(stdoutPath, "utf8"));
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const counters = (meta.mock_counters_post ?? {}) as Record<string, unknown>;
    const charge_count = Number(counters.charge_count ?? 0);
    return {
      evidence_id: eid,
      seed,
      baseline,
      fault_id: "F01",
      mock_id: "M-pay",
      duplicate_effect: !!stdout.metrics?.duplicate_effect,
      duplicate_effect_rate: Number(stdout.metrics?.duplicate_effect_rate ?? 0),
      false_success: !!stdout.metrics?.false_success,
      seal_unknown_emitted: !!stdout.metrics?.seal_unknown_emitted,
      seal_text_matches_neko_core: !!stdout.seal?.seal_text_matches_neko_core,
      seal_text: String(stdout.seal?.seal_text ?? ""),
      authority_resurrection_count: Number(
        stdout.metrics?.authority_resurrection_count ?? 0,
      ),
      retry_invoke_count: Number(stdout.metrics?.retry_invoke_count ?? 0),
      effect_count: charge_count,
      charge_count,
      outcome: String(stdout.outcome ?? meta.harness_declared_outcome ?? ""),
      policy: String(stdout.policy ?? ""),
      notes: String(meta.notes ?? ""),
      harness_id: String(meta.harness_id ?? ""),
      model_id: String(meta.model_id ?? ""),
      resumed: true,
    };
  } catch {
    return null;
  }
}

function rowFromResult(
  result: NekoCellResult,
  seed: number,
  baseline: Baseline,
  resumed: boolean,
): CellRow {
  const counters = (result.meta.mock_counters_post ?? {}) as Record<
    string,
    unknown
  >;
  const charge_count = Number(counters.charge_count ?? 0);
  return {
    evidence_id: result.meta.evidence_id,
    seed,
    baseline,
    fault_id: "F01",
    mock_id: "M-pay",
    duplicate_effect: !!result.metricsJson.duplicate_effect,
    duplicate_effect_rate: Number(result.metricsJson.duplicate_effect_rate ?? 0),
    false_success: !!result.metricsJson.false_success,
    seal_unknown_emitted: !!result.metricsJson.seal_unknown_emitted,
    seal_text_matches_neko_core: !!result.seal.seal_text_matches_neko_core,
    seal_text: String(result.seal.seal_text ?? ""),
    authority_resurrection_count: Number(
      result.metricsJson.authority_resurrection_count ?? 0,
    ),
    retry_invoke_count: Number(result.metricsJson.retry_invoke_count ?? 0),
    effect_count: charge_count,
    charge_count,
    outcome: result.meta.harness_declared_outcome,
    policy: result.trajectory.policy,
    notes: String(result.meta.notes ?? ""),
    harness_id: result.meta.harness_id,
    model_id: result.meta.model_id,
    resumed,
  };
}

async function runOne(baseline: Baseline, seed: number): Promise<CellRow> {
  const eid = evidenceId(baseline, seed);
  const existing = loadExistingCell(eid, baseline, seed);
  if (existing) {
    console.error(`SKIP ${eid} (resume)`);
    return existing;
  }

  try {
    const result = await runNekoSealCrashRestoreCell({
      baseline,
      seed,
      evidenceId: eid,
    });
    writeNekoEvidence(result, evidenceRoot);
    const row = rowFromResult(result, seed, baseline, false);
    console.error(
      `OK ${eid} dup=${row.duplicate_effect} charge=${row.charge_count} seal=${row.seal_unknown_emitted} match=${row.seal_text_matches_neko_core} retry=${row.retry_invoke_count} outcome=${row.outcome}`,
    );
    return row;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`FAIL ${eid}: ${msg}`);
    return {
      evidence_id: eid,
      seed,
      baseline,
      fault_id: "F01",
      mock_id: "M-pay",
      duplicate_effect: false,
      duplicate_effect_rate: 0,
      false_success: false,
      seal_unknown_emitted: false,
      seal_text_matches_neko_core: false,
      seal_text: "",
      authority_resurrection_count: 0,
      retry_invoke_count: 0,
      effect_count: 0,
      charge_count: 0,
      outcome: "error",
      policy: "",
      notes: "",
      harness_id: "",
      model_id: "scripted/neko-seal-fixture@adapter",
      error: msg,
      resumed: false,
    };
  }
}

function aggregate(cells: CellRow[], n: number) {
  const byB = { B2: [] as CellRow[], B3: [] as CellRow[] };
  for (const c of cells) {
    if (c.baseline === "B2" || c.baseline === "B3") byB[c.baseline].push(c);
  }
  function stats(rows: CellRow[]) {
    const ok = rows.filter((r) => !r.error);
    const nOk = ok.length;
    const mean = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const harnessIds = [...new Set(ok.map((r) => r.harness_id).filter(Boolean))];
    return {
      n: nOk,
      n_requested: n,
      errors: rows.filter((r) => r.error).length,
      resumed_skips: rows.filter((r) => r.resumed).length,
      duplicate_effect_rate: mean(ok.map((r) => (r.duplicate_effect ? 1 : 0))),
      false_success_rate: mean(ok.map((r) => (r.false_success ? 1 : 0))),
      seal_unknown_rate: mean(ok.map((r) => (r.seal_unknown_emitted ? 1 : 0))),
      seal_text_matches_neko_core_rate: mean(
        ok.map((r) => (r.seal_text_matches_neko_core ? 1 : 0)),
      ),
      mean_authority_resurrection: mean(
        ok.map((r) => r.authority_resurrection_count),
      ),
      mean_retry_invoke_count: mean(ok.map((r) => r.retry_invoke_count)),
      mean_effect_count_post: mean(ok.map((r) => r.effect_count)),
      mean_charge_count_post: mean(ok.map((r) => r.charge_count)),
      harness_ids: harnessIds,
      outcomes: Object.fromEntries(
        [...new Set(ok.map((r) => r.outcome))].map((o) => [
          o,
          ok.filter((r) => r.outcome === o).length,
        ]),
      ),
    };
  }
  const B2 = stats(byB.B2);
  const B3 = stats(byB.B3);

  // Compare to scaffold LLM confirmatory pattern (E-22): B2 dup=1 charge=2; B3 dup=0 charge=1 seal=1
  const matches_scaffold_dup_charge =
    B2.duplicate_effect_rate === 1 &&
    B2.mean_charge_count_post === 2 &&
    B3.duplicate_effect_rate === 0 &&
    B3.mean_charge_count_post === 1 &&
    B3.seal_unknown_rate === 1;

  return {
    protocol: `confirmatory-neko-seal-F01-Mpay-N${n}`,
    fault_id: "F01",
    mock_id: "M-pay",
    effect_counter_field: "charge_count",
    driver: "scripted",
    model: "scripted/neko-seal-fixture@adapter",
    neko_core_commit: NEKO_CORE_COMMIT,
    neko_core_commit_short: NEKO_CORE_COMMIT_SHORT,
    n_per_baseline: n,
    seeds: `1..${n}`,
    harness_id_pattern: `neko-core@${NEKO_CORE_COMMIT_SHORT}+eval-adapter@…`,
    written_at_ict: ictNow(),
    B2,
    B3,
    headline: {
      B2_duplicate_effect_rate: B2.duplicate_effect_rate,
      B3_duplicate_effect_rate: B3.duplicate_effect_rate,
      B2_mean_effect_count: B2.mean_effect_count_post,
      B3_mean_effect_count: B3.mean_effect_count_post,
      B2_mean_charge_count: B2.mean_charge_count_post,
      B3_mean_charge_count: B3.mean_charge_count_post,
      B2_seal_unknown_rate: B2.seal_unknown_rate,
      B3_seal_unknown_rate: B3.seal_unknown_rate,
      B2_seal_text_matches_neko_core_rate: B2.seal_text_matches_neko_core_rate,
      B3_seal_text_matches_neko_core_rate: B3.seal_text_matches_neko_core_rate,
      B2_mean_retry_invoke: B2.mean_retry_invoke_count,
      B3_mean_retry_invoke: B3.mean_retry_invoke_count,
      matches_scaffold_dup_charge_pattern: matches_scaffold_dup_charge,
    },
    fidelity_notes: [
      "Message seal via real Agent.sealDanglingToolCalls @ c863cc6 (both B2 and B3 restore seal dangling tool_call).",
      "Scaffold LLM confirmatory (E-22) reports B2 seal_unknown_rate=0 because scaffold B2 path does not always count trajectory seal the same way; adapter B2 seal_unknown_rate=1 is faithful to production restore seal.",
      "Dup/charge pattern vs scaffold: B2 dup=1 charge=2; B3 dup=0 charge=1 — expected match when matches_scaffold_dup_charge_pattern=true.",
      "Still dual-stack: EffectJournal/I5 + mocks = lab; no full ACP session/load; no Provider.complete/runLoop; crash = in-process CrashSignal.",
      "Do not mix harness_id eval-harness@scaffold rows with neko-core@…+eval-adapter@… without a separation line.",
    ],
    cells,
  };
}

async function runMatrix(n: number, concurrency: number) {
  mkdirSync(evidenceRoot, { recursive: true });
  const jobs: Array<{ baseline: Baseline; seed: number }> = [];
  for (const baseline of ["B2", "B3"] as const) {
    for (let seed = 1; seed <= n; seed++) {
      jobs.push({ baseline, seed });
    }
  }
  const cells: CellRow[] = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      const job = jobs[idx];
      const row = await runOne(job.baseline, job.seed);
      cells.push(row);
      if (cells.length % 5 === 0 || cells.length === jobs.length) {
        const partial = aggregate(cells, n);
        writeFileSync(summaryPath(n), JSON.stringify(partial, null, 2));
      }
    }
  }
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  cells.sort((a, b) => {
    if (a.baseline !== b.baseline) return a.baseline < b.baseline ? -1 : 1;
    return a.seed - b.seed;
  });
  const summary = aggregate(cells, n);
  const outPath = summaryPath(n);
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.error(`Wrote summary → ${outPath}`);
  return summary;
}

async function main() {
  const { n, concurrency } = parseArgs(process.argv.slice(2));
  console.error(
    `=== confirmatory neko-seal F01 × M-pay × {B2,B3} × N=${n} (scripted, concurrency=${concurrency}) pin=${NEKO_CORE_COMMIT_SHORT} ===`,
  );
  const s = await runMatrix(n, concurrency);
  console.log(
    JSON.stringify(
      {
        ok: true,
        summary_path: summaryPath(n),
        headline: s.headline,
        B2_errors: s.B2.errors,
        B3_errors: s.B3.errors,
        B2_n: s.B2.n,
        B3_n: s.B3.n,
        harness_ids: [...new Set([...s.B2.harness_ids, ...s.B3.harness_ids])],
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
