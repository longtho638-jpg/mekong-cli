/**
 * TickStore — High-performance tiered storage for tick data.
 * Inspired by Netdata dbengine v2.
 *
 * Tiers:
 * - Tier 0: In-memory SharedArrayBuffer Ring Buffers (Hot)
 * - Tier 1: Compressed persistent storage (Warm) - Placeholder for now
 * - Tier 2: Cold storage (External) - Placeholder for now
 */

import { ICandle } from '../interfaces/ICandle';

export interface TickData extends ICandle {
    id: number;
}

export class TickStore {
    private ringBuffer: Float64Array;
    private bufferSize: number;
    private head = 0;
    private count = 0;
    private stride = 6; // timestamp, open, high, low, close, volume

    constructor(maxTicks = 10000) {
        this.bufferSize = maxTicks;
        // Using SharedArrayBuffer for potential multi-threaded access
        const sab = new SharedArrayBuffer(maxTicks * this.stride * Float64Array.BYTES_PER_ELEMENT);
        this.ringBuffer = new Float64Array(sab);
    }

    /**
     * Add a new tick to the hot storage (Tier 0)
     */
    addTick(tick: ICandle): void {
        const offset = this.head * this.stride;
        this.ringBuffer[offset] = tick.timestamp;
        this.ringBuffer[offset + 1] = tick.open;
        this.ringBuffer[offset + 2] = tick.high;
        this.ringBuffer[offset + 3] = tick.low;
        this.ringBuffer[offset + 4] = tick.close;
        this.ringBuffer[offset + 5] = tick.volume;

        this.head = (this.head + 1) % this.bufferSize;
        if (this.count < this.bufferSize) {
            this.count++;
        }
    }

    /**
     * Get the last N ticks from hot storage
     */
    getLastTicks(n: number): ICandle[] {
        const result: ICandle[] = [];
        const limit = Math.min(n, this.count);

        for (let i = 0; i < limit; i++) {
            const index = (this.head - 1 - i + this.bufferSize) % this.bufferSize;
            const offset = index * this.stride;
            result.unshift({
                timestamp: this.ringBuffer[offset],
                open: this.ringBuffer[offset + 1],
                high: this.ringBuffer[offset + 2],
                low: this.ringBuffer[offset + 3],
                close: this.ringBuffer[offset + 4],
                volume: this.ringBuffer[offset + 5],
            });
        }

        return result;
    }

    /**
     * Get O(1) access to a specific metric across the buffer
     * Useful for fast indicator calculation
     */
    getMetricBuffer(metric: 'close' | 'volume'): Float64Array {
        const offsetShift = metric === 'close' ? 4 : 5;
        const buffer = new Float64Array(this.count);
        for (let i = 0; i < this.count; i++) {
            const index = (this.head - this.count + i + this.bufferSize) % this.bufferSize;
            buffer[i] = this.ringBuffer[index * this.stride + offsetShift];
        }
        return buffer;
    }

    getStats() {
        return {
            count: this.count,
            bufferSize: this.bufferSize,
            memoryUsageBytes: this.ringBuffer.byteLength
        };
    }
}
