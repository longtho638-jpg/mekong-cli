import { describe, it, expect } from 'vitest';
import { formatPrice, calculatePrice } from './flowers';

describe('Flower Helpers', () => {
  it('formats price correctly', () => {
    expect(formatPrice(100000)).toBe('100.000đ');
    expect(formatPrice(0)).toBe('0đ');
  });

  it('calculates price based on size multiplier', () => {
    const basePrice = 100000;
    
    expect(calculatePrice(basePrice, 'S')).toBe(100000); // 1.0
    expect(calculatePrice(basePrice, 'M')).toBe(150000); // 1.5
    expect(calculatePrice(basePrice, 'L')).toBe(200000); // 2.0
    expect(calculatePrice(basePrice, 'XL')).toBe(300000); // 3.0
  });
});
