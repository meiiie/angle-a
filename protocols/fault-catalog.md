# Fault Catalog — Crash/Restore at Tool Boundaries

**VN gloss:** Danh mục điểm tiêm crash/restore tại biên tool

**Lab:** wiii-lab / Angle A · **Harness under test:** neko-core  
**Locked drivers:** RQ1 (duplicate external effects), RQ2 (authority ↔ artifact hash), Claim (ternary effect SM + single-consume authority)  
**Scope:** injection on **mock mutating tools only** (payment, email/notify, filesystem write, deploy flag). No real money, email, or deploy.  
**Non-claims:** not a Temporal replacement; not MCP novelty.

---

## Anchors (verified against clones 2026-09-18 ICT)

**Canonical trees:** `/workspace/research/repos/neko-core@c863cc6` · `/workspace/research/repos/wiii@038f33d`  
(Paths below are relative to the neko-core clone unless noted.)

| Symbol / path (clone-relative) | Lines / notes | Role in faults |
|---|---|---|
| `docs/HARNESS-ARCHITECTURE.md` | durable sessions § | Pre-effect + result checkpoints; seal vocabulary `unknown_outcome`; inspect before retry; `session/load` vs `session/resume`; single `ToolRegistry` path |
| `src/core/tool-runtime.ts` → `ToolRegistry` | effect boundary | Sole mutate path; preflight / permission / lease before effect |
| `src/core/agent.ts` → `durableCheckpoint()` | ~L1698; call sites ~L1443 pre-tool, ~L1240 post-result | Pre-effect durability; result checkpoint after tool outcome |
| `src/core/agent.ts` → `sealDanglingToolCalls()` | L961–977 | Synthetic tool result: “outcome unknown. Inspect actual state before any retry.” |
| `src/adapters/session.ts` → `saveSession` / `saveSessionAsync` / `AsyncSessionWriter` | L287 / L360 / L387 | Atomic primary+`.bak` publish; latest-wins queue; turn state `idle`\|`running`\|`interrupted` |
| `src/adapters/acp.ts` → restore + `session/load`\|`resume` | seal @ L726; load L842; resume L843 | On restore: `sealDanglingToolCalls()`; persist `interrupted` if running/sealed |
| `src/adapters/acp-host-mcp.ts` → `call()` | L157 | Transport failure: `"Error: host MCP call outcome unknown; not retried: …"` |
| `src/core/permissions.ts` → `decide()` | modes / `--yolo` | Launch authority ceiling — **not** single-consume effect token (B3 gap) |
| `wiii` ADE docs (`docs/architecture/WIII_ADE_AND_NEKO_AGENT_FABRIC.md`) | deployment context | Project→Task→Run→AgentSession wraps neko sessions; **not** a second RQ1 treatment |

**EVAL flag:** literal enum/token `unknown_outcome` appears in docs + `acp-computer.ts` computer state; runtime **tool** seal text is `sealDanglingToolCalls()` (“outcome unknown…”). Ternary SM states `proposed|executing|confirmed|rejected|unknown|reconciling` and **artifact-hash-bound single-consume authority** are **Angle A design targets (B3)**, not fully named as such in neko-core@c863cc6.

---

## Threat taxonomy

| Threat ID | Name | Definition (observable) |
|---|---|---|
| T-AR | Action Replay | Same logical intent causes **≥2 increments** of a mock side-effect counter |
| T-ARes | Authority Resurrection | Spent approval/authority reused after restore to authorize a new effect |
| T-FS | False-success | Harness reports confirmed success while mock counter / artifact state disagrees |
| T-LA | Lost-ack | Effect committed externally; harness never durable-records confirmation (drives unknown / duplicate risk) |

---

## Baselines (contrast column)

| ID | Name | Recovery policy (experiment harness modes) |
|---|---|---|
| B0 | none | No session durability; crash → cold restart; model may re-issue tools |
| B1 | session checkpoint | Persist trajectory (`saveSession*` / ACP restore); resume may re-execute unanswered/in-flight tools |
| B2 | + idempotency key | B1 + client idempotency key on mock calls; key alone must not imply semantic once |
| B3 | ours | Transport≠effect; seal unknown; reconcile by inspecting mock state; **consume** authority at confirm; authority records bound to artifact hashes (RQ2) |

---

## Mock tools (side-effect counters)

| Mock ID | Tool name (eval) | Counter / artifact | Mutating? |
|---|---|---|---|
| M-pay | `mock_payment_charge` | `charges[]` / `charge_count` | yes |
| M-mail | `mock_email_notify` | `emails_sent` | yes |
| M-fs | `mock_fs_write` | `writes[]` + file bytes + content hash | yes |
| M-flag | `mock_deploy_flag` | `flag_set_count` / flag value | yes |

