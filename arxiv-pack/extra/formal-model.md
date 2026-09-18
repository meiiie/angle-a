# Formal Model — Tool-Boundary Effect Semantics (Angle A)
**Paper section draft · §3**  
**Grounded in:** `neko-core` @ `/workspace/research/repos/neko-core` (shallow clone 2026-09-18)  
**Evidence:** E-20260918-05  
**Status:** v0.1 — ready for LIT cross-cite + EVAL fault mapping

---

## 1. Motivation (1 paragraph)

LLM agents re-synthesize tool arguments after restore. Session/graph checkpoints therefore do **not** imply exactly-once external effects (ACRFence: Action Replay, Authority Resurrection). Neko Core already (a) checkpoints **before** tool execution, (b) seals interrupted in-flight calls as unknown, and (c) intersects authority sources without expanding host policy. This note formalizes those practices as a small effect state machine suitable for RQ1 evaluation.

---

## 2. Objects

| Symbol | Meaning |
|---|---|
| \(M\) | Fixed foundation model (weights/config pinned for ablation) |
| \(H\) | Harness (neko-core runtime + host gates) |
| \(t\) | Tool name / MCP tool id |
| \(a\) | Tool arguments (possibly re-synthesized after restore) |
| \(e\) | Effect record id (stable across restore) |
| \(r\) | Durable receipt / observation (tool result text or structured receipt) |
| \(\kappa\) | Authority token / approval bound to artifact hash |
| \(\sigma\) | Session checkpoint (messages, tool ids, mode, profile, continuation) |

**Distinction (invariant of vocabulary):**
- **Conversation / session memory** ⊂ \(\sigma\) — what was said.
- **Effect journal** \(J\) — which external mutations are confirmed / rejected / unknown.
- **Procedural workflows** (AWM-style `workflows.ts`) — reusable how-to text, **not** control-flow durability.

---

## 3. Effect state machine

Each irreversible (or potentially irreversible) tool admission creates an effect \(e\):

```
                 admit(t,a,κ)
                      │
                      ▼
                 ┌─────────┐
         ┌───────│ proposed │
         │       └────┬────┘
         │            │ begin_exec (checkpoint σ pre-effect)
         │            ▼
         │       ┌──────────┐
         │       │ executing│────── crash / abort / timeout ──┐
         │       └────┬─────┘                                 │
         │            │                                       ▼
         │   success  │  deny/fail                 ┌──────────────────┐
         │            │                            │     unknown      │
         │            ▼                            │  (reconciling)   │
         │       ┌──────────┐                      └────────┬─────────┘
         │       │confirmed │◄──── reconcile: observe world ─┤
         │       └──────────┘      receipt matches intent    │
         │            ▲                                      │
         │            │                         no match / unsafe
         │       ┌──────────┐                                ▼
         └──────►│ rejected │◄─────────── escalate / re-approve
                 └──────────┘
```

### States
- **proposed** — model requested \(t(a)\); authority \(\kappa\) not yet consumed.
- **executing** — pre-effect checkpoint written; side effect may be in flight.
- **confirmed** — durable receipt \(r\) proves effect completed; \(\kappa\) **consumed**.
- **rejected** — denied by gate/user/policy or failed closed before external commit; \(\kappa\) not usable for a different artifact.
- **unknown** — pre-effect durable intent exists, no durable receipt (neko: seal dangling tool_call / `unknown_outcome`).
- **reconciling** — subphase of unknown: inspect real world state before any new mutation.

---

## 4. Invariants (paper claims)

**I1 — Pre-effect durability.**  
Before invoking a mutating tool body, \(H\) persists enough of \(\sigma\) that a crash yields a recoverable in-flight record.  
*Code:* `agent.ts` finalizeInflight + `durableCheckpoint()` before `executeAdmittedTool`; HARNESS § Durable sessions.

**I2 — Unknown ≠ success.**  
An interrupted mutation is never labeled success; sealed content instructs inspect-before-retry.  
*Code:* `sealDanglingToolCalls()` synthetic tool result; stop text “do not repeat an action whose outcome is unknown”; HARNESS: “interrupted mutation is not automatically replayable”.

**I3 — No blind replay from unknown.**  
Transition `unknown → executing` with a **new** effect id \(e'\) is forbidden until reconcile completes. Allowed: `unknown → confirmed` (world shows done), `unknown → rejected` (world shows absent + safe), or `unknown → proposed` only with **fresh** \(\kappa'\) bound to possibly new args hash (fork), never resurrecting spent \(\kappa\).

**I4 — Authority intersection (narrow-only).**  
Effective permission = ∩ { tool class, mode, turn lease, launch authority }. Intersection may narrow, never expand host policy.  
*Code:* HARNESS § Tool and authority contract.

