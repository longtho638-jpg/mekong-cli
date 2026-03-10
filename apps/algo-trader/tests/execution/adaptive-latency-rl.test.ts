import {
  AdaptiveLatencyRL,
  LatencyAction,
  LatencyState,
} from '../../src/execution/adaptive-latency-rl';

describe('AdaptiveLatencyRL', () => {
  let rl: AdaptiveLatencyRL;

  beforeEach(() => {
    rl = new AdaptiveLatencyRL();
  });

  // 1. Q-table initialisation
  describe('constructor', () => {
    it('initialises Q-table as 27×4 zeros', () => {
      const qt = rl.getQTable();
      expect(qt).toHaveLength(27);
      qt.forEach(row => {
        expect(row).toHaveLength(4);
        row.forEach(v => expect(v).toBe(0));
      });
    });

    it('accepts custom config', () => {
      const custom = new AdaptiveLatencyRL({ learningRate: 0.5, explorationRate: 1.0 });
      expect(custom.getExplorationRate()).toBe(1.0);
    });
  });

  // 2-4. computeState() binning
  describe('computeState()', () => {
    it('bins latency: low < 100ms', () => {
      const s = rl.computeState(50, 0, 0.9);
      expect(s.latencyBin).toBe(0);
    });

    it('bins latency: medium 100–299ms', () => {
      const s = rl.computeState(200, 0, 0.9);
      expect(s.latencyBin).toBe(1);
    });

    it('bins latency: high >= 300ms', () => {
      const s = rl.computeState(500, 0, 0.9);
      expect(s.latencyBin).toBe(2);
    });

    it('bins spread velocity: contracting (< 0)', () => {
      const s = rl.computeState(50, -1, 0.9);
      expect(s.spreadVelocityBin).toBe(0);
    });

    it('bins spread velocity: stable (=== 0)', () => {
      const s = rl.computeState(50, 0, 0.9);
      expect(s.spreadVelocityBin).toBe(1);
    });

    it('bins spread velocity: expanding (> 0)', () => {
      const s = rl.computeState(50, 0.5, 0.9);
      expect(s.spreadVelocityBin).toBe(2);
    });

    it('bins fill rate: poor (< 0.5)', () => {
      const s = rl.computeState(50, 0, 0.3);
      expect(s.fillRateBin).toBe(0);
    });

    it('bins fill rate: moderate (0.5–0.79)', () => {
      const s = rl.computeState(50, 0, 0.65);
      expect(s.fillRateBin).toBe(1);
    });

    it('bins fill rate: good (>= 0.8)', () => {
      const s = rl.computeState(50, 0, 0.95);
      expect(s.fillRateBin).toBe(2);
    });
  });

  // 5. selectAction — pure exploration
  describe('selectAction() — pure exploration', () => {
    it('selects random action when explorationRate = 1.0', () => {
      const forceExplore = new AdaptiveLatencyRL({
        explorationRate: 1.0,
        explorationDecay: 1.0, // no decay
      });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 1, fillRateBin: 2 };
      const actions = new Set<LatencyAction>();
      for (let i = 0; i < 200; i++) {
        actions.add(forceExplore.selectAction(state).action);
      }
      // With 200 trials at 100% exploration all 4 actions should appear
      expect(actions.size).toBe(4);
    });

    it('marks wasExploration = true at explorationRate = 1.0', () => {
      const forceExplore = new AdaptiveLatencyRL({ explorationRate: 1.0, explorationDecay: 1.0 });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      const result = forceExplore.selectAction(state);
      expect(result.wasExploration).toBe(true);
    });
  });

  // 6. selectAction — pure exploitation
  describe('selectAction() — pure exploitation', () => {
    it('always returns action with max Q-value at explorationRate = 0', () => {
      const greedy = new AdaptiveLatencyRL({ explorationRate: 0, explorationDecay: 1.0 });
      const state: LatencyState = { latencyBin: 1, spreadVelocityBin: 1, fillRateBin: 1 };

      // Manually set a high reward for 'delayed_send' via receiveReward
      const nextState: LatencyState = { latencyBin: 0, spreadVelocityBin: 1, fillRateBin: 2 };
      for (let i = 0; i < 20; i++) {
        greedy.receiveReward(greedy['stateToIndex'](state), 'delayed_send', 100, nextState);
      }

      const result = greedy.selectAction(state);
      expect(result.action).toBe('delayed_send');
      expect(result.wasExploration).toBe(false);
    });
  });

  // 7. receiveReward() — Q-learning formula
  describe('receiveReward()', () => {
    it('updates Q-table using Bellman equation', () => {
      const agent = new AdaptiveLatencyRL({
        learningRate: 0.1,
        discountFactor: 0.95,
        explorationRate: 0,
        explorationDecay: 1.0,
      });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      const nextState: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      const stateIdx = agent['stateToIndex'](state);

      // Q(s,a) = 0 + 0.1 * (10 + 0.95*0 - 0) = 1.0
      agent.receiveReward(stateIdx, 'normal', 10, nextState);
      const qt = agent.getQTable();
      const normalIdx = 1; // ACTIONS index of 'normal'
      expect(qt[stateIdx][normalIdx]).toBeCloseTo(1.0, 5);
    });

    it('second update builds on first (compound Q update)', () => {
      const agent = new AdaptiveLatencyRL({
        learningRate: 0.1,
        discountFactor: 0.95,
        explorationRate: 0,
        explorationDecay: 1.0,
      });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      const nextState: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      const idx = agent['stateToIndex'](state);

      agent.receiveReward(idx, 'normal', 10, nextState); // Q = 1.0
      agent.receiveReward(idx, 'normal', 10, nextState); // Q = 1 + 0.1*(10 + 0.95*1 - 1) = 1.995
      const qt = agent.getQTable();
      expect(qt[idx][1]).toBeCloseTo(1.0 + 0.1 * (10 + 0.95 * 1.0 - 1.0), 4);
    });
  });

  // 8. After repeated rewards one action dominates
  describe('learning convergence', () => {
    it('preferred action accumulates highest Q-value over many steps', () => {
      const agent = new AdaptiveLatencyRL({
        learningRate: 0.3,
        explorationRate: 0,
        explorationDecay: 1.0,
      });
      const state: LatencyState = { latencyBin: 1, spreadVelocityBin: 1, fillRateBin: 1 };
      const nextState: LatencyState = { latencyBin: 1, spreadVelocityBin: 1, fillRateBin: 1 };
      const idx = agent['stateToIndex'](state);

      for (let i = 0; i < 50; i++) {
        agent.receiveReward(idx, 'early_send', 5, nextState);
        agent.receiveReward(idx, 'normal', -1, nextState);
        agent.receiveReward(idx, 'skip', -2, nextState);
      }

      const qt = agent.getQTable();
      const earlySendQ = qt[idx][0];
      expect(earlySendQ).toBeGreaterThan(qt[idx][1]); // > normal
      expect(earlySendQ).toBeGreaterThan(qt[idx][3]); // > skip
    });
  });

  // 9. Exploration decay
  describe('exploration rate decay', () => {
    it('decays after each receiveReward call', () => {
      const agent = new AdaptiveLatencyRL({
        explorationRate: 0.5,
        explorationDecay: 0.9,
        minExploration: 0.01,
      });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      const before = agent.getExplorationRate();
      agent.receiveReward(0, 'normal', 1, state);
      expect(agent.getExplorationRate()).toBeLessThan(before);
    });

    it('does not decay below minExploration', () => {
      const agent = new AdaptiveLatencyRL({
        explorationRate: 0.051,
        explorationDecay: 0.1,
        minExploration: 0.05,
      });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      agent.receiveReward(0, 'normal', 1, state);
      expect(agent.getExplorationRate()).toBeGreaterThanOrEqual(0.05);
    });
  });

  // 10. getTimingOffsetMs
  describe('getTimingOffsetMs()', () => {
    it('early_send returns -50ms', () => {
      expect(rl.getTimingOffsetMs('early_send')).toBe(-50);
    });

    it('normal returns 0ms', () => {
      expect(rl.getTimingOffsetMs('normal')).toBe(0);
    });

    it('delayed_send returns +100ms', () => {
      expect(rl.getTimingOffsetMs('delayed_send')).toBe(100);
    });

    it('skip returns 0ms (N/A sentinel)', () => {
      expect(rl.getTimingOffsetMs('skip')).toBe(0);
    });
  });

  // 11. reset()
  describe('reset()', () => {
    it('clears Q-table back to zeros', () => {
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      rl.receiveReward(0, 'normal', 100, state);
      rl.reset();
      const qt = rl.getQTable();
      qt.forEach(row => row.forEach(v => expect(v).toBe(0)));
    });

    it('resets exploration rate to default 0.2', () => {
      const agent = new AdaptiveLatencyRL({ explorationRate: 0.8, explorationDecay: 0.5 });
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      for (let i = 0; i < 10; i++) agent.receiveReward(0, 'normal', 1, state);
      agent.reset();
      expect(agent.getExplorationRate()).toBe(0.2);
    });
  });

  // 12. State index formula
  describe('stateToIndex()', () => {
    it('computes index = latency*9 + spread*3 + fillRate', () => {
      const cases: [LatencyState, number][] = [
        [{ latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 }, 0],
        [{ latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 1 }, 1],
        [{ latencyBin: 0, spreadVelocityBin: 1, fillRateBin: 0 }, 3],
        [{ latencyBin: 1, spreadVelocityBin: 0, fillRateBin: 0 }, 9],
        [{ latencyBin: 2, spreadVelocityBin: 2, fillRateBin: 2 }, 26],
      ];
      cases.forEach(([state, expected]) => {
        expect(rl['stateToIndex'](state)).toBe(expected);
      });
    });

    it('all 27 states produce unique indices', () => {
      const indices = new Set<number>();
      for (let l = 0; l < 3; l++) {
        for (let s = 0; s < 3; s++) {
          for (let f = 0; f < 3; f++) {
            indices.add(rl['stateToIndex']({
              latencyBin: l as 0 | 1 | 2,
              spreadVelocityBin: s as 0 | 1 | 2,
              fillRateBin: f as 0 | 1 | 2,
            }));
          }
        }
      }
      expect(indices.size).toBe(27);
    });
  });

  // 13. Edge cases at thresholds
  describe('edge cases', () => {
    it('latency exactly at lower threshold is medium bin', () => {
      const s = rl.computeState(100, 0, 0.9); // exactly 100ms
      expect(s.latencyBin).toBe(1);
    });

    it('latency exactly at upper threshold is high bin', () => {
      const s = rl.computeState(300, 0, 0.9); // exactly 300ms
      expect(s.latencyBin).toBe(2);
    });

    it('fill rate exactly at lower threshold is moderate bin', () => {
      const s = rl.computeState(50, 0, 0.5);
      expect(s.fillRateBin).toBe(1);
    });

    it('fill rate exactly at upper threshold is good bin', () => {
      const s = rl.computeState(50, 0, 0.8);
      expect(s.fillRateBin).toBe(2);
    });

    it('negative fill rate falls into poor bin', () => {
      const s = rl.computeState(50, 0, -0.1);
      expect(s.fillRateBin).toBe(0);
    });

    it('very high latency stays in high bin', () => {
      const s = rl.computeState(10000, 0, 0.9);
      expect(s.latencyBin).toBe(2);
    });
  });

  // EventEmitter
  describe('events', () => {
    it('emits action:selected with ActionResult', done => {
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 1, fillRateBin: 2 };
      rl.once('action:selected', result => {
        expect(result).toHaveProperty('action');
        expect(result).toHaveProperty('state');
        expect(result).toHaveProperty('stateIndex');
        expect(result).toHaveProperty('wasExploration');
        done();
      });
      rl.selectAction(state);
    });

    it('emits reward:received after receiveReward', done => {
      const state: LatencyState = { latencyBin: 0, spreadVelocityBin: 0, fillRateBin: 0 };
      rl.once('reward:received', payload => {
        expect(payload.reward).toBe(42);
        done();
      });
      rl.receiveReward(0, 'normal', 42, state);
    });
  });
});
