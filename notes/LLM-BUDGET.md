# LLM budget (GLM 5.3 / z.ai) — actuals

## Smoke (E-20260918-21)
- F01×M-pay×{B2,B3} N=1: total_tokens ≈503 (coding/paas/v4, reasoning_effort=low)

## Confirmatory N=30 (E-20260918-22 / E-23) — REAL
Assumptions superseded by measured usage:

| Matrix | cells | total_tokens | prompt | completion | reasoning | calls | failures |
|---|---:|---:|---:|---:|---:|---:|---:|
| F01×M-pay×{B2,B3}×N=30 | 60 | 15283 | 12300 | 2983 | 942 | 60 | 0 |
| F03×M-pay×{B2,B3}×N=30 | 60 | 14947 | 12300 | 2647 | 625 | 60 | 0 |
| **Grand** | **120** | **30230** | **24600** | **5630** | **1567** | **120** | **0** |

- Mean ≈ **253 total tokens / cell** at reasoning_effort=low
- Prior planning estimate (1500/cell → 180k) was **~6× high**; revise future budgets to ~300–400 tok/cell for this prompt shape
- Summaries: `evidence/runs/confirmatory-llm-F01-Mpay-N30-summary.json`, `confirmatory-llm-F03-Mpay-N30-summary.json`
