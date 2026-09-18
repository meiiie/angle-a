# RQ & Claims (locked 2026-09-18)

## RQ1 (primary)
**EN:** Under intentional crash/restore at tool boundaries, does a harness that (1) separates transport from effect, (2) keeps an `unknown` control state with reconciliation, and (3) consumes authority at effect confirmation reduce **duplicate external effects** compared with checkpoint-only and checkpoint+idempotency-key baselines, under a fixed model?

**VN:** Khi chủ động crash/restore tại biên tool, một harness (1) tách transport khỏi effect, (2) giữ trạng thái điều khiển `unknown` kèm reconcile, và (3) *consume* authority khi confirm effect — có giảm **side-effect trùng** so với baseline chỉ checkpoint và checkpoint+idempotency key, khi giữ nguyên model?

## RQ2 (secondary)
How must approval/authority records bind to artifact hashes so restore cannot resurrect spent authority (Authority Resurrection)?

## Claim (1 sentence)
A ternary effect state machine (`proposed→executing→{confirmed|rejected|unknown→reconciling}`) plus single-consume authority at confirmation reduces Action Replay / Authority Resurrection under crash-restore versus session-checkpoint baselines on a local-first agent harness (neko-core), with model weights fixed.

## Non-claims
- We do not claim a Temporal replacement
- We do not claim novelty from “supporting MCP”
- We do not claim SOTA on SWE-bench without dedicated long-horizon eval restart
