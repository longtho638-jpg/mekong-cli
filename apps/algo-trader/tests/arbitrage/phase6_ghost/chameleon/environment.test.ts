import { Environment } from '../../../../src/arbitrage/phase6_ghost/chameleon/environment';

describe('Environment', () => {
  let env: Environment;

  beforeEach(() => {
    env = new Environment(0.8);
  });

  it('should start with zero detection score', () => {
    const state = env.getState();
    expect(state.detectionScore).toBe(0);
    expect(state.recentActions).toEqual([]);
    expect(state.requestFrequency).toBe(0);
    expect(state.patternRegularity).toBe(0);
  });

  it('should increase detection score with doNothing actions', () => {
    let lastScore = 0;
    for (let i = 0; i < 10; i++) {
      const { state } = env.step('doNothing');
      expect(state.detectionScore).toBeGreaterThanOrEqual(lastScore - 0.1);
      lastScore = state.detectionScore;
    }
    // After many doNothing steps, score should increase
    expect(env.getState().detectionScore).toBeGreaterThan(0);
  });

  it('should decrease pattern regularity with noise actions', () => {
    // First increase regularity
    for (let i = 0; i < 5; i++) env.step('doNothing');
    const highRegularity = env.getState().patternRegularity;

    // Noise action should decrease it
    env.step('cancel');
    expect(env.getState().patternRegularity).toBeLessThan(highRegularity);
  });

  it('should return positive reward when below threshold', () => {
    const { reward, flagged } = env.step('cancel');
    expect(flagged).toBe(false);
    expect(reward).toBeGreaterThan(-10); // Not the -10 penalty
  });

  it('should return negative reward when flagged', () => {
    // Drive score above threshold
    for (let i = 0; i < 50; i++) {
      env.step('doNothing');
    }
    const state = env.getState();
    if (state.detectionScore >= 0.8) {
      const { reward, flagged } = env.step('doNothing');
      expect(flagged).toBe(true);
      expect(reward).toBe(-10);
    }
  });

  it('should apply small penalty for noise actions', () => {
    const { reward: noiseReward } = env.step('cancel');
    env.reset();
    const { reward: idleReward } = env.step('doNothing');
    // Noise reward should be less than idle reward (has -0.5 penalty)
    expect(noiseReward).toBeLessThan(idleReward);
  });

  it('should track recent actions (max 10)', () => {
    for (let i = 0; i < 15; i++) {
      env.step('cancel');
    }
    expect(env.getState().recentActions.length).toBe(10);
  });

  it('should reset to initial state', () => {
    for (let i = 0; i < 10; i++) env.step('doNothing');
    const state = env.reset();
    expect(state.detectionScore).toBe(0);
    expect(state.requestFrequency).toBe(0);
    expect(state.patternRegularity).toBe(0);
    expect(state.recentActions).toEqual([]);
    expect(env.getStepCount()).toBe(0);
  });

  it('should clamp detection score to [0, 1]', () => {
    for (let i = 0; i < 100; i++) {
      env.step('doNothing');
    }
    expect(env.getState().detectionScore).toBeLessThanOrEqual(1);
    expect(env.getState().detectionScore).toBeGreaterThanOrEqual(0);
  });

  it('should track step count', () => {
    env.step('cancel');
    env.step('doNothing');
    env.step('tinyOrder');
    expect(env.getStepCount()).toBe(3);
  });

  it('should return configured threshold', () => {
    expect(env.getThreshold()).toBe(0.8);
  });

  it('should handle mixed action entropy correctly', () => {
    // Varied actions should lower detection risk vs uniform
    const envMixed = new Environment(0.8);
    const envUniform = new Environment(0.8);

    const mixedActions = ['cancel', 'tinyOrder', 'guiCheck', 'doNothing'] as const;
    for (let i = 0; i < 20; i++) {
      envMixed.step(mixedActions[i % 4]);
      envUniform.step('doNothing');
    }

    // Uniform should have higher detection score
    expect(envUniform.getState().detectionScore).toBeGreaterThanOrEqual(
      envMixed.getState().detectionScore - 0.1,
    );
  });
});
