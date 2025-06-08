-- 🗑️ ARCHIVE DELETION & MANAGEMENT SYSTEM
-- Complete solution for managing archived pharmacy data

-- 1. CHECK CURRENT ARCHIVED PHARMACIES
SELECT 
    '📋 CURRENT ARCHIVED PHARMACIES' as section,
    display_id,
    name,
    ver_status,
    archived_at,
    archive_reason,
    EXTRACT(days FROM (NOW() - archived_at)) as days_archived
FROM pharmacies 
WHERE ver_status = 'archived' 
   OR archived_at IS NOT NULL
ORDER BY archived_at DESC;

-- 2. SAFE ARCHIVE DELETION FUNCTION
-- This permanently removes archived pharmacies and all related data
CREATE OR REPLACE FUNCTION delete_archived_pharmacy(
    p_pharmacy_id UUID,
    p_confirm_deletion TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_pharmacy RECORD;
    v_result JSON;
    v_deleted_files INTEGER := 0;
    v_error_message TEXT;
BEGIN
    -- Safety check: require confirmation
    IF p_confirm_deletion != 'CONFIRM_DELETE_PERMANENTLY' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Confirmation required: pass CONFIRM_DELETE_PERMANENTLY as second parameter'
        );
    END IF;

    -- Get pharmacy details
    SELECT * INTO v_pharmacy 
    FROM pharmacies 
    WHERE id = p_pharmacy_id 
      AND (ver_status = 'archived' OR archived_at IS NOT NULL);
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Pharmacy not found or not archived'
        );
    END IF;

    -- Start deletion process
    BEGIN
        -- Delete verification queue entries
        DELETE FROM verification_queue WHERE pharmacy_id = p_pharmacy_id;
        
        -- Count and delete pharmacy documents
        SELECT COUNT(*) INTO v_deleted_files 
        FROM pharmacy_documents 
        WHERE pharmacy_id = p_pharmacy_id;
        
        DELETE FROM pharmacy_documents WHERE pharmacy_id = p_pharmacy_id;
        
        -- Delete pharmacist accounts
        DELETE FROM pharmacists WHERE pharmacy_id = p_pharmacy_id;
        
        -- Delete from archive table (if exists)
        DELETE FROM archived_pharmacies WHERE original_id = p_pharmacy_id;
        
        -- Finally delete the pharmacy
        DELETE FROM pharmacies WHERE id = p_pharmacy_id;
        
        -- Return success with details
        RETURN json_build_object(
            'success', true,
            'message', 'Archived pharmacy permanently deleted',
            'details', json_build_object(
                'pharmacy_name', v_pharmacy.name,
                'display_id', v_pharmacy.display_id,
                'archived_date', v_pharmacy.archived_at,
                'documents_deleted', v_deleted_files,
                'deletion_timestamp', NOW()
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        RETURN json_build_object(
            'success', false,
            'error', 'Deletion failed: ' || v_error_message
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. BULK ARCHIVE CLEANUP FUNCTION (DELETE OLD ARCHIVES)
CREATE OR REPLACE FUNCTION cleanup_old_archives(
    p_days_old INTEGER DEFAULT 365,
    p_confirm_cleanup TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
    v_deleted_pharmacies TEXT[];
BEGIN
    -- Safety check
    IF p_confirm_cleanup != 'CONFIRM_BULK_CLEANUP' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Confirmation required: pass CONFIRM_BULK_CLEANUP as second parameter'
        );
    END IF;

    -- Find old archived pharmacies
    SELECT array_agg(display_id), COUNT(*) 
    INTO v_deleted_pharmacies, v_count
    FROM pharmacies 
    WHERE (ver_status = 'archived' OR archived_at IS NOT NULL)
      AND archived_at < (NOW() - INTERVAL '1 day' * p_days_old);

    IF v_count = 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'No old archives found to delete',
            'deleted_count', 0
        );
    END IF;

    -- Delete old archives (this will cascade through the delete function)
    WITH old_archives AS (
        SELECT id, name, display_id, archived_at
        FROM pharmacies 
        WHERE (ver_status = 'archived' OR archived_at IS NOT NULL)
          AND archived_at < (NOW() - INTERVAL '1 day' * p_days_old)
    )
    DELETE FROM verification_queue 
    WHERE pharmacy_id IN (SELECT id FROM old_archives);
    
    DELETE FROM pharmacy_documents 
    WHERE pharmacy_id IN (
        SELECT id FROM pharmacies 
        WHERE (ver_status = 'archived' OR archived_at IS NOT NULL)
          AND archived_at < (NOW() - INTERVAL '1 day' * p_days_old)
    );
    
    DELETE FROM pharmacists 
    WHERE pharmacy_id IN (
        SELECT id FROM pharmacies 
        WHERE (ver_status = 'archived' OR archived_at IS NOT NULL)
          AND archived_at < (NOW() - INTERVAL '1 day' * p_days_old)
    );
    
    DELETE FROM archived_pharmacies 
    WHERE original_id IN (
        SELECT id FROM pharmacies 
        WHERE (ver_status = 'archived' OR archived_at IS NOT NULL)
          AND archived_at < (NOW() - INTERVAL '1 day' * p_days_old)
    );
    
    DELETE FROM pharmacies 
    WHERE (ver_status = 'archived' OR archived_at IS NOT NULL)
      AND archived_at < (NOW() - INTERVAL '1 day' * p_days_old);

    RETURN json_build_object(
        'success', true,
        'message', 'Old archives cleaned up successfully',
        'deleted_count', v_count,
        'deleted_pharmacies', v_deleted_pharmacies,
        'cutoff_date', (NOW() - INTERVAL '1 day' * p_days_old)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ARCHIVE STATISTICS FUNCTION
CREATE OR REPLACE FUNCTION get_archive_statistics()
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_archived', COUNT(*),
        'archived_this_month', COUNT(*) FILTER (WHERE archived_at >= date_trunc('month', NOW())),
        'archived_this_year', COUNT(*) FILTER (WHERE archived_at >= date_trunc('year', NOW())),
        'oldest_archive', MIN(archived_at),
        'newest_archive', MAX(archived_at),
        'archives_by_reason', json_object_agg(
            COALESCE(archive_reason, 'No reason specified'), 
            COUNT(*) FILTER (WHERE archive_reason IS NOT DISTINCT FROM archive_reason)
        )
    ) INTO v_stats
    FROM pharmacies 
    WHERE ver_status = 'archived' OR archived_at IS NOT NULL;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- 5. EXAMPLES OF USAGE

-- Example 1: Check what would be deleted (dry run)
SELECT 
    '🧪 DELETION PREVIEW' as section,
    display_id,
    name,
    archived_at,
    archive_reason,
    'Would be permanently deleted' as action
FROM pharmacies 
WHERE ver_status = 'archived' 
   OR archived_at IS NOT NULL
ORDER BY archived_at;

-- Example 2: Delete a specific archived pharmacy (REPLACE pharmacy_id_here)
-- SELECT delete_archived_pharmacy('pharmacy_id_here', 'CONFIRM_DELETE_PERMANENTLY');

-- Example 3: Clean up archives older than 1 year
-- SELECT cleanup_old_archives(365, 'CONFIRM_BULK_CLEANUP');

-- Example 4: Get archive statistics
SELECT get_archive_statistics() as archive_stats;

-- 6. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION delete_archived_pharmacy(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_archives(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_archive_statistics() TO authenticated;

-- 7. RECOMMENDED DATA RETENTION POLICIES

/*
📋 RECOMMENDED ARCHIVE RETENTION POLICIES:

🟢 KEEP FOREVER (Legal/Business Requirements):
- Pharmacies with active legal disputes
- Pharmacies with significant transaction history
- Regulatory compliance records

🟡 KEEP 3-7 YEARS (Business Analytics):
- Pharmacies with market insights value
- Performance benchmarking data
- Fraud prevention data

🔴 DELETE AFTER 1-2 YEARS (Storage Optimization):
- Test pharmacies that were never live
- Duplicate/spam registrations
- Incomplete registrations with no business value

💡 SUGGESTED DELETION SCHEDULE:
- Monthly: Delete test/spam archives older than 30 days
- Quarterly: Delete failed registrations older than 6 months  
- Annually: Delete inactive archives older than 2 years
*/

-- 8. STORAGE CLEANUP HELPER
-- Note: File storage cleanup must be done from frontend/backend code
-- This query shows which files should be cleaned up
SELECT 
    '📁 STORAGE CLEANUP NEEDED' as section,
    pd.file_path,
    pd.file_name,
    p.display_id,
    p.archived_at,
    'File should be deleted from storage' as action
FROM pharmacy_documents pd
JOIN pharmacies p ON p.id = pd.pharmacy_id
WHERE p.ver_status = 'archived' 
   OR p.archived_at IS NOT NULL
ORDER BY p.archived_at;