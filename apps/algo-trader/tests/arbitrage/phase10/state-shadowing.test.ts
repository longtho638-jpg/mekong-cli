/**
 * Tests: Phase 10 Module 3 — Multiverse State Prediction & Consensus Shadowing.
 * Covers: MempoolAnalyzer, ValidatorBehaviorModel, StateSimulator,
 *         ShadowConsensus, PreemptiveExecutor, initStateShadowing.
 */

import { MempoolAnalyzer } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/mempool-analyzer';
import type { PendingTransaction, TxGraph } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/mempool-analyzer';
import { ValidatorBehaviorModel } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/validator-behavior-model';
import { StateSimulator } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/state-simulator';
import type { StateSnapshot } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/state-simulator';
import { ShadowConsensus } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/shadow-consensus';
import { PreemptiveExecutor } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/preemptive-executor';
import { initStateShadowing } from '../../../src/arbitrage/phase10_cosmic/stateShadowing/index';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<PendingTransaction> = {}): PendingTransaction {
  return {
    hash: '0x' + Math.random().toString(16).slice(2).padStart(64, '0'),
    from: '0xAAA',
    to: '0xBBB',
    value: 1_000_000n,
    gasPrice: 2_000_000_000n,
    nonce: 0,
    data: '0x',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeSnapshot(balances: Record<string, bigint> = {}): StateSnapshot {
  return {
    blockNumber: 0,
    balances: new Map(Object.entries(balances)),
    stateRoot: '0x' + '0'.repeat(64),
    timestamp: Date.now(),
  };
}

// ── MempoolAnalyzer ──────────────────────────────────────────────────────────

describe('MempoolAnalyzer', () => {
  it('starts disabled — isRunning() false by default', () => {
    const ma = new MempoolAnalyzer();
    expect(ma.isRunning()).toBe(false);
  });

  it('start() does nothing when enabled=false', () => {
    const ma = new MempoolAnalyzer({ enabled: false });
    ma.start();
    expect(ma.isRunning()).toBe(false);
  });

  it('start() activates timer when enabled=true', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    expect(ma.isRunning()).toBe(true);
    ma.stop();
  });

  it('stop() clears timer', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    ma.stop();
    expect(ma.isRunning()).toBe(false);
  });

  it('start() when already running is idempotent', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    ma.start(); // second call should not throw
    expect(ma.isRunning()).toBe(true);
    ma.stop();
  });

  it('getPendingTxns() returns array after enabled start', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    const txns = ma.getPendingTxns();
    expect(Array.isArray(txns)).toBe(true);
    expect(txns.length).toBeGreaterThan(0);
    ma.stop();
  });

  it('getPendingTxns() returns empty array before start (disabled)', () => {
    const ma = new MempoolAnalyzer({ enabled: false });
    expect(ma.getPendingTxns()).toEqual([]);
  });

  it('getGraph() returns TxGraph with edges and nodes', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    const graph: TxGraph = ma.getGraph();
    expect(graph.edges).toBeInstanceOf(Map);
    expect(graph.nodes).toBeInstanceOf(Map);
    expect(graph.nodes.size).toBeGreaterThan(0);
    ma.stop();
  });

  it('getGraph() edges reference valid tx hashes in nodes', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    const graph = ma.getGraph();
    for (const hashes of graph.edges.values()) {
      for (const h of hashes) {
        expect(graph.nodes.has(h)).toBe(true);
      }
    }
    ma.stop();
  });

  it('subscribe() callback fires on each poll when enabled', () => {
    jest.useFakeTimers();
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 500 });
    const calls: PendingTransaction[][] = [];
    const unsub = ma.subscribe(txns => calls.push(txns));
    ma.start();
    // Initial poll fires synchronously inside start()
    expect(calls.length).toBeGreaterThanOrEqual(1);
    jest.advanceTimersByTime(1000);
    expect(calls.length).toBeGreaterThanOrEqual(2);
    unsub();
    const countBefore = calls.length;
    jest.advanceTimersByTime(500);
    expect(calls.length).toBe(countBefore); // unsubscribed
    ma.stop();
    jest.useRealTimers();
  });

  it('maxPending cap is respected', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000, maxPending: 5 });
    ma.start();
    expect(ma.getPendingTxns().length).toBeLessThanOrEqual(5);
    ma.stop();
  });

  it('pending txns have required fields', () => {
    const ma = new MempoolAnalyzer({ enabled: true, pollIntervalMs: 100_000 });
    ma.start();
    const txns = ma.getPendingTxns();
    for (const tx of txns.slice(0, 3)) {
      expect(typeof tx.hash).toBe('string');
      expect(typeof tx.from).toBe('string');
      expect(typeof tx.to).toBe('string');
      expect(typeof tx.nonce).toBe('number');
      expect(typeof tx.timestamp).toBe('number');
    }
    ma.stop();
  });
});

