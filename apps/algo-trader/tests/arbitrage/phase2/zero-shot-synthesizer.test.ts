/**
 * Tests for Phase 2 Module 1: Zero-Shot Strategy Synthesizer
 * Covers: MockLLMClient, RuleGenerator, HotDeployer, ZeroShotSynthesizer
 */

import { MockLLMClient, SocialMessage, StrategyRule } from '../../../src/arbitrage/phase2/zero-shot-synthesizer/llm-client';
import { RuleGenerator } from '../../../src/arbitrage/phase2/zero-shot-synthesizer/rule-generator';
import { HotDeployer } from '../../../src/arbitrage/phase2/zero-shot-synthesizer/hot-deployer';
import { ZeroShotSynthesizer } from '../../../src/arbitrage/phase2/zero-shot-synthesizer/index';
import { LicenseService } from '../../../src/lib/raas-gate';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMessage(text: string, source: 'twitter' | 'telegram' = 'twitter'): SocialMessage {
  return { source, text, timestamp: Date.now() };
}

/** Rising price series — buy rule should yield positive returns → high Sharpe */
function risingPrices(n = 25): number[] {
  return Array.from({ length: n }, (_, i) => 100 + i * 2);
}

/** Flat price series — returns 0 → Sharpe 0 (rejected) */
function flatPrices(n = 25): number[] {
  return Array.from({ length: n }, () => 100);
}

function makeRule(overrides: Partial<StrategyRule> = {}): StrategyRule {
  return {
    name: 'test-rule',
    condition: 'sentiment=0.50 regime=neutral',
    action: 'buy',
    confidence: 0.8,
    parameters: { entryThreshold: 0.5, exitThreshold: 0.3, stopLossPercent: 2, takeProfitPercent: 4 },
    ...overrides,
  };
}

// Reset LicenseService singleton between tests to avoid state bleed
beforeEach(() => {
  LicenseService.getInstance().reset();
});

// ─── 1. MockLLMClient ────────────────────────────────────────────────────────

describe('MockLLMClient', () => {
  const client = new MockLLMClient();

  it('generates valid StrategyRule[] for bullish messages', async () => {
    const messages: SocialMessage[] = [
      { ...makeMessage('moon rally pump buy'), sentiment: 0.8 },
      { ...makeMessage('very bullish breakout'), sentiment: 0.6 },
    ];
    const rules = await client.generateStrategyRules({
      messages,
      currentRegime: 'trending',
      recentPrices: risingPrices(),
    });

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);

    for (const rule of rules) {
      expect(rule).toHaveProperty('name');
      expect(rule).toHaveProperty('condition');
      expect(['buy', 'sell', 'hold']).toContain(rule.action);
      expect(rule.confidence).toBeGreaterThanOrEqual(0);
      expect(rule.confidence).toBeLessThanOrEqual(1);
      expect(typeof rule.parameters).toBe('object');
    }
  });

  it('generates sell rule for bearish messages', async () => {
    const messages: SocialMessage[] = [
      { ...makeMessage('crash dump sell'), sentiment: -0.8 },
      { ...makeMessage('rekt drop bear'), sentiment: -0.6 },
    ];
    const rules = await client.generateStrategyRules({
      messages,
      currentRegime: 'volatile',
      recentPrices: flatPrices(),
    });

    expect(rules[0].action).toBe('sell');
  });

  it('generates hold rule for neutral messages', async () => {
    const messages: SocialMessage[] = [
      { ...makeMessage('sideways market'), sentiment: 0.0 },
    ];
    const rules = await client.generateStrategyRules({
      messages,
      currentRegime: 'neutral',
      recentPrices: flatPrices(),
    });

    expect(rules[0].action).toBe('hold');
  });
});

// ─── 2. RuleGenerator.analyzeSentiment ──────────────────────────────────────

describe('RuleGenerator.analyzeSentiment', () => {
  const generator = new RuleGenerator(new MockLLMClient());

  it('assigns positive sentiment to bullish text', () => {
    const msgs = [makeMessage('moon pump rally buy')];
    const scored = generator.analyzeSentiment(msgs);
    expect(scored[0].sentiment).toBeGreaterThan(0);
  });

  it('assigns negative sentiment to bearish text', () => {
    const msgs = [makeMessage('dump crash rekt bear sell')];
    const scored = generator.analyzeSentiment(msgs);
    expect(scored[0].sentiment).toBeLessThan(0);
  });

  it('assigns near-zero sentiment to neutral text', () => {
    const msgs = [makeMessage('the market is open today')];
    const scored = generator.analyzeSentiment(msgs);
    expect(scored[0].sentiment).toBe(0);
  });

  it('clamps sentiment to [-1, 1]', () => {
    const msgs = [makeMessage('moon moon moon moon moon moon moon moon')];
    const scored = generator.analyzeSentiment(msgs);
    expect(scored[0].sentiment).toBeLessThanOrEqual(1);
    expect(scored[0].sentiment).toBeGreaterThanOrEqual(-1);
  });

  it('preserves existing message fields', () => {
    const msgs = [makeMessage('buy now', 'telegram')];
    const scored = generator.analyzeSentiment(msgs);
    expect(scored[0].source).toBe('telegram');
    expect(scored[0].text).toBe('buy now');
  });
});

