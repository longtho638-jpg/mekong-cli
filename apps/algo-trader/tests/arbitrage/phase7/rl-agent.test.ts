/**
 * Tests: rl-agent.ts — action selection and state encoding.
 */

import { RLAgent } from '../../../src/arbitrage/phase7_aan/rlSpreadOptimizer/rl-agent';
import type { MarketState } from '../../../src/arbitrage/phase7_aan/rlSpreadOptimizer/market-env';

const makeState = (overrides: Partial<MarketState> = {}): MarketState => ({
  spread: 5,
  depth: 50,
  volatility: 10,
  inventory: 0,
  midPrice: 50_000,
  timestamp: Date.now(),
  ...overrides,
});

describe('RLAgent', () => {
  it('loadPolicy resolves without error', async () => {
    const agent = new RLAgent();
    await expect(agent.loadPolicy()).resolves.toBeUndefined();
  });

  it('selectAction returns valid SpreadAction shape', () => {
    const agent = new RLAgent({ explorationRate: 0 });
    const action = agent.selectAction(makeState());
    expect(action).toHaveProperty('spreadDeltaBps');
    expect(action).toHaveProperty('sizeMultiplier');
    expect(typeof action.spreadDeltaBps).toBe('number');
    expect(typeof action.sizeMultiplier).toBe('number');
  });

  it('spreadDeltaBps is within maxSpreadDeltaBps bounds', () => {
    const agent = new RLAgent({ explorationRate: 0, maxSpreadDeltaBps: 3 });
    for (let i = 0; i < 20; i++) {
      const action = agent.selectAction(makeState());
      expect(action.spreadDeltaBps).toBeGreaterThanOrEqual(-3);
      expect(action.spreadDeltaBps).toBeLessThanOrEqual(3);
    }
  });

  it('sizeMultiplier stays within configured range', () => {
    const agent = new RLAgent({ explorationRate: 0, sizeMultiplierRange: [0.2, 2.0] });
    for (let i = 0; i < 20; i++) {
      const action = agent.selectAction(makeState());
      expect(action.sizeMultiplier).toBeGreaterThanOrEqual(0.2);
      expect(action.sizeMultiplier).toBeLessThanOrEqual(2.0);
    }
  });

  it('increments step count on each selectAction call', () => {
    const agent = new RLAgent();
    agent.selectAction(makeState());
    agent.selectAction(makeState());
    agent.selectAction(makeState());
    expect(agent.getStepCount()).toBe(3);
  });

  it('encodeState returns a 4-element numeric array', () => {
    const agent = new RLAgent();
    const vec = agent.encodeState(makeState());
    expect(vec).toHaveLength(4);
    vec.forEach((v) => expect(typeof v).toBe('number'));
  });

  it('high volatility state triggers wider spread (exploit mode)', () => {
    const agent = new RLAgent({ explorationRate: 0, maxSpreadDeltaBps: 5 });
    const lowVol = agent.selectAction(makeState({ volatility: 2 }));
    const highVol = agent.selectAction(makeState({ volatility: 40 }));
    // High volatility should push spread delta positive (wider)
    expect(highVol.spreadDeltaBps).toBeGreaterThan(lowVol.spreadDeltaBps);
  });

  it('exploration mode still returns valid action bounds', () => {
    const agent = new RLAgent({ explorationRate: 1.0, maxSpreadDeltaBps: 3, sizeMultiplierRange: [0.1, 3.0] });
    for (let i = 0; i < 20; i++) {
      const action = agent.selectAction(makeState());
      expect(action.spreadDeltaBps).toBeGreaterThanOrEqual(-3);
      expect(action.spreadDeltaBps).toBeLessThanOrEqual(3);
      expect(action.sizeMultiplier).toBeGreaterThanOrEqual(0.1);
      expect(action.sizeMultiplier).toBeLessThanOrEqual(3.0);
    }
  });
});
