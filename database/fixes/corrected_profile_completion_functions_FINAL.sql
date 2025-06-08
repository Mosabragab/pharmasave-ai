-- 🚨 CORRECTED Profile Completion Functions (WITH PROPER BUSINESS LOGIC)
-- This file fixes the schema mismatch AND implements correct business access logic
-- 
-- CORRECTED ACCESS LEVELS:
-- 30%+: Educational content
-- 50%+: Demo marketplace (browse only)
-- 70%+: Real marketplace viewing (NO transactions)
-- 80%+: Verification submission  
-- VERIFIED: Full transactions (trade, purchase, create listings)

-- Function to calculate pharmacy profile completion percentage (CORRECTED)
CREATE OR REPLACE FUNCTION calculate_pharmacy_completion_percent(pharmacy_id uuid)
RETURNS INTEGER AS $$
DECLARE
    completion_points INTEGER := 0;
    max_points INTEGER := 100;
    pharmacy_record RECORD;
BEGIN
    -- Get pharmacy data
    SELECT * INTO pharmacy_record FROM pharmacies WHERE id = pharmacy_id;
    
    IF pharmacy_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Basic information (always 15% - completed during registration)
    completion_points := completion_points + 15;
    
    -- Contact information (USING ACTUAL COLUMNS)
    IF pharmacy_record.email IS NOT NULL AND pharmacy_record.email != '' THEN
        completion_points := completion_points + 20; -- Business email (critical)
    END IF;
    
    IF pharmacy_record.phone IS NOT NULL AND pharmacy_record.phone != '' THEN
        completion_points := completion_points + 15; -- Business phone
    END IF;
    
    IF pharmacy_record.addr IS NOT NULL AND pharmacy_record.addr != '' THEN
        completion_points := completion_points + 20; -- Business address (critical)
    END IF;
    
    IF pharmacy_record.location IS NOT NULL THEN
        completion_points := completion_points + 10; -- Geographic coordinates
    END IF;
    
    -- Business details (USING ACTUAL COLUMNS)
    IF pharmacy_record.license_num IS NOT NULL AND pharmacy_record.license_num != '' THEN
        completion_points := completion_points + 20; -- Pharmacy license (critical)
    END IF;
    
    -- Ensure we don't exceed 75% before verification
    IF completion_points > 75 THEN
        completion_points := 75;
    END IF;
    
    -- Verification bonus (major completion boost)
    IF pharmacy_record.verified = true THEN
        completion_points := 100; -- Perfect completion when verified
    END IF;
    
    RETURN completion_points;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate pharmacist profile completion percentage (CORRECTED)
CREATE OR REPLACE FUNCTION calculate_pharmacist_completion_percent(pharmacist_id uuid)
RETURNS INTEGER AS $$
DECLARE
    completion_points INTEGER := 0;
    max_points INTEGER := 100;
    pharmacist_record RECORD;
BEGIN
    -- Get pharmacist data
    SELECT * INTO pharmacist_record FROM pharmacists WHERE id = pharmacist_id;
    
    IF pharmacist_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Basic information (always completed during registration - 60%)
    completion_points := completion_points + 60;
    
    -- Personal contact information (USING ACTUAL COLUMNS)
    IF pharmacist_record.phone IS NOT NULL AND pharmacist_record.phone != '' THEN
        completion_points := completion_points + 15; -- Personal phone
    END IF;
    
    -- Professional credentials (USING ACTUAL COLUMNS)
    IF pharmacist_record.pharmacist_id_num IS NOT NULL AND pharmacist_record.pharmacist_id_num != '' THEN
        completion_points := completion_points + 25; -- Pharmacist ID (very important)
    END IF;
    
    RETURN completion_points;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completion flags (CORRECTED WITH PROPER BUSINESS LOGIC)
