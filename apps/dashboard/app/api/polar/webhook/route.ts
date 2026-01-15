import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Polar webhook events
type WebhookEvent = {
    type: string
    data: {
        id: string
        customer_id: string
        product_id: string
        status: string
        metadata?: Record<string, string>
    }
}

/**
 * Verify Polar webhook signature using HMAC-SHA256
 */
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )
    } catch {
        return false
    }
}

export async function POST(request: Request) {
    const headersList = await headers()
    const signature = headersList.get('polar-signature')
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET

    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify signature in production
    if (webhookSecret && process.env.NODE_ENV === 'production') {
        if (!verifySignature(rawBody, signature, webhookSecret)) {
            console.error('Invalid webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
    } else if (!webhookSecret) {
        console.warn('POLAR_WEBHOOK_SECRET not set - skipping signature verification')
    }

    try {
        const event: WebhookEvent = JSON.parse(rawBody)

        console.log('Polar webhook received:', event.type)

        const supabase = await createClient()

        switch (event.type) {
            case 'subscription.created':
            case 'subscription.updated':
                // Update agency subscription status
                const { data: agency } = await supabase
                    .from('agencies')
                    .select('id')
                    .eq('stripe_customer_id', event.data.customer_id) // Using same field for Polar
                    .single()

                if (agency) {
                    await supabase
                        .from('agencies')
                        .update({
                            subscription_status: event.data.status,
                            subscription_tier: getSubscriptionTier(event.data.product_id),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', agency.id)
                }
                break

            case 'subscription.canceled':
                // Handle cancellation
                const { data: canceledAgency } = await supabase
                    .from('agencies')
                    .select('id')
                    .eq('stripe_customer_id', event.data.customer_id)
                    .single()

                if (canceledAgency) {
                    await supabase
                        .from('agencies')
                        .update({
                            subscription_status: 'canceled',
                            subscription_tier: 'free',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', canceledAgency.id)
                }
                break

            case 'checkout.created':
                // Log checkout started
                console.log('Checkout created:', event.data.id)
                break

            case 'order.created':
                // Handle one-time purchase
                console.log('Order created:', event.data.id)
                break

            default:
                console.log('Unhandled webhook event:', event.type)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}

function getSubscriptionTier(productId: string): string {
    const tiers: Record<string, string> = {
        [process.env.POLAR_PRODUCT_STARTER || '']: 'starter',
        [process.env.POLAR_PRODUCT_PRO || '']: 'pro',
        [process.env.POLAR_PRODUCT_AGENCY || '']: 'agency',
        [process.env.POLAR_PRODUCT_FRANCHISE || '']: 'franchise',
    }
    return tiers[productId] || 'free'
}
