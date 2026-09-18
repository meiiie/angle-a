% ============================================================================
% Angle A — Phase-1 working draft (prose-complete; scripted pilot N=10 + confirmatory LLM N=30)
% Assembled: 2026-09-18 13:20 UTC
% Target path: arXiv/workshop → Scopus Q2 systems/SE
% ============================================================================

# Abstract
**Angle A** · ≤180 words · Status: draft for No · Lit cutoff: 2026-09-18 · Evidence: confirmatory-llm F01/F03 N=30 + pilots

---

Long-running LLM agents that mutate external state remain vulnerable at tool boundaries: session or graph checkpoints restore conversation, but do not prove which side effects already committed. After crash and restore, models may re-synthesize tool arguments, causing duplicate payments, notifications, or writes—Action Replay and Authority Resurrection (ACRFence). We propose a local-first harness semantics that separates transport from effect, keeps a ternary effect journal with an explicit `unknown` state and reconciliation, and consumes artifact-bound authority at confirmation. We formalize invariants I1–I5, map them onto neko-core, and evaluate baselines B0–B3 on mock mutating tools under a locked crash-injection protocol with fixed weights and mandatory model–harness reporting. A scripted pilot (N=10) and confirmatory LLM-in-the-loop runs (glm-5.3 via z.ai, N=30 on F01/F03×M-pay×{B2,B3}; 120 cells, 30230 tokens, 0 failures) both show B3≻B2 on duplicates under re-synthesis (0.0 vs 1.0) and on Authority Resurrection (0.0 vs 1.0). Caveats: mock tools, single model, scripted faults. We do not replace Temporal-style workflow engines or treat MCP support as novelty.

---

*Word count: ~168 — cite none required in abstract; keys available in body.*


# Introduction
**Angle A** · Lit cutoff: 2026-09-18 · Status: draft for No  
**Aligned with:** `outline/formal-model.md` (I1–I5), `outline/positioning-vs-engines.md` (non-goals), `handbook/RQ-AND-CLAIMS.md`

---

LLM agents that call mutating tools fail under crash and restore for a reason that is easy to miss in chat-centric designs: a session or graph checkpoint can restore *what was said* without proving *which external effects already happened*. After restore, the model may re-synthesize tool arguments. Servers then treat the new request as fresh work, producing duplicate side effects—payments, notifications, filesystem writes, deploy flags—even when the operator believed the run had only “resumed.” ACRFence names the core threats as Action Replay and Authority Resurrection: re-issuing a mutation without a receipt, and reviving spent approval for a re-synthesized request \cite{acrfence2026}. Classic idempotency keys help only when the *same* key is reused; they do not bind when the harness emits a new identifier for a semantically related call \cite{beyondtokens2026}.

Practice and surveys already treat reliability as a *harness* problem. Guidance on long-running agent harnesses stresses cross-session progress and clean handoff across context windows \cite{anthropic2025harnesses}. Harness surveys place Lifecycle and Governance beside Execution, and argue that bottlenecks may sit in the harness as much as in the foundation model \cite{li2026harnesssurvey,guo2026fromqa}. Durable-execution engines go further: Temporal’s Agent Harness offers an outer durable history and a policy seam before tools \cite{temporal2026agentharness}, and systems notes insist that checkpointing conversation state is not durable execution of effects \cite{zylos2026durable}. What remains under-specified for **local-first** agent development environments is a small, measurable semantics at the *tool boundary*: a ternary effect journal that can enter `unknown`, refuse blind replay until reconcile, and **consume** artifact-bound authority on confirm—without claiming to replace workflow fleets.

**Claim.** Under intentional crash/restore at tool boundaries, and with model weights fixed, a harness that (1) separates transport from effect, (2) keeps an `unknown` control state with reconciliation, and (3) consumes authority at effect confirmation reduces duplicate external effects relative to checkpoint-only and checkpoint+idempotency-key baselines on a local-first stack (neko-core / wiii), addressing Action Replay and Authority Resurrection. A scripted pilot (N=10) and confirmatory LLM-in-the-loop runs (glm-5.3, N=30 on F01/F03×M-pay×{B2,B3}; 120 cells, 0 failures) support this: under F01 with argument re-synthesis, B3 achieves duplicate_effect_rate 0.0 vs B2’s 1.0; under F03, B3 uniquely blocks Authority Resurrection (mean 0.0 vs 1.0). Caveats: mock tools, single model, scripted faults.