CREATE OR REPLACE FUNCTION update_profile_completion_flags(pharmacy_id uuid)
RETURNS void AS $$
DECLARE
    pharmacy_record RECORD;
    pharmacist_record RECORD;
    pharmacy_completion INTEGER;
    pharmacist_completion INTEGER;
    overall_completion INTEGER;
    is_verified BOOLEAN := false;
    can_access_educational BOOLEAN := false;
    can_access_demo_marketplace BOOLEAN := false;
    can_browse_marketplace BOOLEAN := false;
    can_submit_verification BOOLEAN := false;
    -- VERIFIED ONLY PERMISSIONS
    can_create_listings BOOLEAN := false;
    can_make_transactions BOOLEAN := false;
BEGIN
    -- Get pharmacy data
    SELECT * INTO pharmacy_record FROM pharmacies WHERE id = pharmacy_id;
    
    IF pharmacy_record IS NULL THEN
        RETURN;
    END IF;
    
    -- Check verification status
    is_verified := (pharmacy_record.verified = true);
    
    -- Calculate completion percentages using CORRECTED functions
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
    
    -- Calculate overall completion (weighted average)
    overall_completion := ROUND((pharmacy_completion * 0.7) + (pharmacist_completion * 0.3));
    
    -- CORRECTED PROGRESSIVE ACCESS LOGIC
    -- 30%+: Educational content
    can_access_educational := (overall_completion >= 30);
    
    -- 50%+: Demo marketplace access (browse demo content only)
    can_access_demo_marketplace := (overall_completion >= 50);
    
    -- 70%+: Real marketplace browsing (view real listings, NO transactions)
    can_browse_marketplace := (overall_completion >= 70);
    
    -- 80%+: Can submit for verification
    can_submit_verification := (overall_completion >= 80);
    
    -- ✅ VERIFIED ONLY: Full transaction capabilities
    can_create_listings := is_verified;
    can_make_transactions := is_verified;
    
    -- Update pharmacy completion flags (USING ACTUAL COLUMNS)
    UPDATE pharmacies SET
        profile_completion_percent = pharmacy_completion,
        has_business_email = CASE WHEN email IS NOT NULL AND email != '' THEN true ELSE false END,
        has_address = CASE WHEN addr IS NOT NULL AND addr != '' THEN true ELSE false END,
        has_location = CASE WHEN location IS NOT NULL THEN true ELSE false END,
        has_license_num = CASE WHEN license_num IS NOT NULL AND license_num != '' THEN true ELSE false END,
        can_submit_for_verification = can_submit_verification,
        marketplace_access = can_make_transactions, -- Legacy column - only true when verified
        updated_at = NOW()
    WHERE id = pharmacy_id;
    
    -- Update all pharmacists for this pharmacy
    FOR pharmacist_record IN SELECT * FROM pharmacists WHERE pharmacy_id = pharmacy_id LOOP
        pharmacist_completion := calculate_pharmacist_completion_percent(pharmacist_record.id);
        
        UPDATE pharmacists SET
            profile_completion_percent = pharmacist_completion,
            has_phone = CASE WHEN phone IS NOT NULL AND phone != '' THEN true ELSE false END,
            has_pharmacist_id = CASE WHEN pharmacist_id_num IS NOT NULL AND pharmacist_id_num != '' THEN true ELSE false END,
            -- CORRECTED BUSINESS LOGIC: Only verified pharmacies can transact
            can_create_listings = can_create_listings,
            can_approve_transactions = can_make_transactions,
            updated_at = NOW()
        WHERE id = pharmacist_record.id;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update completion when pharmacy data changes (ENHANCED)
