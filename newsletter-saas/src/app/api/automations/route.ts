import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AutomationStep {
    delay: string // '1d', '3d', '7d'
    subject: string
    content: string
}

interface CreateAutomationRequest {
    newsletter_id: string
    name: string
    trigger_type: 'signup' | 'tag_added' | 'inactivity'
    sequence: AutomationStep[]
}

// GET /api/automations - List automations
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const newsletterId = searchParams.get('newsletter_id')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let query = supabase
            .from('newsletter_automations')
            .select('*, newsletters(name)')

        if (newsletterId) {
            query = query.eq('newsletter_id', newsletterId)
        }

        const { data: automations, error } = await query.order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ automations })
    } catch (error) {
        console.error('Error fetching automations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/automations - Create automation
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body: CreateAutomationRequest = await request.json()

        const { newsletter_id, name, trigger_type, sequence } = body

        if (!newsletter_id || !name || !trigger_type || !sequence?.length) {
            return NextResponse.json({
                error: 'newsletter_id, name, trigger_type, and sequence are required'
            }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Create automation
        const { data: automation, error } = await supabase
            .from('newsletter_automations')
            .insert({
                newsletter_id,
                name,
                trigger_type,
                sequence,
                status: 'active',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ automation }, { status: 201 })
    } catch (error) {
        console.error('Error creating automation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Pre-built automation templates
export const AUTOMATION_TEMPLATES = {
    welcome_series: {
        name: 'Welcome Series',
        trigger_type: 'signup',
        sequence: [
            { delay: '0d', subject: 'Welcome to {{newsletter_name}}!', content: 'Thanks for subscribing...' },
            { delay: '3d', subject: 'Getting the most out of {{newsletter_name}}', content: 'Here are some tips...' },
            { delay: '7d', subject: 'A special offer just for you', content: 'As a new subscriber...' },
        ]
    },
    re_engagement: {
        name: 'Re-engagement Campaign',
        trigger_type: 'inactivity',
        sequence: [
            { delay: '30d', subject: 'We miss you!', content: 'It has been a while...' },
            { delay: '37d', subject: 'Last chance: Special offer inside', content: 'Don\'t miss out...' },
        ]
    },
    onboarding: {
        name: 'Product Onboarding',
        trigger_type: 'signup',
        sequence: [
            { delay: '0d', subject: 'Getting started with {{product}}', content: 'Welcome aboard...' },
            { delay: '1d', subject: 'Day 1: Your first steps', content: 'Let\'s dive in...' },
            { delay: '3d', subject: 'Day 3: Advanced features', content: 'Now that you\'re comfortable...' },
            { delay: '7d', subject: 'Day 7: Pro tips', content: 'You\'re doing great...' },
        ]
    }
}
