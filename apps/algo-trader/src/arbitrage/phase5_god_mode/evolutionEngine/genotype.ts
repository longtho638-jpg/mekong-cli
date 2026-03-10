/**
 * Genotype — strategy DNA interface for the Genetic Synthesizer.
 * Flexible JSON schema; all fields are evolvable parameters.
 */

export type EntryCondition = 'crossAbove' | 'crossBelow' | 'breakout' | 'meanRevert';
export type Indicator = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';

export interface Genotype {
  id: string;
  entryCondition: EntryCondition;
  indicator: Indicator;
  period: number;         // [2, 200]
  asset: string;          // e.g. 'BTC/USDT'
  riskPercent: number;    // [0.1, 5.0] — % of portfolio risked per trade
  takeProfitMult: number; // take-profit as multiple of risk [0.5, 5.0]
  stopLossPct: number;    // stop-loss % [0.1, 10.0]
  fitness: number;        // populated after backtesting [0, ∞)
  generation: number;     // which generation produced this
}

export const ENTRY_CONDITIONS: EntryCondition[] = ['crossAbove', 'crossBelow', 'breakout', 'meanRevert'];
export const INDICATORS: Indicator[] = ['SMA', 'EMA', 'RSI', 'MACD', 'BB'];

/** Create a random genotype with sensible defaults. */
export function randomGenotype(id: string, generation = 0): Genotype {
  return {
    id,
    entryCondition: ENTRY_CONDITIONS[Math.floor(Math.random() * ENTRY_CONDITIONS.length)],
    indicator: INDICATORS[Math.floor(Math.random() * INDICATORS.length)],
    period: 2 + Math.floor(Math.random() * 198),
    asset: 'BTC/USDT',
    riskPercent: 0.1 + Math.random() * 4.9,
    takeProfitMult: 0.5 + Math.random() * 4.5,
    stopLossPct: 0.1 + Math.random() * 9.9,
    fitness: 0,
    generation,
  };
}

/** Clone a genotype with a new id. */
export function cloneGenotype(src: Genotype, newId: string): Genotype {
  return { ...src, id: newId, fitness: 0 };
}
