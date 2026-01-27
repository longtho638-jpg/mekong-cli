import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row']

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const supabase = createAdminClient()

    // Retrieve line items to create order items
    // Note: session.line_items is not automatically expanded in the webhook payload
    // We need to fetch it from Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

    // 1. Create Order
    const orderData: any = {
      status: 'processing',
      total: session.amount_total ? session.amount_total / 100 : 0,
      shipping_address: JSON.parse(session.metadata?.shipping_address || '{}'),
      contact_info: {
        name: session.metadata?.customer_name,
        email: session.customer_details?.email,
      },
      stripe_session_id: session.id,
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return new NextResponse('Error creating order', { status: 500 })
    }

    // 2. Create Order Items
    const orderItems = lineItems.data.map((item) => ({
      order_id: (order as Order).id,
      product_id: item.price?.metadata?.id, // We passed this in metadata
      quantity: item.quantity || 1,
      price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
    }))

    // Filter out items that might not have a product_id (if any)
    const validOrderItems = orderItems.filter(item => item.product_id)

    if (validOrderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(validOrderItems as any)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        return new NextResponse('Error creating order items', { status: 500 })
      }
    }

    // 3. Update Inventory (Optional - simplistic approach)
    // for (const item of validOrderItems) {
    //   await supabase.rpc('decrement_inventory', { product_id: item.product_id, qty: item.quantity })
    // }
  }

  return new NextResponse(null, { status: 200 })
}
