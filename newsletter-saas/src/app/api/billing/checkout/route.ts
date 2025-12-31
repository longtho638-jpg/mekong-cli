import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/billing/checkout - Create checkout session
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { plan, interval = 'monthly' } = body

        // Validate plan
        const validPlans = ['starter', 'pro', 'agency']
        if (!validPlans.includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        // Dynamically import Polar to avoid build-time issues
        const { Polar } = await import('@polar-sh/sdk')
        const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN })

        // Pricing table
        const pricing: Record<string, Record<string, { price: number; priceId: string }>> = {
            starter: {
                monthly: { price: 29, priceId: process.env.POLAR_PRICE_STARTER_MONTHLY || '' },
                yearly: { price: 290, priceId: process.env.POLAR_PRICE_STARTER_YEARLY || '' },
            },
            pro: {
                monthly: { price: 99, priceId: process.env.POLAR_PRICE_PRO_MONTHLY || '' },
                yearly: { price: 990, priceId: process.env.POLAR_PRICE_PRO_YEARLY || '' },
            },
            agency: {
                monthly: { price: 299, priceId: process.env.POLAR_PRICE_AGENCY_MONTHLY || '' },
                yearly: { price: 2990, priceId: process.env.POLAR_PRICE_AGENCY_YEARLY || '' },
            },
        }

        const selectedPrice = pricing[plan][interval]

        // For demo/MVP, return a mock checkout URL
        // In production, use Polar API to create actual checkout
        if (!process.env.POLAR_ACCESS_TOKEN) {
            // Demo mode - just update the plan
            await supabase
                .from('organizations')
                .update({
                    plan,
                    polar_customer_id: `demo_customer_${user.id}`,
                })
                .eq('id', membership.organization_id)

            return NextResponse.json({
                success: true,
                demo: true,
                message: `Demo mode: Upgraded to ${plan}`,
                checkout_url: null,
            })
        }

        // Production: Create Polar checkout
        // Note: Polar SDK API varies by version - adjust as needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkoutsApi = polar.checkouts as any
        const checkout = await checkoutsApi?.create?.({
            productPriceId: selectedPrice.priceId,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?billing=success`,
            customerEmail: user.email,
            metadata: {
                organization_id: membership.organization_id,
                user_id: user.id,
                plan,
            },
        }) || { url: `/pricing?error=sdk` }

        return NextResponse.json({
            checkout_url: checkout.url,
            plan,
            interval,
            price: selectedPrice.price,
        })
    } catch (error) {
        console.error('Error creating checkout:', error)
        return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }
}

// GET /api/billing/checkout - Get current subscription
export async function GET() {
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
            .select('plan, polar_customer_id, polar_subscription_id')
            .eq('id', membership.organization_id)
            .single()

        return NextResponse.json({
            plan: org?.plan || 'free',
            has_subscription: !!org?.polar_subscription_id,
            customer_id: org?.polar_customer_id,
        })
    } catch (error) {
        console.error('Error fetching billing:', error)
        return NextResponse.json({ error: 'Failed to fetch billing' }, { status: 500 })
    }
}
