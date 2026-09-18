/**
 * Commit pins for the neko-core-faithful adapter.
 * Do not invent paper rates from this module — smoke evidence only.
 */

export const NEKO_CORE_COMMIT = "c863cc6a386f8eea048089a7276d619353de94b6";
export const NEKO_CORE_COMMIT_SHORT = "c863cc6";

/** Absolute path to the pinned neko-core checkout on this lab box. */
export const NEKO_CORE_PATH =
  process.env.NEKO_CORE_PATH ??
  "/workspace/research/repos/neko-core";

/**
 * Verbatim seal text from neko-core Agent.sealDanglingToolCalls @ c863cc6
 * (src/core/agent.ts ~L977). Kept for assertions; production seal is the method call.
 */
export const NEKO_SEAL_UNKNOWN_TEXT =
  "[interrupted while this tool call was in flight; outcome unknown. Inspect actual state before any retry.]";

export function harnessIdForAdapter(labSha: string): string {
  const short = labSha.slice(0, 7);
  return `neko-core@${NEKO_CORE_COMMIT_SHORT}+eval-adapter@${short}`;
}
