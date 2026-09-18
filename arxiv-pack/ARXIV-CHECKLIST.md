# ARXIV-CHECKLIST — Angle A draft vs arXiv + systems norms

**Compared:** our Phase-1 LaTeX pack (`latex/`) vs arXiv + CS systems/SE preprint norms  
**Date:** 2026-09-18 ICT · Lit/metadata cutoff same day  
**Empirics:** scripted pilot N=10 + confirmatory LLM N=30 (glm-5.3; F01/F03×M-pay×{B2,B3})

Legend: ✅ done · ⚠️ needs action before submit · ❌ gap / out of scope for Phase-1

---

## A. arXiv submission norms

| Norm | Our draft | Status |
|---|---|---|
| Real author name(s), not anonymous | Authors listed in `main.tex`; affiliation Vietnam Maritime University (IT) | ✅ (names present) |
| Working contact email | `hungkhp888@gmail.com` in TeX | ✅ |
| Co-authors listed only if real | Named co-authors in TeX; **coauthor consent still required before submit** | ⚠️ Consent gate |
| Title + abstract in English | Working EN title + abstract (pilot + LLM confirmatory) | ✅ |
| Primary category | Recommend **cs.SE** (systems/SE harness) or **cs.AI** (LLM agents); optional secondary cs.CR | ⚠️ Choose at submit |
| Endorsement (first-time category) | Not obtained in-pack | ⚠️ **GVHD/endorsement still needed** |
| Prefer TeX source over PDF-only | `latex/main.tex` + `refs.bib` (XeLaTeX + fontspec) | ✅ |
| License chosen at submit | Not set in TeX | ⚠️ Pick at arXiv form |
| No dual anonymous required | arXiv is non-anonymous; fine for preprint | ✅ |

## B. Systems / SE preprint structure

| Norm | Our draft | Status |
|---|---|---|
| Abstract | Pilot + confirmatory LLM claims; caveats (mocks, single model, scripted faults) | ✅ |
| 1 Introduction (claim, contributions, non-goals) | Present | ✅ |
| 2 Background & threat model | ACRFence classes T-AR / T-ARes / T-FS / T-LA | ✅ |
| 3 Formal / effect model | I1–I5 condensed from `formal-model.md` | ✅ |
| 4 System realization | neko-core mapping table | ✅ |
| 5 Methods (baselines, faults, metrics) | B0–B3, F01–F10, mock tools; confirmatory CLI noted | ✅ |
| 6 Evaluation / results | Pilot tables + confirmatory LLM N=30 tables from JSON | ✅ |
| 7 Discussion / limitations | Mocks / single-model / F01+F03 scope; Temporal non-goal | ✅ |
| 8 Related work | Harness surveys, Temporal, ACRFence, AWM, eval benches | ✅ |
| 9 Conclusion | Pilot + confirmatory LLM reported; broader matrix still open | ✅ |
| AI Use Statement | GLM-5.3 for eval re-synthesis only; prose AI-assisted | ✅ |
| Acknowledgments | Stub present | ✅ (expand later) |
| References | `refs.bib` via natbib/plainnat | ✅ |
| Appendix: reproducibility | Pilot + `bun run confirmatory-llm` + aggregate paths | ✅ |
| Appendix: ethics | **Mock-only** (no real pay/email/deploy) | ✅ |
| Appendix: artifact availability | Lab paths + GitHub context; public URL TBD | ⚠️ Public artifact URL at camera-ready |

## C. Integrity / claims hygiene

| Norm | Our draft | Status |
|---|---|---|
| No invented numbers | Tables match `evidence/runs/pilot-*-summary.json` and `confirmatory-llm-*-summary.json` | ✅ |
| Unicode math replaced | ≻ ≤ ≠ → `$\succ$` `$\leq$` `$\neq$` | ✅ |
| Cite only keys in `refs.bib` | Enforced in sources | ✅ |
| Model–harness reporting | Scaffold + `llm/glm-5.3@z.ai` reported in Results | ✅ |
| Confirmatory LLM claimed only where run | Real N=30 F01/F03×M-pay×{B2,B3}; caveats explicit | ✅ |
| Non-goals stated | No Temporal replace; MCP not novelty; no SWE-bench SOTA | ✅ |
| Quartile / venue hype | Not printed as claim in PDF | ✅ (metadata notes only) |

## D. Gaps before public arXiv upload

1. ⚠️ Confirm all coauthors consent to submit (names already in TeX).
2. ⚠️ Confirm author legal name spelling for arXiv account.
3. ⚠️ Select primary category (`cs.SE` preferred for systems framing; `cs.AI` acceptable).
4. ⚠️ Secure **endorsement / GVHD** if required for the chosen category.
5. ⚠️ Point artifact appendix at a public repo/DOI (currently lab paths).
6. ⚠️ Optional: add a simple effect-state diagram figure (textual description exists; figure not required for compile).
7. ⚠️ Q2 path still wants **broader mocks/faults** (and multi-model) later — not a blocker for Phase-1 preprint if caveats stay honest.
8. ✅ Confirmatory LLM N=30 for F01/F03×M-pay×{B2,B3} **is in** (120 cells, 30230 tokens, 0 failures) — do not invent beyond JSON.

## E. Build verification

```bash
cd latex && xelatex main && bibtex main && xelatex main && xelatex main
# Expect: latex/main.pdf and ../paper-arxiv.pdf
# (fontspec → XeLaTeX; pdflatex alone will fail)
```

Reproduce confirmatory aggregates:

```bash
cd ../../eval-harness
bun run confirmatory-llm --fault both --n 30   # requires ZAI_API_KEY
```

---

*Checklist only · Does not invent results or co-authors · 2026-09-18 ICT*
