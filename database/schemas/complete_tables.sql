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

-- 3. Pharmacists table (EMPLOYEES WITH AUTHENTICATION - SIMPLIFIED)
CREATE TABLE pharmacists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL, -- Reference to Supabase Auth
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  
  -- REQUIRED FOR INITIAL REGISTRATION
  fname TEXT NOT NULL, -- First name (REQUIRED)
  lname TEXT NOT NULL, -- Last name (REQUIRED)
  email TEXT UNIQUE NOT NULL, -- Personal email (REQUIRED for auth)
  
  -- OPTIONAL FOR INITIAL REGISTRATION (can be added later)
  phone TEXT, -- Personal phone (NULLABLE initially)
  pharmacist_id_num TEXT UNIQUE, -- Professional ID (NULLABLE initially)
  
  -- Employment details (Owner-First Model)
  role user_role NOT NULL DEFAULT 'primary_admin', -- Default to primary_admin for registrant
  permissions JSONB DEFAULT '{}'::jsonb,
  status employee_status NOT NULL DEFAULT 'active',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  
  -- Account access and security (Owner-First Model)
  is_primary BOOLEAN NOT NULL DEFAULT TRUE, -- Registrant is automatically primary
  can_manage_employees BOOLEAN NOT NULL DEFAULT TRUE, -- Primary admin can manage
  can_access_financials BOOLEAN NOT NULL DEFAULT TRUE,
  can_create_listings BOOLEAN NOT NULL DEFAULT FALSE, -- Disabled until profile complete
  can_approve_transactions BOOLEAN NOT NULL DEFAULT FALSE, -- Disabled until profile complete
  
  -- Profile completion tracking (NEW)
  profile_completion_percent INTEGER NOT NULL DEFAULT 60, -- Starts at 60% after registration
  profile_completed_at TIMESTAMPTZ,
  
  -- Required fields checklist (NEW)
  has_phone BOOLEAN NOT NULL DEFAULT FALSE,
  has_pharmacist_id BOOLEAN NOT NULL DEFAULT FALSE,
  
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Updated constraints for simplified registration
  CONSTRAINT termination_after_hire CHECK (termination_date IS NULL OR termination_date >= hire_date),
  CONSTRAINT one_primary_per_pharmacy UNIQUE NULLS NOT LAST (pharmacy_id) WHERE (is_primary = TRUE),
  CONSTRAINT primary_can_manage CHECK (NOT is_primary OR can_manage_employees = TRUE),
  CONSTRAINT marketplace_access_requires_profile CHECK (
    NOT (can_create_listings = TRUE OR can_approve_transactions = TRUE) OR 
    (pharmacist_id_num IS NOT NULL AND phone IS NOT NULL)
  )
);

-- [Additional tables continue with full implementation...]
-- Note: See full file for complete table definitions

-- Initialize system configuration for simplified registration
INSERT INTO sys_config (key, value, description) VALUES 
('default_search_radius', '10'::jsonb, 'Default search radius in km for nearby pharmacies'),
('platform_fee_percent', '6'::jsonb, 'Platform fee percentage (6% total, 3% from each party)'),
('min_expiration_days', '45'::jsonb, 'Minimum days before expiration for listing acceptance'),
('trial_period_days', '60'::jsonb, 'Free trial period in days for new pharmacies'),
('listing_auto_removal_days', '45'::jsonb, 'Days before expiration when listings are automatically removed'),
('max_search_radius', '50'::jsonb, 'Maximum allowed search radius in km'),
('min_profile_completion_for_verification', '80'::jsonb, 'Minimum profile completion percentage required for verification submission'),
('min_profile_completion_for_marketplace', '70'::jsonb, 'Minimum profile completion percentage required for marketplace access'),
('profile_completion_steps', '[
  {"step": "license_num", "category": "pharmacy_info", "weight": 20, "required": true},
  {"step": "business_email", "category": "pharmacy_info", "weight": 10, "required": true},
  {"step": "address", "category": "pharmacy_info", "weight": 15, "required": true},
  {"step": "location", "category": "pharmacy_info", "weight": 10, "required": true},
  {"step": "pharmacist_id_num", "category": "pharmacist_info", "weight": 25, "required": true},
  {"step": "pharmacist_phone", "category": "pharmacist_info", "weight": 10, "required": false},
  {"step": "verification_docs", "category": "verification", "weight": 10, "required": false}
]'::jsonb, 'Profile completion steps configuration');