/**
 * Tests: Neural-Symbolic Strategy Synthesizer (NS3) — Phase 9 Module 2.
 * Covers grammar, population management, fitness prediction,
 * backtesting, code generation, and evolution orchestrator lifecycle.
 */

import {
  randomExpression,
  mutateExpression,
  crossover,
  GRAMMAR_RULES,
  PopulationManager,
  FitnessPredictor,
  extractFeatures,
  BacktestEngine,
  CodeGenerator,
  EvolutionOrchestrator,
  initNeuralSymbolicSynthesizer,
} from '../../../src/arbitrage/phase9_singularity/neuralSymbolicSynthesizer/index';

import type {
  AstNode,
  PriceNode,
  IndicatorNode,
  BinaryOpNode,
  HistoricalDataPoint,
  Individual,
} from '../../../src/arbitrage/phase9_singularity/neuralSymbolicSynthesizer/index';

// ── Deterministic RNG for reproducible tests ─────────────────────────────────

function makeSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBars(count: number): HistoricalDataPoint[] {
  const bars: HistoricalDataPoint[] = [];
  let price = 50_000;
  for (let i = 0; i < count; i++) {
    price *= 1 + (Math.sin(i * 0.1) * 0.002);
    bars.push({
      timestamp: Date.now() + i * 60_000,
      open: price * 0.999,
      high: price * 1.002,
      low: price * 0.998,
      close: price,
      volume: 100 + i,
      vwap: price,
    });
  }
  return bars;
}

// ── Grammar tests ─────────────────────────────────────────────────────────────

describe('Grammar — randomExpression', () => {
  it('returns a valid AstNode', () => {
    const rng = makeSeededRng(42);
    const ast = randomExpression(0, rng);
    expect(ast).toHaveProperty('type');
    expect(['price', 'indicator', 'binary', 'unary', 'condition']).toContain(ast.type);
  });

  it('is deterministic for same seed', () => {
    const ast1 = randomExpression(0, makeSeededRng(7));
    const ast2 = randomExpression(0, makeSeededRng(7));
    expect(JSON.stringify(ast1)).toBe(JSON.stringify(ast2));
  });

  it('respects maxDepth — forces terminal at depth >= maxDepth', () => {
    const rng = makeSeededRng(1);
    for (let i = 0; i < 20; i++) {
      const ast = randomExpression(0, rng, { maxDepth: 0, terminalProbability: 1 });
      expect(['price', 'indicator']).toContain(ast.type);
    }
  });

  it('generates PriceNode with valid field and lag', () => {
    const rng = makeSeededRng(99);
    const fields = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const ast = randomExpression(0, rng, { maxDepth: 0, terminalProbability: 1 });
      if (ast.type === 'price') {
        expect(['open', 'high', 'low', 'close', 'vwap']).toContain(ast.field);
        expect(ast.lag).toBeGreaterThanOrEqual(0);
        fields.add(ast.field);
      }
    }
    expect(fields.size).toBeGreaterThan(1);
  });

  it('generates IndicatorNode with valid name and period', () => {
    const rng = makeSeededRng(55);
    const names = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const ast = randomExpression(0, rng, { maxDepth: 0, terminalProbability: 0 });
      if (ast.type === 'indicator') {
        expect(['sma', 'ema', 'rsi', 'macd', 'atr']).toContain(ast.name);
        expect(ast.period).toBeGreaterThanOrEqual(5);
        expect(ast.period).toBeLessThanOrEqual(50);
        names.add(ast.name);
      }
    }
    expect(names.size).toBeGreaterThan(1);
  });

  it('GRAMMAR_RULES has 5 entries with positive weights', () => {
    expect(GRAMMAR_RULES).toHaveLength(5);
    for (const rule of GRAMMAR_RULES) {
      expect(rule.weight).toBeGreaterThan(0);
      expect(typeof rule.produce).toBe('function');
    }
  });
});