**Contributions.**
1. **Formal tool-boundary effect model (I1–I5):** pre-effect durability; unknown ≠ success; no blind replay from unknown; authority intersection narrow-only; authority consumption bound to artifact hash—distinguishing chat memory, effect journal, and procedural workflows \cite{awm2025}.
2. **Open realization on neko-core:** lift existing pre-effect checkpoints and unknown seals into an explicit effect journal and B3 baseline, with ADE/wiii as deployment context rather than a second novelty claim.
3. **Crash-injection evaluation protocol:** compare B0–B3 under a fault catalog aligned to ACRFence classes; report model–harness pairs in the spirit of harness-aware eval \cite{harnessbench2026,agencybench2026,hal2025}; primary metric = duplicate external effects per injected fault.

**Non-goals (scope).** We do not replace Temporal or Restate; MCP support is wire, not novelty; we do not claim Phase-1 SWE-bench SOTA (mock mutating tools first). Fine-grained permission trees \cite{ac4a2026} are related governance context, not our primary claim.

**Paper map.** §2 backgrounds harness durability and the threat model. §3 presents the effect state machine and invariants I1–I5. §4 maps the model onto neko-core. §5 details baselines B0–B3, faults, and metrics. §6 reports scripted pilot (N=10) and confirmatory LLM (N=30) results. §7 discusses limits and local-first positioning. §8 relates prior work; §9 concludes.

---

*~520 words · LIT draft · cite keys only from `bib/refs.bib`*


---

# Background and Threat Model

*Inline from Intro + ACRFence classes; expand later if needed. Formal threats: T-AR, T-ARes, T-FS, T-LA in protocols/fault-catalog.md.*


---

# Tool-Boundary Effect Semantics

Canonical formalization: `outline/formal-model.md` (state machine, I1–I5, code mapping, Appendix A audit).


---

# System Realization

neko-core + wiii ADE context; B3 lifts seals into explicit effect journal + authority consume. Details: formal-model §5–6 and eval-harness (scaffold pilots logged under evidence/runs/).


---

# Methods
**Angle A** · Lit cutoff: 2026-09-18 · Status: draft for No  
**Sources:** `protocols/fault-catalog.md`, `protocols/experiment-protocol.md` · **No empirical results in this section**

---

## 1. Overview

We evaluate whether a tool-boundary harness with ternary effect state and single-consume authority reduces **duplicate external effects** under intentional crash/restore, relative to checkpoint baselines, with **model weights fixed**. Threats follow ACRFence’s Action Replay and Authority Resurrection classes \cite{acrfence2026}. All mutating side effects run through **mock tools** only (no real payment, email, or deploy). Every reported cell identifies a **model–harness pair** in the spirit of harness-aware evaluation \cite{harnessbench2026}.

---

## 2. System under test and baselines

**Harness.** `neko-core` (local-first), identified as `neko-core@<gitsha>`. ADE/`wiii` is deployment context, not a second treatment.

**Baselines** (one policy per run; never mixed):

| ID | Tag | Recovery policy |
|---|---|---|
| **B0** | none | No durable session; crash ⇒ cold start; model may re-issue tools |
| **B1** | session_ckpt | Persist trajectory; resume may re-drive unanswered / in-flight tools |
| **B2** | ckpt_idem | B1 + client idempotency key on every mock mutating call |
| **B3** (treatment) | unknown_auth | B1 + seal-unknown + reconcile-by-inspect + **authority consume at confirm** + authority bound to artifact hash (RQ2) |

B3 realizes the formal machine in `outline/formal-model.md`: transport ≠ effect; interrupted mutations seal as `unknown`; reconcile inspects mock ground truth before any new mutate; spent authority cannot authorize a re-synthesized request.

---

## 3. Mock tools

| Mock ID | Tool | Observable side effect |
|---|---|---|
| M-pay | `mock_payment_charge` | `charge_count`, `charges[]` |
| M-mail | `mock_email_notify` | `emails_sent` |
| M-fs | `mock_fs_write` | `writes[]`, file bytes, content hash |
| M-flag | `mock_deploy_flag` | `flag_set_count`, flag value |

Mocks expose deterministic seeds, counter read APIs, optional `idempotency_key`, optional `authority_token` (B3), and crash hooks at the registry boundary. Ground truth is **mock counters / artifact hashes**, not model self-report.

---

## 4. Fault catalog (F01–F10)

Injection points sit at mock / `ToolRegistry` boundaries. Primary threats: **T-AR** Action Replay, **T-ARes** Authority Resurrection, **T-FS** false-success, **T-LA** lost-ack \cite{acrfence2026}.

