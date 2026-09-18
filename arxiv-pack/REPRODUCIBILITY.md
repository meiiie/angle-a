# Reproducibility appendix (Phase-1 pilot + confirmatory LLM)

## Environment
- Box date: 2026-09-18 ICT
- Runtime: Bun 1.4.x
- Agent drivers:
  - Pilot: `scripted/always-issue-tool@scaffold` (+ `--resynthesize` where noted)
  - Confirmatory: `--driver llm --model glm-5.3` (`llm/glm-5.3@z.ai`, `reasoning_effort=low`; implies re-synthesis)
- Harness: `/workspace/research/wiii-lab/eval-harness`
- LLM auth: `ZAI_API_KEY` (from `.secrets.env`; never commit)

## Commands
```bash
cd /workspace/research/wiii-lab/eval-harness
bun run dry

# Scripted pilot cell
bun run src/cli/run-cell.ts -b B3 -f F01 -m M-pay --seed 1 --write-evidence
bun run src/cli/run-cell.ts -b B2 -f F01 -m M-pay --seed 1 --resynthesize --write-evidence
bun run src/cli/run-cell.ts -b B3 -f F01 -m M-pay --seed 1 --resynthesize --write-evidence

# Confirmatory LLM N=30 matrix (F01/F03 × M-pay × {B2,B3})
bun run confirmatory-llm --fault F01 --n 30
bun run confirmatory-llm --fault F03 --n 30
# or both: bun run confirmatory-llm --fault both --n 30
```

## Aggregates
### Pilot (scripted, N=10)
- `../evidence/runs/pilot-F01-Mpay-N10-summary.json`
- `../evidence/runs/pilot-F01-Mfs-N10-summary.json`
- `../evidence/runs/pilot-F02-Mpay-N10-summary.json`
- `../evidence/runs/pilot-F03-Mpay-N10-summary.json`
- `../evidence/runs/pilot-F01-Mpay-resynth-N10-summary.json`

### Confirmatory LLM (glm-5.3, N=30)
- `../evidence/runs/confirmatory-llm-F01-Mpay-N30-summary.json`
  - B2: dup_rate=1.0, mean_charge=2.0, seal_unknown=0, tokens=7585; all `confirmed`
  - B3: dup_rate=0.0, mean_charge=1.0, seal_unknown=1.0, tokens=7698; all `confirmed_via_reconcile`
- `../evidence/runs/confirmatory-llm-F03-Mpay-N30-summary.json`
  - B2: auth_resurrection=1.0, charge=1.0; all `confirmed`
  - B3: auth_resurrection=0.0, charge=0.0; all `re_approval_required`
- Grand: 120 cells, 30230 tokens, 0 failures

## Ethics
Mock tools only — no real payments, email, or deploys.
