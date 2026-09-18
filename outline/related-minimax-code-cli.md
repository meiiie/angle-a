# Related: MiniMax Code CLI (OSS terminal coding agent)

**Audit date:** 2026-09-18 ~21:25 ICT  
**RQ1 relevance:** **Medium** for I4/I5 *discussion* (inspectable pre-tool permission gate); **Low** for core RQ1 mechanisms (no `unknown_outcome`, effect journal, or crash-consistent tool-boundary restore)  
**Clone:** `/workspace/research/repos/minimax-code` (shallow, depth 1)  
**HEAD:** `17b8ded9c16da54224c2a05e54185cbee4f15021` (`17b8ded`, 2026-09-18 21:43 +0800)  
**Version / license:** workspace `0.4.12` / **MIT** (first-party default; `LICENSE` + `LICENSE-STATUS.md`; sandbox-runtime remains Apache-2.0)  
**Published npm (README/docs):** `@minimax-ai/code` (docs note npm `latest` observed `0.4.12` on 2026-09-18); in-repo TUI package name `@minimax/code`  
**CLI binary:** `mcode`  
**Tweet (NOW READ via X API):** https://x.com/MiniMaxAgent/status/2100928718541853038 — created 2026-09-18 12:43:34 UTC (**19:43 ICT**); article title **“MiniMax Code CLI Is Now Open Source”**; author `@MiniMaxAgent`. **Not** Mini-Agent.

**Correction:** Earlier note `outline/related-minimax-mini-agent.md` and E-20260918-25 / D-20260918-minimax-mini-agent **mis-attributed this tweet** to MiniMax-AI/Mini-Agent. Mini-Agent remains a separate older OSS demo harness; **today’s announcement is Code CLI**.

---

## What it is

