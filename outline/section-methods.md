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
