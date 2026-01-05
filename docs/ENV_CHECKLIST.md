# 🔐 AgencyOS - Environment Variables Checklist

> Complete this checklist to configure production deployment

---

## ✅ Required (Core Functionality)

### Supabase (Database)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://[project-ref].supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...` (public key)
- [ ] `SUPABASE_SERVICE_KEY` = `eyJ...` (service role key - KEEP SECRET)

### Stripe (Global Payments)
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (or `sk_test_...` for dev)
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] `STRIPE_PRO_PRICE_ID` = `price_...` (create in Stripe Dashboard)
- [ ] `STRIPE_ENTERPRISE_PRICE_ID` = `price_...`

---

## 🌏 SEA Payment Gateways (Regional)

### PayOS (Vietnam 🇻🇳)
- [ ] `PAYOS_CLIENT_ID` = Get from https://my.payos.vn/
- [ ] `PAYOS_API_KEY` = From PayOS dashboard
- [ ] `PAYOS_CHECKSUM_KEY` = For signature validation

### Omise (Thailand 🇹🇭)
- [ ] `OMISE_PUBLIC_KEY` = `pkey_...`
- [ ] `OMISE_SECRET_KEY` = `skey_...`

### Xendit (Indonesia 🇮🇩 / Philippines 🇵🇭)
- [ ] `XENDIT_SECRET_KEY` = `xnd_...`
- [ ] `XENDIT_CALLBACK_TOKEN` = For webhook validation

---

## 📊 Analytics (Optional but Recommended)

- [ ] `NEXT_PUBLIC_GA_ID` = `G-XXXXXXXXXX` (Google Analytics)
- [ ] `NEXT_PUBLIC_MIXPANEL_TOKEN` = For product analytics

---

## 📧 Email (For Team Invitations)

- [ ] `RESEND_API_KEY` = `re_...` (or other email provider)
- [ ] `EMAIL_FROM` = `AgencyOS <noreply@agencyos.network>`

---

## 🔒 Security

- [ ] `ENCRYPTION_KEY` = 32-byte random string
- [ ] `JWT_SECRET` = Random string for JWT signing

---

## 🌐 App Configuration

- [ ] `NEXT_PUBLIC_APP_URL` = `https://agencyos.network`
- [ ] `NEXT_PUBLIC_APP_NAME` = `AgencyOS`

---

## 📋 Quick Copy Template

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# PayOS (Vietnam)
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

# Omise (Thailand)
OMISE_PUBLIC_KEY=
OMISE_SECRET_KEY=

# Xendit (ID/PH)
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=

# Analytics
NEXT_PUBLIC_GA_ID=

# Email
RESEND_API_KEY=
EMAIL_FROM=AgencyOS <noreply@agencyos.network>

# Security
ENCRYPTION_KEY=
JWT_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://agencyos.network
NEXT_PUBLIC_APP_NAME=AgencyOS
```

---

## 🚀 Vercel Setup Steps

1. Go to https://vercel.com/[team]/[project]/settings/environment-variables
2. Add each variable above for **Production** environment
3. Redeploy after adding all variables
4. Test each integration after deployment

---

*Generated: 2026-01-05*
