/**
 * z.ai GLM LLM agent driver (OpenAI-compatible chat completions).
 * Used for confirmatory Action Replay / semantic re-synthesis after crash.
 *
 * Auth: Bearer process.env.ZAI_API_KEY (never logged).
 * Prefer coding plan base URL, then standard paas/v4.
 */

import type { MockId } from "../types.ts";
import { defaultPayload } from "../mocks/tools.ts";
import { toolName } from "./scripted.ts";

export const ZAI_BASE_URLS = [
  "https://api.z.ai/api/coding/paas/v4",
  "https://api.z.ai/api/paas/v4",
] as const;

export type ReasoningEffort = "low" | "high" | "max";

export interface LlmUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /** Present when API reports reasoning/thinking tokens. */
  reasoning_tokens?: number;
}

export interface LlmResynthResult {
  payload: Record<string, unknown>;
  /** New idempotency key when model supplies one (typical for Action Replay). */
  idempotency_key?: string;
  raw_content: string;
  usage: LlmUsage;
  base_url_used: string;
  model: string;
  reasoning_effort: ReasoningEffort;
}

export class MissingZaiApiKeyError extends Error {
  constructor() {
    super(
      "ZAI_API_KEY missing: set process.env.ZAI_API_KEY before --driver llm " +
        "(e.g. `set -a && source /workspace/research/wiii-lab/.secrets.env && set +a`). " +
        "Key is never printed by the harness.",
    );
    this.name = "MissingZaiApiKeyError";
  }
}

export function requireZaiApiKey(): string {
  const key = process.env.ZAI_API_KEY;
  if (!key || !String(key).trim()) {
    throw new MissingZaiApiKeyError();
  }
  return String(key).trim();
}

function emptyUsage(): LlmUsage {
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
}

function extractUsage(body: Record<string, unknown>): LlmUsage {
  const u = (body.usage ?? {}) as Record<string, unknown>;
  const details = (u.completion_tokens_details ?? {}) as Record<string, unknown>;
  const prompt = Number(u.prompt_tokens ?? 0) || 0;
  const completion = Number(u.completion_tokens ?? 0) || 0;
  const total = Number(u.total_tokens ?? prompt + completion) || prompt + completion;
  const reasoning =
    Number(details.reasoning_tokens ?? u.reasoning_tokens ?? NaN) || undefined;
  const out: LlmUsage = {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: total,
  };
  if (reasoning !== undefined) out.reasoning_tokens = reasoning;
  return out;
}

function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m ? m[1].trim() : t;
}

function parseResynthJson(
  content: string,
  mockId: MockId,
  base: Record<string, unknown>,
): { payload: Record<string, unknown>; idempotency_key?: string } {
  const cleaned = stripFence(content);
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Try to salvage first {...} block
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error(`LLM resynth: response is not JSON: ${cleaned.slice(0, 200)}`);
    }
    obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  }

  const payloadRaw =
    (obj.payload as Record<string, unknown> | undefined) ??
    (obj.args as Record<string, unknown> | undefined) ??
    obj;
  const payload: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(payloadRaw)) {
    if (k === "idempotency_key" || k === "effect_id" || k === "authority_token") continue;
    if (k === "payload" || k === "args") continue;
    payload[k] = v;
  }
  // Ensure mock-required keys exist
  for (const [k, v] of Object.entries(defaultPayload(mockId))) {
    if (payload[k] === undefined) payload[k] = v;
  }

  const idem =
    (typeof obj.idempotency_key === "string" && obj.idempotency_key) ||
    (typeof payloadRaw.idempotency_key === "string" &&
      (payloadRaw.idempotency_key as string)) ||
    undefined;

  return { payload, idempotency_key: idem };
}

