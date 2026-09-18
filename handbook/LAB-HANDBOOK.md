# Wiii Lab Handbook — Operating System

## Mission
Publish a Scopus/WoS-track paper on **tool-boundary effect semantics** for durable LLM agents (Angle A), using open artifacts `neko-core` + `wiii`.

## Roles
| Role | Who | Duty |
|---|---|---|
| Lead / synthesis | **No** | RQ, claims, paper narrative, Darren interface |
| Strategy history | **MIVEN** | Career/funding context; handoff already done |
| Literature & venues | **LIT** | Citations, PDFs, venue/Q checks, related-work diffs |
| Experiments & evidence | **EVAL** | Fault protocols, runs, traces, evidence IDs |

## Cadence
- **Daily (when active):** update `notes/DECISION-LOG.md` + evidence IDs used.
- **Weekly:** `notes/weekly/YYYY-MM-DD.md` — what moved, blockers, next 3 tasks.
- **Before any claim in draft:** link `evidence/EVIDENCE-LOG.md#E-xxx` or a citation key.

## Artifact standards
- **Evidence ID:** `E-YYYYMMDD-NN` (e.g. `E-20260918-01`)
- **Run folder:** `evidence/runs/<E-id>/` with `meta.json`, `stdout.log`, crash markers
- **Bib key:** `AuthorYearShort` in `bib/refs.bib`
- **Never** invent quartile numbers — verify Scopus/Scimago before handbook updates

## Safety / scope locks
- Fixed model in ablations; report model–harness pair
- No Temporal rebuild; no “MCP support” as novelty
- Crash-injection only on **mock** mutating tools unless Darren explicitly expands

## How to start a work session
1. Read `RQ-AND-CLAIMS.md`
2. Read latest decision log entry
3. Do one deliverable → write evidence/decision
4. Sync lead (No) with short status for Darren
