import { NextRequest, NextResponse } from 'next/server'
import { runContentGenerator } from '@/lib/agents/content-generator'
import { runLeadNurture, startWelcomeSequence } from '@/lib/agents/lead-nurture'
import { processReferral, onPurchase, createReferralForUser } from '@/lib/agents/viral-loop'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Growth Agent API
 * 🔒 SECURITY: POST requires authentication
 */

// 🔒 Helper to check authentication
async function requireAuth(): Promise<{ userId: string; email: string } | null> {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient(cookieStore)
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return null
        return { userId: user.id, email: user.email || '' }
    } catch {
        return null
    }
}

// POST: Run specific agent (🔒 AUTHENTICATED ONLY)
export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Require authentication for agent execution
    const auth = await requireAuth()
    if (!auth) {
        return NextResponse.json(
            { error: 'Authentication required to run growth agents' },
            { status: 401 }
        )
    }

    const { searchParams } = new URL(request.url)
    const agent = searchParams.get('agent')

    // 🔒 Input validation
    if (!agent || typeof agent !== 'string') {
        return NextResponse.json(
            { error: 'agent parameter is required' },
            { status: 400 }
        )
    }

    // 🔒 Whitelist of allowed agents
    const allowedAgents = ['content', 'nurture', 'referral-use', 'referral-create', 'purchase-complete', 'start-welcome', 'all']
    if (!allowedAgents.includes(agent)) {
        return NextResponse.json(
            { error: `Unknown agent: ${agent}. Available: ${allowedAgents.join(', ')}` },
            { status: 400 }
        )
    }

    try {
        let result
        console.log(`🤖 [${auth.email}] Running growth agent: ${agent}`)

        switch (agent) {
            case 'content':
                result = await runContentGenerator()
                break

            case 'nurture':
                result = await runLeadNurture()
                break

            case 'referral-use': {
                const body = await request.json()
                // 🔒 Input validation
                if (!body.code || !body.email) {
                    return NextResponse.json({ error: 'code and email are required' }, { status: 400 })
                }
                result = await processReferral(body.code, body.email, body.orderId)
                break
            }

            case 'referral-create': {
                const body = await request.json()
                if (!body.userId || !body.email) {
                    return NextResponse.json({ error: 'userId and email are required' }, { status: 400 })
                }
                result = await createReferralForUser(body.userId, body.email, body.name)
                break
            }

            case 'purchase-complete': {
                const body = await request.json()
                if (!body.orderId || !body.email) {
                    return NextResponse.json({ error: 'orderId and email are required' }, { status: 400 })
                }
                result = await onPurchase(body.orderId, body.email, body.name)
                break
            }

            case 'start-welcome': {
                const body = await request.json()
                if (!body.leadId) {
                    return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
                }
                result = await startWelcomeSequence(body.leadId)
                break
            }

            case 'all':
                // Run all daily agents
                const contentResult = await runContentGenerator()
                const nurtureResult = await runLeadNurture()
                result = {
                    content: contentResult,
                    nurture: nurtureResult,
                    timestamp: new Date().toISOString()
                }
                break
        }

        console.log(`✅ [${auth.email}] Growth agent ${agent} completed`)
        return NextResponse.json({
            success: true,
            agent,
            result,
            executedBy: auth.email
        })

    } catch (error: unknown) {
        console.error(`[Growth Agent] Error running ${agent}:`, error)
        return NextResponse.json(
            { error: 'Agent execution failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

// GET: Get agent status and metrics (public read for dashboard)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    // 🔒 Validate action parameter
    const allowedActions = ['status', 'metrics', 'content-queue']
    if (!allowedActions.includes(action)) {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        if (action === 'status') {
            // Get recent agent runs
            const { data: recentRuns } = await supabase
                .from('agent_runs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(10)

            // Get today's metrics
            const today = new Date().toISOString().split('T')[0]
            const { data: todayMetrics } = await supabase
                .from('growth_metrics')
                .select('*')
                .eq('date', today)
                .single()

            // Get pending content
            const { data: pendingContent, count: pendingCount } = await supabase
                .from('content_queue')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')
                .limit(5)

            return NextResponse.json({
                success: true,
                status: {
                    recentRuns,
                    todayMetrics,
                    pendingContent,
                    pendingContentCount: pendingCount
                }
            })
        }

        if (action === 'metrics') {
            // Get metrics for last 7 days
            const { data: metrics } = await supabase
                .from('growth_metrics')
                .select('*')
                .order('date', { ascending: false })
                .limit(7)

            return NextResponse.json({ success: true, metrics })
        }

        if (action === 'content-queue') {
            const { data: queue } = await supabase
                .from('content_queue')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            return NextResponse.json({ success: true, queue })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

    } catch (error: unknown) {
        console.error('[Growth Agent] Error:', error)
        return NextResponse.json(
            { error: 'Failed to get status' },
            { status: 500 }
        )
    }
}
