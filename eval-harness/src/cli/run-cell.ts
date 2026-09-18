#!/usr/bin/env bun
/**
 * Run one dry eval cell; print metrics JSON to stdout.
 *
 * Usage:
 *   bun run src/cli/run-cell.ts --baseline B0 --fault F01 --mock M-pay --dry
 *   bun run src/cli/run-cell.ts -b B3 -f F01 -m M-pay --write-evidence
 *   bun run src/cli/run-cell.ts -b B2 -f F01 -m M-pay --resynthesize --write-evidence
 *   bun run src/cli/run-cell.ts -b B2 -f F01 -m M-pay --driver llm --model glm-5.3 --write-evidence
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentDriver, BaselineId, FaultId, MockId } from "../types.ts";
import { runCell } from "../harness/runner.ts";
import { MissingZaiApiKeyError } from "../agent/llm.ts";

function usage() {
  console.error(
    `Usage: run-cell --baseline B0|B1|B2|B3 --fault F01..F10 --mock M-pay|M-mail|M-fs|M-flag [--dry] [--write-evidence] [--seed N] [--evidence-id E-...] [--resynthesize] [--driver scripted|llm] [--model glm-5.3] [--reasoning-effort low|high|max]`,
  );
}

function parseArgs(argv: string[]) {
  const out: {
    baseline?: BaselineId;
    fault?: FaultId;
    mock?: MockId;
    dry: boolean;
    writeEvidence: boolean;
    seed: number;
    evidenceId?: string;
    resynthesize: boolean;
    driver: AgentDriver;
    model?: string;
    reasoningEffort?: "low" | "high" | "max";
  } = {
    dry: false,
    writeEvidence: false,
    seed: 0,
    resynthesize: false,
    driver: "scripted",
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--baseline":
      case "-b":
        out.baseline = next() as BaselineId;
        break;
      case "--fault":
      case "-f":
        out.fault = next() as FaultId;
        break;
      case "--mock":
      case "-m":
        out.mock = next() as MockId;
        break;
      case "--dry":
        out.dry = true;
        break;
      case "--write-evidence":
        out.writeEvidence = true;
        break;
      case "--seed":
        out.seed = Number(next());
        break;
      case "--evidence-id":
        out.evidenceId = next();
        break;
      case "--resynthesize":
      case "--resynth":
        out.resynthesize = true;
        break;
      case "--driver":
        out.driver = next() as AgentDriver;
        break;
      case "--model":
        out.model = next();
        break;
      case "--reasoning-effort":
        out.reasoningEffort = next() as "low" | "high" | "max";
        break;
      case "--help":
      case "-h":
        usage();
        process.exit(0);
      default:
        if (a.startsWith("-")) {
          console.error(`Unknown flag: ${a}`);
          usage();
          process.exit(2);
        }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.baseline || !args.fault || !args.mock) {
    // default dry cell for "one command works"
    args.baseline = args.baseline ?? "B0";
    args.fault = args.fault ?? "F01";
    args.mock = args.mock ?? "M-pay";
    args.dry = true;
  }

  if (args.driver === "llm") {
    if (!process.env.ZAI_API_KEY || !String(process.env.ZAI_API_KEY).trim()) {
      console.error(
        "ERROR: ZAI_API_KEY missing. Cannot run --driver llm.\n" +
          "  Fix: set -a && source /workspace/research/wiii-lab/.secrets.env && set +a\n" +
          "  (harness never prints the key)",
      );
      process.exit(3);
    }
    // LLM driver implies resynthesis after crash (Action Replay cells)
    args.resynthesize = true;
    args.model = args.model ?? "glm-5.3";
    args.reasoningEffort = args.reasoningEffort ?? "low";
  }

  let result;
  try {
    result = await runCell({
      baseline: args.baseline,
      fault: args.fault,
      mock: args.mock,
      seed: args.seed,
      dry: args.dry,
      writeEvidence: args.writeEvidence,
      evidenceId: args.evidenceId,
      resynthesize: args.resynthesize,
      driver: args.driver,
      model: args.model,
      reasoningEffort: args.reasoningEffort,
    });
  } catch (e) {
    if (e instanceof MissingZaiApiKeyError) {
      console.error(`ERROR: ${e.message}`);
      process.exit(3);
    }
    throw e;
  }

  if (args.writeEvidence) {
    const root = join(
      import.meta.dir,
      "../../../evidence/runs",
      result.meta.evidence_id,
    );
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
    console.error(`Wrote evidence → ${root}`);
  }

  // Primary stdout: metrics JSON (and compact meta summary)
  console.log(
    JSON.stringify(
      {
        evidence_id: result.meta.evidence_id,
        run_id: result.meta.run_id,
        baseline: result.meta.baseline,
        baseline_id: result.meta.baseline_id,
        fault_id: result.meta.fault_id,
        mock_id: result.meta.mock_id,
        model_id: result.meta.model_id,
        driver: result.meta.driver,
        harness_id: result.meta.harness_id,
        harness_declared_outcome: result.meta.harness_declared_outcome,
        authority_token_state: result.meta.authority_token_state,
        mock_counters_post: result.meta.mock_counters_post,
        notes: result.meta.notes,
        llm_usage: result.meta.llm_usage ?? null,
        metrics: result.metricsJson,
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
