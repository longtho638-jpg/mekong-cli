import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/polar-checkout-client';
import { CheckoutSchema } from '@/lib/schemas/checkout';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId, customerEmail, locale: bodyLocale } = CheckoutSchema.parse(body);

    const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
    // Use locale from body, fallback to header, then default to 'en'
    const locale = bodyLocale || req.headers.get('x-locale') || 'en';

    const session = await createCheckoutSession({
      priceId,
      customerEmail,
      successUrl: `${baseUrl}/${locale}/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        source: 'landing-page',
        locale,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
