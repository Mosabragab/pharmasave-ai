-- PharmaSave AI V2: Verification Workflow Automation Functions
-- These functions automate the admin verification process and ensure consistency

-- Function to process verification decision with full workflow
CREATE OR REPLACE FUNCTION process_verification_decision(
    p_pharmacy_id UUID,
    p_admin_id UUID,
    p_decision TEXT, -- 'approve', 'reject', 'request_more_info'
    p_admin_notes TEXT DEFAULT NULL,
    p_document_decisions JSONB DEFAULT NULL -- {document_id: 'approved'|'rejected'}
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    pharmacy_status TEXT,
    trial_activated BOOLEAN
) AS $$
DECLARE
    v_pharmacy_record RECORD;
    v_queue_record RECORD;
    v_document_record RECORD;
    v_trial_activated BOOLEAN := FALSE;
    v_new_status TEXT;
    v_is_verified BOOLEAN := FALSE;
    v_doc_decision TEXT;
BEGIN
    -- Validate inputs
    IF p_decision NOT IN ('approve', 'reject', 'request_more_info') THEN
        RETURN QUERY SELECT FALSE, 'Invalid decision type', NULL::TEXT, FALSE;
        RETURN;
    END IF;

    -- Get pharmacy details
    SELECT * INTO v_pharmacy_record FROM pharmacies WHERE id = p_pharmacy_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Pharmacy not found', NULL::TEXT, FALSE;
        RETURN;
    END IF;

    -- Get verification queue entry
    SELECT * INTO v_queue_record 
    FROM verification_queue 
    WHERE pharmacy_id = p_pharmacy_id 
    AND status IN ('pending', 'in_review')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Process document decisions if provided
    IF p_document_decisions IS NOT NULL THEN
        FOR v_document_record IN 
            SELECT * FROM pharmacy_documents WHERE pharmacy_id = p_pharmacy_id
        LOOP
            -- Get decision for this document
            v_doc_decision := p_document_decisions->>v_document_record.id::TEXT;
            
            IF v_doc_decision IS NOT NULL THEN
                UPDATE pharmacy_documents 
                SET 
                    status = CASE 
                        WHEN v_doc_decision = 'approved' THEN 'verified'
                        WHEN v_doc_decision = 'rejected' THEN 'rejected'
                        ELSE status 
                    END,
                    verified_at = CASE 
                        WHEN v_doc_decision IN ('approved', 'rejected') THEN NOW()
                        ELSE verified_at 
                    END,
                    verified_by = CASE 
                        WHEN v_doc_decision IN ('approved', 'rejected') THEN p_admin_id::TEXT
                        ELSE verified_by 
                    END,
                    notes = COALESCE(p_admin_notes, notes),
                    updated_at = NOW()
                WHERE id = v_document_record.id;
            END IF;
        END LOOP;
    END IF;

    -- Determine new pharmacy status
    CASE p_decision
        WHEN 'approve' THEN
            v_new_status := 'approved';
            v_is_verified := TRUE;
            v_trial_activated := TRUE;
        WHEN 'reject' THEN
            v_new_status := 'rejected';
            v_is_verified := FALSE;
        WHEN 'request_more_info' THEN
            v_new_status := 'pending';
            v_is_verified := FALSE;
    END CASE;

    -- Update pharmacy status
    UPDATE pharmacies 
    SET 
        ver_status = v_new_status,
        verified = v_is_verified,
        verified_at = CASE WHEN v_is_verified THEN NOW() ELSE verified_at END,
        ver_notes = COALESCE(p_admin_notes, ver_notes),
        marketplace_access = v_is_verified,
        trial_started_at = CASE WHEN v_trial_activated THEN NOW() ELSE trial_started_at END,
        trial_expires_at = CASE WHEN v_trial_activated THEN NOW() + INTERVAL '60 days' ELSE trial_expires_at END,
        subscription_status = CASE WHEN v_trial_activated THEN 'trial_active' ELSE subscription_status END,
        updated_at = NOW()
    WHERE id = p_pharmacy_id;

    -- Update verification queue
    IF v_queue_record.id IS NOT NULL THEN
        UPDATE verification_queue 
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE id = v_queue_record.id;

        -- Update admin workload
        UPDATE admin_users 
        SET 
            current_workload = GREATEST(current_workload - 1, 0),
            total_verifications_completed = total_verifications_completed + 1,
            updated_at = NOW()
        WHERE id = p_admin_id;
    END IF;

    -- Log verification activity
    INSERT INTO verification_activities (
        pharmacy_id,
        admin_id,
        activity_type,
        previous_status,
        new_status,
        notes,
        time_spent_minutes,
        created_at
    ) VALUES (
        p_pharmacy_id,
        p_admin_id,
        CASE p_decision
            WHEN 'approve' THEN 'completed'
            WHEN 'reject' THEN 'rejected'
            ELSE 'status_changed'
        END,
        v_pharmacy_record.ver_status,
        v_new_status,
        p_admin_notes,
        30, -- Default 30 minutes - could be tracked more precisely
        NOW()
    );

    -- Create notification for pharmacy
    INSERT INTO notifications (
        pharmacy_id,
        pharmacist_id,
        type,
        title,
        message,
        status,
        reference_id,
        reference_type,
        created_at
    )
    SELECT 
        p_pharmacy_id,
        ph.id,
        'account',
        CASE p_decision
            WHEN 'approve' THEN 'Pharmacy Verification Approved! 🎉'
            WHEN 'reject' THEN 'Verification Update Required'
            ELSE 'Additional Information Requested'
        END,
        CASE p_decision
            WHEN 'approve' THEN 'Congratulations! Your pharmacy has been successfully verified. Your 60-day free trial has started, and you now have full access to the marketplace.'
            WHEN 'reject' THEN 'Your verification request requires attention. Please review the admin notes and resubmit your documents.'
            ELSE 'Our verification team needs additional information. Please check the admin notes and provide the requested documents.'
        END,
        'unread',
        p_pharmacy_id,
        'verification',
        NOW()
    FROM pharmacists ph
    WHERE ph.pharmacy_id = p_pharmacy_id;

    -- Return success result
    RETURN QUERY SELECT 
        TRUE as success,
        CASE p_decision
            WHEN 'approve' THEN 'Pharmacy approved successfully and trial activated'
            WHEN 'reject' THEN 'Pharmacy verification rejected'
            ELSE 'Additional information requested from pharmacy'
        END as message,
        v_new_status as pharmacy_status,
        v_trial_activated as trial_activated;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return failure
        INSERT INTO verification_activities (
            pharmacy_id,
            admin_id,
            activity_type,
            notes,
            created_at
        ) VALUES (
            p_pharmacy_id,
            p_admin_id,
            'error',
            'Error processing verification: ' || SQLERRM,
            NOW()
        );
        
        RETURN QUERY SELECT FALSE, 'Error processing verification: ' || SQLERRM, NULL::TEXT, FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin verification workload and statistics
