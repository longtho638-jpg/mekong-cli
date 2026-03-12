/**
 * Polymarket Strategies Export
 *
 * All 9 trading strategies for Polymarket prediction markets
 */

export { BasePolymarketStrategy } from './BasePolymarketStrategy';
export type { IMarketTick } from '../../interfaces/IPolymarket';

export { ComplementaryArbStrategy } from './ComplementaryArbStrategy';
export type { ComplementaryArbConfig } from './ComplementaryArbStrategy';

export { MakerBotStrategy } from './MakerBotStrategy';
export type { MakerBotConfig } from './MakerBotStrategy';

export { WeatherBotStrategy } from './WeatherBotStrategy';
export type { WeatherBotConfig, WeatherData, MarketCondition } from './WeatherBotStrategy';

export { AIReasoningStrategy } from './AIReasoningStrategy';
export type { AIReasoningConfig, LLMResponse } from './AIReasoningStrategy';

export { HedgeDiscoveryStrategy } from './HedgeDiscoveryStrategy';
export type { HedgeDiscoveryConfig, RelatedMarkets } from './HedgeDiscoveryStrategy';

export { WhaleTrackingStrategy } from './WhaleTrackingStrategy';
export type { WhaleTrackingConfig, WhaleData, WhaleTrade } from './WhaleTrackingStrategy';

// Cross-platform strategies
export { CrossPlatformArbStrategy } from '../CrossPlatformArbStrategy';
export type { CrossPlatformArbConfig, ArbOpportunity } from '../CrossPlatformArbStrategy';

export { MarketMakerStrategy } from '../MarketMakerStrategy';
export type { MMConfig, MMPosition, MMOrder } from '../MarketMakerStrategy';

// Event-driven strategies
export { ListingArbStrategy } from '../ListingArbStrategy';
export type { ListingArbConfig } from '../interfaces/IBinance';
