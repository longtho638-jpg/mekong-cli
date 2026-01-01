'use client';

import useSWR from 'swr';
import {
    fetchGuildStatus,
    fetchGuildNetwork,
    fetchBlacklist,
    fetchPricingBenchmarks,
    GuildStatus,
    GuildNetwork,
    Blacklist,
    PricingBenchmarks
} from '@/lib/api/blue-ocean';

// SWR fetcher wrapper
const fetcher = <T>(fn: () => Promise<T>) => fn();

export function useGuildStatus() {
    return useSWR<GuildStatus>('guild-status', () => fetcher(fetchGuildStatus), {
        refreshInterval: 30000, // Refresh every 30s
        revalidateOnFocus: false,
    });
}

export function useGuildNetwork() {
    return useSWR<GuildNetwork>('guild-network', () => fetcher(fetchGuildNetwork), {
        refreshInterval: 60000, // Refresh every minute
        revalidateOnFocus: false,
    });
}

export function useBlacklist() {
    return useSWR<Blacklist>('blacklist', () => fetcher(fetchBlacklist), {
        refreshInterval: 60000,
        revalidateOnFocus: false,
    });
}

export function usePricingBenchmarks() {
    return useSWR<PricingBenchmarks>('pricing-benchmarks', () => fetcher(fetchPricingBenchmarks), {
        refreshInterval: 300000, // Refresh every 5min
        revalidateOnFocus: false,
    });
}
