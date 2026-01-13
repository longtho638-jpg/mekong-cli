import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tier limits configuration
const TIER_LIMITS: Record<string, {
    monthly_api_calls: number;
    monthly_commands: number;
    team_members: number;
    white_label: boolean;
    api_access: boolean;
}> = {
    free: { monthly_api_calls: 100, monthly_commands: 10, team_members: 1, white_label: false, api_access: false },
    starter: { monthly_api_calls: 1000, monthly_commands: 50, team_members: 1, white_label: false, api_access: false },
    pro: { monthly_api_calls: 10000, monthly_commands: 500, team_members: 5, white_label: false, api_access: true },
    franchise: { monthly_api_calls: 100000, monthly_commands: 5000, team_members: 25, white_label: true, api_access: true },
    enterprise: { monthly_api_calls: -1, monthly_commands: -1, team_members: -1, white_label: true, api_access: true },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // GET: Get subscription status and usage
    if (req.method === 'GET') {
        const email = req.query.email as string;
        const licenseKey = req.query.license_key as string;

        if (!email && !licenseKey) {
            return res.status(400).json({ error: 'email or license_key required' });
        }

        try {
            // Get license/subscription
            let query = supabase.from('licenses').select('*');

            if (licenseKey) {
                query = query.eq('license_key', licenseKey);
            } else if (email) {
                query = query.eq('email', email);
            }

            const { data: license, error: licenseError } = await query.single();

            if (licenseError || !license) {
                return res.status(404).json({
                    error: 'No active subscription found',
                    has_subscription: false,
                    tier: 'free',
                    limits: TIER_LIMITS.free
                });
            }

            const tier = license.plan || 'starter';
            const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter;

            // Get usage (simplified - in production use RPC)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: apiCalls } = await supabase
                .from('usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('agency_id', license.agency_id)
                .eq('action', 'api_call')
                .gte('created_at', startOfMonth.toISOString());

            const { count: commands } = await supabase
                .from('usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('agency_id', license.agency_id)
                .eq('action', 'command_exec')
                .gte('created_at', startOfMonth.toISOString());

            const usage = {
                api_calls: apiCalls || 0,
                commands: commands || 0,
                api_calls_remaining: limits.monthly_api_calls === -1 ? -1 : Math.max(0, limits.monthly_api_calls - (apiCalls || 0)),
                commands_remaining: limits.monthly_commands === -1 ? -1 : Math.max(0, limits.monthly_commands - (commands || 0)),
            };

            return res.status(200).json({
                has_subscription: true,
                tier,
                status: license.status,
                license_key: license.license_key,
                expires_at: license.expires_at,
                limits,
                usage,
                features: {
                    api_access: limits.api_access,
                    white_label: limits.white_label,
                    team_members: limits.team_members,
                }
            });

        } catch (error: any) {
            console.error('Subscription check error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // POST: Record usage
    if (req.method === 'POST') {
        const { agency_id, action, command, metadata } = req.body;

        if (!agency_id || !action) {
            return res.status(400).json({ error: 'agency_id and action required' });
        }

        try {
            // Insert usage log
            const { error } = await supabase.from('usage_logs').insert({
                agency_id,
                action,
                command,
                metadata: metadata || {},
            });

            if (error) throw error;

            return res.status(200).json({ recorded: true });

        } catch (error: any) {
            console.error('Usage record error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
