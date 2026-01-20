/**
 * 📊 VIBE Analytics - Growth and Formatting
 */
import { GrowthMetrics } from './types';

export function calculateGrowthMetrics(
  currentGMV: number, targetARR: number = 1_000_000, monthlyGrowthRate: number = 0.1,
): GrowthMetrics {
  const annualizedRunRate = currentGMV * 12;
  const gap = targetARR - annualizedRunRate;
  const monthsToTarget = gap > 0 ? Math.log(targetARR / annualizedRunRate) / Math.log(1 + monthlyGrowthRate) : 0;
  return { currentGMV, targetARR, growthRate: monthlyGrowthRate, daysToTarget: Math.ceil(monthsToTarget * 30), annualizedRunRate };
}

export function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} triệu`;
  return amount.toLocaleString("vi-VN") + " đ";
}
