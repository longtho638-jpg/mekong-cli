# E-commerce Starter Kit

A production-ready, full-stack e-commerce solution built with Next.js 14, Supabase, Stripe, and Tailwind CSS.

## Features

- 🛍️ **Complete Storefront**: Product listing, details, and shopping cart.
- 💳 **Stripe Integration**: Secure checkout with Stripe Checkout sessions and webhook handling.
- 🗄️ **Supabase Database**: Robust PostgreSQL database with Row Level Security (RLS).
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components.
- 📱 **Responsive Design**: Mobile-first approach.
- 👨‍💼 **Admin Dashboard**: View orders and sales stats.
- ⚡ **High Performance**: Built on Next.js 14 App Router.

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account
- Stripe Account

### Installation

1. Clone the repository (or extract the zip):
   ```bash
   git clone <repo-url>
   cd ecommerce-starter-kit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Setup Supabase:
   - Go to your Supabase project SQL Editor.
   - Run the contents of `supabase/schema.sql`.

5. Setup Stripe:
   - Get your API keys from the Stripe Dashboard.
   - Configure a webhook endpoint pointing to `your-domain/api/webhooks` (or use Stripe CLI for local development).
   - Select `checkout.session.completed` event.

6. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: React components (UI, layout, features).
- `src/lib`: Utility functions and clients (Stripe, Supabase).
- `src/types`: TypeScript definitions.
- `supabase`: Database schema and migrations.

## License

MIT
