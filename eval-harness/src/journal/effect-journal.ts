/**
 * Effect journal for B3 (I1–I5).
 * States: proposed | executing | confirmed | rejected | unknown | reconciling
 * Authority consumed only on confirm; reconcile-by-inspect.
 */

import type { EffectState } from "../types.ts";
import { simpleHash } from "../mocks/store.ts";

export interface AuthorityRecord {
  token: string;
  /** hash(t, a_canonical, artifact) */
  artifact_hash: string;
  effect_id: string;
  state: "issued" | "spent" | "invalid";
}

export interface EffectRecord {
  effect_id: string;
  tool: string;
  args_canonical: string;
  artifact_hash: string;
  state: EffectState;
  authority_token?: string;
  receipt?: Record<string, unknown>;
  sealed_unknown_text?: string;
  created_at_ms: number;
  updated_at_ms: number;
}

export class EffectJournal {
  effects = new Map<string, EffectRecord>();
  authorities = new Map<string, AuthorityRecord>();
  resurrectionAttempts = 0;

  issueAuthority(effect_id: string, tool: string, argsCanonical: string, artifact: string): string {
    const artifact_hash = simpleHash(`${tool}|${argsCanonical}|${artifact}`);
    const token = `κ-${effect_id}-${artifact_hash.slice(0, 6)}`;
    this.authorities.set(token, {
      token,
      artifact_hash,
      effect_id,
      state: "issued",
    });
    return token;
  }

  propose(effect_id: string, tool: string, argsCanonical: string, artifact: string, token?: string): EffectRecord {
    const artifact_hash = simpleHash(`${tool}|${argsCanonical}|${artifact}`);
    const rec: EffectRecord = {
      effect_id,
      tool,
      args_canonical: argsCanonical,
      artifact_hash,
      state: "proposed",
      authority_token: token,
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    };
    this.effects.set(effect_id, rec);
    return rec;
  }

  beginExec(effect_id: string): EffectRecord {
    const rec = this.require(effect_id);
    if (rec.state !== "proposed") {
      throw new Error(`I1/beginExec: expected proposed, got ${rec.state}`);
    }
    rec.state = "executing";
    rec.updated_at_ms = Date.now();
    return rec;
  }

  /**
   * Confirm + consume authority (I5). Rejects spent-token reuse.
   */
  confirm(effect_id: string, receipt: Record<string, unknown>, presentingToken?: string): EffectRecord {
    const rec = this.require(effect_id);
    if (presentingToken) {
      this.consumeAuthority(presentingToken, rec);
    } else if (rec.authority_token) {
      this.consumeAuthority(rec.authority_token, rec);
    }
    rec.state = "confirmed";
    rec.receipt = receipt;
    rec.updated_at_ms = Date.now();
    return rec;
  }

  reject(effect_id: string, reason: string): EffectRecord {
    const rec = this.require(effect_id);
    rec.state = "rejected";
    rec.receipt = { reason };
    rec.updated_at_ms = Date.now();
    return rec;
  }

  /** I2: seal unknown — never label as success. */
  sealUnknown(effect_id: string): EffectRecord {
    const rec = this.require(effect_id);
    rec.state = "unknown";
    rec.sealed_unknown_text =
      "outcome unknown; Inspect actual state before any retry. Do not repeat an action whose outcome is unknown.";
    rec.updated_at_ms = Date.now();
    return rec;
  }

  /** Enter reconciling subphase (I3). */
  beginReconcile(effect_id: string): EffectRecord {
    const rec = this.require(effect_id);
    if (rec.state !== "unknown" && rec.state !== "reconciling") {
      throw new Error(`reconcile: expected unknown, got ${rec.state}`);
    }
    rec.state = "reconciling";
    rec.updated_at_ms = Date.now();
    return rec;
  }

  /**
   * Finish reconcile: confirm if world shows committed, else reject (safe absent).
   * Never unknown → executing with same κ (I3).
   */
  finishReconcile(effect_id: string, worldShowsCommitted: boolean, receipt?: Record<string, unknown>): EffectRecord {
    const rec = this.require(effect_id);
    if (rec.state !== "reconciling") {
      throw new Error(`finishReconcile: expected reconciling, got ${rec.state}`);
    }
    if (worldShowsCommitted) {
      return this.confirm(effect_id, receipt ?? { reconciled: true });
    }
    return this.reject(effect_id, "reconcile: world absent; safe reject (no auto-execute)");
  }

  /**
   * Attempt to use authority for execute. Tracks resurrection attempts.
   */
  assertAuthorityUsable(token: string, expectedEffectId: string, expectedArtifactHash: string): boolean {
    const auth = this.authorities.get(token);
    if (!auth) return false;
    if (auth.state === "spent") {
      this.resurrectionAttempts += 1;
      return false;
    }
    if (auth.effect_id !== expectedEffectId) return false;
    if (auth.artifact_hash !== expectedArtifactHash) return false;
    return auth.state === "issued";
  }

  private consumeAuthority(token: string, rec: EffectRecord) {
    const auth = this.authorities.get(token);
    if (!auth) return;
    if (auth.state === "spent") {
      this.resurrectionAttempts += 1;
      throw new Error(`I5: authority resurrection blocked for ${token}`);
    }
    if (auth.artifact_hash !== rec.artifact_hash) {
      throw new Error(`I5: artifact hash mismatch for ${token}`);
    }
    auth.state = "spent";
  }

  private require(effect_id: string): EffectRecord {
    const rec = this.effects.get(effect_id);
    if (!rec) throw new Error(`unknown effect_id ${effect_id}`);
    return rec;
  }

  get(effect_id: string): EffectRecord | undefined {
    return this.effects.get(effect_id);
  }

  /** Persistable session slice for B1–B3. */
  snapshot(): {
    effects: EffectRecord[];
    authorities: AuthorityRecord[];
    resurrectionAttempts: number;
  } {
    return {
      effects: [...this.effects.values()],
      authorities: [...this.authorities.values()],
      resurrectionAttempts: this.resurrectionAttempts,
    };
  }

  restore(snap: {
    effects: EffectRecord[];
    authorities: AuthorityRecord[];
    resurrectionAttempts: number;
  }) {
    this.effects.clear();
    this.authorities.clear();
    for (const e of snap.effects) this.effects.set(e.effect_id, { ...e });
    for (const a of snap.authorities) this.authorities.set(a.token, { ...a });
    this.resurrectionAttempts = snap.resurrectionAttempts;
  }
}

export function canonicalArgs(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}
