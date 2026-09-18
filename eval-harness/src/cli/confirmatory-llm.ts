#!/usr/bin/env bun
/**
 * Confirmatory LLM-in-the-loop matrix.
 * Defaults (backward-compat): F01/F03 × M-pay × {B2,B3} × N=30
 * driver=llm (glm-5.3, reasoning_effort=low). Resumes skipped completed seeds
 * (existing meta.json + stdout.log).
 *
 * Usage:
 *   bun run src/cli/confirmatory-llm.ts --fault F01 [--mock M-pay] [--n 30]
 *   bun run src/cli/confirmatory-llm.ts --fault F02 --mock M-pay [--n 30]
 *   bun run src/cli/confirmatory-llm.ts --fault F01 --mock M-fs [--n 30]
 *   bun run src/cli/confirmatory-llm.ts --fault F01 --mock M-mail [--n 30]
 *   bun run src/cli/confirmatory-llm.ts --fault F03 [--n 30]
 *   bun run src/cli/confirmatory-llm.ts --fault both [--n 30]   # F01+F03 × M-pay
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runCell } from "../harness/runner.ts";
import { MissingZaiApiKeyError } from "../agent/llm.ts";

const evidenceRoot = join(import.meta.dir, "../../../evidence/runs");

type ConfFault = "F01" | "F02" | "F03";
type ConfMock = "M-pay" | "M-fs" | "M-mail";
type MockTag = "Mpay" | "Mfs" | "Mmail";
type Baseline = "B2" | "B3";

function mockTag(mock: ConfMock): MockTag {
  if (mock === "M-fs") return "Mfs";
  if (mock === "M-mail") return "Mmail";
  return "Mpay";
}

function effectCountFromPost(
  mock: ConfMock,
  counters: Record<string, unknown>,
): number {
  if (mock === "M-fs") return Number(counters.writes_len ?? 0);
  if (mock === "M-mail") return Number(counters.emails_sent ?? 0);
  return Number(counters.charge_count ?? 0);
}

function summaryPath(fault: string, tag: MockTag, n: number): string {
  return join(evidenceRoot, `confirmatory-llm-${fault}-${tag}-N${n}-summary.json`);
}

function usage(): never {
  console.error(
    `Usage: confirmatory-llm --fault F01|F02|F03|both [--mock M-pay|M-fs|M-mail] [--n 30] [--concurrency 1]
  Defaults: --fault both (F01+F03) --mock M-pay --n 30 --concurrency 1
  Resume: skips cells with existing meta.json + stdout.log under evidence/runs/
  Evidence IDs: E-confirm-llm-\${fault}-\${Mpay|Mfs|Mmail}-\${B2|B3}-sNN
  Summaries: evidence/runs/confirmatory-llm-\${fault}-\${Mpay|Mfs|Mmail}-N\${n}-summary.json`,
  );
  process.exit(2);
}

function parseArgs(argv: string[]) {
  let fault: ConfFault | "both" = "both";
  let mock: ConfMock = "M-pay";
  let n = 30;
  let concurrency = 1;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fault" || a === "-f") {
      const v = argv[++i];
      if (v !== "F01" && v !== "F02" && v !== "F03" && v !== "both") {
        console.error(`Invalid --fault ${v}`);
        usage();
      }
      fault = v;
    } else if (a === "--mock" || a === "-m") {
      const v = argv[++i];
      if (v !== "M-pay" && v !== "M-fs" && v !== "M-mail") {
        console.error(`Invalid --mock ${v} (supported: M-pay|M-fs|M-mail)`);
        usage();
      }
      mock = v;
    } else if (a === "--n") n = Number(argv[++i]);
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
  return { fault, mock, n, concurrency: Math.max(1, concurrency) };
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

function evidenceId(
  fault: string,
  mock: ConfMock,
  baseline: string,
  seed: number,
): string {
  return `E-confirm-llm-${fault}-${mockTag(mock)}-${baseline}-s${seedPad(seed)}`;
}

function writeCellEvidence(
  root: string,
  result: Awaited<ReturnType<typeof runCell>>,
) {
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
        llm_usage: result.meta.llm_usage ?? null,
      },
      null,
      2,
    ) + "\n",
  );
  if (result.meta.crash_marker) {
    writeFileSync(
      join(root, "crash-markers", `${result.meta.fault_id}-${result.meta.run_id}.json`),
      JSON.stringify(result.meta.crash_marker, null, 2),
    );
  }
}

type CellRow = {
  evidence_id: string;
  seed: number;
  baseline: string;
  fault_id: string;
  mock_id: ConfMock;
  duplicate_effect: boolean;
  duplicate_effect_rate: number;
  false_success: boolean;
  seal_unknown_emitted: boolean;
  authority_resurrection_count: number;
  /** Mock-appropriate side-effect counter (M-pay: charge_count, M-fs: writes_len, M-mail: emails_sent). */
  effect_count: number;
  /** M-pay compat alias of charge_count from counters (0 on M-fs/M-mail). */
  charge_count: number;
  writes_len: number;
  emails_sent: number;
  outcome: string;
  notes: string;
  model_id: string;
  llm_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    reasoning_tokens?: number;
    calls: number;
    base_url_used?: string;
  } | null;
  error?: string;
  resumed: boolean;
};

