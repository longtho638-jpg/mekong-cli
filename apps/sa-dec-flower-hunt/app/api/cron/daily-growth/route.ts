import { NextRequest, NextResponse } from 'next/server'
import { runContentGenerator } from '@/lib/agents/content-generator'
import { runLeadNurture } from '@/lib/agents/lead-nurture'
import { runSEOBlogAgent } from '@/lib/agents/seo-blog'
import { runTikTokAgent } from '@/lib/agents/tiktok-viral'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Daily Growth Orchestrator Cron Job
 * 🔒 SECURITY: Protected by CRON_SECRET
 * Configure in vercel.json: { "crons": [{ "path": "/api/cron/daily-growth", "schedule": "0 4 * * *" }] }
 */

export async function GET(request: NextRequest) {
    // 🔒 SECURITY: Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('[Daily Growth] Unauthorized access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Daily Growth Orchestrator] Starting at', new Date().toISOString())

    const results: Record<string, unknown> = {
        started_at: new Date().toISOString(),
        agents: {}
    }

    try {
        // 1. Run Content Generator (TikTok/FB/Blog templates)
        console.log('[Orchestrator] Running Content Generator...')
        const contentResult = await runContentGenerator()
        results.agents = { ...results.agents as object, content: contentResult }

        // 2. Run SEO Blog Agent (Generate SEO blog posts)
        console.log('[Orchestrator] Running SEO Blog Agent...')
        const seoResult = await runSEOBlogAgent(3) // 3 posts per day
        results.agents = { ...results.agents as object, seo_blog: seoResult }

        // 3. Run TikTok Viral Agent (Weekly content calendar - run on Mondays)
        const currentDay = new Date()
        if (currentDay.getDay() === 1) { // Monday
            console.log('[Orchestrator] Running TikTok Viral Agent (weekly)...')
            const tiktokResult = await runTikTokAgent()
            results.agents = { ...results.agents as object, tiktok: tiktokResult }
        }

        // 4. Run Lead Nurture (process pending emails)
        console.log('[Orchestrator] Running Lead Nurture...')
        const nurtureResult = await runLeadNurture()
        results.agents = { ...results.agents as object, nurture: nurtureResult }

        // 5. Update daily metrics
        console.log('[Orchestrator] Updating metrics...')
        const todayStr = new Date().toISOString().split('T')[0]

        // Ensure today's metrics row exists
        await supabase
            .from('growth_metrics')
            .upsert({ date: todayStr }, { onConflict: 'date' })

        // Get counts for the day
        const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${todayStr}T00:00:00`)
            .lt('created_at', `${todayStr}T23:59:59`)

        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${todayStr}T00:00:00`)
            .lt('created_at', `${todayStr}T23:59:59`)

        const { count: contentPosted } = await supabase
            .from('content_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'posted')
            .gte('posted_at', `${todayStr}T00:00:00`)

        // Update metrics
        await supabase
            .from('growth_metrics')
            .update({
                leads_captured: leadsCount || 0,
                orders_count: ordersCount || 0,
                content_posted: contentPosted || 0,
                updated_at: new Date().toISOString()
            })
            .eq('date', todayStr)

        results.metrics = {
            leads_captured: leadsCount,
            orders_count: ordersCount,
            content_posted: contentPosted
        }

        // 4. Log orchestrator run
        await supabase.from('agent_runs').insert({
            agent_name: 'orchestrator',
            status: 'completed',
            completed_at: new Date().toISOString(),
            output: results,
            items_processed: Object.keys(results.agents as object).length
        })

        results.completed_at = new Date().toISOString()
        results.duration_ms = Date.now() - startTime

        console.log('[Daily Growth Orchestrator] Completed in', results.duration_ms, 'ms')

        return NextResponse.json({
            success: true,
            message: 'Daily growth agents completed successfully',
            ...results
        })

    } catch (error: unknown) {
        console.error('[Daily Growth Orchestrator] Error:', error)

        // Log failed run
        await supabase.from('agent_runs').insert({
            agent_name: 'orchestrator',
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        })

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                partial_results: results
            },
            { status: 500 }
        )
    }
}

// Also support POST for manual triggers (🔒 SECURED)
export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return GET(request)
}
