/**
 * @agencyos/vibe-creator-economy — Creator Economy Facade SDK
 *
 * Content monetization, audience analytics, IP management, multi-platform distribution.
 *
 * Usage:
 *   import { createRevenueTracker, createAudienceAnalyzer, createIPManager } from '@agencyos/vibe-creator-economy';
 */

// ─── Types ──────────────────────────────────────────────────────

export type RevenueStream = 'subscription' | 'tipping' | 'sponsorship' | 'licensing' | 'ugc_marketplace' | 'affiliate';
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'twitch' | 'substack' | 'patreon' | 'custom';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface CreatorProfile {
  id: string;
  name: string;
  platforms: Platform[];
  totalFollowers: number;
  monthlyRevenue: number;
  contentCount: number;
}

export interface RevenueEntry {
  id: string;
  stream: RevenueStream;
  platform: Platform;
  amount: number;
  currency: string;
  date: string;
  description: string;
}

export interface ContentAsset {
  id: string;
  title: string;
  platform: Platform;
  status: ContentStatus;
  publishedAt?: string;
  engagement: { views: number; likes: number; comments: number; shares: number };
}

// ─── Revenue Tracker ────────────────────────────────────────────

export function createRevenueTracker() {
  const entries: RevenueEntry[] = [];

  return {
    /** Ghi nhận doanh thu mới */
    addEntry(entry: RevenueEntry): void {
      entries.push({ ...entry });
    },

    /** Tổng doanh thu theo stream type */
    getByStream(stream: RevenueStream): number {
      return entries.filter(e => e.stream === stream).reduce((sum, e) => sum + e.amount, 0);
    },

    /** Tổng doanh thu theo platform */
    getByPlatform(platform: Platform): number {
      return entries.filter(e => e.platform === platform).reduce((sum, e) => sum + e.amount, 0);
    },

    /** Tổng doanh thu trong khoảng thời gian */
    getByDateRange(from: string, to: string): number {
      return entries
        .filter(e => e.date >= from && e.date <= to)
        .reduce((sum, e) => sum + e.amount, 0);
    },

    /** Báo cáo tổng hợp doanh thu */
    getSummary(): Record<RevenueStream, number> {
      const summary = {} as Record<RevenueStream, number>;
      for (const entry of entries) {
        summary[entry.stream] = (summary[entry.stream] || 0) + entry.amount;
      }
      return summary;
    },
  };
}

// ─── Audience Analyzer ──────────────────────────────────────────

export interface AudienceSegment {
  name: string;
  size: number;
  engagementRate: number;
  avgRevenuePerUser: number;
  demographics: { ageRange: string; topRegions: string[] };
}

export function createAudienceAnalyzer() {
  return {
    /** Tính engagement rate từ metrics */
    calculateEngagementRate(views: number, interactions: number): number {
      if (views === 0) return 0;
      return Math.round((interactions / views) * 10000) / 100;
    },

    /** Xếp hạng content theo engagement */
    rankContent(assets: ContentAsset[]): ContentAsset[] {
      return [...assets].sort((a, b) => {
        const engA = a.engagement.likes + a.engagement.comments + a.engagement.shares;
        const engB = b.engagement.likes + b.engagement.comments + b.engagement.shares;
        return engB - engA;
      });
    },

    /** Dự đoán churn risk dựa trên engagement trend */
    assessChurnRisk(recentEngagement: number, historicalAvg: number): 'low' | 'medium' | 'high' {
      const ratio = historicalAvg === 0 ? 0 : recentEngagement / historicalAvg;
      if (ratio >= 0.8) return 'low';
      if (ratio >= 0.5) return 'medium';
      return 'high';
    },
  };
}

// ─── IP Manager ─────────────────────────────────────────────────

export interface IPAsset {
  id: string;
  title: string;
  type: 'video' | 'image' | 'audio' | 'text' | 'design';
  ownerIds: string[];
  royaltySplits: { ownerId: string; percentage: number }[];
  registeredAt: string;
  licenseType: 'exclusive' | 'non_exclusive' | 'creative_commons' | 'all_rights_reserved';
}

export function createIPManager() {
  return {
    /** Validate royalty splits sum to 100% */
    validateSplits(splits: { ownerId: string; percentage: number }[]): { valid: boolean; reason?: string } {
      const total = splits.reduce((sum, s) => sum + s.percentage, 0);
      if (Math.abs(total - 100) > 0.01) return { valid: false, reason: `Tổng phần chia ${total}%, phải = 100%` };
      if (splits.some(s => s.percentage <= 0)) return { valid: false, reason: 'Phần chia phải > 0%' };
      return { valid: true };
    },

    /** Tính royalty payout cho mỗi owner */
    calculatePayouts(totalRevenue: number, splits: { ownerId: string; percentage: number }[]): Record<string, number> {
      const payouts: Record<string, number> = {};
      for (const split of splits) {
        payouts[split.ownerId] = Math.round(totalRevenue * (split.percentage / 100));
      }
      return payouts;
    },

    /** Check license compatibility */
    isLicenseCompatible(source: IPAsset['licenseType'], target: IPAsset['licenseType']): boolean {
      if (source === 'all_rights_reserved') return false;
      if (source === 'creative_commons') return target !== 'exclusive';
      return true;
    },
  };
}