**I5 — Authority consumption (RQ2).**  
\(\kappa\) is bound to `hash(t, a_canonical, artifact)`; confirmation consumes \(\kappa\). Restore must not revive a consumed \(\kappa\) for a re-synthesized \(a'\) (Authority Resurrection).  
*Gap vs current neko:* approvals/modes exist; **explicit single-consume tokens + artifact binding** are the research extension to measure.

**I6 — Semantic commit for providers.**  
Before visible output / ready tool call, transport retry may be safe; after committed semantic event, continue from checkpoint rather than blind HTTP replay.  
*Code:* HARNESS § Provider integrity.

---

## 5. Mapping to neko-core (as-is vs contribution)

| Formal piece | Already in neko-core | Contribution for paper |
|---|---|---|
| Pre-effect checkpoint | Yes (`durableCheckpoint` before tool) | Measure under crash injection |
| Unknown seal | Yes (dangling tool_call text; Computer `unknown_outcome`) | Lift to first-class journal state \(e\) |
| Non-auto-replay | Yes (docs + stop policy) | Enforce in eval harness B3 |
| Authority ∩ | Yes (modes, leases, profiles) | Add consume-on-confirm + artifact hash |
| Effect journal \(J\) separate from chat | Partial (trajectory embeds results) | Explicit receipt store for mocks |
| Reconcile probes | Advised in text (“inspect actual state”) | Automated reconcileor for mock tools |
| Procedural workflows | `workflows.ts` AWM-style | Related-work contrast only |

---

## 6. Baselines for RQ1 (eval interface)

| ID | Behavior |
|---|---|
| **B0** | No durability; crash loses all; retry = new call |
| **B1** | Session checkpoint only; on restore, re-run tool_calls (chat-level) |
| **B2** | B1 + idempotency key on `hash(t,a)` (classic RPC; fails when LLM changes \(a\)) |
| **B3 (ours)** | I1–I5: pre-effect record, unknown seal, reconcile, authority consume |

**Primary metric:** duplicate external effects per injected fault (lower better).  
**Secondary:** false-success rate, recovery latency, human re-approval rate.

---

## 7. Threat alignment (ACRFence)

| Attack class | Machine reading | Mitigated by |
|---|---|---|
| Action Replay | `unknown/executing` → new side effect without reconcile | I2, I3, B3 reconcile |
| Authority Resurrection | consumed \(\kappa\) reused after restore for \(a'\) | I5 |
| Semantic re-synthesis | \(a' \neq a\) but treated as retry | I3 fork + new \(\kappa'\); B2 alone insufficient |

---

## 8. Non-goals (keep scope master’s-sized)

- Not a Temporal/Restate replacement (no multi-day timers / cross-service workflow engine).
- Not claiming MCP protocol novelty.
- Not long-horizon SWE-bench SOTA in Phase 1 (mock mutating tools first).

---

## 9. Next artifacts

1. EVAL: map each fault in `fault-catalog.md` to a forbidden transition of this machine.  
2. LIT: cite ACRFence / Beyond Single-Use Tokens / HARNESS against I1–I5.  
3. Lead: after E-04 protocols reviewed → greenlight mock crash runs.

---

*v0.1 · 2026-09-18 ICT · No (Wiii Lab lead)*

---

## Appendix A — Code audit delta (E-20260918-08) · v0.2 notes

Read-only audit of `/workspace/research/repos/neko-core` (+ wiii ADE notes), 2026-09-18.

### Confirmed in code (strengthens I1–I3, I6)
- Pre-effect persist on managed tool chain; MCP failures return `"outcome unknown; not retried"`.
- ACP can mark `interruptedMutation` + `activeToolCallIds`; Computer host enum includes `unknown_outcome`.
- Provider `recovery`: `replay | continue | none` (pre-semantic vs post-commit).
- Wiii rule text matches: record mutation before execution; unconfirmed interrupted → `unknown_outcome`; no auto-replay.
- Wiii recovery phases documented: `accepted → dispatched → side_effect_started → committed → completed|failed|unknown_outcome`.

### Gaps to close in B3 implementation (not already shipped as one machine)
1. **No first-class effect id \(e\)** spanning proposed→confirmed across tools — trajectory embeds results as messages.
2. **`unknown_outcome` is convention** (strings + some host enums), not one shared enum in neko-core core loop.
3. **rejected vs failed vs unknown** often conflated in tool *text* returns.
4. **reconciling** is policy text (“inspect before retry”), not an enforced runtime phase in neko-core (Wiii has richer process lifecycle).
5. **workflows.ts / completion-contract receipts** are procedural memory / validator evidence — orthogonal to effect durability.
6. **Eager safe tools** may skip the managed pre-exec durability path (still abort-aware).

### Implication for RQ1
B3 is partly *instrumentation + enforcement* on top of existing seals: introduce explicit effect journal for mock mutating tools, map seals→`unknown`, automate reconcile probes, add authority consume (I5) which is the clearest net-new mechanism vs stock neko.