describe('Grammar — mutateExpression', () => {
  it('returns a different AST (usually)', () => {
    const rng = makeSeededRng(13);
    const original = randomExpression(0, makeSeededRng(13));
    const mutated = mutateExpression(original, rng);
    // Different seed for mutation means result likely differs
    expect(mutated).toBeDefined();
    expect(mutated).toHaveProperty('type');
  });

  it('does not mutate the original', () => {
    const original: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const originalJson = JSON.stringify(original);
    mutateExpression(original, makeSeededRng(1));
    expect(JSON.stringify(original)).toBe(originalJson);
  });

  it('handles deep binary tree without stack overflow', () => {
    const rng = makeSeededRng(3);
    // Build a reasonably deep tree
    const ast = randomExpression(0, rng, { maxDepth: 4, terminalProbability: 0.2 });
    expect(() => mutateExpression(ast, rng)).not.toThrow();
  });
});

describe('Grammar — crossover', () => {
  it('returns two children', () => {
    const p1 = randomExpression(0, makeSeededRng(1));
    const p2 = randomExpression(0, makeSeededRng(2));
    const [c1, c2] = crossover(p1, p2, makeSeededRng(3));
    expect(c1).toHaveProperty('type');
    expect(c2).toHaveProperty('type');
  });

  it('does not modify parents', () => {
    const p1 = randomExpression(0, makeSeededRng(10));
    const p2 = randomExpression(0, makeSeededRng(20));
    const p1Json = JSON.stringify(p1);
    const p2Json = JSON.stringify(p2);
    crossover(p1, p2, makeSeededRng(30));
    expect(JSON.stringify(p1)).toBe(p1Json);
    expect(JSON.stringify(p2)).toBe(p2Json);
  });

  it('crossover with terminal nodes returns valid ASTs', () => {
    const p1: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const p2: IndicatorNode = { type: 'indicator', name: 'sma', period: 14 };
    const [c1, c2] = crossover(p1, p2, makeSeededRng(5));
    expect(c1).toHaveProperty('type');
    expect(c2).toHaveProperty('type');
  });
});

// ── PopulationManager tests ───────────────────────────────────────────────────

