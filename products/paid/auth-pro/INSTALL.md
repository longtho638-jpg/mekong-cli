# Installation Guide

Follow these steps to set up Antigravity Auth PRO in your project.

## Prerequisites

- Node.js 18+
- A Supabase project (Free tier works fine)

## 1. Supabase Setup

1. Create a new project at [database.new](https://database.new).
2. Go to **Project Settings > API**.
3. Copy the `Project URL` and `anon public key`.

### Database Schema

Run the following SQL in your Supabase **SQL Editor** to set up the required tables for Organizations and MFA:

```sql
-- Enable RLS
alter table auth.users enable row level security;

-- Organizations Table
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organization Members
create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'admin', 'member', 'guest')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (organization_id, user_id)
);

-- RLS Policies
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Add policies here (see docs/RLS.md for full policies)
```

## 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. OAuth Configuration

Go to [Supabase Dashboard > Authentication > Providers](https://supabase.com/dashboard/project/_/auth/providers) and enable the providers you want to use (Google, GitHub, Discord).

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed instructions on getting Client IDs and Secrets.

## 4. Run the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see your application running.
