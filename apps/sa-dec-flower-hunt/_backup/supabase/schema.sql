-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS table (extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FLOWERS table
create table public.flowers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  story text not null, -- The "Story" of the flower (meaning, origin, care tips)
  image_url text not null,
  qr_code_id text unique not null, -- The ID encoded in the QR code attached to the pot
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USER COLLECTIONS table (Digital Stamps)
create table public.user_collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  flower_id uuid references public.flowers(id) on delete cascade not null,
  collected_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, flower_id) -- Prevent duplicate collections of the same flower
);

-- RLS Policies (Basic setup)
alter table public.users enable row level security;
alter table public.flowers enable row level security;
alter table public.user_collections enable row level security;

-- Users can read their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Everyone can read flowers
create policy "Flowers are public" on public.flowers
  for select using (true);

-- Users can read their own collections
create policy "Users can view own collections" on public.user_collections
  for select using (auth.uid() = user_id);

-- Users can insert into their own collections
create policy "Users can collect flowers" on public.user_collections
  for insert with check (auth.uid() = user_id);
