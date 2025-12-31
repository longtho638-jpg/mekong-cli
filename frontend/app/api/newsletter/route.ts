import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/newsletters - List all newsletters for the user's org
export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        // Get newsletters
        const { data: newsletters, error } = await supabase
            .from('newsletters')
            .select('*')
            .eq('agency_id', membership.organization_id)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ newsletters })
    } catch (error) {
        console.error('Error fetching newsletters:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/newsletters - Create a new newsletter
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        // Get org details separately
        const { data: org } = await supabase
            .from('organizations')
            .select('plan, newsletters_count, newsletters_limit')
            .eq('id', membership.organization_id)
            .single()

        // Check limits (skip if org not found - let it create)
        if (org && org.newsletters_limit !== -1 && org.newsletters_count >= org.newsletters_limit) {
            return NextResponse.json({
                error: 'Newsletter limit reached. Upgrade to create more.',
                upgrade_url: '/dashboard/settings/billing'
            }, { status: 403 })
        }

        // Parse request body
        const body = await request.json()
        const { name, client_name, from_email, from_name, description, frequency } = body

        if (!name || !client_name) {
            return NextResponse.json({ error: 'Name and client_name are required' }, { status: 400 })
        }

        // Create slug
        const slug = `${client_name}-${name}`.toLowerCase().replace(/[^a-z0-9]/g, '-')

        // Insert newsletter
        const { data: newsletter, error } = await supabase
            .from('newsletters')
            .insert({
                agency_id: membership.organization_id,
                name,
                client_name,
                slug,
                from_email,
                from_name,
                description,
                frequency: frequency || 'weekly',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update org newsletter count
        if (org) {
            await supabase
                .from('organizations')
                .update({ newsletters_count: org.newsletters_count + 1 })
                .eq('id', membership.organization_id)
        }

        return NextResponse.json({ newsletter }, { status: 201 })
    } catch (error) {
        console.error('Error creating newsletter:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