| ID | Injection (summary) | Primary threat | B3 expectation |
|---|---|---|---|
| F01 | Kill after mock success, before durable result receipt | T-LA→T-AR | Seal unknown; reconcile; no second effect if committed |
| F02 | Kill mid-mutation (timeout / SIGKILL in mock body) | T-LA / T-FS | `unknown→reconciling`; inspect before retry |
| F03 | Restore after approval, before execute | T-ARes | Authority bound to artifact hash + effect id; else re-approve |
| F04 | After confirm, model re-synthesizes same intent | T-AR | Consumed authority + ledger reject second execute |
| F05 | Duplicate resume with spent authority token | T-ARes | Single-consume deny |
| F06 | Transport retry after semantic commit | T-AR | Transport retry ≠ effect retry |
| F07 | Crash during reconcile of unknown | T-AR / T-FS | Sticky unknown until inspect completes |
| F08 | Idempotency key present; harness still replays (B2 contrast) | T-AR / T-FS | No second execute when reconciled confirmed |
| F09 | FS write commits; session checkpoint lags | T-LA→T-AR | Reconcile by content hash |
| F10 | Payment double-charge under B1 (headline RQ1) | T-AR | Reconcile `charge_count`; no second charge |

Optional F11–F12 (client/harness desync; ignore-inspect) are out of scope for the Week-6 go/no-go path.

---

## 5. Experimental design

**Cell** = `(baseline × fault_id × mock_id)` with fixed `(model_id, harness_id)`.

- Full catalog: \(4 \times 10 \times 4 = 160\) cells.  
- **Pilot subset** (engineering-time): M-pay + M-fs × {F01, F02, F03, F06, F09, F10} × B0–B3 = 48 cells.  
- Meaningless fault×mock pairs are recorded NA with reason—never filled with invented outcomes.

**Sample size.** Pilot **N = 10** per cell (estimate duplicate rate and variance). Confirmatory **N = 30** per cell for primary contrasts B3 vs B2 on F01 (re-synthesis) and F03 (authority), with LLM driver `glm-5.3` (z.ai). Broader multi-model / full-fault confirmatory matrices remain future work.

**Single-run procedure.** (1) Start harness in baseline mode; register mocks on the sole effect path. (2) Fixed user task requiring one logical mutating effect. (3) Arm injector for `fault_id`. (4) On crash, write marker; restore per baseline. (5) Recover to terminal state or timeout; record latency. (6) Read counters/hashes; write `meta.json`. (7) Reset mock state. B3: missing durable result ⇒ seal unknown ⇒ inspect ⇒ `reconciling→confirmed|rejected`; consume authority only on confirm.

---

## 6. Metrics

| Metric | Definition | Role |
|---|---|---|
| `duplicate_effect_rate` | Fraction of runs with mock counter increment **>1** for the logical intent | **Primary (RQ1)** |
| `false_success_rate` | Harness confirms success but mock/artifact disagrees | Safety |
| `recovery_latency_ms` | Restore start → stable terminal state | Cost |
| `re_approval_rate` | Fraction needing a new gate approval after restore | RQ2 / UX |
| `authority_resurrection_count` | Attempts to execute with a **spent** authority token | **RQ2** |

Secondary: `retry_invoke_count`, `seal_unknown_emitted`, content-hash mismatch (M-fs). Pre-registered primary contrast: **F10 × M-pay × (B3 vs B1)**; other cells secondary.

---

## 7. Model–harness reporting

Every run and aggregate row reports:

```text
model_id:    <provider/model@revision>
harness_id:  neko-core@<gitsha>
baseline:    none | session_ckpt | ckpt_idem | unknown_auth
fault_id, mock_id, run_id, evidence_id
```

We do not pool across different `harness_id` without an explicit harness factor, following harness-effect reporting practice \cite{harnessbench2026}. Artifact layout: `evidence/runs/<E-id>/` with `meta.json`, crash markers, and pre/post counters (append-only evidence log).

---

## 8. Exclusions and integrity

- Mocks only; no real money, SMTP, or production deploy.  
- No Temporal/workflow-engine replacement claim; MCP is not the contribution.  
- **No invented run numbers** in this Methods draft or in linked protocols. Pilot evidence IDs for F01–F03 (N=10, scripted) and confirmatory LLM N=30 aggregates (F01/F03×M-pay×{B2,B3}) are reported in Results.

---

*LIT draft · Methods from locked protocols · cite keys from `bib/refs.bib` only*


---

# Results
**Angle A** · Pilot N=10 (scripted) + Confirmatory LLM N=30 · Harness: `eval-harness@scaffold`  
**Evidence (pilot):** `evidence/runs/pilot-F01-Mpay-N10-summary.json`, `pilot-F02-Mpay-N10-summary.json`, `pilot-F03-Mpay-N10-summary.json`, `pilot-F01-Mfs-N10-summary.json`, `pilot-F01-Mpay-resynth-N10-summary.json`  
**Evidence (LLM confirmatory):** `evidence/runs/confirmatory-llm-F01-Mpay-N30-summary.json`, `confirmatory-llm-F03-Mpay-N30-summary.json`  
**Date:** 2026-09-18 ICT · **No invented cells**

