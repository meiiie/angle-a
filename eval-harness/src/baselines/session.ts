/** Minimal session durability for B1–B3 (in-memory + optional JSON file). */

import type { EffectJournal } from "../journal/effect-journal.ts";
import type { ToolResult } from "../types.ts";

export interface SessionTurn {
  effect_id: string;
  tool_call_pending: boolean;
  result_durable: boolean;
  approved: boolean;
  result?: ToolResult;
  /** Synthetic seal text if unknown. */
  seal_text?: string;
}

export interface SessionState {
  turn: SessionTurn | null;
  journal_snap: ReturnType<EffectJournal["snapshot"]> | null;
  idempotency_key?: string;
  authority_token?: string;
  crash_committed?: boolean;
  crash_partial?: boolean;
}

export function emptySession(): SessionState {
  return {
    turn: null,
    journal_snap: null,
  };
}

export class SessionStore {
  private state: SessionState = emptySession();

  save(s: SessionState) {
    this.state = structuredClone(s);
  }

  load(): SessionState {
    return structuredClone(this.state);
  }

  clear() {
    this.state = emptySession();
  }
}
