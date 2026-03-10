import * as fs from 'fs';
import { buildChaosReport, generateChaosHtml, saveChaosReport } from '../../../src/testing/chaos/chaos-report-generator';
import { ScenarioResult } from '../../../src/testing/chaos/scenario-scheduler';
import { LatencyHistogram } from '../../../src/testing/chaos/monitor-aggregator';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('chaos-report-generator', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockResults: ScenarioResult[] = [
    {
      scenario: { name: 'kill-phase3', failure: { type: 'process', target: 'phase3', duration: 30 }, expected: { recoveryTimeSec: 10 } },
      status: 'passed', startedAt: 1000, endedAt: 2000, actualRecoveryTimeSec: 0.5,
      assertions: [{ name: 'Recovery Time', passed: true, expected: '<= 10s', actual: '0.500s' }],
    },
    {
      scenario: { name: 'net-latency', failure: { type: 'latency', target: 'exchange', delayMs: 500, duration: 60 }, expected: { maxSlippageBps: 10 } },
      status: 'failed', startedAt: 2000, endedAt: 3000, actualRecoveryTimeSec: 1.2,
      assertions: [{ name: 'Max Slippage', passed: false, expected: '<= 10 bps', actual: '15 bps' }],
    },
  ];

  const mockLatency: LatencyHistogram = { min: 5, max: 120, avg: 45, p50: 30, p95: 100, p99: 115, count: 50 };

  it('should build report with correct counts', () => {
    const report = buildChaosReport(mockResults, mockLatency);
    expect(report.totalScenarios).toBe(2);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.timestamp).toBeDefined();
  });

  it('should generate valid HTML', () => {
    const report = buildChaosReport(mockResults, mockLatency);
    const html = generateChaosHtml(report);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Chaos Test Report');
    expect(html).toContain('kill-phase3');
    expect(html).toContain('PASSED');
    expect(html).toContain('FAILED');
  });

  it('should escape HTML in report', () => {
    const xssResults: ScenarioResult[] = [{
      scenario: { name: '<script>alert(1)</script>', failure: { type: 'process', target: 'x', duration: 1 }, expected: {} },
      status: 'passed', startedAt: 0, endedAt: 1, actualRecoveryTimeSec: 0,
      assertions: [],
    }];
    const report = buildChaosReport(xssResults, mockLatency);
    const html = generateChaosHtml(report);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should save both HTML and JSON', () => {
    mockFs.writeFileSync.mockImplementation(() => undefined);
    const report = buildChaosReport(mockResults, mockLatency);
    const saved = saveChaosReport(report, '/out/chaos.html');
    expect(saved).toHaveLength(2);
    expect(saved[0]).toBe('/out/chaos.html');
    expect(saved[1]).toBe('/out/chaos.json');
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  it('should handle empty results', () => {
    const report = buildChaosReport([], mockLatency);
    expect(report.totalScenarios).toBe(0);
    expect(report.passed).toBe(0);
    const html = generateChaosHtml(report);
    expect(html).toContain('0');
  });
});
