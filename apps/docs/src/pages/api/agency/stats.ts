// API Endpoint: /api/agency/stats
// Purpose: Real-time agency metrics for Command Center
// Authentication: Admin token (future implementation)

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || '',
    import.meta.env.SUPABASE_SERVICE_KEY || ''
);

export const GET: APIRoute = async ({ request }) => {
    try {
        // TODO: Add admin authentication
        // const authHeader = request.headers.get('Authorization');

        // Fetch agency stats (single row table)
        const { data: stats, error: statsError } = await supabase
            .from('agency_stats')
            .select('*')
            .single();

        if (statsError || !stats) {
            return new Response(
                JSON.stringify({
                    error: 'Stats unavailable',
                    message: 'Unable to fetch agency statistics'
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Fetch active clients count (real-time)
        const { count: activeClientsCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // System health (hardcoded for now - future: check actual services)
        const systems = [
            { name: 'CRM', status: 'operational', uptime: 99.9 },
            { name: 'Invoicing', status: 'operational', uptime: 100 },
            { name: 'Analytics', status: 'operational', uptime: 99.5 },
            { name: 'Email', status: 'operational', uptime: 99.8 },
            { name: 'Webhooks', status: 'operational', uptime: 99.7 },
            { name: 'Calendar', status: 'operational', uptime: 99.9 }
        ];

        // Today's priorities (future: fetch from tasks/projects)
        const priorities = [
            {
                level: 'urgent',
                text: 'Invoice #INV-003 overdue - send reminder',
                icon: '🔴'
            },
            {
                level: 'high',
                text: 'Coffee Lab proposal due tomorrow',
                icon: '🟠'
            },
            {
                level: 'medium',
                text: 'Tech Startup monthly report to prepare',
                icon: '🟡'
            },
            {
                level: 'low',
                text: 'Team standup at 2:00 PM',
                icon: '🟢'
            }
        ];

        // Determine agency pulse based on metrics
        let pulse = 'thriving';
        const allOperational = systems.every(s => s.status === 'operational');
        const goodMargin = stats.profit_margin >= 35;
        const goodUtilization = stats.utilization >= 70;

        if (!allOperational || !goodMargin || !goodUtilization) {
            pulse = 'needs_attention';
        } else if (stats.profit_margin >= 40 && stats.utilization >= 80) {
            pulse = 'thriving';
        } else {
            pulse = 'healthy';
        }

        const dashboardData = {
            metrics: {
                revenue_mtd: stats.revenue_mtd,
                active_clients: activeClientsCount || stats.active_clients,
                profit_margin: stats.profit_margin,
                utilization: stats.utilization,
                nps_score: stats.nps_score,
                pipeline: stats.pipeline
            },
            systems,
            priorities,
            pulse,
            updated_at: stats.updated_at || new Date().toISOString()
        };

        return new Response(
            JSON.stringify(dashboardData),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, max-age=5' // Cache for 5 seconds
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
