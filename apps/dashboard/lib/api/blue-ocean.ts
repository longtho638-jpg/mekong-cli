/**
 * Blue Ocean API Client
 * Connects frontend pages to FastAPI backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GuildStatus {
    member: string;
    tier: string;
    tier_emoji: string;
    status: string;
    trust_score: number;
    trust_max: number;
    score_breakdown: {
        base: number;
        contributions: number;
        referrals: number;
        tenure: number;
    };
    contributions: {
        reports: number;
        verified: number;
        submissions: number;
        referrals: number;
    };
    next_tier: {
        name: string;
        emoji: string;
        required: number;
        needed: number;
    };
}

export interface GuildNetwork {
    members: {
        total: number;
        active_30d: number;
        new_this_month: number;
    };
    tiers: Array<{
        name: string;
        emoji: string;
        count: number;
        pct: number;
    }>;
    intelligence: {
        client_dnas: number;
        verified_reports: number;
        blacklisted: number;
        benchmarks: number;
    };
    activity_30d: {
        reports: number;
        verifications: number;
        referrals: number;
        defense_cases: number;
        value_protected: number;
    };
}

export interface ClientDNA {
    client: string;
    status: 'safe' | 'warning' | 'danger';
    trust_score: number;
    payment_history: string;
    reports: number;
    risk_level: string;
    recommendation: string;
}

export interface Blacklist {
    total: number;
    clients: Array<{
        name: string;
        risk: 'critical' | 'high' | 'medium';
        reason: string;
        reports: number;
    }>;
}

export interface PricingBenchmarks {
    avg_rate: number;
    rate_floor: number;
    your_rate: number;
    position: string;
    services: Array<{
        name: string;
        floor: number;
        avg: number;
        top: number;
        your: number;
    }>;
    rate_distribution: Array<{
        range: string;
        pct: number;
    }>;
}

// API Functions
export async function fetchGuildStatus(): Promise<GuildStatus> {
    const res = await fetch(`${API_BASE}/api/guild/status`);
    if (!res.ok) throw new Error('Failed to fetch guild status');
    return res.json();
}

export async function fetchGuildNetwork(): Promise<GuildNetwork> {
    const res = await fetch(`${API_BASE}/api/guild/network`);
    if (!res.ok) throw new Error('Failed to fetch guild network');
    return res.json();
}

export async function checkClientDNA(clientName: string): Promise<ClientDNA> {
    const res = await fetch(`${API_BASE}/api/defense/check/${encodeURIComponent(clientName)}`);
    if (!res.ok) throw new Error('Failed to check client DNA');
    return res.json();
}

export async function fetchBlacklist(): Promise<Blacklist> {
    const res = await fetch(`${API_BASE}/api/defense/blacklist`);
    if (!res.ok) throw new Error('Failed to fetch blacklist');
    return res.json();
}

export async function fetchPricingBenchmarks(): Promise<PricingBenchmarks> {
    const res = await fetch(`${API_BASE}/api/pricing/benchmarks`);
    if (!res.ok) throw new Error('Failed to fetch pricing benchmarks');
    return res.json();
}
