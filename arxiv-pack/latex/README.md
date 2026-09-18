# Angle A — arXiv LaTeX pack

**Title:** Unknown Outcomes and Authority-Aware Replay: Tool-Boundary Semantics for Durable LLM Agents  
**Author:** Darren (Vietnam Maritime University, IT master's)  
**Date:** 2026-09-18 ICT  
**Status:** Phase-1 preprint draft (scripted pilot N=10 + confirmatory LLM N=30 glm-5.3)

## Build

Requires TeX Live with: `xelatex` (fontspec/DejaVu), `bibtex`, `natbib`, `booktabs`, `hyperref`.

```bash
cd latex
xelatex -interaction=nonstopmode main.tex
bibtex main
xelatex -interaction=nonstopmode main.tex
xelatex -interaction=nonstopmode main.tex
```

Outputs: `main.pdf` (also copied to `../paper-arxiv.pdf` after a successful build).

Optional one-liner with `latexmk` if available:

```bash
latexmk -xelatex -interaction=nonstopmode main.tex
```

## Files

| File | Role |
|---|---|
| `main.tex` | Full manuscript |
| `refs.bib` | Bibliography (copy of `bib/refs.bib`; do not invent keys) |
| `README.md` | This file |
| `main.pdf` | Compiled PDF |

## arXiv upload notes (as of 2026-09)

1. **Real author names required** — arXiv does **not** accept anonymous submissions. Fill the email placeholder and any co-authors in `AUTHORS-AND-METADATA.md` before submit.
2. **Prefer TeX source upload** — upload `.tex` + `.bib` (and any figures) rather than PDF-only when possible; arXiv will compile.
3. **Category:** primary `cs.SE` (Software Engineering) or `cs.AI` (Artificial Intelligence); secondary cross-list optional (e.g.\ `cs.CR` given ACRFence threat framing).
4. **Endorsement:** first-time submitters in a category may need an endorser; plan ahead.
5. **No invented results** — numbers in Results match pilot + confirmatory-llm JSON under `evidence/runs/`.
6. **Ethics / artifacts** — Appendix covers mock-only ethics and artifact paths; replace lab paths with public URLs at camera-ready.
7. **License:** choose an arXiv-compatible license at submit time (e.g.\ CC-BY-4.0 or arXiv perpetual non-exclusive).

## Source of truth (prose)

- Outline sections: `../../outline/section-*.md`, `formal-model.md`
- Metadata: `../../outline/AUTHORS-AND-METADATA.md`
- Reproducibility: `../REPRODUCIBILITY.md`
- Checklist vs norms: `../ARXIV-CHECKLIST.md`

## Do not

- Invent co-authors, venues, or evaluation numbers.
- Cite keys outside `refs.bib`.
- Claim confirmatory LLM results that are not in `confirmatory-llm-*-summary.json`.
