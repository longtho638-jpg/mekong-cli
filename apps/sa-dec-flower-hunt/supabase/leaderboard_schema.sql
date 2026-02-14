-- Live Leaderboard Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or link to auth.users if needed
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  points INT DEFAULT 0,
  flowers_scanned INT DEFAULT 0,
  rank INT, -- Calculated or cached
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "leaderboard_select" ON leaderboard FOR SELECT USING (true);
-- INSERT/UPDATE disabled for public to prevent cheating. 
-- Points must be updated via secure RPC or Service Role.

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- Index for sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(points DESC);

-- Seed some initial data
INSERT INTO leaderboard (name, points, flowers_scanned, avatar_url) VALUES
('Nguyễn Văn A', 2500, 12, 'https://i.pravatar.cc/150?u=1'),
('Trần Thị B', 2350, 10, 'https://i.pravatar.cc/150?u=2'),
('Lê Hoàng C', 2100, 9, 'https://i.pravatar.cc/150?u=3'),
('Phạm Minh D', 1800, 8, 'https://i.pravatar.cc/150?u=4'),
('Hoàng Yến E', 1500, 6, 'https://i.pravatar.cc/150?u=5')
ON CONFLICT (user_id) DO NOTHING;
