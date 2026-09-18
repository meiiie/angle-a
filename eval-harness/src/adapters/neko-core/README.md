# neko-core-faithful adapter (Option A — minimal)

**Status:** E2 seal fixture + confirmatory N=30 scripted (F01×M-pay×{B2,B3}). Still dual-stack / not full ACP.  
**Pin:** `neko-core@c863cc6` (`/workspace/research/repos/neko-core`)  
**Plan:** [`../../../outline/neko-core-eval-path.md`](../../../outline/neko-core-eval-path.md)

## What this is

A **minimal faithful adapter** that drives crash/restore through the **real**
`Agent.sealDanglingToolCalls()` API (same synthetic `unknown_outcome` text as
production / ACP restore), while mock tools + B3 `EffectJournal` stay in the lab harness.

```text
src/adapters/neko-core/
  pin.ts                 # commit pins + seal text constant
  agent-shim.ts          # Agent + onCheckpoint → disk messages.json
  seal-bridge.ts         # ACP-style seal after reload
  fault-hooks.ts         # F01–F03 barrier map
  metrics-bridge.ts      # → CellMetrics
  crash-restore-cell.ts  # F01×M-pay×{B2,B3} cell
  README.md
```

## Smoke + confirmatory N=30

```bash
cd /workspace/research/wiii-lab/eval-harness
bun run scripts/spike-seal.ts          # E2: seal only
bun run smoke-neko-seal                # F01×M-pay B2+B3 N=1 → evidence/runs/
bun run confirmatory-neko-seal         # F01×M-pay×{B2,B3}×N=30 resume-safe
```

Expected shape (scripted, N=1 — **not** paper rates):

| Cell | seal from real API | charge_count | duplicate | blind replay |
|------|--------------------|--------------|-----------|--------------|
| B2   | yes                | 2            | true      | yes (Action Replay) |
| B3   | yes                | 1            | false     | no (reconcile-by-inspect) |

`harness_id` looks like `neko-core@c863cc6+eval-adapter@<labsha>`.

## Dual-stack honesty

| Layer | Source |
|-------|--------|
| Message seal / unknown text | **neko-core** `sealDanglingToolCalls` |
| Pre-tool durable barrier | Adapter checkpoint of `agent.messages` (mirrors `durableCheckpoint` call site) |
| Effect journal + I5 authority | **Lab** `EffectJournal` |
| Mock counters (ground truth) | Lab `MockToolRegistry` |

## What still differs from full neko-core session restore

See `diffs_from_full_neko_session` in smoke `stdout.log` / cell return value. Summary:

1. No ACP `session/load` activate path (`acp.ts` persist/lease).
2. No live `Provider.complete` / `runLoop` — scripted dangling `tool_call` fixture.
3. Mocks are not registered inside neko `ToolRegistry`.
4. Effect journal / spend-once κ remain lab-side.
5. Crash is in-process `CrashSignal`, not process kill.
6. Checkpoint is adapter JSON, not `session.ts` atomic primary/backup writer.

## Non-claims

- Does **not** replace scaffold confirmatory LLM N=30 rows.
- Does **not** assert production merge of EffectJournal into Agent.
- Do not mix `eval-harness@scaffold` and `neko-core@…+eval-adapter@…` rows without a separation line.
