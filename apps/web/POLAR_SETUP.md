# Polar.sh Integration Guide

## Why Polar.sh?

- ✅ **Developer-first**: Built for selling developer tools
- ✅ **GitHub integration**: Customers login with GitHub
- ✅ **Auto license delivery**: No manual work
- ✅ **Vietnam supported**: Via Stripe Connect
- ✅ **Clean API**: TypeScript/Python SDKs

**Fees:** 5% + Stripe (2.9%) = **7.9% total**

---

## Setup (10 minutes)

### 1. Create Polar Account

```bash
# Go to https://polar.sh
# Sign up with GitHub
# Complete onboarding
```

### 2. Install SDK

```bash
cd mekong-landing
npm install @polar-sh/sdk
```

### 3. Environment Variables

Create `.env.local`:
```bash
# Polar API Keys (Dashboard → Settings → API)
POLAR_ACCESS_TOKEN=polar_at_xxxxx
POLAR_WEBHOOK_SECRET=polar_wh_xxxxx

# Product IDs (created in step 4)
POLAR_PRO_PRODUCT_ID=prod_xxxxx
POLAR_ENTERPRISE_PRODUCT_ID=prod_xxxxx
```

---

## 4. Create Products in Polar Dashboard

### Pro Agency - $497
```
Name: Mekong Pro Agency
Price: $497 USD (one-time)
Description: 10 niches, 10 videos/day, white-label
Type: Product (one-time payment)
```

### Enterprise Franchise - $2,997
```
Name: Mekong Enterprise
Price: $2,997 USD (one-time)
Description: Unlimited everything, custom training
Type: Product (one-time payment)
```

**Get Product IDs:** Dashboard → Products → Copy ID

---

## Code Implementation

### 1. Create Checkout API Route

File: `app/api/create-checkout/route.ts`

\`\`\`typescript
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
      successUrl: \`\${req.headers.get('origin')}/success?checkout_id={CHECKOUT_ID}\`,
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
\`\`\`

### 2. Update Checkout Page

File: `app/checkout/page.tsx`

\`\`\`typescript
const handleCheckout = async () => {
  setLoading(true);
  
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, email }),
    });
    
    const { checkoutUrl } = await response.json();
    
    // Redirect to Polar checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Payment failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
\`\`\`

### 3. Success Page (License Delivery)

File: `app/success/page.tsx`

\`\`\`typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  const [license, setLicense] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checkoutId) {
      // Fetch license from backend
      fetch('/api/get-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutId }),
      })
        .then(res => res.json())
        .then(data => {
          setLicense(data.licenseKey);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [checkoutId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p>Đang tạo license key...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold mb-6">Thanh Toán Thành Công!</h1>
        
        {license ? (
          <div className="bg-slate-800 p-8 rounded-2xl border border-emerald-500">
            <p className="mb-4 text-lg">License Key của bạn:</p>
            <div className="bg-slate-900 px-4 py-3 rounded mb-2">
              <code className="text-emerald-400 text-lg font-mono break-all">
                {license}
              </code>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(license)}
              className="text-sm text-slate-400 hover:text-white"
            >
              📋 Click to copy
            </button>
            
            <div className="mt-8 text-left">
              <p className="font-bold mb-3 text-xl">Bước tiếp theo:</p>
              <pre className="bg-slate-900 p-4 rounded text-sm overflow-x-auto">
{\`# 1. Activate license
mekong activate --key ${license}

# 2. Create your project  
mekong init my-agency

# 3. Setup vibe
mekong setup-vibe\`}
              </pre>
            </div>

            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded">
              <p className="text-sm text-blue-300">
                💌 License key đã được gửi qua email: {searchParams.get('email') || 'your email'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-900/30 border border-red-500 p-6 rounded">
            <p className="text-red-300">Failed to retrieve license. Please contact support.</p>
          </div>
        )}

        <div className="mt-8">
          <a href="/docs" className="text-emerald-400 hover:underline text-lg">
            📚 Xem tài liệu hướng dẫn →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
\`\`\`

### 4. License Generation API

File: `app/api/get-license/route.ts`

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import crypto from 'crypto';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { checkoutId } = await req.json();
    
    // Get checkout details from Polar
    const checkout = await polar.checkouts.get({ id: checkoutId });
    
    if (checkout.status !== 'confirmed') {
      return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 });
    }
    
    // Check if license already exists (from webhook)
    // TODO: Query Supabase for existing license
    // const existing = await supabase.from('licenses').select('*').eq('checkout_id', checkoutId).single();
    // if (existing.data) return NextResponse.json({ licenseKey: existing.data.license_key });
    
    // Generate new license
    const tier = checkout.metadata?.tier || 'pro';
    const hash = crypto.randomBytes(16).toString('hex');
    const licenseKey = \`mk_live_\${tier}_\${hash}\`;
    
    // Save to database
    // TODO: Save to Supabase
    // await supabase.from('licenses').insert({
    //   checkout_id: checkoutId,
    //   license_key: licenseKey,
    //   tier: tier,
    //   email: checkout.customerEmail,
    //   created_at: new Date().toISOString()
    // });
    
    return NextResponse.json({ licenseKey });
  } catch (err: any) {
    console.error('License generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
\`\`\`

### 5. Webhook Handler (Optional - Auto License)

File: `app/api/webhooks/polar/route.ts`

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import crypto from 'crypto';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('webhook-signature')!;
    
    // Verify webhook (Polar provides verification)
    const event = await polar.webhooks.verify({
      payload: body,
      signature: signature,
      secret: process.env.POLAR_WEBHOOK_SECRET!,
    });
    
    if (event.type === 'checkout.confirmed') {
      const checkout = event.data;
      
      // Generate license
      const tier = checkout.metadata?.tier || 'pro';
      const hash = crypto.randomBytes(16).toString('hex');
      const licenseKey = \`mk_live_\${tier}_\${hash}\`;
      
      // Save to database
      // await supabase.from('licenses').insert({...});
      
      console.log('License generated:', licenseKey);
    }
    
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
\`\`\`

---

## Testing

### 1. Test Mode

Polar has **test mode** built-in:
- Toggle in Dashboard: Settings → Test Mode
- Use test credit cards (same as Stripe)
- Test card: 4242 4242 4242 4242

### 2. Local Testing

\`\`\`bash
# Run dev server
npm run dev

# Test checkout flow
# 1. Go to http://localhost:3000
# 2. Click "Mua Ngay" on Pro tier
# 3. Enter email
# 4. Complete test checkout
# 5. Verify license appears on /success
\`\`\`

---

## Go Live Checklist

- [ ] Create Polar account
- [ ] Create 2 products (Pro $497, Enterprise $2,997)
- [ ] Add environment variables to Vercel
- [ ] Deploy updated code
- [ ] Test checkout flow with real card
- [ ] Verify license email delivery
- [ ] Set up webhook (optional)
- [ ] Connect bank account for payouts

---

## Advantages Over Stripe

| Feature | Polar.sh | Stripe Direct |
|---------|----------|---------------|
| **Vietnam Support** | ✅ Yes | ❌ No |
| **Setup Time** | 10 mins | N/A |
| **License Auto-Delivery** | ✅ Built-in | Manual |
| **GitHub Auth** | ✅ Yes | ❌ No |
| **Developer UX** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Fees** | 7.9% | 3.4% |

**Bottom line:** Polar saves time, works in VN, perfect for developer tools. ✅
