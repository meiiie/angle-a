#!/usr/bin/env bun
/**
 * LLM smoke: 1× F01×M-pay×B2 and 1× F01×M-pay×B3 via --driver llm (glm-5.3).
 * Requires process.env.ZAI_API_KEY. Writes under evidence/runs/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCell } from "../harness/runner.ts";
import { MissingZaiApiKeyError, estimateTokensForN } from "../agent/llm.ts";

if (!process.env.ZAI_API_KEY || !String(process.env.ZAI_API_KEY).trim()) {
  console.error(
    "ERROR: ZAI_API_KEY missing — skip LLM smoke.\n" +
      "  Fix: set -a && source /workspace/research/wiii-lab/.secrets.env && set +a",
  );
  process.exit(3);
}

const cells = [
  {
    baseline: "B2" as const,
    fault: "F01" as const,
    mock: "M-pay" as const,
    evidenceId: "E-20260918-smoke-llm-F01-Mpay-B2",
  },
  {
    baseline: "B3" as const,
    fault: "F01" as const,
    mock: "M-pay" as const,
    evidenceId: "E-20260918-smoke-llm-F01-Mpay-B3",
  },
];

const evidenceRoot = join(import.meta.dir, "../../../evidence/runs");
const summary: unknown[] = [];
let usageSum = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  reasoning_tokens: 0,
  calls: 0,
};

async function main() {
  for (const c of cells) {
    let result;
    try {
      result = await runCell({
        ...c,
        seed: 1,
        dry: false,
        writeEvidence: true,
        driver: "llm",
        model: "glm-5.3",
        reasoningEffort: "low",
        resynthesize: true,
      });
    } catch (e) {
      if (e instanceof MissingZaiApiKeyError) {
        console.error(`ERROR: ${e.message}`);
        process.exit(3);
      }
      throw e;
    }

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

    const u = result.meta.llm_usage;
    if (u) {
      usageSum.prompt_tokens += u.prompt_tokens;
      usageSum.completion_tokens += u.completion_tokens;
      usageSum.total_tokens += u.total_tokens;
      usageSum.reasoning_tokens += u.reasoning_tokens ?? 0;
      usageSum.calls += u.calls;
    }

    summary.push({
      evidence_id: result.meta.evidence_id,
      path: root,
      baseline: result.meta.baseline_id,
      metrics: result.metricsJson,
      outcome: result.meta.harness_declared_outcome,
      charge_count: (result.meta.mock_counters_post as { charge_count?: number })
        .charge_count,
      llm_usage: u ?? null,
      notes: result.meta.notes,
    });
    console.error(`smoke-llm OK ${c.baseline} → ${root}`);
  }

  const perCellAvg = {
    prompt_tokens: Math.round(usageSum.prompt_tokens / Math.max(cells.length, 1)),
    completion_tokens: Math.round(
      usageSum.completion_tokens / Math.max(cells.length, 1),
    ),
    total_tokens: Math.round(usageSum.total_tokens / Math.max(cells.length, 1)),
  };
  const n30 = estimateTokensForN(perCellAvg, 30);

  console.log(
    JSON.stringify(
      {
        smoke: "llm F01×M-pay×{B2,B3}",
        n: 1,
        model: "glm-5.3",
        reasoning_effort: "low",
        cells: summary,
        token_usage_smoke_total: usageSum,
        token_estimate_N30: n30,
        note:
          "N=30 estimate = mean per-cell total_tokens from this smoke × 30 (B2+B3 cells averaged). Not a billing quote.",
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
