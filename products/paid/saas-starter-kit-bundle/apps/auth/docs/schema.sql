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

-- User Sessions (for Session Management)
-- We'll track this manually via middleware/hooks since accessing auth.sessions is restricted
create table public.user_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    session_id text not null, -- Store the access token hash or a unique identifier
    user_agent text,
    ip_address text,
    last_active timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(session_id)
);

-- RLS Policies

-- Organizations
create policy "Users can view organizations they belong to"
  on public.organizations for select
  using (
    auth.uid() in (
      select user_id from public.organization_members
      where organization_id = id
    )
  );

create policy "Users can create organizations"
  on public.organizations for insert
  with check ( true ); -- Anyone can create, logic handled in app to link owner

-- Organization Members
create policy "Users can view members of their organizations"
  on public.organization_members for select
  using (
    auth.uid() in (
      select user_id from public.organization_members
      where organization_id = organization_id
    )
  );

-- User Sessions
create policy "Users can view their own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.user_sessions for delete
  using (auth.uid() = user_id);

-- Functions
create or replace function public.handle_new_organization()
returns trigger as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-add creator as owner
create trigger on_organization_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_organization();
