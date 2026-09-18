#!/usr/bin/env bun
/**
 * N=1 smoke: F01×M-pay×{B2,B3} via neko-core-faithful adapter → evidence/runs/
 * Scripted only — no paper confirmatory claim.
 */
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import {
  runNekoSealCrashRestoreCell,
  writeNekoEvidence,
} from "../adapters/neko-core/crash-restore-cell.ts";

const evidenceRoot = join(import.meta.dir, "../../../evidence/runs");
const cells = [
  { baseline: "B2" as const, evidenceId: "E-20260918-neko-seal-F01-Mpay-B2" },
  { baseline: "B3" as const, evidenceId: "E-20260918-neko-seal-F01-Mpay-B3" },
];

const summary: unknown[] = [];

async function main() {
  for (const c of cells) {
    const result = await runNekoSealCrashRestoreCell({
      baseline: c.baseline,
      seed: 1,
      evidenceId: c.evidenceId,
    });
    const root = writeNekoEvidence(result, evidenceRoot);
    const charge = (result.meta.mock_counters_post as { charge_count?: number })
      .charge_count;
    const row = {
      evidence_id: result.meta.evidence_id,
      path: root,
      harness_id: result.meta.harness_id,
      baseline: result.meta.baseline_id,
      metrics: result.metricsJson,
      outcome: result.meta.harness_declared_outcome,
      charge_count: charge,
      seal_text_matches_neko_core: result.seal.seal_text_matches_neko_core,
      seal_text: result.seal.seal_text,
      policy: result.trajectory.policy,
    };
    summary.push(row);
    console.error(
      `neko-seal smoke OK ${c.baseline} charge=${charge} dup=${result.metricsJson.duplicate_effect} seal=${result.metricsJson.seal_unknown_emitted} → ${root}`,
    );

    // Hard asserts for scripted smoke (fail loud)
    if (!result.seal.seal_text_matches_neko_core) {
      throw new Error(`${c.baseline}: seal text not from neko-core`);
    }
    if (c.baseline === "B2") {
      if (charge !== 2 || !result.metricsJson.duplicate_effect) {
        throw new Error(`B2 expected dup charge=2, got charge=${charge}`);
      }
      if (result.metricsJson.retry_invoke_count < 1) {
        throw new Error("B2 expected blind replay invoke");
      }
    }
    if (c.baseline === "B3") {
      if (charge !== 1 || result.metricsJson.duplicate_effect) {
        throw new Error(`B3 expected no-dup charge=1, got charge=${charge}`);
      }
      if (result.metricsJson.retry_invoke_count !== 0) {
        throw new Error("B3 must not blind re-invoke");
      }
      if (!result.metricsJson.seal_unknown_emitted) {
        throw new Error("B3 expected seal_unknown_emitted");
      }
    }
  }

  const summaryPath = join(
    evidenceRoot,
    "E-20260918-neko-seal-F01-Mpay-smoke-summary.json",
  );
  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        smoke: "neko-core-faithful F01×M-pay×{B2,B3}",
        n: 1,
        driver: "scripted",
        cells: summary,
        non_claim:
          "N=1 adapter smoke only — not confirmatory; do not copy rates into paper tables without harness_id separation",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify({ smoke: "neko-seal", n: 1, cells: summary, summaryPath }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
