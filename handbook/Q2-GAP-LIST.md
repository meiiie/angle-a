# Q2 Gap List — Honest bar vs top SE/systems journal (JSS-style)

**Lab:** wiii-lab / Angle A  
**Locked finish line (Darren, 2026-09-18 ICT):** **Q2 journal quality** (JSS P0 / ESWA stretch) — **not** Phase-1 arXiv alone.  
**Current pack:** ~21pp arXiv working draft (Wilson CIs in Results; `outline/stats-ci-table.md`); figures in `latex/figures/` + `figures/` (effect-state-machine + threat-map); LLM confirmatory N=30 on F01×{M-pay,M-fs,**M-mail**}, F02×M-pay, F03×M-pay (`eval-harness@scaffold`); neko-core-faithful adapter scripted F01×M-pay N=30 (E-31); MiniMax Code CLI in Related Work.  
**Ground truth pins:** `neko-core@c863cc6`, `wiii-lab@14cd188` (box clones, 2026-09-18 ICT).  
**Status:** living checklist — no invented results.

---

## What “Q2-ready” means here

A JSS-style SE/systems paper typically needs: (1) a **faithful system under test** (production path or faithful adapter, not only a parallel scaffold), (2) **clear figures** for the contribution model and threat, (3) **statistical reporting** beyond raw proportions, (4) **external-validity** breadth, (5) **related-work depth** vs closest systems, (6) **camera-ready venue format**, (7) **public artifact + pinned commits**, (8) **authorship/consent** clean for institutional submit.

Phase-1 arXiv remains an **optional intermediate** for claim staking and feedback. It does **not** close the finish line.

---

## Current vs must-have (a–h)

| ID | Must-have for Q2 submit | Current (honest) | Gap severity |
|----|-------------------------|------------------|--------------|
| **(a)** | Production-path **or** neko-core-faithful harness — not scaffold-only | Scaffold confirmatory still primary for LLM N=30; **plus** neko-core-faithful adapter @ c863cc6 with scripted F01×M-pay×{B2,B3} N=30 (E-31) via real `sealDanglingToolCalls`. Still dual-stack / not full ACP restore | **P0** (partial) |
| **(b)** | Figures: effect **state machine** + **threat** (Action Replay / Authority Resurrection) | **CLOSED:** Fig.1 effect-state-machine + Fig.2 threat-map in `latex/figures/` and `figures/` (PDF/PNG/TeX); embedded in 21pp `paper-arxiv.pdf` | **CLOSED** |
| **(c)** | CI/stats: Wilson/bootstrap **or** exact counts + confidence | **CLOSED:** Wilson score 95% CIs on confirmatory \(k/n\) in Results + `outline/stats-ci-table.md`; 21pp PDF rebuild | **CLOSED** |
| **(d)** | Broader external validity: ≥ **M-mail** **or** second model **or** real neko-core path (already have 2 mocks: M-pay + M-fs) | **CLOSED (third mock):** F01×M-mail×{B2,B3}×N=30 real LLM (E-33); effect=`emails_sent`; B2 dup=30/30 mean=2.0; B3 dup=0/30 mean=1.0 seal=30/30. Still single model `glm-5.3`; neko adapter E-31 scripted-only | **CLOSED** (mock axis) |
| **(e)** | Related-work depth vs Temporal / Restate / LangGraph | Positioning + RW drafts cite Temporal Agent Harness, Zylos, LangGraph as B1/B2 foil; MiniMax Code CLI added | **P1** (partly done — deepen Restate + checkpointer fidelity cites) |
| **(f)** | Camera-ready **Elsevier** (elsarticle) format | arXiv/workshop TeX pack; Elsevier later | **P2** |
| **(g)** | Public artifact + **commit hashes** in paper/repro | Local evidence under `evidence/runs/`; harness_id still `eval-harness@scaffold`; no tagged public release yet | **P0** |
| **(h)** | Author consent / GVHD (institutional endorsement) | `AUTHORS-AND-METADATA.md`: co-authors **consent pending**; D-confirm notes GVHD + coauthor consent still needed | **P0** |

---

## Ranked gaps with next actions

### P0 — block Q2 claim / submit readiness

