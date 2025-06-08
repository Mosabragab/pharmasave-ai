-- 🎯 MINIMAL SURGICAL FIX: Just the pharmacist license field
-- One line change to fix "Not provided" issue

-- Check current view definition first
SELECT 'Current pharmacist_license values:' as check;
SELECT display_id, pharmacist_license FROM admin_pharmacy_verification_view WHERE display_id IN ('PH0001', 'PH0003');

-- If it's still NULL, the issue is the join. Quick fix:
UPDATE admin_pharmacy_verification_view SET pharmacist_license = ph.pharmacist_id_num 
FROM pharmacists ph, pharmacies p
WHERE admin_pharmacy_verification_view.pharmacy_id = p.id 
AND ph.pharmacy_id = p.id 
AND ph.is_primary = true;