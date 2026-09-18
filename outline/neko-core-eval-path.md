# Neko-core eval path — wire harness closer to production

**Lab:** wiii-lab / Angle A  
**Created:** 2026-09-18 ~21:35 ICT  
**Purpose:** Close **Q2-GAP P0-1** — production-path or neko-core-faithful harness, not scaffold-only.  
**Repos surveyed:** `/workspace/research/repos/neko-core` @ **`c863cc6`**  
**Scaffold today:** `/workspace/research/wiii-lab/eval-harness` (`harness_id=eval-harness@scaffold`)  
**Rule:** integration plan only — **no invented results**.

---

## 1. What neko-core already implements (code-grounded)

### 1.1 `sealDanglingToolCalls()` — `src/core/agent.ts` (~L961–984)

- Scans the **most recent assistant tool-call batch**; for each unanswered `tool_call`, inserts a synthetic `role: "tool"` result.
- Synthetic content (verbatim shape):
  > `[interrupted while this tool call was in flight; outcome unknown. Inspect actual state before any retry.]`
- Called on:
  - **Resume / new run entry:** `runLoop` clears `_neko_inflight` then `sealDanglingToolCalls()` before appending the next user turn (~L1023–1026).
  - **ACP session restore:** `src/adapters/acp.ts` (~L715–737) clones messages, seals, detects `sealedUnknownOutcome` via JSON diff, persists `turnState.status = "interrupted"` with `lastStopReason: "process_interrupted"`.

**Paper mapping:** this is the production **I2** surface (unknown ≠ success) for *message-trajectory* validity. It does **not** by itself implement the scaffold’s EffectJournal states (`proposed|executing|confirmed|rejected|unknown|reconciling`) or **I5** authority consume.

### 1.2 `durableCheckpoint()` — `src/core/agent.ts` (~L1698–1713)

- Private async wrapper around `this.onCheckpoint` with failure latch (`hasCheckpointFailure` / `checkpointFailure`).
- Critical call site before tool work (~L1441–1443): after `finalizeInflight` + `checkpoint(true, false)`, **`await this.durableCheckpoint()`** — comment: *“the call itself is durable before a slow or state-changing tool starts”* → **I1** pre-effect durability.
- Additional checkpoints: user prompt accepted, after tool results, provider retry_scheduled, turn end, etc.

**Paper mapping:** session/message durability before mutation admission. Still **conversation σ**, not a separate effect journal \(J\).

### 1.3 `unknown_outcome` vocabulary

| Location | Role |
|----------|------|
| `docs/HARNESS-ARCHITECTURE.md` (~L145–148) | Spec: call durable before crash but no durable result → sealed as `unknown_outcome`; **inspect real state before retry** |
| `sealDanglingToolCalls` synthetic tool result | Runtime seal text (“outcome unknown…”) |
| `src/adapters/acp-computer.ts` | Separate **computer** lifecycle state `"unknown_outcome"` / event `computer_unknown_outcome` — host/GUI path, not the payment/mock journal |

**Honest split:** neko-core’s shipped unknown-seal is **trajectory-correctness + inspect-before-retry guidance**. Angle A B3’s EffectJournal + authority consume is the **evaluated extension** (formal-model I1–I5). Q2 paper must not pretend the scaffold journal *is* already merged into `Agent` unless an adapter proves it.

### 1.4 Session / restore substrate

- `src/adapters/session.ts`: versioned sessions, atomic primary/backup, writer lease (architecture docs).
- ACP restore path is the closest **crash/restore** production entry for sealing.

### 1.5 What is *not* in neko-core (gap vs B3 scaffold)

From code + formal-model Appendix A posture (lab D10):

- No first-class **effect journal** with `reconciling` / mock-counter inspect API analogous to `eval-harness/src/journal/effect-journal.ts`.
- No **artifact-bound authority consume (I5)** on confirm (permissions/approval exist; spend-once κ for re-synthesized args is B3 engineering).
- Crash injection for F01–F03 is **eval-harness only** today (in-process `CrashSignal`), not a neko kill-hook around ToolRegistry.

---

## 2. Scaffold vs production — fidelity matrix

| Concern | Scaffold (`eval-harness`) | neko-core @ c863cc6 | Faithful adapter needs |
|---------|---------------------------|---------------------|------------------------|
| Pre-effect persist | SessionStore + journal `executing` | `durableCheckpoint` before tool exec | Call real checkpoint OR record equivalent barrier |
| Unknown seal | `journal.sealUnknown` | `sealDanglingToolCalls` + docs `unknown_outcome` | Prefer **real seal API** on restored messages |
| Inspect-before-retry | `inspectMock` / reconcile | Prompt text only; model/tools must inspect | Keep mock inspect as ground truth; optionally feed seal text into agent |
| Authority consume | EffectJournal I5 | Approval / permission intersection; **not** spend-once κ | Keep B3 journal **beside** Agent, or port I5 into registry gate |
| Crash faults F01–F03 | Armed in mock invoke | No F-catalog hooks | Inject around registry execute / between checkpoint and result append |
| LLM Action Replay | z.ai glm driver | Real Agent + provider | Optional later; Phase A can keep scripted/LLM scaffold agent |

---

## 3. Two integration options

### Option A — **Minimal faithful adapter** (recommended first)

**Goal:** One eval cell path where restore goes through **neko-core seal + checkpoint semantics**, while mocks + metrics stay in lab harness.

**Shape:**

