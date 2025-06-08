-- 🚀 CORRECTED PROGRESSIVE ACCESS SYSTEM
-- This file adds proper progressive access logic with CORRECT business rules
--
-- CORRECTED Access Levels:
-- 30%+: Educational content
-- 50%+: Demo marketplace (browse demo content only)
-- 70%+: Real marketplace browsing (view real listings, NO transactions)
-- 80%+: Verification submission
-- ✅ VERIFIED: Full transactions (create listings, trade, purchase)

-- Add progressive access columns to pharmacies table
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_access_educational BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_access_demo_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_browse_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_create_listings BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_make_transactions BOOLEAN DEFAULT FALSE;

-- Add progressive access columns to pharmacists table  
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_access_educational BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_access_demo_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_browse_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_make_transactions BOOLEAN DEFAULT FALSE;

-- Update the profile completion function to set CORRECTED progressive access flags
CREATE OR REPLACE FUNCTION update_profile_completion_flags_with_corrected_progressive_access(pharmacy_id uuid)
RETURNS void AS $$
DECLARE
    pharmacy_record RECORD;
    pharmacist_record RECORD;
    pharmacy_completion INTEGER;
    pharmacist_completion INTEGER;
    overall_completion INTEGER;
    is_verified BOOLEAN := false;
    can_educational BOOLEAN := false;
    can_demo_marketplace BOOLEAN := false;
    can_browse_marketplace BOOLEAN := false;
    can_verification BOOLEAN := false;
    -- VERIFIED ONLY PERMISSIONS
    can_create_listings BOOLEAN := false;
    can_transactions BOOLEAN := false;
BEGIN
    -- Get pharmacy data
    SELECT * INTO pharmacy_record FROM pharmacies WHERE id = pharmacy_id;
    
    IF pharmacy_record IS NULL THEN
        RETURN;
    END IF;
    
    -- Check verification status FIRST
    is_verified := (pharmacy_record.verified = true);
    
    -- Calculate completion percentages
    pharmacy_completion := calculate_pharmacy_completion_percent(pharmacy_id);
    
    -- Get primary pharmacist completion
    SELECT * INTO pharmacist_record 
    FROM pharmacists 
    WHERE pharmacy_id = pharmacy_id AND is_primary = true 
    LIMIT 1;
    
    IF pharmacist_record IS NOT NULL THEN
        pharmacist_completion := calculate_pharmacist_completion_percent(pharmacist_record.id);
    ELSE
        pharmacist_completion := 0;
    END IF;
    
    -- Calculate overall completion
    overall_completion := ROUND((pharmacy_completion * 0.7) + (pharmacist_completion * 0.3));
    
    -- CORRECTED PROGRESSIVE ACCESS LOGIC
    -- 30%+: Educational content
    can_educational := (overall_completion >= 30);
    
    -- 50%+: Demo marketplace access (browse demo content only)
    can_demo_marketplace := (overall_completion >= 50);
    
    -- 70%+: Real marketplace browsing (view real listings, NO transactions)
    can_browse_marketplace := (overall_completion >= 70);
    
    -- 80%+: Can submit for verification
    can_verification := (overall_completion >= 80);
    
    -- ✅ VERIFIED ONLY: Transaction capabilities
    can_create_listings := is_verified;
    can_transactions := is_verified;
    
    -- Update pharmacy with CORRECTED progressive access flags
    UPDATE pharmacies SET
        profile_completion_percent = pharmacy_completion,
        has_business_email = CASE WHEN email IS NOT NULL AND email != '' THEN true ELSE false END,
        has_address = CASE WHEN addr IS NOT NULL AND addr != '' THEN true ELSE false END,
        has_location = CASE WHEN location IS NOT NULL THEN true ELSE false END,
        has_license_num = CASE WHEN license_num IS NOT NULL AND license_num != '' THEN true ELSE false END,
        can_submit_for_verification = can_verification,
        can_access_educational = can_educational,
        can_access_demo_marketplace = can_demo_marketplace,
        can_browse_marketplace = can_browse_marketplace,
        can_create_listings = can_create_listings,
        can_make_transactions = can_transactions,
        marketplace_access = can_transactions, -- Legacy column - only true when verified
        updated_at = NOW()
    WHERE id = pharmacy_id;
    
    -- Update all pharmacists for this pharmacy with CORRECTED progressive access
    FOR pharmacist_record IN SELECT * FROM pharmacists WHERE pharmacy_id = pharmacy_id LOOP
        pharmacist_completion := calculate_pharmacist_completion_percent(pharmacist_record.id);
        
        UPDATE pharmacists SET
            profile_completion_percent = pharmacist_completion,
            has_phone = CASE WHEN phone IS NOT NULL AND phone != '' THEN true ELSE false END,
            has_pharmacist_id = CASE WHEN pharmacist_id_num IS NOT NULL AND pharmacist_id_num != '' THEN true ELSE false END,
            can_access_educational = can_educational,
            can_access_demo_marketplace = can_demo_marketplace,
            can_browse_marketplace = can_browse_marketplace,
            -- CORRECTED: Only verified pharmacies can create/transact
            can_create_listings = can_create_listings,
            can_approve_transactions = can_transactions,
            can_make_transactions = can_transactions,
            updated_at = NOW()
        WHERE id = pharmacist_record.id;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Replace the main update function with the CORRECTED progressive access version
