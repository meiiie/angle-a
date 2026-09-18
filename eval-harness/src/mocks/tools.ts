/**
 * Mock mutating tools: payment, email, fs write, deploy flag.
 * Counters + optional idempotency_key + authority_token (gate checked by harness).
 */

import type { MockId, ToolCallArgs, ToolResult } from "../types.ts";
import {
  type MockWorld,
  simpleHash,
} from "./store.ts";

export type CrashPhase =
  | "none"
  | "after_success_before_receipt" // F01
  | "mid_mutation" // F02
  | "after_approval_before_execute"; // F03

export interface CrashHook {
  fault_id: string;
  phase: CrashPhase;
  /** Throw CrashSignal when this phase fires. */
  armed: boolean;
  fired: boolean;
}

export class CrashSignal extends Error {
  constructor(
    public readonly phase: CrashPhase,
    public readonly fault_id: string,
    public readonly committed: boolean,
    public readonly partial: boolean = false,
  ) {
    super(`CRASH:${fault_id}@${phase}`);
    this.name = "CrashSignal";
  }
}

export interface MockToolRegistry {
  world: MockWorld;
  crash: CrashHook;
  /** Whether mocks honor idempotency keys (B2/B3). */
  honorIdempotency: boolean;
}

export function createRegistry(
  world: MockWorld,
  opts: { honorIdempotency?: boolean } = {},
): MockToolRegistry {
  return {
    world,
    crash: { fault_id: "", phase: "none", armed: false, fired: false },
    honorIdempotency: opts.honorIdempotency ?? false,
  };
}

export function armCrash(reg: MockToolRegistry, fault_id: string, phase: CrashPhase) {
  reg.crash = { fault_id, phase, armed: true, fired: false };
}

function maybeCrash(reg: MockToolRegistry, phase: CrashPhase, committed: boolean, partial = false) {
  if (reg.crash.armed && !reg.crash.fired && reg.crash.phase === phase) {
    reg.crash.fired = true;
    throw new CrashSignal(phase, reg.crash.fault_id, committed, partial);
  }
}

function checkIdem(reg: MockToolRegistry, key: string | undefined, fingerprint: string): ToolResult | null {
  if (!key || !reg.honorIdempotency) return null;
  const prev = reg.world.idempotency_index.get(key);
  if (prev !== undefined) {
    return {
      ok: true,
      effect_id: fingerprint,
      message: `idempotent replay (key=${key})`,
      committed: false, // no new side effect
      receipt: { idempotent: true, prior: prev },
    };
  }
  return null;
}

function recordIdem(reg: MockToolRegistry, key: string | undefined, fingerprint: string) {
  if (key && reg.honorIdempotency) {
    reg.world.idempotency_index.set(key, fingerprint);
  }
}

export function mock_payment_charge(reg: MockToolRegistry, args: ToolCallArgs): ToolResult {
  const amount = Number(args.payload.amount ?? 1);
  const fp = `pay:${args.effect_id}:${amount}`;

  const idem = checkIdem(reg, args.idempotency_key, fp);
  if (idem) return idem;

  // Mid-mutation: crash before commit
  maybeCrash(reg, "mid_mutation", false, true);

  // Commit charge
  reg.world.charges.push({
    effect_id: args.effect_id,
    amount,
    idempotency_key: args.idempotency_key,
    at_ms: Date.now(),
  });
  reg.world.charge_count += 1;
  recordIdem(reg, args.idempotency_key, fp);

  const result: ToolResult = {
    ok: true,
    effect_id: args.effect_id,
    message: `charged ${amount}`,
    committed: true,
    receipt: { charge_count: reg.world.charge_count, amount },
  };

  maybeCrash(reg, "after_success_before_receipt", true);
  return result;
}

export function mock_email_notify(reg: MockToolRegistry, args: ToolCallArgs): ToolResult {
  const to = String(args.payload.to ?? "user@example.com");
  const subject = String(args.payload.subject ?? "notify");
  const fp = `mail:${args.effect_id}:${to}:${subject}`;

  const idem = checkIdem(reg, args.idempotency_key, fp);
  if (idem) return idem;

  maybeCrash(reg, "mid_mutation", false, true);

  reg.world.emails_sent += 1;
  reg.world.email_log.push({
    effect_id: args.effect_id,
    to,
    subject,
    idempotency_key: args.idempotency_key,
  });
  recordIdem(reg, args.idempotency_key, fp);

  const result: ToolResult = {
    ok: true,
    effect_id: args.effect_id,
    message: `email sent to ${to}`,
    committed: true,
    receipt: { emails_sent: reg.world.emails_sent },
  };
  maybeCrash(reg, "after_success_before_receipt", true);
  return result;
}

