/**
 * Memory Curator — auto-clean, organize, and optimize memory.
 * Functions: session compaction, knowledge dedup, relevance scoring, context selection.
 */
import type { Result } from '../types/common.js';

export class MemoryCurator {
  constructor(
    private readonly memoryDir: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly llm: any,   // LlmRouter — avoid circular import
  ) {}

  /** Compact old sessions (keep last N full, summarize the rest) */
  async compactSessions(_keepFull: number): Promise<Result<{ compacted: number; spaceSaved: number }>> {
    throw new Error('Not implemented');
  }

  /** Deduplicate knowledge entities */
  async deduplicateKnowledge(): Promise<Result<{ merged: number }>> {
    throw new Error('Not implemented');
  }

  /** Score knowledge relevance */
  async scoreRelevance(): Promise<Array<{ entityId: string; score: number; lastUsed: string }>> {
    throw new Error('Not implemented');
  }

  /** Pre-select relevant memory for a task */
  async selectContext(_taskDescription: string, _maxTokens: number): Promise<string> {
    throw new Error('Not implemented');
  }

  /** Get storage stats */
  async getStorageStats(): Promise<{
    totalSize: number;
    sessions: { count: number; size: number };
    knowledge: { entities: number; size: number };
    skills: { count: number; size: number };
    metrics: { points: number; size: number };
  }> {
    throw new Error('Not implemented');
  }

  /** Cleanup: remove data older than retention period */
  async cleanup(_retentionDays: number): Promise<Result<{ removed: number; spaceSaved: number }>> {
    throw new Error('Not implemented');
  }
}
