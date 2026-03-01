/**
 * Usage Metering — track and enforce plan usage limits
 *
 * Provides limit checking, overage calculation, and upgrade suggestion logic.
 */

// ─── Usage Meter Factory ────────────────────────────────────────

export function createUsageMeter() {
  return {
    /**
     * Check usage có vượt limit không
     */
    checkLimit(currentUsage: number, limit: number | undefined): { withinLimit: boolean; usagePercent: number } {
      if (limit === undefined) return { withinLimit: true, usagePercent: 0 };
      const usagePercent = Math.round((currentUsage / limit) * 100);
      return { withinLimit: currentUsage <= limit, usagePercent };
    },

    /**
     * Tính overage charge
     */
    calculateOverage(currentUsage: number, limit: number, overageRate: number): number {
      if (currentUsage <= limit) return 0;
      return Math.round((currentUsage - limit) * overageRate);
    },

    /**
     * Gợi ý upgrade khi usage gần limit
     */
    shouldSuggestUpgrade(usagePercent: number, threshold: number = 80): boolean {
      return usagePercent >= threshold;
    },
  };
}