function loadExistingCell(
  eid: string,
  baseline: string,
  fault: string,
  mock: ConfMock,
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
    const effect_count = effectCountFromPost(mock, counters);
    return {
      evidence_id: eid,
      seed,
      baseline,
      fault_id: fault,
      mock_id: mock,
      duplicate_effect: !!stdout.metrics?.duplicate_effect,
      duplicate_effect_rate: Number(stdout.metrics?.duplicate_effect_rate ?? 0),
      false_success: !!stdout.metrics?.false_success,
      seal_unknown_emitted: !!stdout.metrics?.seal_unknown_emitted,
      authority_resurrection_count: Number(
        stdout.metrics?.authority_resurrection_count ?? 0,
      ),
      effect_count,
      charge_count: Number(counters.charge_count ?? 0),
      writes_len: Number(counters.writes_len ?? 0),
      emails_sent: Number(counters.emails_sent ?? 0),
      outcome: String(stdout.outcome ?? meta.harness_declared_outcome ?? ""),
      notes: String(meta.notes ?? ""),
      model_id: String(meta.model_id ?? ""),
      llm_usage: stdout.llm_usage ?? meta.llm_usage ?? null,
      resumed: true,
    };
  } catch {
    return null;
  }
}

async function runOne(
  fault: ConfFault,
  mock: ConfMock,
  baseline: Baseline,
  seed: number,
): Promise<CellRow> {
  const eid = evidenceId(fault, mock, baseline, seed);
  const existing = loadExistingCell(eid, baseline, fault, mock, seed);
  if (existing) {
    console.error(`SKIP ${eid} (resume)`);
    return existing;
  }

  try {
    const result = await runCell({
      baseline,
      fault,
      mock,
      seed,
      dry: false,
      writeEvidence: true,
      evidenceId: eid,
      driver: "llm",
      model: "glm-5.3",
      reasoningEffort: "low",
      resynthesize: true,
    });
    const root = join(evidenceRoot, result.meta.evidence_id);
    writeCellEvidence(root, result);
    const counters = (result.meta.mock_counters_post ?? {}) as Record<
      string,
      unknown
    >;
    const effect_count = effectCountFromPost(mock, counters);
    const row: CellRow = {
      evidence_id: result.meta.evidence_id,
      seed,
      baseline,
      fault_id: fault,
      mock_id: mock,
      duplicate_effect: !!result.metricsJson.duplicate_effect,
      duplicate_effect_rate: Number(result.metricsJson.duplicate_effect_rate ?? 0),
      false_success: !!result.metricsJson.false_success,
      seal_unknown_emitted: !!result.metricsJson.seal_unknown_emitted,
      authority_resurrection_count: Number(
        result.metricsJson.authority_resurrection_count ?? 0,
      ),
      effect_count,
      charge_count: Number(counters.charge_count ?? 0),
      writes_len: Number(counters.writes_len ?? 0),
      emails_sent: Number(counters.emails_sent ?? 0),
      outcome: result.meta.harness_declared_outcome,
      notes: String(result.meta.notes ?? ""),
      model_id: result.meta.model_id,
      llm_usage: result.meta.llm_usage ?? null,
      resumed: false,
    };
    console.error(
      `OK ${eid} dup=${row.duplicate_effect} effect=${row.effect_count} charge=${row.charge_count} writes=${row.writes_len} emails=${row.emails_sent} auth_res=${row.authority_resurrection_count} tok=${row.llm_usage?.total_tokens ?? 0}`,
    );
    return row;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`FAIL ${eid}: ${msg}`);
    return {
      evidence_id: eid,
      seed,
      baseline,
      fault_id: fault,
      mock_id: mock,
      duplicate_effect: false,
      duplicate_effect_rate: 0,
      false_success: false,
      seal_unknown_emitted: false,
      authority_resurrection_count: 0,
      effect_count: 0,
      charge_count: 0,
      writes_len: 0,
      emails_sent: 0,
      outcome: "error",
      notes: "",
      model_id: "llm/glm-5.3@z.ai",
      llm_usage: null,
      error: msg,
      resumed: false,
    };
  }
}

