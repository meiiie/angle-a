/**
 * Map neko seal + mock counters → CellMetrics (same shape as scaffold runner).
 */

import type { CellMetrics } from "../../types.ts";
import type { SealResult } from "./seal-bridge.ts";

export function metricsFromNekoCell(opts: {
  counterPre: number;
  counterPost: number;
  seal: SealResult;
  retryInvokeCount: number;
  authorityResurrectionCount?: number;
  reApproval?: boolean;
  recoveryLatencyMs?: number | null;
  falseSuccess?: boolean;
}): CellMetrics {
  // F01 M-pay scripted: post≥2 with a retry invoke ⇒ duplicate side effect.
  const duplicate_effect =
    opts.retryInvokeCount > 0 && opts.counterPost > 1;

  return {
    duplicate_effect,
    duplicate_effect_rate: duplicate_effect ? 1 : 0,
    false_success: !!opts.falseSuccess,
    false_success_rate: opts.falseSuccess ? 1 : 0,
    recovery_latency_ms: opts.recoveryLatencyMs ?? 0,
    re_approval: !!opts.reApproval,
    re_approval_rate: opts.reApproval ? 1 : 0,
    authority_resurrection_count: opts.authorityResurrectionCount ?? 0,
    retry_invoke_count: opts.retryInvokeCount,
    seal_unknown_emitted:
      opts.seal.sealed_unknown_outcome && opts.seal.seal_text_matches_neko_core,
  };
}
