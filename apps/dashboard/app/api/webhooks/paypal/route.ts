/**
 * 🔔 PAYPAL WEBHOOK HANDLER
 * ==========================
 * Handles PayPal webhook events for payment notifications
 *
 * Flow:
 * 1. Receive webhook event from PayPal
 * 2. Verify PayPal signature (HMAC-SHA256)
 * 3. Handle PAYMENT.CAPTURE.COMPLETED event
 * 4. Update subscription status in Supabase
 * 5. Trigger confirmation email
 *
 * Architecture: PayPal → Webhook → Signature Verification → DB Update → Email
 *
 * SECURITY: Signature verification is MANDATORY (fail closed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// PayPal config
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!
const PAYPAL_MODE = process.env.NEXT_PUBLIC_PAYPAL_MODE || 'sandbox'
const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify PayPal webhook signature
async function verifyWebhookSignature(
  headers: Headers,
  body: string
): Promise<boolean> {
  const transmissionId = headers.get('paypal-transmission-id')
  const transmissionTime = headers.get('paypal-transmission-time')
  const certUrl = headers.get('paypal-cert-url')
  const authAlgo = headers.get('paypal-auth-algo')
  const transmissionSig = headers.get('paypal-transmission-sig')

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error('Missing PayPal webhook headers')
    return false
  }

  // Verify using PayPal's verification endpoint
  try {
    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    })

    if (!verifyResponse.ok) {
      console.error('PayPal verification failed:', await verifyResponse.text())
      return false
    }

    const verification = await verifyResponse.json()
    return verification.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('Webhook verification error:', error)
    return false
  }
}

// Handle PAYMENT.CAPTURE.COMPLETED event
async function handlePaymentCaptured(event: any) {
  const resource = event.resource
  const orderId = resource.supplementary_data?.related_ids?.order_id
  const captureId = resource.id
  const amount = resource.amount.value
  const currency = resource.amount.currency_code
  const status = resource.status

  console.log('Payment captured:', { orderId, captureId, amount, currency, status })

  // Update transaction in Supabase
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'COMPLETED',
      transaction_id: captureId,
      completed_at: new Date().toISOString(),
      metadata: {
        capture_data: resource,
      },
    })
    .eq('order_id', orderId)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    throw new Error('Database update failed')
  }

  // Get transaction details for email
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (fetchError || !transaction) {
    console.error('Failed to fetch transaction:', fetchError)
    // Don't throw - payment is already processed
    return
  }

  // TODO: Trigger confirmation email
  // This would integrate with your email service (SendGrid, Resend, etc.)
  console.log('TODO: Send confirmation email to:', transaction.customer_email)

  // TODO: Create subscription record if applicable
  if (transaction.plan) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: transaction.tenant_id,
        plan: transaction.plan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      })

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError)
    }
  }
}

// POST handler
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text()

    // Verify webhook signature (MANDATORY - fail closed)
    const isValid = await verifyWebhookSignature(req.headers, body)
    if (!isValid) {
      console.error('Invalid PayPal webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse event
    const event = JSON.parse(body)
    const eventType = event.event_type

    console.log('PayPal webhook event:', eventType)

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptured(event)
        break

      case 'PAYMENT.CAPTURE.DENIED':
        console.warn('Payment capture denied:', event.resource.id)
        // Update transaction status to DENIED
        await supabase
          .from('transactions')
          .update({ status: 'DENIED' })
          .eq('order_id', event.resource.supplementary_data?.related_ids?.order_id)
        break

      case 'PAYMENT.CAPTURE.REFUNDED':
        console.warn('Payment refunded:', event.resource.id)
        // Update transaction status to REFUNDED
        await supabase
          .from('transactions')
          .update({ status: 'REFUNDED' })
          .eq('transaction_id', event.resource.id)
        break

      default:
        console.log('Unhandled event type:', eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
