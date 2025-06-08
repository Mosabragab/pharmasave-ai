-- PharmaSave AI V2: Complete Database Setup
-- Run this script in Supabase SQL Editor to create the entire database

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Pharmacy status (for business entities)
DROP TYPE IF EXISTS pharmacy_status CASCADE;
CREATE TYPE pharmacy_status AS ENUM (
  'pending_verification',
  'verified',
  'suspended',
  'deactivated'
);

-- User roles (Owner-First Model with role hierarchy)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'admin',
  'primary_admin',
  'co_admin', 
  'staff_pharmacist',
  'support'
);

-- Employee status (for pharmacists)
DROP TYPE IF EXISTS employee_status CASCADE;
CREATE TYPE employee_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'terminated'
);

-- Verification status
DROP TYPE IF EXISTS verification_status CASCADE;
CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- Medicine forms
DROP TYPE IF EXISTS medicine_form CASCADE;
CREATE TYPE medicine_form AS ENUM (
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'cream',
  'ointment',
  'drops',
  'inhaler',
  'patch',
  'suppository',
  'other'
);

-- System configuration table
DROP TABLE IF EXISTS sys_config CASCADE;
CREATE TABLE sys_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pharmacies table (BUSINESS ENTITY)
DROP TABLE IF EXISTS pharmacies CASCADE;
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_id TEXT UNIQUE,
  name TEXT NOT NULL,
  license_num TEXT UNIQUE,
  email TEXT UNIQUE,
  phone TEXT,
  addr TEXT,
  status pharmacy_status NOT NULL DEFAULT 'pending_verification',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  ver_status verification_status NOT NULL DEFAULT 'unverified',
  profile_completion_percent INTEGER NOT NULL DEFAULT 15,
  can_submit_for_verification BOOLEAN NOT NULL DEFAULT FALSE,
  has_license_num BOOLEAN NOT NULL DEFAULT FALSE,
  has_business_email BOOLEAN NOT NULL DEFAULT FALSE,
  has_address BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_access BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status TEXT NOT NULL DEFAULT 'profile_incomplete',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pharmacists table (EMPLOYEES)
DROP TABLE IF EXISTS pharmacists CASCADE;
CREATE TABLE pharmacists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  fname TEXT NOT NULL,
  lname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  pharmacist_id_num TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'primary_admin',
  status employee_status NOT NULL DEFAULT 'active',
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_employees BOOLEAN NOT NULL DEFAULT TRUE,
  profile_completion_percent INTEGER NOT NULL DEFAULT 60,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallet table
DROP TABLE IF EXISTS wlt CASCADE;
CREATE TABLE wlt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  balance FLOAT NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Medications table
DROP TABLE IF EXISTS meds CASCADE;
CREATE TABLE meds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  generic_name TEXT,
  form medicine_form NOT NULL,
  strength TEXT,
  manufacturer TEXT,
  category TEXT,
  prescription BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies (status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_verified ON pharmacies (verified);
CREATE INDEX IF NOT EXISTS idx_pharmacists_auth_id ON pharmacists (auth_id);
CREATE INDEX IF NOT EXISTS idx_pharmacists_pharmacy_id ON pharmacists (pharmacy_id);

-- Enable Row Level Security
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wlt ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "pharmacists_own_data" ON pharmacists
  FOR ALL USING (auth_id = auth.uid());

CREATE POLICY "pharmacies_employee_access" ON pharmacies
  FOR ALL USING (
    id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "wallet_pharmacy_access" ON wlt
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid()
    )
  );

-- Function to generate pharmacy display ID
CREATE OR REPLACE FUNCTION generate_pharmacy_display_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    new_id := 'PH' || LPAD(counter::TEXT, 4, '0');
    
    WHILE EXISTS (SELECT 1 FROM pharmacies WHERE display_id = new_id) LOOP
        counter := counter + 1;
        new_id := 'PH' || LPAD(counter::TEXT, 4, '0');
    END LOOP;
    
    NEW.display_id := new_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for display ID
CREATE TRIGGER trigger_generate_pharmacy_display_id
    BEFORE INSERT ON pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION generate_pharmacy_display_id();

-- Function to create wallet
CREATE OR REPLACE FUNCTION create_pharmacy_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wlt (pharmacy_id, balance)
    VALUES (NEW.id, 0.0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for wallet creation
CREATE TRIGGER trigger_create_pharmacy_wallet
    AFTER INSERT ON pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION create_pharmacy_wallet();

-- Initialize system configuration
INSERT INTO sys_config (key, value, description) VALUES 
('default_search_radius', '10'::jsonb, 'Default search radius in km'),
('platform_fee_percent', '6'::jsonb, 'Platform fee percentage'),
('trial_period_days', '60'::jsonb, 'Free trial period in days')
ON CONFLICT (key) DO NOTHING;

-- Add sample medications
INSERT INTO meds (name, generic_name, form, strength, manufacturer, category, prescription) VALUES
('Panadol', 'Paracetamol', 'tablet', '500mg', 'GSK', 'Pain Relief', false),
('Augmentin', 'Amoxicillin/Clavulanate', 'tablet', '625mg', 'GSK', 'Antibiotic', true),
('Ventolin', 'Salbutamol', 'inhaler', '100mcg', 'GSK', 'Respiratory', true),
('Brufen', 'Ibuprofen', 'tablet', '400mg', 'Abbott', 'Pain Relief', false),
('Concor', 'Bisoprolol', 'tablet', '5mg', 'Merck', 'Cardiovascular', true)
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Database setup completed successfully!' as status, COUNT(*) as pharmacy_count FROM pharmacies;
SELECT 'Sample medications loaded:' as info, COUNT(*) as medication_count FROM meds;
