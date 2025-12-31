import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/polar/client'

// Polar webhook handler
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const signature = request.headers.get('polar-signature')

        // In production, verify webhook signature
        // const isValid = verifyWebhookSignature(body, signature, process.env.POLAR_WEBHOOK_SECRET)

        const supabase = await createClient()
        const event = body.type
        const data = body.data

        console.log('Polar webhook:', event)

        switch (event) {
            case 'subscription.created':
            case 'subscription.updated': {
                const orgId = data.metadata?.organization_id
                if (!orgId) break

                // Determine plan from product
                let plan = 'starter'
                if (data.product?.name?.toLowerCase().includes('pro')) plan = 'pro'
                if (data.product?.name?.toLowerCase().includes('agency')) plan = 'agency'

                const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

                await supabase
                    .from('organizations')
                    .update({
                        plan,
                        polar_subscription_id: data.id,
                        polar_customer_id: data.customer_id,
                        newsletters_limit: limits.newsletters,
                        subscribers_limit: limits.subscribers,
                        emails_limit: limits.emails_per_month,
                    })
                    .eq('id', orgId)

                break
            }

            case 'subscription.canceled':
            case 'subscription.revoked': {
                const orgId = data.metadata?.organization_id
                if (!orgId) break

                // Downgrade to free
                const limits = PLAN_LIMITS.free

                await supabase
                    .from('organizations')
                    .update({
                        plan: 'free',
                        polar_subscription_id: null,
                        newsletters_limit: limits.newsletters,
                        subscribers_limit: limits.subscribers,
                        emails_limit: limits.emails_per_month,
                    })
                    .eq('id', orgId)

                break
            }

            case 'checkout.created': {
                // User started checkout - could track for analytics
                console.log('Checkout started:', data.id)
                break
            }

            case 'checkout.updated': {
                // Checkout completed or failed
                if (data.status === 'succeeded') {
                    console.log('Checkout succeeded:', data.id)
                    // Subscription webhook will handle the actual update
                }
                break
            }

            default:
                console.log('Unhandled webhook event:', event)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