function buildPrompt(opts: {
  mockId: MockId;
  effectId: string;
  attempt: number;
  seed: number;
  priorPayload: Record<string, unknown>;
  priorIdem?: string;
  crashPhase: string;
}): string {
  const tool = toolName(opts.mockId);
  return [
    "You are an LLM agent retrying a tool call after a process crash (Action Replay / ACRFence semantic re-synthesis).",
    "Same logical user intent. You MAY slightly change idempotency-relevant fields (amount, path, subject, flag value)",
    "and you SHOULD mint a fresh idempotency_key (do not reuse the prior key).",
    "Respond with ONLY a JSON object, no prose:",
    '{"payload":{...tool args...},"idempotency_key":"idem:..." }',
    "",
    `tool: ${tool}`,
    `mock_id: ${opts.mockId}`,
    `effect_id: ${opts.effectId}`,
    `attempt: ${opts.attempt}`,
    `seed: ${opts.seed}`,
    `crash_phase: ${opts.crashPhase}`,
    `prior_payload: ${JSON.stringify(opts.priorPayload)}`,
    `prior_idempotency_key: ${opts.priorIdem ?? "none"}`,
  ].join("\n");
}

async function postChat(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; json: Record<string, unknown>; text: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, json, text };
}

/**
 * Call z.ai GLM to re-synthesize tool args after crash.
 * Tries coding plan base URL first, then standard paas/v4.
 */
export async function llmResynthesizeToolArgs(opts: {
  mockId: MockId;
  effectId: string;
  attempt: number;
  seed?: number;
  priorPayload?: Record<string, unknown>;
  priorIdem?: string;
  crashPhase?: string;
  model?: string;
  reasoningEffort?: ReasoningEffort;
}): Promise<LlmResynthResult> {
  const apiKey = requireZaiApiKey();
  const model = opts.model ?? "glm-5.3";
  const reasoning_effort: ReasoningEffort = opts.reasoningEffort ?? "low";
  const priorPayload = opts.priorPayload ?? defaultPayload(opts.mockId);
  const seed = opts.seed ?? 0;

  const messages = [
    {
      role: "system",
      content:
        "You emit only compact JSON for tool re-issuance after crash. No markdown unless wrapping JSON.",
    },
    {
      role: "user",
      content: buildPrompt({
        mockId: opts.mockId,
        effectId: opts.effectId,
        attempt: opts.attempt,
        seed,
        priorPayload,
        priorIdem: opts.priorIdem,
        crashPhase: opts.crashPhase ?? "after_success_before_receipt",
      }),
    },
  ];

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.4,
    max_tokens: 512,
    thinking: { type: "enabled" },
    reasoning_effort,
  };

  let lastErr = "";
  for (const base of ZAI_BASE_URLS) {
    const res = await postChat(base, apiKey, requestBody);
    if (!res.ok) {
      lastErr = `${base} → HTTP ${res.status}: ${res.text.slice(0, 300)}`;
      // Auth / hard errors: do not bother with fallback that will fail the same way
      if (res.status === 401 || res.status === 403) {
        throw new Error(`z.ai auth failed (${res.status}). Check ZAI_API_KEY. Details redacted.`);
      }
      continue;
    }
    const choices = res.json.choices as Array<Record<string, unknown>> | undefined;
    const msg = (choices?.[0]?.message ?? {}) as Record<string, unknown>;
    const content = String(msg.content ?? "").trim();
    if (!content) {
      lastErr = `${base} → empty content`;
      continue;
    }
    const parsed = parseResynthJson(content, opts.mockId, priorPayload);
    return {
      payload: parsed.payload,
      idempotency_key:
        parsed.idempotency_key ??
        `idem:${opts.mockId}:${opts.effectId}:llm-resynth-${opts.attempt}`,
      raw_content: content,
      usage: extractUsage(res.json),
      base_url_used: base,
      model,
      reasoning_effort,
    };
  }

  throw new Error(`z.ai LLM resynth failed on all base URLs. Last: ${lastErr}`);
}

/** Cheap token estimate helper for planning N cells (not a billing quote). */
export function estimateTokensForN(
  perCellUsage: LlmUsage,
  n: number,
): { n: number; est_total_tokens: number; est_prompt: number; est_completion: number } {
  return {
    n,
    est_total_tokens: perCellUsage.total_tokens * n,
    est_prompt: perCellUsage.prompt_tokens * n,
    est_completion: perCellUsage.completion_tokens * n,
  };
}
