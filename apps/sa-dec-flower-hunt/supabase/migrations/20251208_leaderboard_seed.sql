-- Migration: Leaderboard Seed Data for Festival Demo
-- Created: 2025-12-08
-- Purpose: Populate leaderboard with 10 demo entries for testing

-- First, ensure leaderboard table exists with correct schema
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text UNIQUE NOT NULL,
    name text NOT NULL,
    points integer DEFAULT 0,
    flowers_scanned integer DEFAULT 0,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies if not exist
DO $$
BEGIN
    -- Public read access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Public read access') THEN
        CREATE POLICY "Public read access" ON public.leaderboard FOR SELECT TO public USING (true);
    END IF;

    -- Users can insert their own entries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Users insert own entry') THEN
        CREATE POLICY "Users insert own entry" ON public.leaderboard FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    -- Users can update their own entries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Users update own entry') THEN
        CREATE POLICY "Users update own entry" ON public.leaderboard FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;

-- Insert 10 demo leaderboard entries with Vietnamese names
INSERT INTO public.leaderboard (user_id, name, points, flowers_scanned, avatar_url) VALUES
    ('demo_001', 'Nguyễn Văn Hùng', 2850, 12, 'https://i.pravatar.cc/150?u=demo_001'),
    ('demo_002', 'Trần Thị Mai', 2420, 10, 'https://i.pravatar.cc/150?u=demo_002'),
    ('demo_003', 'Lê Hoàng Anh', 2100, 9, 'https://i.pravatar.cc/150?u=demo_003'),
    ('demo_004', 'Phạm Minh Tuấn', 1890, 8, 'https://i.pravatar.cc/150?u=demo_004'),
    ('demo_005', 'Võ Thị Hương', 1650, 7, 'https://i.pravatar.cc/150?u=demo_005'),
    ('demo_006', 'Đặng Quốc Bảo', 1420, 6, 'https://i.pravatar.cc/150?u=demo_006'),
    ('demo_007', 'Huỳnh Thanh Tâm', 1180, 5, 'https://i.pravatar.cc/150?u=demo_007'),
    ('demo_008', 'Ngô Văn Phúc', 950, 4, 'https://i.pravatar.cc/150?u=demo_008'),
    ('demo_009', 'Bùi Thị Lan', 720, 3, 'https://i.pravatar.cc/150?u=demo_009'),
    ('demo_010', 'Hoàng Kim Long', 500, 2, 'https://i.pravatar.cc/150?u=demo_010')
ON CONFLICT (user_id) DO UPDATE SET
    points = EXCLUDED.points,
    flowers_scanned = EXCLUDED.flowers_scanned,
    updated_at = now();

-- Grant permissions
GRANT ALL ON public.leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard TO anon;
