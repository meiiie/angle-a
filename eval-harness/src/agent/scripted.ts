/**
 * Scripted "agent" — always issues the mock tool once per attempt.
 * No real LLM required for scaffold dry cells.
 *
 * With resynthesize=true on retry: slightly mutates idempotency-relevant
 * fields (amount / path suffix / subject / flag) while keeping the same
 * logical intent — ACRFence semantic re-synthesis (Action Replay class).
 */

import type { MockId, ToolCallArgs } from "../types.ts";
import { defaultPayload } from "../mocks/tools.ts";

export function scriptedToolCall(
  mockId: MockId,
  effectId: string,
  opts: {
    idempotency_key?: string;
    authority_token?: string;
    artifact?: string;
    payload?: Record<string, unknown>;
  } = {},
): ToolCallArgs {
  return {
    effect_id: effectId,
    idempotency_key: opts.idempotency_key,
    authority_token: opts.authority_token,
    payload: opts.payload ?? defaultPayload(mockId),
    artifact: opts.artifact ?? `artifact:${mockId}:${effectId}`,
  };
}

/**
 * ACRFence-style semantic re-synthesis: same logical intent, mutated
 * idempotency-relevant args so classic key reuse no longer holds.
 */
export function resynthesizePayload(
  mockId: MockId,
  base: Record<string, unknown>,
  attempt: number,
  seed = 0,
): Record<string, unknown> {
  const out = { ...base };
  const tag = `r${attempt}-s${seed}`;
  switch (mockId) {
    case "M-pay": {
      const amount = Number(out.amount ?? 42);
      // Slight amount nudge (+attempt) — new charge fingerprint / new key space
      out.amount = amount + attempt;
      break;
    }
    case "M-fs": {
      const path = String(out.path ?? "/tmp/wiii-eval.txt");
      out.path = `${path}.${tag}`;
      break;
    }
    case "M-mail": {
      const subject = String(out.subject ?? "wiii-eval");
      out.subject = `${subject}-${tag}`;
      break;
    }
    case "M-flag": {
      const value = String(out.value ?? "canary-on");
      out.value = `${value}-${tag}`;
      break;
    }
  }
  return out;
}

/** New idempotency key for a re-synthesized tool_call (LLM typically does not reuse). */
export function resynthesizeIdemKey(
  mockId: MockId,
  effectId: string,
  attempt: number,
): string {
  return `idem:${mockId}:${effectId}:resynth-${attempt}`;
}

export function toolName(mockId: MockId): string {
  switch (mockId) {
    case "M-pay":
      return "mock_payment_charge";
    case "M-mail":
      return "mock_email_notify";
    case "M-fs":
      return "mock_fs_write";
    case "M-flag":
      return "mock_deploy_flag";
  }
}
