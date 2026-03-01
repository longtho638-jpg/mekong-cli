/**
 * AgiDbEngine — Tiered storage engine for tick data.
 * Hot (in-memory TickStore) → Tier 1 (JSON flush) → Tier 2 (future: Parquet/DB).
 */

import { TickStore } from './TickStore';
import { ICandle } from '../interfaces/ICandle';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from '../utils/logger';

const FLUSH_THRESHOLD = 100;

export class AgiDbEngine {
  private tickStore: TickStore;
  private storagePath: string;
  private flushCount = 0;

  constructor(tickStore: TickStore, storagePath: string) {
    this.tickStore = tickStore;
    this.storagePath = storagePath;
  }

  async addTick(tick: ICandle): Promise<void> {
    this.tickStore.addTick(tick);

    const stats = this.tickStore.getStats();
    if (stats.count >= FLUSH_THRESHOLD) {
      await this.flushToTier1();
    }
  }

  async query(limit: number): Promise<ICandle[]> {
    return this.tickStore.getLastTicks(limit);
  }

  private async flushToTier1(): Promise<void> {
    try {
      const ticks = this.tickStore.getLastTicks(FLUSH_THRESHOLD);
      const filePath = path.join(this.storagePath, `tier1-${this.flushCount++}.json`);
      await fs.writeJson(filePath, ticks);
      logger.info(`AgiDbEngine: Flushed ${ticks.length} ticks to ${filePath}`);
    } catch (error: unknown) {
      logger.error(`AgiDbEngine flush error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
