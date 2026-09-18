#!/usr/bin/env bun
/**
 * E2 spike: import Agent from neko-core @ c863cc6; seal dangling tool_call; print sealed message.
 */
import { createEvalAgent } from "../src/adapters/neko-core/agent-shim.ts";
import { applySealAfterRestore, NEKO_SEAL_UNKNOWN_TEXT } from "../src/adapters/neko-core/seal-bridge.ts";
import { NEKO_CORE_COMMIT } from "../src/adapters/neko-core/pin.ts";

const dir = `/tmp/wiii-neko-spike-seal-${Date.now()}`;
const { agent, durableCheckpoint } = createEvalAgent(dir);

agent.messages = [
  { role: "user", content: "charge once" },
  {
    role: "assistant",
    content: "",
    tool_calls: [
      {
        id: "call_pay_spike",
        type: "function",
        function: {
          name: "mock_payment_charge",
          arguments: JSON.stringify({ amount: 42 }),
        },
      },
    ],
  },
];

await durableCheckpoint();
const seal = applySealAfterRestore(agent);

const out = {
  spike: "E2-sealDanglingToolCalls",
  neko_core_commit: NEKO_CORE_COMMIT,
  sealed_unknown_outcome: seal.sealed_unknown_outcome,
  seal_text: seal.seal_text,
  seal_text_matches_neko_core: seal.seal_text_matches_neko_core,
  expected_text: NEKO_SEAL_UNKNOWN_TEXT,
  checkpoint_dir: dir,
  ok:
    seal.sealed_unknown_outcome &&
    seal.seal_text_matches_neko_core,
};

console.log(JSON.stringify(out, null, 2));
if (!out.ok) process.exit(1);
