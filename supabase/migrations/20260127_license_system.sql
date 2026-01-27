-- Create enum for license plan and status if not exists
DO $$ BEGIN
    CREATE TYPE public.license_plan AS ENUM ('solo', 'team', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.license_status AS ENUM ('active', 'expired', 'revoked', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL UNIQUE,
    tenant_id TEXT NOT NULL,
    plan public.license_plan NOT NULL DEFAULT 'solo',
    status public.license_status NOT NULL DEFAULT 'active',

    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_validated_at TIMESTAMPTZ,

    bound_domain TEXT,
    hardware_fingerprint TEXT,

    max_users INTEGER NOT NULL DEFAULT 1,
    max_agents INTEGER NOT NULL DEFAULT 3,
    max_activations INTEGER NOT NULL DEFAULT 3,

    features TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on license_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_tenant ON public.licenses(tenant_id);

-- Create license_activations table to track usage/seats
CREATE TABLE IF NOT EXISTS public.license_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,

    fingerprint TEXT NOT NULL, -- Hardware ID or unique instance ID
    hostname TEXT,
    ip_address TEXT,

    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB DEFAULT '{}'::jsonb,

    UNIQUE(license_id, fingerprint)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;

-- Grant access to service_role (backend)
GRANT ALL ON public.licenses TO service_role;
GRANT ALL ON public.license_activations TO service_role;
