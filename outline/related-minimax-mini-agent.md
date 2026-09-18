# Related: MiniMax Mini-Agent (OSS harness demo)

**Audit date:** 2026-09-18 ~21:16 ICT  
**RQ1 relevance:** **Low** (complementary demo harness; not a duplicate of Angle A)  
**Clone:** `/workspace/research/repos/Mini-Agent` (shallow, depth 1)  
**HEAD:** `d76a4f6389688cabda39c224a6cdfa274215d47c` (2026-02-14 +0800)  
**Tweet (CORRECTED):** https://x.com/MiniMaxAgent/status/2100928718541853038 was **not** a Mini-Agent announcement. X API read 2026-09-18 ~21:20 ICT: article **“MiniMax Code CLI Is Now Open Source”** by `@MiniMaxAgent` (2026-09-18 12:43 UTC / 19:43 ICT). See `outline/related-minimax-code-cli.md`. Mini-Agent remains a separate older demo harness; this note’s RQ1 audit of Mini-Agent source still stands.

---

## What it is

**Official:** [MiniMax-AI/Mini-Agent](https://github.com/MiniMax-AI/Mini-Agent) — MiniMax’s open-source **minimal single-agent demo harness** for MiniMax M2.x / M3 via Anthropic-compatible APIs. PyPI/Git install name: `mini-agent` (`uv tool install git+https://github.com/MiniMax-AI/Mini-Agent.git`). MIT. Self-described as a teaching/demo project showcasing execution loop + “production-grade” *features for demos*, not crash-consistent tool semantics.

**Not the same thing (unofficial / distinct):**

| Artifact | Relation to MiniMax-AI |
|---|---|
| **MiniMax-AI/Mini-Agent** (`mini-agent`) | **Official** OSS demo harness (this note). |
| **npm `minimax-harness`** / claimed PyPI `minimax-harness` | **Unofficial** third-party coding harness (plan-critique gating, MCP, bench lab). npm wrapper exists; PyPI distribution was noted unpublished / wheel-only alpha — **do not cite as MiniMax official**. |
| **pypi `minimax-agent`** (villamarket.ai) | Unrelated third-party CLI/serve stack. |
| **civaapple-alt/mini-agent-harness** (Rust) | Unrelated community harness; coincidental naming. |

---

## Architecture sketch

```
CLI (prompt_toolkit REPL) / optional ACP (Zed)
        │
        ▼
   Agent.run() loop  ──►  LLM client (Anthropic/OpenAI-compat MiniMax)
        │                      ▲
        │ tool_calls           │ messages + tool schemas
        ▼
   Tool registry: Read/Write/Edit, Bash (+ background shells),
                  SessionNoteTool / RecallNoteTool,
                  Claude Skills loader, MCP tools (stdio/SSE/HTTP)
        │
        ▼
   ToolResult { success: bool, content, error }   ← binary, not ternary
        │
        ├── in-memory Message[] history (+ LLM summarization when over token_limit)
        ├── ~/.mini-agent/log/agent_run_*.log     (debug logs, not recovery journal)
        └── workspace/.agent_memory.json          (opt-in session notes)
```

Core files audited: `mini_agent/agent.py`, `cli.py`, `tools/{base,note_tool,bash_tool,mcp_loader}.py`, `retry.py`, `logger.py`, `docs/{DEVELOPMENT,PRODUCTION}_GUIDE.md`, `examples/03_session_notes.py`, `tests/test_session_integration.py`.

---

## Audit vs Angle A / RQ1 keywords

| Concern | Present? | Evidence |
|---|---|---|
| Session persistence | **Partial (notes only)** | `SessionNoteTool` → JSON file; in-process `messages[]`; CLI `FileHistory` for *prompt* history. No durable control-plane session restore. |
| Checkpoint / resume | **No** (for crash/restore) | Only comment: cancel “at next safe checkpoint” (`agent.py` ~326). `/clear` resets in-memory history. No resume-from-disk of agent steps. |
| Crash recovery | **No** | PRODUCTION_GUIDE calls it teaching-level; upgrade path is context/model-pool, not effect recovery. |
| Tool-call idempotency | **No** | No idempotency keys; tools re-execute on every call. |
| `unknown_outcome` / timeout ternary | **No** | MCP/bash timeouts → `ToolResult(success=False, error=...)`. Binary success/fail; timed-out ≠ sealed unknown. |
| Authority / approval gates | **No** | No human-approval consume, CapLease, or policy seam before mutate. |
| Effect journaling / reconcile | **No** | Logger writes run logs for debugging; not an effect journal; no reconcile path. |
| Replay (Action Replay) | **No** | N/A — no restore→re-issue protocol. |
| MCP | **Yes** | First-class MCP loader + timeouts (`mcp_loader.py`). |
| Context summarization | **Yes** | `_summarize_messages` when local/API tokens exceed `token_limit`. |
| LLM retry | **Yes** | Exponential backoff on LLM calls only (`retry.py`) — not tool-effect safety. |

**Grep note:** `checkpoint|resume|durable|crash|idempoten|replay|authority|approval|reconcile` essentially absent from core (except cancel “checkpoint” wording and “Unknown tool”). `session|timeout|summar*|persist` hit notes, MCP timeouts, and summarization.

---

## What it DOES vs does NOT cover relative to RQ1

**DOES (orthogonal / complementary):**

- Clean demo of MiniMax-model agent loop + tools + MCP + Skills.
- Cross-session *semantic* memory via agent-writable notes (not effect journal).
- Context-window management via summarization.
- Explicit teaching stance: PRODUCTION_GUIDE lists demo limits and upgrade directions (still about context/hallucination/deploy, not ternary effects).

**DOES NOT (Angle A gap remains):**

- Crash-consistent sessions at tool boundaries.
- `unknown_outcome` sealing / reconcile before re-issue.
- Authority consumption / anti–Authority Resurrection.
- Effect journal or Action Replay mitigation under semantic re-synthesis.
- Anything resembling B3 vs B0–B2 baselines.

**Honest positioning:** complementary **model-vendor demo harness**, analogous in spirit to Anthropic’s long-running harness *practice* notes (continuity of work), **not** a Temporal-style durable outer harness and **not** a neko-core / Angle A duplicate.

---

## Citation-ready bib snippet

```bibtex
@misc{minimax2026miniagent,
  title        = {Mini-Agent: Minimal Single-Agent Demo Harness},
  author       = {{MiniMax-AI}},
  howpublished = {GitHub repository},
  year         = {2026},
  url          = {https://github.com/MiniMax-AI/Mini-Agent},
  note         = {Tier 1 optional; Not Q. Official MiniMax OSS demo harness (session notes + context summarization + MCP). Complementary to Angle A; does not implement unknown\_outcome, authority consume, or effect journaling. Clone audited 2026-09-18 @ d76a4f6. Distinguish from unofficial npm/PyPI ``minimax-harness''.}
}
```

**LIT-ready:** Optional add to `bib/refs.bib` as `minimax2026miniagent` if Related Work wants a one-sentence vendor-harness demo cite next to Anthropic harness practice. **Not required for Phase-1 claims.** Prefer omit if word budget is tight; do **not** invent that MiniMax solves Action Replay.

---

## Recommended Related Work (1–2 sentences)

MiniMax’s open-source Mini-Agent is a minimal vendor demo harness (execution loop, MCP, session notes, context summarization) for MiniMax models \cite{minimax2026miniagent}. It illustrates continuity-of-work practices but does not provide crash-consistent tool-boundary journals, `unknown_outcome` sealing, or authority consumption—so it is complementary related practice, not a substitute for Angle A’s ternary effect semantics.

---

## Steal for discussion / future work only

*(Do **not** change paper claims; do **not** invent MiniMax coverage of Action Replay.)*

1. **Session notes as distinct object** — keep conversation memory / notes / effect journal / procedural memory as four separate boxes (aligns with AWM trap already in RW).
2. **Token-triggered execution summarization** — pattern for long runs; orthogonal to effect durability; possible future-work mention for “context hygiene vs effect hygiene.”
3. **MCP timeout → explicit error** — good UX; Angle A would still want timeout-during-mutate → `unknown` seal, not binary fail (discussion contrast).
4. **PRODUCTION_GUIDE honesty** — cite as example of industry demos acknowledging “demo ≠ production durability” without claiming they solved RQ1.
5. **Cancel cleanup of incomplete assistant/tool messages** — soft consistency for UX cancel; not crash recovery.

---

## Key gaps vs Angle A (summary)

| Angle A (I1–I5) | Mini-Agent |
|---|---|
| I1 pre-effect durability | Missing |
| I2 unknown ≠ success | Missing (binary ToolResult) |
| I3 no blind replay from unknown | Missing (no restore path) |
| I4 authority intersection | Missing |
| I5 authority consumption | Missing |

**Relevance score for RQ1: Low** — cite only as complementary harness demo if at all.