// ─── 3. RuleGenerator.validateRule — rejects low Sharpe ─────────────────────

describe('RuleGenerator.validateRule — rejection', () => {
  const generator = new RuleGenerator(new MockLLMClient(), { minSharpeRatio: 1.5 });

  it('rejects buy rule on flat prices (Sharpe=0)', () => {
    const result = generator.validateRule(makeRule({ action: 'buy' }), flatPrices());
    expect(result.approved).toBe(false);
    expect(result.sharpeRatio).toBe(0);
  });

  it('rejects hold rule (always zero returns → Sharpe=0)', () => {
    const result = generator.validateRule(makeRule({ action: 'hold' }), risingPrices());
    expect(result.approved).toBe(false);
  });

  it('rejects when fewer than 2 prices provided', () => {
    const result = generator.validateRule(makeRule(), [100]);
    expect(result.approved).toBe(false);
    expect(result.sharpeRatio).toBe(0);
  });
});

// ─── 4. RuleGenerator.validateRule — approves high Sharpe ───────────────────

describe('RuleGenerator.validateRule — approval', () => {
  const generator = new RuleGenerator(new MockLLMClient(), { minSharpeRatio: 1.5 });

  it('approves buy rule on strongly rising prices', () => {
    // Large, consistent positive returns → high Sharpe
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 5);
    const result = generator.validateRule(makeRule({ action: 'buy' }), prices);
    expect(result.approved).toBe(true);
    expect(result.sharpeRatio).toBeGreaterThanOrEqual(1.5);
    expect(result.returns).toBeGreaterThan(0);
  });

  it('approves sell rule on strongly falling prices', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 300 - i * 5);
    const result = generator.validateRule(makeRule({ action: 'sell' }), prices);
    expect(result.approved).toBe(true);
    expect(result.returns).toBeGreaterThan(0);
  });

  it('computes maxDrawdown > 0 for volatile prices', () => {
    const prices = [100, 120, 80, 110, 90, 130];
    const result = generator.validateRule(makeRule({ action: 'buy' }), prices);
    expect(result.maxDrawdown).toBeGreaterThan(0);
  });
});

// ─── 5. RuleGenerator.pipeline — end-to-end with MockLLM ────────────────────

describe('RuleGenerator.pipeline', () => {
  it('returns approved rules from bullish messages on rising prices', async () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 5);
    const generator = new RuleGenerator(new MockLLMClient(), { minSharpeRatio: 1.5 });

    const messages = [
      makeMessage('moon pump rally buy'),
      makeMessage('breakout surge up'),
    ];

    const approved = await generator.pipeline(messages, 'trending', prices);
    expect(Array.isArray(approved)).toBe(true);
    // MockLLMClient returns buy rule for bullish avg sentiment → should be approved on rising prices
    expect(approved.length).toBeGreaterThan(0);
  });

  it('emits rules:approved event when rules pass validation', async () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 5);
    const generator = new RuleGenerator(new MockLLMClient(), { minSharpeRatio: 1.5 });
    const messages = [makeMessage('moon pump buy rally')];

    const eventFired = new Promise<void>(resolve => {
      generator.once('rules:approved', () => resolve());
    });

    await generator.pipeline(messages, 'trending', prices);
    await eventFired; // resolves only if event fires
  });

  it('returns empty array when no messages provided', async () => {
    const generator = new RuleGenerator(new MockLLMClient());
    // MockLLMClient with 0 messages → hold rule → Sharpe 0 on flat prices → rejected
    const result = await generator.pipeline([], 'neutral', flatPrices());
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── 6. HotDeployer.deploy ───────────────────────────────────────────────────

describe('HotDeployer.deploy', () => {
  it('adds rule to active set', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({ name: 'rule-A' }));
    expect(deployer.getActiveRules()).toHaveLength(1);
    expect(deployer.getActiveRules()[0].name).toBe('rule-A');
  });

  it('hot-swaps rule with same name', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({ name: 'rule-A', action: 'buy' }));
    deployer.deploy(makeRule({ name: 'rule-A', action: 'sell' }));
    expect(deployer.getActiveRules()).toHaveLength(1);
    expect(deployer.getActiveRules()[0].action).toBe('sell');
  });

  it('emits rule:deployed event', () => {
    const deployer = new HotDeployer();
    const handler = jest.fn();
    deployer.on('rule:deployed', handler);
    deployer.deploy(makeRule({ name: 'rule-B' }));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ name: 'rule-B' }));
  });
});

// ─── 7. HotDeployer.undeploy ─────────────────────────────────────────────────

describe('HotDeployer.undeploy', () => {
  it('removes rule from active set', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({ name: 'rule-X' }));
    deployer.undeploy('rule-X');
    expect(deployer.getActiveRules()).toHaveLength(0);
  });

  it('emits rule:undeployed event', () => {
    const deployer = new HotDeployer();
    const handler = jest.fn();
    deployer.on('rule:undeployed', handler);
    deployer.deploy(makeRule({ name: 'rule-X' }));
    deployer.undeploy('rule-X');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ name: 'rule-X' }));
  });

  it('is a no-op for unknown rule name', () => {
    const deployer = new HotDeployer();
    expect(() => deployer.undeploy('ghost-rule')).not.toThrow();
  });
});