All mocks expose: `effect_id`, optional `idempotency_key`, `authority_token` (B3), and synchronous counter APIs for the evaluator. Crash hooks fire only at mock/registry boundaries below.

---

## Injection points (F01–F10)

### F01 — Kill after mock effect success, before durable result receipt
| Field | Value |
|---|---|
| **When** | After mock returns OK to `ToolRegistry` executor; **before** `durableCheckpoint()` / `saveSessionAsync` publishes tool result message |
| **neko map** | Pre-effect already durable (`agent.ts` durable call); result checkpoint not yet published (`HARNESS-ARCHITECTURE` “durable result/error checkpoint”) |
| **Threat** | T-LA → T-AR |
| **B0** | Full re-run → duplicate |
| **B1** | Resume sees unanswered / missing result → model or harness retries → duplicate |
| **B2** | Idempotency key may collapse second mock invoke *if* mock honors key; harness may still treat as failure and loop |
| **B3** | Seal unknown; reconcile via mock inspect; **no** second effect if counter shows committed; confirm then consume authority |
| **Metric** | `duplicate_effect_rate`, `authority_resurrection_count=0`, `recovery_latency_ms` |

### F02 — Kill mid-mutation (timeout / process kill during mock body)
| Field | Value |
|---|---|
| **When** | Inside mock mutating body (partial write / charge “pending”); process SIGKILL or mock-forced timeout |
| **neko map** | In-flight tool; ACP/MCP path analogous to `acp-host-mcp` “outcome unknown; not retried” |
| **Threat** | T-LA, T-FS (if treated as hard failure without inspect) |
| **B0/B1** | Retry without inspect → duplicate or inconsistent artifact |
| **B2** | Key may block duplicate charge **if** mock records key before commit; mid-body kill before key record → still duplicate risk |
| **B3** | `unknown→reconciling`; inspect counters/hashes; repair or confirm; never convert unknown to success without evidence |
| **Metric** | `duplicate_effect_rate`, `false_success_rate` |

### F03 — Restore after approval, before execute (authority resurrection risk)
| Field | Value |
|---|---|
| **When** | Permission/`decide()` (or mock gate) returned allow; durable “approved” recorded; crash **before** mock effect starts |
| **neko map** | `permissions.ts` + ToolRegistry preflight; turn capability lease; ACP host authority ceiling (`hostProfile`) |
| **Threat** | T-ARes (if approval token reusable across restore without binding) |
| **B0** | N/A / re-prompt |
| **B1** | Restored “approved” tool_call re-enters execute → effect with resurrected consent |
| **B2** | Idempotency irrelevant (effect never ran); approval replay still possible |
| **B3** | Authority bound to **artifact hash + effect_id**; unspent token valid once; restore without matching proposed artifact → re-approval (`re_approval_rate`) |
| **Metric** | `authority_resurrection_count`, `re_approval_rate`, `duplicate_effect_rate` |

### F04 — Restore after execute confirmed; model re-synthesizes same intent
| Field | Value |
|---|---|
| **When** | Mock effect confirmed and durable tool result present; crash after turn; on resume model emits **new** tool_call with same semantic args |
| **neko map** | Trajectory has result; agent loop may still propose another mutation (`complete → execute`) |
| **Threat** | T-AR (semantic replay, new `tool_call` id) |
| **B0–B2** | New call id bypasses naive dedupe; B2 helps only if harness reuses same idempotency key |
| **B3** | Consumed authority + effect ledger keyed by intent/artifact hash rejects second execute without new approval |
| **Metric** | `duplicate_effect_rate`, `authority_resurrection_count`, `re_approval_rate` |

### F05 — Duplicate resume with spent authority token
| Field | Value |
|---|---|
| **When** | Two concurrent or sequential `session/resume` (or CLI `--resume`) after effect confirmed and authority marked spent |
| **neko map** | `acp.ts` `session/resume` vs `session/load`; `session.ts` writer lease / atomic publish |
| **Threat** | T-ARes, T-AR |
| **B1** | Second resume may re-drive unanswered or re-prompted path |
| **B2** | Key may stop second mock hit; spent-authority not modeled |
| **B3** | Single-consume: second presenter of token → deny; no effect increment |
| **Metric** | `authority_resurrection_count`, `duplicate_effect_rate` |

### F06 — Transport retry after semantic commit
| Field | Value |
|---|---|
| **When** | Mock (or host MCP shim) has committed effect; transport layer retries the RPC / provider request that contained the tool call |
| **neko map** | Provider “semantic commit barrier” (`HARNESS-ARCHITECTURE`); `acp-host-mcp` refuses blind retry on unknown |
| **Threat** | T-AR |
| **B0** | Likely duplicate |
| **B1** | Checkpoint may not distinguish transport retry from new effect |
| **B2** | Designed contrast: key should make second invoke no-op **at mock**; harness may still mis-count success |
| **B3** | Transport retry ≠ effect retry; effect SM already `confirmed` → no second mutate |
| **Metric** | `duplicate_effect_rate`, `false_success_rate` |

