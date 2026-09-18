# Experiment Protocol — Angle A Crash/Restore (Mocks)

**VN gloss:** Giao thức thí nghiệm crash/restore (mock)

**Lab:** wiii-lab / EVAL · **Paper Angle A** · **Date locked with RQ:** 2026-09-18 ICT  
**Companion:** [`fault-catalog.md`](./fault-catalog.md) (F01–F10)  
**Harness:** neko-core (local-first) · **Fixed model** across B0–B3 within a cell block  

**Non-claims:** not a Temporal replacement; not MCP novelty; crash-injection on **mock mutating tools only**.

---

## 1. Research questions (locked)

**RQ1.** Under intentional crash/restore at tool boundaries, does a harness that (1) separates transport from effect, (2) keeps `unknown` control state with reconciliation, and (3) consumes authority at effect confirmation reduce **duplicate external effects** vs checkpoint-only and checkpoint+idempotency-key baselines, fixed model?

**RQ2.** How must approval/authority records bind to **artifact hashes** so restore cannot resurrect spent authority?

**Claim.** Ternary effect SM `proposed→executing→{confirmed|rejected|unknown→reconciling}` + single-consume authority reduces Action Replay / Authority Resurrection vs session-checkpoint baselines on neko-core (weights fixed).

---

## 2. Baselines

| ID | Tag | Configuration |
|---|---|---|
| B0 | `baseline=none` | No durable session; crash ⇒ cold start; model may re-issue tools |
| B1 | `baseline=session_ckpt` | neko session persistence (`saveSession` / `saveSessionAsync` / ACP restore); resume from trajectory |
| B2 | `baseline=ckpt_idem` | B1 + idempotency key on every mock mutating call |
| B3 | `baseline=unknown_auth` | B1 + seal-unknown + reconcile-by-inspect + **authority consume at confirm** + authority↔artifact hash (RQ2) |

B3 is the **treatment**. B0–B2 are controls. Do not mix policies within a run.

---

## 3. Mock tools

| Mock ID | Name | Observable side-effect | Notes |
|---|---|---|---|
| M-pay | `mock_payment_charge` | `charge_count`, `charges[]` | Headline RQ1 cell with F10 |
| M-mail | `mock_email_notify` | `emails_sent` | No real SMTP |
| M-fs | `mock_fs_write` | `writes[]`, file bytes, content hash | Pairs with F09 |
| M-flag | `mock_deploy_flag` | `flag_set_count`, flag value | No real deploy |

**Hard rule:** no real money / email / deploy unless Darren explicitly expands scope. Mocks only for W6 go/no-go.

Each mock MUST support: deterministic seed, counter read API, optional `idempotency_key`, optional `authority_token` (B3), and crash hook registration at registry boundary.

---

## 4. Cell matrix

**Cell** = `(baseline × fault_id × mock_id)` with fixed `(model_id, harness_id)`.

| Dimension | Levels |
|---|---|
| Baseline | B0, B1, B2, B3 |
| Fault | F01–F10 (see fault-catalog; F11–F12 optional) |
| Mock | M-pay, M-mail, M-fs, M-flag |

**Full factorial (required catalog):** \(4 × 10 × 4 = 160\) cells.  
**Pilot subset (eng-time):** prioritize M-pay+M-fs × {F01,F02,F03,F06,F09,F10} × B0–B3 = \(2 × 6 × 4 = 48\) cells (matches W6 narrow path).

Not every fault×mock pair is equally meaningful (e.g. F10 is payment-primary); still record empty/NA with reason rather than inventing results.

---

## 5. Sample size N

| Phase | N per cell | Purpose |
|---|---|---|
| Pilot | **N = 10** | Estimate \(p\) (duplicate rate), variance; decide power |
| Confirmatory | **N ≥ 30** | Duplicate-rate CI (Wilson or bootstrap); primary RQ1 contrasts B3 vs B1 and B3 vs B2 |

**Power note (paper methods):** for detecting drop from e.g. \(p_1=0.40\) to \(p_3=0.10\) at α=0.05, two-sided, ~80% power, N≈30/cell is a common starting point; recompute after pilot. Do **not** invent run results in this protocol.

Randomization: shuffle fault timing jitter within allowed window; fix model temperature/seed policy in `meta.json`.

---

## 6. Metrics

| Metric | Definition | Primary for |
|---|---|---|
| `duplicate_effect_rate` | Fraction of runs where mock counter increments **>1** for the logical intent | RQ1 |
| `false_success_rate` | Fraction where harness declares confirmed success but mock/artifact disagrees | safety |
| `recovery_latency_ms` | Time from restore start → stable terminal state (confirmed \| rejected \| reconciled) | cost |
| `re_approval_rate` | Fraction requiring a **new** human/gate approval after restore | RQ2 / UX |
| `authority_resurrection_count` | Count of attempts to execute using a **spent** authority token (per run; aggregate mean) | RQ2 |

**Secondary (optional):** `retry_invoke_count` (harness-issued second `tools/call`), `seal_unknown_emitted` (bool), content-hash mismatch rate (M-fs).

