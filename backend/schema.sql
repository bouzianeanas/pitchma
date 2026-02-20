-- ============================================
-- PITCH APP MOROCCO - DATABASE SCHEMA
-- Run this in your PostgreSQL database
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geo queries (optional but recommended)

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  preferred_language VARCHAR(5) DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar', 'en')),
  push_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OTP TABLE (for phone verification)
-- ============================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CITIES TABLE
-- ============================================
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
 name_fr VARCHAR(100) NOT NULL, region VARCHAR(100)
);

INSERT INTO cities (name_fr, region) VALUES
  ('Casablanca', 'Grand Casablanca'),
  ('Rabat', 'Rabat-Sale-Kenitra'),
  ('Marrakech', 'Marrakech-Safi'),
  ('Fes', 'Fes-Meknes'),
  ('Tanger', 'Tanger-Tetouan-Al Hoceima'),
  ('Agadir', 'Souss-Massa'),
  ('Oujda', 'Oriental'),
  ('Meknes', 'Fes-Meknes'),
  ('Kenitra', 'Rabat-Sale-Kenitra'),
  ('Tetouan', 'Tanger-Tetouan-Al Hoceima');
  ('Casablanca', 'الدار البيضاء', 'Grand Casablanca'),
  ('Rabat', 'الرباط', 'Rabat-Salé-Kénitra'),
  ('Marrakech', 'مراكش', 'Marrakech-Safi'),
  ('Fès', 'فاس', 'Fès-Meknès'),
  ('Tanger', 'طنجة', 'Tanger-Tétouan-Al Hoceïma'),
  ('Agadir', 'أكادير', 'Souss-Massa'),
  ('Oujda', 'وجدة', 'Oriental'),
  ('Meknès', 'مكناس', 'Fès-Meknès'),
  ('Kénitra', 'القنيطرة', 'Rabat-Salé-Kénitra'),
  ('Tétouan', 'تطوان', 'Tanger-Tétouan-Al Hoceïma');

-- ============================================
-- PITCHES TABLE
-- ============================================
CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id INTEGER REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  neighborhood VARCHAR(100),
  
  -- Pitch Details
  sport_types TEXT[] DEFAULT '{"football"}', -- football, basketball, tennis, padel
  surface_type VARCHAR(50) CHECK (surface_type IN ('natural_grass', 'artificial_turf', 'concrete', 'indoor')),
  pitch_size VARCHAR(20) CHECK (pitch_size IN ('5v5', '6v6', '7v7', '8v8', '11v11')),
  capacity INTEGER DEFAULT 10,
  
  -- Pricing
  price_per_hour DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'MAD',
  
  -- Amenities
  has_changing_rooms BOOLEAN DEFAULT false,
  has_showers BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_lighting BOOLEAN DEFAULT false,
  has_cafe BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false, -- Admin must approve
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Images
  cover_image TEXT,
  images TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AVAILABILITY SLOTS TABLE
-- ============================================
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_bookings INTEGER DEFAULT 1, -- Usually 1 (exclusive), more for open games
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'cancelled')),
  price_override DECIMAL(10, 2), -- Override pitch default price for this slot
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pitch_id, date, start_time)
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES availability_slots(id),
  pitch_id UUID NOT NULL REFERENCES pitches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Booking Details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  players_count INTEGER DEFAULT 1,
  
  -- Pricing
  total_price DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  manager_earnings DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(5) DEFAULT 'MAD',
  
  -- Payment
  payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'cmi', 'mobile_payment')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_reference TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('user', 'manager', 'admin', 'system')),
  cancellation_reason TEXT,
  
  -- Open game
  is_open_game BOOLEAN DEFAULT false,
  open_game_spots INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OPEN GAME PARTICIPANTS
-- ============================================
CREATE TABLE open_game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  share_price DECIMAL(10, 2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(booking_id, user_id)
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(booking_id, user_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50), -- booking_confirmed, booking_cancelled, new_booking, reminder
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MANAGER APPLICATIONS TABLE
-- ============================================
CREATE TABLE manager_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  business_name VARCHAR(255) NOT NULL,
  cin_number VARCHAR(20),
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_pitches_location ON pitches(latitude, longitude);
CREATE INDEX idx_pitches_city ON pitches(city_id);
CREATE INDEX idx_pitches_manager ON pitches(manager_id);
CREATE INDEX idx_slots_pitch_date ON availability_slots(pitch_id, date);
CREATE INDEX idx_slots_status ON availability_slots(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_pitch ON bookings(pitch_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pitches_updated_at BEFORE UPDATE ON pitches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update pitch rating when review added
CREATE OR REPLACE FUNCTION update_pitch_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pitches SET
    average_rating = (SELECT AVG(rating) FROM reviews WHERE pitch_id = NEW.pitch_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE pitch_id = NEW.pitch_id)
  WHERE id = NEW.pitch_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pitch_rating();