| Rank | Gap | Why it blocks Q2 | Next action (owner) |
|------|-----|------------------|---------------------|
| **P0-1** | **(a) Scaffold ≠ production path** | Reviewers will ask whether B3 is the real neko-core restore path or a parallel toy. Formal model maps I1–I3 to neko; empirics do not yet. | **Partial close (E-30 smoke + E-31 N=30):** adapter confirmatory F01×M-pay×{B2,B3} N=30 scripted — B2 dup=1.0 charge=2.0; B3 dup=0.0 charge=1.0 seal+reconcile; `harness_id=neko-core@c863cc6+eval-adapter@14cd188`; matches scaffold E-22 dup/charge. **Remaining:** no ACP `session/load`, no live `Provider.complete`/`runLoop`, EffectJournal/I5 still lab-side, crash=in-process. Continue E3–E5 (ACP path / journal merge / LLM-on-adapter optional). **EVAL + eng** |
| **P0-2** | **(d) External validity (third mock)** | ~~Thin (2 mocks)~~ → **CLOSED** on M-mail axis | E-33 F01×M-mail×{B2,B3}×N=30: B2 dup_rate=1.0 mean_emails=2.0; B3 dup_rate=0.0 mean_emails=1.0 seal_unknown=1.0; errors=0. Optional stretch: 2nd model. **EVAL** done for M-mail |
| **P0-3** | **(c) CI / confidence reporting** | ~~No intervals~~ → **CLOSED** | Wilson 95% on exact \(k/n\) in Results + `outline/stats-ci-table.md`; cited in 21pp `paper-arxiv.pdf`. **SCRIBE** done |
| **P0-4** | **(b) Contribution figures** | ~~Missing~~ → **CLOSED** | Fig.1 `effect-state-machine` + Fig.2 `threat-map` in `latex/figures/` and mirrored `figures/` (PDF/PNG/TeX). **LIT/SCRIBE** done |
| **P0-5** | **(g)+(h) Artifact + consent/GVHD** | Cannot submit cleanly without pinned public code + written co-author consent / advisor endorsement. | Tag release with `neko-core` + `wiii-lab` SHAs; fill REPRO with hashes; collect written consent for all listed co-authors; secure GVHD/endorsement. **Darren / No** |

### P1 — strengthen acceptance odds

| Gap | Next action |
|-----|-------------|
| **(e) RW depth** | One tight paragraph + table row each for **Restate** durable handlers and **LangGraph** checkpointer (what is / is not an effect journal). Keep non-goal framing. Sync MiniMax Code CLI (not Mini-Agent) as permission-gate foil only. **LIT** |
| Threats-to-validity polish | Explicit: scaffold-vs-production (until P0-1 lands); single-model GLM; mock-only ethics; F02 conservative-B3 reading already locked. **LIT** |
| Full factorial honesty | Do **not** claim F04–F10 or B0–B1 LLM matrix; either run or keep out of claims. **No/EVAL** |

### P2 — packaging / later

| Gap | Next action |
|-----|-------------|
| **(f) Elsevier camera-ready** | After technical P0s: elsarticle + highlights + graphical abstract per JSS guide. **SCRIBE** |
| Page/word budget for ESWA stretch | Only if applied intelligent-system framing + stronger eval breadth. **MIVEN/LIT** |

---

## What is already strong enough to keep

- Locked Angle A (unknown_outcome + authority-aware replay); formal model I1–I5.
- Protocols + fault catalog; mock-only ethics.
- Scripted pilots N=10 + **real** LLM confirmatory N=30 (F01 M-pay/M-fs/M-mail, F02/F03 M-pay) with evidence on disk — **do not invent further rates**.
- Wilson 95% CIs on confirmatory \(k/n\) (`outline/stats-ci-table.md`) + contribution figures (`latex/figures/`).
- neko-core-faithful adapter scripted confirmatory N=30 F01×M-pay (E-31) — separate `harness_id`; do not mix with scaffold rows without a separation line.
- Positioning vs Temporal/Zylos/LangGraph; MiniMax Code CLI correctly scoped (Low for core RQ1).
- F02 interpretation locked: B3 conservative on T-LA, not “always more complete.”

---

## Explicit non-finish-lines

- Uploading Phase-1 arXiv **alone** ≠ Q2 done.
- Scaffold duplicate-rate 0 vs 1 **without** neko-core-faithful path or honest limitation section ≠ JSS-ready systems claim.
- Venue quartile screenshots still need official Scopus/JCR before CV wording (`notes/VENUE-VERIFY-*.md`).

---

## Tracking

| When (ICT) | Note |
|------------|------|
| 2026-09-18 ~21:34 | Gap list created from Darren finish-line lock; P0 eng survey → `outline/neko-core-eval-path.md`. |
| 2026-09-18 ~21:41 | P0-1 **partial close**: E-31 confirmatory-neko-seal F01×M-pay N=30 (scripted); dup/charge match scaffold; remaining fidelity gaps listed in P0-1 next-action. |
| 2026-09-18 ~21:46 | P0-3 **CLOSED** (Wilson CIs + 21pp PDF). P0-4 **CLOSED** (effect-state-machine + threat-map in `latex/figures/`). P0-1 remains **PARTIAL** (E-31). P0-2 **CLOSED** (M-mail axis): E-33 F01×M-mail N=30 — B2 dup=30/30 emails=2.0; B3 dup=0/30 emails=1.0 seal=30/30; CLI `--mock M-mail`. |

*No fabricated empirics. Update this file when a P0 closes with evidence IDs.*