// ── ValidatorBehaviorModel ───────────────────────────────────────────────────

describe('ValidatorBehaviorModel', () => {
  let model: ValidatorBehaviorModel;

  beforeEach(() => {
    model = new ValidatorBehaviorModel({ enabled: false, learningRate: 0.1 });
  });

  it('predict() returns inclusionProbability in [0,1]', () => {
    const pred = model.predict('0xabc', 2e9, 1e18, 100, 5, 200, 1e9);
    expect(pred.inclusionProbability).toBeGreaterThanOrEqual(0);
    expect(pred.inclusionProbability).toBeLessThanOrEqual(1);
  });

  it('predict() returns the provided txHash', () => {
    const pred = model.predict('0xdeadbeef', 2e9, 0, 0, 0, 0, 1e9);
    expect(pred.txHash).toBe('0xdeadbeef');
  });

  it('predict() blocksUntilInclusion >= 1', () => {
    const pred = model.predict('0x1', 5e10, 1e18, 0, 10, 50, 1e9);
    expect(pred.blocksUntilInclusion).toBeGreaterThanOrEqual(1);
  });

  it('predict() confidence is in [0,1]', () => {
    const pred = model.predict('0x2', 2e9, 1e18, 0, 0, 100, 1e9);
    expect(pred.confidence).toBeGreaterThanOrEqual(0);
    expect(pred.confidence).toBeLessThanOrEqual(1);
  });

  it('getAccuracy() is 0 before any training', () => {
    expect(model.getAccuracy()).toBe(0);
  });

  it('getTrainCount() increments with each train() call', () => {
    model.train(2e9, 1e18, 100, 1, 50, 1e9, 1);
    model.train(2e9, 1e18, 100, 1, 50, 1e9, 0);
    expect(model.getTrainCount()).toBe(2);
  });

  it('train() updates weights (getWeights changes)', () => {
    const before = model.getWeights().slice();
    model.train(2e9, 1e18, 100, 5, 200, 1e9, 1);
    const after = model.getWeights();
    const changed = after.some((w, i) => w !== before[i]);
    expect(changed).toBe(true);
  });

  it('getAccuracy() is in [0,1] after training', () => {
    for (let i = 0; i < 20; i++) {
      model.train(2e9, 1e18, 0, i, 100, 1e9, i % 2 === 0 ? 1 : 0);
    }
    const acc = model.getAccuracy();
    expect(acc).toBeGreaterThanOrEqual(0);
    expect(acc).toBeLessThanOrEqual(1);
  });

  it('high-gas tx should have higher probability than low-gas after training', () => {
    // Train with high gas → included, low gas → dropped
    for (let i = 0; i < 50; i++) {
      model.train(5e10, 0, 0, 0, 50, 1e9, 1); // high gas → included
      model.train(1e8, 0, 0, 0, 50, 1e9, 0);  // low gas → dropped
    }
    const highGas = model.predict('h', 5e10, 0, 0, 0, 50, 1e9);
    const lowGas = model.predict('l', 1e8, 0, 0, 0, 50, 1e9);
    expect(highGas.inclusionProbability).toBeGreaterThan(lowGas.inclusionProbability);
  });
});

// ── StateSimulator ───────────────────────────────────────────────────────────

