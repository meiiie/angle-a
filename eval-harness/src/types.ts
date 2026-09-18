/** Shared types for Angle A eval harness (scaffold). */

export type BaselineId = "B0" | "B1" | "B2" | "B3";
export type FaultId = "F01" | "F02" | "F03" | "F04" | "F05" | "F06" | "F07" | "F08" | "F09" | "F10";
export type MockId = "M-pay" | "M-mail" | "M-fs" | "M-flag";
export type AgentDriver = "scripted" | "llm";

export type EffectState =
  | "proposed"
  | "executing"
  | "confirmed"
  | "rejected"
  | "unknown"
  | "reconciling";

export type AuthorityState = "absent" | "proposed" | "spent" | "resurrected_attempt";

export type BaselineTag =
  | "none"
  | "session_ckpt"
  | "ckpt_idem"
  | "unknown_auth";

export const BASELINE_TAGS: Record<BaselineId, BaselineTag> = {
  B0: "none",
  B1: "session_ckpt",
  B2: "ckpt_idem",
  B3: "unknown_auth",
};

export interface ToolCallArgs {
  effect_id: string;
  idempotency_key?: string;
  authority_token?: string;
  /** Semantic payload (amount, recipient, path, flag value, …). */
  payload: Record<string, unknown>;
  /** Canonical artifact for RQ2 hash binding (B3). */
  artifact?: string;
}

export interface ToolResult {
  ok: boolean;
  effect_id: string;
  message: string;
  /** True when mock body committed the side effect. */
  committed: boolean;
  /** Partial mutation (F02 mid-body). */
  partial?: boolean;
  receipt?: Record<string, unknown>;
}

export interface CrashMarker {
  fault_id: FaultId;
  mock_id: MockId;
  baseline: BaselineId;
  t_inject_ms: number;
  signal: string;
  gitsha: string;
  phase: string;
}

export interface CellMetrics {
  duplicate_effect: boolean;
  duplicate_effect_rate: number; // 0 or 1 for single run; aggregate later
  false_success: boolean;
  false_success_rate: number;
  recovery_latency_ms: number | null;
  re_approval: boolean;
  re_approval_rate: number;
  authority_resurrection_count: number;
  retry_invoke_count: number;
  seal_unknown_emitted: boolean;
}

export interface RunMeta {
  evidence_id: string;
  run_id: string;
  model_id: string;
  harness_id: string;
  baseline: BaselineTag;
  baseline_id: BaselineId;
  fault_id: FaultId;
  mock_id: MockId;
  seed: number;
  started_at_ict: string;
  crash_marker: CrashMarker | null;
  metrics: CellMetrics;
  mock_counters_pre: Record<string, unknown>;
  mock_counters_post: Record<string, unknown>;
  authority_token_state: AuthorityState;
  harness_declared_outcome: string;
  notes: string;
  /** scripted | llm */
  driver?: AgentDriver;
  /** Aggregated LLM token usage for this cell (driver=llm only). */
  llm_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    reasoning_tokens?: number;
    calls: number;
    base_url_used?: string;
  };
}

export interface CellConfig {
  baseline: BaselineId;
  fault: FaultId;
  mock: MockId;
  seed?: number;
  dry?: boolean;
  evidenceId?: string;
  writeEvidence?: boolean;
  modelId?: string;
  harnessId?: string;
  /**
   * ACRFence semantic re-synthesis on retry after crash:
   * mutate idempotency-relevant args (amount/path/…) and mint a new key.
   * With driver=llm, resynthesis is performed by the LLM (Action Replay).
   */
  resynthesize?: boolean;
  /** Agent driver: scripted (default) or llm (z.ai GLM). */
  driver?: AgentDriver;
  /** LLM model id when driver=llm (default glm-5.3). */
  model?: string;
  /** GLM reasoning_effort for pilot cells (default low). */
  reasoningEffort?: "low" | "high" | "max";
}
