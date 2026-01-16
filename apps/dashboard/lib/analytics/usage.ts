/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
/**
 * Usage Analytics Module
 * Track user behavior and feature adoption
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsageEvent {
    id?: string;
    tenantId: string;
    userId: string;
    eventType: EventType;
    eventName: string;
    properties?: Record<string, any>;
    sessionId?: string;
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
    timestamp: Date;
}

export type EventType =
    | 'page_view'
    | 'feature_use'
    | 'action'
    | 'error'
    | 'conversion'
    | 'engagement';

export interface UsageMetrics {
    dau: number;       // Daily Active Users
    wau: number;       // Weekly Active Users
    mau: number;       // Monthly Active Users
    dauMauRatio: number;
    avgSessionDuration: number; // minutes
    avgPageViews: number;
    topFeatures: FeatureUsage[];
    topPages: PageUsage[];
}

export interface FeatureUsage {
    featureName: string;
    usageCount: number;
    uniqueUsers: number;
    adoptionRate: number; // percentage
}

export interface PageUsage {
    pagePath: string;
    pageViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number; // seconds
    bounceRate: number;
}

export interface EngagementScore {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'power';
    factors: {
        frequency: number;
        depth: number;
        recency: number;
        tenure: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class UsageAnalytics {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // EVENT TRACKING
    // ─────────────────────────────────────────────────────────────────────────────

    async trackEvent(event: Omit<UsageEvent, 'id' | 'timestamp'>): Promise<void> {
        await this.supabase.from('usage_events').insert({
            tenant_id: event.tenantId,
            user_id: event.userId,
            event_type: event.eventType,
            event_name: event.eventName,
            properties: event.properties || {},
            session_id: event.sessionId,
            page_url: event.pageUrl,
            referrer: event.referrer,
            user_agent: event.userAgent,
            created_at: new Date().toISOString(),
        });
    }

    async trackPageView(
        tenantId: string,
        userId: string,
        pageUrl: string,
        sessionId?: string
    ): Promise<void> {
        await this.trackEvent({
            tenantId,
            userId,
            eventType: 'page_view',
            eventName: 'page_view',
            pageUrl,
            sessionId,
        });
    }

    async trackFeatureUse(
        tenantId: string,
        userId: string,
        featureName: string,
        properties?: Record<string, any>
    ): Promise<void> {
        await this.trackEvent({
            tenantId,
            userId,
            eventType: 'feature_use',
            eventName: featureName,
            properties,
        });
    }

    async trackConversion(
        tenantId: string,
        userId: string,
        conversionType: string,
        value?: number
    ): Promise<void> {
        await this.trackEvent({
            tenantId,
            userId,
            eventType: 'conversion',
            eventName: conversionType,
            properties: { value },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // METRICS QUERIES
    // ─────────────────────────────────────────────────────────────────────────────

    async getUsageMetrics(tenantId: string, days: number = 30): Promise<UsageMetrics> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get DAU (last 24 hours)
        const { count: dauCount } = await this.supabase
            .from('usage_events')
            .select('user_id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        // Get WAU (last 7 days)
        const { count: wauCount } = await this.supabase
            .from('usage_events')
            .select('user_id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // Get MAU (last 30 days)
        const { count: mauCount } = await this.supabase
            .from('usage_events')
            .select('user_id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', startDate.toISOString());

        const dau = dauCount || 0;
        const wau = wauCount || 0;
        const mau = mauCount || 0;

        // Get top features
        const { data: features } = await this.supabase
            .from('usage_events')
            .select('event_name, user_id')
            .eq('tenant_id', tenantId)
            .eq('event_type', 'feature_use')
            .gte('created_at', startDate.toISOString());

        const featureMap = new Map<string, Set<string>>();
        (features || []).forEach(f => {
            if (!featureMap.has(f.event_name)) {
                featureMap.set(f.event_name, new Set());
            }
            featureMap.get(f.event_name)!.add(f.user_id);
        });

        const topFeatures: FeatureUsage[] = Array.from(featureMap.entries())
            .map(([name, users]) => ({
                featureName: name,
                usageCount: users.size,
                uniqueUsers: users.size,
                adoptionRate: mau > 0 ? (users.size / mau) * 100 : 0,
            }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10);

        // Get top pages
        const { data: pages } = await this.supabase
            .from('usage_events')
            .select('page_url, user_id')
            .eq('tenant_id', tenantId)
            .eq('event_type', 'page_view')
            .gte('created_at', startDate.toISOString());

        const pageMap = new Map<string, Set<string>>();
        (pages || []).forEach(p => {
            if (!p.page_url) return;
            if (!pageMap.has(p.page_url)) {
                pageMap.set(p.page_url, new Set());
            }
            pageMap.get(p.page_url)!.add(p.user_id);
        });

        const topPages: PageUsage[] = Array.from(pageMap.entries())
            .map(([path, users]) => ({
                pagePath: path,
                pageViews: users.size * 2, // Estimate
                uniqueVisitors: users.size,
                avgTimeOnPage: 45, // Placeholder
                bounceRate: 35, // Placeholder
            }))
            .sort((a, b) => b.pageViews - a.pageViews)
            .slice(0, 10);

        return {
            dau,
            wau,
            mau,
            dauMauRatio: mau > 0 ? (dau / mau) * 100 : 0,
            avgSessionDuration: 12.5, // Placeholder - calculate from sessions
            avgPageViews: 8.3, // Placeholder
            topFeatures,
            topPages,
        };
    }

    async getEngagementScore(tenantId: string, userId: string): Promise<EngagementScore> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get user events
        const { data: events } = await this.supabase
            .from('usage_events')
            .select('event_type, created_at')
            .eq('tenant_id', tenantId)
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo.toISOString());

        const eventCount = events?.length || 0;
        const recentEvents = (events || []).filter(
            e => new Date(e.created_at) > oneDayAgo
        ).length;

        // Calculate factors
        const frequency = Math.min(100, (eventCount / 30) * 10); // Events per day normalized
        const depth = Math.min(100, eventCount / 50 * 100); // Feature depth
        const recency = recentEvents > 0 ? 100 : Math.max(0, 100 - (eventCount === 0 ? 100 : 0));
        const tenure = 75; // Placeholder - calculate from first event

        const score = (frequency * 0.3 + depth * 0.25 + recency * 0.25 + tenure * 0.2);

        let level: EngagementScore['level'];
        if (score >= 80) level = 'power';
        else if (score >= 60) level = 'high';
        else if (score >= 30) level = 'medium';
        else level = 'low';

        return {
            score: Math.round(score),
            level,
            factors: {
                frequency: Math.round(frequency),
                depth: Math.round(depth),
                recency: Math.round(recency),
                tenure: Math.round(tenure),
            },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // REAL-TIME METRICS
    // ─────────────────────────────────────────────────────────────────────────────

    async getActiveUsersNow(tenantId: string): Promise<number> {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const { count } = await this.supabase
            .from('usage_events')
            .select('user_id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', fiveMinutesAgo.toISOString());

        return count || 0;
    }

    async getEventsPerHour(tenantId: string, hours: number = 24): Promise<Array<{ hour: string; count: number }>> {
        const result: Array<{ hour: string; count: number }> = [];
        const now = new Date();

        for (let i = hours - 1; i >= 0; i--) {
            const hourStart = new Date(now);
            hourStart.setHours(now.getHours() - i, 0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hourEnd.getHours() + 1);

            const { count } = await this.supabase
                .from('usage_events')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .gte('created_at', hourStart.toISOString())
                .lt('created_at', hourEnd.toISOString());

            result.push({
                hour: hourStart.toISOString().slice(11, 16),
                count: count || 0,
            });
        }

        return result;
    }
}

// Export singleton
export const usageAnalytics = new UsageAnalytics();