CREATE OR REPLACE FUNCTION trigger_update_pharmacy_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Force recalculation on any change
    PERFORM update_profile_completion_flags(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update completion when pharmacist data changes (ENHANCED)
CREATE OR REPLACE FUNCTION trigger_update_pharmacist_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Force recalculation on any change
    PERFORM update_profile_completion_flags(NEW.pharmacy_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers to ensure they work properly
DROP TRIGGER IF EXISTS auto_update_pharmacy_completion ON pharmacies;
CREATE TRIGGER auto_update_pharmacy_completion
    AFTER INSERT OR UPDATE ON pharmacies
    FOR EACH ROW EXECUTE FUNCTION trigger_update_pharmacy_completion();

DROP TRIGGER IF EXISTS auto_update_pharmacist_completion ON pharmacists;
CREATE TRIGGER auto_update_pharmacist_completion
    AFTER INSERT OR UPDATE ON pharmacists
    FOR EACH ROW EXECUTE FUNCTION trigger_update_pharmacist_completion();

-- Function to manually recalculate all profile completions (ENHANCED)
CREATE OR REPLACE FUNCTION recalculate_all_profile_completions()
RETURNS TEXT AS $$
DECLARE
    pharmacy_record RECORD;
    total_pharmacies INTEGER := 0;
    updated_pharmacies INTEGER := 0;
BEGIN
    -- Count total pharmacies
    SELECT COUNT(*) INTO total_pharmacies FROM pharmacies;
    
    -- Update each pharmacy
    FOR pharmacy_record IN SELECT id FROM pharmacies LOOP
        BEGIN
            PERFORM update_profile_completion_flags(pharmacy_record.id);
            updated_pharmacies := updated_pharmacies + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but continue
                RAISE NOTICE 'Error updating pharmacy %: %', pharmacy_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN 'Updated ' || updated_pharmacies || ' out of ' || total_pharmacies || ' pharmacies';
END;
$$ LANGUAGE plpgsql;

-- NEW: Function to get progressive access status for a pharmacy (CORRECTED LOGIC)
CREATE OR REPLACE FUNCTION get_pharmacy_access_status(pharmacy_id uuid)
RETURNS TABLE(
    overall_completion INTEGER,
    is_verified BOOLEAN,
    can_access_educational BOOLEAN,
    can_access_demo_marketplace BOOLEAN,
    can_browse_marketplace BOOLEAN,
    can_submit_verification BOOLEAN,
    can_create_listings BOOLEAN,
    can_make_transactions BOOLEAN,
    next_milestone TEXT,
    next_milestone_percent INTEGER
) AS $$
DECLARE
    pharmacy_completion INTEGER;
    pharmacist_completion INTEGER;
    overall_percent INTEGER;
    pharmacy_verified BOOLEAN;
    pharmacist_record RECORD;
BEGIN
    -- Get pharmacy verification status
    SELECT verified INTO pharmacy_verified FROM pharmacies WHERE id = pharmacy_id;
    
    -- Calculate current completions
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
    
    -- Calculate overall
    overall_percent := ROUND((pharmacy_completion * 0.7) + (pharmacist_completion * 0.3));
    
    -- Determine access levels and next milestone
    overall_completion := overall_percent;
    is_verified := pharmacy_verified;
    can_access_educational := (overall_percent >= 30);
    can_access_demo_marketplace := (overall_percent >= 50);
    can_browse_marketplace := (overall_percent >= 70);
    can_submit_verification := (overall_percent >= 80);
    
    -- VERIFIED ONLY PERMISSIONS
    can_create_listings := pharmacy_verified;
    can_make_transactions := pharmacy_verified;
    
    -- Determine next milestone
    IF NOT pharmacy_verified THEN
        IF overall_percent < 30 THEN
            next_milestone := 'Educational Content Access';
            next_milestone_percent := 30;
        ELSIF overall_percent < 50 THEN
            next_milestone := 'Demo Marketplace Access';
            next_milestone_percent := 50;
        ELSIF overall_percent < 70 THEN
            next_milestone := 'Marketplace Browsing';
            next_milestone_percent := 70;
        ELSIF overall_percent < 80 THEN
            next_milestone := 'Verification Submission';
            next_milestone_percent := 80;
        ELSE
            next_milestone := 'Submit for Verification';
            next_milestone_percent := 100;
        END IF;
    ELSE
        next_milestone := 'All Features Unlocked';
        next_milestone_percent := 100;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 🚀 EMERGENCY FIX: Recalculate all existing profiles immediately
SELECT recalculate_all_profile_completions() as fix_result;