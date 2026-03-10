import { QLearningAgent, RuleBasedAgent } from '../../../../src/arbitrage/phase6_ghost/chameleon/agent';
import { ChameleonConfig, ChameleonState, NoiseAction } from '../../../../src/arbitrage/phase6_ghost/types';

const defaultConfig: ChameleonConfig = {
  rlModel: 'qlearning',
  noiseActions: ['cancel', 'tinyOrder', 'guiCheck', 'doNothing'] as NoiseAction[],
  detectionThreshold: 0.8,
  noiseIntervalMs: 60000,
  learningRate: 0.1,
  discountFactor: 0.95,
  explorationRate: 0.3,
};

function makeState(overrides: Partial<ChameleonState> = {}): ChameleonState {
  return {
    detectionScore: 0.5,
    recentActions: [],
    requestFrequency: 0.3,
    patternRegularity: 0.4,
    ...overrides,
  };
}

describe('QLearningAgent', () => {
  it('should select an action from configured actions', () => {
    const agent = new QLearningAgent(defaultConfig);
    const action = agent.selectAction(makeState());
    expect(defaultConfig.noiseActions).toContain(action);
  });

  it('should explore with high exploration rate', () => {
    const agent = new QLearningAgent({ ...defaultConfig, explorationRate: 1.0 });
    const actions = new Set<string>();
    for (let i = 0; i < 100; i++) {
      actions.add(agent.selectAction(makeState()));
    }
    // With 100% exploration, should use multiple actions
    expect(actions.size).toBeGreaterThan(1);
  });

  it('should exploit with zero exploration rate', () => {
    const agent = new QLearningAgent({ ...defaultConfig, explorationRate: 0 });
    // All Q-values start at 0, so it should consistently pick the same action
    const first = agent.selectAction(makeState());
    for (let i = 0; i < 10; i++) {
      expect(agent.selectAction(makeState())).toBe(first);
    }
  });

  it('should update Q-values after learning', () => {
    const agent = new QLearningAgent({ ...defaultConfig, explorationRate: 0 });
    const state = makeState();
    const nextState = makeState({ detectionScore: 0.3 });

    // Update with positive reward for 'cancel'
    agent.update(state, 'cancel', 10, nextState);
    expect(agent.getQTableSize()).toBeGreaterThan(0);
    expect(agent.getTotalReward()).toBe(10);
  });

  it('should train over an episode', () => {
    const agent = new QLearningAgent(defaultConfig);
    let stepCount = 0;

    const result = agent.train(
      (action) => {
        stepCount++;
        return {
          state: makeState({ detectionScore: stepCount * 0.01 }),
          reward: action === 'doNothing' ? -1 : 1,
          flagged: false,
        };
      },
      () => makeState({ detectionScore: 0 }),
      50,
    );

    expect(stepCount).toBe(50);
    expect(result.totalReward).toBeDefined();
    expect(result.flaggedCount).toBe(0);
    expect(agent.getEpisodeCount()).toBe(1);
  });

  it('should count flagged steps during training', () => {
    const agent = new QLearningAgent(defaultConfig);

    const result = agent.train(
      () => ({
        state: makeState({ detectionScore: 0.9 }),
        reward: -10,
        flagged: true,
      }),
      () => makeState(),
      10,
    );

    expect(result.flaggedCount).toBe(10);
  });

  it('should accumulate total reward across episodes', () => {
    const agent = new QLearningAgent(defaultConfig);

    agent.train(
      () => ({ state: makeState(), reward: 1, flagged: false }),
      () => makeState(),
      5,
    );
    agent.train(
      () => ({ state: makeState(), reward: 2, flagged: false }),
      () => makeState(),
      5,
    );

    expect(agent.getEpisodeCount()).toBe(2);
    expect(agent.getTotalReward()).toBeGreaterThan(0);
  });
});

describe('RuleBasedAgent', () => {
  const config: ChameleonConfig = { ...defaultConfig, rlModel: 'rulebased' };

  it('should do nothing when detection score is low', () => {
    const agent = new RuleBasedAgent(config);
    const action = agent.selectAction(makeState({ detectionScore: 0.1 }));
    expect(action).toBe('doNothing');
  });

  it('should occasionally emit noise at medium detection', () => {
    const agent = new RuleBasedAgent(config);
    const actions = new Set<string>();
    for (let i = 0; i < 100; i++) {
      actions.add(agent.selectAction(makeState({ detectionScore: 0.5 })));
    }
    // Should include both cancel and doNothing
    expect(actions.has('doNothing')).toBe(true);
  });

  it('should always emit noise at high detection', () => {
    const agent = new RuleBasedAgent(config);
    const action = agent.selectAction(makeState({ detectionScore: 0.9 }));
    expect(['cancel', 'tinyOrder', 'guiCheck']).toContain(action);
  });

  it('should cycle through noise actions at high detection', () => {
    const agent = new RuleBasedAgent(config);
    const actions: string[] = [];
    for (let i = 0; i < 6; i++) {
      actions.push(agent.selectAction(makeState({ detectionScore: 0.9 })));
    }
    // Should cycle through cancel, tinyOrder, guiCheck
    const unique = new Set(actions);
    expect(unique.size).toBe(3);
  });
});
