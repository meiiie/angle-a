# Camera-ready / arXiv–workshop checklist
**Angle A** · Target: arXiv preprint + workshop short paper (Phase 1) · Updated: 2026-09-18 ICT · LIT

Use before any public upload. Check boxes only when verified on disk.

---

## 1. Manuscript files
- [ ] `outline/paper-draft-v0.md` is the assembled source of truth (or exported PDF/LaTeX derived from it)
- [ ] Sections present: Abstract, Intro, Background/Threats, Formal model, System, Methods, Results, Discussion, Related Work, Conclusion
- [ ] `outline/AUTHORS-AND-METADATA.md` title / Darren@VMU / keywords reviewed
- [ ] `outline/positioning-vs-engines.md` non-goals still match Discussion
- [ ] No “Results TBD” / “empirical results pending” left if pilot tables are included (update Abstract + Discussion)
- [ ] Vietnamese glosses kept out of camera-ready EN PDF (ok in lab notes)

## 2. Bibliography
- [ ] All `\cite{...}` keys resolve in `bib/refs.bib` (no invented keys)
- [ ] arXiv / blog / ICML distinctions honest in notes (Not Q where preprint)
- [ ] ACRFence / Temporal / Anthropic / Zylos / surveys URLs still live
- [ ] Export `.bib` alongside PDF for arXiv source bundle if using LaTeX
- [ ] Do **not** add venue Q labels on cited preprints

## 3. Ethics & safety (mock-only)
- [ ] All mutating tools in reported runs are **mocks** (payment, notify, fs, deploy flag)
- [ ] No real money, SMTP, or production deploy in evidence runs
- [ ] Paper states mock-only policy in Methods + ethics note
- [ ] Crash injection scoped to registry/mock boundaries (fault catalog)

## 4. Reproducibility
- [ ] Every table row has `model_id` + `harness_id=neko-core@<gitsha>` or scaffold id + baseline tag
- [ ] Pilot summaries linked: `evidence/runs/pilot-F01-Mpay-N10-summary.json` (and F02/F03/M-fs siblings)
- [ ] Seeds 1–10 documented; fault ids F01–F03 match `protocols/fault-catalog.md`
- [ ] Baselines B0–B3 match `protocols/experiment-protocol.md`
- [ ] Append-only evidence log entry for the upload batch
- [ ] Script / command to regenerate pilot tables from JSON (path TBD before upload)
- [ ] Confirmatory N≥30 / LLM-in-the-loop clearly marked **not** in this version if absent

## 5. Claims hygiene
- [ ] RQ1 claims scoped to reported cells (F01 dups; F02 behavioral note; not F04–F10)
- [ ] RQ2 claims scoped to F03 Authority Resurrection pilot
- [ ] Non-goals explicit: not Temporal replacement; MCP ≠ novelty; not SWE-bench SOTA
- [ ] No invented quartiles on target venue (JSS/ESWA verify notes only; confirm Scopus/JCR before CV)
- [ ] Threats to validity include scripted-agent limit

## 6. arXiv / workshop packaging
- [ ] arXiv category suggestion: `cs.AI` / `cs.SE` (confirm at submit)
- [ ] Workshop CFP formatting (page limit, blind vs non-blind) applied
- [ ] License chosen (arXiv default vs CC)
- [ ] Ancillary: protocols + evidence summaries + `refs.bib`
- [ ] Corresponding author email filled (replace placeholder)
- [ ] Acknowledgments / funding (none / TBD — do not invent)

## 7. Cite-polish standby (LIT)
- [ ] Pass over Related Work vs Results wording after LLM cells land
- [ ] Sync Formal-model I1–I5 wording with Results takeaways
- [ ] Final `rg '\\cite\{'` vs `refs.bib` key audit

---

*LIT · camera-ready checklist · no fake results · mock-only ethics*
