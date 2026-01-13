import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const { tier, email } = await req.json();

        const productId = tier === 'pro'
            ? process.env.POLAR_PRO_PRODUCT_ID!
            : process.env.POLAR_ENTERPRISE_PRODUCT_ID!;

        const checkout = await polar.checkouts.create({
            productId: productId,
            successUrl: `${req.headers.get('origin')}/success?checkout_id={CHECKOUT_ID}&email=${email}`,
            customerEmail: email,
            metadata: {
                tier: tier,
            },
        });

        return NextResponse.json({ checkoutUrl: checkout.url });
    } catch (err: any) {
        console.error('Polar checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