DROP FUNCTION IF EXISTS update_profile_completion_flags(uuid);
CREATE OR REPLACE FUNCTION update_profile_completion_flags(pharmacy_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM update_profile_completion_flags_with_corrected_progressive_access(pharmacy_id);
END;
$$ LANGUAGE plpgsql;

-- Create CORRECTED view for easy access level checking
CREATE OR REPLACE VIEW pharmacy_access_levels AS
SELECT 
    p.id as pharmacy_id,
    p.name as pharmacy_name,
    p.verified as is_verified,
    p.profile_completion_percent,
    ph.profile_completion_percent as primary_pharmacist_completion,
    ROUND((p.profile_completion_percent * 0.7) + (ph.profile_completion_percent * 0.3)) as overall_completion,
    p.can_access_educational,
    p.can_access_demo_marketplace,
    p.can_browse_marketplace,
    p.can_submit_for_verification,
    p.can_create_listings,
    p.can_make_transactions,
    CASE 
        WHEN p.verified THEN 'VERIFIED - Full Access'
        WHEN p.can_submit_for_verification THEN 'Can Submit for Verification'
        WHEN p.can_browse_marketplace THEN 'Marketplace Browsing Only'
        WHEN p.can_access_demo_marketplace THEN 'Demo Marketplace Access'
        WHEN p.can_access_educational THEN 'Educational Content Access'
        ELSE 'Basic Access Only'
    END as access_level_description,
    CASE 
        WHEN p.verified THEN 'All transactions enabled'
        WHEN NOT p.can_submit_for_verification THEN 'Complete profile to submit for verification'
        ELSE 'Submit for verification to enable transactions'
    END as next_action
FROM pharmacies p
LEFT JOIN pharmacists ph ON ph.pharmacy_id = p.id AND ph.is_primary = true;

-- Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_pharmacies_verified ON pharmacies (verified);
CREATE INDEX IF NOT EXISTS idx_pharmacies_educational_access ON pharmacies (can_access_educational);
CREATE INDEX IF NOT EXISTS idx_pharmacies_demo_marketplace_access ON pharmacies (can_access_demo_marketplace);
CREATE INDEX IF NOT EXISTS idx_pharmacies_browse_marketplace ON pharmacies (can_browse_marketplace);
CREATE INDEX IF NOT EXISTS idx_pharmacies_create_listings ON pharmacies (can_create_listings);
CREATE INDEX IF NOT EXISTS idx_pharmacies_make_transactions ON pharmacies (can_make_transactions);

-- Apply the CORRECTED progressive access logic to all existing pharmacies
SELECT recalculate_all_profile_completions() as corrected_progressive_access_applied;