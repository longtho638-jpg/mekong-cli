/**
 * Tests: EmergencyProtocol — trigger sequence, state transitions, idempotency.
 */

import { EventEmitter } from 'events';
import { EmergencyProtocol } from '../../../src/arbitrage/phase5_god_mode/capitalFortress/emergency-protocol';

function makeProtocol(withdrawal = false, addresses: string[] = []) {
  return new EmergencyProtocol({ coldStorageAddresses: addresses, emergencyWithdrawal: withdrawal });
}

describe('EmergencyProtocol — initial state', () => {
  test('starts in idle state', () => {
    const p = makeProtocol();
    expect(p.getState()).toBe('idle');
  });

  test('tradingPausedAt is null initially', () => {
    const p = makeProtocol();
    expect(p.getTradingPausedAt()).toBeNull();
  });
});

describe('EmergencyProtocol — trigger sequence', () => {
  test('emits trading:pause on trigger', async () => {
    const p = makeProtocol();
    const events: string[] = [];
    p.on('trading:pause', () => events.push('trading:pause'));
    await p.trigger(0.995);
    expect(events).toContain('trading:pause');
  });

  test('emits system:hibernate after trigger', async () => {
    const p = makeProtocol();
    const hibernatePayloads: unknown[] = [];
    p.on('system:hibernate', (payload) => hibernatePayloads.push(payload));
    await p.trigger(0.999);
    expect(hibernatePayloads).toHaveLength(1);
    expect((hibernatePayloads[0] as { reason: string }).reason).toBe('CRITICAL_COLLAPSE');
  });

  test('state transitions to hibernating after trigger', async () => {
    const p = makeProtocol();
    await p.trigger(0.99);
    expect(p.getState()).toBe('hibernating');
  });

  test('tradingPausedAt is set after trigger', async () => {
    const p = makeProtocol();
    await p.trigger(0.99);
    expect(p.getTradingPausedAt()).not.toBeNull();
  });
});

describe('EmergencyProtocol — idempotency', () => {
  test('second trigger is ignored while active', async () => {
    const p = makeProtocol();
    const pauses: number[] = [];
    p.on('trading:pause', () => pauses.push(1));
    await p.trigger(0.99);
    await p.trigger(0.99);
    expect(pauses).toHaveLength(1); // only one pause event
  });

  test('reset allows re-triggering', async () => {
    const p = makeProtocol();
    await p.trigger(0.99);
    p.reset();
    expect(p.getState()).toBe('idle');
    const pauses: number[] = [];
    p.on('trading:pause', () => pauses.push(1));
    await p.trigger(0.99);
    expect(pauses).toHaveLength(1);
  });
});

describe('EmergencyProtocol — attachTo integration', () => {
  test('responds to CRITICAL_COLLAPSE event from attached source', async () => {
    const p = makeProtocol();
    const source = new EventEmitter();
    p.attachTo(source);
    const pauses: number[] = [];
    p.on('trading:pause', () => pauses.push(1));
    source.emit('CRITICAL_COLLAPSE', 0.999);
    // Allow async trigger to complete
    await new Promise((r) => setTimeout(r, 50));
    expect(pauses).toHaveLength(1);
  });
});

describe('EmergencyProtocol — withdrawal simulation', () => {
  test('emits withdrawal:simulated for each cold storage address', async () => {
    const addresses = ['0xABC', '0xDEF'];
    const p = makeProtocol(true, addresses);
    const withdrawals: unknown[] = [];
    p.on('withdrawal:simulated', (payload) => withdrawals.push(payload));
    await p.trigger(0.999);
    expect(withdrawals).toHaveLength(2);
    const addrs = withdrawals.map((w) => (w as { address: string }).address);
    expect(addrs).toContain('0xABC');
    expect(addrs).toContain('0xDEF');
  });

  test('no withdrawal events when emergencyWithdrawal is false', async () => {
    const p = makeProtocol(false, ['0xABC']);
    const withdrawals: unknown[] = [];
    p.on('withdrawal:simulated', (payload) => withdrawals.push(payload));
    await p.trigger(0.999);
    expect(withdrawals).toHaveLength(0);
  });
});