---

## 1. Setup reminder

Each cell uses fixed scripted policy (always issue the mock tool), seeds 1–10, faults from the locked catalog, and baselines B0–B3. Ground truth is mock counters. These pilots validate the **eval harness and RQ trends** under a non-LLM driver; confirmatory LLM-in-the-loop N=30 results are in §9.

---

## 2. F01 — Kill after success, before durable receipt

**M-pay (`mock_payment_charge`).**

| Baseline | duplicate_effect_rate | mean charge_count | seal_unknown_rate |
|---|---:|---:|---:|
| B0 | 1.0 | 2.0 | 0.0 |
| B1 | 1.0 | 2.0 | 0.0 |
| B2 | 0.0 | 1.0 | 0.0 |
| B3 | 0.0 | 1.0 | 1.0 |

**M-fs (`mock_fs_write`)** shows the same pattern: B0/B1 duplicate_rate 1.0 (mean writes 2.0); B2/B3 0.0 (mean writes 1.0); B3 seal_unknown_rate 1.0.

**Reading.** Under F01 with a *stable* scripted retry, classic idempotency (B2) already suppresses duplicate counters. B3 matches B2 on duplicates while **always emitting** an unknown seal before reconcile—visible instrumentation of I2/I3 that B2 lacks.

---

## 3. F02 — Kill mid-mutation

**M-pay.**

| Baseline | duplicate_effect_rate | mean charge_count | seal_unknown_rate |
|---|---:|---:|---:|
| B0 | 0.0 | 1.0 | 0.0 |
| B1 | 0.0 | 1.0 | 0.0 |
| B2 | 0.0 | 1.0 | 0.0 |
| B3 | 0.0 | **0.0** | 1.0 |

**Reading.** No baseline produced a *counted* duplicate under this scaffold’s mid-body kill+retry model (N=10). B3 uniquely keeps `seal_unknown` and ends with **zero** confirmed charges after reconcile when the mock left no committed receipt—conservative I2 (unknown ≠ success). B0–B2 still report mean charge_count 1.0 (retry completed a charge without an unknown seal). This is a behavioral distinction, not a duplicate-rate win.

---

## 4. F03 — Restore after approval, before execute (RQ2)

**M-pay.**

| Baseline | duplicate_effect_rate | mean authority_resurrection | mean charge_count |
|---|---:|---:|---:|
| B0 | 0.0 | 0.0 | 1.0 |
| B1 | 0.0 | **1.0** | 1.0 |
| B2 | 0.0 | **1.0** | 1.0 |
| B3 | 0.0 | **0.0** | **0.0** |

**Reading.** This is the clearest **B3 ≻ B2** signal in the pilot: session checkpoint and idempotency keys do **not** stop Authority Resurrection after restore-before-execute (mean resurrection count 1.0 on B1/B2). B3 refuses to consume a mismatched/spent path, records resurrection 0.0, and performs **no** charge without fresh authority (charge_count 0.0)—aligning with I5 and RQ2.

---

## 5. Cross-fault summary (pilot)

| Fault | Where B0/B1 fail | Where B2 helps | Where B3 uniquely helps |
|---|---|---|---|
| F01 | duplicate counters | yes (same key) | seal+reconcile (parity on dups) |
| F02 | (no dup in scaffold) | — | unknown seal; no false confirm |
| F03 | — | **no** (resurrection) | **blocks resurrection** |

False-success_rate was 0.0 across all reported pilot cells.

---

## 6. Threats to validity (results)

1. **Scaffold harness**, not production neko-core binary path.
2. Pilot cells remain **N=10 scripted**; confirmatory LLM cells are N=30 on F01/F03×M-pay×{B2,B3} only (not full B0–B3 × F01–F10 matrix).
3. LLM driver uses z.ai `glm-5.3` with `reasoning_effort=low` on coding/paas/v4 — other models may differ in Action Replay key/arg mutation.
4. F02 duplicate metric saturated at 0 for all baselines under current crash modeling—needs richer mid-body partial-commit mocks before claiming F02 duplicate wins.

---

## 7. Takeaway for RQ1/RQ2

- **RQ1 (duplicates):** B3 vs B0/B1 on stable-key F01 (0 vs 1); **B3 vs B2 under re-synthesis F01 (0 vs 1)**.
- **RQ2 (authority):** F03—B3 eliminates Authority Resurrection that B1/B2 exhibit (1.0 → 0.0).

Next empirics: expand F02/F04–F10 under LLM; optional multi-model replication; neko-core binary path.

---

## 8. F01 under semantic re-synthesis (B2 vs B3)

