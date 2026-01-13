# Vercel Deployment Guide

## Quick Deploy

```bash
cd mekong-landing
vercel --prod
```

## Configuration

Create `vercel.json` (optional):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

## Environment Variables (Vercel Dashboard)

Add these in Vercel project settings:

```
# Stripe (for checkout)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

## Custom Domain Setup

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `mekong-marketing.cc`
3. Update DNS records (provided by Vercel):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## Post-Deployment Checklist

- [ ] Test all pages (/, /checkout, /docs)
- [ ] Verify mobile responsiveness
- [ ] Check Lighthouse scores
- [ ] Set up Google Analytics
- [ ] Enable HTTPS (auto by Vercel)
- [ ] Test Stripe checkout flow

## Rollback (if needed)

```bash
vercel rollback
```
