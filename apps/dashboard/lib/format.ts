/**
 * Number Formatting Utilities
 * ===========================
 * Consistent number formatting to prevent SSR/Client hydration mismatches.
 *
 * IMPORTANT: Always use 'en-US' locale to ensure server and client
 * render the same output regardless of user's system locale.
 */

/**
 * Format a number with thousands separators (1,234,567)
 * Uses en-US locale for SSR/Client consistency
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Format a number as currency ($1,234.56)
 * Uses en-US locale for SSR/Client consistency
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as percentage (75.5%)
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a large number with K/M/B suffix (1.2M)
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