**Official:** [MiniMax-AI/minimax-code](https://github.com/MiniMax-AI/minimax-code) — MiniMax’s open-source **terminal coding agent** (interactive TUI / headless `mcode exec` / ACP) with MiniMax account / Token Plan, BYOK providers, sandboxing, plugins, search/media tools (`mcode-tools`), and MCP. Installer: `curl -fsSL https://filecdn.minimax.chat/public/install.sh | bash`. Announcement claims FrontierHarness Eval SOTA pass rate / fastest completion / second-lowest tokens (**vendor claim; not re-run here**).

**Not issue-tracker-only:** Full TypeScript monorepo under `packages/` + vendored `third_party/{pi-mono,sandbox-runtime}`. Real CLI source.

**Distinct from:**

| Artifact | Relation |
|---|---|
| **MiniMax-AI/minimax-code** (`mcode` / `@minimax-ai/code`) | **This note** — production-facing OSS Code CLI. |
| **MiniMax-AI/Mini-Agent** (`mini-agent`) | Older **minimal demo** harness — separate repo; see `related-minimax-mini-agent.md`. |
| Unofficial `minimax-harness` npm/PyPI | Third-party; do not cite as MiniMax official. |

---

## Architecture sketch

From `docs/architecture.md` + package layout:

```
TUI / exec / ACP  →  CliService  →  local Applications
        →  Session / Turn / Agent services
        →  Pi (third_party/pi-mono) / model providers / local tools
```

| Layer | Path (clone-relative) | Role |
|---|---|---|
| TUI / adapters | `packages/tui` | Interactive TUI, headless, ACP |
| Local product entry | `packages/local-runtime-v2/src/local` | CliService, session resume |
| Applications | `packages/local-runtime-v2/src/application` | Sessions, queues, interactions |
| Host facilities | `packages/local-runtime` | DB, file tools, **permissions**, session ledger |
| Permission engine | `packages/agent-modules/permission` (`@mavis/permission`) | Pure allow/deny/ask decision core |
| Permission SPI | `packages/agent-extension/src/permission.ts` | `before_tool_call` gate |
| Turn permission gate | `packages/local-runtime-v2/src/service/turn-system/agent-host/runner/policy/local-turn-permission-gate.ts` | Side-session + approval wiring |
| MCP | `packages/agent-modules/mcp`, local-runtime-v2 MCP services | Project / local MCP runtime |
| Agent loop infra | `third_party/pi-mono` | Pi agent / model protocol |
| Sandbox | `third_party/sandbox-runtime` | OS sandbox fork (Apache-2.0) |

Workspace packages use private `@mavis/*` names (build resolves source; not independently published APIs). Session continuity: `mcode --continue` / `--session` resumes **conversation history** (ledger-backed), not mid-tool crash recovery.

---

## Audit vs Angle A / RQ1 keywords

| Concern | Present? | Evidence |
|---|---|---|
| Session persistence / resume | **Yes (history)** | README resume; `packages/local-runtime/src/sessions/ledger/` (`FileSessionLedgerStore`). Conversation restore, not effect restore. |
| Checkpoint | **Yes, but wrong kind** | Compaction checkpoint summaries (`.../compaction/algorithm/checkpoint-format.ts`); background-task output snapshots (`.../background-task/checkpoint-snapshot.ts`); history-migration checkpoints. **Not** pre-effect durable tool checkpoints. |
| Crash / restore of in-flight tools | **No** | Interrupted/legacy import paths exist; no seal→reconcile→safe re-issue for mutate-in-flight. |
| Effect journal | **No** | “Reconcile” hits plan drafts, plugins, questionnaire owned-actions, MCP inventory — **not** tool-effect journals. `unknown_outcome` = **0** hits under `packages/`. |
| Idempotency | **Partial (wrong layer)** | Queue / steering / cron / migration **message** idempotency keys; **not** tool-effect idempotency for Action Replay. |
| Permissions / authority | **Yes (product gate)** | Full allow/deny/ask + `allowOnce` / `allowAlways` / `deny` reply vocabulary; rule persistence session vs global. |
| Authority *consume* (I5 CapLease-style) | **No / weak analogy** | `allowOnce` is session-scoped rule / one-approval UX, **not** durable one-shot lease consumed across crash+replay. Pending asks settle in-process; no anti–Authority Resurrection under restore. |
| Tool-call replay (Action Replay) | **No** | `runaway-guard` “replay” = offline detector trajectory replay (`packages/agent-modules/runaway-guard/src/replay.ts`); ledger “replay” = history load metrics — not re-issuing tools after crash. |
| MCP | **Yes** | First-class MCP packages/services + permission MCP name matching. |

**Grep (packages/, excluding heavy vendor binaries):** `unknown_outcome` = 0 files; effect-journal = 0; checkpoint ≈55 files (wrong kind); idempotency ≈99 (queue/cron/etc.); permission ≈339; `allowOnce` ≈22; MCP ≈246; replay ≈89 (not Action Replay).

---

## Relevance judgment

- **High:** — (none for RQ1 core claims)  
- **Med:** I4/I5 *discussion foil* — production-grade, OSS-inspectable **pre-tool-call permission gate** (allow/deny/ask, allowOnce vs allowAlways, fail-closed side-session) shows industry cares about *admission control*, still orthogonal to *crash-consistent effect semantics*.  
- **Low:** Claim that MiniMax Code CLI implements Angle A / B3 (unknown seal, effect journal, authority consume under restore).

**Do not change paper claims** — no overlapping unknown/journal/consume mechanism found.

---

## Cite-ready Related Work (1–2 sentences)

MiniMax’s open-source Code CLI (`minimax-code` / `@minimax-ai/code`, MIT, v0.4.12) is a full terminal coding-agent harness with session resume, sandboxing, MCP, and an inspectable allow/deny/ask permission gate before tool execution \cite{minimax2026codecli}. It demonstrates industry investment in interactive authority *admission*, but does not implement `unknown_outcome` sealing, effect journaling, or crash-restore Action Replay—so it is complementary related practice for I4/I5 discussion, not a substitute for Angle A’s ternary tool-boundary semantics.

*(Optional Discussion-only second sentence:)* Unlike CapLease-style one-shot consume under restore, Code CLI’s `allowOnce` / `allowAlways` replies persist session or global *rules* for subsequent calls within a live process.

---

## Steal-for-discussion vs do-not-claim

**Steal for discussion / future work only:**

1. **Permission as `before_tool_call` SPI** — pure engine (`@mavis/permission`) + host facade + extension adapter; clean separation for comparing “admission policy” vs “effect durability.”
2. **`allowOnce` vs `allowAlways` vocabulary** — concrete UX for one-shot vs sticky grants; contrast with I5 consume-on-use under crash (discussion only).
3. **Fail-closed side-session approval** — temporary side sessions force explicit ask before mutate (`local-turn-permission-gate.ts`).
4. **Session ledger resume** — history durability ≠ effect durability (keep boxes separate; same AWM/memory trap already in RW).
5. **Vendor harness + published eval zip** — industry “harness quality” discourse (FrontierHarness); keep distinct from RQ1 fault catalog.

**Do not claim:**

- MiniMax Code CLI solves Action Replay / unknown outcomes / authority resurrection.  
- Compaction or background “checkpoints” are Angle A pre-effect checkpoints.  
- Queue/steering idempotency keys are tool-effect idempotency.  
- Today’s tweet is Mini-Agent (it is **Code CLI**).  
- Do not inflate FrontierHarness SOTA into paper empirics (vendor eval, unreproduced).

---

## I4/I5 inspectable quotes (file:line, clone-relative)

**1. Permission extension gates every tool call (allow / deny / ask):**

`packages/agent-extension/src/permission.ts:1–27` (design comment: pure `@mavis/permission` engine; host supplies `decide`; maps allow/deny/ask onto pi `before_tool_call`). Handler:

```148:175:packages/agent-extension/src/permission.ts
    const decision = await decide(summary);
    if (decision.behavior === 'ask' && onAsk) {
      let resolved: PermissionDecision | undefined;
      try {
        const askResult = await onAsk(decision, summary, signal);
        if (askResult && typeof askResult === 'object' && 'behavior' in askResult) {
          resolved = askResult as PermissionDecision;
        }
      } catch (err) { /* onAskError observer; keep block posture */ }
      const effective = resolved ?? decision;
      return mapDecision(effective, summary, toolContext, decision.rewrittenInput);
    }
    return mapDecision(decision, summary, toolContext);
  };
  return {
    id,
    description,
    init(pi: ExtensionAPI): void {
      pi.on('before_tool_call', handler);
    },
```

**2. User reply vocabulary `allowOnce` | `allowAlways` | `deny`:**

`packages/local-runtime-v2/src/local/cli-service.ts:880–889` — `toPermissionDecision` maps protocol replies to that triad.

`packages/local-runtime/src/permissions/reply.ts:33–46` — channel `allow` → `allowOnce` (session-scoped); `always` → `allowAlways` (global rule); `deny` identity.

**3. Approval persistence is rule add, not CapLease consume:**

`packages/local-runtime/src/api/local-permission-approval-service.ts:146–174` — on reply with rule contents, `allowAlways` → `source: 'global'`, else `source: 'session'`, via `permissionRules.applyUpdate({ type: 'addRules', ... })`.

**4. Side-session fail-closed before mutate:**

`packages/local-runtime-v2/src/service/turn-system/agent-host/runner/policy/local-turn-permission-gate.ts:240–256` — metadata lookup failure blocks the tool (“Could not verify whether this Session is a temporary side Session…”).

These support **discussion** of interactive authority gates (I4-ish admission) without claiming I5 durable consume across crash+replay.

## Key gaps vs Angle A (summary)

| Angle A (I1–I5) | MiniMax Code CLI |
|---|---|
| I1 pre-effect durability | Missing (session ledger ≠ effect journal) |
| I2 unknown ≠ success | Missing |
| I3 no blind replay from unknown | Missing (no restore→re-issue protocol) |
| I4 authority intersection | Partial: rich permission *admission* gate; not crash-restore intersection |
| I5 authority consumption | Missing as CapLease; `allowOnce` is UX/session rule, not durable consume |

**Relevance score for RQ1: Medium (I4/I5 discussion) / Low (core unknown+journal claims).** Prefer cite Code CLI over Mini-Agent if Related Work needs a MiniMax vendor-harness sentence; keep Mini-Agent as optional older demo only.

---

## Citation-ready bib snippet

```bibtex
@misc{minimax2026codecli,
  title        = {MiniMax Code CLI},
  author       = {{MiniMax-AI}},
  howpublished = {GitHub repository},
  year         = {2026},
  url          = {https://github.com/MiniMax-AI/minimax-code},
  note         = {Tier 1 optional; Not Q. OSS terminal coding agent (MIT, v0.4.12, npm @minimax-ai/code). Inspectable allow/deny/ask permission gate + MCP + session resume; no unknown\_outcome, effect journal, or crash-restore Action Replay. Announced 2026-09-18 @MiniMaxAgent status/2100928718541853038. Clone audited 2026-09-18 @ 17b8ded. Distinct from MiniMax-AI/Mini-Agent demo harness.}
}
```
