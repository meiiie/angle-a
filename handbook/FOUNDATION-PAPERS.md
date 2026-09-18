# Foundation papers / sources (cutoff 2026-09-18)

**Honest note:** Many 2025–2026 “harness” sources are still **arXiv / eng blogs**, not Scopus Q journals yet. Top *conferences* (ICML/NeurIPS/ICLR) are not “Q1 journals” but are often valued ≥ Q1 for CS career tracks in VN. Quartiles below are **approx. from Scimago/secondary indexes — re-verify on Scopus before listing on CV**.

**Target-venue context (not these foundations):** Our P0 *Journal of Systems and Software* verify (`notes/VENUE-VERIFY-JSS-2026-09-18.md`, `handbook/TARGET-VENUES.md`) shows Scimago-derived **Q1** vs WoS secondary **Q2**, ScienceDirect CiteScore **9.4** / IF **4.1** — confirm before CV. That is about *where we submit*, not a claim that Tier 0–2 works are in JSS.

## Tier 0 — define the problem (must cite)

| Work | Where published | Q / rank (honest) | Role for us |
|---|---|---|---|
| ACRFence — *Preventing Semantic Rollback Attacks…* | **arXiv:2603.20625** (2026-03); **no confirmed journal/conf acceptance** as of 2026-09-18 ICT (bib note: abs `journal_ref` CoDAIM workshop — unverified proceedings) | **Not Q (preprint)** | Names Action Replay / Authority Resurrection — our threat model |
| Zylos — *Durable Execution for AI Agent Runtimes* | Industry research note (2026-04) | **Not Q (industry)** | Checkpoint ≠ durable execution |
| Anthropic — *Effective harnesses for long-running agents* | Engineering blog (2025-11) | **Not Q (blog)** | Cross-session harness practice |
| Temporal — *Temporal Agent Harness* | Temporal blog (2026-08) | **Not Q (blog)** | Outer vs inner harness; baseline positioning |

## Tier 1 — vocabulary & framing

| Work | Where | Q / rank | Role |
|---|---|---|---|
| Li et al. — *Agent Harness Engineering: A Survey* (ETCLOVG) | Survey PDF / OpenReview-linked (2026) | **Not Q (preprint / survey track)** — not a confirmed Scopus journal | Harness taxonomy |
| *From QA to Task Completion: Survey on Agent System and Harness Design* | **arXiv:2606.20683** (2026) | **Not Q (preprint)** | Model–harness lens |
| Wang et al. — *Agent Workflow Memory (AWM)* | **ICML 2025** (PMLR 267) | Top-tier **conference** ICML 2025 — **not a Scopus journal quartile** | Procedural workflows ≠ our control journal |

## Tier 2 — authority / tokens / eval methodology

| Work | Where | Q / rank | Role |
|---|---|---|---|
| Beyond Single-Use Tokens | **arXiv:2608.01710** (2026-08) | **Not Q (preprint)** | Authority consumption |
| AC4A | **arXiv:2603.20933** (2026-03) | **Not Q (preprint)** | Fine-grained permissions |
| Harness-Bench | **arXiv:2605.27922** (2026-05) | **Not Q (preprint)** | Report model–harness pairs |
| AgencyBench | **arXiv:2601.11044** (2026-01); abs comment claims ACL 2026 Main — **camera-ready/DOI not verified here** | **Not Q (preprint)** until proceedings confirm | Scaffold effects |
| HAL | **arXiv:2510.11977** (2025-10) | **Not Q (preprint)** | Holistic agent eval |

## Tier 3 — classical systems (for journal rigor)

| Work | Where | Typical standing | Role |
|---|---|---|---|
| Stripe idempotency / outbox pattern docs | Industry standards | N/A — **Not Q (industry)** | Effect receipts |
| Temporal durable execution docs | Product docs | N/A — **Not Q (industry)** | Workflow baseline |
| LangGraph persistence / durable execution docs | Product docs | N/A — **Not Q (industry)** | Checkpoint baseline |

## Implication
Our paper’s **related work** leans on preprints + ICML + eng sources (normal for fast-moving agent systems). For **Scopus Q**, *we* must land in a journal/workshop→journal path — the foundations are mostly not “Q papers” yet.

---

### Verified notes (2026-09-18 ICT)
- Cross-checked titles/venues against `bib/refs.bib` (`acrfence2026`, `guo2026fromqa`, `awm2025`, `beyondtokens2026`, etc.).
- **Do not invent acceptance** for ACRFence or other arXiv-only rows; keep preprint vs conference vs blog/industry explicit.
- AWM = ICML conference standing, not journal Q.
- Lab target-venue Q caveats live in `notes/VENUE-VERIFY-JSS-2026-09-18.md` / `TARGET-VENUES.md` (context only).
