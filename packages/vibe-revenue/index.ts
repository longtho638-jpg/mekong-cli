/**
 * 🟤 Neptune - VIBE Revenue
 * Finance & $1M ARR Manager
 * 
 * Pattern 71: Revenue-Driven Architecture
 * Pattern 77: Annualized GMV Telemetry
 */

// ============================================
// CONSTANTS
// ============================================

export const ARR_TARGET_2026 = 1_000_000;
export const CURRENCY = { USD: 'USD', VND: 'VND', THB: 'THB' } as const;

export const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    VND: 24500,
    THB: 35,
};

// ============================================
// TYPES
// ============================================

export type Currency = keyof typeof CURRENCY;

export interface Revenue {
    id: string;
    source: 'wellnexus' | 'agency' | 'saas';
    amount: number;
    currency: Currency;
    date: Date;
    recurring: boolean;
}

export interface ARRDashboard {
    currentMRR: number;
    currentARR: number;
    targetARR: number;
    progress: number;
    gap: number;
    monthsToTarget: number;
}

export interface VCReadiness {
    mrrGrowth: number;
    ltvCacRatio: number;
    ruleOf40: number;
    score: number;
    stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b';
}

// ============================================
// REVENUE ENGINE
// ============================================

export class VibeRevenue {
    private revenues: Revenue[] = [];

    addRevenue(revenue: Omit<Revenue, 'id'>): Revenue {
        const newRevenue: Revenue = {
            ...revenue,
            id: `rev_${Date.now()}`,
        };
        this.revenues.push(newRevenue);
        return newRevenue;
    }

    getMRR(): number {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return this.revenues
            .filter(r => r.date >= thirtyDaysAgo && r.recurring)
            .reduce((sum, r) => sum + this.toUSD(r.amount, r.currency), 0);
    }

    getARR(): number {
        return this.getMRR() * 12;
    }

    getDashboard(): ARRDashboard {
        const mrr = this.getMRR();
        const arr = this.getARR();
        const progress = (arr / ARR_TARGET_2026) * 100;
        const gap = Math.max(0, ARR_TARGET_2026 - arr);

        // Estimate months to target at 10% growth
        const monthsToTarget = gap > 0
            ? Math.ceil(Math.log(ARR_TARGET_2026 / arr) / Math.log(1.1))
            : 0;

        return {
            currentMRR: mrr,
            currentARR: arr,
            targetARR: ARR_TARGET_2026,
            progress,
            gap,
            monthsToTarget,
        };
    }

    getVCReadiness(mrrGrowth: number, cac: number, ltv: number): VCReadiness {
        const ltvCacRatio = ltv / cac;
        const grossMargin = 70; // Assumed 70% for SaaS
        const ruleOf40 = mrrGrowth + grossMargin;

        let score = 0;
        if (mrrGrowth >= 10) score += 25;
        if (ltvCacRatio >= 3) score += 25;
        if (ruleOf40 >= 40) score += 25;
        if (this.getARR() >= 100000) score += 25;

        let stage: VCReadiness['stage'] = 'pre-seed';
        if (score >= 75) stage = 'series-a';
        else if (score >= 50) stage = 'seed';

        return { mrrGrowth, ltvCacRatio, ruleOf40, score, stage };
    }

    private toUSD(amount: number, currency: Currency): number {
        return amount / (EXCHANGE_RATES[currency] || 1);
    }

    getBySource(source: Revenue['source']): Revenue[] {
        return this.revenues.filter(r => r.source === source);
    }
}

// ============================================
// EXPORTS
// ============================================

export const revenue = new VibeRevenue();
export default { VibeRevenue, ARR_TARGET_2026, EXCHANGE_RATES, revenue };
