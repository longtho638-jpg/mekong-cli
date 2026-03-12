import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionMemory } from '../../src/memory/session.js';
import { KnowledgeStore } from '../../src/memory/knowledge.js';
import { parseIdentityMarkdown } from '../../src/memory/identity.js';
import { compactEntries } from '../../src/memory/compactor.js';
import type { SessionEntry } from '../../src/memory/session.js';

describe('SessionMemory', () => {
  it('appends entries', async () => {
    const dir = join(tmpdir(), `mekong-test-${Date.now()}`);
    const session = new SessionMemory(dir);
    const entry = await session.append({ type: 'user_input', content: 'hello' });
    expect(entry.id).toBeTruthy();
    expect(entry.content).toBe('hello');
    expect(session.size).toBe(1);
  });

  it('tracks total tokens', async () => {
    const dir = join(tmpdir(), `mekong-test-${Date.now()}`);
    const session = new SessionMemory(dir);
    await session.append({ type: 'user_input', content: 'hi', tokenCount: 10 });
    await session.append({ type: 'agent_response', content: 'hello', tokenCount: 20 });
    expect(session.getTotalTokens()).toBe(30);
  });

  it('returns empty entries initially', () => {
    const dir = join(tmpdir(), `mekong-test-${Date.now()}`);
    const session = new SessionMemory(dir);
    expect(session.getEntries()).toHaveLength(0);
    expect(session.size).toBe(0);
    expect(session.getTotalTokens()).toBe(0);
  });

  it('assigns unique sessionId', () => {
    const dir = join(tmpdir(), `mekong-test-${Date.now()}`);
    const a = new SessionMemory(dir);
    const b = new SessionMemory(dir);
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it('loads non-existent session as empty array', async () => {
    const dir = join(tmpdir(), `mekong-test-${Date.now()}`);
    const session = new SessionMemory(dir);
    const entries = await session.load('nonexistent-session', dir);
    expect(entries).toHaveLength(0);
  });
});

describe('KnowledgeStore', () => {
  it('upserts and finds entities', () => {
    const store = new KnowledgeStore(join(tmpdir(), `mekong-know-${Date.now()}`));
    const entity = store.upsert({ name: 'test', type: 'fact', attributes: { key: 'val' }, source: 'test', confidence: 0.9 });
    expect(entity.id).toBeTruthy();
    expect(store.findByName('test')).toBeDefined();
    expect(store.findByType('fact')).toHaveLength(1);
  });

  it('updates existing entity', () => {
    const store = new KnowledgeStore(join(tmpdir(), `mekong-know-${Date.now()}`));
    store.upsert({ name: 'x', type: 'fact', attributes: { v: 1 }, source: 's', confidence: 0.5 });
    const updated = store.upsert({ name: 'x', type: 'fact', attributes: { v: 2 }, source: 's', confidence: 0.9 });
    expect(updated.attributes).toEqual({ v: 2 });
    expect(store.size).toBe(1);
  });

  it('returns undefined for unknown entity', () => {
    const store = new KnowledgeStore(join(tmpdir(), `mekong-know-${Date.now()}`));
    expect(store.findByName('ghost')).toBeUndefined();
  });

  it('findByType returns empty array when none match', () => {
    const store = new KnowledgeStore(join(tmpdir(), `mekong-know-${Date.now()}`));
    store.upsert({ name: 'p', type: 'procedure', attributes: {}, source: 's', confidence: 1 });
    expect(store.findByType('concept')).toHaveLength(0);
  });

  it('getAll returns all entities', () => {
    const store = new KnowledgeStore(join(tmpdir(), `mekong-know-${Date.now()}`));
    store.upsert({ name: 'a', type: 'fact', attributes: {}, source: 's', confidence: 1 });
    store.upsert({ name: 'b', type: 'concept', attributes: {}, source: 's', confidence: 1 });
    expect(store.getAll()).toHaveLength(2);
  });
});

describe('parseIdentityMarkdown', () => {
  it('parses SOUL.md format', () => {
    const content = `# SOUL.md
## Who am I
I am mekong — an agentic CLI
## Personality
- Direct and concise
- Show progress
## Boundaries — NEVER CROSS
- Never modify files outside project
- Never execute sudo
## Quality Standards
- All code must be testable
- All API calls must have error handling
## When Confused
1. State what I understand
2. Ask ONE specific question
`;
    const identity = parseIdentityMarkdown(content);
    expect(identity.name).toBe('mekong');
    expect(identity.boundaries).toContain('Never modify files outside project');
    expect(identity.boundaries).toContain('Never execute sudo');
    expect(identity.qualityGates).toContain('All code must be testable');
  });

  it('falls back to default name when section missing', () => {
    const identity = parseIdentityMarkdown('# Title\n## Other\nsome content');
    expect(identity.name).toBe('mekong');
  });

  it('returns default scopeControls', () => {
    const identity = parseIdentityMarkdown('');
    expect(identity.scopeControls.wipLimit).toBe(3);
    expect(identity.scopeControls.maxTokensPerTurn).toBe(4096);
    expect(identity.scopeControls.timeLimit).toBe(300);
  });

  it('parses escalation protocol steps', () => {
    const content = `## When Confused
1. State what I understand
2. Ask ONE specific question
3. Escalate to human
`;
    const identity = parseIdentityMarkdown(content);
    expect(Object.keys(identity.escalationProtocol)).toHaveLength(3);
    expect(identity.escalationProtocol['step_1']).toBe('State what I understand');
  });
});

describe('compactEntries', () => {
  it('returns original if fewer than keepRecent', () => {
    const entries: SessionEntry[] = [
      { id: '1', timestamp: '', type: 'user_input', content: 'hi' },
    ];
    const result = compactEntries(entries, 10);
    expect(result.compactedCount).toBe(0);
    expect(result.keptEntries).toHaveLength(1);
  });

  it('compacts old entries', () => {
    const entries: SessionEntry[] = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      timestamp: '',
      type: 'agent_action' as const,
      content: `action ${i}`,
      tokenCount: 100,
    }));
    const result = compactEntries(entries, 5);
    expect(result.compactedCount).toBe(10);
    expect(result.keptEntries).toHaveLength(5);
    expect(result.summary).toContain('Compacted');
  });

  it('calculates savedTokens correctly', () => {
    const entries: SessionEntry[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      timestamp: '',
      type: 'agent_action' as const,
      content: `action ${i}`,
      tokenCount: 100,
    }));
    const result = compactEntries(entries, 10);
    expect(result.savedTokens).toBeGreaterThanOrEqual(0);
    expect(result.compactedCount).toBe(2);
  });

  it('includes errors in summary', () => {
    const entries: SessionEntry[] = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      timestamp: '',
      type: i % 3 === 0 ? ('error' as const) : ('agent_action' as const),
      content: `item ${i}`,
    }));
    const result = compactEntries(entries, 5);
    expect(result.summary).toContain('Errors');
  });
});