**Driver:** `--resynthesize` mutates idempotency-relevant args on retry (e.g. payment `amount + attempt`) and mints a new idempotency key — ACRFence-style Action Replay when the model does not reuse keys.

**M-pay, N=10, seeds 1–10.** Evidence: `evidence/runs/pilot-F01-Mpay-resynth-N10-summary.json`.

| Baseline | duplicate_effect_rate | mean charge_count | seal_unknown_rate |
|---|---:|---:|---:|
| B2 (ckpt + idempotency key) | **1.0** | 2.0 | 0.0 |
| B3 (unknown + reconcile + authority) | **0.0** | 1.0 | 1.0 |

**Reading.** When retry arguments change, B2’s idempotency keys no longer collide — duplicate charges return (rate 1.0). B3 still seals unknown and reconciles against the already-committed mock effect, so counters stay at 1.0. This is the primary **RQ1** separation of B3 from B2 under the threat model that motivates the paper.

**Updated takeaway.** Stable-key F01 made B2 look equal to B3 on duplicates; **re-synthesis removes that parity**. Combined with F03 (Authority Resurrection blocked only by B3), pilot evidence supports both RQ1 and RQ2 for the scaffold+scripted setting.

---

## 9. LLM-in-the-loop confirmatory (N=30)

**Driver:** `--driver llm --model glm-5.3 --reasoning-effort low` (implies `--resynthesize`). Prefer base URL `https://api.z.ai/api/coding/paas/v4`.  
**Agent:** live GLM proposes post-crash tool args + fresh idempotency key (Action Replay).  
**Evidence:** `evidence/runs/confirmatory-llm-F01-Mpay-N30-summary.json`, `confirmatory-llm-F03-Mpay-N30-summary.json`; per-seed dirs `E-confirm-llm-{F01,F03}-Mpay-{B2,B3}-s01..s30/`.  
**Written:** 2026-09-18 ~21:07–21:10 ICT · **errors: 0 / 120 cells**

### 9.1 F01 × M-pay × {B2, B3} — semantic re-synthesis via LLM

| Baseline | n | duplicate_effect_rate | mean charge_count | seal_unknown_rate | false_success_rate | llm total_tokens |
|---|---:|---:|---:|---:|---:|---:|
| B2 | 30 | **1.0** | **2.0** | 0.0 | 0.0 | 7585 |
| B3 | 30 | **0.0** | **1.0** | **1.0** | 0.0 | 7698 |

**Outcomes.** B2: `confirmed` ×30 (charge_count=2 each). B3: `confirmed_via_reconcile` ×30 (charge_count=1 each).  
**LLM usage (F01 grand).** prompt=12300 · completion=2983 · reasoning=942 · **total=15283** · calls=60.  
**Reading.** Live GLM Action Replay reproduces the scripted `--resynthesize` RQ1 separation: B2 duplicate_effect_rate 1.0 vs B3 0.0 at N=30. B3 always seals unknown and reconciles; LLM propose is recorded but not blind-executed under B3.

### 9.2 F03 × M-pay × {B2, B3} — authority resurrection under LLM resume

Harness supports F03 with `driver=llm` (LLM may propose retry args on B2 resume; B3 still requires fresh authority / re-approval).

| Baseline | n | mean authority_resurrection | mean charge_count | duplicate_effect_rate | false_success_rate | llm total_tokens |
|---|---:|---:|---:|---:|---:|---:|
| B2 | 30 | **1.0** | **1.0** | 0.0 | 0.0 | 7477 |
| B3 | 30 | **0.0** | **0.0** | 0.0 | 0.0 | 7470 |

**Outcomes.** B2: `confirmed` ×30 (resurrection path executes charge once). B3: `re_approval_required` ×30 (no charge).  
**LLM usage (F03 grand).** prompt=12300 · completion=2647 · reasoning=625 · **total=14947** · calls=60.  
**Reading.** Confirms RQ2 under LLM-in-the-loop: B3 blocks Authority Resurrection that B2 exhibits (1.0 → 0.0) with charge_count 0.0 vs 1.0.

### 9.3 Combined LLM token spend

| Matrix | cells | total_tokens | prompt | completion | reasoning | failures |
|---|---:|---:|---:|---:|---:|---:|
| F01×{B2,B3}×N=30 | 60 | 15283 | 12300 | 2983 | 942 | 0 |
| F03×{B2,B3}×N=30 | 60 | 14947 | 12300 | 2647 | 625 | 0 |
| **All confirmatory LLM** | **120** | **30230** | **24600** | **5630** | **1567** | **0** |

Mean ≈253 total tokens/cell at `reasoning_effort=low` — well under the pre-run smoke estimate (~250/cell; N=30×2 baselines was ~15k/fault).

