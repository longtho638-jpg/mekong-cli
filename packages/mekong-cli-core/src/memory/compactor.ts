/**
 * Context compactor — summarizes old session entries to save tokens.
 * Keeps recent entries verbatim, summarizes older ones.
 */
import type { SessionEntry } from './session.js';

export interface CompactionResult {
  summary: string;
  keptEntries: SessionEntry[];
  compactedCount: number;
  savedTokens: number;
}

/** Compact session entries, keeping recent ones and summarizing old */
export function compactEntries(
  entries: SessionEntry[],
  keepRecent: number = 10,
  _maxSummaryTokens: number = 500
): CompactionResult {
  if (entries.length <= keepRecent) {
    return {
      summary: '',
      keptEntries: entries,
      compactedCount: 0,
      savedTokens: 0,
    };
  }

  const toCompact = entries.slice(0, entries.length - keepRecent);
  const kept = entries.slice(entries.length - keepRecent);

  const compactedTokens = toCompact.reduce(
    (sum, e) => sum + (e.tokenCount ?? estimateTokens(e.content)),
    0
  );

  const summary = buildSummary(toCompact);

  return {
    summary,
    keptEntries: kept,
    compactedCount: toCompact.length,
    savedTokens: Math.max(0, compactedTokens - estimateTokens(summary)),
  };
}

/** Build a summary of compacted entries */
function buildSummary(entries: SessionEntry[]): string {
  const actions = entries
    .filter(e => e.type === 'agent_action' || e.type === 'tool_call')
    .map(e => `- [${e.type}] ${truncate(e.content, 80)}`)
    .slice(-20);

  const errors = entries
    .filter(e => e.type === 'error')
    .map(e => `- ERROR: ${truncate(e.content, 80)}`);

  const parts = ['## Session History (Compacted)'];
  if (actions.length) parts.push('### Actions', ...actions);
  if (errors.length) parts.push('### Errors', ...errors);
  parts.push(`\n_${entries.length} entries compacted_`);

  return parts.join('\n');
}

/** Rough token estimate (1 token ~= 4 chars) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Truncate string */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}
