/**
 * Weather Bot Strategy Tests
 */

import { WeatherBotStrategy, WeatherData, MarketCondition } from '../../../src/strategies/polymarket/WeatherBotStrategy';
import { IMarketTick } from '../../../src/interfaces/IPolymarket';

describe('WeatherBotStrategy', () => {
  let strategy: WeatherBotStrategy;

  beforeEach(() => {
    strategy = new WeatherBotStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.minEdgeThreshold).toBe(0.05);
      expect(config.maxPositionSize).toBe(50);
      expect(config.dataSource).toBe('open-meteo');
      expect(config.updateIntervalMs).toBe(300000);
    });

    it('should accept custom config', async () => {
      await strategy.init([], {
        minEdgeThreshold: 0.08,
        maxPositionSize: 100,
        dataSource: 'noaa',
      });

      const config = strategy.getConfig();
      expect(config.minEdgeThreshold).toBe(0.08);
      expect(config.maxPositionSize).toBe(100);
      expect(config.dataSource).toBe('noaa');
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.minEdgeThreshold).toBeDefined();
      expect(schema.maxPositionSize).toBeDefined();
      expect(schema.dataSource).toBeDefined();
      expect(schema.updateIntervalMs).toBeDefined();
    });
  });

  describe('weather data management', () => {
    it('should store weather data by location', () => {
      const weatherData: WeatherData = {
        temperature: 25,
        precipitation: 0,
        windSpeed: 10,
        condition: 'clear',
        timestamp: Date.now(),
      };

      strategy.updateWeatherData('nyc', weatherData);

      // Verify data stored (would need getter or check through signal generation)
      expect((strategy as any).weatherData.get('nyc')).toEqual(weatherData);
    });

    it('should update weather data timestamp', () => {
      const beforeUpdate = Date.now();
      const weatherData: WeatherData = {
        temperature: 20,
        condition: 'rain',
        timestamp: Date.now(),
      };

      strategy.updateWeatherData('london', weatherData);

      expect((strategy as any).lastUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe('market registration', () => {
    it('should register market condition', () => {
      const condition: MarketCondition = {
        type: 'temperature',
        threshold: 30,
        comparator: 'above',
        location: 'phoenix',
        endDate: Date.now() + 86400000,
      };

      strategy.registerMarket('token-1', condition);

      expect((strategy as any).marketConditions.get('token-1')).toEqual(condition);
    });
  });

  describe('probability calculations', () => {
    describe('temperature probability', () => {
      it('should calculate sigmoid probability for temperature', async () => {
        const condition: MarketCondition = {
          type: 'temperature',
          threshold: 25,
          comparator: 'above',
          location: 'miami',
          endDate: Date.now() + 86400000,
        };

        const weather: WeatherData = {
          temperature: 30, // Above threshold
          condition: 'clear',
          timestamp: Date.now(),
        };

        strategy.registerMarket('token-1', condition);
        strategy.updateWeatherData('miami', weather);

        const prob = await strategy.calculateFairValue('token-1');

        // Temp 30 > threshold 25, prob should be > 0.5 for 'above'
        expect(prob).toBeGreaterThan(0.5);
      });

      it('should handle missing temperature data', async () => {
        const condition: MarketCondition = {
          type: 'temperature',
          threshold: 25,
          comparator: 'below',
          location: 'seattle',
          endDate: Date.now() + 86400000,
        };

        const weather: WeatherData = {
          condition: 'cloudy',
          timestamp: Date.now(),
        };

        strategy.registerMarket('token-1', condition);
        strategy.updateWeatherData('seattle', weather);

        const prob = await strategy.calculateFairValue('token-1');

        expect(prob).toBe(0.5);
      });
    });

    describe('precipitation probability', () => {
      it('should return 1 for rain when precipitation > 0', async () => {
        const condition: MarketCondition = {
          type: 'precipitation',
          threshold: 0,
          comparator: 'above',
          location: 'london',
          endDate: Date.now() + 86400000,
        };

        const weather: WeatherData = {
          precipitation: 5,
          condition: 'rain',
          timestamp: Date.now(),
        };

        strategy.registerMarket('token-1', condition);
        strategy.updateWeatherData('london', weather);

        const prob = await strategy.calculateFairValue('token-1');

        expect(prob).toBe(1);
      });
    });

    describe('wind probability', () => {
      it('should return 1 when wind speed >= threshold', async () => {
        const condition: MarketCondition = {
          type: 'wind',
          threshold: 20,
          comparator: 'above',
          location: 'chicago',
          endDate: Date.now() + 86400000,
        };

        const weather: WeatherData = {
          windSpeed: 25,
          condition: 'storm',
          timestamp: Date.now(),
        };

        strategy.registerMarket('token-1', condition);
        strategy.updateWeatherData('chicago', weather);

        const prob = await strategy.calculateFairValue('token-1');

        expect(prob).toBe(1);
      });
    });
  });

  describe('signal generation', () => {
    const createTick = (tokenId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should generate BUY_YES signal when fair value > market price', async () => {
      const condition: MarketCondition = {
        type: 'temperature',
        threshold: 25,
        comparator: 'above',
        location: 'phoenix',
        endDate: Date.now() + 86400000,
      };

      const weather: WeatherData = {
        temperature: 35, // High temp → high prob
        condition: 'clear',
        timestamp: Date.now(),
      };

      strategy.registerMarket('token-1', condition);
      strategy.updateWeatherData('phoenix', weather);

      const tick = createTick('token-1', 0.40, 0.60); // Market undervalues YES
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeTruthy();
      expect(signal?.side).toBe('YES');
      expect(signal?.action).toBe('BUY');
    });

    it('should return null when edge below threshold', async () => {
      const condition: MarketCondition = {
        type: 'temperature',
        threshold: 20,
        comparator: 'above',
        location: 'sf',
        endDate: Date.now() + 86400000,
      };

      const weather: WeatherData = {
        temperature: 20, // At threshold → ~0.5 prob
        condition: 'clear',
        timestamp: Date.now(),
      };

      strategy.registerMarket('token-1', condition);
      strategy.updateWeatherData('sf', weather);

      const tick = createTick('token-1', 0.48, 0.52); // Close to fair value
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeNull();
    });

    it('should include metadata in signal', async () => {
      const condition: MarketCondition = {
        type: 'temperature',
        threshold: 30,
        comparator: 'above',
        location: 'vegas',
        endDate: Date.now() + 86400000,
      };

      const weather: WeatherData = {
        temperature: 40,
        condition: 'clear',
        timestamp: Date.now(),
      };

      strategy.registerMarket('token-1', condition);
      strategy.updateWeatherData('vegas', weather);

      const tick = createTick('token-1', 0.30, 0.70);
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal?.metadata).toBeDefined();
      expect(signal?.metadata?.fairValue).toBeDefined();
      expect(signal?.metadata?.edge).toBeDefined();
    });
  });
});