function aggregate(
  fault: string,
  mock: ConfMock,
  cells: CellRow[],
  n: number,
) {
  const tag = mockTag(mock);
  const byB = { B2: [] as CellRow[], B3: [] as CellRow[] };
  for (const c of cells) {
    if (c.baseline === "B2" || c.baseline === "B3") byB[c.baseline].push(c);
  }
  function stats(rows: CellRow[]) {
    const ok = rows.filter((r) => !r.error);
    const nOk = ok.length;
    const mean = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      reasoning_tokens: 0,
      calls: 0,
    };
    for (const r of ok) {
      if (r.llm_usage) {
        usage.prompt_tokens += r.llm_usage.prompt_tokens ?? 0;
        usage.completion_tokens += r.llm_usage.completion_tokens ?? 0;
        usage.total_tokens += r.llm_usage.total_tokens ?? 0;
        usage.reasoning_tokens += r.llm_usage.reasoning_tokens ?? 0;
        usage.calls += r.llm_usage.calls ?? 0;
      }
    }
    const mean_effect_count_post = mean(ok.map((r) => r.effect_count));
    const mean_charge_count_post = mean(ok.map((r) => r.charge_count));
    return {
      n: nOk,
      n_requested: n,
      errors: rows.filter((r) => r.error).length,
      resumed_skips: rows.filter((r) => r.resumed).length,
      duplicate_effect_rate: mean(ok.map((r) => (r.duplicate_effect ? 1 : 0))),
      false_success_rate: mean(ok.map((r) => (r.false_success ? 1 : 0))),
      seal_unknown_rate: mean(ok.map((r) => (r.seal_unknown_emitted ? 1 : 0))),
      mean_authority_resurrection: mean(
        ok.map((r) => r.authority_resurrection_count),
      ),
      mean_effect_count_post,
      // M-pay compat: same field as prior F01/F03 summaries
      mean_charge_count_post,
      mean_writes_len_post: mean(ok.map((r) => r.writes_len)),
      mean_emails_sent_post: mean(ok.map((r) => r.emails_sent)),
      llm_usage_totals: usage,
      llm_usage_mean_total_tokens: nOk ? usage.total_tokens / nOk : 0,
    };
  }
  const B2 = stats(byB.B2);
  const B3 = stats(byB.B3);
  const totalUsage = {
    prompt_tokens: B2.llm_usage_totals.prompt_tokens + B3.llm_usage_totals.prompt_tokens,
    completion_tokens:
      B2.llm_usage_totals.completion_tokens + B3.llm_usage_totals.completion_tokens,
    total_tokens: B2.llm_usage_totals.total_tokens + B3.llm_usage_totals.total_tokens,
    reasoning_tokens:
      B2.llm_usage_totals.reasoning_tokens + B3.llm_usage_totals.reasoning_tokens,
    calls: B2.llm_usage_totals.calls + B3.llm_usage_totals.calls,
  };

  const headlineBase = {
    B2_duplicate_effect_rate: B2.duplicate_effect_rate,
    B3_duplicate_effect_rate: B3.duplicate_effect_rate,
    B2_mean_effect_count: B2.mean_effect_count_post,
    B3_mean_effect_count: B3.mean_effect_count_post,
    B2_mean_charge_count: B2.mean_charge_count_post,
    B3_mean_charge_count: B3.mean_charge_count_post,
    B3_seal_unknown_rate: B3.seal_unknown_rate,
  };

  const headline =
    fault === "F03"
      ? {
          B2_mean_authority_resurrection: B2.mean_authority_resurrection,
          B3_mean_authority_resurrection: B3.mean_authority_resurrection,
          B2_mean_effect_count: B2.mean_effect_count_post,
          B3_mean_effect_count: B3.mean_effect_count_post,
          B2_mean_charge_count: B2.mean_charge_count_post,
          B3_mean_charge_count: B3.mean_charge_count_post,
        }
      : fault === "F02"
        ? {
            ...headlineBase,
            B2_false_success_rate: B2.false_success_rate,
            B3_false_success_rate: B3.false_success_rate,
          }
        : headlineBase;

  return {
    protocol: `confirmatory-llm-${fault}-${tag}-N${n}`,
    fault_id: fault,
    mock_id: mock,
    effect_counter_field:
      mock === "M-fs" ? "writes_len" : mock === "M-mail" ? "emails_sent" : "charge_count",
    driver: "llm",
    model: "glm-5.3",
    reasoning_effort: "low",
    resynthesize: true,
    n_per_baseline: n,
    seeds: `1..${n}`,
    harness_id: "eval-harness@scaffold",
    written_at_ict: ictNow(),
    base_url_prefer: "https://api.z.ai/api/coding/paas/v4",
    B2,
    B3,
    llm_usage_grand_total: totalUsage,
    headline,
    cells,
  };
}

