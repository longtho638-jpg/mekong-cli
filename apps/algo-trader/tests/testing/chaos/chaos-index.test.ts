import * as fs from 'fs';
import { loadChaosConfig, runChaosTests, ChaosConfig } from '../../../src/testing/chaos/index';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('chaos/index', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('loadChaosConfig', () => {
    it('should return defaults when config missing', () => {
      mockFs.existsSync.mockReturnValue(false);
      const config = loadChaosConfig('/nope.json');
      expect(config.scenarios).toEqual([]);
      expect(config.environment.useDocker).toBe(false);
    });

    it('should load config from file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        environment: { useDocker: false, images: { s1: 'img:1' } },
        scenarios: [{ name: 'test', failure: { type: 'process', target: 's1', duration: 5 }, expected: {} }],
        durationHours: 2,
        reportPath: './out.html',
      }));
      const config = loadChaosConfig('/config.json');
      expect(config.scenarios).toHaveLength(1);
      expect(config.environment.images.s1).toBe('img:1');
    });
  });

  describe('runChaosTests', () => {
    it('should run full pipeline with scenarios', () => {
      mockFs.writeFileSync.mockImplementation(() => undefined);
      const config: ChaosConfig = {
        environment: { useDocker: false, images: { phase3: 'p:1', 'exchange-mock': 'e:1' } },
        scenarios: [
          { name: 'kill', failure: { type: 'process', target: 'phase3', duration: 5 }, expected: { recoveryTimeSec: 10, dataLoss: false } },
          { name: 'latency', failure: { type: 'latency', target: 'exchange-mock', delayMs: 200, duration: 10 }, expected: { maxSlippageBps: 20 } },
        ],
        durationHours: 1,
        reportPath: './test_chaos.html',
      };
      const report = runChaosTests(config, '/fake');
      expect(report.totalScenarios).toBe(2);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(0);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle empty scenarios', () => {
      mockFs.writeFileSync.mockImplementation(() => undefined);
      const config: ChaosConfig = {
        environment: { useDocker: false, images: {} },
        scenarios: [],
        durationHours: 1,
        reportPath: './empty.html',
      };
      const report = runChaosTests(config, '/fake');
      expect(report.totalScenarios).toBe(0);
    });
  });
});