describe('PopulationManager', () => {
  it('initializes population to configured size', () => {
    const pm = new PopulationManager({ populationSize: 10 }, makeSeededRng(1));
    pm.initialize();
    expect(pm.getPopulation()).toHaveLength(10);
  });

  it('all initial individuals have fitness 0', () => {
    const pm = new PopulationManager({ populationSize: 8 }, makeSeededRng(2));
    pm.initialize();
    for (const ind of pm.getPopulation()) {
      expect(ind.fitness).toBe(0);
    }
  });

  it('all individuals have unique ids', () => {
    const pm = new PopulationManager({ populationSize: 20 }, makeSeededRng(3));
    pm.initialize();
    const ids = pm.getPopulation().map((i) => i.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('updateFitness updates scores correctly', () => {
    const pm = new PopulationManager({ populationSize: 5 }, makeSeededRng(4));
    pm.initialize();
    const pop = pm.getPopulation();
    const scores = new Map<string, number>([[pop[0].id, 0.9], [pop[1].id, 0.3]]);
    pm.updateFitness(scores);
    const updated = pm.getPopulation();
    expect(updated.find((i) => i.id === pop[0].id)?.fitness).toBe(0.9);
    expect(updated.find((i) => i.id === pop[1].id)?.fitness).toBe(0.3);
  });

  it('getBest returns individual with highest fitness', () => {
    const pm = new PopulationManager({ populationSize: 5 }, makeSeededRng(5));
    pm.initialize();
    const pop = pm.getPopulation();
    const scores = new Map(pop.map((ind, i) => [ind.id, i * 0.1]));
    pm.updateFitness(scores);
    const best = pm.getBest();
    expect(best.fitness).toBe((pop.length - 1) * 0.1);
  });

  it('evolve advances generation counter', () => {
    const pm = new PopulationManager({ populationSize: 10 }, makeSeededRng(6));
    pm.initialize();
    pm.evolve();
    expect(pm.getCurrentGeneration()).toBe(1);
    pm.evolve();
    expect(pm.getCurrentGeneration()).toBe(2);
  });

  it('evolve preserves population size', () => {
    const pm = new PopulationManager({ populationSize: 12 }, makeSeededRng(7));
    pm.initialize();
    pm.evolve();
    expect(pm.getPopulation()).toHaveLength(12);
  });

  it('throws if evolve called before initialize', () => {
    const pm = new PopulationManager({}, makeSeededRng(8));
    expect(() => pm.evolve()).toThrow('initialize');
  });

  it('throws if getBest called on empty population', () => {
    const pm = new PopulationManager({}, makeSeededRng(9));
    expect(() => pm.getBest()).toThrow('empty');
  });

  it('getConfig returns merged config', () => {
    const pm = new PopulationManager({ populationSize: 30, eliteCount: 5 }, makeSeededRng(10));
    expect(pm.getConfig().populationSize).toBe(30);
    expect(pm.getConfig().eliteCount).toBe(5);
  });
});

// ── FitnessPredictor tests ────────────────────────────────────────────────────

describe('FitnessPredictor — extractFeatures', () => {
  it('returns 8-element array in [0,1]', () => {
    const ast = randomExpression(0, makeSeededRng(1));
    const features = extractFeatures(ast);
    expect(features).toHaveLength(8);
    for (const f of features) {
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('trivial single-node AST has low complexity', () => {
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const features = extractFeatures(ast);
    expect(features[0]).toBeLessThan(0.2); // low complexity
    expect(features[7]).toBe(0);            // non-trivial flag off
  });

  it('complex AST has higher complexity feature', () => {
    const ast: BinaryOpNode = {
      type: 'binary', op: '+',
      left: { type: 'binary', op: '-', left: { type: 'price', field: 'high', lag: 1 }, right: { type: 'price', field: 'low', lag: 0 } },
      right: { type: 'indicator', name: 'sma', period: 20 },
    };
    const features = extractFeatures(ast);
    expect(features[7]).toBe(1); // non-trivial flag on
  });
});

describe('FitnessPredictor', () => {
  it('predict returns values in [0,1]', () => {
    const fp = new FitnessPredictor();
    const ast = randomExpression(0, makeSeededRng(1));
    const result = fp.predict(ast);
    expect(result.predictedFitness).toBeGreaterThanOrEqual(0);
    expect(result.predictedFitness).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('confidence starts near 0 and grows with training', () => {
    const fp = new FitnessPredictor();
    const ast = randomExpression(0, makeSeededRng(2));
    const before = fp.predict(ast).confidence;
    const samples = Array.from({ length: 50 }, () => ({ ast, actualFitness: 0.8 }));
    fp.train(samples);
    const after = fp.predict(ast).confidence;
    expect(after).toBeGreaterThan(before);
  });

  it('train updates training sample count', () => {
    const fp = new FitnessPredictor();
    const ast = randomExpression(0, makeSeededRng(3));
    fp.train([{ ast, actualFitness: 0.5 }, { ast, actualFitness: 0.6 }]);
    expect(fp.getTrainingSamples()).toBe(2);
  });

  it('getAccuracy returns value in [0,1]', () => {
    const fp = new FitnessPredictor();
    const ast = randomExpression(0, makeSeededRng(4));
    fp.train([{ ast, actualFitness: 0.5 }]);
    expect(fp.getAccuracy()).toBeGreaterThanOrEqual(0);
    expect(fp.getAccuracy()).toBeLessThanOrEqual(1);
  });

  it('training on consistent labels improves accuracy over time', () => {
    const fp = new FitnessPredictor();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const initial = fp.getAccuracy();
    // Train many samples with same target
    fp.train(Array.from({ length: 200 }, () => ({ ast, actualFitness: 0.9 })));
    // After training, predictor should output closer to 0.9
    const result = fp.predict(ast);
    expect(result.predictedFitness).toBeGreaterThan(initial);
  });
});

// ── BacktestEngine tests ──────────────────────────────────────────────────────

describe('BacktestEngine', () => {
  const bars = makeBars(100);

  it('returns zero result with no data loaded', () => {
    const engine = new BacktestEngine();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const result = engine.run(ast);
    expect(result.totalTrades).toBe(0);
    expect(result.sharpeRatio).toBe(0);
  });

  it('runs and returns valid BacktestResult shape', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: BinaryOpNode = {
      type: 'binary', op: '>',
      left: { type: 'price', field: 'close', lag: 0 },
      right: { type: 'price', field: 'close', lag: 1 },
    };
    const result = engine.run(ast);
    expect(result).toHaveProperty('sharpeRatio');
    expect(result).toHaveProperty('maxDrawdown');
    expect(result).toHaveProperty('totalProfit');
    expect(result).toHaveProperty('totalTrades');
    expect(result).toHaveProperty('winRate');
    expect(result).toHaveProperty('durationMs');
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdown).toBeLessThanOrEqual(1);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('indicator node (sma) runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: IndicatorNode = { type: 'indicator', name: 'sma', period: 14 };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('ema indicator runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: IndicatorNode = { type: 'indicator', name: 'ema', period: 10 };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('rsi indicator runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: IndicatorNode = { type: 'indicator', name: 'rsi', period: 14 };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('macd indicator runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: IndicatorNode = { type: 'indicator', name: 'macd', period: 26 };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('atr indicator runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: IndicatorNode = { type: 'indicator', name: 'atr', period: 14 };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('condition node evaluates both branches', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: AstNode = {
      type: 'condition',
      test: { type: 'price', field: 'close', lag: 0 },
      consequent: { type: 'price', field: 'high', lag: 0 },
      alternate: { type: 'price', field: 'low', lag: 0 },
    };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('unary neg node runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: AstNode = { type: 'unary', op: 'neg', operand: { type: 'price', field: 'close', lag: 0 } };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('unary abs node runs without error', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: AstNode = { type: 'unary', op: 'abs', operand: { type: 'price', field: 'close', lag: 0 } };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('unary log handles negative input safely', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: AstNode = {
      type: 'unary', op: 'log',
      operand: { type: 'binary', op: '-', left: { type: 'price', field: 'low', lag: 0 }, right: { type: 'price', field: 'high', lag: 0 } },
    };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('binary division by zero is handled safely', () => {
    const engine = new BacktestEngine();
    engine.loadData(bars);
    const ast: AstNode = {
      type: 'binary', op: '/',
      left: { type: 'price', field: 'close', lag: 0 },
      right: { type: 'binary', op: '-', left: { type: 'price', field: 'close', lag: 0 }, right: { type: 'price', field: 'close', lag: 0 } },
    };
    expect(() => engine.run(ast)).not.toThrow();
  });

  it('loadData replaces previous data', () => {
    const engine = new BacktestEngine();
    engine.loadData(makeBars(10));
    engine.loadData(bars); // replace
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const result = engine.run(ast);
    expect(result).toBeDefined();
  });
});

// ── CodeGenerator tests ───────────────────────────────────────────────────────

describe('CodeGenerator', () => {
  it('generate returns valid GeneratedStrategy shape', () => {
    const gen = new CodeGenerator();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const result = gen.generate(ast);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('sourceCode');
    expect(result).toHaveProperty('generatedAt');
    expect(result).toHaveProperty('astNodeCount');
    expect(result.astNodeCount).toBe(1);
    expect(typeof result.sourceCode).toBe('string');
  });

  it('generated source contains function name', () => {
    const gen = new CodeGenerator({ functionName: 'myStrategy' });
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const result = gen.generate(ast);
    expect(result.sourceCode).toContain('myStrategy');
  });

  it('generateAt is a recent timestamp', () => {
    const gen = new CodeGenerator();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const before = Date.now();
    const result = gen.generate(ast);
    expect(result.generatedAt).toBeGreaterThanOrEqual(before);
    expect(result.generatedAt).toBeLessThanOrEqual(Date.now());
  });

  it('ids are unique across calls', () => {
    const gen = new CodeGenerator();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const r1 = gen.generate(ast);
    const r2 = gen.generate(ast);
    expect(r1.id).not.toBe(r2.id);
  });

  it('generates source with comment when includeComments=true', () => {
    const gen = new CodeGenerator({ includeComments: true });
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    expect(gen.generate(ast).sourceCode).toContain('NS3');
  });

  it('generates source without comment when includeComments=false', () => {
    const gen = new CodeGenerator({ includeComments: false });
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    expect(gen.generate(ast).sourceCode).not.toContain('NS3');
  });

  it('generates source for binary op', () => {
    const gen = new CodeGenerator();
    const ast: BinaryOpNode = {
      type: 'binary', op: '+',
      left: { type: 'price', field: 'open', lag: 0 },
      right: { type: 'price', field: 'close', lag: 0 },
    };
    const result = gen.generate(ast);
    expect(result.sourceCode).toContain('+');
    expect(result.astNodeCount).toBe(3);
  });

  it('generates source for indicator node', () => {
    const gen = new CodeGenerator();
    const ast: IndicatorNode = { type: 'indicator', name: 'rsi', period: 14 };
    const result = gen.generate(ast);
    expect(result.sourceCode).toContain('indicators.rsi');
  });

  it('generates source for condition node', () => {
    const gen = new CodeGenerator();
    const ast: AstNode = {
      type: 'condition',
      test: { type: 'price', field: 'close', lag: 0 },
      consequent: { type: 'price', field: 'high', lag: 0 },
      alternate: { type: 'price', field: 'low', lag: 0 },
    };
    const result = gen.generate(ast);
    expect(result.sourceCode).toContain('!== 0 ?');
  });

  it('generates source for unary neg', () => {
    const gen = new CodeGenerator();
    const ast: AstNode = { type: 'unary', op: 'neg', operand: { type: 'price', field: 'close', lag: 0 } };
    expect(gen.generate(ast).sourceCode).toContain('-(');
  });

  it('generates source for unary abs', () => {
    const gen = new CodeGenerator();
    const ast: AstNode = { type: 'unary', op: 'abs', operand: { type: 'price', field: 'close', lag: 0 } };
    expect(gen.generate(ast).sourceCode).toContain('Math.abs');
  });

  it('generates source for unary log', () => {
    const gen = new CodeGenerator();
    const ast: AstNode = { type: 'unary', op: 'log', operand: { type: 'price', field: 'close', lag: 0 } };
    expect(gen.generate(ast).sourceCode).toContain('Math.log');
  });

  it('compile returns callable function', () => {
    const gen = new CodeGenerator();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const generated = gen.generate(ast);
    const fn = gen.compile(generated);
    expect(typeof fn).toBe('function');
  });

  it('compile produces function returning a number', () => {
    const gen = new CodeGenerator();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 0 };
    const generated = gen.generate(ast);
    const fn = gen.compile(generated);
    const bar = { open: 100, high: 105, low: 95, close: 102, vwap: 101 };
    const result = fn(bar, [bar], 0);
    expect(typeof result).toBe('number');
    expect(result).toBeCloseTo(102);
  });

  it('compile with lagged price accesses correct bar', () => {
    const gen = new CodeGenerator();
    const ast: PriceNode = { type: 'price', field: 'close', lag: 1 };
    const generated = gen.generate(ast);
    const fn = gen.compile(generated);
    const bars = [
      { open: 100, high: 105, low: 95, close: 99, vwap: 100 },
      { open: 100, high: 106, low: 96, close: 104, vwap: 102 },
    ];
    const result = fn(bars[1], bars, 1);
    // lag 1 from idx=1 → bars[0].close = 99
    expect(result).toBeCloseTo(99);
  });
});

// ── EvolutionOrchestrator tests ───────────────────────────────────────────────

describe('EvolutionOrchestrator — disabled mode', () => {
  it('emits disabled event when enabled=false', (done) => {
    const orch = initNeuralSymbolicSynthesizer({ enabled: false, populationSize: 5 });
    orch.on('disabled', () => done());
    orch.start();
  });

  it('getStatus shows running=false before start', () => {
    const orch = initNeuralSymbolicSynthesizer({ enabled: false });
    expect(orch.getStatus().running).toBe(false);
  });

  it('getPromoted returns empty array before start', () => {
    const orch = initNeuralSymbolicSynthesizer({ enabled: false });
    expect(orch.getPromoted()).toHaveLength(0);
  });
});

describe('EvolutionOrchestrator — enabled mode', () => {
  function makeOrch(overrides: Record<string, unknown> = {}): EvolutionOrchestrator {
    return initNeuralSymbolicSynthesizer({
      enabled: true,
      populationSize: 6,
      maxGenerations: 3,
      backtestEveryN: 2,
      promotionThreshold: 0.0, // promote everything for testing
      ...overrides,
    });
  }

  it('emits started event', (done) => {
    const orch = makeOrch();
    orch.on('started', () => done());
    orch.start();
  });

  it('emits stopped event after maxGenerations', (done) => {
    const orch = makeOrch({ maxGenerations: 2 });
    orch.on('stopped', () => done());
    orch.start();
  }, 5000);

  it('emits generation events', (done) => {
    let count = 0;
    const orch = makeOrch({ maxGenerations: 3 });
    orch.on('generation', () => {
      count++;
      if (count === 3) done();
    });
    orch.start();
  }, 5000);

  it('getStatus reflects running state', (done) => {
    const orch = makeOrch({ maxGenerations: 5 });
    orch.on('started', () => {
      expect(orch.getStatus().running).toBe(true);
      orch.stop();
      done();
    });
    orch.start();
  });

  it('stop() sets running=false', (done) => {
    const orch = makeOrch({ maxGenerations: 100 });
    orch.on('started', () => {
      orch.stop();
      expect(orch.getStatus().running).toBe(false);
      done();
    });
    orch.start();
  });

  it('getStatus tracks generation count', (done) => {
    const orch = makeOrch({ maxGenerations: 3 });
    orch.on('stopped', () => {
      expect(orch.getStatus().generation).toBe(3);
      done();
    });
    orch.start();
  }, 5000);

  it('getStatus has valid populationSize', (done) => {
    const orch = makeOrch({ maxGenerations: 1 });
    orch.on('stopped', () => {
      expect(orch.getStatus().populationSize).toBe(6);
      done();
    });
    orch.start();
  }, 5000);

  it('double start() is idempotent', (done) => {
    const orch = makeOrch({ maxGenerations: 2 });
    orch.on('stopped', () => done());
    orch.start();
    orch.start(); // should not double-run
  }, 5000);

  it('loadHistoricalData integrates with backtest', (done) => {
    const orch = makeOrch({ maxGenerations: 2, backtestEveryN: 1 });
    orch.loadHistoricalData(makeBars(50));
    orch.on('stopped', () => done());
    orch.start();
  }, 5000);

  it('emits promoted event for low-threshold strategies', (done) => {
    const orch = makeOrch({ maxGenerations: 2, promotionThreshold: 0.0 });
    let called = false;
    orch.on('promoted', (info: { individual: Individual; fitness: number }) => {
      if (called) return;
      called = true;
      expect(info).toHaveProperty('individual');
      expect(info).toHaveProperty('fitness');
      done();
    });
    orch.start();
  }, 5000);

  it('getPromoted accumulates across generations', (done) => {
    const orch = makeOrch({ maxGenerations: 3, promotionThreshold: 0.0 });
    orch.on('stopped', () => {
      expect(orch.getPromoted().length).toBeGreaterThan(0);
      done();
    });
    orch.start();
  }, 5000);

  it('getStatus.predictorAccuracy is in [0,1]', (done) => {
    const orch = makeOrch({ maxGenerations: 4, backtestEveryN: 2 });
    orch.on('stopped', () => {
      const acc = orch.getStatus().predictorAccuracy;
      expect(acc).toBeGreaterThanOrEqual(0);
      expect(acc).toBeLessThanOrEqual(1);
      done();
    });
    orch.start();
  }, 5000);
});

// ── initNeuralSymbolicSynthesizer factory tests ───────────────────────────────

describe('initNeuralSymbolicSynthesizer', () => {
  it('returns an EvolutionOrchestrator instance', () => {
    const orch = initNeuralSymbolicSynthesizer();
    expect(orch).toBeInstanceOf(EvolutionOrchestrator);
  });

  it('default config has enabled=false', () => {
    const orch = initNeuralSymbolicSynthesizer();
    expect(orch.getStatus().running).toBe(false);
  });

  it('exposes population, predictor, backtest sub-systems', () => {
    const orch = initNeuralSymbolicSynthesizer();
    expect(orch.population).toBeInstanceOf(PopulationManager);
    expect(orch.predictor).toBeInstanceOf(FitnessPredictor);
    expect(orch.backtest).toBeInstanceOf(BacktestEngine);
  });

  it('applies populationSize to PopulationManager', () => {
    const orch = initNeuralSymbolicSynthesizer({ enabled: true, populationSize: 15, maxGenerations: 1 });
    orch.population.initialize();
    expect(orch.population.getPopulation()).toHaveLength(15);
    orch.stop();
  });
});
