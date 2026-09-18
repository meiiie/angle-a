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
