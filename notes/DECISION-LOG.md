# Decision Log

## 2026-09-18
- **D1:** Lock Angle A (unknown_outcome + authority-aware replay). Darren skipped chooser → default recommend.
- **D2:** Target **Scopus/WoS Q2 systems/SE** primary; Q1 stretch only.
- **D3:** Lab workspace + handbook created under `/workspace/research/wiii-lab/`.
- **D4:** Create teammate bots LIT + EVAL for lit/venues and experiments/evidence.
- **D5:** Foundations are mostly arXiv/blog/ICML — do not fake Q labels on them.

## 2026-09-18 (evening)
- **D6:** Darren grants No full lead until paper complete; clone neko/wiii authorized.
- **D7:** Repos at `/workspace/research/repos/{neko-core,wiii}`.
- **D8:** formal-model.md v0.1 published (E-05); EVAL must map faults to I1–I5; no crash runs until protocol review.
- **D9:** Accepted LIT M1–M4 (JSS verify + bib + related-work + 3 PDFs). Next LIT: FOUNDATION venue column + ESWA verify + map cites→I1–I5.
- **D10:** Code audit E-08 confirms I1–I3/I6 in neko; I5 (authority consume) + explicit effect journal = main B3 engineering; formal-model appendix A added (v0.2 notes).
- **D11:** LIT ESWA verify accepted (stretch Q1 credible w/ Scopus caveat). Next LIT: §Related Work draft + positioning-vs-engines table.
- **D12:** Accepted LIT Related Work + positioning drafts (E-10).
- **D13:** Accepted EVAL fault-catalog + experiment-protocol as E-04 (retro-id). Greenlight: implement mock+B3 journal *scaffold* under `eval-harness/`; pilot N=10 only after scaffold review; no full factorial yet.
- **D14:** Accepted LIT Introduction (E-12). Assembled `outline/paper-draft-v0.md` (intro+RW+methods pointers). Next LIT: §Methods from E-04 protocols.
- **D15:** Accepted LIT Methods (E-13). paper-draft-v0 rebuilt with Intro+Formal ptr+Methods+Results TBD+RW. Nudged EVAL on eval-harness lag.
- **D16:** Accepted Abstract+Discussion (E-14). paper-draft-v0 now prose-complete (results pending). If EVAL still blocked, No/executor builds eval-harness.
- **D17:** Accepted LIT Conclusion + metadata (E-15). LIT idle. Waiting eval-harness executor.
- **D18:** eval-harness scaffold accepted. Smoke F01×M-pay: B0 duplicates, B3 does not (scripted agent — not LLM). Next: EVAL owns pilot N=10 on F01–F03 × M-pay/M-fs; no confirmatory matrix yet.
- **D19:** Pilot N=10 complete for F01 (pay+fs), F02/F03 (pay). Results section written from real aggregates. Continuous push: next LLM-re-synthesis stub + camera-ready pack.
- **D20:** `--resynthesize` driver mode + F04 stub landed. Pilot F01×M-pay resynth N=10: B2 duplicate_effect_rate=1.0, B3=0.0 (journal/reconcile). Evidence: `pilot-F01-Mpay-resynth-N10-summary.json`.
- **D20:** Resynthesis pilot confirms B3≻B2 on F01 (dup 0 vs 1). Results §8 + arxiv-pack refreshed. Next: PDF/camera-ready + Darren review gate before submit.
- **D21:** LIT Abstract/Intro + cite audit accepted (E-18). Phase-1 draft ready for Darren review gate before arXiv.

## D-20260918-glm-llm-driver
- When: 2026-09-18 14:03 UTC
- Decision: Use GLM 5.3 via z.ai OpenAI Chat Completions for LLM-in-the-loop confirmatory cells. Primary base URL `https://api.z.ai/api/coding/paas/v4`; fallback `https://api.z.ai/api/paas/v4`. Env: `ZAI_API_KEY` from box secret / `.secrets.env` (gitignored). Default `reasoning_effort=low` for budget; `max` only for hard semantic cases.

- **D22:** Wire z.ai **glm-5.3** as eval-harness LLM agent driver (`--driver llm --model glm-5.3`). Auth via `ZAI_API_KEY` (`.secrets.env`, gitignored; never echoed). Prefer `https://api.z.ai/api/coding/paas/v4` then `paas/v4`. Pilot cells use `thinking.enabled` + `reasoning_effort=low`. B2 invokes LLM-resynthesized args (Action Replay); B3 records LLM proposal but reconciles (no blind re-issue). Smoke E-21: B2 dup=1 / B3 dup=0. N=30 token est ≈7.6k from smoke mean (not a billing quote). Next: confirmatory matrix only after Darren gate.

## D-20260918-confirm-llm-N30-paper
- When: 2026-09-18 ~21:10 ICT
- Decision: Phase-1 empirics now include **real confirmatory LLM N=30** (glm-5.3 / z.ai, `reasoning_effort=low`) on F01/F03×M-pay×{B2,B3}: **120 cells, 30230 tokens, 0 failures**. Headline rates match scripted pilots (F01 B2 dup=1.0/charge=2.0 vs B3 dup=0.0/charge=1.0/seal=1.0; F03 B2 auth_resurrection=1.0/charge=1.0 vs B3 0.0/0.0). Paper pack upgraded (outline Results §9 verified vs JSON; abstract/results/LaTeX/AI Use/REPRO/ARXIV-CHECKLIST).
- Still need before submit: **GVHD/endorsement** + **coauthor consent**.
- Q2 path still wants **broader mocks/faults** (and multi-model) later — do not inflate beyond reported cells.

