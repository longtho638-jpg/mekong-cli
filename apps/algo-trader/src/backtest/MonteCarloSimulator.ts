/**
 * Monte Carlo Simulator for Backtesting
 * Evaluates strategy robustness through randomized market simulations
 */

import type { BacktestMetrics, MonteCarloResult as MonteCarloResultType } from '../types/trading.types';

export interface MonteCarloConfig {
  simulationCount: number;
  randomizeReturns?: boolean;
  randomizeTiming?: boolean;
  randomizeEntryPrices?: boolean;
  shuffleMethod?: 'block' | 'bootstrap' | 'random_walk';
  blockSize?: number;
  volatilityAdjustment?: number;
}

export interface MonteCarloResult {
  baselinePerformance: BacktestMetrics;
  simulatedResults: BacktestMetrics[];
  confidenceIntervals: {
    lower: number;
    upper: number;
  };
  probabilityOfSuccess: number;
  worstCaseScenario: BacktestMetrics;
  bestCaseScenario: BacktestMetrics;
  performanceDistribution: {
    mean: number;
    median: number;
    stdDev: number;
    skewness: number;
    kurtosis: number;
  };
}

interface CandleData {
  close?: number;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp?: number;
  [key: string]: unknown;
}

export class MonteCarloSimulator {
  static async runSimulation(
    baselineResult: BacktestMetrics,
    historicalData: CandleData[],
    strategyFn: (data: CandleData[]) => Promise<BacktestMetrics>,
    config: MonteCarloConfig
  ): Promise<MonteCarloResult> {
    const results: BacktestMetrics[] = [];

    const baselineSimulation = await strategyFn(historicalData);
    results.push(baselineSimulation);

    for (let i = 1; i < config.simulationCount; i++) {
      try {
        const syntheticData = this.generateSyntheticData(
          historicalData,
          config
        );

        const simulatedResult = await strategyFn(syntheticData);
        results.push(simulatedResult);
      } catch (error) {
        console.warn(`Simulation ${i} failed:`, error);
        results.push({
          totalReturn: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          maxDrawdown: 0,
          maxDrawdownDuration: 0,
          winRate: 0,
          profitFactor: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          averageWin: 0,
          averageLoss: 0,
          averageTradeDuration: 0,
          calmarRatio: 0,
          informationRatio: 0,
          tailRatio: 0,
          commonSenseRatio: 0,
          ulcerIndex: 0,
          serenityRatio: 0,
        });
      }
    }

    const returnValues = results.map(r => r.totalReturn || 0);
    const sortedReturns = [...returnValues].sort((a, b) => a - b);

    const confidenceLevel = 0.95;
    const lowerPercentile = (1 - confidenceLevel) / 2;
    const upperPercentile = 1 - lowerPercentile;

    const lowerIndex = Math.floor(lowerPercentile * sortedReturns.length);
    const upperIndex = Math.floor(upperPercentile * sortedReturns.length);

    const mean = returnValues.reduce((sum, val) => sum + val, 0) / returnValues.length;
    const variance = returnValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returnValues.length - 1);
    const stdDev = Math.sqrt(variance);

    let sumCubedDeviations = 0;
    let sumFourthDeviations = 0;
    for (const value of returnValues) {
      const normalizedDiff = (value - mean) / stdDev;
      sumCubedDeviations += Math.pow(normalizedDiff, 3);
      sumFourthDeviations += Math.pow(normalizedDiff, 4);
    }
    const skewness = (sumCubedDeviations / returnValues.length);
    const kurtosis = (sumFourthDeviations / returnValues.length) - 3;

    const successfulRuns = returnValues.filter(ret => ret > 0).length;
    const probabilityOfSuccess = successfulRuns / returnValues.length;

    const worstCaseIdx = returnValues.indexOf(Math.min(...returnValues));
    const bestCaseIdx = returnValues.indexOf(Math.max(...returnValues));

