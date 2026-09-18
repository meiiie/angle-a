# Public artifact checklist (Q2 P0-5) — decided 2026-09-18 ICT

## Decision
- **SUT:** existing public `https://github.com/meiiie/neko-core` @ pin `c863cc6` (do **not** replace / fork for the paper).
- **Paper + eval pack:** land under existing `https://github.com/meiiie/wiii` at `papers/angle-a/` (lab umbrella). **No third repo** unless wiii push is blocked.
- Optional later: Zenodo DOI for aggregate JSON + PDF snapshot.

## Layout under wiii (planned)
```
papers/angle-a/
  README.md                 # claim, pins, how to reproduce
  REPRODUCIBILITY.md
  protocols/
  outline/formal-model.md
  eval-harness/             # no .secrets.env
  evidence/runs/*-summary.json
  arxiv-pack/latex/ + figures/
  CITATION.cff
```

## Needs before push
- [ ] `gh` auth on box (Darren)
- [ ] Co-author written consent
- [ ] GVHD/endorsement timing
