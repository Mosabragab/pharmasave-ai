-- PharmaSave AI V2: Database Tables (SIMPLIFIED REGISTRATION MODEL)
-- Updated to support simplified 3-field registration with progressive profile completion

-- 1. System configuration table
CREATE TABLE sys_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pharmacies table (BUSINESS ENTITY - SIMPLIFIED REGISTRATION)
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_id TEXT UNIQUE, -- PHxxxx anonymized display ID (generated via trigger)
  
  -- REQUIRED FOR INITIAL REGISTRATION (3 fields only)
  name TEXT NOT NULL, -- Pharmacy business name (REQUIRED)
  
  -- OPTIONAL FOR INITIAL REGISTRATION (can be added later)
  license_num TEXT UNIQUE, -- Pharmacy license number (NULLABLE initially)
  email TEXT UNIQUE, -- Business email address (NULLABLE initially)
  phone TEXT, -- Business phone number
  addr TEXT, -- Physical address (NULLABLE initially)
  location GEOGRAPHY(POINT), -- Geographic coordinates (NULLABLE initially)
  
  -- Business settings (optional, filled later)
  business_hours JSONB DEFAULT '{}'::jsonb,
  radius_pref FLOAT NOT NULL DEFAULT 10.0,
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Account status and verification
  status pharmacy_status NOT NULL DEFAULT 'pending_verification',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  ver_status verification_status NOT NULL DEFAULT 'unverified',
  ver_notes TEXT,
  
  -- Profile completion tracking (NEW)
  profile_completion_percent INTEGER NOT NULL DEFAULT 15, -- Starts at 15% after registration
  can_submit_for_verification BOOLEAN NOT NULL DEFAULT FALSE, -- Can't verify until profile is complete
  profile_completed_at TIMESTAMPTZ,
  
  -- Required fields checklist (NEW)
  has_license_num BOOLEAN NOT NULL DEFAULT FALSE,
  has_business_email BOOLEAN NOT NULL DEFAULT FALSE,
  has_address BOOLEAN NOT NULL DEFAULT FALSE,
  has_location BOOLEAN NOT NULL DEFAULT FALSE,
  has_primary_pharmacist_id BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Subscription and trial management
  trial_started_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ,
  marketplace_access BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status TEXT NOT NULL DEFAULT 'profile_incomplete', -- New initial status
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Updated constraints for simplified registration
  CONSTRAINT verified_requires_complete_profile CHECK (
    NOT verified OR (
      ver_status = 'approved' AND 
      profile_completion_percent >= 100 AND
      can_submit_for_verification = TRUE
    )
  ),
  CONSTRAINT verification_requires_complete_profile CHECK (
    NOT (ver_status IN ('pending', 'approved')) OR can_submit_for_verification = TRUE
  )
);

-- (Additional tables continue...)
-- Note: This is a condensed version. Full schema available in original file.

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_pharmacies_profile_completion ON pharmacies (profile_completion_percent);
CREATE INDEX IF NOT EXISTS idx_pharmacies_can_submit_verification ON pharmacies (can_submit_for_verification);
CREATE INDEX IF NOT EXISTS idx_pharmacies_subscription_status ON pharmacies (subscription_status);