CREATE OR REPLACE FUNCTION get_admin_verification_stats(p_admin_id UUID DEFAULT NULL)
RETURNS TABLE(
    admin_id UUID,
    admin_name TEXT,
    current_workload INTEGER,
    pending_verifications INTEGER,
    completed_today INTEGER,
    completed_this_week INTEGER,
    average_processing_time_hours DECIMAL,
    approval_rate DECIMAL,
    overdue_assignments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id as admin_id,
        au.name as admin_name,
        au.current_workload,
        COUNT(CASE WHEN vq.status IN ('pending', 'in_review') THEN 1 END)::INTEGER as pending_verifications,
        COUNT(CASE WHEN va.created_at::DATE = CURRENT_DATE AND va.activity_type = 'completed' THEN 1 END)::INTEGER as completed_today,
        COUNT(CASE WHEN va.created_at >= DATE_TRUNC('week', CURRENT_DATE) AND va.activity_type = 'completed' THEN 1 END)::INTEGER as completed_this_week,
        COALESCE(au.average_processing_time_hours, 24.0) as average_processing_time_hours,
        COALESCE(
            (COUNT(CASE WHEN va.activity_type = 'completed' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN va.activity_type IN ('completed', 'rejected') THEN 1 END), 0)) * 100,
            0
        ) as approval_rate,
        COUNT(CASE WHEN vq.due_date < NOW() AND vq.status IN ('pending', 'in_review') THEN 1 END)::INTEGER as overdue_assignments
    FROM admin_users au
    LEFT JOIN verification_queue vq ON vq.assigned_to = au.id
    LEFT JOIN verification_activities va ON va.admin_id = au.id
    WHERE (p_admin_id IS NULL OR au.id = p_admin_id)
    AND au.is_active = TRUE
    GROUP BY au.id, au.name, au.current_workload, au.average_processing_time_hours
    ORDER BY au.name;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically assign overdue verifications
