'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAgents, runAgent, getRouterStats, getGuildStatus, type Agent, type AgentsResponse, type RouterStats, type GuildStatus } from '@/lib/api/mekong';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 USE AGENTS HOOK - Connect to FastAPI backend for agent management
// ═══════════════════════════════════════════════════════════════════════════════

export function useAgentsAPI() {
    const [agents, setAgents] = useState<AgentsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAgents();
            setAgents(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch agents');
            // Return demo data on error
            setAgents({
                quad_agents: [
                    { name: 'Scout', role: 'Thu thập thông tin', status: 'ready' },
                    { name: 'Editor', role: 'Biên tập nội dung', status: 'ready' },
                    { name: 'Director', role: 'Đạo diễn video', status: 'ready' },
                    { name: 'Community', role: 'Đăng bài & tương tác', status: 'ready' },
                ],
                mekong_agents: [
                    { name: 'Market Analyst', role: 'Phân tích giá nông sản', status: 'ready' },
                    { name: 'Zalo Integrator', role: 'Tích hợp Zalo', status: 'ready' },
                    { name: 'Local Copywriter', role: 'Content địa phương', status: 'ready' },
                ],
                total: 7,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const executeAgent = async (agentName: string, task: string) => {
        try {
            const result = await runAgent(agentName, task);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to run agent');
            throw err;
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    return {
        agents,
        loading,
        error,
        refetch: fetchAgents,
        executeAgent,
        allAgents: agents ? [...agents.quad_agents, ...agents.mekong_agents] : [],
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔀 USE ROUTER HOOK - Hybrid Router stats
// ═══════════════════════════════════════════════════════════════════════════════

export function useRouterStats() {
    const [stats, setStats] = useState<RouterStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                setLoading(true);
                const data = await getRouterStats();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch router stats');
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return { stats, loading, error };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ USE GUILD HOOK - Blue Ocean Protocol status
// ═══════════════════════════════════════════════════════════════════════════════

export function useGuildStatus() {
    const [guild, setGuild] = useState<GuildStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                setLoading(true);
                const data = await getGuildStatus();
                setGuild(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch guild status');
                // Demo fallback
                setGuild({
                    member: 'Your Agency',
                    tier: 'worker',
                    tier_emoji: '🐝',
                    status: 'active',
                    trust_score: 67,
                    trust_max: 100,
                    score_breakdown: { base: 50, contributions: 10, referrals: 5, tenure: 2 },
                    contributions: { reports: 5, verified: 3, submissions: 8, referrals: 1 },
                    next_tier: { name: 'Queen Bee', emoji: '👑', required: 85, needed: 18 },
                });
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return { guild, loading, error };
}

export default useAgentsAPI;
