/**
 * MarketPairMapper tests
 */

import { MarketPairMapper, MarketMapping } from './MarketPairMapper';

describe('MarketPairMapper', () => {
  let mapper: MarketPairMapper;

  beforeEach(() => {
    mapper = new MarketPairMapper(5000); // 5s TTL for testing
  });

  describe('addMapping', () => {
    it('should add a manual mapping', () => {
      const mapping: MarketMapping = {
        polySlug: 'will-tesla-stock-hit-300',
        kalshiTicker: 'TSLA300',
        eventId: 'tesla-300-2024',
        description: 'Will Tesla stock hit $300 in 2024?',
        createdAt: Date.now(),
      };

      mapper.addMapping(mapping);
      const result = mapper.getKalshiForPolymarket('will-tesla-stock-hit-300');

      expect(result).not.toBeNull();
      expect(result?.kalshiTicker).toBe('TSLA300');
      expect(result?.confidence).toBe(1.0);
    });

    it('should retrieve mapping in both directions', () => {
      const mapping: MarketMapping = {
        polySlug: 'btc-price-dec-2024',
        kalshiTicker: 'BTC-50K-DEC',
        eventId: 'btc-50k-dec-2024',
        description: 'Will Bitcoin hit $50K in December 2024?',
        createdAt: Date.now(),
      };

      mapper.addMapping(mapping);

      const polyToKalshi = mapper.getKalshiForPolymarket('btc-price-dec-2024');
      const kalshiToPoly = mapper.getPolymarketForKalshi('BTC-50K-DEC');

      expect(polyToKalshi?.kalshiTicker).toBe('BTC-50K-DEC');
      expect(kalshiToPoly?.polySlug).toBe('btc-price-dec-2024');
    });
  });

  describe('loadMappings', () => {
    it('should load multiple mappings at once', () => {
      const mappings: MarketMapping[] = [
        {
          polySlug: 'fed-rate-jan',
          kalshiTicker: 'FED-JAN-24',
          eventId: 'fed-jan-2024',
          description: 'Fed rate decision January 2024',
          createdAt: Date.now(),
        },
        {
          polySlug: 'nfp-jan',
          kalshiTicker: 'NFP-JAN-24',
          eventId: 'nfp-jan-2024',
          description: 'Non-farm payrolls January 2024',
          createdAt: Date.now(),
        },
      ];

      mapper.loadMappings(mappings);

      expect(mapper.getKalshiForPolymarket('fed-rate-jan')).not.toBeNull();
      expect(mapper.getKalshiForPolymarket('nfp-jan')).not.toBeNull();
    });
  });

  describe('autoDiscoverMappings', () => {
    it('should discover mappings via text similarity', () => {
      const polyMarkets = [
        { slug: 'will-biden-win', title: 'Will Biden win the 2024 presidential election?' },
        { slug: 'btc-100k', title: 'Will Bitcoin reach $100,000 by end of year?' },
      ];

      const kalshiMarkets = [
        { ticker: 'PRES-2024', title: 'Will Biden win the 2024 presidential election?', eventId: 'pres-2024' },
        { ticker: 'BTC-100K', title: 'Will Bitcoin reach $100K by end of year?', eventId: 'btc-100k' },
      ];

      const discovered = mapper.autoDiscoverMappings(polyMarkets, kalshiMarkets);

      expect(discovered.length).toBeGreaterThanOrEqual(1);
      expect(discovered[0].confidence).toBeGreaterThan(0.6);
      expect(discovered[0].kalshiTicker).toBe('PRES-2024');
    });

    it('should not match low similarity pairs', () => {
      const polyMarkets = [{ slug: 'random-event', title: 'Something completely different' }];
      const kalshiMarkets = [{ ticker: 'UNRELATED', title: 'Totally unrelated event', eventId: 'unrelated' }];

      const discovered = mapper.autoDiscoverMappings(polyMarkets, kalshiMarkets);

      expect(discovered.length).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should cache auto-discovered mappings', () => {
      const polyMarkets = [{ slug: 'test', title: 'Test event 2024' }];
      const kalshiMarkets = [{ ticker: 'TEST', title: 'Test event', eventId: 'test' }];

      mapper.autoDiscoverMappings(polyMarkets, kalshiMarkets);
      const cached = mapper.getCached('test-TEST');

      expect(cached).not.toBeNull();
      expect(cached?.confidence).toBeLessThan(1.0); // Auto-discovered
    });

    it('should expire cache after TTL', async () => {
      const mapping: MarketMapping = {
        polySlug: 'expiring',
        kalshiTicker: 'EXP',
        eventId: 'exp',
        description: 'Test',
        createdAt: Date.now(),
      };

      mapper.addMapping(mapping);
      expect(mapper.getKalshiForPolymarket('expiring')).not.toBeNull();

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 5100));

      expect(mapper.getKalshiForPolymarket('expiring')).toBeNull();
    });

    it('should prune expired cache entries', () => {
      const mapping: MarketMapping = {
        polySlug: 'old',
        kalshiTicker: 'OLD',
        eventId: 'old',
        description: 'Old mapping',
        createdAt: Date.now() - 10000, // 10s ago
      };

      (mapper as any).cache['old-OLD'] = mapping;
      mapper.pruneCache();

      expect(mapper.getCached('old-OLD')).toBeNull();
    });
  });

  describe('getAllMappings', () => {
    it('should return all valid mappings', () => {
      mapper.loadMappings([
        { polySlug: 'a', kalshiTicker: 'A', eventId: 'a', description: 'A', createdAt: Date.now() },
        { polySlug: 'b', kalshiTicker: 'B', eventId: 'b', description: 'B', createdAt: Date.now() },
      ]);

      const all = mapper.getAllMappings();
      expect(all.length).toBe(2);
      expect(all.map(m => m.polySlug)).toContain('a');
      expect(all.map(m => m.polySlug)).toContain('b');
    });
  });
});
