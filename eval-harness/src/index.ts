/** Public exports for @wiii-lab/eval-harness scaffold. */
export { runCell } from "./harness/runner.ts";
export type {
  CellConfig,
  CellMetrics,
  RunMeta,
  BaselineId,
  FaultId,
  MockId,
  AgentDriver,
} from "./types.ts";
export { EffectJournal } from "./journal/effect-journal.ts";
export { createWorld, snapshotCounters } from "./mocks/store.ts";
export { createRegistry, invokeMock, inspectMock } from "./mocks/tools.ts";
export {
  llmResynthesizeToolArgs,
  requireZaiApiKey,
  MissingZaiApiKeyError,
  estimateTokensForN,
  ZAI_BASE_URLS,
} from "./agent/llm.ts";

export { runNekoSealCrashRestoreCell, writeNekoEvidence } from "./adapters/neko-core/crash-restore-cell.ts";
export { NEKO_CORE_COMMIT, NEKO_SEAL_UNKNOWN_TEXT, harnessIdForAdapter } from "./adapters/neko-core/pin.ts";