export function mock_fs_write(reg: MockToolRegistry, args: ToolCallArgs): ToolResult {
  const path = String(args.payload.path ?? "/tmp/wiii-mock.txt");
  const bytes = String(args.payload.content ?? "hello");
  const hash = simpleHash(bytes);
  const fp = `fs:${args.effect_id}:${path}:${hash}`;

  const idem = checkIdem(reg, args.idempotency_key, fp);
  if (idem) return idem;

  maybeCrash(reg, "mid_mutation", false, true);

  reg.world.files.set(path, bytes);
  reg.world.writes.push({
    effect_id: args.effect_id,
    path,
    bytes,
    content_hash: hash,
    idempotency_key: args.idempotency_key,
    at_ms: Date.now(),
  });
  recordIdem(reg, args.idempotency_key, fp);

  const result: ToolResult = {
    ok: true,
    effect_id: args.effect_id,
    message: `wrote ${path} hash=${hash}`,
    committed: true,
    receipt: { path, content_hash: hash, writes: reg.world.writes.length },
  };
  maybeCrash(reg, "after_success_before_receipt", true);
  return result;
}

export function mock_deploy_flag(reg: MockToolRegistry, args: ToolCallArgs): ToolResult {
  const value = String(args.payload.value ?? "on");
  const fp = `flag:${args.effect_id}:${value}`;

  const idem = checkIdem(reg, args.idempotency_key, fp);
  if (idem) return idem;

  maybeCrash(reg, "mid_mutation", false, true);

  reg.world.flag_value = value;
  reg.world.flag_set_count += 1;
  recordIdem(reg, args.idempotency_key, fp);

  const result: ToolResult = {
    ok: true,
    effect_id: args.effect_id,
    message: `flag set to ${value}`,
    committed: true,
    receipt: { flag_value: value, flag_set_count: reg.world.flag_set_count },
  };
  maybeCrash(reg, "after_success_before_receipt", true);
  return result;
}

export function invokeMock(
  reg: MockToolRegistry,
  mockId: MockId,
  args: ToolCallArgs,
): ToolResult {
  switch (mockId) {
    case "M-pay":
      return mock_payment_charge(reg, args);
    case "M-mail":
      return mock_email_notify(reg, args);
    case "M-fs":
      return mock_fs_write(reg, args);
    case "M-flag":
      return mock_deploy_flag(reg, args);
  }
}

/** Inspect world for reconcile-by-inspect (B3). */
export function inspectMock(
  reg: MockToolRegistry,
  mockId: MockId,
  effect_id: string,
): { found: boolean; counter: number; detail: Record<string, unknown> } {
  switch (mockId) {
    case "M-pay": {
      const hit = reg.world.charges.find((c) => c.effect_id === effect_id);
      return {
        found: !!hit,
        counter: reg.world.charge_count,
        detail: { charge_count: reg.world.charge_count, hit: hit ?? null },
      };
    }
    case "M-mail": {
      const hit = reg.world.email_log.find((e) => e.effect_id === effect_id);
      return {
        found: !!hit,
        counter: reg.world.emails_sent,
        detail: { emails_sent: reg.world.emails_sent, hit: hit ?? null },
      };
    }
    case "M-fs": {
      const hit = reg.world.writes.find((w) => w.effect_id === effect_id);
      return {
        found: !!hit,
        counter: reg.world.writes.length,
        detail: { writes: reg.world.writes.length, hit: hit ?? null },
      };
    }
    case "M-flag": {
      // Flag: match last set if any (effect_id tracked only via count for scaffold)
      const found = reg.world.flag_set_count > 0;
      return {
        found,
        counter: reg.world.flag_set_count,
        detail: { flag_value: reg.world.flag_value, flag_set_count: reg.world.flag_set_count },
      };
    }
  }
}

export function counterFor(mockId: MockId, world: MockWorld): number {
  switch (mockId) {
    case "M-pay":
      return world.charge_count;
    case "M-mail":
      return world.emails_sent;
    case "M-fs":
      return world.writes.length;
    case "M-flag":
      return world.flag_set_count;
  }
}

export function defaultPayload(mockId: MockId): Record<string, unknown> {
  switch (mockId) {
    case "M-pay":
      return { amount: 42, currency: "USD" };
    case "M-mail":
      return { to: "ops@example.com", subject: "wiii-eval" };
    case "M-fs":
      return { path: "/tmp/wiii-eval.txt", content: "scaffold-payload" };
    case "M-flag":
      return { value: "canary-on" };
  }
}