    return {
      baselinePerformance: baselineSimulation,
      simulatedResults: results,
      confidenceIntervals: {
        lower: sortedReturns[lowerIndex],
        upper: sortedReturns[upperIndex]
      },
      probabilityOfSuccess,
      worstCaseScenario: results[worstCaseIdx],
      bestCaseScenario: results[bestCaseIdx],
      performanceDistribution: {
        mean,
        median: sortedReturns[Math.floor(sortedReturns.length / 2)],
        stdDev,
        skewness,
        kurtosis
      }
    };
  }

  private static generateSyntheticData(
    originalData: CandleData[],
    config: MonteCarloConfig
  ): CandleData[] {
    switch (config.shuffleMethod || 'bootstrap') {
      case 'block':
        return this.blockBootstrap(originalData, config.blockSize || 10);
      case 'bootstrap':
        return this.bootStrapSampling(originalData);
      case 'random_walk':
        return this.randomWalkModel(originalData, config.volatilityAdjustment || 1);
      default:
        return this.bootStrapSampling(originalData);
    }
  }

  private static blockBootstrap(data: CandleData[], blockSize: number): CandleData[] {
    const result: CandleData[] = [];
    const n = data.length;

    const numBlocks = Math.ceil(n / blockSize);

    const blocks: CandleData[][] = [];
    for (let i = 0; i < n; i += blockSize) {
      blocks.push(data.slice(i, Math.min(i + blockSize, n)));
    }

    for (let i = 0; i < numBlocks; i++) {
      const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];
      result.push(...randomBlock);
    }

    return result.slice(0, n);
  }

  private static bootStrapSampling(data: CandleData[]): CandleData[] {
    const result: CandleData[] = [];
    const n = data.length;

    for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      result.push({ ...data[randomIndex] });
    }

    return result;
  }

  private static randomWalkModel(data: CandleData[], volatilityAdjustment: number): CandleData[] {
    if (data.length < 2) return [...data];

    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const prevPrice = data[i-1].close || data[i-1].price;
      const currPrice = data[i].close || data[i].price;

      if (prevPrice && currPrice) {
        returns.push((currPrice - prevPrice) / prevPrice);
      }
    }

    if (returns.length === 0) return [...data];

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDevReturn = this.calculateStdDev(returns, meanReturn);

    const adjustedStdDev = stdDevReturn * volatilityAdjustment;

    const result = [{ ...data[0] }];
    let currentPrice = data[0].close || data[0].price || 100;

    for (let i = 1; i < data.length; i++) {
      const randomReturn = this.sampleNormal(meanReturn, adjustedStdDev);
      const newPrice = currentPrice * (1 + randomReturn);

      const newDataPoint = { ...data[i] };
      if (newDataPoint.close !== undefined) newDataPoint.close = newPrice;
      if (newDataPoint.price !== undefined) newDataPoint.price = newPrice;

      result.push(newDataPoint);
      currentPrice = newPrice;
    }

    return result;
  }

  private static calculateStdDev(values: number[], mean: number): number {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private static sampleNormal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  static evaluateRobustness(result: MonteCarloResult, targetReturn: number = 0): {
    robustnessScore: number;
    riskOfSpuriousness: number;
    confidenceInPerformance: number;
  } {
    const { mean, stdDev } = result.performanceDistribution;

    const cv = mean !== 0 ? stdDev / Math.abs(mean) : Infinity;

    const robustnessScore = stdDev !== 0 ? 1 / (1 + cv) : 1;

    const riskOfSpuriousness = 1 - result.probabilityOfSuccess;

    const distanceFromTarget = Math.min(
      Math.abs(result.confidenceIntervals.lower - targetReturn),
      Math.abs(result.confidenceIntervals.upper - targetReturn)
    );

    const confidenceInPerformance = 1 / (1 + distanceFromTarget);

    return {
      robustnessScore,
      riskOfSpuriousness,
      confidenceInPerformance
    };
  }
}
