# Positioning vs Durable Engines (Angle A)
**Lit cutoff:** 2026-09-18 · Status: draft for No  
**Purpose:** Clarify what Angle A is *not* replacing, and where neko-core + B3 fits relative to Temporal, Restate, and LangGraph checkpointers.

---

## Comparison

| System | Durability model | Side-effect discipline | Local-first fit | Ops cost | Guarantees claimed (as documented / as we read them) | Fit to Angle A |
|---|---|---|---|---|---|---|
| **Temporal** (Agent Harness / workflows) \cite{temporal2026agentharness} | Outer harness: durable Workflow history + worker fleet; activities as the unit of external work | Policy seam before tool exec; durable event/history stream; replay from workflow journal | Weak for laptop ADE without Temporal ops | High: cluster/workers, operational ownership | Durable execution of workflows; history-backed resume; not “LLM never re-synthesizes args” | **Non-goal baseline.** Cite for outer durability; we do not replace Temporal |
| **Restate** (vendor docs) | Durable handlers / journaled invocations; virtual objects & workflows as product primitives | Built-in journaling and retries around handler boundaries (product model) | Moderate if self-hosted; still a dedicated runtime | Medium–high: Restate service + app integration | Durable invocation / exactly-once *handler* semantics per vendor docs — not our ternary `unknown` + artifact-bound \(\kappa\) | **Non-goal baseline.** Useful foil for journaled RPC; not the paper artifact |
| **LangGraph checkpointer** (vendor docs) | Superstep / graph state checkpoints; interrupt & time-travel over graph memory | Docs-oriented resume of graph state; side-effect safety on resume is app-dependent (re-exec risk if tools are not idempotent) | Strong for embedded Python/JS agents | Low–medium: library + store backend | Checkpoint/resume of graph state — **not** proof of which mutating tool already succeeded | Maps to **B1** (and B2 if app adds idempotency keys). Motivation for why checkpoint ≠ effect exactly-once |
| **neko-core + B3 (ours)** | Local session durability + explicit **effect journal** \(J\) separate from chat \(\sigma\) | Ternary effects: `proposed → executing → {confirmed, rejected, unknown→reconciling}`; **I2/I3** refuse blind replay; **I5** consume artifact-bound authority | Strong: ADE / coding-agent local-first | Low for research stack; no Temporal fleet required | Claim under evaluation: fewer duplicate external effects vs B0–B2 under crash injection (RQ1); authority consume vs resurrection (RQ2) | **Paper contribution.** Formal I1–I5 + measured B3; builds on existing neko seals |

**Reading the table.** Temporal and Restate own *engine-grade* durable execution. LangGraph checkpointers own *graph/session* resume. Angle A owns *tool-boundary effect semantics* when the foundation model may emit a new \((t,a')\) after restore—the case ACRFence calls semantic re-synthesis / Action Replay, and where classic idempotency keys (B2) fail if the harness issues a new identifier \cite{acrfence2026,beyondtokens2026}. Zylos’s synthesis that checkpoint ≠ durable execution aligns with our vocabulary split between conversation memory and effect journal \cite{zylos2026durable}.

## Short prose (positioning)

We position Angle A as a **local-first harness semantics** paper, not a workflow-engine paper. Temporal’s Agent Harness demonstrates an outer durable history and a policy seam before tools \cite{temporal2026agentharness}; that is the right architecture when operators already run Temporal. Restate (vendor docs) similarly journals handler invocations for durable application logic. Neither product is our artifact: master’s scope excludes multi-day timers, cross-service orchestration, and claiming to replace those engines.

LangGraph-style checkpointers (vendor docs) are the closest *baseline class* for B1: they persist graph or conversation state so work can resume, but persistence of \(\sigma\) does not imply a receipt that mutating tool \(e\) already committed. Adding hash-based idempotency keys yields B2, which helps only when the *same* key is reused—semantic re-synthesis after restore is exactly when that assumption breaks.

Our stack (neko-core + wiii ADE as deployment context) already practices pre-effect checkpoints and unknown seals for interrupted mutations. B3 lifts those practices into an explicit effect state machine with reconcile-before-replay and authority consumption (**I1–I5**), then measures duplicate external effects under intentional kill points. Temporal/Restate remain **cited non-goals**; LangGraph checkpointer behavior remains a **B1/B2 foil**; Zylos remains the systems note that sharpens “session memory ≠ effect journal” \cite{zylos2026durable}.

## Non-goals (explicit)

1. **Do not replace Temporal** (or Restate): no claim of multi-region exactly-once, worker fleets, or long-running workflow product parity \cite{temporal2026agentharness}.
2. **MCP support ≠ novelty:** MCP is wire/background; our claim is effect/authority semantics under crash/restore, not protocol invention.
3. **Not a new agent framework survey:** Li/Guo-style taxonomies are framing only; empirics are crash-injection duplicate rates.
4. **Not procedural-memory SOTA:** AWM-style workflows are discussion contrast, not the control journal.
5. **Not Phase-1 SWE-bench SOTA:** mock mutating tools first (payment, notify, filesystem, deploy flag); broaden later if protocol holds.
6. **Not claiming LangGraph/Restate “broken”:** vendor docs solve different layers; we measure a narrower gap those docs do not specialize in.

## Cite hygiene

- Use `\cite{temporal2026agentharness}` and `\cite{zylos2026durable}` for durable-execution positioning.
- Use `\cite{acrfence2026}` / `\cite{beyondtokens2026}` when explaining why B1/B2 fail under re-synthesis / resurrection.
- Describe **LangGraph** and **Restate** as **vendor documentation baselines** — no invented BibTeX keys.

---

*Positioning draft · 2026-09-18 ICT · for Darren Angle A · LIT*
