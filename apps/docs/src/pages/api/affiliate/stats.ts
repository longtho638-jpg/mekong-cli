// API Endpoint: /api/affiliate/stats
// Purpose: Affiliate earnings and performance data
// Authentication: User session (future implementation)

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || '',
    import.meta.env.SUPABASE_SERVICE_KEY || ''
);

export const GET: APIRoute = async ({ url }) => {
    try {
        // Extract user_id from query params
        const userId = url.searchParams.get('user_id');

        if (!userId) {
            return new Response(
                JSON.stringify({
                    error: 'Missing user_id',
                    message: 'Please provide a user_id in the query parameter'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Fetch affiliate stats
        const { data: stats, error: statsError } = await supabase
            .from('affiliate_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (statsError || !stats) {
            return new Response(
                JSON.stringify({
                    error: 'User not found',
                    message: 'Affiliate user not found or invalid user_id'
                }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Calculate next payout date (first of next month)
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 5);
        const nextPayoutDate = nextMonth.toISOString().split('T')[0];

        // Rank progression
        const rankHierarchy = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
        const currentRankIndex = rankHierarchy.indexOf(stats.rank);
        const nextRank = currentRankIndex < rankHierarchy.length - 1
            ? rankHierarchy[currentRankIndex + 1]
            : stats.rank;

        // Calculate progress to next rank (simplified)
        const referralsNeeded = currentRankIndex < rankHierarchy.length - 1 ? 5 : 0;
        const progress = Math.min((stats.conversions % 20) * 5, 100);

        // Mock activity feed (future: fetch from actual events table)
        const activity = [
            {
                type: 'conversion',
                amount: 45.00,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'click',
                amount: 0,
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'conversion',
                amount: 30.00,
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Achievements (simplified)
        const achievements = [
            {
                id: 'first_sale',
                name: 'First Sale',
                description: 'Made your first conversion',
                unlocked: stats.conversions > 0
            },
            {
                id: 'ten_conversions',
                name: '10 Conversions',
                description: 'Reached 10 conversions',
                unlocked: stats.conversions >= 10
            },
            {
                id: 'gold_rank',
                name: 'Gold Status',
                description: 'Achieved Gold rank',
                unlocked: stats.rank === 'Gold' || currentRankIndex > 2
            },
            {
                id: 'thousand_earned',
                name: '$1K Earned',
                description: 'Earned $1,000+ total',
                unlocked: stats.total_earnings >= 1000
            }
        ];

        const dashboardData = {
            stats: {
                total_earnings: parseFloat(stats.total_earnings),
                total_clicks: stats.total_clicks,
                conversions: stats.conversions,
                conversion_rate: parseFloat(stats.conversion_rate),
                pending_payout: parseFloat(stats.pending_payout),
                next_payout_date: nextPayoutDate
            },
            rank: {
                current: stats.rank,
                progress,
                next_rank: nextRank,
                referrals_needed: referralsNeeded
            },
            activity,
            achievements,
            updated_at: stats.updated_at || new Date().toISOString()
        };

        return new Response(
            JSON.stringify(dashboardData),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, max-age=10' // Cache for 10 seconds
                }
            }
        );

    } catch (error) {
        console.error('API Error:', error);

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: 'An unexpected error occurred'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
