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

Wilson 95% CI on exact \(k/n\) (see `outline/stats-ci-table.md`).

| Baseline | n | dup \(k/n\) | duplicate_effect_rate | Wilson 95% CI | mean charge_count | seal_unknown \(k/n\) | llm total_tokens |
|---|---:|---:|---:|---|---:|---:|---:|
| B2 | 30 | 30/30 | **1.000** | [0.886, 1.000] | **2.0** | 0/30 | 7585 |
| B3 | 30 | 0/30 | **0.000** | [0.000, 0.114] | **1.0** | 30/30 | 7698 |

**Outcomes.** B2: `confirmed` ×30 (charge_count=2 each). B3: `confirmed_via_reconcile` ×30 (charge_count=1 each).  
**LLM usage (F01 grand).** prompt=12300 · completion=2983 · reasoning=942 · **total=15283** · calls=60.  
**Reading.** Live GLM Action Replay reproduces the scripted `--resynthesize` RQ1 separation: B2 duplicate_effect_rate 1.0 vs B3 0.0 at N=30. B3 always seals unknown and reconciles; LLM propose is recorded but not blind-executed under B3.

### 9.2 F03 × M-pay × {B2, B3} — authority resurrection under LLM resume

Harness supports F03 with `driver=llm` (LLM may propose retry args on B2 resume; B3 still requires fresh authority / re-approval).

| Baseline | n | auth.\ res.\ \(k/n\) | auth.\ res.\ rate | Wilson 95% CI | mean charge_count | duplicate_effect_rate | llm total_tokens |
|---|---:|---:|---:|---|---:|---:|---:|
| B2 | 30 | 30/30 | **1.000** | [0.886, 1.000] | **1.0** | 0.0 | 7477 |
| B3 | 30 | 0/30 | **0.000** | [0.000, 0.114] | **0.0** | 0.0 | 7470 |

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
