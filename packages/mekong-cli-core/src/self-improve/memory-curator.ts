/**
 * Memory Curator — auto-clean, organize, and optimize memory.
 * ROI: Operational ROI — reduces context cost, improves retrieval relevance.
 */
import { readdir, readFile, writeFile, stat, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';

export class MemoryCurator {
  constructor(
    private readonly memoryDir: string,
    private readonly llm: { chat: (req: { messages: Array<{ role: string; content: string }>; model: string }) => Promise<{ content: string }> },
  ) {}

  /** Compact old sessions (keep last N full, summarize the rest) */
  async compactSessions(keepFull: number): Promise<Result<{ compacted: number; spaceSaved: number }>> {
    try {
      const sessionsDir = join(this.memoryDir, 'sessions');
      await mkdir(sessionsDir, { recursive: true });
      const files = (await readdir(sessionsDir)).filter(f => f.endsWith('.json')).sort();
      if (files.length <= keepFull) return ok({ compacted: 0, spaceSaved: 0 });

      const toCompact = files.slice(0, files.length - keepFull);
      let spaceSaved = 0;

      for (const file of toCompact) {
        const filePath = join(sessionsDir, file);
        const content = await readFile(filePath, 'utf-8');
        const originalSize = Buffer.byteLength(content);

        const response = await this.llm.chat({
          messages: [{ role: 'user', content: `Summarize this session in 3-5 bullet points:\n${content.slice(0, 4000)}` }],
          model: 'default',
        });

        const summary = JSON.stringify({ summary: response.content, originalFile: file, compactedAt: new Date().toISOString() });
        await writeFile(filePath, summary);
        spaceSaved += originalSize - Buffer.byteLength(summary);
      }

      return ok({ compacted: toCompact.length, spaceSaved: Math.max(0, spaceSaved) });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Deduplicate knowledge entities by name similarity */
  async deduplicateKnowledge(): Promise<Result<{ merged: number }>> {
    try {
      const knowledgePath = join(this.memoryDir, 'knowledge.json');
      let entities: Array<{ id: string; name: string; data: unknown; confidence: number }>;
      try {
        entities = JSON.parse(await readFile(knowledgePath, 'utf-8'));
      } catch {
        return ok({ merged: 0 });
      }

      const merged = new Set<string>();
      const result: typeof entities = [];

      for (const entity of entities) {
        if (merged.has(entity.id)) continue;
        // Find duplicates (same name, case-insensitive)
        const dupes = entities.filter(e =>
          e.id !== entity.id && !merged.has(e.id) &&
          e.name.toLowerCase() === entity.name.toLowerCase()
        );
        for (const d of dupes) {
          merged.add(d.id);
          // Keep higher confidence
          if (d.confidence > entity.confidence) {
            entity.data = d.data;
            entity.confidence = d.confidence;
          }
        }
        result.push(entity);
      }

      await writeFile(knowledgePath, JSON.stringify(result, null, 2));
      return ok({ merged: merged.size });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Score knowledge relevance based on recency and frequency */
  async scoreRelevance(): Promise<Array<{ entityId: string; score: number; lastUsed: string }>> {
    const knowledgePath = join(this.memoryDir, 'knowledge.json');
    try {
      const entities: Array<{ id: string; lastUsed?: string; accessCount?: number; confidence: number }> =
        JSON.parse(await readFile(knowledgePath, 'utf-8'));

      const now = Date.now();
      return entities.map(e => {
        const lastUsed = e.lastUsed ?? new Date(0).toISOString();
        const daysSinceUse = (now - new Date(lastUsed).getTime()) / 86400000;
        const recencyScore = Math.max(0, 1 - daysSinceUse / 365);
        const frequencyScore = Math.min(1, (e.accessCount ?? 0) / 100);
        const score = Number((recencyScore * 0.4 + frequencyScore * 0.3 + e.confidence * 0.3).toFixed(3));
        return { entityId: e.id, score, lastUsed };
      }).sort((a, b) => b.score - a.score);
    } catch {
      return [];
    }
  }

  /** Pre-select relevant memory for a task (token-budget aware) */
  async selectContext(taskDescription: string, maxTokens: number): Promise<string> {
    const scored = await this.scoreRelevance();
    if (scored.length === 0) return '';

    const knowledgePath = join(this.memoryDir, 'knowledge.json');
    let entities: Array<{ id: string; name: string; data: unknown }>;
    try {
      entities = JSON.parse(await readFile(knowledgePath, 'utf-8'));
    } catch {
      return '';
    }

    // Simple keyword matching + relevance score
    const keywords = taskDescription.toLowerCase().split(/\s+/);
    const contextParts: string[] = [];
    let tokenEstimate = 0;

    for (const item of scored) {
      const entity = entities.find(e => e.id === item.entityId);
      if (!entity) continue;
      const text = `${entity.name}: ${JSON.stringify(entity.data)}`;
      const nameMatch = keywords.some(k => entity.name.toLowerCase().includes(k));
      if (!nameMatch && item.score < 0.5) continue;
      const tokens = Math.ceil(text.length / 4); // rough estimate
      if (tokenEstimate + tokens > maxTokens) break;
      contextParts.push(text);
      tokenEstimate += tokens;
    }

    return contextParts.join('\n');
  }

  /** Get storage stats for the memory directory */
  async getStorageStats(): Promise<{
    totalSize: number;
    sessions: { count: number; size: number };
    knowledge: { entities: number; size: number };
    skills: { count: number; size: number };
    metrics: { points: number; size: number };
  }> {
    const stats = {
      totalSize: 0,
      sessions: { count: 0, size: 0 },
      knowledge: { entities: 0, size: 0 },
      skills: { count: 0, size: 0 },
      metrics: { points: 0, size: 0 },
    };

    const measure = async (subdir: string) => {
      try {
        const dir = join(this.memoryDir, subdir);
        const files = await readdir(dir);
        let size = 0;
        for (const f of files) {
          const s = await stat(join(dir, f));
          size += s.size;
        }
        return { count: files.length, size };
      } catch {
        return { count: 0, size: 0 };
      }
    };

    const [sessions, skills, metrics] = await Promise.all([
      measure('sessions'),
      measure('skills'),
      measure('metrics'),
    ]);

    stats.sessions = sessions;
    stats.skills = skills;
    stats.metrics = { points: metrics.count, size: metrics.size };

    // Knowledge is a single file
    try {
      const kPath = join(this.memoryDir, 'knowledge.json');
      const kStat = await stat(kPath);
      const entities: unknown[] = JSON.parse(await readFile(kPath, 'utf-8'));
      stats.knowledge = { entities: entities.length, size: kStat.size };
    } catch {
      // no knowledge file
    }

    stats.totalSize = stats.sessions.size + stats.knowledge.size + stats.skills.size + stats.metrics.size;
    return stats;
  }

  /** Cleanup: remove data older than retention period */
  async cleanup(retentionDays: number): Promise<Result<{ removed: number; spaceSaved: number }>> {
    try {
      const cutoff = Date.now() - retentionDays * 86400000;
      let removed = 0;
      let spaceSaved = 0;

      for (const subdir of ['sessions', 'metrics']) {
        const dir = join(this.memoryDir, subdir);
        let files: string[];
        try { files = await readdir(dir); } catch { continue; }

        for (const file of files) {
          const filePath = join(dir, file);
          const s = await stat(filePath);
          if (s.mtimeMs < cutoff) {
            spaceSaved += s.size;
            await rm(filePath);
            removed++;
          }
        }
      }

      return ok({ removed, spaceSaved });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
