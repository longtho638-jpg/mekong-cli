import { ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { Indicators } from '../analysis/indicators';
import { BaseStrategy } from '../strategies/BaseStrategy';

/** Actions the agent can take */
export enum Action { HOLD = 0, BUY = 1, SELL = 2 }

export interface QLearningConfig {
  learningRate?: number;    // alpha, default 0.1
  discountFactor?: number;  // gamma, default 0.95
  epsilon?: number;         // exploration rate, default 0.1
  epsilonDecay?: number;    // per-episode decay, default 0.995
  minEpsilon?: number;      // floor, default 0.01
}

type QValues = [number, number, number]; // [HOLD, BUY, SELL]

interface SerializedQTable {
  entries: [string, QValues][];
  config: Required<QLearningConfig>;
}

/** Minimum candles required before signals are produced */
const MIN_CANDLES = 50;

export class QLearningStrategy extends BaseStrategy {
  name = 'Q-Learning RL Strategy';

  private qTable: Map<string, QValues> = new Map();
  private cfg: Required<QLearningConfig>;

  // Live trading state
  isLong = false;
  barsHeld = 0;
  private prevClose = 0;
  private lastReturn = 0;

  // Set true during training to allow epsilon-greedy exploration
  trainingMode = false;

  constructor(config: QLearningConfig = {}) {
    super();
    this.maxHistoryBuffer = 200;
    this.cfg = {
      learningRate: config.learningRate ?? 0.1,
      discountFactor: config.discountFactor ?? 0.95,
      epsilon: config.epsilon ?? 0.1,
      epsilonDecay: config.epsilonDecay ?? 0.995,
      minEpsilon: config.minEpsilon ?? 0.01,
    };
  }

  // ── State discretization ──────────────────────────────────────────────

  discretizeState(candles: ICandle[]): string {
    const closes = candles.map(c => c.close);

    // RSI bucket: 0=oversold(<30), 1=neutral, 2=overbought(>70)
    const rsiArr = Indicators.rsi(closes, 14);
    const rsi = rsiArr.length > 0 ? rsiArr[rsiArr.length - 1] : 50;
    const rsiBucket = rsi < 30 ? 0 : rsi > 70 ? 2 : 1;

    // Trend: 0=down, 1=flat, 2=up  (SMA20 vs SMA50)
    const sma20 = Indicators.getLast(Indicators.sma(closes, 20));
    const sma50 = Indicators.getLast(Indicators.sma(closes, 50));
    const trendBucket = sma20 > sma50 * 1.005 ? 2 : sma20 < sma50 * 0.995 ? 0 : 1;

    // Volatility: avg HL-range over last 14 candles
    const recent = candles.slice(-14);
    const avgRange = recent.reduce((s, c) => s + (c.high - c.low) / c.close, 0) / recent.length;
    const volBucket = avgRange < 0.01 ? 0 : avgRange > 0.03 ? 2 : 1;

    // Position state: 0=flat, 1=long
    const posBucket = this.isLong ? 1 : 0;

    // Bars held: 0=none, 1=short(1-5), 2=long(6+)
    const heldBucket = !this.isLong ? 0 : this.barsHeld <= 5 ? 1 : 2;

    return `${rsiBucket}_${trendBucket}_${volBucket}_${posBucket}_${heldBucket}`;
  }

  // ── Q-table operations ────────────────────────────────────────────────

  getQValues(state: string): QValues {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, [0, 0, 0]);
    }
    return this.qTable.get(state)!;
  }

  selectAction(state: string): Action {
    if (this.trainingMode && Math.random() < this.cfg.epsilon) {
      return Math.floor(Math.random() * 3) as Action;
    }
    const q = this.getQValues(state);
    const masked: QValues = [...q] as QValues;
    if (this.isLong) masked[Action.BUY] = -Infinity;
    if (!this.isLong) masked[Action.SELL] = -Infinity;
    return masked.indexOf(Math.max(...masked)) as Action;
  }

  updateQ(state: string, action: Action, reward: number, nextState: string): void {
    const q = this.getQValues(state);
    const nextQ = this.getQValues(nextState);
    const maxNextQ = Math.max(...nextQ);
    const { learningRate: α, discountFactor: γ } = this.cfg;
    q[action] = q[action] + α * (reward + γ * maxNextQ - q[action]);
  }

  decayEpsilon(): void {
    this.cfg.epsilon = Math.max(
      this.cfg.minEpsilon,
      this.cfg.epsilon * this.cfg.epsilonDecay,
    );
  }

  // ── Reward: differential Sharpe-inspired ─────────────────────────────

  computeReward(pnlReturn: number): number {
    // Simple differential Sharpe proxy: penalise variance, reward return
    const delta = pnlReturn - this.lastReturn;
    this.lastReturn = pnlReturn;
    // Scale: raw return + momentum bonus − drawdown penalty
    const penalty = pnlReturn < 0 ? Math.abs(pnlReturn) * 0.5 : 0;
    return delta - penalty;
  }

  // ── IStrategy lifecycle ───────────────────────────────────────────────

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    this.bufferCandle(candle);
    if (this.barsHeld > 0) this.barsHeld++;

    if (this.candles.length < MIN_CANDLES) return null;

    const state = this.discretizeState(this.candles);
    const action = this.selectAction(state);

    // Apply action to position state
    if (action === Action.BUY && !this.isLong) {
      this.isLong = true;
      this.barsHeld = 1;
      this.prevClose = candle.close;
      return { type: SignalType.BUY, price: candle.close, timestamp: candle.timestamp, tag: 'q-learn-buy' };
    }

    if (action === Action.SELL && this.isLong) {
      this.isLong = false;
      this.barsHeld = 0;
      return { type: SignalType.SELL, price: candle.close, timestamp: candle.timestamp, tag: 'q-learn-sell' };
    }

    return null;
  }

  // ── Reset for training episodes ───────────────────────────────────────

  resetState(): void {
    this.isLong = false;
    this.barsHeld = 0;
    this.prevClose = 0;
    this.lastReturn = 0;
  }

  // ── Serialization ─────────────────────────────────────────────────────

  serialize(): string {
    const data: SerializedQTable = {
      entries: Array.from(this.qTable.entries()),
      config: { ...this.cfg },
    };
    return JSON.stringify(data);
  }

  static deserialize(json: string): QLearningStrategy {
    const data = JSON.parse(json) as SerializedQTable;
    const strategy = new QLearningStrategy(data.config);
    strategy.cfg = data.config;
    for (const [key, vals] of data.entries) {
      strategy.qTable.set(key, vals);
    }
    return strategy;
  }

  getStatesExplored(): number {
    return this.qTable.size;
  }

  getEpsilon(): number {
    return this.cfg.epsilon;
  }
}
