import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const {
  getDueTradingMissions,
  buildTradingMissionFile,
  isTradingMission,
  loadCadenceState,
} = require('../lib/trading-cadence-scheduler');

const STATE_FILE = path.join(__dirname, '..', '.trading-cadence-state.json');

describe('trading-cadence-scheduler', () => {
  // Clean state before each test
  beforeEach(() => {
    try { fs.unlinkSync(STATE_FILE); } catch (e) { /* ignore */ }
  });

  afterEach(() => {
    try { fs.unlinkSync(STATE_FILE); } catch (e) { /* ignore */ }
  });

  describe('isTradingMission', () => {
    it('detects /trading:coo command', () => {
      expect(isTradingMission('algo-trader: /trading:coo health')).toBe(true);
    });

    it('detects /trading:fin-analyst command', () => {
      expect(isTradingMission('/trading:fin-analyst pnl')).toBe(true);
    });

    it('rejects non-trading content', () => {
      expect(isTradingMission('/cook fix all tests')).toBe(false);
    });

    it('handles null/empty', () => {
      expect(isTradingMission(null)).toBe(false);
      expect(isTradingMission('')).toBe(false);
    });
  });

  describe('getDueTradingMissions', () => {
    it('returns missions on first run (all cadences due)', () => {
      const result = getDueTradingMissions();
      expect(result.missions.length).toBeGreaterThan(0);
      expect(result.missions.length).toBeLessThanOrEqual(3); // throttled
      expect(result.cadenceIds.length).toBeGreaterThan(0);
    });

    it('respects scheduler cooldown on second immediate call', () => {
      getDueTradingMissions(); // first call
      const result2 = getDueTradingMissions(); // immediate second call
      expect(result2.missions.length).toBe(0); // cooldown active
    });

    it('saves state after run', () => {
      getDueTradingMissions();
      const state = loadCadenceState();
      expect(state.lastSchedulerTick).toBeGreaterThan(0);
      expect(Object.keys(state.lastRun).length).toBeGreaterThan(0);
    });
  });

  describe('buildTradingMissionFile', () => {
    it('builds correct filename and content', () => {
      const mission = { role: 'coo', action: 'health', timeout: 'MEDIUM', tier: 'AUTO', cadenceId: 'daily-ops' };
      const { filename, content } = buildTradingMissionFile(mission);

      expect(filename).toMatch(/^MEDIUM_mission_algo_trader_trading_coo_health_\d+\.txt$/);
      expect(content).toContain('/trading:coo health');
      expect(content).toContain('Cadence: daily-ops');
      expect(content).toContain('TIẾNG VIỆT');
    });

    it('uses CRITICAL priority for ESCALATE tier', () => {
      const mission = { role: 'ceo', action: 'risk', timeout: 'COMPLEX', tier: 'ESCALATE', cadenceId: 'quarterly-strategic' };
      const { filename } = buildTradingMissionFile(mission);
      expect(filename).toMatch(/^HIGH_mission/);
    });

    it('handles /trading:all command for master role', () => {
      const mission = { role: 'all', action: 'full monthly', timeout: 'STRATEGIC', tier: 'ESCALATE', cadenceId: 'monthly-full' };
      const { content } = buildTradingMissionFile(mission);
      expect(content).toContain('/trading:all full monthly');
    });
  });
});
