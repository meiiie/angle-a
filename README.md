# Angle A — crash-consistent durable agent harness

Paper + evaluation artifact for **The Wiii Lab** (`meiiie`).

| Role | Repo |
|------|------|
| **This repo** | Paper artifact (protocols, formal model, eval-harness, evidence aggregates, TeX) |
| **SUT (do not confuse)** | [`meiiie/neko-core`](https://github.com/meiiie/neko-core) @ **`c863cc6`** |
| **ADE product (not this)** | [`meiiie/wiii`](https://github.com/meiiie/wiii) |

Finish line: Scopus/WoS **Q2** systems/SE (JSS P0). arXiv is optional intermediate only.

## Layout
- `handbook/` — RQ, venues, Q2 gap list
- `protocols/` — fault catalog + experiment protocol
- `outline/` — formal model + section drafts
- `eval-harness/` — scaffold + neko-core-faithful adapter
- `evidence/` — aggregate JSON + logs (not every per-seed dir)
- `arxiv-pack/` — LaTeX + figures + reproducibility

## Reproduce
See `arxiv-pack/REPRODUCIBILITY.md`. Never commit `.secrets.env` / API keys.

## License
MIT (same spirit as neko-core); cite neko-core commit pin in any paper claim.
