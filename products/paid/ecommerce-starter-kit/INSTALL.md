# Installation Guide

Follow these steps to get your E-commerce Starter Kit up and running.

## 1. Environment Setup

Ensure you have Node.js 18+ installed on your machine.

```bash
node -v
```

## 2. Project Setup

Navigate to the project directory and install dependencies:

```bash
cd ecommerce-starter-kit
npm install
```

## 3. Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Database Setup (Supabase)

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the SQL Editor.
3. Open `supabase/schema.sql` from this project.
4. Copy the contents and run it in the SQL Editor to create tables and policies.
5. Go to Project Settings -> API to find your URL, Anon Key, and Service Role Key.

### Seed Data (Optional)

You can manually insert some products into the `products` table via the Supabase Table Editor to see content on the homepage.

```sql
INSERT INTO products (name, description, price, images)
VALUES
('Classic T-Shirt', 'A comfortable cotton t-shirt.', 29.99, '{https://placehold.co/400}'),
('Premium Hoodie', 'Warm and stylish hoodie.', 59.99, '{https://placehold.co/400}');
```

## 5. Payment Setup (Stripe)

Refer to `STRIPE_SETUP.md` for detailed instructions on configuring Stripe.

## 6. Run the App

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see your store.
