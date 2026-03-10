/**
 * Walk-Forward Analysis for Backtesting
 * Implements expanding and rolling window validation techniques
 */

import type { BacktestMetrics } from '../types/trading.types';

export interface WalkForwardConfig {
  inSamplePeriod: number;
  outOfSamplePeriod: number;
  minSamplePeriod?: number;
  walkMode: 'expanding' | 'rolling';
  reoptimizeInterval?: number;
}

interface CandleData {
  timestamp?: number;
  date?: string;
  close?: number;
  price?: number;
  [key: string]: unknown;
}

export interface WalkForwardSegment {
  segmentId: number;
  startDate: Date;
  endDate: Date;
  inSampleData: CandleData[];
  outOfSampleData: CandleData[];
  isTraining: boolean;
  performance?: BacktestMetrics;
}

export interface WalkForwardResult {
  segments: WalkForwardSegment[];
  overallPerformance: Partial<BacktestMetrics>;
  outOfSampleRatio: number;
  performanceConsistency: number;
}

export class WalkForwardAnalyzer {
  static async performWalkForwardAnalysis(
    historicalData: CandleData[],
    config: WalkForwardConfig
  ): Promise<WalkForwardResult> {
    const minRequiredPoints = config.minSamplePeriod || config.inSamplePeriod;
    if (historicalData.length < minRequiredPoints + config.outOfSamplePeriod) {
      throw new Error(`Insufficient data for walk-forward analysis. Need at least ${minRequiredPoints + config.outOfSamplePeriod} data points, got ${historicalData.length}`);
    }

    const segments: WalkForwardSegment[] = [];
    let currentIndex = 0;
    let segmentId = 0;

    const totalPeriod = config.inSamplePeriod + config.outOfSamplePeriod;
    const maxSegments = Math.floor((historicalData.length - minRequiredPoints) / config.outOfSamplePeriod);

    while (currentIndex + totalPeriod <= historicalData.length && segments.length < maxSegments) {
      let inSampleEndIndex: number;

      if (config.walkMode === 'expanding') {
        inSampleEndIndex = minRequiredPoints + (segments.length * config.outOfSamplePeriod) + config.inSamplePeriod - 1;
        inSampleEndIndex = Math.min(inSampleEndIndex, historicalData.length - config.outOfSamplePeriod);
      } else {
        inSampleEndIndex = currentIndex + config.inSamplePeriod - 1;
      }

      const inSampleStartIndex = config.walkMode === 'expanding' ? 0 : currentIndex;
      const outOfSampleStartIndex = inSampleEndIndex + 1;
      const outOfSampleEndIndex = outOfSampleStartIndex + config.outOfSamplePeriod - 1;

      if (outOfSampleEndIndex >= historicalData.length) {
        break;
      }

      const inSampleData = historicalData.slice(inSampleStartIndex, inSampleEndIndex + 1);
      const outOfSampleData = historicalData.slice(outOfSampleStartIndex, outOfSampleEndIndex + 1);

      const allTimestamps = [...inSampleData, ...outOfSampleData]
        .map(d => new Date(d.timestamp || d.date || 0).getTime())
        .filter(t => t > 0);

      const segment: WalkForwardSegment = {
        segmentId: segmentId++,
        startDate: new Date(Math.min(...allTimestamps)),
        endDate: new Date(Math.max(...allTimestamps)),
        inSampleData,
        outOfSampleData,
        isTraining: true
      };

      segments.push(segment);

      if (config.walkMode === 'expanding') {
        currentIndex = outOfSampleEndIndex + 1;
      } else {
        currentIndex += config.outOfSamplePeriod;
      }
    }

    let isTrainingSegment = true;
    for (const segment of segments) {
      segment.isTraining = isTrainingSegment;
      isTrainingSegment = !isTrainingSegment;
    }

    const outOfSampleSegments = segments.filter(s => !s.isTraining);
    const outOfSampleDataPoints = outOfSampleSegments.reduce((sum, s) => sum + s.outOfSampleData.length, 0);
    const outOfSampleRatio = outOfSampleDataPoints / historicalData.length;

    const performanceValues = segments
      .map(s => s.performance?.totalReturn || 0)
      .filter(v => v !== 0);
    let performanceConsistency = 1.0;

    if (performanceValues.length > 1) {
      const mean = performanceValues.reduce((sum, val) => sum + val, 0) / performanceValues.length;
      const variance = performanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performanceValues.length;
      const stdDev = Math.sqrt(variance);
      performanceConsistency = mean !== 0 ? 1 - (stdDev / Math.abs(mean)) : 1.0;
      performanceConsistency = Math.max(0, performanceConsistency);
    }

    return {
      segments,
      overallPerformance: {},
      outOfSampleRatio,
      performanceConsistency
    };
  }

  static validateWalkForwardResult(
    result: WalkForwardResult,
    minOutOfSampleRatio: number = 0.2,
    minPerformanceConsistency: number = 0.5
  ): boolean {
    const passesRatio = result.outOfSampleRatio >= minOutOfSampleRatio;
    const passesConsistency = result.performanceConsistency >= minPerformanceConsistency;

    const trainingSegments = result.segments.filter(s =>
      s.isTraining && s.performance?.totalReturn !== undefined
    );
    const testingSegments = result.segments.filter(s =>
      !s.isTraining && s.performance?.totalReturn !== undefined
    );

    if (trainingSegments.length > 0 && testingSegments.length > 0) {
      const avgTrainingReturn = trainingSegments.reduce((sum, s) => sum + s.performance!.totalReturn, 0) / trainingSegments.length;
      const avgTestingReturn = testingSegments.reduce((sum, s) => sum + s.performance!.totalReturn, 0) / testingSegments.length;

      const overfittingRatio = avgTestingReturn !== 0 ? avgTrainingReturn / avgTestingReturn : Infinity;
      const passesOverfitting = overfittingRatio <= 2.0;

      return passesRatio && passesConsistency && passesOverfitting;
    }

    return passesRatio && passesConsistency;
  }

  static createAdaptiveConfig(
    marketRegime: 'trending' | 'mean-reverting' | 'volatile' | 'quiet'
  ): WalkForwardConfig {
    switch (marketRegime) {
      case 'trending':
        return {
          inSamplePeriod: 200,
          outOfSamplePeriod: 50,
          minSamplePeriod: 100,
          walkMode: 'rolling',
          reoptimizeInterval: 10
        };
      case 'mean-reverting':
        return {
          inSamplePeriod: 100,
          outOfSamplePeriod: 25,
          minSamplePeriod: 50,
          walkMode: 'rolling',
          reoptimizeInterval: 5
        };
      case 'volatile':
        return {
          inSamplePeriod: 75,
          outOfSamplePeriod: 20,
          minSamplePeriod: 40,
          walkMode: 'rolling',
          reoptimizeInterval: 3
        };
      case 'quiet':
        return {
          inSamplePeriod: 150,
          outOfSamplePeriod: 40,
          minSamplePeriod: 80,
          walkMode: 'expanding',
          reoptimizeInterval: 15
        };
      default:
        return {
          inSamplePeriod: 150,
          outOfSamplePeriod: 30,
          minSamplePeriod: 100,
          walkMode: 'rolling',
          reoptimizeInterval: 7
        };
    }
  }
}
