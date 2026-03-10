/**
 * Agent registry — exports all agents and createRegistry() factory.
 * Mirrors Python: src/agents/__init__.py AGENT_REGISTRY
 */

import { LLMClient } from '../core/llm-client'
import type { AgentRegistry } from '../types/agent'
import { ContentWriterAgent } from './content-writer-agent'
import { FileAgent } from './file-agent-r2-storage'
import { GitAgent } from './git-agent-github-api'
import { LeadHunterAgent } from './lead-hunter-agent'
import { RecipeCrawlerAgent } from './recipe-crawler-agent'
import { ShellAgent } from './shell-agent-not-supported-in-workers'

export { runAgent } from './agent-runner'
export type { RunOptions, RunResult } from './agent-runner'
export { ContentWriterAgent } from './content-writer-agent'
export { FileAgent } from './file-agent-r2-storage'
export { GitAgent } from './git-agent-github-api'
export { LeadHunterAgent } from './lead-hunter-agent'
export { RecipeCrawlerAgent } from './recipe-crawler-agent'
export { ShellAgent } from './shell-agent-not-supported-in-workers'

export interface RegistryOptions {
  llm: LLMClient
  r2?: R2Bucket
  github?: { owner: string; repo: string; token: string }
  shellRunnerUrl?: string
}

export function createRegistry(opts: RegistryOptions): AgentRegistry {
  const registry: AgentRegistry = {
    'lead-hunter': new LeadHunterAgent(opts.llm),
    'content-writer': new ContentWriterAgent(opts.llm),
    'shell-agent': new ShellAgent({ runnerUrl: opts.shellRunnerUrl }),
  }

  if (opts.r2) {
    registry['recipe-crawler'] = new RecipeCrawlerAgent(opts.r2)
    registry['file-agent'] = new FileAgent(opts.r2)
  }

  if (opts.github) {
    registry['git-agent'] = new GitAgent(opts.github)
  }

  return registry
}