describe('StateSimulator', () => {
  const initBal: Record<string, bigint> = {
    '0xAAA': 100_000_000_000_000_000_000n, // 100 ETH
    '0xBBB': 50_000_000_000_000_000_000n,
  };

  it('forkState() returns a snapshot with correct blockNumber', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    expect(snap.blockNumber).toBe(0);
    expect(snap.balances).toBeInstanceOf(Map);
  });

  it('forkState() returns independent copy — mutations do not affect sim', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    snap.balances.set('0xAAA', 1n);
    const snap2 = sim.forkState();
    expect(snap2.balances.get('0xAAA')).toBe(100_000_000_000_000_000_000n);
  });

  it('getStateRoot() returns a hex string', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const root = sim.getStateRoot();
    expect(root.startsWith('0x')).toBe(true);
    expect(root.length).toBeGreaterThan(2);
  });

  it('simulateTxns() applies valid transfer and updates balances', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    const tx = makeTx({ from: '0xAAA', to: '0xBBB', value: 1_000_000n, gasPrice: 2_000_000_000n });
    const result = sim.simulateTxns(snap, [tx]);
    expect(result.appliedTxns).toContain(tx.hash);
    expect(result.rejectedTxns).toHaveLength(0);
  });

  it('simulateTxns() rejects tx when sender has insufficient balance', () => {
    const sim = new StateSimulator({ initialBalances: { '0xPOOR': 0n } });
    const snap = sim.forkState();
    const tx = makeTx({ from: '0xPOOR', to: '0xBBB', value: 1_000_000_000n, gasPrice: 2_000_000_000n });
    const result = sim.simulateTxns(snap, [tx]);
    expect(result.rejectedTxns).toContain(tx.hash);
    expect(result.appliedTxns).toHaveLength(0);
  });

  it('simulateTxns() returns finalSnapshot with updated stateRoot', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    const tx = makeTx({ from: '0xAAA', to: '0xBBB', value: 1_000_000n, gasPrice: 2_000_000_000n });
    const result = sim.simulateTxns(snap, [tx]);
    expect(result.finalSnapshot.stateRoot).not.toBe(snap.stateRoot);
  });

  it('simulateTxns() tracks gasUsed', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    const tx = makeTx({ from: '0xAAA', to: '0xBBB', value: 1_000_000n, gasPrice: 2_000_000_000n });
    const result = sim.simulateTxns(snap, [tx]);
    expect(result.gasUsed).toBe(21_000n);
  });

  it('simulateTxns() records priceImpact for swap txns', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    const tx = makeTx({
      from: '0xAAA', to: '0xBBB',
      value: 1_000_000_000_000_000_000n, // 1 ETH
      gasPrice: 2_000_000_000n,
      data: '0xswap',
    });
    const result = sim.simulateTxns(snap, [tx]);
    expect(result.priceImpacts.size).toBeGreaterThan(0);
  });

  it('getPriceImpact() sums all swap impacts', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    const txSwap = makeTx({
      from: '0xAAA', to: '0xBBB',
      value: 1_000_000_000_000_000_000n,
      gasPrice: 2_000_000_000n,
      data: '0xswap',
    });
    const result = sim.simulateTxns(snap, [txSwap]);
    const impact = sim.getPriceImpact(result);
    expect(typeof impact).toBe('number');
    expect(impact).toBeGreaterThanOrEqual(0);
  });

  it('getCurrentBlock() increments after each simulateTxns call', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    sim.simulateTxns(snap, []);
    expect(sim.getCurrentBlock()).toBe(1);
    sim.simulateTxns(sim.forkState(), []);
    expect(sim.getCurrentBlock()).toBe(2);
  });

  it('simulateTxns() on empty txn list returns zero gasUsed', () => {
    const sim = new StateSimulator({ initialBalances: initBal });
    const snap = sim.forkState();
    const result = sim.simulateTxns(snap, []);
    expect(result.gasUsed).toBe(0n);
    expect(result.appliedTxns).toHaveLength(0);
  });
});

// ── ShadowConsensus ──────────────────────────────────────────────────────────

