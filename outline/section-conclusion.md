# Conclusion
**Angle A** · Target: ~150–220 words · Status: draft for No · Lit cutoff: 2026-09-18
**Finish line:** Q2 (JSS P0) — NOT Phase-1 arXiv alone.

---

Tool-calling agents fail under crash and restore when checkpoints remember dialogue but not which mutations already landed. Re-synthesized tool calls then replay effects or resurrect spent approval—the Action Replay and Authority Resurrection threats named by ACRFence \cite{acrfence2026}. This paper argues for a local-first remedy at the tool boundary: separate transport from effect, keep a ternary journal with an explicit `unknown` state and reconcile-before-replay, and consume artifact-bound authority at confirmation (invariants I1–I5), realized as baseline B3 on neko-core / wiii with model weights held fixed.

We contributed (i) the formal effect machine and authority rules, (ii) a mapping onto an open local harness, and (iii) a locked crash-injection protocol against B0–B2 on mock mutating tools, with mandatory model–harness reporting. A **scripted pilot (N=10)** and **confirmatory LLM cells** (glm-5.3, N=30 on F01/F02/F03×M-pay and F01×M-fs×{B2,B3}; E-20260918-22/27/28/23) both support RQ1 under re-synthesis (B3≻B2, including M-fs `writes_len`) and RQ2 on F03. F02 shows the safety/completeness tradeoff. Limits remain honest: scaffold (not yet production-path) empirics, single model, mock tools, no CI intervals yet, and headline cells only. We explicitly do not replace Temporal-class durable engines \cite{temporal2026agentharness}, treat MCP as novelty, or claim SWE-bench SOTA. An arXiv Phase-1 upload is an *optional intermediate* for claim staking. The finish line is **Q2 (JSS P0)**: closing the P0 gaps—faithful neko-core eval path, CI/Wilson reporting, contribution figures, one further external-validity axis, and public artifact plus co-author consent/GVHD—*before* journal submit. We do not claim those gaps are closed in this draft.

---

*Synced to arxiv-pack/latex/main.tex Q2-honesty pass · 2026-09-18 ICT*
