import { TreasuryManager } from '../../../src/expansion/dao-governance/treasury-manager';

describe('TreasuryManager', () => {
  it('starts with initial balance', () => {
    const tm = new TreasuryManager(50_000);
    expect(tm.getBalance()).toBe(50_000);
  });

  it('recordInflow increases balance', () => {
    const tm = new TreasuryManager(0);
    tm.recordInflow(10_000, 'test inflow');
    expect(tm.getBalance()).toBe(10_000);
  });

  it('recordOutflow decreases balance', () => {
    const tm = new TreasuryManager(10_000);
    tm.recordOutflow(3_000, 'grant');
    expect(tm.getBalance()).toBe(7_000);
  });

  it('recordOutflow throws when insufficient balance', () => {
    const tm = new TreasuryManager(100);
    expect(() => tm.recordOutflow(200, 'too much')).toThrow('Insufficient treasury balance');
  });

  it('getState returns correct totals', () => {
    const tm = new TreasuryManager(0);
    tm.recordInflow(5_000, 'a');
    tm.recordInflow(3_000, 'b');
    tm.recordOutflow(2_000, 'c');
    const state = tm.getState();
    expect(state.totalInflows).toBe(8_000);
    expect(state.totalOutflows).toBe(2_000);
    expect(state.balanceUsd).toBe(6_000);
  });

  it('emits inflow event', () => {
    const tm = new TreasuryManager(0);
    const events: unknown[] = [];
    tm.on('inflow', (t) => events.push(t));
    tm.recordInflow(1_000, 'seed');
    expect(events).toHaveLength(1);
  });

  it('emits outflow event', () => {
    const tm = new TreasuryManager(5_000);
    const events: unknown[] = [];
    tm.on('outflow', (t) => events.push(t));
    tm.recordOutflow(1_000, 'expense');
    expect(events).toHaveLength(1);
  });

  it('transactions list accumulates entries', () => {
    const tm = new TreasuryManager(10_000);
    tm.recordInflow(500, 'a');
    tm.recordOutflow(200, 'b');
    expect(tm.getState().transactions).toHaveLength(2);
  });
});