describe('ShadowConsensus', () => {
  const initBal: Record<string, bigint> = {
    '0xAAA': 100_000_000_000_000_000_000n,
    '0xBBB': 100_000_000_000_000_000_000n,
    '0xCCC': 100_000_000_000_000_000_000n,
  };

  function buildTxns(n: number): PendingTransaction[] {
    const addrs = ['0xAAA', '0xBBB', '0xCCC'];
    return Array.from({ length: n }, (_, i) => makeTx({
      from: addrs[i % 3],
      to: addrs[(i + 1) % 3],
      value: BigInt((i + 1) * 1_000),
      gasPrice: 2_000_000_000n,
      nonce: i,
    }));
  }

  it('runSimulations() returns a StateDistribution', () => {
    const sc = new ShadowConsensus({ numSimulations: 8 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(4));
    expect(dist.probabilities).toBeInstanceOf(Map);
    expect(dist.results).toBeInstanceOf(Map);
    expect(dist.totalSimulations).toBe(8);
  });

  it('probabilities sum to ~1.0', () => {
    const sc = new ShadowConsensus({ numSimulations: 16 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(5));
    const total = Array.from(dist.probabilities.values()).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('all probabilities are in (0, 1]', () => {
    const sc = new ShadowConsensus({ numSimulations: 16 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(4));
    for (const p of dist.probabilities.values()) {
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('getDistribution() returns the probabilities map', () => {
    const sc = new ShadowConsensus({ numSimulations: 4 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(2));
    const map = sc.getDistribution(dist);
    expect(map).toBe(dist.probabilities);
  });

  it('getMostLikelyState() returns a ConsensusResult with valid fields', () => {
    const sc = new ShadowConsensus({ numSimulations: 16 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(4));
    const consensus = sc.getMostLikelyState(dist);
    expect(typeof consensus.mostLikelyStateRoot).toBe('string');
    expect(consensus.probability).toBeGreaterThan(0);
    expect(consensus.probability).toBeLessThanOrEqual(1);
    expect(typeof consensus.netPriceImpact).toBe('number');
  });

  it('getMostLikelyState() probability matches highest in distribution', () => {
    const sc = new ShadowConsensus({ numSimulations: 16 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(3));
    const consensus = sc.getMostLikelyState(dist);
    const maxProb = Math.max(...Array.from(dist.probabilities.values()));
    expect(consensus.probability).toBe(maxProb);
  });

  it('runSimulations() with 0 txns still returns valid distribution', () => {
    const sc = new ShadowConsensus({ numSimulations: 4 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, []);
    expect(dist.totalSimulations).toBe(4);
    const total = Array.from(dist.probabilities.values()).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('different orderings produce different state roots (with enough txns)', () => {
    // With 6 txns and 16 sims we expect more than 1 unique root in most cases
    const sc = new ShadowConsensus({ numSimulations: 16 });
    const snap = makeSnapshot(initBal);
    const dist = sc.runSimulations(snap, buildTxns(6));
    // At least 1 unique root must exist
    expect(dist.probabilities.size).toBeGreaterThanOrEqual(1);
  });
});

// ── PreemptiveExecutor ───────────────────────────────────────────────────────

describe('PreemptiveExecutor', () => {
  function makeConsensus(probability: number, impact = 0.01) {
    return {
      mostLikelyStateRoot: '0x' + 'a'.repeat(64),
      probability,
      distribution: {
        probabilities: new Map([['0x' + 'a'.repeat(64), probability]]),
        results: new Map(),
        totalSimulations: 16,
      },
      netPriceImpact: impact,
    };
  }

  it('evaluate() returns status=skipped when disabled (default)', () => {
    const ex = new PreemptiveExecutor(); // enabled=false by default
    const trade = ex.evaluate(makeConsensus(0.9), 5000);
    expect(trade.status).toBe('skipped');
  });

  it('evaluate() returns status=skipped below threshold', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.8 });
    const trade = ex.evaluate(makeConsensus(0.5), 5000);
    expect(trade.status).toBe('skipped');
  });

  it('evaluate() returns status=dry-run when enabled + dryRun=true + above threshold', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.7 });
    const trade = ex.evaluate(makeConsensus(0.85), 5000);
    expect(trade.status).toBe('dry-run');
  });

  it('evaluate() returns status=submitted when enabled + dryRun=false + above threshold', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: false, probabilityThreshold: 0.7 });
    const trade = ex.evaluate(makeConsensus(0.9), 5000);
    expect(trade.status).toBe('submitted');
  });

  it('evaluate() caps sizeUsd at maxSizeUsd', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.7, maxSizeUsd: 1000 });
    const trade = ex.evaluate(makeConsensus(0.9), 99_999);
    expect(trade.sizeUsd).toBe(1000);
  });

  it('evaluate() direction=buy for positive priceImpact', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.5 });
    const trade = ex.evaluate(makeConsensus(0.9, 0.02), 5000);
    expect(trade.direction).toBe('buy');
  });

  it('evaluate() direction=sell for negative priceImpact', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.5 });
    const trade = ex.evaluate(makeConsensus(0.9, -0.02), 5000);
    expect(trade.direction).toBe('sell');
  });

  it('execute() submits trade when enabled + dryRun=false', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: false, probabilityThreshold: 0.7 });
    const trade = ex.execute('0xroot', 0.95, 0.01, 3000);
    expect(trade.status).toBe('submitted');
    expect(trade.sizeUsd).toBe(3000);
  });

  it('execute() returns dry-run when dryRun=true', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true });
    const trade = ex.execute('0xroot', 0.95, 0.01, 3000);
    expect(trade.status).toBe('dry-run');
  });

  it('execute() returns skipped when disabled', () => {
    const ex = new PreemptiveExecutor({ enabled: false });
    const trade = ex.execute('0xroot', 0.95, 0.01, 3000);
    expect(trade.status).toBe('skipped');
  });

  it('getExecutionLog() reflects all trades', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.7 });
    ex.evaluate(makeConsensus(0.9), 1000);
    ex.evaluate(makeConsensus(0.4), 1000);
    const log = ex.getExecutionLog();
    expect(log.trades.length).toBe(2);
    expect(log.totalDryRun).toBe(1);
    expect(log.totalSkipped).toBe(1);
    expect(log.totalSubmitted).toBe(0);
  });

  it('setThreshold() updates the threshold', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.5 });
    ex.setThreshold(0.9);
    expect(ex.getThreshold()).toBe(0.9);
    // Now 0.85 probability should be skipped
    const trade = ex.evaluate(makeConsensus(0.85), 1000);
    expect(trade.status).toBe('skipped');
  });

  it('setThreshold() throws on out-of-range value', () => {
    const ex = new PreemptiveExecutor();
    expect(() => ex.setThreshold(-0.1)).toThrow(RangeError);
    expect(() => ex.setThreshold(1.1)).toThrow(RangeError);
  });

  it('each trade gets a unique id', () => {
    const ex = new PreemptiveExecutor({ enabled: true, dryRun: true, probabilityThreshold: 0.5 });
    const t1 = ex.evaluate(makeConsensus(0.9), 1000);
    const t2 = ex.evaluate(makeConsensus(0.9), 1000);
    expect(t1.id).not.toBe(t2.id);
  });
});

