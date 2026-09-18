# SCRIBE note — Q2 P0 figures + Wilson CI
**Angle A** · 2026-09-18 ICT · Executor polish pass  
**Audience:** SCRIBE (LaTeX / camera-ready)

## Figures to `\includegraphics`

Paths are under `arxiv-pack/latex/figures/` (also mirrored in `outline/figures/` and repo `figures/`).  
`\graphicspath{{figures/}}` is already set in `main.tex`.

| Label | File | Suggested placement (already wired in `main.tex`) |
|---|---|---|
| `fig:effect-sm` | `effect-state-machine.pdf` (+ `.png`) | After Effect state machine prose, before Invariants I1–I5 |
| `fig:threat-map` | `threat-map.pdf` (+ `.png`) | After Fault catalog (F01–F10) table |

TikZ sources: `figures/effect-state-machine.tex`, `figures/threat-map.tex` (rebuild with `pdflatex` then `pdftoppm -png -r 200`).

**Style:** black/white, journal-friendly; no color fills.

### Caption copy (if you rewrite)

- **Fig. effect-sm:** Effect journal state machine: `proposed→executing` then `confirmed` / `rejected` / `unknown`; `reconciling ⊂ unknown`.
- **Fig. threat-map:** F01–F03 → T-LA / T-AR / T-ARes (F01: T-LA→T-AR; F02: T-LA/T-AR; F03: T-ARes).

## Results table rows changed (confirmatory LLM, §`sec:results-confirm`)

Source of truth for numbers: `outline/stats-ci-table.md` (exact \(k/n\) from the four `confirmatory-llm-*-N30-summary.json` files).  
**Method:** Wilson score 95% CI, \(z=1.96\). **No fabricated rates.**

| Table | What changed |
|---|---|
| **F01×M-pay** (E-22) | Added `$k/n$`, Wilson 95% CI columns; rates as 1.000/0.000; seal as \(k/n\); tokens moved to prose |
| **F01×M-fs** (E-27) | Same CI/`k/n` treatment for `dup_rate`; seal as \(k/n\) |
| **F02×M-pay** (E-28) | `dup` shown as \(0/30\) with CI both baselines; seal as \(k/n\); tokens in prose |
| **F03×M-pay** (E-23) | Auth.\ resurrection as rate with `$k/n$` + Wilson CI (30/30 vs 0/30) |

Driver paragraph now states Wilson CI reporting and points to `outline/stats-ci-table.md`.

### Headline CI values (do not invent others)

| Cell | \(k/n\) | Wilson 95% CI |
|---|---:|---|
| Any \(30/30\) | 30/30 | [0.886, 1.000] |
| Any \(0/30\) | 0/30 | [0.000, 0.114] |

## SCRIBE checklist

1. Confirm both figures appear in PDF (refs `Fig.~\ref{fig:effect-sm}`, `Fig.~\ref{fig:threat-map}` — add textual refs in prose if desired).
2. Keep CI columns on confirmatory tables; do **not** backfill invented pilot CIs unless computed from pilot JSON the same way.
3. Optional: add `\ref{fig:effect-sm}` in Methods prose and `\ref{fig:threat-map}` near threat classes / fault catalog.
4. Rebuild: `cd arxiv-pack/latex && xelatex main && bibtex main && xelatex main && xelatex main`.

*No new runs; figures + stats only.*

## Also patched (so Results ↔ Discussion agree)

- Threats-to-validity / Discussion / Conclusion no longer claim "No CI yet" or "Missing contribution figures".
- Remaining open P0 list: scaffold≠production, external validity, public artifact+consent.
- Former P0-3/P0-4 marked closed with refs to Figs.~\ref{fig:effect-sm}--\ref{fig:threat-map}.

