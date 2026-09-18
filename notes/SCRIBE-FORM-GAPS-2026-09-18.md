# SCRIBE form gaps vs CCS / ACRFence norms
**Angle A** · 2026-09-18 ICT · After SCRIBE threat-model + AI Use edit

Source of truth for camera-ready TeX: `arxiv-pack/latex/main.tex` (XeLaTeX + fontspec).
Companion PDF: `arxiv-pack/paper-arxiv.pdf`.

Legend: ✅ present in pack · ⚠️ action before public submit · ❌ out of Phase-1 scope / missing on purpose

---

## Done this SCRIBE pass
| Item | Status | Where |
|---|---|---|
| Author block (5 names; only Hùng email) | ✅ verified (not re-edited) | `main.tex` `\author` |
| Early threat model (assets, adversaries, invariants, OOS) | ✅ sharpened | `main.tex` §2 `Threat model (ACRFence-style)` |
| Named threats T-AR / T-ARes / T-FS / T-LA | ✅ kept | §2 Threat classes |
| AI Use Statement | ✅ added | `\section*{AI Use Statement}` before Acknowledgments |
| Ethics (mock-only) appendix | ✅ | Appendix Ethics |
| Artifact availability appendix | ⚠️ lab paths + GitHub org; public URL TBD | Appendix Artifact |
| Reproducibility appendix | ✅ commands + aggregate JSON names | Appendix Reproducibility |
| XeLaTeX rebuild | ✅ (this pass) | `latex/main.pdf` → `paper-arxiv.pdf` |

---

## Remaining CCS / ACRFence-style gaps (ranked)

### Before arXiv / workshop upload
1. ⚠️ **Co-author consent in writing** — `outline/AUTHORS-AND-METADATA.md` marks Hồng, Linh, Thảo, Long as **consent pending**; dept/role still “confirm”. Do not invent co-author emails.
2. ⚠️ **Metadata drift** — `arxiv-pack/AUTHORS-AND-METADATA.md` and `ARXIV-CHECKLIST.md` still describe placeholder “Darren” / redacted email; TeX is ahead. Sync stubs to match TeX + outline before submit.
3. ⚠️ **Public artifact URL / DOI** — Appendix still cites lab path `/workspace/.../eval-harness` and `github.com/meiiie` without a frozen public commit/DOI.
4. ⚠️ **Acknowledgments** — still “Placeholder---expand before camera-ready”; do not invent funding.
5. ⚠️ **arXiv form choices** — primary category (`cs.SE` preferred / `cs.AI` ok), license, endorsement if first-time category.

### Claim ↔ evidence hygiene (writing / EVAL)
6. ⚠️ **Evidence IDs not inlined in TeX claim/results** — MD Intro cites `E-20260918-17` for F01-resynth; LaTeX Claim paragraph and §Results list aggregate JSON filenames but **omit `E-…` IDs**. Handbook rule: every claim → evidence ID. Next polish: add E-16 (F01–F03 N=10) and E-17 (resynth) beside tables / claim.
7. ⚠️ **F03 claim in Intro** lacks explicit E-16 pointer (numbers exist; ID missing).
8. ❌ **F04–F10** — catalogued in protocols; **no pilot cells** in Results (Phase-1 correctly scoped to F01–F03 + resynth). Do not invent.
9. ❌ **Confirmatory LLM-in-the-loop / N≥30** — explicitly future work; scripted scaffold only. Do not invent.

### Form / packaging polish
10. ⚠️ **`paper.md` / `paper-draft-v0.md` stub sections** — Background/Threat Model still “expand later” pointers; TeX is full. Prefer TeX as submit source; sync MD or mark TeX SoT in README.
11. ⚠️ **Camera-ready checklist** (`outline/CAMERA-READY-CHECKLIST.md`) — boxes still unchecked; run a verify pass against disk.
12. ⚠️ **Optional figure** — effect-state diagram still textual only (checklist notes figure optional).
13. ⚠️ **Venue Q labels** — keep out of PDF; JSS/ESWA standing needs Scopus/JCR screenshot before CV claims (`TARGET-VENUES.md`).

---

## Not gaps (already aligned)
- Early threat model placement (before formal model) — ACRFence-style ✅
- Non-goals / Temporal non-replacement stated ✅
- Mock-only ethics in Methods + appendix ✅
- No invented pilot numbers (tables match summary JSON) ✅
- AI Use disclosure ✅ (this pass)

---

## Recommended next owners
| Owner | Action |
|---|---|
| **Darren** | Co-author consent + affiliation confirm; ack/funding truth; arXiv account name/email |
| **No / SCRIBE** | Inline E-16/E-17 in §Intro claim + §Results; sync `arxiv-pack/AUTHORS-AND-METADATA.md` |
| **EVAL** | Confirmatory LLM cells / N≥30; F04+ only when greenlit — not for Phase-1 invent |
| **LIT** | Cite audit after evidence-ID polish; leave venue Q off PDF |

---
*SCRIBE · form-gap note · no invented results or co-author emails*