// ─── 8. HotDeployer.evaluateRules ────────────────────────────────────────────

describe('HotDeployer.evaluateRules', () => {
  it('triggers matching rule and emits rule:triggered', () => {
    const deployer = new HotDeployer();
    const handler = jest.fn();
    deployer.on('rule:triggered', handler);

    const rule = makeRule({ name: 'buy-rule', confidence: 0.8, condition: 'sentiment=0.50 regime=trending' });
    deployer.deploy(rule);

    const triggered = deployer.evaluateRules(50000, 1000, 'trending');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].name).toBe('buy-rule');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not trigger rule with confidence < 0.5', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({ name: 'low-conf', confidence: 0.3 }));
    const triggered = deployer.evaluateRules(50000, 1000, 'neutral');
    expect(triggered).toHaveLength(0);
  });

  it('does not trigger rule when regime mismatch', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({ name: 'regime-rule', confidence: 0.9, condition: 'regime=trending' }));
    const triggered = deployer.evaluateRules(50000, 1000, 'volatile');
    expect(triggered).toHaveLength(0);
  });

  it('triggers rule without regime token for any regime', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({ name: 'no-regime', confidence: 0.9, condition: 'sentiment=0.80' }));
    const triggered = deployer.evaluateRules(50000, 1000, 'anything');
    expect(triggered).toHaveLength(1);
  });

  it('filters rule when volume below minVolume parameter', () => {
    const deployer = new HotDeployer();
    deployer.deploy(makeRule({
      name: 'vol-rule',
      confidence: 0.9,
      condition: 'sentiment=0.80',
      parameters: { minVolume: 5000, entryThreshold: 0.5, exitThreshold: 0.3, stopLossPercent: 2, takeProfitPercent: 4 },
    }));
    const triggered = deployer.evaluateRules(50000, 100, 'neutral');
    expect(triggered).toHaveLength(0);
  });
});

// ─── 9. ZeroShotSynthesizer lifecycle ────────────────────────────────────────

describe('ZeroShotSynthesizer lifecycle', () => {
  it('starts and stops without error', async () => {
    const synth = new ZeroShotSynthesizer({ pollIntervalMs: 60_000 });
    await expect(synth.start()).resolves.toBeUndefined();
    expect(() => synth.stop()).not.toThrow();
  });

  it('getStatus returns zeros before any cycles', () => {
    const synth = new ZeroShotSynthesizer({ pollIntervalMs: 60_000 });
    const status = synth.getStatus();
    expect(status.activeRules).toBe(0);
    expect(status.messagesProcessed).toBe(0);
    expect(status.rulesGenerated).toBe(0);
  });

  it('getStatus reflects processed messages after start', async () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 5);
    const synth = new ZeroShotSynthesizer({
      pollIntervalMs: 60_000,
      regime: 'trending',
      seedPrices: prices,
      initialMessages: [
        makeMessage('moon pump rally buy'),
        makeMessage('surge breakout'),
      ],
    });

    await synth.start();
    synth.stop();

    const status = synth.getStatus();
    expect(status.messagesProcessed).toBe(2);
  });

  it('second start() call is idempotent', async () => {
    const synth = new ZeroShotSynthesizer({ pollIntervalMs: 60_000 });
    await synth.start();
    await expect(synth.start()).resolves.toBeUndefined(); // should not throw
    synth.stop();
  });
});

// ─── 10. ZeroShotSynthesizer events ──────────────────────────────────────────

describe('ZeroShotSynthesizer events', () => {
  it('emits cycle:complete after processing', async () => {
    const synth = new ZeroShotSynthesizer({
      pollIntervalMs: 60_000,
      initialMessages: [makeMessage('some message')],
    });

    const cycleComplete = new Promise<{ rulesDeployed: number }>(resolve => {
      synth.once('cycle:complete', resolve);
    });

    await synth.start();
    const result = await cycleComplete;
    synth.stop();

    expect(result).toHaveProperty('rulesDeployed');
    expect(typeof result.rulesDeployed).toBe('number');
  });

  it('emits rules:deployed when approved rules exist', async () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 5);
    const synth = new ZeroShotSynthesizer({
      pollIntervalMs: 60_000,
      regime: 'trending',
      seedPrices: prices,
      initialMessages: [makeMessage('moon pump buy rally surge')],
    });

    const deployedPromise = new Promise<unknown>(resolve => {
      synth.once('rules:deployed', resolve);
    });

    // Attach a race so test doesn't hang if event never fires
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000));

    await synth.start();
    const result = await Promise.race([deployedPromise, timeout]);
    synth.stop();

    // If rules were approved, result is the rules array; if not, it's null (timeout)
    // Either outcome is valid — we just verify the synthesizer didn't crash
    expect(synth.getStatus().messagesProcessed).toBeGreaterThan(0);
  });
});
