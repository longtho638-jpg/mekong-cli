import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatNumber } from './utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('merges tailwind classes with twMerge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns empty string for all falsy values', () => {
    expect(cn(false, null, undefined, 0)).toBe('');
  });

  it('handles complex classValue objects', () => {
    expect(cn('base', { conditional: true }, ['array', 'class'])).toContain('base');
  });
});

describe('formatCurrency', () => {
  it('formats VND in millions', () => {
    expect(formatCurrency(1000000)).toBe('1M VND');
    expect(formatCurrency(5000000)).toBe('5M VND');
    expect(formatCurrency(10000000)).toBe('10M VND');
  });

  it('formats USD with commas', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000');
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000');
  });

  it('handles invalid numbers gracefully', () => {
    expect(formatCurrency(NaN)).toBe('0M VND');
    expect(formatCurrency(Infinity)).toBe('0M VND');
    expect(formatCurrency(-Infinity)).toBe('0M VND');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('0M VND');
    expect(formatCurrency(0, 'USD')).toBe('$0');
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(1234567890)).toBe('1,234,567,890');
  });

  it('handles invalid numbers gracefully', () => {
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(Infinity)).toBe('0');
  });

  it('handles zero and negative numbers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-1000)).toBe('-1,000');
  });
});