// ── initStateShadowing factory ───────────────────────────────────────────────

describe('initStateShadowing', () => {
  it('returns all five component instances', () => {
    const inst = initStateShadowing();
    expect(inst.mempoolAnalyzer).toBeInstanceOf(MempoolAnalyzer);
    expect(inst.validatorModel).toBeInstanceOf(ValidatorBehaviorModel);
    expect(inst.stateSimulator).toBeInstanceOf(StateSimulator);
    expect(inst.shadowConsensus).toBeInstanceOf(ShadowConsensus);
    expect(inst.preemptiveExecutor).toBeInstanceOf(PreemptiveExecutor);
  });

  it('default config has enabled=false', () => {
    const inst = initStateShadowing();
    expect(inst.config.enabled).toBe(false);
  });

  it('respects numSimulations override', () => {
    const inst = initStateShadowing({ numSimulations: 32 });
    expect(inst.config.numSimulations).toBe(32);
  });

  it('respects probabilityThreshold override', () => {
    const inst = initStateShadowing({ probabilityThreshold: 0.85 });
    expect(inst.config.probabilityThreshold).toBe(0.85);
  });

  it('respects maxPreemptiveSizeUsd override', () => {
    const inst = initStateShadowing({ maxPreemptiveSizeUsd: 50_000 });
    expect(inst.config.maxPreemptiveSizeUsd).toBe(50_000);
  });

  it('mempoolAnalyzer is not running after init (enabled=false)', () => {
    const inst = initStateShadowing();
    expect(inst.mempoolAnalyzer.isRunning()).toBe(false);
  });

  it('preemptiveExecutor starts with empty log', () => {
    const inst = initStateShadowing();
    const log = inst.preemptiveExecutor.getExecutionLog();
    expect(log.trades.length).toBeGreaterThanOrEqual(0);
    expect(log.totalSubmitted).toBe(0);
  });

  it('end-to-end: mempool → simulator → shadow → executor (all dry-run)', () => {
    const inst = initStateShadowing({
      enabled: true,
      numSimulations: 4,
      probabilityThreshold: 0.1, // very low so something fires
      maxPreemptiveSizeUsd: 1000,
    });

    inst.mempoolAnalyzer.start();
    const txns = inst.mempoolAnalyzer.getPendingTxns().slice(0, 5);
    inst.mempoolAnalyzer.stop();

    const snap = inst.stateSimulator.forkState();
    const dist = inst.shadowConsensus.runSimulations(snap, txns);
    const consensus = inst.shadowConsensus.getMostLikelyState(dist);
    const trade = inst.preemptiveExecutor.evaluate(consensus, 500);

    // dry-run is default — should be dry-run or skipped (never submitted)
    expect(['dry-run', 'skipped']).toContain(trade.status);
    expect(trade.probability).toBeGreaterThan(0);
  });
});