async function runMatrix(
  fault: ConfFault,
  mock: ConfMock,
  n: number,
  concurrency: number,
) {
  const tag = mockTag(mock);
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
      const row = await runOne(fault, mock, job.baseline, job.seed);
      cells.push(row);
      // checkpoint partial summary after each cell
      if (cells.length % 5 === 0 || cells.length === jobs.length) {
        const partial = aggregate(fault, mock, cells, n);
        writeFileSync(summaryPath(fault, tag, n), JSON.stringify(partial, null, 2));
      }
    }
  }
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  // stable order
  cells.sort((a, b) => {
    if (a.baseline !== b.baseline) return a.baseline < b.baseline ? -1 : 1;
    return a.seed - b.seed;
  });
  const summary = aggregate(fault, mock, cells, n);
  const outPath = summaryPath(fault, tag, n);
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.error(`Wrote summary → ${outPath}`);
  return summary;
}

async function main() {
  if (!process.env.ZAI_API_KEY || !String(process.env.ZAI_API_KEY).trim()) {
    console.error(
      "ERROR: ZAI_API_KEY missing.\n" +
        "  Fix: set -a && source /workspace/research/wiii-lab/.secrets.env && set +a",
    );
    process.exit(3);
  }
  const { fault, mock, n, concurrency } = parseArgs(process.argv.slice(2));
  const faults: ConfFault[] =
    fault === "both" ? ["F01", "F03"] : [fault];
  const tag = mockTag(mock);
  const results: unknown[] = [];
  for (const f of faults) {
    console.error(
      `=== confirmatory LLM ${f} × ${mock} × {B2,B3} × N=${n} (concurrency=${concurrency}) ===`,
    );
    const s = await runMatrix(f, mock, n, concurrency);
    results.push({
      fault: f,
      mock,
      summary_path: summaryPath(f, tag, n),
      headline: s.headline,
      llm_usage_grand_total: s.llm_usage_grand_total,
      B2_errors: s.B2.errors,
      B3_errors: s.B3.errors,
    });
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((e) => {
  if (e instanceof MissingZaiApiKeyError) {
    console.error(`ERROR: ${e.message}`);
    process.exit(3);
  }
  console.error(e);
  process.exit(1);
});
