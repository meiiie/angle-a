#!/usr/bin/env bun
/**
 * Optional N=1 smoke: F01×M-pay×B0 and F01×M-pay×B3 → evidence/runs/
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCell } from "../harness/runner.ts";

const cells = [
  { baseline: "B0" as const, fault: "F01" as const, mock: "M-pay" as const, evidenceId: "E-20260918-smoke-F01-Mpay-B0" },
  { baseline: "B3" as const, fault: "F01" as const, mock: "M-pay" as const, evidenceId: "E-20260918-smoke-F01-Mpay-B3" },
];

const evidenceRoot = join(import.meta.dir, "../../../evidence/runs");
const summary: unknown[] = [];

async function main() {
for (const c of cells) {
  const result = await runCell({
    ...c,
    seed: 1,
    dry: false,
    writeEvidence: true,
  });
  const root = join(evidenceRoot, result.meta.evidence_id);
  mkdirSync(join(root, "crash-markers"), { recursive: true });
  writeFileSync(join(root, "meta.json"), JSON.stringify(result.meta, null, 2));
  writeFileSync(join(root, "counters-pre.json"), JSON.stringify(result.meta.mock_counters_pre, null, 2));
  writeFileSync(join(root, "counters-post.json"), JSON.stringify(result.meta.mock_counters_post, null, 2));
  writeFileSync(
    join(root, "stdout.log"),
    JSON.stringify({ metrics: result.metricsJson, outcome: result.meta.harness_declared_outcome }, null, 2) + "\n",
  );
  if (result.meta.crash_marker) {
    writeFileSync(
      join(root, "crash-markers", `${result.meta.fault_id}-${result.meta.run_id}.json`),
      JSON.stringify(result.meta.crash_marker, null, 2),
    );
  }
  summary.push({
    evidence_id: result.meta.evidence_id,
    path: root,
    baseline: result.meta.baseline_id,
    metrics: result.metricsJson,
    outcome: result.meta.harness_declared_outcome,
    charge_count: (result.meta.mock_counters_post as { charge_count?: number }).charge_count,
  });
  console.error(`smoke OK ${c.baseline} → ${root}`);
}

console.log(JSON.stringify({ smoke: "F01×M-pay×{B0,B3}", n: 1, cells: summary }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
