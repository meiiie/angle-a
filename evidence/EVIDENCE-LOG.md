# EVIDENCE-LOG (public artifact excerpt)

Aggregate confirmatory summaries live in `evidence/runs/` and `arxiv-pack/extra/`; full lab
log synced from wiii-lab E-22..E-33 / E-31 neko-seal. See repo history and
`arxiv-pack/REPRODUCIBILITY.md` for how each `*-summary.json` maps to the paper tables;
the full per-seed run directories (`evidence/runs/<E-id>/` with `meta.json`, `stdout.log`,
crash markers) are not committed here.

## Aggregates in `evidence/runs/`

| File | Design |
|------|--------|
| `pilot-F01-Mpay-N10-summary.json` | pilot, F01 × M-pay, N=10 |
| `pilot-F01-Mpay-resynth-N10-summary.json` | pilot, F01 × M-pay (resynth), N=10 |
| `pilot-F01-Mfs-N10-summary.json` | pilot, F01 × M-fs, N=10 |
| `pilot-F02-Mpay-N10-summary.json` | pilot, F02 × M-pay, N=10 |
| `pilot-F03-Mpay-N10-summary.json` | pilot, F03 × M-pay, N=10 |
| `confirmatory-llm-F01-Mpay-N30-summary.json` | confirmatory, LLM driver, F01 × M-pay, N=30 |
| `confirmatory-llm-F01-Mmail-N30-summary.json` | confirmatory, LLM driver, F01 × M-mail, N=30 |
| `confirmatory-llm-F03-Mpay-N30-summary.json` | confirmatory, LLM driver, F03 × M-pay, N=30 |
| `confirmatory-neko-acp-llm-F01-Mpay-N10-summary.json` | pilot (E-35), LLM driver on ACP session/load, F01 × M-pay, N=10 |
| `confirmatory-neko-acp-llm-F01-Mpay-N30-summary.json` | confirmatory (E-36), LLM driver on ACP session/load, F01 × M-pay, N=30 |
| `confirmatory-neko-acp-llm-F03-Mpay-N10-summary.json` | pilot (E-38), LLM driver on ACP session/load, F03 × M-pay, N=10 |
| `confirmatory-neko-acp-llm-F03-Mpay-N30-summary.json` | confirmatory (E-39), LLM driver on ACP session/load, F03 × M-pay, N=30 |

## Evidence log excerpt: E-20260918-35 / E-20260918-36

- **E-20260918-35** (2026-09-18 ~22:24 ICT): pilot-neko-acp-llm-N10, F01×M-pay×{B2,B3}×N=10, driver=llm glm-5.3 effort=low on ACP session/load; B2 dup_rate=1.0, mean_charge=2.0, seal=1.0, retry=1; B3 dup_rate=0.0, mean_charge=1.0, seal=1.0, retry=0; errors=0; llm_usage total_tokens=5182; auto-proceed N=30.
- **E-20260918-36** (2026-09-18 ~22:27 ICT): confirm-neko-acp-llm-N30, F01×M-pay×{B2,B3}×N=30, driver=llm glm-5.3 effort=low ACP session/load; B2 dup_rate=1.0, mean_charge=2.0, seal=1.0, retry=1; B3 dup_rate=0.0, mean_charge=1.0, seal=1.0, retry=0; seal_text_matches_neko_core=1.0 both; errors=0; llm_usage total_tokens=15383; resumed s01–s10; overrun=false.

## Evidence log excerpt: E-20260918-38 / E-20260918-39

- **E-20260918-38** (2026-09-18 ~22:33 ICT): pilot-neko-acp-llm-F03-N10, F03×M-pay×{B2,B3}×N=10, driver=llm glm-5.3 effort=low on ACP session/load @ neko-core c863cc6; B2 authority_resurrection=1.0, mean_charge=1.0, re_approval=0.0, retry=1, dup_rate=0.0; B3 authority_resurrection=0.0, mean_charge=0.0, re_approval=1.0, retry=0, dup_rate=0.0; seal=1.0 both; errors=0; llm_usage total_tokens=5083; auto-proceed N=30.
- **E-20260918-39** (2026-09-18 ~22:35 ICT): confirm-neko-acp-llm-F03-N30, F03×M-pay×{B2,B3}×N=30, driver=llm glm-5.3 effort=low ACP session/load @ neko-core c863cc6; B2 authority_resurrection=1.0, mean_charge=1.0, re_approval=0.0, retry=1; B3 authority_resurrection=0.0, mean_charge=0.0, re_approval=1.0, retry=0; dup_rate=0.0 both; seal_text_matches_neko_core=1.0 both; errors=0; llm_usage total_tokens=15055; resumed s01–s10; overrun=false; matches scaffold F03 authority pattern.

Source: wiii-lab `evidence/EVIDENCE-LOG.md` (synced 2026-09-18).
