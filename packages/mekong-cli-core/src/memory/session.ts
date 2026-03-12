/**
 * Session memory — append-only JSONL log of all interactions.
 * Each session gets a unique file: sessions/{sessionId}.jsonl
 */
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { generateId } from '../utils/hash.js';
import { fileExists } from '../utils/file.js';

export interface SessionEntry {
  id: string;
  timestamp: string;
  type: 'user_input' | 'agent_response' | 'agent_action' | 'tool_call' | 'tool_result' | 'error';
  content: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export class SessionMemory {
  readonly sessionId: string;
  private filePath: string;
  private entries: SessionEntry[] = [];

  constructor(sessionDir?: string) {
    this.sessionId = generateId('ses');
    const dir = sessionDir ?? join(homedir(), '.mekong', 'sessions');
    this.filePath = join(dir, `${this.sessionId}.jsonl`);
  }

  /** Append an entry to the session log */
  async append(entry: Omit<SessionEntry, 'id' | 'timestamp'>): Promise<SessionEntry> {
    const full: SessionEntry = {
      id: generateId('entry'),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.entries.push(full);
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, JSON.stringify(full) + '\n', 'utf-8');
    return full;
  }

  /** Get all entries in current session */
  getEntries(): SessionEntry[] {
    return [...this.entries];
  }

  /** Load entries from existing session file */
  async load(sessionId: string, sessionDir?: string): Promise<SessionEntry[]> {
    const dir = sessionDir ?? join(homedir(), '.mekong', 'sessions');
    const path = join(dir, `${sessionId}.jsonl`);
    if (!(await fileExists(path))) return [];

    const content = await readFile(path, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line) as SessionEntry);
  }

  /** Get token count for current session */
  getTotalTokens(): number {
    return this.entries.reduce((sum, e) => sum + (e.tokenCount ?? 0), 0);
  }

  /** Get entry count */
  get size(): number {
    return this.entries.length;
  }
}
