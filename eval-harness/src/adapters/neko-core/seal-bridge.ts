/**
 * ACP-style restore seal: reload messages → sealDanglingToolCalls → detect unknown seal.
 * Prefer the real Agent method (not scaffold journal.sealUnknown alone).
 */

import type { Agent } from "../../../../../repos/neko-core/src/index.ts";
import { NEKO_SEAL_UNKNOWN_TEXT } from "./pin.ts";

export interface SealResult {
  sealed_unknown_outcome: boolean;
  seal_text: string | null;
  messages_after: unknown[];
  /** True when seal text matches neko-core verbatim string @ c863cc6. */
  seal_text_matches_neko_core: boolean;
}

/**
 * Apply production seal after crash restore (mirrors acp.ts ~L725–727).
 */
export function applySealAfterRestore(agent: Agent): SealResult {
  const beforeSeal = JSON.stringify(agent.messages);
  agent.sealDanglingToolCalls();
  const after = agent.messages;
  const sealedUnknownOutcome = JSON.stringify(after) !== beforeSeal;
  const toolMsgs = after.filter((m: any) => m?.role === "tool");
  const sealMsg = toolMsgs.find(
    (m: any) =>
      typeof m.content === "string" &&
      m.content.includes("outcome unknown"),
  );
  const seal_text = sealMsg ? String(sealMsg.content) : null;
  return {
    sealed_unknown_outcome: sealedUnknownOutcome,
    seal_text,
    messages_after: structuredClone(after),
    seal_text_matches_neko_core: seal_text === NEKO_SEAL_UNKNOWN_TEXT,
  };
}

export { NEKO_SEAL_UNKNOWN_TEXT };
