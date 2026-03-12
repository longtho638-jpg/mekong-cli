/**
 * Polymarket Module Export
 *
 * Complete Polymarket trading integration:
 * - CLOB client for order placement
 * - WebSocket for real-time data
 * - Gamma API for market discovery
 * - Bot engine with 9 strategies
 */

// Core clients
export {
  PolymarketClobClient,
  PolymarketClientConfig,
  CONTRACTS,
  Side,
  OrderType,
} from './client';

export {
  PolymarketWebSocket,
  type WebSocketConfig,
  type MarketEvent,
  type UserEvent,
  type BookEvent,
  type PriceChangeEvent,
  type LastTradePriceEvent,
  type BestBidAskEvent,
  type TradeEvent,
  type OrderEvent,
} from './websocket';

export {
  PolymarketGammaClient,
  type GammaMarket,
  type ParsedMarket,
} from './gamma';

// Adapter
export {
  PolymarketAdapter,
  type PolymarketAdapterConfig,
  type PolymarketTick,
  type PolymarketOrder,
} from '../execution/polymarket-adapter';

// Bot Engine
export {
  PolymarketBotEngine,
  type PolymarketBotConfig,
} from './bot-engine';