```text
eval-harness/
  src/adapters/neko-core/
    agent-shim.ts      # construct Agent w/ onCheckpoint → SessionStore disk
    fault-hooks.ts     # F01–F03: abort between durableCheckpoint and tool result
    seal-bridge.ts     # after simulated crash: agent.sealDanglingToolCalls()
    metrics-bridge.ts  # map message seal + mock counters → CellMetrics
```

**Minimal cell (proposed engineering order):**

1. **Dependency:** add local path / workspace ref to `repos/neko-core` (Bun); pin `neko-core@c863cc6` in evidence `meta.json` (`harness_id=neko-core@c863cc6+eval-adapter@<labsha>`).
2. **Stub ToolRegistry tool** = existing mocks (`mock_payment_charge`, …) registered as neko tools (or thin wrapper that calls `invokeMock`).
3. **Checkpoint:** set `Agent.onCheckpoint` to persist messages (reuse neko session writer *or* lab SessionStore that writes the same message array).
4. **Fault arm:**  
   - **F01:** after mock success, **before** appending durable tool result / before post-tool checkpoint → kill process or throw `CrashSignal`, leave tool_call unanswered.  
   - **F02:** mid-mutation inside mock (before commit) — same as scaffold.  
   - **F03:** after approval gate, before execute — map to neko permission/admit then crash.
5. **Restore:** reload messages → **`agent.sealDanglingToolCalls()`** (must observe synthetic unknown text) → B2 vs B3 policy branch:  
   - **B2:** allow re-issue / LLM resynth (Action Replay).  
   - **B3:** enter lab EffectJournal reconcile-by-inspect; **do not** blind re-invoke; optional authority consume.
6. **Metrics:** unchanged ground truth = mock counters; additionally assert `sealed_unknown` present in trajectory when F01/F10.

**Exit criterion (not a result claim):** smoke N=1 F01×M-pay×{B2,B3} with `harness_id` containing `neko-core@c863cc6` and evidence showing seal text from **real** `sealDanglingToolCalls`, not only scaffold `sealUnknown`.

**Pros:** weeks not months; paper can say “restore uses neko-core seal/checkpoint; B3 journal is the evaluated policy layer.”  
**Cons:** I5 still lab-side; dual-stack explanation required in Methods.

### Option B — **Full port** (defer)

Port EffectJournal + authority tokens into neko-core (`ToolRegistry` / session schema), add crash-injection test hooks upstream, run confirmatory matrix on packaged neko.

**Pros:** single production narrative for JSS.  
**Cons:** product/API risk, longer eng, needs upstream buy-in; blocks Q2 if required as first step.

**Decision bias for master’s Q2 path:** **A first**, B only if adapter smoke fails fidelity review or reviewers demand in-tree journal.

---

## 4. Concrete first engineering steps (this week)

| Step | Action | Done when |
|------|--------|-----------|
| E1 | Document pin SHAs in REPRO + this file | `neko-core@c863cc6`, lab SHA on adapter commits |
| E2 | Spike: import `Agent` from neko-core in a throwaway Bun script; call `sealDanglingToolCalls` on a dangling tool_call fixture; print sealed message | **DONE** `eval-harness/scripts/spike-seal.ts` + adapter smoke E-30 (2026-09-18 ICT) |
| E3 | Spike: `onCheckpoint` writes JSON; crash between pre-tool checkpoint and tool result append | Marker file + unanswered tool_call on disk |
| E4 | Adapter skeleton + CLI flag `--harness neko` on `run-cell` | Dry cell does not claim paper results |
| E5 | Smoke F01×M-pay B2/B3 N=1 → `evidence/runs/`; **Darren/No review** before any N=30 | **DONE** E-30 smoke (2026-09-18 ICT) |
| E6 | Confirmatory scripted N=30 F01×M-pay×{B2,B3} (resume-safe CLI) | **DONE** E-31 — `confirmatory-neko-seal-F01-Mpay-N30-summary.json`; B2 dup=1 charge=2; B3 dup=0 charge=1; seal match=1.0 |

**Do not:** mix scaffold and adapter rates without `harness_id` separation; do not claim full ACP/prod restore until E3–E4 ACP path closes remaining diffs.

---

## 5. Methods wording (draft — for later LIT sync)

> Empirics use mock mutating tools. The **scaffold harness** implements B0–B3 in-process for rapid cells. The **neko-core-faithful adapter** (when present) drives restore through `durableCheckpoint` and `sealDanglingToolCalls` at commit `c863cc6`, and applies B3 reconcile/authority policy in the lab journal. Results tables always report `harness_id` and never mix scaffold and adapter rows without a separation line.

---

## 6. Non-claims

- Adapter smoke (E-30) + scripted confirmatory N=30 (E-31) exist; remaining diffs vs full neko ACP restore still listed in cell `diffs_from_full_neko_session`.
- Computer-adapter `unknown_outcome` is out of scope for M-pay/M-fs/M-mail cells unless a dedicated GUI fault is added.
- Full Temporal/Restate replacement remains a non-goal.

---

## 7. Pointers

| Artifact | Path |
|----------|------|
| Q2 gaps | `handbook/Q2-GAP-LIST.md` |
| Formal I1–I5 | `outline/formal-model.md` |
| Scaffold runner | `eval-harness/src/harness/runner.ts` |
| B3 journal | `eval-harness/src/journal/effect-journal.ts` |
| Seal / checkpoint | `repos/neko-core/src/core/agent.ts` |
| ACP restore seal | `repos/neko-core/src/adapters/acp.ts` |
| Architecture prose | `repos/neko-core/docs/HARNESS-ARCHITECTURE.md` |

*EVAL/eng: E2/E5/E6 landed (E-30/E-31); next = deepen ACP/session fidelity (remaining diffs). LIT: keep harness_id separation in tables.*
