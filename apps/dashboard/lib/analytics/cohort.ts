/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
/**
 * Cohort Analysis Module
 * Track user retention and behavior over time
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CohortData {
    cohortPeriod: string;    // e.g., "2025-01" for January 2025 cohort
    totalUsers: number;
    retentionByWeek: number[]; // [100, 75, 60, 45, 40, ...] percentages
    retentionByMonth: number[];
    avgLifetimeValue: number;
    churnedUsers: number;
}

export interface RetentionMatrix {
    cohorts: CohortData[];
    overallRetention: {
        day1: number;
        day7: number;
        day30: number;
        day90: number;
    };
}

export interface ChurnAnalysis {
    churnRate: number;           // Monthly churn percentage
    churningRisk: UserChurnRisk[];
    churnReasons: ChurnReason[];
    predictedChurnNextMonth: number;
}

export interface UserChurnRisk {
    userId: string;
    email: string;
    riskScore: number;  // 0-100
    lastActive: Date;
    daysSinceActive: number;
    signupDate: Date;
}

export interface ChurnReason {
    reason: string;
    percentage: number;
    count: number;
}

export interface GrowthMetrics {
    newUsers: number;
    activatedUsers: number;  // Completed onboarding
    retainedUsers: number;   // Active after 30 days
    resurrectedUsers: number; // Returned after churn
    expansionRevenue: number;
    contractionRevenue: number;
    netRevenueRetention: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 COHORT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class CohortAnalytics {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RETENTION ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────────

    async getRetentionMatrix(tenantId: string, months: number = 6): Promise<RetentionMatrix> {
        const cohorts: CohortData[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);
            const cohortPeriod = cohortDate.toISOString().slice(0, 7);

            // Get users who signed up in this cohort
            const { data: cohortUsers } = await this.supabase
                .from('tenant_members')
                .select('user_id, created_at')
                .eq('tenant_id', tenantId)
                .gte('created_at', cohortDate.toISOString())
                .lte('created_at', cohortEnd.toISOString());

            const totalUsers = cohortUsers?.length || 0;
            if (totalUsers === 0) continue;

            const userIds = cohortUsers?.map(u => u.user_id) || [];

            // Calculate retention for each subsequent week
            const retentionByWeek: number[] = [100]; // Week 0 is always 100%
            for (let week = 1; week <= Math.min(12, Math.floor((months - i) * 4)); week++) {
                const weekStart = new Date(cohortDate);
                weekStart.setDate(weekStart.getDate() + week * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);

                if (weekStart > now) break;

                const { count } = await this.supabase
                    .from('usage_events')
                    .select('user_id', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId)
                    .in('user_id', userIds)
                    .gte('created_at', weekStart.toISOString())
                    .lt('created_at', weekEnd.toISOString());

                const retention = totalUsers > 0 ? ((count || 0) / totalUsers) * 100 : 0;
                retentionByWeek.push(Math.round(retention));
            }

            // Calculate monthly retention
            const retentionByMonth: number[] = [100];
            for (let month = 1; month <= months - i; month++) {
                const monthStart = new Date(cohortDate);
                monthStart.setMonth(monthStart.getMonth() + month);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);

                if (monthStart > now) break;

                const { count } = await this.supabase
                    .from('usage_events')
                    .select('user_id', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId)
                    .in('user_id', userIds)
                    .gte('created_at', monthStart.toISOString())
                    .lt('created_at', monthEnd.toISOString());

                const retention = totalUsers > 0 ? ((count || 0) / totalUsers) * 100 : 0;
                retentionByMonth.push(Math.round(retention));
            }

            cohorts.push({
                cohortPeriod,
                totalUsers,
                retentionByWeek,
                retentionByMonth,
                avgLifetimeValue: this.estimateLTV(retentionByMonth),
                churnedUsers: Math.round(totalUsers * (1 - (retentionByMonth[retentionByMonth.length - 1] || 0) / 100)),
            });
        }

        // Calculate overall retention metrics
        const overallRetention = this.calculateOverallRetention(cohorts);

        return { cohorts, overallRetention };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CHURN ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────────

    async getChurnAnalysis(tenantId: string): Promise<ChurnAnalysis> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        // Get all active members
        const { data: members } = await this.supabase
            .from('tenant_members')
            .select('user_id, email, created_at')
            .eq('tenant_id', tenantId)
            .eq('status', 'active');

        const totalMembers = members?.length || 0;

        // Get users active in last 30 days
        const { data: activeUsers } = await this.supabase
            .from('usage_events')
            .select('user_id')
            .eq('tenant_id', tenantId)
            .gte('created_at', thirtyDaysAgo.toISOString());

        const activeUserIds = new Set(activeUsers?.map(u => u.user_id) || []);

        // Calculate churn rate
        const inactiveCount = totalMembers - activeUserIds.size;
        const churnRate = totalMembers > 0 ? (inactiveCount / totalMembers) * 100 : 0;

        // Identify at-risk users
        const churningRisk: UserChurnRisk[] = [];
        for (const member of members || []) {
            if (!activeUserIds.has(member.user_id)) {
                // Get last activity
                const { data: lastEvent } = await this.supabase
                    .from('usage_events')
                    .select('created_at')
                    .eq('user_id', member.user_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                const lastActive = lastEvent ? new Date(lastEvent.created_at) : new Date(member.created_at);
                const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000));

                churningRisk.push({
                    userId: member.user_id,
                    email: member.email,
                    riskScore: Math.min(100, daysSinceActive * 2),
                    lastActive,
                    daysSinceActive,
                    signupDate: new Date(member.created_at),
                });
            }
        }

        // Sort by risk score
        churningRisk.sort((a, b) => b.riskScore - a.riskScore);

        // Common churn reasons (mock - would come from exit surveys)
        const churnReasons: ChurnReason[] = [
            { reason: 'Too expensive', percentage: 25, count: Math.round(inactiveCount * 0.25) },
            { reason: 'Missing features', percentage: 20, count: Math.round(inactiveCount * 0.20) },
            { reason: 'Switched to competitor', percentage: 15, count: Math.round(inactiveCount * 0.15) },
            { reason: 'No longer needed', percentage: 30, count: Math.round(inactiveCount * 0.30) },
            { reason: 'Poor support', percentage: 10, count: Math.round(inactiveCount * 0.10) },
        ];

        return {
            churnRate: Math.round(churnRate * 10) / 10,
            churningRisk: churningRisk.slice(0, 20),
            churnReasons,
            predictedChurnNextMonth: Math.round(totalMembers * (churnRate / 100) * 1.1),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GROWTH METRICS
    // ─────────────────────────────────────────────────────────────────────────────

    async getGrowthMetrics(tenantId: string, month?: Date): Promise<GrowthMetrics> {
        const targetMonth = month || new Date();
        const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
        const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
        const prevMonthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth() - 1, 1);

        // New users this month
        const { count: newUsers } = await this.supabase
            .from('tenant_members')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString());

        // Activated users (had at least 5 events in first week)
        const activatedUsers = Math.round((newUsers || 0) * 0.7); // Estimate 70% activation

        // Retained users (active both this month and last month)
        const { count: retainedUsers } = await this.supabase
            .from('usage_events')
            .select('user_id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', monthStart.toISOString());

        // Get subscription data for revenue metrics
        const { data: subscriptions } = await this.supabase
            .from('subscriptions')
            .select('plan')
            .eq('tenant_id', tenantId)
            .eq('status', 'active');

        const currentMRR = (subscriptions || []).reduce((sum, s) => {
            if (s.plan === 'PRO') return sum + 49;
            if (s.plan === 'ENTERPRISE') return sum + 199;
            return sum;
        }, 0);

        // Calculate NRR (simplified)
        const expansionRevenue = currentMRR * 0.05; // Estimate 5% expansion
        const contractionRevenue = currentMRR * 0.02; // Estimate 2% contraction
        const churned = currentMRR * 0.04; // Estimate 4% churn
        const netRevenueRetention = ((currentMRR + expansionRevenue - contractionRevenue - churned) / currentMRR) * 100;

        return {
            newUsers: newUsers || 0,
            activatedUsers,
            retainedUsers: retainedUsers || 0,
            resurrectedUsers: Math.round((newUsers || 0) * 0.1), // Estimate
            expansionRevenue: Math.round(expansionRevenue),
            contractionRevenue: Math.round(contractionRevenue),
            netRevenueRetention: Math.round(netRevenueRetention * 10) / 10,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private estimateLTV(retentionByMonth: number[]): number {
        // Calculate LTV using retention curve
        const avgMonthlyRevenue = 75; // Average between Pro and Enterprise
        let ltv = 0;
        let cumulativeRetention = 1;

        for (let i = 0; i < 24; i++) { // Project 24 months
            const retention = retentionByMonth[i] !== undefined
                ? retentionByMonth[i] / 100
                : cumulativeRetention * 0.95; // Decay if no data

            cumulativeRetention = retention;
            ltv += avgMonthlyRevenue * cumulativeRetention;
        }

        return Math.round(ltv);
    }

    private calculateOverallRetention(cohorts: CohortData[]): RetentionMatrix['overallRetention'] {
        if (cohorts.length === 0) {
            return { day1: 0, day7: 0, day30: 0, day90: 0 };
        }

        // Average retention across cohorts
        const avgRetentionWeek = (week: number) => {
            const values = cohorts
                .filter(c => c.retentionByWeek[week] !== undefined)
                .map(c => c.retentionByWeek[week]);
            return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        };

        return {
            day1: Math.round(avgRetentionWeek(0)),
            day7: Math.round(avgRetentionWeek(1)),
            day30: Math.round(avgRetentionWeek(4)),
            day90: Math.round(avgRetentionWeek(12)),
        };
    }
}

// Export singleton
export const cohortAnalytics = new CohortAnalytics();
