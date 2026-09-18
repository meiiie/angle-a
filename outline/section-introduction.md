# Introduction
**Angle A** · Lit cutoff: 2026-09-18 · Status: draft for No  
**Aligned with:** `outline/formal-model.md` (I1–I5), `outline/positioning-vs-engines.md` (non-goals), `handbook/RQ-AND-CLAIMS.md`

---

LLM agents that call mutating tools fail under crash and restore for a reason that is easy to miss in chat-centric designs: a session or graph checkpoint can restore *what was said* without proving *which external effects already happened*. After restore, the model may re-synthesize tool arguments. Servers then treat the new request as fresh work, producing duplicate side effects—payments, notifications, filesystem writes, deploy flags—even when the operator believed the run had only “resumed.” ACRFence names the core threats as Action Replay and Authority Resurrection: re-issuing a mutation without a receipt, and reviving spent approval for a re-synthesized request \cite{acrfence2026}. Classic idempotency keys help only when the *same* key is reused; they do not bind when the harness emits a new identifier for a semantically related call \cite{beyondtokens2026}.

Practice and surveys already treat reliability as a *harness* problem. Guidance on long-running agent harnesses stresses cross-session progress and clean handoff across context windows \cite{anthropic2025harnesses}. Harness surveys place Lifecycle and Governance beside Execution, and argue that bottlenecks may sit in the harness as much as in the foundation model \cite{li2026harnesssurvey,guo2026fromqa}. Durable-execution engines go further: Temporal’s Agent Harness offers an outer durable history and a policy seam before tools \cite{temporal2026agentharness}, and systems notes insist that checkpointing conversation state is not durable execution of effects \cite{zylos2026durable}. What remains under-specified for **local-first** agent development environments is a small, measurable semantics at the *tool boundary*: a ternary effect journal that can enter `unknown`, refuse blind replay until reconcile, and **consume** artifact-bound authority on confirm—without claiming to replace workflow fleets.

**Claim.** Under intentional crash/restore at tool boundaries, and with model weights fixed, a harness that (1) separates transport from effect, (2) keeps an `unknown` control state with reconciliation, and (3) consumes authority at effect confirmation reduces duplicate external effects relative to checkpoint-only and checkpoint+idempotency-key baselines on a local-first stack (neko-core / wiii), addressing Action Replay and Authority Resurrection. A scripted pilot (N=10) supports this: under F01×M-pay with argument re-synthesis, B3 achieves duplicate_effect_rate 0.0 vs B2’s 1.0 (E-20260918-17); under F03, B3 uniquely blocks Authority Resurrection that B1/B2 exhibit (E-20260918-16). Confirmatory LLM cells (glm-5.3, N=30, B2 vs B3) reproduce the same headlines: F01 duplicate rates 1.0 vs 0.0 (E-20260918-22) and F03 mean authority resurrection 1.0 vs 0.0 (E-20260918-23).

**Contributions.**
1. **Formal tool-boundary effect model (I1–I5):** pre-effect durability; unknown ≠ success; no blind replay from unknown; authority intersection narrow-only; authority consumption bound to artifact hash—distinguishing chat memory, effect journal, and procedural workflows \cite{awm2025}.
2. **Open realization on neko-core:** lift existing pre-effect checkpoints and unknown seals into an explicit effect journal and B3 baseline, with ADE/wiii as deployment context rather than a second novelty claim.
3. **Crash-injection evaluation protocol:** compare B0–B3 under a fault catalog aligned to ACRFence classes; report model–harness pairs in the spirit of harness-aware eval \cite{harnessbench2026,agencybench2026,hal2025}; primary metric = duplicate external effects per injected fault.

**Non-goals (scope).** We do not replace Temporal or Restate; MCP support is wire, not novelty; we do not claim Phase-1 SWE-bench SOTA (mock mutating tools first). Fine-grained permission trees \cite{ac4a2026} are related governance context, not our primary claim. Venue ambition is a Q2 systems/SE journal track (JSS as primary target); we do not print an unverified Scopus/JCR quartile on a CV from this draft alone. An arXiv Phase-1 upload remains an optional intermediate for claim staking, not the finish line.

**Paper map.** §2 backgrounds harness durability and the threat model. §3 presents the effect state machine and invariants I1–I5. §4 maps the model onto neko-core. §5 details baselines B0–B3, faults, and metrics. §6 reports scripted pilot results (incl. re-synthesis) and confirmatory LLM aggregates (N=30). §7 discusses limits, Q2-bar gaps, and local-first positioning. §8 relates prior work; §9 concludes.

---

*~520 words · LIT draft · cite keys only from `bib/refs.bib`*
