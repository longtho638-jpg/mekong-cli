import { TickStore } from './TickStore';
import { ICandle } from '../interfaces/ICandle';

describe('TickStore', () => {
    let tickStore: TickStore;
    const maxTicks = 10;

    beforeEach(() => {
        tickStore = new TickStore(maxTicks);
    });

    it('should add and retrieve ticks', () => {
        const tick: ICandle = {
            timestamp: 1000,
            open: 100,
            high: 110,
            low: 90,
            close: 105,
            volume: 1000
        };

        tickStore.addTick(tick);
        const lastTicks = tickStore.getLastTicks(1);

        expect(lastTicks.length).toBe(1);
        expect(lastTicks[0]).toEqual(tick);
    });

    it('should behave as a ring buffer', () => {
        for (let i = 0; i < maxTicks + 5; i++) {
            tickStore.addTick({
                timestamp: i,
                open: i,
                high: i,
                low: i,
                close: i,
                volume: i
            });
        }

        const lastTicks = tickStore.getLastTicks(maxTicks + 5);
        expect(lastTicks.length).toBe(maxTicks);
        expect(lastTicks[0].timestamp).toBe(5);
        expect(lastTicks[maxTicks - 1].timestamp).toBe(maxTicks + 4);
    });

    it('should provide metric buffers correctly', () => {
        for (let i = 0; i < 5; i++) {
            tickStore.addTick({
                timestamp: i,
                open: i,
                high: i,
                low: i,
                close: i * 10,
                volume: i * 100
            });
        }

        const closeBuffer = tickStore.getMetricBuffer('close');
        expect(closeBuffer.length).toBe(5);
        expect(closeBuffer[0]).toBe(0);
        expect(closeBuffer[4]).toBe(40);

        const volumeBuffer = tickStore.getMetricBuffer('volume');
        expect(volumeBuffer[4]).toBe(400);
    });
});
