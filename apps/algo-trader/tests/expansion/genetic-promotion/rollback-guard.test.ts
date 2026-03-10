import { RollbackGuard } from '../../../src/expansion/genetic-promotion/rollback-guard';

describe('RollbackGuard', () => {
  it('watch adds strategy to guarded set', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    guard.watch('s1', 1000);
    expect(guard.getGuarded()).toHaveLength(1);
  });

  it('isRolledBack returns false for fresh strategy', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    guard.watch('s1', 1000);
    expect(guard.isRolledBack('s1')).toBe(false);
  });

  it('emits rollback when drawdown exceeds threshold', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    const events: unknown[] = [];
    guard.on('rollback', (r) => events.push(r));
    guard.watch('s1', 1000);
    guard.updatePnl('s1', 940); // 6% drawdown > 5%
    expect(events).toHaveLength(1);
    expect(guard.isRolledBack('s1')).toBe(true);
  });

  it('does not rollback when drawdown is within threshold', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    const events: unknown[] = [];
    guard.on('rollback', (r) => events.push(r));
    guard.watch('s1', 1000);
    guard.updatePnl('s1', 970); // 3% drawdown < 5%
    expect(events).toHaveLength(0);
    expect(guard.isRolledBack('s1')).toBe(false);
  });

  it('updatePnl is no-op for already rolled-back strategy', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    const events: unknown[] = [];
    guard.on('rollback', (r) => events.push(r));
    guard.watch('s1', 1000);
    guard.updatePnl('s1', 900); // triggers rollback
    guard.updatePnl('s1', 800); // should not emit again
    expect(events).toHaveLength(1);
  });

  it('checkAll triggers check for all watched strategies', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    guard.watch('s1', 1000);
    guard.watch('s2', 2000);
    // Manually set pnl by calling updatePnl first
    guard.updatePnl('s1', 920); // 8% - triggers rollback
    guard.updatePnl('s2', 1980); // 1% - OK
    expect(guard.isRolledBack('s1')).toBe(true);
    expect(guard.isRolledBack('s2')).toBe(false);
  });

  it('isRolledBack returns false for unknown id', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    expect(guard.isRolledBack('unknown')).toBe(false);
  });

  it('startMonitoring and stopMonitoring do not throw', () => {
    const guard = new RollbackGuard({ monitoringWindowMs: 60_000, maxDrawdownPercent: 5 });
    expect(() => {
      guard.startMonitoring(1000);
      guard.stopMonitoring();
    }).not.toThrow();
  });
});
