/**
 * 💳 CAPTURE PAYMENT API ROUTE
 * =============================
 * Server-side endpoint to capture PayPal payments
 *
 * Flow:
 * 1. Receive order ID from success page
 * 2. Call PayPal API to capture payment
 * 3. Generate license key
 * 4. Update database
 * 5. Return result to client
 *
 * Architecture: Success Page → Capture API → PayPal → DB Update
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

// Generate license key
function generateLicenseKey(tenantId: string = 'default'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const checksum = (timestamp + random).split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
  }, 0).toString(16).substring(0, 8)

  return `AGY-${tenantId}-${timestamp}-${checksum}`.toUpperCase()
}

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

// Capture PayPal order
async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal capture failed:', error)
    throw new Error('Failed to capture payment')
  }

  return response.json()
}

// POST handler
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Capture payment from PayPal
    const capture = await capturePayPalOrder(orderId)
    const purchaseUnit = capture.purchase_units[0]
    const captureData = purchaseUnit.payments.captures[0]

    // Get transaction details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()

    // Generate license key
    const licenseKey = generateLicenseKey(transaction?.tenant_id || 'default')

    // Update transaction with capture details
    await supabase
      .from('transactions')
      .update({
        transaction_id: captureData.id,
        status: 'CAPTURED',
        license_key: licenseKey,
        captured_at: new Date().toISOString(),
        metadata: {
          ...transaction?.metadata,
          capture_data: captureData,
        },
      })
      .eq('order_id', orderId)

    return NextResponse.json({
      success: true,
      orderId: capture.id,
      transactionId: captureData.id,
      status: captureData.status,
      amount: captureData.amount.value,
      currency: captureData.amount.currency_code,
      licenseKey,
    })
  } catch (error) {
    console.error('Capture error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Capture failed' },
      { status: 500 }
    )
  }
}