Ground truth = mock counters / artifact hashes, **not** model self-report.

---

## 7. Model–harness reporting template (Harness-Bench spirit)

Every run and every aggregate table row MUST identify the pair:

```text
model_id:     <provider/model@revision_or_api_id>
harness_id:   neko-core@<gitsha>
baseline:     none | session_ckpt | ckpt_idem | unknown_auth
fault_id:     F01…F10
mock_id:      M-pay | M-mail | M-fs | M-flag
run_id:       <uuid>
evidence_id:  E-YYYYMMDD-NN
```

**Aggregate caption example:**

> Duplicate effect rate under F10/M-pay: model=`<model_id>`, harness=`neko-core@<gitsha>`, N=30/cell, baselines B0–B3.

Do not report “neko” without gitsha. Do not pool across different `harness_id` without an explicit harness factor.

**Pinned clone SHAs (lab trees, 2026-09-18 ICT):** `neko-core@c863cc6` · `wiii@038f33d` under `/workspace/research/repos/`. Re-pin `harness_id` if the clone advances before confirmatory runs.

### `meta.json` schema (minimum)

```json
{
  "evidence_id": "E-20260918-04",
  "run_id": "...",
  "model_id": "...",
  "harness_id": "neko-core@deadbeef",
  "baseline": "session_ckpt",
  "fault_id": "F10",
  "mock_id": "M-pay",
  "seed": 0,
  "started_at_ict": "2026-09-18T20:00:00+07:00",
  "crash_marker": {
    "fault_id": "F10",
    "t_inject_ms": 0,
    "signal": "SIGKILL"
  },
  "metrics": {
    "duplicate_effect": false,
    "false_success": false,
    "recovery_latency_ms": null,
    "re_approval": false,
    "authority_resurrection_count": 0
  },
  "mock_counters_pre": {},
  "mock_counters_post": {},
  "notes": ""
}
```

Leave metric fields null until a real run; **do not invent**.

---

## 8. Procedure (single run)

1. Start harness in baseline mode; register mocks into `ToolRegistry` path only (no second effect path).  
2. Issue fixed user task that requires exactly one logical mutating effect for `mock_id`.  
3. Arm fault injector for `fault_id` (see fault-catalog “When”).  
4. On crash: write crash marker under run dir; restore per baseline (B0 cold / B1–B3 session resume).  
5. Allow harness to recover until terminal state or timeout T_max (record latency).  
6. Read mock counters + artifact hashes; fill metrics; write stdout log.  
7. Tear down; no cross-run mock state leakage (reset counters).

**B3-specific steps:** on missing durable result → seal unknown (align with `sealDanglingToolCalls` / doc `unknown_outcome`); inspect mock; transition `reconciling→confirmed|rejected`; consume authority only on confirm; reject spent token (F05).

---

## 9. Success / fail criteria — Week 6 go/no-go

| Gate | Pass | Fail → action |
|---|---|---|
| **Mock protocol runnable** | End-to-end harness can inject ≥F01,F10 on M-pay+M-fs under B1 and B3 within **≤2 eng-weeks** from protocol freeze | Narrow to **payment + filesystem only**; defer M-mail/M-flag |
| **Instrumentation** | `meta.json` + counters + crash markers written for every pilot run | Block confirmatory N |
| **No real side-effects** | Mocks only | Immediate stop; scrub |
| **Reporting** | Every table has `model_id` + `harness_id=neko-core@<gitsha>` + baseline tag | Reject for paper draft |
| **RQ1 directional (pilot)** | No fabricated wins; if pilot shows B3 `duplicate_effect_rate` **not** ≤ B1, investigate before confirmatory | Document; do not claim |

Go/no-go is about **runnability and honest measurement**, not about claiming statistical victory without data.

---

## 10. Artifact layout

```text
/workspace/research/wiii-lab/evidence/
  EVIDENCE-LOG.md
  runs/
    <E-id>/
      meta.json          # one per run, or meta-<run_id>.json
      stdout.log
      crash-markers/
        <fault_id>-<run_id>.json
      counters-pre.json
      counters-post.json
  crash-logs/            # optional aggregated copies
  traces/                # optional trajectory dumps
```

Link each batch from `EVIDENCE-LOG.md` with kind `run` or `protocol` as appropriate. Append-only log.

---

## 11. Analysis plan (no results yet)

- Primary contrast: `duplicate_effect_rate(B3)` vs `B1`, vs `B2`, stratified by fault and mock.  
- RQ2: report `authority_resurrection_count` and `re_approval_rate` on F03/F05.  
- B2 contrast cells F06/F08: separate **mock-counter** duplicates from **harness retry** narratives.  
- Multiple comparisons: pre-register primary = F10×M-pay×(B3 vs B1); treat others as secondary.

---

## 12. Explicit exclusions

- No real payment processors, SMTP, or production deploy flags.  
- No claim that MCP support is the contribution.  
- No claim of Temporal/workflow-engine replacement.  
- No invented run numbers in protocols, evidence summaries, or paper drafts.