CREATE OR REPLACE FUNCTION reassign_overdue_verifications()
RETURNS TABLE(
    reassigned_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_overdue_record RECORD;
    v_new_admin_id UUID;
    v_reassigned_count INTEGER := 0;
BEGIN
    -- Find overdue verifications (more than 48 hours)
    FOR v_overdue_record IN 
        SELECT vq.*, au.name as admin_name
        FROM verification_queue vq
        LEFT JOIN admin_users au ON au.id = vq.assigned_to
        WHERE vq.due_date < NOW() - INTERVAL '2 hours' -- 2 hour grace period
        AND vq.status IN ('pending', 'in_review')
    LOOP
        -- Find new admin with lowest workload
        SELECT id INTO v_new_admin_id
        FROM admin_users
        WHERE is_active = TRUE
        AND role IN ('verification_specialist', 'super_admin')
        AND current_workload < max_daily_verifications
        AND id != v_overdue_record.assigned_to -- Don't reassign to same admin
        ORDER BY current_workload ASC, total_verifications_completed ASC
        LIMIT 1;

        IF v_new_admin_id IS NOT NULL THEN
            -- Reassign the verification
            UPDATE verification_queue
            SET 
                assigned_to = v_new_admin_id,
                assigned_at = NOW(),
                due_date = NOW() + INTERVAL '24 hours', -- Give 24 hours for urgent reassignment
                priority = GREATEST(priority - 1, 1), -- Increase priority
                updated_at = NOW()
            WHERE id = v_overdue_record.id;

            -- Update workload counters
            UPDATE admin_users SET current_workload = current_workload - 1 WHERE id = v_overdue_record.assigned_to;
            UPDATE admin_users SET current_workload = current_workload + 1 WHERE id = v_new_admin_id;

            -- Log the reassignment
            INSERT INTO verification_activities (
                pharmacy_id,
                admin_id,
                activity_type,
                notes,
                created_at
            ) VALUES (
                v_overdue_record.pharmacy_id,
                v_new_admin_id,
                'escalated',
                'Reassigned from ' || v_overdue_record.admin_name || ' due to overdue status',
                NOW()
            );

            v_reassigned_count := v_reassigned_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT 
        v_reassigned_count as reassigned_count,
        CASE 
            WHEN v_reassigned_count = 0 THEN 'No overdue verifications found'
            ELSE 'Reassigned ' || v_reassigned_count || ' overdue verification(s)'
        END as message;
END;
$$ LANGUAGE plpgsql;

-- Function to get verification queue with filtering and sorting
CREATE OR REPLACE FUNCTION get_verification_queue(
    p_admin_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_priority INTEGER DEFAULT NULL,
    p_assigned_to_me BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    queue_id UUID,
    pharmacy_id UUID,
    pharmacy_name TEXT,
    pharmacy_display_id TEXT,
    priority INTEGER,
    status TEXT,
    assigned_to UUID,
    assigned_admin_name TEXT,
    created_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    days_pending INTEGER,
    documents_count INTEGER,
    is_overdue BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vq.id as queue_id,
        p.id as pharmacy_id,
        p.name as pharmacy_name,
        p.display_id as pharmacy_display_id,
        vq.priority,
        vq.status,
        vq.assigned_to,
        au.name as assigned_admin_name,
        vq.created_at,
        vq.due_date,
        EXTRACT(DAY FROM NOW() - vq.created_at)::INTEGER as days_pending,
        COUNT(pd.id)::INTEGER as documents_count,
        (vq.due_date < NOW()) as is_overdue
    FROM verification_queue vq
    JOIN pharmacies p ON p.id = vq.pharmacy_id
    LEFT JOIN admin_users au ON au.id = vq.assigned_to
    LEFT JOIN pharmacy_documents pd ON pd.pharmacy_id = p.id
    WHERE (p_status IS NULL OR vq.status = p_status)
    AND (p_priority IS NULL OR vq.priority = p_priority)
    AND (p_assigned_to_me = FALSE OR vq.assigned_to = p_admin_id)
    GROUP BY vq.id, p.id, p.name, p.display_id, vq.priority, vq.status, 
             vq.assigned_to, au.name, vq.created_at, vq.due_date
    ORDER BY 
        CASE WHEN vq.due_date < NOW() THEN 0 ELSE 1 END, -- Overdue first
        vq.priority ASC, -- Higher priority first
        vq.created_at ASC -- Older first
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to generate verification summary report
CREATE OR REPLACE FUNCTION generate_verification_report(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    report_period TEXT,
    total_submissions INTEGER,
    approved_count INTEGER,
    rejected_count INTEGER,
    pending_count INTEGER,
    approval_rate DECIMAL,
    average_processing_time_hours DECIMAL,
    total_processing_time_hours DECIMAL,
    most_active_admin TEXT,
    most_common_rejection_reason TEXT
) AS $$
DECLARE
    v_most_active_admin TEXT;
    v_most_common_rejection TEXT;
BEGIN
    -- Get most active admin
    SELECT au.name INTO v_most_active_admin
    FROM verification_activities va
    JOIN admin_users au ON au.id = va.admin_id
    WHERE va.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY au.id, au.name
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Get most common rejection reason (simplified - would need better text analysis)
    SELECT LEFT(notes, 100) INTO v_most_common_rejection
    FROM verification_activities
    WHERE activity_type = 'rejected'
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
    AND notes IS NOT NULL
    GROUP BY LEFT(notes, 100)
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    RETURN QUERY
    SELECT 
        (p_start_date::TEXT || ' to ' || p_end_date::TEXT) as report_period,
        COUNT(DISTINCT vq.pharmacy_id)::INTEGER as total_submissions,
        COUNT(CASE WHEN p.ver_status = 'approved' THEN 1 END)::INTEGER as approved_count,
        COUNT(CASE WHEN p.ver_status = 'rejected' THEN 1 END)::INTEGER as rejected_count,
        COUNT(CASE WHEN p.ver_status = 'pending' THEN 1 END)::INTEGER as pending_count,
        ROUND(
            (COUNT(CASE WHEN p.ver_status = 'approved' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN p.ver_status IN ('approved', 'rejected') THEN 1 END), 0)) * 100,
            2
        ) as approval_rate,
        ROUND(AVG(va.time_spent_minutes)::DECIMAL / 60, 2) as average_processing_time_hours,
        ROUND(SUM(va.time_spent_minutes)::DECIMAL / 60, 2) as total_processing_time_hours,
        COALESCE(v_most_active_admin, 'N/A') as most_active_admin,
        COALESCE(v_most_common_rejection, 'N/A') as most_common_rejection_reason
    FROM verification_queue vq
    JOIN pharmacies p ON p.id = vq.pharmacy_id
    LEFT JOIN verification_activities va ON va.pharmacy_id = p.id
    WHERE vq.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_queue_due_date ON verification_queue(due_date);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status_priority ON verification_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_verification_activities_created_at ON verification_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_activities_activity_type ON verification_activities(activity_type);

-- Create a scheduled function to run maintenance tasks
CREATE OR REPLACE FUNCTION run_verification_maintenance()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
    v_reassigned_count INTEGER;
BEGIN
    -- Reassign overdue verifications
    SELECT reassigned_count INTO v_reassigned_count
    FROM reassign_overdue_verifications();

    v_result := 'Maintenance completed. Reassigned ' || v_reassigned_count || ' overdue verifications.';

    -- Could add more maintenance tasks here:
    -- - Update admin performance metrics
    -- - Clean up old notification records
    -- - Generate daily summary reports

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT EXECUTE ON FUNCTION process_verification_decision TO admin_role;
-- GRANT EXECUTE ON FUNCTION get_admin_verification_stats TO admin_role;
-- GRANT EXECUTE ON FUNCTION get_verification_queue TO admin_role;