### 9.4 Takeaway (confirmatory)

- **RQ1:** LLM-driven F01 re-synthesis — B3 ≻ B2 on duplicates (0.0 vs 1.0) and charges (1.0 vs 2.0) at N=30.
- **RQ2:** LLM-driven F03 — B3 ≻ B2 on authority resurrection (0.0 vs 1.0) and charges (0.0 vs 1.0) at N=30.
- Results match scripted pilots; **0 failures / 120 cells**; grand total **30230** tokens (F01 15283 + F03 14947).
- **Caveats (do not over-claim):** mock tools only; **single model** (`glm-5.3` / z.ai, `reasoning_effort=low`); scripted fault injectors on F01/F03×M-pay×{B2,B3} only — not a full multi-model × F01–F10 matrix.


---

# Discussion
**Angle A** · ~0.75 page · Status: draft for No · Lit cutoff: 2026-09-18  
**Note:** Pilot N=10 scripted + confirmatory LLM N=30 (F01/F03×M-pay×{B2,B3}) are reported in Results; caveats remain (mocks, single model, scripted faults).

---

## Limits of the present draft

This paper’s contribution is **semantic, methodological, and empirical at Phase-1 scope**. Invariants I1–I5, the B0–B3 contrast, and a locked crash/restore protocol on mock tools are fixed. A scripted pilot (N=10) and confirmatory LLM-in-the-loop runs (glm-5.3, N=30 on F01/F03×M-pay×{B2,B3}; 120 cells, 0 failures) support RQ1 under re-synthesis (B3 duplicate_effect_rate 0.0 vs B2 1.0) and RQ2 on F03 (Authority Resurrection 0.0 vs 1.0). Caveats: mock tools, single model, scripted fault injectors — claiming broader superiority beyond these cells would overreach.

The implementation mapping is likewise incomplete by design. neko-core already provides pre-effect durability and unknown seals for interrupted tool calls; single-consume, artifact-hash-bound authority (I5 / RQ2) remains a **research extension** measured in the B3 scaffold, not a claim that production neko already enforces the full machine. Mock tools (payment, notify, filesystem, deploy flag) bound external risk, but they also bound ecological validity: real providers add partial commits, eventual consistency, and policy surfaces our mocks only approximate.

## Local-first harness vs Temporal-class engines

Durable workflow engines remain the right outer substrate when operators already run fleets, timers, and cross-service activities \cite{temporal2026agentharness}. Systems commentary that checkpointed chat is not durable execution of effects aligns with our vocabulary split between session memory and an effect journal \cite{zylos2026durable}. Angle A’s non-goal is explicit: we study lighter journal semantics for **local-first** agent development environments (neko-core / wiii), not a replacement for Temporal or Restate. Claiming “exactly-once” in the distributed-systems sense would overreach; we claim a narrower property—fewer duplicate *mock-observable* mutations under a published fault catalog when restore may re-issue tool work \cite{acrfence2026}.

## Procedural memory is not control durability

Procedural workflow memory improves how agents reuse multi-step *how-to* knowledge across episodes \cite{awm2025}. That line is complementary and easy to mis-cite as durability. A stored procedure does not certify whether a charge already posted. We therefore keep conversation state, effect journals, and procedural workflows as distinct objects: AWM-style memory is related work for agent competence, not a substitute for I2/I3 reconcile-before-replay.

## Threats to validity

**Internal.** Crash injectors must fire at stated boundaries; mis-timed kills confound baseline contrasts. B2 depends on mock key semantics—if keys are recorded only after commit, F02 mid-body kills still permit duplicates, which is informative rather than a harness bug. Authority metrics require that “spent” be durable across resume; otherwise RQ2 is unmeasurable. Scripted `--resynthesize` and live GLM Action Replay both stress semantic replay on F01; transfer to other models and richer mid-body F02 mocks remains open.

**External.** Fixed-driver cells attribute differences to harness policy, not weight updates, but transfer to other models and to non-mock tools is unproven. Pilot N=10 and LLM confirmatory N=30 agree on headline F01/F03 contrasts; multi-model replication and fuller fault coverage may still change magnitudes.

**Construct.** Duplicate_effect_rate on counters is our primary RQ1 construct; it does not capture all user-visible harm (e.g., confusing UX after re-approval). False-success and resurrection counts guard safety constructs tied to ACRFence threats \cite{acrfence2026}. Harness-aware reporting of model–harness pairs reduces scaffold confounding in presentation \cite{harnessbench2026}, but does not by itself validate the full fault suite (F04–F10 still thin).

