# PayOS Environment Variables Setup

Add these to your `.env.local` file:

```bash
# PayOS Configuration (Get from https://payos.vn)
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to get credentials:
1. Sign up at https://payos.vn/dang-ky
2. Wait 24-48h for approval
3. Go to Dashboard → API Keys
4. Copy credentials

## Why PayOS?
- ✅ 2 days approval (vs VNPay 2 weeks)
- ✅ 1.5% fees (vs VNPay 3%)
- ✅ Simpler API
- ✅ Better developer experience
