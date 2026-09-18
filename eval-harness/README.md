# Wiii Lab — Eval Harness (scaffold)

**Lab:** wiii-lab / Angle A · **Status:** scaffold (no paper results)  
**Companion protocols:** [`../protocols/fault-catalog.md`](../protocols/fault-catalog.md), [`../protocols/experiment-protocol.md`](../protocols/experiment-protocol.md)  
**Formal model:** [`../outline/formal-model.md`](../outline/formal-model.md) (I1–I5, B3)

Standalone crash/restore eval package for **mock mutating tools only**. No network, no real payment/email/deploy, no LLM required for dry cells (scripted agent always issues the mock tool).

## Requirements

- [Bun](https://bun.sh) ≥ 1.0 **or** Node 20+ (Bun preferred; used in scripts below)
- Offline / local box only

## Layout

```text
eval-harness/
  package.json
  README.md
  src/
    types.ts
    mocks/          # mock_payment_charge, mock_email_notify, mock_fs_write, mock_deploy_flag
    journal/        # B3 effect journal (proposed…reconciling) + authority consume
    baselines/      # session store for B1–B3
    faults/         # F01–F03 crash phase map; F04 resume+resynth stub; F05–F10 stubs
    agent/          # scripted + llm (z.ai GLM) drivers; --resynthesize / --driver llm
    harness/        # cell runner (B0–B3 modes)
    cli/            # run-cell, smoke, smoke-neko-seal
    adapters/neko-core/  # Option A faithful seal/checkpoint adapter
```

## Baselines (modes)

| ID | Tag | Behavior |
|----|-----|----------|
| B0 | `none` | No session durability; crash → cold restart; scripted agent re-issues |
| B1 | `session_ckpt` | Persist turn; resume re-executes unanswered tool |
| B2 | `ckpt_idem` | B1 + idempotency key honored by mocks |
| B3 | `unknown_auth` | Seal unknown; reconcile-by-inspect; consume authority on confirm |

## Mock tools

| Mock ID | Tool | Counter |
|---------|------|---------|
| M-pay | `mock_payment_charge` | `charge_count` / `charges[]` |
| M-mail | `mock_email_notify` | `emails_sent` |
| M-fs | `mock_fs_write` | `writes[]` + content hash |
| M-flag | `mock_deploy_flag` | `flag_set_count` |

All accept `effect_id`, optional `idempotency_key`, optional `authority_token`.

## Crash hooks (armed)

| Fault | Phase |
|-------|--------|
| F01 / F10 | After mock success, before durable receipt |
| F02 | Mid-mutation (before commit) |
| F03 | After approval, before execute |

F04 stub: harness-level post-confirm resume + semantic re-synthesis (no mid-mock crash arm).
F05–F09 map to `none` in this scaffold (cell still runs; no inject).

## How to run

From this directory:

```bash
cd /workspace/research/wiii-lab/eval-harness

# One dry cell (defaults: B0 × F01 × M-pay) — prints metrics JSON
bun run src/cli/run-cell.ts --dry

# Explicit cell
bun run src/cli/run-cell.ts --baseline B3 --fault F01 --mock M-pay --dry

# Write evidence under ../evidence/runs/<E-id>/
bun run src/cli/run-cell.ts -b B0 -f F01 -m M-pay --write-evidence --evidence-id E-20260918-dry-01

# Optional N=1 smoke: F01×M-pay×B0 and F01×M-pay×B3
bun run src/cli/smoke.ts

# LLM smoke (needs ZAI_API_KEY): F01×M-pay×B2 and B3
bun run smoke-llm

# ACRFence semantic re-synthesis on retry (mutates amount/path; new idem key)
bun run src/cli/run-cell.ts -b B2 -f F01 -m M-pay --resynthesize --dry
bun run src/cli/run-cell.ts -b B3 -f F01 -m M-pay --resynthesize --write-evidence --seed 1
```

Package scripts:

```bash
bun run dry      # alias for default dry cell
bun run smoke      # N=1 smoke pair → evidence/runs/
bun run smoke-llm  # LLM driver smoke (B2+B3) → evidence/runs/
```

### Example metrics stdout

```json
{
  "baseline_id": "B0",
  "fault_id": "F01",
  "mock_id": "M-pay",
  "metrics": {
    "duplicate_effect": true,
    "duplicate_effect_rate": 1,
    "false_success": false,
    "recovery_latency_ms": 0,
    "re_approval": false,
    "authority_resurrection_count": 0,
    "retry_invoke_count": 1,
    "seal_unknown_emitted": false
  }
}
```

Numbers above are **illustrative of shape only** when documenting the CLI; real stdout comes from the scripted run. Do not copy into paper result tables.

## LLM driver (z.ai GLM)

Requires `ZAI_API_KEY` in the environment (never logged). Prefer coding plan base URL, then standard:

1. `https://api.z.ai/api/coding/paas/v4`
2. `https://api.z.ai/api/paas/v4`

```bash
set -a && source /workspace/research/wiii-lab/.secrets.env && set +a

# Single cell (F01×M-pay×B2 Action Replay)
bun run src/cli/run-cell.ts -b B2 -f F01 -m M-pay --driver llm --model glm-5.3 --write-evidence

# Smoke: 1× B2 + 1× B3
bun run smoke-llm
```

`--driver llm` implies post-crash re-synthesis via GLM (`thinking.enabled` + `reasoning_effort=low` by default). Under **B3**, the LLM proposal is recorded but **not** blind-invoked (reconcile path). Under **B2**, the LLM-mutated args + new idem key are invoked (Action Replay threat).

### Confirmatory LLM matrix

`src/cli/confirmatory-llm.ts` runs `{B2,B3} × N` with `driver=llm` (glm-5.3, `reasoning_effort=low`). Resume-safe: **skips a cell when both `meta.json` and `stdout.log` already exist** under `evidence/runs/<E-id>/`.

```bash
# Defaults (backward-compat): F01+F03 × M-pay × N=30
bun run confirmatory-llm
bun run confirmatory-llm --fault both --mock M-pay --n 30

# Expand beyond F01/F03 × M-pay
bun run confirmatory-llm --fault F01 --mock M-fs --n 30 --concurrency 1
bun run confirmatory-llm --fault F02 --mock M-pay --n 30 --concurrency 1
bun run confirmatory-llm --fault F03 --mock M-pay --n 30

# Smoke N=1 (same evidence-id scheme as the N=30 matrix; later N=30 resumes these)
bun run confirmatory-llm --fault F01 --mock M-fs --n 1
bun run confirmatory-llm --fault F02 --mock M-pay --n 1
```

Flags:

| Flag | Values | Default |
|------|--------|---------|
| `--fault` / `-f` | `F01` `F02` `F03` `both` | `both` (= F01+F03) |
| `--mock` / `-m` | `M-pay` `M-fs` | `M-pay` |
| `--n` | positive int | `30` |
| `--concurrency` | positive int | `1` |

Evidence IDs include the mock tag (`Mpay` or `Mfs`):

```text
E-confirm-llm-${fault}-${mockTag}-${baseline}-sNN
# e.g. E-confirm-llm-F01-Mfs-B2-s01
#      E-confirm-llm-F02-Mpay-B3-s30
```

Summaries:

```text
evidence/runs/confirmatory-llm-${fault}-${mockTag}-N${n}-summary.json
# e.g. confirmatory-llm-F01-Mfs-N30-summary.json
```

Aggregate counters: M-pay → `charge_count`; M-fs → `writes_len` (from `mock_counters_post`). Exposed as `effect_count` / `mean_effect_count_post`. `charge_count` / `mean_charge_count_post` kept for M-pay compatibility.

## Evidence layout


Writes (when `--write-evidence` or `smoke`) land in:

```text
/workspace/research/wiii-lab/evidence/runs/<E-id>/
  meta.json
  counters-pre.json
  counters-post.json
  stdout.log
  crash-markers/<fault>-<run_id>.json
```



## neko-core-faithful adapter (Option A)

**Pin:** `neko-core@c863cc6` · **Docs:** [`src/adapters/neko-core/README.md`](src/adapters/neko-core/README.md) · **Plan:** [`../outline/neko-core-eval-path.md`](../outline/neko-core-eval-path.md)

Minimal dual-stack path: real `Agent.sealDanglingToolCalls` + lab mocks/EffectJournal.

```bash
bun run spike-seal          # E2: seal dangling tool_call fixture
bun run smoke-neko-seal     # F01×M-pay×{B2,B3} N=1 → evidence/runs/E-20260918-neko-seal-*
```

`harness_id` form: `neko-core@c863cc6+eval-adapter@<labsha>`. Do **not** mix with `eval-harness@scaffold` rows without a separation line. Smoke is scripted N=1 — not confirmatory paper rates.

## Non-claims

- Not a Temporal replacement; not MCP novelty.
- Scaffold only — no invented confirmatory results.
- Ground truth = mock counters, not model self-report.

## Week-6 note

This package satisfies **mock protocol runnable** scaffolding: inject F01–F03 on mocks under B0–B3 without neko-core wiring. Wiring into live `ToolRegistry` is a later eng step.
