-- Phase 4: Phygital Ecosystem Database Schema
-- Tourism, Events, Check-ins, Badges

-- ============================================
-- 1. FARMER GARDENS (Map Locations)
-- ============================================

CREATE TABLE IF NOT EXISTS farmer_gardens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  photos TEXT[], -- Array of image URLs
  open_hours TEXT DEFAULT '8:00 - 17:00',
  visit_price INT DEFAULT 0, -- Entrance fee in VND (0 = free)
  specialties TEXT[], -- ['roses', 'orchids', etc]
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_gardens_location ON farmer_gardens USING GIST (
  ll_to_earth(latitude::float, longitude::float)
);
CREATE INDEX IF NOT EXISTS idx_farmer_gardens_farmer_id ON farmer_gardens(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_gardens_verified ON farmer_gardens(verified);

-- ============================================
-- 2. LANDMARKS (Tourist Attractions)
-- ============================================

CREATE TABLE IF NOT EXISTS landmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  category TEXT DEFAULT 'attraction', -- attraction, temple, market, monument
  photos TEXT[],
  qr_code TEXT UNIQUE, -- For check-ins
  badge_icon TEXT, -- URL to badge icon
  points INT DEFAULT 10, -- Points awarded for check-in
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landmarks_qr_code ON landmarks(qr_code);
CREATE INDEX IF NOT EXISTS idx_landmarks_category ON landmarks(category);

-- ============================================
-- 3. GARDEN VISITS (Track Tourism)
-- ============================================

CREATE TABLE IF NOT EXISTS garden_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garden_id UUID NOT NULL REFERENCES farmer_gardens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_url TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_garden_visits_garden_id ON garden_visits(garden_id);
CREATE INDEX IF NOT EXISTS idx_garden_visits_user_id ON garden_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_visits_visited_at ON garden_visits(visited_at DESC);

-- ============================================
-- 4. CHECK-INS & BADGES
-- ============================================

CREATE TABLE IF NOT EXISTS user_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landmark_id UUID NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_url TEXT,
  shared BOOLEAN DEFAULT false,
  UNIQUE(landmark_id, user_id) -- One check-in per user per landmark
);

CREATE INDEX IF NOT EXISTS idx_user_check_ins_user_id ON user_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_check_ins_landmark_id ON user_check_ins(landmark_id);

-- Badge types: explorer, adventurer, legend, festival_goer
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- ============================================
-- 5. EVENTS & TICKETING
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  event_type TEXT DEFAULT 'festival', -- festival, workshop, tour
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ticket_price INT DEFAULT 0, -- VND
  max_tickets INT,
  tickets_sold INT DEFAULT 0,
  cover_image TEXT,
  gallery TEXT[],
  status TEXT DEFAULT 'upcoming', -- upcoming, ongoing, ended, cancelled
  organizer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (tickets_sold <= max_tickets)
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  total_paid INT NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, refunded
  payment_method TEXT DEFAULT 'payos',
  qr_code TEXT UNIQUE, -- For entry verification
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_buyer_id ON ticket_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_qr_code ON ticket_purchases(qr_code);

-- ============================================
-- 6. USER STATS (Tourism Gamification)
-- ============================================

-- Add tourism fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'total_check_ins'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_check_ins INT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'tourist_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tourist_points INT DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Award badge based on check-in count
CREATE OR REPLACE FUNCTION award_check_in_badge(p_user_id UUID, p_check_in_count INT)
RETURNS VOID AS $$
BEGIN
  -- Explorer (1st check-in)
  IF p_check_in_count = 1 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, description)
    VALUES (p_user_id, 'explorer', 'Explorer 🧭', 'First check-in at a landmark')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  
  -- Adventurer (5 check-ins)
  ELSIF p_check_in_count = 5 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, description)
    VALUES (p_user_id, 'adventurer', 'Adventurer 🗺️', 'Visited 5 landmarks')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  
  -- Legend (10 check-ins = all locations)
  ELSIF p_check_in_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, description)
    VALUES (p_user_id, 'legend', 'Sa Dec Legend 🏆', 'Explored all major landmarks!')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update user stats on check-in
CREATE OR REPLACE FUNCTION update_user_tourism_stats()
RETURNS TRIGGER AS $$
DECLARE
  check_in_count INT;
  landmark_points INT;
BEGIN
  -- Get landmark points
  SELECT points INTO landmark_points
  FROM landmarks
  WHERE id = NEW.landmark_id;
  
  -- Update user stats
  UPDATE profiles
  SET total_check_ins = total_check_ins + 1,
      tourist_points = tourist_points + COALESCE(landmark_points, 10)
  WHERE id = NEW.user_id;
  
  -- Get updated check-in count
  SELECT COUNT(*) INTO check_in_count
  FROM user_check_ins
  WHERE user_id = NEW.user_id;
  
  -- Award badges
  PERFORM award_check_in_badge(NEW.user_id, check_in_count);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tourism_stats ON user_check_ins;
CREATE TRIGGER trigger_update_tourism_stats
AFTER INSERT ON user_check_ins
FOR EACH ROW
EXECUTE FUNCTION update_user_tourism_stats();

-- ============================================
-- 8. SEED DATA (Sample Landmarks)
-- ============================================

-- Insert famous Sa Dec landmarks
INSERT INTO landmarks (name, name_en, description, latitude, longitude, address, category, qr_code, points) VALUES
('Chợ Hoa Sa Đéc', 'Sa Dec Flower Market', 'Famous flower market in the heart of Sa Dec', 10.2988, 105.7562, 'Nguyễn Huệ, Sa Đéc', 'market', 'LANDMARK_MARKET', 15),
('Nhà Cổ Huỳnh Thủy Lê', 'Huynh Thuy Le Ancient House', 'Historic house featured in "The Lover" novel', 10.2977, 105.7575, '255A Nguyễn Huệ, Sa Đéc', 'monument', 'LANDMARK_ANCIENT_HOUSE', 20),
('Kiến An Cung', 'Kien An Cung Temple', 'Beautiful Chinese temple with stunning architecture', 10.2955, 105.7601, 'Trần Hưng Đạo, Sa Đéc', 'temple', 'LANDMARK_TEMPLE', 15)
ON CONFLICT (qr_code) DO NOTHING;

-- ============================================
-- DONE
-- ============================================

COMMENT ON TABLE farmer_gardens IS 'Physical garden locations for tourism map';
COMMENT ON TABLE landmarks IS 'Tourist attractions with check-in QR codes';
COMMENT ON TABLE user_check_ins IS 'Track tourist check-ins for gamification';
COMMENT ON TABLE user_badges IS 'Tourism achievement badges';
COMMENT ON TABLE events IS 'Festival events and workshops';
COMMENT ON TABLE ticket_purchases IS 'Event ticket sales';
