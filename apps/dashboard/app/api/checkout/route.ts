/**
 * 💳 CHECKOUT API ROUTE
 * =====================
 * Creates PayPal orders for one-time payments and subscriptions
 *
 * Flow:
 * 1. Receive checkout request from frontend
 * 2. Create PayPal order via PayPal REST API
 * 3. Log transaction to Supabase
 * 4. Return PayPal redirect URL
 *
 * Architecture: User → Frontend → API → PayPal → Webhook → DB → Dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// PayPal config
const PAYPAL_MODE = process.env.NEXT_PUBLIC_PAYPAL_MODE || 'sandbox'
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

// Create PayPal order
async function createPayPalOrder(
  amount: string,
  currency: string,
  description: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approveUrl: string }> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
          description,
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: 'AgencyOS',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal order creation failed:', error)
    throw new Error('Failed to create PayPal order')
  }

  const order = await response.json()
  const approveUrl = order.links.find((link: any) => link.rel === 'approve')?.href

  return {
    id: order.id,
    approveUrl,
  }
}

// POST handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'USD', description, plan, customerEmail, tenantId } = body

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    // Get base URL for return/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/checkout/success`
    const cancelUrl = `${baseUrl}/checkout/cancel`

    // Create PayPal order
    const order = await createPayPalOrder(
      amount,
      currency,
      description || 'AgencyOS Payment',
      returnUrl,
      cancelUrl
    )

    // Log transaction to Supabase
    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        order_id: order.id,
        amount: parseFloat(amount),
        currency,
        status: 'CREATED',
        payment_method: 'paypal',
        customer_email: customerEmail,
        tenant_id: tenantId,
        plan,
        metadata: {
          description,
          created_at: new Date().toISOString(),
        },
      })

    if (dbError) {
      console.error('Failed to log transaction to Supabase:', dbError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approveUrl: order.approveUrl,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
