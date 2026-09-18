/**
 * F01–F03 fault placement relative to durableCheckpoint / tool-result append.
 * Lab CrashSignal arms the mock; this module documents the barrier points.
 */

import type { FaultId } from "../../types.ts";
import type { CrashPhase } from "../../mocks/tools.ts";

export type NekoFaultBarrier =
  | "after_durable_checkpoint_before_tool_result_append" // F01
  | "mid_mutation_inside_mock" // F02
  | "after_approval_before_execute"; // F03

export function barrierForFault(fault: FaultId): NekoFaultBarrier | "none" {
  switch (fault) {
    case "F01":
    case "F10":
      return "after_durable_checkpoint_before_tool_result_append";
    case "F02":
      return "mid_mutation_inside_mock";
    case "F03":
      return "after_approval_before_execute";
    default:
      return "none";
  }
}

export function mockPhaseForFault(fault: FaultId): CrashPhase {
  switch (fault) {
    case "F01":
    case "F10":
      return "after_success_before_receipt";
    case "F02":
      return "mid_mutation";
    case "F03":
      return "after_approval_before_execute";
    default:
      return "none";
  }
}
