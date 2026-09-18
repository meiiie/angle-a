/** In-memory mock world state (ground truth for evaluator). */

export interface ChargeRecord {
  effect_id: string;
  amount: number;
  idempotency_key?: string;
  at_ms: number;
}

export interface WriteRecord {
  effect_id: string;
  path: string;
  bytes: string;
  content_hash: string;
  idempotency_key?: string;
  at_ms: number;
}

export interface MockWorld {
  charges: ChargeRecord[];
  charge_count: number;
  emails_sent: number;
  email_log: { effect_id: string; to: string; subject: string; idempotency_key?: string }[];
  writes: WriteRecord[];
  files: Map<string, string>;
  flag_value: string | null;
  flag_set_count: number;
  /** Key → first committed result fingerprint (for B2 idempotency). */
  idempotency_index: Map<string, string>;
}

export function createWorld(): MockWorld {
  return {
    charges: [],
    charge_count: 0,
    emails_sent: 0,
    email_log: [],
    writes: [],
    files: new Map(),
    flag_value: null,
    flag_set_count: 0,
    idempotency_index: new Map(),
  };
}

export function snapshotCounters(w: MockWorld): Record<string, unknown> {
  return {
    charge_count: w.charge_count,
    charges_len: w.charges.length,
    emails_sent: w.emails_sent,
    writes_len: w.writes.length,
    flag_set_count: w.flag_set_count,
    flag_value: w.flag_value,
    files: Object.fromEntries(w.files),
  };
}

export function simpleHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}
