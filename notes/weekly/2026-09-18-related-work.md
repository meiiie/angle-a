# Related-work notes (Angle A) — 2026-09-18 ICT

**Claim spine:** Under crash/restore at tool boundaries, an `unknown_outcome` + authority-consumption harness reduces duplicate external effects vs checkpoint-only / checkpoint+idempotency-key baselines (fixed model).  
**Cutoff lit:** 2026-09-18 · Sources: `FOUNDATION-PAPERS.md`, `paper-angle-a/outline-and-related-work.md`, arXiv abs + official blogs fetched this day.  
**VN gloss:** “unknown_outcome” = trạng thái hiệu ứng chưa xác nhận; “authority consume” = quyền/approval dùng một lần gắn artifact.

---

## Map: Owns / Leaves open / How we cite

| Work | Owns | Leaves open | How we cite |
|---|---|---|---|
| **Anthropic** *Effective harnesses…* (2025-11) | Cross-session progress files, git clean-state, initializer handoff across context windows | Tool-boundary exactly-once when the model *re-synthesizes* args after restore | Motivation: long-horizon harness reliability is harness-bound, not only model-bound |
| **Li et al.** *Agent Harness Engineering* / ETCLOVG (2026) | Taxonomy E–G; harness as independent production layer; ecosystem map | Formal ternary effect + authority invariants at crash points | Framing vocabulary (Lifecycle / Governance layers) |
| **Guo et al.** arXiv:2606.20683 | Model–harness lens; six runtime responsibilities (observation…verification) | Crash/restore *effect* semantics and measured duplicate rates | Broader framing; cite when arguing bottleneck may sit in harness, not only foundation model |
| **Temporal Agent Harness** (2026-08) | Outer harness: durable Workflow history, policy seam before tool exec, AgentEvent stream | Local-first coding agents without Temporal ops / worker fleet | **Baseline / non-goal:** we do not replace Temporal; we study lighter journal semantics for ADE/local agents |
| **Zylos** durable agent runtimes (2026-04-24) | Checkpoint ≠ durable execution; journal + idempotent wrappers + crash-at-worst-moment tests | Empirics on an explicit `unknown` ternary state coupled to authority consume | Systems synthesis; sharpens RQ wording (session memory ≠ effect journal) |
| **ACRFence** arXiv:2603.20625 | Names **Action Replay** / **Authority Resurrection**; shows restore can re-synthesize tool requests | Full harness model integrating unknown reconciliation + measured baselines B0–B3 | **Threat model names**; map our fault catalog to their attack classes |
| **Beyond Single-Use Tokens** arXiv:2608.01710 | Durable authorization state (CapLease / Issue–Prepare–Commit); identifier-local tokens insufficient | Coupling consume ledger to `unknown→reconciling` effect machine | Authority-consume design + RQ2 (bind approval to artifact hash) |
| **AC4A** arXiv:2603.20933 | Fine-grained permissions over API/browser resources | Coupling permission trees to crash-recovery journals | Governance related work; not our primary claim |
| **AWM** Wang et al. ICML 2025 (PMLR 267) | Procedural *workflow memory* for web agents | Confusion with control/durability workflows | Discussion: procedural workflows ≠ effect journal / durable control |
| **Harness-Bench / AgencyBench / HAL** | Eval: report model–harness pairs; scaffold effects; holistic logs | Narrow crash-injection protocol with duplicate-effect metric | Methodology spirit: always report model ID + harness config; keep our fault suite separate |

*(LangGraph persistence / MCP security surveys stay background-only per outline — not expanded here.)*

---

## Angle A tie-in (tight)

Checkpoint baselines (B1) preserve conversation or graph state but do **not** prove which mutating tool already succeeded; after restore the model may emit a *new* request that servers treat as fresh (ACRFence). Idempotency keys (B2) help when the *same* key is reused, but fail when the harness re-issues under a new identifier or resurrects spent approval (Beyond Single-Use Tokens). Our stance: keep a ternary effect state (`proposed → executing → {confirmed, rejected, unknown→reconciling}`), refuse blind replay from `unknown` without reconcile, and **consume** authority bound to an artifact hash when the effect is confirmed. That is the measurable delta vs B0–B2 under intentional kill points (success-before-receipt; approval-before-execute; mid-mutation timeout).

Industry blogs (Anthropic, Temporal, Zylos) establish that production reliability is already discussed as harness infrastructure; they do not publish our crash-injection comparison on a local-first ADE stack. Surveys (Li; Guo et al.) give vocabulary; they leave the unknown/authority formalization and duplicate-effect tables to systems papers like ours.

---

## Gaps we fill

1. **Published ternary effect + authority-consume invariants** at tool boundaries (not only checkpoint/resume docs).
2. **Threat-mapped fault catalog** (Action Replay / Authority Resurrection) with explicit injection points on neko-core/wiii.
3. **Measured duplicate-effect reduction** vs B0 none / B1 checkpoint / B2 + idempotency key under fixed model(s).
4. **Local-first positioning** vs Temporal outer harness as non-goal baseline (durable history without claiming to replace Workflow engines).
5. **Eval hygiene:** report model–harness pair (Harness-Bench spirit) while using a crash protocol those benches do not specialize in.

## Open bib / lit TODOs

- Screenshot **Scopus Sources + Clarivate JCR** for JSS before any CV “Q” claim (`VENUE-VERIFY-JSS-2026-09-18.md`).
- Confirm ACRFence CoDAIM workshop proceedings page beyond arXiv `journal_ref`.
- Optional: LangGraph durable-execution doc quotes for B1/B2 baseline subsection (Tier 3 — out of M2 scope).
- Track AgencyBench ACL 2026 camera-ready if DOI appears after cutoff.
- If Li et al. gains a stable arXiv/DOI, sync `li2026harnesssurvey` beyond OpenReview PDF URL.


---

## Cite against formal-model I1–I5

**Source model:** `outline/formal-model.md` (§4 Invariants I1–I5; §7 Threat alignment). I6 (provider semantic commit) left out of this crosswalk.

- **ACRFence** (arXiv:2603.20625) → threat names map directly:
  - **Action Replay** → I2 (unknown ≠ success), I3 (no blind replay from unknown), eval B3 reconcile
  - **Authority Resurrection** → **I5** (authority consumption / no revive of spent \(\kappa\))
  - Semantic re-synthesis of args after restore → I3 fork + fresh \(\kappa'\); shows why B2 idempotency alone fails
- **Beyond Single-Use Tokens** (arXiv:2608.01710) → **I5** / RQ2: durable auth state + consume-on-confirm; CapLease / Issue–Prepare–Commit as design foil for artifact-bound \(\kappa\); leaves open coupling to `unknown→reconciling` (our I2–I3)
- **Harness surveys** — framing vs our invariants (they do **not** define I1–I5):
  - **Li / ETCLOVG** → Lifecycle/Governance vocabulary for *where* durability & authority live in the stack; cite as taxonomy, then specialize to I1 (pre-effect durability) + I4 (authority ∩ narrow-only) + I5
  - **Guo et al.** arXiv:2606.20683 → model–harness lens / runtime responsibilities; cite for “bottleneck may be harness,” then narrow to effect-journal claims I1–I3 + measured duplicates (B0–B3)

*No GAP:* I1–I5 are defined in formal-model.md; this note only links cites → invariants.

---

*~950 words · LIT weekly · for Darren master’s Angle A · do not paste abstracts.*
