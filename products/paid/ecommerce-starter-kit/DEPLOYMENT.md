# E-commerce Starter Kit - Deployment Guide

## Deploying to Vercel

The easiest way to deploy your Next.js application is with Vercel.

1. **Push to GitHub**:
   Ensure your code is pushed to a GitHub repository.

2. **Import Project in Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click "Add New..." -> "Project".
   - Select your GitHub repository.

3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `.` (default)

4. **Environment Variables**:
   Add the following variables in the "Environment Variables" section:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (Get this from Stripe Dashboard -> Webhooks)
   - `NEXT_PUBLIC_SITE_URL` (e.g., `https://your-project.vercel.app`)

5. **Deploy**:
   Click "Deploy". Vercel will build and deploy your site.

## Post-Deployment

1. **Update Stripe Webhooks**:
   - Go to Stripe Dashboard -> Webhooks.
   - Add your new Vercel URL endpoint: `https://your-project.vercel.app/api/webhooks`.
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel if it changed.

2. **Supabase Auth Redirects**:
   - Go to Supabase -> Authentication -> URL Configuration.
   - Add your Vercel URL to "Site URL" and "Redirect URLs".

## Troubleshooting

- **Build Errors**: Check Build Logs in Vercel. Common issues include missing types or linting errors.
- **500 Errors on Checkout**: Check Vercel Function Logs. Ensure Stripe keys are correct.
- **Images not loading**: If using external images (like placeholder.co), add the domain to `next.config.js` images config.

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'your-supabase-url.supabase.co'],
  },
};

module.exports = nextConfig;
```
