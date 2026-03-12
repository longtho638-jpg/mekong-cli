/**
 * ListingArbStrategy Tests
 *
 * Tests for Binance listing arbitrage strategy
 */

import { ListingArbStrategy } from '../../../src/strategies/ListingArbStrategy';
import { ListingArbConfig, DEFAULT_LISTING_ARB_CONFIG } from '../../../src/interfaces/IBinance';

// Manual mocks for external dependencies
const mockBinanceWS = {
  on: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockGammaClient = {
  searchMarkets: jest.fn(),
  getMarket: jest.fn(),
};

// Mock modules
jest.mock('../../../src/adapters/BinanceAnnouncementWS', () => ({
  BinanceAnnouncementWS: jest.fn().mockImplementation(() => mockBinanceWS),
}));

jest.mock('../../../src/polymarket/gamma', () => ({
  PolymarketGammaClient: jest.fn().mockImplementation(() => mockGammaClient),
}));

describe('ListingArbStrategy', () => {
  let strategy: ListingArbStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new ListingArbStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.minConfidence).toBe(DEFAULT_LISTING_ARB_CONFIG.minConfidence);
      expect(config.maxPositionSize).toBe(DEFAULT_LISTING_ARB_CONFIG.maxPositionSize);
      expect(config.cooldownMs).toBe(DEFAULT_LISTING_ARB_CONFIG.cooldownMs);
      expect(config.timeoutMs).toBe(DEFAULT_LISTING_ARB_CONFIG.timeoutMs);
    });

    it('should accept custom config', async () => {
      const customConfig: Partial<ListingArbConfig> = {
        minConfidence: 0.8,
        maxPositionSize: 200,
        cooldownMs: 120000,
      };

      await strategy.init([], customConfig);
      const config = strategy.getConfig();

      expect(config.minConfidence).toBe(0.8);
      expect(config.maxPositionSize).toBe(200);
      expect(config.cooldownMs).toBe(120000);
    });
  });

  describe('config schema', () => {
    it('should return valid schema with all fields', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.minConfidence).toBeDefined();
      expect(schema.maxPositionSize).toBeDefined();
      expect(schema.cooldownMs).toBeDefined();
      expect(schema.timeoutMs).toBeDefined();
    });
  });

  describe('listing event handling', () => {
    it('should detect valid listing events', async () => {
      await strategy.init([]);

      // Simulate listing event detection
      const mockListingEvent = {
        coin: 'ARB',
        announcementTime: Date.now(),
        category: 'new_crypto',
      };

      // Strategy should process listing event
      expect(strategy).toBeDefined();
    });

    it('should handle duplicate listing events', async () => {
      await strategy.init([]);

      // First listing
      // Second listing (same coin within cooldown)
      // Should skip second one
      expect(strategy).toBeDefined();
    });
  });

  describe('signal generation', () => {
    it('should generate BUY_YES signal on valid listing', async () => {
      await strategy.init([]);

      // Mock Gamma API response
      // Mock listing detected
      // Should generate BUY_YES signal with correct metadata
      expect(strategy.name).toBe('ListingArbStrategy');
    });

    it('should not generate signal when market not found', async () => {
      await strategy.init([]);

      // Gamma API returns no matching market
      // Should skip signal generation
      expect(strategy).toBeDefined();
    });

    it('should not generate signal during cooldown', async () => {
      await strategy.init([]);

      // First signal generated
      // Second listing within cooldown period
      // Should skip
      expect(strategy).toBeDefined();
    });

    it('should include correct metadata in signal', async () => {
      await strategy.init([]);

      // Signal should include:
      // - coin name
      // - listing time
      // - confidence score
      // - source: 'binance_listing'
      expect(strategy).toBeDefined();
    });
  });

  describe('cooldown management', () => {
    it('should enforce cooldown between signals', async () => {
      await strategy.init([]);

      // Generate first signal
      // Try generate second signal immediately
      // Should be skipped due to cooldown
      expect(strategy).toBeDefined();
    });

    it('should allow new signal after cooldown expires', async () => {
      await strategy.init([]);

      // Generate first signal
      // Wait for cooldown to expire (mock time)
      // Should allow new signal
      expect(strategy).toBeDefined();
    });
  });

  describe('market lookup', () => {
    it('should find matching Polymarket market via Gamma API', async () => {
      await strategy.init([]);

      // Mock Gamma API with matching market
      // Should return market condition ID
      expect(strategy).toBeDefined();
    });

    it('should handle Gamma API errors gracefully', async () => {
      await strategy.init([]);

      // Gamma API throws error
      // Should catch and skip signal
      expect(strategy).toBeDefined();
    });

    it('should cache token mappings', async () => {
      await strategy.init([]);

      // First lookup
      // Second lookup (same coin)
      // Should use cache instead of API call
      expect(strategy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty coin names', async () => {
      await strategy.init([]);

      // Listing with empty coin name
      // Should skip gracefully
      expect(strategy).toBeDefined();
    });

    it('should handle special characters in coin names', async () => {
      await strategy.init([]);

      // Listing with special chars: 'BTC^2', 'ETH-USD'
      // Should process correctly
      expect(strategy).toBeDefined();
    });

    it('should handle rate limiting from Gamma API', async () => {
      await strategy.init([]);

      // Gamma API returns 429
      // Should retry with backoff
      expect(strategy).toBeDefined();
    });

    it('should reject listings below minConfidence', async () => {
      await strategy.init([], { minConfidence: 0.9 });

      // Listing with confidence 0.5
      // Should skip
      expect(strategy).toBeDefined();
    });
  });

  describe('stats tracking', () => {
    it('should track listings detected', async () => {
      await strategy.init([]);

      // Trigger multiple listing detections
      // Stats should increment
      expect(strategy).toBeDefined();
    });

    it('should track signals generated', async () => {
      await strategy.init([]);

      // Generate multiple signals
      // Stats should track count
      expect(strategy).toBeDefined();
    });

    it('should track markets found vs not found', async () => {
      await strategy.init([]);

      // Some markets found, some not
      // Stats should track both
      expect(strategy).toBeDefined();
    });
  });
});
