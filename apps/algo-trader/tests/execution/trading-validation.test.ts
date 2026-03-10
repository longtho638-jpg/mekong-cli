/**
 * Trading Validation Tests
 * Lightweight unit tests for input validation
 */

import { describe, test, expect } from '@jest/globals';
import {
  validateSymbol,
  validateAmount,
  validatePrice,
  validateSide,
  validateOrderInput,
  validateArbitrageOpportunity,
  safeNumber,
  TradingValidationError
} from '../../src/execution/trading-validation';

describe('Trading Validation', () => {
  describe('validateSymbol', () => {
    test('should accept CCXT format BTC/USDT', () => {
      const result = validateSymbol('BTC/USDT');
      expect(result.valid).toBe(true);
      expect(result.normalizedSymbol).toBe('BTC/USDT');
    });

    test('should accept Binance format BTCUSDT', () => {
      const result = validateSymbol('BTCUSDT');
      expect(result.valid).toBe(true);
      expect(result.normalizedSymbol).toBe('BTC/USDT');
    });

    test('should normalize lowercase symbols', () => {
      const result = validateSymbol('btc/usdt');
      expect(result.normalizedSymbol).toBe('BTC/USDT');
    });

    test('should throw on empty symbol', () => {
      expect(() => validateSymbol('')).toThrow(TradingValidationError);
    });

    test('should throw on invalid format', () => {
      expect(() => validateSymbol('INVALID')).toThrow(TradingValidationError);
    });

    test('should throw on null input', () => {
      expect(() => validateSymbol(null as any)).toThrow(TradingValidationError);
    });
  });

  describe('validateAmount', () => {
    test('should accept valid positive amount', () => {
      const result = validateAmount(1.5);
      expect(result).toBe(1.5);
    });

    test('should throw on zero', () => {
      expect(() => validateAmount(0)).toThrow(TradingValidationError);
    });

    test('should throw on negative', () => {
      expect(() => validateAmount(-1)).toThrow(TradingValidationError);
    });

    test('should throw on Infinity', () => {
      expect(() => validateAmount(Infinity)).toThrow(TradingValidationError);
    });

    test('should throw on NaN', () => {
      expect(() => validateAmount(NaN)).toThrow(TradingValidationError);
    });

    test('should throw on excessive value', () => {
      expect(() => validateAmount(2e12)).toThrow(TradingValidationError);
    });
  });

  describe('validatePrice', () => {
    test('should accept valid positive price', () => {
      const result = validatePrice(50000);
      expect(result).toBe(50000);
    });

    test('should throw on zero', () => {
      expect(() => validatePrice(0)).toThrow(TradingValidationError);
    });

    test('should throw on negative', () => {
      expect(() => validatePrice(-100)).toThrow(TradingValidationError);
    });

    test('should throw on excessive value', () => {
      expect(() => validatePrice(2e15)).toThrow(TradingValidationError);
    });
  });

  describe('validateSide', () => {
    test('should accept buy', () => {
      expect(validateSide('buy')).toBe('buy');
    });

    test('should accept sell', () => {
      expect(validateSide('sell')).toBe('sell');
    });

    test('should normalize uppercase', () => {
      expect(validateSide('BUY')).toBe('buy');
    });

    test('should normalize mixed case', () => {
      expect(validateSide('SeLl')).toBe('sell');
    });

    test('should throw on invalid side', () => {
      expect(() => validateSide('hold')).toThrow(TradingValidationError);
    });
  });

  describe('validateOrderInput', () => {
    test('should accept valid market order', () => {
      const result = validateOrderInput({
        side: 'buy',
        symbol: 'BTC/USDT',
        amount: 0.5
      });
      expect(result.side).toBe('buy');
      expect(result.symbol).toBe('BTC/USDT');
      expect(result.amount).toBe(0.5);
    });

    test('should accept valid limit order', () => {
      const result = validateOrderInput({
        side: 'sell',
        symbol: 'ETHUSDT',
        amount: 2,
        price: 3000
      });
      expect(result.side).toBe('sell');
      expect(result.symbol).toBe('ETH/USDT');
      expect(result.price).toBe(3000);
    });

    test('should throw on invalid side', () => {
      expect(() => validateOrderInput({
        side: 'invalid',
        symbol: 'BTC/USDT',
        amount: 1
      })).toThrow(TradingValidationError);
    });
  });

  describe('validateArbitrageOpportunity', () => {
    test('should accept profitable opportunity', () => {
      const result = validateArbitrageOpportunity({
        buyPrice: 100,
        sellPrice: 110,
        amount: 1,
        minProfitPercent: 5
      });
      expect(result.valid).toBe(true);
      expect(result.profitPercent).toBe(10);
    });

    test('should throw when profit below minimum', () => {
      expect(() => validateArbitrageOpportunity({
        buyPrice: 100,
        sellPrice: 102,
        amount: 1,
        minProfitPercent: 5
      })).toThrow(TradingValidationError);
    });

    test('should throw on loss opportunity', () => {
      expect(() => validateArbitrageOpportunity({
        buyPrice: 100,
        sellPrice: 90,
        amount: 1,
        minProfitPercent: 0
      })).toThrow(TradingValidationError);
    });
  });

  describe('safeNumber', () => {
    test('should return number as-is', () => {
      expect(safeNumber(42)).toBe(42);
    });

    test('should parse valid string', () => {
      expect(safeNumber('3.14')).toBe(3.14);
    });

    test('should return default on invalid', () => {
      expect(safeNumber(null, 0)).toBe(0);
    });

    test('should return default on NaN string', () => {
      expect(safeNumber('invalid', 100)).toBe(100);
    });
  });
});
