-- Profile Completion Tracking Functions
-- These functions automatically calculate and update profile completion percentages

-- Function to calculate pharmacy profile completion percentage
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
    
    -- Contact information
    IF pharmacy_record.email IS NOT NULL AND pharmacy_record.email != '' THEN
        completion_points := completion_points + 10; -- Business email
    END IF;
    
    IF pharmacy_record.phone IS NOT NULL AND pharmacy_record.phone != '' THEN
        completion_points := completion_points + 10; -- Business phone
    END IF;
    
    IF pharmacy_record.addr IS NOT NULL AND pharmacy_record.addr != '' THEN
        completion_points := completion_points + 15; -- Business address
    END IF;
    
    -- Business details
    IF pharmacy_record.license_num IS NOT NULL AND pharmacy_record.license_num != '' THEN
        completion_points := completion_points + 15; -- Pharmacy license
    END IF;
    
    IF pharmacy_record.registration_number IS NOT NULL AND pharmacy_record.registration_number != '' THEN
        completion_points := completion_points + 10; -- Business registration
    END IF;
    
    -- Additional details (optional but boost completion)
    IF pharmacy_record.operating_hours IS NOT NULL AND pharmacy_record.operating_hours != '' THEN
        completion_points := completion_points + 5; -- Operating hours
    END IF;
    
    IF pharmacy_record.business_description IS NOT NULL AND pharmacy_record.business_description != '' THEN
        completion_points := completion_points + 5; -- Business description
    END IF;
    
    IF pharmacy_record.license_expiry IS NOT NULL THEN
        completion_points := completion_points + 5; -- License expiry
    END IF;
    
    IF pharmacy_record.specializations IS NOT NULL AND pharmacy_record.specializations != '' THEN
        completion_points := completion_points + 5; -- Specializations
    END IF;
    
    IF pharmacy_record.services_offered IS NOT NULL AND pharmacy_record.services_offered != '' THEN
        completion_points := completion_points + 5; -- Services offered
    END IF;
    
    -- Verification (major completion boost)
    IF pharmacy_record.verified = true THEN
        completion_points := completion_points + 25; -- Verification complete
    END IF;
    
    -- Ensure we don't exceed 100%
    IF completion_points > max_points THEN
        completion_points := max_points;
    END IF;
    
    RETURN completion_points;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate pharmacist profile completion percentage
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
    
    -- Basic information (always completed - 60%)
    completion_points := completion_points + 60;
    
    -- Personal contact information
    IF pharmacist_record.phone IS NOT NULL AND pharmacist_record.phone != '' THEN
        completion_points := completion_points + 10; -- Personal phone
    END IF;
    
    -- Professional credentials
    IF pharmacist_record.pharmacist_id_num IS NOT NULL AND pharmacist_record.pharmacist_id_num != '' THEN
        completion_points := completion_points + 30; -- Pharmacist ID (important)
    END IF;
    
    -- Ensure we don't exceed 100%
    IF completion_points > max_points THEN
        completion_points := max_points;
    END IF;
    
    RETURN completion_points;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completion flags
CREATE OR REPLACE FUNCTION update_profile_completion_flags(pharmacy_id uuid)
RETURNS void AS $$
DECLARE
    pharmacy_record RECORD;
    pharmacist_record RECORD;
    pharmacy_completion INTEGER;
    pharmacist_completion INTEGER;
    overall_completion INTEGER;
BEGIN
    -- Get pharmacy data
    SELECT * INTO pharmacy_record FROM pharmacies WHERE id = pharmacy_id;
    
    IF pharmacy_record IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate completion percentages
    pharmacy_completion := calculate_pharmacy_completion_percent(pharmacy_id);
    
    -- Update pharmacy completion flags
    UPDATE pharmacies SET
        profile_completion_percent = pharmacy_completion,
        has_business_email = CASE WHEN email IS NOT NULL AND email != '' THEN true ELSE false END,
        has_address = CASE WHEN addr IS NOT NULL AND addr != '' THEN true ELSE false END,
        has_license_num = CASE WHEN license_num IS NOT NULL AND license_num != '' THEN true ELSE false END,
        can_submit_for_verification = (pharmacy_completion >= 80),
        updated_at = NOW()
    WHERE id = pharmacy_id;
    
    -- Update all pharmacists for this pharmacy
    FOR pharmacist_record IN SELECT * FROM pharmacists WHERE pharmacy_id = pharmacy_id LOOP
        pharmacist_completion := calculate_pharmacist_completion_percent(pharmacist_record.id);
        
        UPDATE pharmacists SET
            profile_completion_percent = pharmacist_completion,
            has_phone = CASE WHEN phone IS NOT NULL AND phone != '' THEN true ELSE false END,
            has_pharmacist_id = CASE WHEN pharmacist_id_num IS NOT NULL AND pharmacist_id_num != '' THEN true ELSE false END,
            updated_at = NOW()
        WHERE id = pharmacist_record.id;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update completion when pharmacy data changes
CREATE OR REPLACE FUNCTION trigger_update_pharmacy_completion()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_profile_completion_flags(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update completion when pharmacist data changes
CREATE OR REPLACE FUNCTION trigger_update_pharmacist_completion()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_profile_completion_flags(NEW.pharmacy_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS auto_update_pharmacy_completion ON pharmacies;
CREATE TRIGGER auto_update_pharmacy_completion
    AFTER INSERT OR UPDATE ON pharmacies
    FOR EACH ROW EXECUTE FUNCTION trigger_update_pharmacy_completion();

DROP TRIGGER IF EXISTS auto_update_pharmacist_completion ON pharmacists;
CREATE TRIGGER auto_update_pharmacist_completion
    AFTER INSERT OR UPDATE ON pharmacists
    FOR EACH ROW EXECUTE FUNCTION trigger_update_pharmacist_completion();

-- Function to manually recalculate all profile completions (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_profile_completions()
RETURNS void AS $$
DECLARE
    pharmacy_record RECORD;
BEGIN
    FOR pharmacy_record IN SELECT id FROM pharmacies LOOP
        PERFORM update_profile_completion_flags(pharmacy_record.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Initialize completion percentages for existing records
SELECT recalculate_all_profile_completions();