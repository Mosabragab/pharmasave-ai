-- 🚀 PROGRESSIVE ACCESS SYSTEM
-- This file adds proper progressive access logic to allow educational content
-- and demo marketplace access before full verification
--
-- Access Levels:
-- 30%+: Educational content and business preview
-- 50%+: Demo marketplace (browse only)  
-- 70%+: Full marketplace (create listings, transactions)
-- 80%+: Verification submission

-- Add progressive access columns to pharmacies table
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_access_educational BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_access_demo_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS can_access_full_marketplace BOOLEAN DEFAULT FALSE;

-- Add progressive access columns to pharmacists table  
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_access_educational BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_access_demo_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS can_access_full_marketplace BOOLEAN DEFAULT FALSE;

-- Update the profile completion function to set progressive access flags
CREATE OR REPLACE FUNCTION update_profile_completion_flags_with_progressive_access(pharmacy_id uuid)
RETURNS void AS $$
DECLARE
    pharmacy_record RECORD;
    pharmacist_record RECORD;
    pharmacy_completion INTEGER;
    pharmacist_completion INTEGER;
    overall_completion INTEGER;
    can_educational BOOLEAN := false;
    can_demo_marketplace BOOLEAN := false;
    can_full_marketplace BOOLEAN := false;
    can_verification BOOLEAN := false;
BEGIN
    -- Get pharmacy data
    SELECT * INTO pharmacy_record FROM pharmacies WHERE id = pharmacy_id;
    
    IF pharmacy_record IS NULL THEN
        RETURN;
    END IF;
    
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
    
    -- PROGRESSIVE ACCESS LOGIC
    -- 30%+: Educational content and business preview
    can_educational := (overall_completion >= 30);
    
    -- 50%+: Demo marketplace access (browse only, no transactions)
    can_demo_marketplace := (overall_completion >= 50);
    
    -- 70%+: Full marketplace access (create listings, transactions)
    can_full_marketplace := (overall_completion >= 70);
    
    -- 80%+: Can submit for verification
    can_verification := (overall_completion >= 80);
    
    -- Update pharmacy with progressive access flags
    UPDATE pharmacies SET
        profile_completion_percent = pharmacy_completion,
        has_business_email = CASE WHEN email IS NOT NULL AND email != '' THEN true ELSE false END,
        has_address = CASE WHEN addr IS NOT NULL AND addr != '' THEN true ELSE false END,
        has_location = CASE WHEN location IS NOT NULL THEN true ELSE false END,
        has_license_num = CASE WHEN license_num IS NOT NULL AND license_num != '' THEN true ELSE false END,
        can_submit_for_verification = can_verification,
        can_access_educational = can_educational,
        can_access_demo_marketplace = can_demo_marketplace,
        can_access_full_marketplace = can_full_marketplace,
        marketplace_access = can_full_marketplace, -- Legacy column
        updated_at = NOW()
    WHERE id = pharmacy_id;
    
    -- Update all pharmacists for this pharmacy with progressive access
    FOR pharmacist_record IN SELECT * FROM pharmacists WHERE pharmacy_id = pharmacy_id LOOP
        pharmacist_completion := calculate_pharmacist_completion_percent(pharmacist_record.id);
        
        UPDATE pharmacists SET
            profile_completion_percent = pharmacist_completion,
            has_phone = CASE WHEN phone IS NOT NULL AND phone != '' THEN true ELSE false END,
            has_pharmacist_id = CASE WHEN pharmacist_id_num IS NOT NULL AND pharmacist_id_num != '' THEN true ELSE false END,
            can_access_educational = can_educational,
            can_access_demo_marketplace = can_demo_marketplace,
            can_access_full_marketplace = can_full_marketplace,
            can_create_listings = can_full_marketplace,
            can_approve_transactions = can_full_marketplace,
            updated_at = NOW()
        WHERE id = pharmacist_record.id;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Replace the main update function with the progressive access version
DROP FUNCTION IF EXISTS update_profile_completion_flags(uuid);
CREATE OR REPLACE FUNCTION update_profile_completion_flags(pharmacy_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM update_profile_completion_flags_with_progressive_access(pharmacy_id);
END;
$$ LANGUAGE plpgsql;

-- Create view for easy access level checking
CREATE OR REPLACE VIEW pharmacy_access_levels AS
SELECT 
    p.id as pharmacy_id,
    p.name as pharmacy_name,
    p.profile_completion_percent,
    ph.profile_completion_percent as primary_pharmacist_completion,
    ROUND((p.profile_completion_percent * 0.7) + (ph.profile_completion_percent * 0.3)) as overall_completion,
    p.can_access_educational,
    p.can_access_demo_marketplace, 
    p.can_access_full_marketplace,
    p.can_submit_for_verification,
    CASE 
        WHEN p.can_submit_for_verification THEN 'Can Submit for Verification'
        WHEN p.can_access_full_marketplace THEN 'Full Marketplace Access'
        WHEN p.can_access_demo_marketplace THEN 'Demo Marketplace Access'
        WHEN p.can_access_educational THEN 'Educational Content Access'
        ELSE 'Basic Access Only'
    END as access_level_description
FROM pharmacies p
LEFT JOIN pharmacists ph ON ph.pharmacy_id = p.id AND ph.is_primary = true;

-- Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_pharmacies_educational_access ON pharmacies (can_access_educational);
CREATE INDEX IF NOT EXISTS idx_pharmacies_demo_marketplace_access ON pharmacies (can_access_demo_marketplace);
CREATE INDEX IF NOT EXISTS idx_pharmacies_full_marketplace_access ON pharmacies (can_access_full_marketplace);

-- Apply the progressive access logic to all existing pharmacies
SELECT recalculate_all_profile_completions() as progressive_access_applied;