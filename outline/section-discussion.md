# Discussion
**Angle A** · Status: draft for No · Lit cutoff: 2026-09-18  
**Finish line:** Q2 (JSS P0) — NOT Phase-1 arXiv alone.  
**Note:** Pilot N=10 scripted + confirmatory LLM N=30 (F01/F02/F03×M-pay + F01×M-fs ×{B2,B3}) reported in Results; Q2 P0 gaps named below.

---

## Limits of the present draft

This paper’s contribution is **semantic, methodological, and empirical at pilot + confirmatory scale**. Invariants I1–I5, the B0–B3 contrast, and a locked crash/restore protocol on mock tools are fixed. A scripted pilot (N=10) and confirmatory LLM cells (glm-5.3, N=30 on F01/F02/F03×M-pay and F01×M-fs×{B2,B3}) both support RQ1 under re-synthesis (B3≻B2 on duplicates, including M-fs `writes_len`) and RQ2 on F03 (B3 blocks Authority Resurrection). F02 is a safety/completeness tradeoff, not a universal B3 completeness win. Honest limits remain: **single model**, **B2/B3 only** on confirmatory cells, **F01–F03 plus F01 M-fs**, and **mock tools**. Claiming broader superiority beyond these cells would overreach.

The implementation mapping is incomplete by design. neko-core already provides pre-effect durability and unknown seals; single-consume, artifact-hash-bound authority (I5 / RQ2) remains a **research extension** measured in the B3 scaffold. Mock tools bound external risk but also ecological validity.

## Q2 journal bar (honest gap list)

Locked finish line = **Q2 systems/SE journal quality** (JSS P0). arXiv Phase-1 = optional intermediate only. P0 gaps still open (see `handbook/Q2-GAP-LIST.md`):

1. **P0-1 (a) Scaffold ≠ production path** — empirics on `eval-harness@scaffold`, not live neko-core `sealDanglingToolCalls` / `durableCheckpoint` / session store. Reviewers will ask whether B3 is the real restore path.
2. **P0-2 (d) External validity thin** — have M-pay+M-fs; need M-mail OR 2nd model OR neko-core-faithful path; single `glm-5.3`.
3. **P0-3 (c) No CI/Wilson/bootstrap** — rates 0/1 at N=30 without intervals.
4. **P0-4 (b) Missing figures** — effect FSM + threat diagrams not integrated yet.
5. **P0-5 (g)+(h) Public artifact + consent/GVHD** — no tagged public release with pinned commits; co-author consent pending.

P1: RW depth Restate/LangGraph. P2: Elsevier/elsarticle later — **do not switch template yet**.

## Local-first harness vs Temporal-class engines

Durable workflow engines remain the right outer substrate when operators already run fleets \cite{temporal2026agentharness}. Angle A’s non-goal: lighter journal semantics for **local-first** stacks (neko-core / wiii), not a Temporal/Restate replacement. We claim fewer duplicate *mock-observable* mutations under a published fault catalog \cite{acrfence2026} — not distributed exactly-once.

## Procedural memory is not control durability

AWM-style procedural memory \cite{awm2025} is complementary; a stored procedure does not certify whether a charge already posted. Keep conversation state, effect journals, and procedural workflows distinct.

## Threats to validity

**Internal.** Crash injectors must fire at stated boundaries. Scaffold-vs-production remains an internal threat until P0-1 lands. Authority metrics require durable “spent” across resume.

**External.** Single-model GLM; mock-only; M-mail not in confirmatory CLI matrix (P0-2). Transfer to other models/non-mock tools unproven.

**Construct / statistical.** Primary RQ1 construct = `duplicate_effect_rate`; no Wilson/bootstrap intervals yet (P0-3). F04–F10 still thin. Mock-only ethics bound ecological validity by design.

**Honest next steps (Q2 path).** Close P0s before journal submit: faithful path, CI, figures, external-validity axis, public artifact+consent. arXiv optional intermediate only. Do not invent unrun cells.

---

*Synced to arxiv-pack/latex/main.tex Q2-honesty pass · 2026-09-18 ICT*
