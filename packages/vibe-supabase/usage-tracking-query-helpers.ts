/**
 * Vibe Supabase SDK — Org-Scoped Usage Tracking Query Helpers
 *
 * Centralized queries for metering feature usage per org.
 * Uses generic SupabaseLike — no hard @supabase/supabase-js dependency.
 *
 * Usage:
 *   import { trackFeatureUsage, getOrgUsageSummary } from '@agencyos/vibe-supabase';
 *   await trackFeatureUsage(supabase, { orgId, userId, feature: 'ai_copilot' });
 */

import type { SupabaseLike } from './typed-query-helpers';

// ─── Types (inline to avoid external dep for metering) ──────────

export interface UsageRecord {
  id?: string;
  org_id: string;
  user_id: string;
  feature: string;
  quantity: number;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface UsageSummary {
  feature: string;
  total_quantity: number;
  event_count: number;
}

export interface UsageQuota {
  feature: string;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
}

// ─── Write Operations ──────────────────────────────────────────

/** Record a single usage event for an org feature */
export async function trackFeatureUsage(
  supabase: SupabaseLike,
  params: {
    orgId: string;
    userId: string;
    feature: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<UsageRecord> {
  const { data, error } = await supabase
    .from('usage_records')
    .insert({
      org_id: params.orgId,
      user_id: params.userId,
      feature: params.feature,
      quantity: params.quantity ?? 1,
      metadata: params.metadata ?? {},
      recorded_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as UsageRecord;
}

/** Batch insert multiple usage events (efficient for bulk metering) */
export async function trackFeatureUsageBatch(
  supabase: SupabaseLike,
  records: Array<{
    orgId: string;
    userId: string;
    feature: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
  }>,
): Promise<number> {
  const rows = records.map((r) => ({
    org_id: r.orgId,
    user_id: r.userId,
    feature: r.feature,
    quantity: r.quantity ?? 1,
    metadata: r.metadata ?? {},
    recorded_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('usage_records')
    .insert(rows as unknown as Record<string, unknown>) as unknown as { error: { message: string } | null };

  if (error) throw new Error(error.message);
  return rows.length;
}

// ─── Read Operations ───────────────────────────────────────────

/** Get aggregated usage summary for an org within a billing period */
export async function getOrgUsageSummary(
  supabase: SupabaseLike,
  orgId: string,
  periodStart: string,
  periodEnd: string,
): Promise<UsageSummary[]> {
  const { data, error } = await supabase
    .rpc('get_org_usage_summary', {
      p_org_id: orgId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

  if (error) throw new Error(error.message);
  return (data ?? []) as UsageSummary[];
}

/** Get usage for a specific feature within an org */
export async function getOrgUsageByFeature(
  supabase: SupabaseLike,
  orgId: string,
  feature: string,
  periodStart: string,
  periodEnd: string,
): Promise<UsageSummary | null> {
  const summaries = await getOrgUsageSummary(supabase, orgId, periodStart, periodEnd);
  return summaries.find((s) => s.feature === feature) ?? null;
}

/** Get raw usage timeline for an org (paginated, newest first) */
export async function getUsageTimeline(
  supabase: SupabaseLike,
  orgId: string,
  options?: {
    feature?: string;
    limit?: number;
    offset?: number;
  },
): Promise<UsageRecord[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('usage_records')
    .select('*')
    .eq('org_id', orgId)
    .order('recorded_at', { ascending: false })
    .range(offset, offset + limit - 1) as unknown;

  if (options?.feature) {
    query = (query as ReturnType<SupabaseLike['from']>).eq('feature', options.feature);
  }

  const { data, error } = await (query as Promise<{ data: UsageRecord[]; error: { message: string } | null }>);
  if (error) throw new Error(error.message);
  return (data ?? []) as UsageRecord[];
}

/** Check quota: compare current usage against plan limits */
export async function checkOrgQuota(
  supabase: SupabaseLike,
  orgId: string,
  feature: string,
  planLimit: number,
  periodStart: string,
  periodEnd: string,
): Promise<UsageQuota> {
  const summary = await getOrgUsageByFeature(
    supabase, orgId, feature, periodStart, periodEnd,
  );

  const used = summary?.total_quantity ?? 0;
  const remaining = Math.max(0, planLimit - used);
  const percentage = planLimit > 0 ? Math.round((used / planLimit) * 100) : 0;

  return { feature, limit: planLimit, used, remaining, percentage };
}

// ─── Convenience Namespace ──────────────────────────────────────

/** Grouped usage tracking queries for clean imports */
export const usageQueries = {
  trackFeatureUsage,
  trackFeatureUsageBatch,
  getOrgUsageSummary,
  getOrgUsageByFeature,
  getUsageTimeline,
  checkOrgQuota,
} as const;
