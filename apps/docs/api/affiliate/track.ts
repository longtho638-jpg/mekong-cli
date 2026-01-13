import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hash IP for privacy
function hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip + 'affiliate_salt').digest('hex').substring(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET: Track click
        if (req.method === 'GET') {
            const { ref, source, medium, campaign, page } = req.query;

            if (!ref || typeof ref !== 'string') {
                return res.status(400).json({ error: 'Missing referral code' });
            }

            // Verify affiliate exists
            const { data: affiliate, error: affError } = await supabase
                .from('affiliates')
                .select('id')
                .eq('referral_code', ref.toUpperCase())
                .eq('is_active', true)
                .single();

            if (affError || !affiliate) {
                return res.status(404).json({ error: 'Invalid referral code' });
            }

            // Parse user agent
            const userAgentString = req.headers['user-agent'] || '';
            const parser = new UAParser(userAgentString);
            const device = parser.getDevice().type || 'desktop';
            const browser = parser.getBrowser().name || 'unknown';

            // Get IP (hashed for privacy)
            const forwarded = req.headers['x-forwarded-for'];
            const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || '';
            const ipHash = hashIP(ip);

            // Record click
            const { data: click, error: clickError } = await supabase
                .from('affiliate_clicks')
                .insert({
                    affiliate_id: affiliate.id,
                    referral_code: ref.toUpperCase(),
                    source: source || null,
                    medium: medium || null,
                    campaign: campaign || null,
                    landing_page: page || '/',
                    ip_hash: ipHash,
                    user_agent: userAgentString.substring(0, 500),
                    device,
                    browser,
                })
                .select('id')
                .single();

            if (clickError) {
                console.error('Failed to track click:', clickError);
                return res.status(500).json({ error: 'Failed to track click' });
            }

            // Update affiliate total clicks
            await supabase.rpc('increment_affiliate_clicks', { aff_id: affiliate.id });

            // Set cookie for 60-day attribution
            res.setHeader('Set-Cookie', [
                `aff_ref=${ref};Path=/;Max-Age=${60 * 24 * 60 * 60};SameSite=Lax`,
                `aff_click=${click.id};Path=/;Max-Age=${60 * 24 * 60 * 60};SameSite=Lax`,
            ]);

            return res.status(200).json({
                success: true,
                clickId: click.id,
                message: 'Click tracked successfully',
            });
        }

        // POST: Get affiliate stats (for dashboard)
        if (req.method === 'POST') {
            const { action, affiliateId } = req.body;

            if (action === 'stats') {
                // Get affiliate dashboard stats
                const { data: affiliate } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('id', affiliateId)
                    .single();

                if (!affiliate) {
                    return res.status(404).json({ error: 'Affiliate not found' });
                }

                // Get this month's stats
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { data: monthlyClicks } = await supabase
                    .from('affiliate_clicks')
                    .select('id', { count: 'exact' })
                    .eq('affiliate_id', affiliateId)
                    .gte('created_at', startOfMonth.toISOString());

                const { data: monthlyConversions } = await supabase
                    .from('affiliate_conversions')
                    .select('id, commission_amount')
                    .eq('affiliate_id', affiliateId)
                    .gte('created_at', startOfMonth.toISOString());

                const monthlyEarnings = monthlyConversions?.reduce(
                    (sum, c) => sum + parseFloat(c.commission_amount), 0
                ) || 0;

                // Get recent conversions
                const { data: recentConversions } = await supabase
                    .from('affiliate_conversions')
                    .select('*')
                    .eq('affiliate_id', affiliateId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Get achievements
                const { data: achievements } = await supabase
                    .from('affiliate_achievements')
                    .select('*')
                    .eq('affiliate_id', affiliateId);

                return res.status(200).json({
                    success: true,
                    stats: {
                        totalClicks: affiliate.total_clicks,
                        totalConversions: affiliate.total_conversions,
                        totalEarnings: affiliate.total_earnings,
                        pendingPayout: affiliate.pending_payout,
                        lifetimeEarnings: affiliate.lifetime_earnings,
                        monthlyClicks: monthlyClicks?.length || 0,
                        monthlyConversions: monthlyConversions?.length || 0,
                        monthlyEarnings,
                        conversionRate: affiliate.total_clicks > 0
                            ? ((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(1)
                            : '0',
                        badge: affiliate.badge,
                        rank: affiliate.rank,
                    },
                    recentConversions,
                    achievements,
                });
            }

            if (action === 'leaderboard') {
                // Get current month leaderboard
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { data: leaderboard } = await supabase
                    .from('affiliates')
                    .select('id, name, total_conversions, total_earnings, badge')
                    .eq('is_active', true)
                    .gt('total_conversions', 0)
                    .order('total_earnings', { ascending: false })
                    .limit(10);

                return res.status(200).json({
                    success: true,
                    leaderboard: leaderboard?.map((a, i) => ({
                        rank: i + 1,
                        name: a.name || `Affiliate ${a.id.substring(0, 4)}`,
                        sales: a.total_conversions,
                        earnings: `$${a.total_earnings.toFixed(2)}`,
                        badge: a.badge,
                    })),
                });
            }

            return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
