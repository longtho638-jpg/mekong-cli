/**
 * Phantom Stealth Math — Statistical distributions for anti-detection
 *
 * Replaces uniform Math.random() jitter with proper statistical distributions
 * that match natural market behavior patterns. Exchanges use ML to detect
 * uniform distributions — these functions produce human-like randomness.
 *
 * Functions:
 * - poissonDelay(): Exponential inter-arrival times (Poisson process)
 * - logNormalSize(): Natural order size distribution
 * - boxMullerNormal(): Standard normal via Box-Muller transform
 * - avoidRoundNumbers(): Strips "bot signatures" from order amounts
 * - gaussianJitter(): Gaussian noise centered on base value
 */

/**
 * Box-Muller transform: generates a standard normal random variable (mean=0, std=1).
 * Used internally by logNormalSize and gaussianJitter.
 */
export function boxMullerNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Poisson process delay — exponential inter-arrival time.
 * Unlike uniform jitter (min-max), this produces natural clustering:
 * many short gaps + occasional long gaps, exactly like human traders.
 *
 * @param ratePerMinute Expected orders per minute (lambda)
 * @param minMs Floor to prevent zero-delay bursts
 * @param maxMs Ceiling to prevent absurdly long waits
 */
export function poissonDelay(
  ratePerMinute: number,
  minMs: number = 500,
  maxMs: number = 120_000,
): number {
  const lambda = ratePerMinute / 60_000; // convert to per-ms
  // Inverse CDF of exponential: -ln(1-U) / lambda
  const raw = -Math.log(1 - Math.random() + 1e-10) / lambda;
  return Math.round(Math.max(minMs, Math.min(maxMs, raw)));
}

/**
 * Log-normal order sizing — matches real market order size distribution.
 * Most orders are near the mean, with a fat right tail for large orders.
 * Exchanges detect uniform ±5% jitter easily; log-normal is undetectable.
 *
 * @param meanSize Desired mean order size
 * @param sigma Spread parameter (0.2=tight, 0.4=wide). Default 0.25
 */
export function logNormalSize(meanSize: number, sigma: number = 0.25): number {
  const z = boxMullerNormal();
  // E[X] = exp(mu + sigma^2/2) => mu = ln(meanSize) - sigma^2/2
  const mu = Math.log(meanSize) - (sigma * sigma) / 2;
  return Math.max(meanSize * 0.3, Math.exp(mu + sigma * z)); // floor at 30% of mean
}

/**
 * Gaussian jitter — bell-curve noise centered on base value.
 * 68% within ±1 sigma, 95% within ±2 sigma. More natural than uniform.
 *
 * @param base Center value
 * @param sigmaPct Standard deviation as percentage (0.15 = ±15% at 1 sigma)
 */
export function gaussianJitter(base: number, sigmaPct: number = 0.15): number {
  const z = boxMullerNormal();
  // Clamp to ±3 sigma to avoid extreme outliers
  const clamped = Math.max(-3, Math.min(3, z));
  return Math.max(base * 0.3, base * (1 + sigmaPct * clamped));
}

/**
 * Strip "bot signatures" from order amounts.
 * Exchanges flag: 1.0000, 0.5000, 0.0100, etc.
 * This adds micro-noise to avoid round numbers, then checks the result.
 *
 * @param amount Raw order amount
 * @param precision Decimal places (exchange-specific, default 8)
 */
export function avoidRoundNumbers(amount: number, precision: number = 8): number {
  // Check if trailing digits are suspiciously round
  const str = amount.toFixed(precision);
  const trailingZeros = str.match(/0+$/)?.[0]?.length ?? 0;

  if (trailingZeros >= 3 || str.endsWith('500') || str.endsWith('250')) {
    // Add micro-noise: 0.01-0.1% of amount, randomly positive or negative
    const noise = amount * (0.0001 + Math.random() * 0.0009) * (Math.random() > 0.5 ? 1 : -1);
    return parseFloat((amount + noise).toFixed(precision));
  }

  return parseFloat(amount.toFixed(precision));
}

/**
 * Combine log-normal sizing + round number avoidance in one call.
 * This is the recommended function for all order size generation.
 */
export function stealthSize(
  meanSize: number,
  sigma: number = 0.25,
  precision: number = 8,
): number {
  return avoidRoundNumbers(logNormalSize(meanSize, sigma), precision);
}

/**
 * Combine Poisson delay + Gaussian jitter for inter-order timing.
 * Primary delay from Poisson process, secondary jitter from Gaussian.
 */
export function stealthDelay(
  ratePerMinute: number,
  minMs: number = 500,
  maxMs: number = 120_000,
): number {
  const base = poissonDelay(ratePerMinute, minMs, maxMs);
  return Math.round(gaussianJitter(base, 0.1)); // ±10% Gaussian on Poisson base
}
