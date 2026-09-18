# Abstract
**Angle A** · ≤180 words · Status: draft for No · Lit cutoff: 2026-09-18 · Evidence: confirmatory-llm F01/F02/F03 N=30 + M-fs + pilots
**Finish line:** Q2 (JSS P0) — Phase-1 arXiv optional intermediate only.

---

Long-running LLM agents that mutate external state remain vulnerable at tool boundaries: session or graph checkpoints restore conversation, but do not prove which side effects already committed. After crash and restore, models may re-synthesize tool arguments, causing duplicate payments, notifications, or writes—Action Replay and Authority Resurrection (ACRFence). We propose a local-first harness semantics that separates transport from effect, keeps a ternary effect journal with an explicit `unknown` state and reconciliation, and consumes artifact-bound authority at confirmation. We formalize invariants I1–I5, map them onto neko-core, and evaluate baselines B0–B3 on mock mutating tools under a locked crash-injection protocol with fixed weights and mandatory model–harness reporting. In a scripted pilot (N=10) and confirmatory LLM-in-the-loop runs (glm-5.3 via z.ai, N=30 on F01/F02/F03×M-pay×{B2,B3} plus F01×M-fs×{B2,B3}; 240 cells, 61268 tokens, 0 failures), the primary safety headlines remain B3≻B2 on F01 duplicates under re-synthesis (0.0 vs 1.0) and on F03 Authority Resurrection (0.0 vs 1.0). F01×M-fs replicates RQ1 using `writes_len`; F02 exposes a safety/completeness tradeoff rather than a universal B3 completeness win. Caveats: empirics run on an `eval-harness` scaffold rather than the live neko-core production restore path; mock tools, a single model (glm-5.3), and scripted faults. This Phase-1 preprint stakes claims for feedback; it is not yet Q2 journal submit-ready. We do not replace Temporal-style workflow engines or treat MCP support as novelty.

---

*Synced to arxiv-pack/latex/main.tex Q2-honesty pass · 2026-09-18 ICT*
