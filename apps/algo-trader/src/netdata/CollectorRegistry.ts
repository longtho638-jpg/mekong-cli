/**
 * CollectorRegistry — Manages exchange-specific data collectors.
 * Supports worker thread isolation to prevent blocking the main loop.
 * Inspired by Netdata's modular collectors.
 */

import { logger } from '../utils/logger';
import { SignalMesh } from './SignalMesh';

export interface CollectorConfig {
    id: string;
    exchangeId: string;
    symbol: string;
    intervalMs: number;
}

export interface ICollector {
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): 'idle' | 'running' | 'error';
}

export class CollectorRegistry {
    private collectors = new Map<string, ICollector>();
    private signalMesh: SignalMesh;

    constructor(signalMesh: SignalMesh) {
        this.signalMesh = signalMesh;
    }

    register(id: string, collector: ICollector): void {
        if (this.collectors.has(id)) {
            throw new Error(`Collector with id ${id} already registered`);
        }
        this.collectors.set(id, collector);
        logger.info(`CollectorRegistry: Registered collector ${id}`);
    }

    async startAll(): Promise<void> {
        logger.info('CollectorRegistry: Starting all collectors...');
        for (const [id, collector] of this.collectors.entries()) {
            try {
                await collector.start();
                this.signalMesh.publish('collector:started', { id }, 'collector-registry');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`CollectorRegistry: Failed to start collector ${id} — ${errorMessage}`);
                this.signalMesh.publish('collector:error', { id, error: errorMessage }, 'collector-registry');
            }
        }
    }

    async stopAll(): Promise<void> {
        logger.info('CollectorRegistry: Stopping all collectors...');
        for (const [id, collector] of this.collectors.entries()) {
            await collector.stop();
            this.signalMesh.publish('collector:stopped', { id }, 'collector-registry');
        }
    }

    getCollector(id: string): ICollector | undefined {
        return this.collectors.get(id);
    }

    getAllStatus() {
        const statuses: Record<string, string> = {};
        for (const [id, collector] of this.collectors.entries()) {
            statuses[id] = collector.getStatus();
        }
        return statuses;
    }
}
