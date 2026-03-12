import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes efficiently.
 * Combines clsx for conditional classes with tailwind-merge for conflict resolution.
 *
 * @param inputs - Class values to merge (strings, arrays, objects)
 * @returns Merged className string with Tailwind conflicts resolved
 *
 * @example
 * cn('px-2 py-1 bg-red', 'px-3') // => 'py-1 px-3 bg-red'
 * cn('text-white', { 'text-blue': isActive }) // => conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format amount as currency string (VND or USD).
 *
 * @param amount - The amount to format
 * @param currency - Currency type: 'VND' (default) or 'USD'
 * @returns Formatted currency string (e.g., '10M VND' or '$1,000')
 *
 * @example
 * formatCurrency(10000000) // => '10M VND'
 * formatCurrency(1000, 'USD') // => '$1,000'
 * formatCurrency(NaN) // => '0M VND'
 */
export function formatCurrency(amount: number, currency: 'VND' | 'USD' = 'VND'): string {
  // Handle invalid numbers
  if (!Number.isFinite(amount)) {
    return currency === 'VND' ? '0M VND' : '$0';
  }

  if (currency === 'VND') {
    return `${(amount / 1_000_000).toFixed(0)}M VND`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

/**
 * Format number with locale-aware thousand separators.
 *
 * @param num - The number to format
 * @returns Formatted number string with thousand separators
 *
 * @example
 * formatNumber(1000000) // => '1,000,000'
 * formatNumber(NaN) // => '0'
 */
export function formatNumber(num: number): string {
  // Handle invalid numbers
  if (!Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString('en-US');
}
