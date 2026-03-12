/**
 * Polar.sh Webhook API Route
 *
 * Next.js App Router endpoint for Polar.sh Standard Webhooks.
 * Verifies HMAC signatures and processes subscription events.
 *
 * @see https://docs.polar.sh/api/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { processWebhookEvent } from '../../../lib/polar-webhook-handler'
import type { PolarEventType, PolarSubscriptionEvent } from '../../../lib/polar-webhook-handler'
import { PolarConfig } from '../../../lib/polar-config'

/**
 * Verify Polar.sh webhook signature using HMAC-SHA256
 *
 * Polar.sh signs webhooks with a secret key. We verify the signature
 * to ensure the request is authentic.
 *
 * @param payload - Raw request body
 * @param signature - X-Polar-Signature header value
 * @returns true if signature is valid
 */
function verifySignature(payload: string, signature: string): boolean {
  const secret = PolarConfig.webhookSecret

  if (!secret) {
    console.error('[Polar Webhook] Missing webhook secret')
    return false
  }

  // Polar.sh uses HMAC-SHA256 with format: t=timestamp,v1=signature
  const parts = signature.split(',')
  const timestampPart = parts.find((p) => p.startsWith('t='))
  const signaturePart = parts.find((p) => p.startsWith('v1='))

  if (!timestampPart || !signaturePart) {
    console.error('[Polar Webhook] Invalid signature format')
    return false
  }

  const timestamp = timestampPart.slice(2)
  const expectedSignature = signaturePart.slice(3)

  // Create HMAC signature
  const signedPayload = `${timestamp}.${payload}`
  const hmac = createHmac('sha256', secret)
  hmac.update(signedPayload)
  const computedSignature = hmac.digest('hex')

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(expectedSignature, 'hex')
  const computedBuffer = Buffer.from(computedSignature, 'hex')

  if (signatureBuffer.length !== computedBuffer.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < signatureBuffer.length; i++) {
    result |= signatureBuffer[i] ^ computedBuffer[i]
  }

  return result === 0
}

/**
 * POST handler for Polar.sh webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Get signature from headers
    const signature = request.headers.get('x-polar-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const isValid = verifySignature(rawBody, signature)

    if (!isValid) {
      console.error('[Polar Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    let payload: PolarSubscriptionEvent
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[Polar Webhook] Invalid JSON payload')
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Get event type from header
    const eventType = request.headers.get('x-polar-event') as PolarEventType

    if (!eventType) {
      console.error('[Polar Webhook] Missing event type')
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEvents: PolarEventType[] = [
      'subscription.created',
      'subscription.active',
      'subscription.cancelled',
      'subscription.uncancelled',
    ]

    if (!validEvents.includes(eventType)) {
      console.error(`[Polar Webhook] Unknown event type: ${eventType}`)
      return NextResponse.json(
        { error: 'Unknown event type' },
        { status: 400 }
      )
    }

    // Process the webhook event
    const result = await processWebhookEvent(eventType, payload)

    if (!result.success) {
      console.error('[Polar Webhook] Processing failed:', result.message)
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

    console.log('[Polar Webhook] Processed successfully:', {
      event: eventType,
      action: result.action,
      licenseId: result.licenseId,
    })

    return NextResponse.json({
      success: true,
      action: result.action,
      licenseId: result.licenseId,
    })
  } catch (error) {
    console.error('[Polar Webhook] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