## 2026-09-18 (MIVEN) — RQ/Q/lab orientation for Darren
- Confirmed: primary RQ is lab RQ1 (unknown outcomes + authority-aware replay / crash-consistent tool-boundary semantics), not model training.
- Venue strategy: Phase1 arXiv/workshop → Phase2 Scopus/WoS **Q2 floor** (JSS P0); Q1 stretch (e.g. ESWA) if results strong.
- Lab OS already at `/workspace/research/wiii-lab` (handbook, evidence IDs, protocols, outline, bib). MIVEN early notes under `/workspace/meiiie/research/` are superseded by wiii-lab for claims.
- Bots: No (lead), LIT, EVAL, SCRIBE, MIVEN (strategy). No new agents created (roles covered).

## D-20260918-minimax-mini-agent
- When: 2026-09-18 ~21:16 ICT
- Decision: Treat **MiniMax-AI/Mini-Agent**
- **CORRECTED ~21:25 ICT:** Tweet 2100928718541853038 announced **Code CLI**, not Mini-Agent. Mini-Agent decision (optional complementary demo RW) still valid for that repo; see D-20260918-minimax-code-cli.
- Decision (original): Treat **MiniMax-AI/Mini-Agent** as optional complementary Related Work (vendor demo harness: notes + summarization + MCP), **not** an Angle A competitor. Do **not** claim MiniMax solves Action Replay / unknown_outcome / authority consume. Distinguish official Mini-Agent from unofficial npm/PyPI `minimax-harness`.
- LIT: optional bib key `minimax2026miniagent` — add only if RW needs a one-sentence vendor-harness cite; omit if word budget tight. Evidence: E-20260918-25.

## D-20260918-minimax-code-cli
- When: 2026-09-18 ~21:25 ICT
- Decision: Treat **MiniMax-AI/minimax-code (Code CLI)** as the artifact announced in tweet 2100928718541853038. **Correct earlier Mini-Agent tweet attribution** (E-25 / D-20260918-minimax-mini-agent): Mini-Agent is a different older demo; Code CLI is today’s OSS coding-agent harness.
- RQ1: **Medium** relevance for I4/I5 discussion only (inspectable allow/deny/ask + allowOnce/allowAlways permission gate); **Low** for core RQ1 (no unknown_outcome, effect journal, crash-restore Action Replay). Do **not** change Angle A paper claims.
- Prefer Code CLI over Mini-Agent if Related Work needs a MiniMax vendor-harness sentence. Optional bib key `minimax2026codecli`. Evidence: E-20260918-26.

## 2026-09-18 (evening) — EVAL / No
- **D-E28:** Keep E-20260918-28 (F02×M-pay LLM N=30) for paper — not exploratory.
- **F02 interpretation (locked for Results/Discussion):** mid-mutation; B2 completes 1 charge (`dup=0`); B3 seals unknown and rejects (`charge=0`, no replay). Honest framing: B3 is **conservative on T-LA** (lost-ack), not “always more complete.”
- No further confirmatory matrices unless No assigns.

## D-20260918-q2-finish-line
- When: 2026-09-18 ~21:34 ICT
- Decision (Darren lock): **Finish line = Q2 journal bar** (JSS P0 / ESWA stretch). **Phase-1 arXiv is an optional intermediate, not the stop.**
- Implications:
  - Do not treat 19pp arXiv pack + scaffold LLM N=30 as complete.
  - Prioritize P0 gaps in `handbook/Q2-GAP-LIST.md`: neko-core-faithful harness (or honest production path), figures, CI/stats, external validity (M-mail / 2nd model / neko path), public artifact+SHAs, author consent/GVHD.
  - Empirics remain evidence-bound: no invented cells or rates.
- First eng step: survey neko-core `sealDanglingToolCalls` / `durableCheckpoint` / `unknown_outcome` → `outline/neko-core-eval-path.md`.

## D-20260918-neko-adapter-e2
- When: 2026-09-18 ~21:40 ICT
- Decision: Land **Option A minimal faithful adapter** (E2 seal fixture) under `eval-harness/src/adapters/neko-core/`. Restore uses real `Agent.sealDanglingToolCalls` @ `neko-core@c863cc6`; B3 journal stays lab-side (dual-stack). Smoke F01×M-pay×{B2,B3} N=1 scripted OK (E-30): B2 blind replay dup; B3 seal+reconcile no blind replay.
- Still differs from full neko ACP session restore (no runLoop/Provider, no session.ts atomic store, no ToolRegistry-hosted mocks, in-process CrashSignal).
- Next: Darren/No review before any N=30 on adapter; do not mix harness_id rows; E3–E5 per `outline/neko-core-eval-path.md` as follow-ons.
