import { StealthExecutionAlgorithms } from '../../src/execution/stealth-execution-algorithms';
import { BinhPhapStealthStrategy } from '../../src/execution/binh-phap-stealth-trading-strategy';

describe('StealthExecutionAlgorithms', () => {
  test('createTwapPlan generates randomized chunks and delays', () => {
    const totalAmount = 1.0;
    const durationMs = 600_000; // 10 mins
    const numChunks = 5;
    
    const plan = StealthExecutionAlgorithms.createTwapPlan(totalAmount, durationMs, numChunks);
    
    expect(plan.totalAmount).toBe(totalAmount);
    expect(plan.childOrders.length).toBeLessThanOrEqual(numChunks + 1);
    
    const sum = plan.childOrders.reduce((acc, o) => acc + o.amount, 0);
    expect(sum).toBeCloseTo(totalAmount, 8);
    
    // Delays should be jittered around 120,000ms
    plan.childOrders.forEach(o => {
      expect(o.delayMs).toBeGreaterThan(0);
    });
  });

  test('createIcebergPlan generates small tips', () => {
    const totalAmount = 1.0;
    const tipSize = 0.1;
    const price = 50000;
    
    const plan = StealthExecutionAlgorithms.createIcebergPlan(totalAmount, tipSize, price);
    
    expect(plan.childOrders.length).toBeGreaterThanOrEqual(8); // 1.0 / 0.1 with jitter
    const sum = plan.childOrders.reduce((acc, o) => acc + o.amount, 0);
    expect(sum).toBeCloseTo(totalAmount, 8);
    
    plan.childOrders.forEach(o => {
      expect(o.price).toBe(price);
      expect(o.type).toBe('limit');
    });
  });

  test('applyAntiPatternCamouflage randomizes values', () => {
    const originalPlan = {
      totalAmount: 1.0,
      childOrders: [{ amount: 0.1, delayMs: 1000, type: 'market' as const }],
      algorithm: 'test'
    };
    
    const camouflagedPlan = StealthExecutionAlgorithms.applyAntiPatternCamouflage({...originalPlan});
    
    expect(camouflagedPlan.childOrders[0].amount).not.toBe(0.1);
    expect(camouflagedPlan.childOrders[0].delayMs).not.toBe(1000);
  });
});

describe('BinhPhapStealthStrategy integration', () => {
  let strategy: BinhPhapStealthStrategy;

  beforeEach(() => {
    strategy = new BinhPhapStealthStrategy();
  });

  test('planExecution returns detailed child orders for TWAP', () => {
    const plan = strategy.planExecution('binance', 1.0, 'BTC/USDT', 90, {
      mode: 'twap',
      durationMs: 300_000
    });

    expect(plan.shouldProceed).toBe(true);
    expect(plan.algorithm).toContain('TWAP');
    expect(plan.childOrders.length).toBeGreaterThan(1);
    expect(plan.orderChunks.length).toBe(plan.childOrders.length);
  });

  test('planExecution blocks on low confidence', () => {
    const plan = strategy.planExecution('binance', 1.0, 'BTC/USDT', 20);
    expect(plan.shouldProceed).toBe(false);
    expect(plan.reason).toContain('Confidence');
  });
});
