-- CHECK COLUMNS IN PHARMACY_DOCUMENTS TABLE
-- Run this to see what columns actually exist

-- 1. Check pharmacy_documents columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pharmacy_documents'
ORDER BY ordinal_position;

-- 2. Check vrfy_docs columns (verification documents)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vrfy_docs'
ORDER BY ordinal_position;

-- 3. Show sample data to understand structure
SELECT * FROM pharmacy_documents LIMIT 1;
SELECT * FROM vrfy_docs LIMIT 1;