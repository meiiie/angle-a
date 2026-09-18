/** Map fault ids to crash phases at mock/registry boundaries. */

import type { FaultId } from "../types.ts";
import type { CrashPhase } from "../mocks/tools.ts";

export function crashPhaseFor(fault: FaultId): CrashPhase {
  switch (fault) {
    case "F01":
    case "F10": // F10 is F01 specialized to M-pay
      return "after_success_before_receipt";
    case "F02":
      return "mid_mutation";
    case "F03":
      return "after_approval_before_execute";
    case "F04":
      // F04 is harness-level (post-confirm re-synthesis), not mid-mock.
      // Phase stays "none" at mock boundary; runner drives resume+resynth.
      return "none";
    default:
      // Scaffold: unsupported faults map to none (dry still runs)
      return "none";
  }
}

export function faultDescription(fault: FaultId): string {
  switch (fault) {
    case "F01":
      return "Kill after mock effect success, before durable result receipt";
    case "F02":
      return "Kill mid-mutation (during mock body)";
    case "F03":
      return "Restore after approval, before execute (authority resurrection risk)";
    case "F04":
      return "Restore after execute confirmed; model re-synthesizes same intent (stub hook)";
    case "F10":
      return "Payment double-charge under crash before receipt (F01⊂M-pay)";
    default:
      return `${fault} (scaffold stub — phase not armed)`;
  }
}

/** True when fault is handled by harness post-confirm / resume path (not mock crash arm). */
export function isHarnessResumeFault(fault: FaultId): boolean {
  return fault === "F04";
}
