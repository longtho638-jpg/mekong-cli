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
            .select('stripe_customer_id, paypal_subscription_id')
            .eq('id', membership.organization_id)
            .single()

        // Handle Stripe Portal if available
        if (org?.stripe_customer_id) {
            // Implementation for Stripe portal would go here
            // For now, redirect to settings
        }

        return NextResponse.json({
            portal_url: '/dashboard/settings?tab=billing',
            message: 'Redirecting to billing settings',
        })
    } catch (error) {
        console.error('Error creating portal session:', error)
        return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
    }
}
