import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/billing/portal - Get customer portal link
export async function POST() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const { data: org } = await supabase
            .from('organizations')
            .select('polar_customer_id')
            .eq('id', membership.organization_id)
            .single()

        if (!org?.polar_customer_id) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
        }

        // Demo mode
        if (!process.env.POLAR_ACCESS_TOKEN || org.polar_customer_id.startsWith('demo_')) {
            return NextResponse.json({
                portal_url: '/dashboard/settings?tab=billing',
                demo: true,
                message: 'Demo mode - no customer portal available',
            })
        }

        // Production: Create Polar customer portal session
        const { Polar } = await import('@polar-sh/sdk')
        const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN })

        const session = await polar.customerSessions.create({
            customerId: org.polar_customer_id,
        })

        return NextResponse.json({
            portal_url: session.customerPortalUrl,
        })
    } catch (error) {
        console.error('Error creating portal session:', error)
        return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
    }
}
