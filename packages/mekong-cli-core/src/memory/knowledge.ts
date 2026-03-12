/**
 * Knowledge store — persists facts and entities as JSON.
 * Used for long-term learning across sessions.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { generateId } from '../utils/hash.js';
import { fileExists } from '../utils/file.js';

export interface KnowledgeEntity {
  id: string;
  name: string;
  type: 'fact' | 'procedure' | 'concept' | 'reference';
  attributes: Record<string, unknown>;
  source: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export class KnowledgeStore {
  private entities: Map<string, KnowledgeEntity> = new Map();
  private filePath: string;

  constructor(knowledgeDir?: string) {
    const dir = knowledgeDir ?? join(homedir(), '.mekong', 'knowledge');
    this.filePath = join(dir, 'entities.json');
  }

  /** Load entities from disk */
  async load(): Promise<void> {
    if (!(await fileExists(this.filePath))) return;
    const content = await readFile(this.filePath, 'utf-8');
    const data = JSON.parse(content) as KnowledgeEntity[];
    this.entities.clear();
    for (const entity of data) {
      this.entities.set(entity.id, entity);
    }
  }

  /** Save entities to disk */
  async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const data = Array.from(this.entities.values());
    await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /** Add or update an entity */
  upsert(entity: Omit<KnowledgeEntity, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeEntity {
    const existing = this.findByName(entity.name);
    const now = new Date().toISOString();

    if (existing) {
      const updated: KnowledgeEntity = {
        ...existing,
        ...entity,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
      this.entities.set(updated.id, updated);
      return updated;
    }

    const newEntity: KnowledgeEntity = {
      id: generateId('know'),
      ...entity,
      createdAt: now,
      updatedAt: now,
    };
    this.entities.set(newEntity.id, newEntity);
    return newEntity;
  }

  /** Find entity by name */
  findByName(name: string): KnowledgeEntity | undefined {
    for (const entity of this.entities.values()) {
      if (entity.name === name) return entity;
    }
    return undefined;
  }

  /** Find entities by type */
  findByType(type: KnowledgeEntity['type']): KnowledgeEntity[] {
    return Array.from(this.entities.values()).filter(e => e.type === type);
  }

  /** Get all entities */
  getAll(): KnowledgeEntity[] {
    return Array.from(this.entities.values());
  }

  /** Get count */
  get size(): number {
    return this.entities.size;
  }
}
