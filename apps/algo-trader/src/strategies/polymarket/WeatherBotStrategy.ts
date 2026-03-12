/**
 * Weather Bot Strategy
 *
 * Trades weather markets on Polymarket using NOAA/Open-Meteo data.
 * Monitors real-time weather conditions and compares to market probabilities.
 *
 * Signal Logic:
 * - Fetch current weather data from NOAA/Open-Meteo
 * - Calculate probability of weather event occurring
 * - Compare to market price (YES share price = implied probability)
 * - If model probability > market price + edge: Buy YES
 * - If model probability < market price - edge: Buy NO
 *
 * Markets: Temperature, Precipitation, Snow, Wind events
 */

import { BasePolymarketStrategy } from './BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal, SignalType } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';

export interface WeatherBotConfig {
  minEdgeThreshold: number;    // Minimum edge to trade (default 0.05 = 5%)
  maxPositionSize: number;     // Max shares (default 50)
  dataSource: 'noaa' | 'open-meteo' | 'both';
  updateIntervalMs: number;    // Weather data refresh interval
}

export interface WeatherData {
  temperature?: number;
  precipitation?: number;
  snowDepth?: number;
  windSpeed?: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';
  timestamp: number;
}

export interface MarketCondition {
  type: 'temperature' | 'precipitation' | 'snow' | 'wind';
  threshold: number;
  comparator: 'above' | 'below' | 'equal';
  location: string;
  endDate: number;
}

export class WeatherBotStrategy extends BasePolymarketStrategy {
  name = 'WeatherBot';

  protected config: Required<WeatherBotConfig> = {
    minEdgeThreshold: 0.05,
    maxPositionSize: 50,
    dataSource: 'open-meteo',
    updateIntervalMs: 300000, // 5 minutes
  };

  private weatherData = new Map<string, WeatherData>(); // location -> data
  private marketConditions = new Map<string, MarketCondition>(); // tokenId -> condition

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as WeatherBotConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      minEdgeThreshold: { type: 'number', default: 0.05, min: 0.01, max: 0.2 },
      maxPositionSize: { type: 'number', default: 50, min: 10, max: 200 },
      dataSource: { type: 'string', enum: ['noaa', 'open-meteo', 'both'] },
      updateIntervalMs: { type: 'number', default: 300000, min: 60000, max: 3600000 },
    };
  }

  /**
   * Calculate fair value from weather model
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    const condition = this.marketConditions.get(tokenId);
    if (!condition) return null;

    const weather = this.weatherData.get(condition.location);
    if (!weather) return null;

    // Calculate probability based on condition type
    switch (condition.type) {
      case 'temperature':
        return this.calculateTemperatureProb(condition, weather);
      case 'precipitation':
        return this.calculatePrecipitationProb(condition, weather);
      case 'snow':
        return this.calculateSnowProb(condition, weather);
      case 'wind':
        return this.calculateWindProb(condition, weather);
      default:
        return null;
    }
  }

  private calculateTemperatureProb(condition: MarketCondition, weather: WeatherData): number {
    if (!weather.temperature) return 0.5;
    const diff = weather.temperature - condition.threshold;

    // Simple sigmoid probability
    const prob = 1 / (1 + Math.exp(-diff * 0.5));
    return condition.comparator === 'above' ? prob : 1 - prob;
  }

  private calculatePrecipitationProb(condition: MarketCondition, weather: WeatherData): number {
    if (!weather.precipitation) return 0;
    const prob = weather.precipitation > 0 ? 1 : 0;
    return condition.comparator === 'above' ? prob : 1 - prob;
  }

  private calculateSnowProb(condition: MarketCondition, weather: WeatherData): number {
    if (!weather.snowDepth) return 0;
    const prob = weather.snowDepth >= condition.threshold ? 1 : 0;
    return condition.comparator === 'above' ? prob : 1 - prob;
  }

  private calculateWindProb(condition: MarketCondition, weather: WeatherData): number {
    if (!weather.windSpeed) return 0.5;
    const prob = weather.windSpeed >= condition.threshold ? 1 : 0;
    return condition.comparator === 'above' ? prob : 1 - prob;
  }

  /**
   * Update weather data (called externally from weather service)
   */
  updateWeatherData(location: string, data: WeatherData): void {
    this.weatherData.set(location, data);
    this.lastUpdate = Date.now();
  }

  /**
   * Register market condition
   */
  registerMarket(tokenId: string, condition: MarketCondition): void {
    this.marketConditions.set(tokenId, condition);
  }

  /**
   * Generate trading signal
   */
  async generateSignal(tokenId: string, marketId: string, tick: IMarketTick): Promise<IPolymarketSignal | null> {
    const fairValue = await this.calculateFairValue(tokenId);
    if (fairValue === null) return null;

    const marketPrice = tick.yesPrice;
    const edge = fairValue - marketPrice;

    if (Math.abs(edge) < this.config.minEdgeThreshold) return null;

    if (edge > 0) {
      // Model says YES is undervalued
      return {
        type: PolymarketSignalType.BUY_YES,
        tokenId,
        marketId,
        side: 'YES',
        action: 'BUY',
        price: marketPrice,
        size: this.config.maxPositionSize,
        timestamp: Date.now(),
        expectedValue: edge * this.config.maxPositionSize,
        confidence: Math.min(Math.abs(edge) / 0.1, 1.0),
        catalyst: `Weather model: fair=${fairValue.toFixed(2)} vs market=${marketPrice}`,
        metadata: { fairValue, marketPrice, edge },
      };
    } else {
      // Model says YES is overvalued (buy NO)
      return {
        type: PolymarketSignalType.BUY_NO,
        tokenId,
        marketId,
        side: 'NO',
        action: 'BUY',
        price: tick.noPrice,
        size: this.config.maxPositionSize,
        timestamp: Date.now(),
        expectedValue: Math.abs(edge) * this.config.maxPositionSize,
        confidence: Math.min(Math.abs(edge) / 0.1, 1.0),
        catalyst: `Weather model: fair=${fairValue.toFixed(2)} vs market=${marketPrice}`,
        metadata: { fairValue, marketPrice, edge: Math.abs(edge) },
      };
    }
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  processTick(tick: IMarketTick): IPolymarketSignal | null {
    this.onMarketTick(tick);
    return this.generateSignal(tick.tokenId, tick.marketId, tick);
  }
}