### F07 — Crash during reconcile of unknown
| Field | Value |
|---|---|
| **When** | After seal unknown (dangling tool sealed); harness entered reconcile/inspect; kill before reconcile completes |
| **neko map** | Post-`sealDanglingToolCalls()`; doc mandate “inspect real state before any retry” |
| **Threat** | T-AR (retry-as-execute), T-FS |
| **B1** | May treat sealed unknown as failure and re-execute |
| **B2** | Depends on key survival across reconcile crash |
| **B3** | Remain `unknown`/`reconciling` until inspect finishes; never auto-execute from incomplete reconcile |
| **Metric** | `duplicate_effect_rate`, `false_success_rate`, `recovery_latency_ms` |

### F08 — Idempotency key present but harness still replays (B2 contrast)
| Field | Value |
|---|---|
| **When** | Same as F01 or F06, with idempotency key set; **harness** issues a second `tools/call` despite key |
| **neko map** | Eval harness B2 mode; mock records key→first result |
| **Threat** | T-AR at harness layer (mock may no-op); T-FS if harness counts both as distinct successes |
| **B2** | **Expected partial mitigation:** mock counter stable, but harness metrics may still show retry storms / false narrative |
| **B3** | Should not issue second execute when reconciled confirmed; authority already consumed |
| **Metric** | `duplicate_effect_rate` (counter-based), harness `retry_invoke_count` (secondary), `false_success_rate` |

### F09 — Filesystem write succeeds; session checkpoint lags
| Field | Value |
|---|---|
| **When** | `mock_fs_write` commits bytes; `AsyncSessionWriter` pending/coalesced save not yet published (or kill between effect and `flush()`) |
| **neko map** | `AsyncSessionWriter` latest-wins; callers that need durability must await generation before side effects — F09 forces the lag hazard |
| **Threat** | T-LA → T-AR on resume |
| **B1** | Resume from stale session → rewrite file / duplicate `writes[]` |
| **B2** | Key on write path may no-op second write if content-addressed |
| **B3** | Unknown + reconcile by file hash; authority bound to artifact hash (RQ2) |
| **Metric** | `duplicate_effect_rate`, `false_success_rate`, content-hash equality |

### F10 — Payment mock double-charge under B1
| Field | Value |
|---|---|
| **When** | Canonical B1 failure story: charge succeeds; crash before durable tool result; resume re-executes `mock_payment_charge` |
| **neko map** | Same boundary as F01 specialized to M-pay; primary RQ1 headline cell |
| **Threat** | T-AR |
| **B0/B1** | **Expect high** `duplicate_effect_rate` |
| **B2** | Lower if mock key enforced |
| **B3** | Reconcile `charge_count`; no second charge; consume authority on first confirm |
| **Metric** | `duplicate_effect_rate` (primary), `recovery_latency_ms` |

---

## Optional extensions (if eng-time remains; not required for W6 go/no-go)

| ID | Sketch |
|---|---|
| F11 | Kill between `session/load` (client replay) and agent continue — client/harness desync |
| F12 | Seal unknown text present but evaluator / model ignores “inspect before retry” → forced re-execute under B1 |

---

## Summary matrix (fault × primary threat × which baseline is stressed)

| F-ID | Primary threat | B0 | B1 | B2 | B3 expect |
|---|---|---|---|---|---|
| F01 | T-LA→T-AR | fail | fail | partial | seal+reconcile |
| F02 | T-LA/T-FS | fail | fail | partial | unknown→reconcile |
| F03 | T-ARes | — | fail | fail | hash-bound auth |
| F04 | T-AR | fail | fail | partial | consume blocks |
| F05 | T-ARes | — | fail | partial | single-consume |
| F06 | T-AR | fail | fail | **contrast** | transport≠effect |
| F07 | T-AR/T-FS | fail | fail | partial | sticky unknown |
| F08 | T-AR/T-FS | — | — | **contrast** | no second execute |
| F09 | T-LA→T-AR | fail | fail | partial | hash reconcile |
| F10 | T-AR | fail | **headline fail** | partial | no double-charge |

---

## Observability requirements (per injection)

Each run must emit:

1. Crash marker: `{fault_id, mock_id, baseline, t_inject_ms, gitsha}`  
2. Mock counter snapshot pre/post resume  
3. Whether seal-unknown synthetic tool result appeared  
4. Authority token state: `absent|proposed|spent|resurrected_attempt`  
5. Final harness-declared outcome vs mock ground truth  

Artifact layout: see `experiment-protocol.md` → `evidence/runs/<E-id>/`.
