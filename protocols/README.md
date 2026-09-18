# protocols/ — fault catalog + experiment protocol

Both protocol documents are present here in full (synced from the lab workspace,
wiii-lab, accepted as E-04 per `notes/DECISION-LOG.md` D13):

- [`fault-catalog.md`](./fault-catalog.md) — threat classes T-AR, T-ARes, T-FS, T-LA and faults F01–F10
- [`experiment-protocol.md`](./experiment-protocol.md) — factorial design (fault × mock × baseline B0–B3), N, seeds, stopping rules

Related material elsewhere in this repo:

- Formal model (effect state machine, forbidden transitions): [`../outline/formal-model.md`](../outline/formal-model.md)
  (mirror: [`../arxiv-pack/extra/formal-model.md`](../arxiv-pack/extra/formal-model.md))
- Research questions and claims: [`../handbook/RQ-AND-CLAIMS.md`](../handbook/RQ-AND-CLAIMS.md)
- Lab process and evidence rules: [`../handbook/LAB-HANDBOOK.md`](../handbook/LAB-HANDBOOK.md)
- Methods section draft (protocol as written up): [`../outline/section-methods.md`](../outline/section-methods.md)
- Reproduction steps and evidence filenames: [`../arxiv-pack/REPRODUCIBILITY.md`](../arxiv-pack/REPRODUCIBILITY.md)
- Harness implementation of the faults and cells: [`../eval-harness/README.md`](../eval-harness/README.md)
