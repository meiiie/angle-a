/**
 * Minimal Agent construction for eval: real neko-core Agent + onCheckpoint → disk.
 * Does not drive the full LLM runLoop; scripted cells set messages and call seal/checkpoint.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  Agent,
  ToolRegistry,
  autoApprove,
} from "../../../../../repos/neko-core/src/index.ts";
import type { Provider } from "../../../../../repos/neko-core/src/core/ports.ts";
import { NEKO_CORE_COMMIT_SHORT } from "./pin.ts";

/** No-op provider — spike cells never call complete(). */
const stubProvider: Provider = {
  async complete() {
    return { content: "", tool_calls: [] };
  },
};

export interface CheckpointStore {
  path: string;
  write(messages: unknown[]): Promise<void>;
  read(): unknown[] | null;
}

export function createDiskCheckpointStore(dir: string): CheckpointStore {
  const path = join(dir, "messages.json");
  mkdirSync(dir, { recursive: true });
  return {
    path,
    async write(messages: unknown[]) {
      writeFileSync(path, JSON.stringify(messages, null, 2));
    },
    read() {
      if (!existsSync(path)) return null;
      return JSON.parse(readFileSync(path, "utf8")) as unknown[];
    },
  };
}

export interface EvalAgentBundle {
  agent: Agent;
  checkpoint: CheckpointStore;
  /** Persist messages via Agent.onCheckpoint semantics (durable barrier). */
  durableCheckpoint: () => Promise<void>;
  neko_core_commit: string;
}

/**
 * Construct a real Agent wired to a disk checkpoint of `agent.messages`.
 * ToolRegistry is present for constructor validity; mock effects stay in lab mocks.
 */
export function createEvalAgent(checkpointDir: string): EvalAgentBundle {
  const checkpoint = createDiskCheckpointStore(checkpointDir);
  const tools = new ToolRegistry(checkpointDir, "auto", autoApprove);
  const agent = new Agent({
    provider: stubProvider,
    tools,
    onCheckpoint: async () => {
      await checkpoint.write(structuredClone(agent.messages));
    },
  });

  return {
    agent,
    checkpoint,
    durableCheckpoint: async () => {
      // Mirror Agent.durableCheckpoint: invoke onCheckpoint and fail-loud if it throws.
      await checkpoint.write(structuredClone(agent.messages));
    },
    neko_core_commit: NEKO_CORE_COMMIT_SHORT,
  };
}

export function restoreMessagesOntoAgent(agent: Agent, messages: unknown[]): void {
  agent.messages = structuredClone(messages) as typeof agent.messages;
}

/** Ensure parent of a path exists (for journal/world sidecars). */
export function ensureParent(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}