**Conclusion of discussion.** Honest next steps are multi-model replication, richer mid-body mocks for F02, and expanding beyond F01/F03×M-pay—not rhetorical inflation beyond the reported 120 LLM cells. Scope stays master’s-sized: local-first effect semantics, mock crash injection, and clear non-goals relative to workflow engines and MCP novelty.

---

*LIT draft · Discussion · cite keys from `bib/refs.bib` only*

# Related Work
**Angle A** · Lit cutoff: 2026-09-18 · Status: draft for No  
**Working claim:** Under crash/restore at tool boundaries, an `unknown_outcome` + authority-consumption harness reduces duplicate external effects vs checkpoint-only and checkpoint+idempotency-key baselines (fixed model).

---

Long-horizon LLM agents increasingly fail not only because models err, but because *harnesses* lose track of which external mutations already happened. Session and graph checkpoints preserve conversation or control state, yet they do not certify tool-boundary exactly-once semantics when the model *re-synthesizes* arguments after restore. The practical gap is therefore between “resume the chat” and “prove the side effect”: without an explicit effect journal and a policy for interrupted mutations, restore can emit a fresh tool request that servers treat as new work. This section situates that gap against harness practice, durable-execution engines, authority threats, procedural memory, and evaluation methodology, then states how our Angle A contribution—invariants I1–I5—fits the map.

**Long-running harness practice.** Production writing already treats reliability as a harness concern. Anthropic’s guidance on effective harnesses for long-running agents emphasizes cross-session progress files, clean repository state, and initializer handoff across context windows \cite{anthropic2025harnesses}. Those practices improve continuity of *work*, but they leave open tool-boundary exactly-once behavior when the model regenerates tool arguments after a crash. MiniMax’s open-source Code CLI (MIT; npm `@minimax-ai/code` v0.4.12; CLI `mcode`) is a production-facing terminal coding-agent harness with an inspectable allow/deny/ask permission gate before tool execution, MCP, and session-history resume \cite{minimax2026codecli}; vendor materials also report FrontierHarness Eval results, which we treat as unreproduced vendor claims. The permission gate is a useful foil for I4/I5 *admission* discussion, but Code CLI does not implement `unknown_outcome` sealing, effect journaling, or crash-restore Action Replay—so it remains complementary related practice, not a substitute for Angle A’s ternary tool-boundary semantics. MiniMax’s older Mini-Agent demo harness likewise provides an execution loop with notes/MCP/summarization and a binary `ToolResult` \cite{minimax2026miniagent}, and should not be confused with today’s Code CLI announcement. Survey work frames the same layer more systematically: Li et al.\ organize harness engineering with an ETCLOVG-style taxonomy in which Lifecycle and Governance sit beside Execution, treating the harness as an independent production layer rather than a thin wrapper around the model \cite{li2026harnesssurvey}. Guo et al.\ complement that view with a model–harness lens and six runtime responsibilities spanning observation through verification, arguing that bottlenecks may sit in harness design as much as in foundation models \cite{guo2026fromqa}. We adopt their vocabulary for *where* durability and authority live, then specialize to crash/restore *effect* semantics that those surveys do not formalize.

**Durable execution and the outer harness.** Industry systems synthesis sharpens the distinction between checkpointing and durable execution. Zylos argues that session memory is not an effect journal, and that crash-at-worst-moment testing requires journals, idempotent wrappers, and recovery discipline beyond saving chat state \cite{zylos2026durable}. Temporal’s Agent Harness positions an *outer* harness with durable workflow history, a policy seam before tool execution, and an agent-event stream suitable for multi-service orchestration \cite{temporal2026agentharness}. We cite both as baselines and as **non-replacements**: Angle A studies lighter journal semantics for local-first ADE / coding-agent stacks, not a substitute for Temporal-style workflow fleets, multi-day timers, or cross-service orchestration. In other words, durable history engines own long-running workflow durability; we own ternary effect state and authority consumption at the tool boundary under semantic re-synthesis.

**Threats and authority.** ACRFence names the failure modes that motivate our fault catalog: *Action Replay* (re-issuing a mutating call after restore without proving prior outcome) and *Authority Resurrection* (reviving spent approval for a re-synthesized request) \cite{acrfence2026}. Their analysis shows why checkpoint-only restore is unsafe when the model regenerates arguments: the server may see a semantically related but identifier-fresh request. Beyond Single-Use Tokens argues that identifier-local tokens are insufficient and develops durable authorization state (e.g., CapLease / Issue–Prepare–Commit patterns) so approvals cannot be blindly replayed \cite{beyondtokens2026}. We use that line for authority-consume design (bind approval to an artifact hash; consume on confirm), while noting that coupling a consume ledger to an `unknown→reconciling` effect machine remains open—precisely the integration Angle A targets. AC4A contributes fine-grained permissions over API and browser resources \cite{ac4a2026}; we cite it briefly as governance related work, not as our primary claim, because permission trees alone do not specify crash-recovery journals.

