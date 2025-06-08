-- =====================================================
-- TABLE ALREADY EXISTS - LET'S CHECK AND FIX
-- =====================================================

-- 1. First, let's see what's in the table
SELECT * FROM admin_users;

-- 2. If empty, insert Dr. Mosab as AD0001
INSERT INTO admin_users (display_id, email, full_name, role) 
VALUES ('AD0001', 'dr.mosab@icloud.com', 'Dr. Mosab', 'super_admin')
ON CONFLICT (email) 
DO UPDATE SET 
    display_id = 'AD0001',
    full_name = 'Dr. Mosab',
    role = 'super_admin';

-- 3. Check the result
SELECT 
    display_id as "Admin ID",
    email as "Email",
    full_name as "Name",
    role as "Role"
FROM admin_users
WHERE email = 'dr.mosab@icloud.com';

-- 4. Link to existing auth if available
UPDATE admin_users
SET auth_id = (
    SELECT auth_id 
    FROM pharmacists 
    WHERE email = 'dr.mosab@icloud.com' 
    LIMIT 1
)
WHERE email = 'dr.mosab@icloud.com'
AND auth_id IS NULL;

-- 5. Final check
SELECT * FROM admin_users;