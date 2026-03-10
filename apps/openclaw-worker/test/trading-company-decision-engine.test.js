import { describe, it, expect } from 'vitest';

const {
  parseReport,
  decide,
  getMissionsForCadence,
  buildTradingMission,
  DEFAULT_THRESHOLDS,
} = require('../lib/trading-company-decision-engine');

describe('trading-company-decision-engine', () => {
  describe('parseReport', () => {
    it('parses healthy report correctly', () => {
      const report = '🟢 System Health: All Green\n🟢 Uptime: 99.9%\n🟢 PASS: All OK';
      const metrics = parseReport(report);
      expect(metrics.healthy).toBe(true);
      expect(metrics.red_flags).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.greens).toBeGreaterThanOrEqual(3);
    });

    it('detects red flags and errors', () => {
      const report = '🔴 CRITICAL: Exchange down\n❌ FAIL: Order rejected\n🔴 P0: Urgent';
      const metrics = parseReport(report);
      expect(metrics.healthy).toBe(false);
      expect(metrics.red_flags).toBeGreaterThan(0);
      expect(metrics.errors).toBeGreaterThan(0);
      expect(metrics.needs_action).toBe(true);
    });

    it('extracts drawdown percentage', () => {
      const report = 'Max DD: 18.5% this week';
      const metrics = parseReport(report);
      expect(metrics.drawdown).toBeCloseTo(0.185);
    });

    it('extracts win rate', () => {
      const report = 'Win rate: 62.3% across all pairs';
      const metrics = parseReport(report);
      expect(metrics.winrate).toBeCloseTo(0.623);
    });

    it('extracts circuit breaker triggers', () => {
      const report = 'CB: 4 triggers active on Binance';
      const metrics = parseReport(report);
      expect(metrics.cb_triggers).toBe(4);
    });

    it('handles null/empty content', () => {
      const metrics = parseReport(null);
      expect(metrics.healthy).toBe(false);
      expect(metrics.red_flags).toBe(0);
    });
  });

  describe('decide', () => {
    it('returns HALT on high drawdown', () => {
      const metrics = { drawdown: 0.25, cb_triggers: 0, red_flags: 0, errors: 0, warnings: 0, greens: 5, fee_ratio: null, healthy: false, needs_escalation: false };
      const decision = decide(metrics);
      expect(decision.action).toBe('HALT');
      expect(decision.reason).toContain('25.0%');
      expect(decision.cmd).toContain('emergency');
    });

    it('returns HALT on multiple circuit breakers', () => {
      const metrics = { drawdown: null, cb_triggers: 4, red_flags: 0, errors: 0, warnings: 0, greens: 5, fee_ratio: null, healthy: false, needs_escalation: false };
      const decision = decide(metrics);
      expect(decision.action).toBe('HALT');
      expect(decision.reason).toContain('circuit breaker');
    });

    it('returns HALT on excessive red flags', () => {
      const metrics = { drawdown: null, cb_triggers: 0, red_flags: 8, errors: 0, warnings: 0, greens: 0, fee_ratio: null, healthy: false, needs_escalation: false };
      const decision = decide(metrics);
      expect(decision.action).toBe('HALT');
    });

    it('returns ESCALATE when needs_escalation', () => {
      const metrics = { drawdown: null, cb_triggers: 0, red_flags: 4, errors: 6, warnings: 0, greens: 0, fee_ratio: null, healthy: false, needs_escalation: true };
      const decision = decide(metrics);
      expect(decision.action).toBe('ESCALATE');
    });

    it('returns AUTO_FIX on high fee ratio', () => {
      const metrics = { drawdown: null, cb_triggers: 0, red_flags: 0, errors: 0, warnings: 0, greens: 5, fee_ratio: 0.25, healthy: true, needs_escalation: false };
      const decision = decide(metrics);
      expect(decision.action).toBe('AUTO_FIX');
      expect(decision.cmd).toContain('fin-analyst');
    });

    it('returns AUTO_FIX on moderate errors', () => {
      const metrics = { drawdown: null, cb_triggers: 0, red_flags: 0, errors: 3, warnings: 0, greens: 5, fee_ratio: null, healthy: false, needs_escalation: false };
      const decision = decide(metrics);
      expect(decision.action).toBe('AUTO_FIX');
    });

    it('returns CONTINUE when healthy', () => {
      const metrics = { drawdown: 0.05, cb_triggers: 0, red_flags: 0, errors: 0, warnings: 1, greens: 8, fee_ratio: 0.10, healthy: true, needs_escalation: false };
      const decision = decide(metrics);
      expect(decision.action).toBe('CONTINUE');
    });
  });

  describe('getMissionsForCadence', () => {
    it('returns missions for daily-ops', () => {
      const missions = getMissionsForCadence('daily');
      expect(missions.length).toBeGreaterThan(0);
      expect(missions[0]).toHaveProperty('role');
      expect(missions[0]).toHaveProperty('action');
    });

    it('returns empty for unknown cadence', () => {
      const missions = getMissionsForCadence('nonexistent');
      expect(missions).toEqual([]);
    });
  });

  describe('buildTradingMission', () => {
    it('builds mission content with role and action', () => {
      const content = buildTradingMission('coo', 'health', { timeout: 'MEDIUM', tier: 'AUTO' });
      expect(content).toContain('/trading:coo health');
      expect(content).toContain('Timeout: MEDIUM');
      expect(content).toContain('Tier: AUTO');
    });
  });
});