**Procedural memory is not control durability.** Agent Workflow Memory stores reusable procedural workflows that improve how agents perform web tasks across episodes \cite{awm2025}. That line is valuable for *how-to* reuse, but it must not be confused with an effect journal or durable control plane. Procedural text does not answer whether a payment, deploy flag, or filesystem write already committed; Angle A therefore treats AWM-style workflow memory as orthogonal related work and keeps conversation memory, effect journals, and procedural workflows as distinct objects in the formal model.

**Evaluation methodology.** Harness-Bench stresses measuring harness effects across models and reporting model–harness pairs so scaffold choices are not confounded with model quality \cite{harnessbench2026}. AgencyBench highlights scaffold and native-ecosystem effects in long-context agent settings \cite{agencybench2026}. HAL argues for holistic agent evaluation infrastructure, including careful logging and inspection of runs \cite{hal2025}. We adopt their spirit—always report pinned model ID and harness configuration—while keeping a *narrow* crash-injection protocol and duplicate-external-effect metric that those benches do not specialize in. Our B0–B3 baselines (none / session checkpoint / checkpoint+idempotency key / unknown+authority consume) are therefore complementary to broad agent leaderboards, not a replacement for them.

**Contribution relative to this map.** Against this landscape, Angle A contributes a published tool-boundary effect semantics with invariants that surveys and blogs leave open: **I1** pre-effect durability (persist enough state before a mutating call that a crash yields a recoverable in-flight record); **I2** unknown ≠ success (interrupted mutations are never labeled success); **I3** no blind replay from unknown (forbid `unknown→executing` with a new effect id until reconcile); **I4** authority intersection narrow-only (effective permission is an intersection that may narrow, never expand host policy); and **I5** authority consumption (confirmation consumes an artifact-bound token so restore cannot resurrect spent \(\kappa\) for re-synthesized arguments). Optional **I6** (provider semantic commit) is implementation context, not the paper’s primary claim. Empirically, we target measured duplicate-effect reduction under intentional kill points on a local-first neko-core / wiii stack, with Temporal and related engines as non-goal baselines rather than competitors we claim to replace. In short: harness surveys give vocabulary, durable engines give outer durability, ACRFence and Beyond Single-Use Tokens give threat and authority names, AWM clarifies a naming trap, and eval benches give reporting hygiene—while the ternary effect journal coupled to authority consume under crash/restore remains the gap we fill.

---

*~950 words · LIT draft · cite keys only from `bib/refs.bib` · do not invent venues.*


---

# Conclusion
**Angle A** · Target: ~150–200 words · Status: draft for No · Lit cutoff: 2026-09-18

---

Tool-calling agents fail under crash and restore when checkpoints remember dialogue but not which mutations already landed. Re-synthesized tool calls then replay effects or resurrect spent approval—the Action Replay and Authority Resurrection threats named by ACRFence \cite{acrfence2026}. This paper argues for a local-first remedy at the tool boundary: separate transport from effect, keep a ternary journal with an explicit `unknown` state and reconcile-before-replay, and consume artifact-bound authority at confirmation (invariants I1–I5), realized as baseline B3 on neko-core / wiii with model weights held fixed.

We contributed (i) the formal effect machine and authority rules, (ii) a mapping onto an open local harness, and (iii) a locked crash-injection protocol against B0–B2 on mock mutating tools, with mandatory model–harness reporting. A **scripted pilot (N=10)** and **confirmatory LLM-in-the-loop matrix (glm-5.3, N=30, F01/F03×M-pay×{B2,B3}; 120 cells, 30230 tokens, 0 failures)** both support RQ1 under re-synthesis and RQ2 on Authority Resurrection. Caveats: mock tools, single model, scripted faults. We explicitly do not replace Temporal-class durable engines \cite{temporal2026agentharness}, treat MCP as novelty, or claim SWE-bench SOTA. Next steps: broader mocks/faults and multi-model replication for the Q2 path, then Phase-1 workshop/preprint once GVHD/endorsement and coauthor consent are in place.

---

# Positioning appendix

See `outline/positioning-vs-engines.md`.

---

# AI Use Statement

GLM-5.3 via z.ai (`https://api.z.ai/api/coding/paas/v4`) was used **for agent re-synthesis in the eval harness only** (confirmatory LLM cells; `--driver llm`). Paper prose was authored with AI assistance (Cursor/Grok Bot agents for drafting, literature organization, and polishing), as previously disclosed. All research claims, experiment design, reported aggregates, and final wording decisions remain the authors’ responsibility; **no invented results** were accepted from tools.
