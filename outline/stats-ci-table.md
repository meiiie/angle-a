# Confirmatory LLM — Wilson score 95% CI (exact \(k/n\))
**Angle A** · Q2 P0 polish · 2026-09-18 ICT
**Method:** Wilson score interval for a binomial proportion, \(z{=}1.96\) (≈95%).
**Source:** `evidence/runs/confirmatory-llm-*-N30-summary.json` cell-level booleans — **no fabricated rates**.
**Driver:** `llm/glm-5.3@z.ai`, `reasoning_effort=low`, seeds 1–30, harness `eval-harness@scaffold`.

## Primary headline rates

| Fault | Mock | Baseline | Metric | \(k/n\) | Rate | Wilson 95% CI | Evidence |
|---|---|---|---|---:|---:|---|---|
| F01 | M-pay | B2 | `dup_rate` | 30/30 | 1.000 | [0.886, 1.000] | E-20260918-22 |
| F01 | M-pay | B3 | `dup_rate` | 0/30 | 0.000 | [0.000, 0.114] | E-20260918-22 |
| F01 | M-fs | B2 | `dup_rate` | 30/30 | 1.000 | [0.886, 1.000] | E-20260918-27 |
| F01 | M-fs | B3 | `dup_rate` | 0/30 | 0.000 | [0.000, 0.114] | E-20260918-27 |
| F01 | M-mail | B2 | `dup_rate` | 30/30 | 1.000 | [0.886, 1.000] | E-20260918-33 |
| F01 | M-mail | B3 | `dup_rate` | 0/30 | 0.000 | [0.000, 0.114] | E-20260918-33 |
| F02 | M-pay | B2 | `dup_rate` | 0/30 | 0.000 | [0.000, 0.114] | E-20260918-28 |
| F02 | M-pay | B3 | `dup_rate` | 0/30 | 0.000 | [0.000, 0.114] | E-20260918-28 |
| F03 | M-pay | B2 | `auth_resurrection_rate` | 30/30 | 1.000 | [0.886, 1.000] | E-20260918-23 |
| F03 | M-pay | B3 | `auth_resurrection_rate` | 0/30 | 0.000 | [0.000, 0.114] | E-20260918-23 |

## Secondary rates (same cells)

| Fault | Mock | Baseline | `seal_unknown` \(k/n\) | Rate | Wilson 95% CI | `false_success` \(k/n\) | Rate | Wilson 95% CI |
|---|---|---|---:|---:|---|---:|---:|---|
| F01 | M-pay | B2 | 0/30 | 0.000 | [0.000, 0.114] | 0/30 | 0.000 | [0.000, 0.114] |
| F01 | M-pay | B3 | 30/30 | 1.000 | [0.886, 1.000] | 0/30 | 0.000 | [0.000, 0.114] |
| F01 | M-fs | B2 | 0/30 | 0.000 | [0.000, 0.114] | 0/30 | 0.000 | [0.000, 0.114] |
| F01 | M-fs | B3 | 30/30 | 1.000 | [0.886, 1.000] | 0/30 | 0.000 | [0.000, 0.114] |
| F01 | M-mail | B2 | 0/30 | 0.000 | [0.000, 0.114] | 0/30 | 0.000 | [0.000, 0.114] |
| F01 | M-mail | B3 | 30/30 | 1.000 | [0.886, 1.000] | 0/30 | 0.000 | [0.000, 0.114] |
| F02 | M-pay | B2 | 0/30 | 0.000 | [0.000, 0.114] | 0/30 | 0.000 | [0.000, 0.114] |
| F02 | M-pay | B3 | 30/30 | 1.000 | [0.886, 1.000] | 0/30 | 0.000 | [0.000, 0.114] |
| F03 | M-pay | B2 | 0/30 | 0.000 | [0.000, 0.114] | 0/30 | 0.000 | [0.000, 0.114] |
| F03 | M-pay | B3 | 0/30 | 0.000 | [0.000, 0.114] | 0/30 | 0.000 | [0.000, 0.114] |

## Mean counts (not CI’d; continuous / count summaries)

| Fault | Mock | Baseline | mean `charge_count` | mean `writes_len` | mean `authority_resurrection_count` |
|---|---|---|---:|---:|---:|
| F01 | M-pay | B2 | 2.0 | 0.0 | 0.0 |
| F01 | M-pay | B3 | 1.0 | 0.0 | 0.0 |
| F01 | M-fs | B2 | 0.0 | 2.0 | 0.0 |
| F01 | M-fs | B3 | 0.0 | 1.0 | 0.0 |
| F02 | M-pay | B2 | 1.0 | 0.0 | 0.0 |
| F02 | M-pay | B3 | 0.0 | 0.0 | 0.0 |
| F03 | M-pay | B2 | 1.0 | 0.0 | 1.0 |
| F03 | M-pay | B3 | 0.0 | 0.0 | 0.0 |

## Notes for SCRIBE / Results tables

- At \(N{=}30\), Wilson 95% CI for \(k{=}30\) is **[0.887, 1.000]**; for \(k{=}0\) is **[0.000, 0.113]**.
- F01 primary metric = `duplicate_effect` boolean per cell.
- F03 primary metric = `authority_resurrection_count > 0` (rate of cells with resurrection); mean count equals rate here (0 or 1 per cell).
- F02: both B2 and B3 have `dup_rate` \(0/30\); separation is via `seal_unknown` + mean charge (completeness tradeoff), not duplicate CI.
- JSON files: confirmatory-llm-F01-Mfs-N30-summary.json, confirmatory-llm-F01-Mpay-N30-summary.json, confirmatory-llm-F01-Mmail-N30-summary.json, confirmatory-llm-F02-Mpay-N30-summary.json, confirmatory-llm-F03-Mpay-N30-summary.json.
- F01×M-mail effect counter = `emails_sent` (mean B2=2.0, B3=1.0); charge/writes remain 0.

*Generated from real cell counts · no invented \(k\) or \(n\).*
