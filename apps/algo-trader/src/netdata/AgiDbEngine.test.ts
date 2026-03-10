import { AgiDbEngine } from './AgiDbEngine';
import * as fs from 'fs-extra';

jest.mock('fs-extra');

describe('AgiDbEngine', () => {
    let engine: AgiDbEngine;
    let mockTickStore: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- jest mock
    const storagePath = './test-db';

    beforeEach(() => {
        mockTickStore = {
            addTick: jest.fn(),
            getLastTicks: jest.fn().mockReturnValue([]),
            getStats: jest.fn().mockReturnValue({ count: 0 })
        };
        engine = new AgiDbEngine(mockTickStore as any, storagePath);
    });

    it('should add ticks to hot store', async () => {
        const tick = { timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 };
        await engine.addTick(tick);
        expect(mockTickStore.addTick).toHaveBeenCalledWith(tick);
    });

    it('should flush to Tier 1 periodically', async () => {
        mockTickStore.getStats.mockReturnValue({ count: 100 });
        mockTickStore.getLastTicks.mockReturnValue([{ timestamp: 1 }]);

        await engine.addTick({ timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 });

        expect(fs.writeJson).toHaveBeenCalled();
    });

    it('should query hot store first', async () => {
        mockTickStore.getLastTicks.mockReturnValue([{ timestamp: 1 }, { timestamp: 2 }]);
        const results = await engine.query(2);
        expect(results.length).toBe(2);
        expect(mockTickStore.getLastTicks).toHaveBeenCalledWith(2);
    });
});
