-- COMPLETE DIAGNOSTIC AND FIX

-- 1. Show all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%admin%';

-- 2. Show columns of admin_users
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'admin_users';

-- 3. Show current data
SELECT * FROM admin_users;

-- 4. Try simplest insert (email only)
INSERT INTO admin_users (email) VALUES ('dr.mosab@icloud.com') ON CONFLICT DO NOTHING;

-- 5. If that fails, check what's required
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND is_nullable = 'NO' 
AND column_default IS NULL;