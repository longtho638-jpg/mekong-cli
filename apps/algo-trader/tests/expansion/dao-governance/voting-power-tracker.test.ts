import { VotingPowerTracker } from '../../../src/expansion/dao-governance/voting-power-tracker';

const ONE_TOKEN = 10n ** 18n;

describe('VotingPowerTracker', () => {
  it('getVotingPower returns 0 for unknown address', () => {
    const tracker = new VotingPowerTracker();
    expect(tracker.getVotingPower('0x1234')).toBe(0);
  });

  it('getVotingPower returns sqrt of whole token balance', () => {
    const tracker = new VotingPowerTracker();
    tracker.setBalance('0xABC', 100n * ONE_TOKEN);
    expect(tracker.getVotingPower('0xABC')).toBeCloseTo(10, 5);
  });

  it('setBalance updates existing holder', () => {
    const tracker = new VotingPowerTracker();
    tracker.setBalance('0xABC', 100n * ONE_TOKEN);
    tracker.setBalance('0xABC', 400n * ONE_TOKEN);
    expect(tracker.getVotingPower('0xABC')).toBeCloseTo(20, 5);
  });

  it('removeHolder returns true and removes from snapshot', () => {
    const tracker = new VotingPowerTracker();
    tracker.setBalance('0xABC', 100n * ONE_TOKEN);
    expect(tracker.removeHolder('0xABC')).toBe(true);
    expect(tracker.snapshot().holderCount).toBe(0);
  });

  it('removeHolder returns false for unknown address', () => {
    const tracker = new VotingPowerTracker();
    expect(tracker.removeHolder('0xUNKNOWN')).toBe(false);
  });

  it('snapshot includes all holders', () => {
    const tracker = new VotingPowerTracker();
    tracker.setBalance('0xA', 100n * ONE_TOKEN);
    tracker.setBalance('0xB', 400n * ONE_TOKEN);
    const snap = tracker.snapshot();
    expect(snap.holderCount).toBe(2);
    expect(snap.totalVotingPower).toBeCloseTo(30, 4); // sqrt(100)+sqrt(400)=10+20
  });

  it('getTotalVotingPower matches snapshot total', () => {
    const tracker = new VotingPowerTracker();
    tracker.setBalance('0xA', 100n * ONE_TOKEN);
    expect(tracker.getTotalVotingPower()).toBeCloseTo(tracker.snapshot().totalVotingPower, 10);
  });

  it('emits snapshot event', () => {
    const tracker = new VotingPowerTracker();
    const events: unknown[] = [];
    tracker.on('snapshot', (s) => events.push(s));
    tracker.snapshot();
    expect(events).toHaveLength(1);
  });
});
