-- Admin Verification System Database Schema
-- Run this after your main database setup

-- 1. Admin Users Table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL, -- Supabase Auth ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'verification_specialist', 'support_manager', 'content_moderator')),
    department TEXT,
    specialization TEXT[], -- Areas of expertise
    
    -- Workload management
    max_daily_verifications INTEGER DEFAULT 20,
    current_workload INTEGER DEFAULT 0,
    
    -- Performance tracking
    total_verifications_completed INTEGER DEFAULT 0,
    average_processing_time_hours DECIMAL(5,2),
    approval_rate_percentage DECIMAL(5,2),
    
    -- Account management
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Verification Queue Table (for workflow management)
CREATE TABLE verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    
    -- Assignment
    assigned_to UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Priority and scheduling
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=highest, 5=lowest
    due_date TIMESTAMPTZ, -- SLA deadline
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'escalated', 'completed', 'rejected')),
    
    -- Workflow metadata
    submission_type TEXT DEFAULT 'initial' CHECK (submission_type IN ('initial', 'resubmission', 'appeal')),
    estimated_completion_time INTERVAL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Verification Activities (audit log)
CREATE TABLE verification_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    admin_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'document_reviewed', 'status_changed', 'note_added', 'email_sent', 
        'escalated', 'completed', 'rejected', 'additional_info_requested'
    )),
    
    -- Related entities
    document_id UUID REFERENCES pharmacy_documents(id),
    
    -- Activity data
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    internal_notes TEXT, -- Admin-only notes
    
    -- Time tracking
    time_spent_minutes INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verification Templates (for consistent responses)
CREATE TABLE verification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'approval', 'rejection', 'info_request'
    
    -- Template content
    subject TEXT NOT NULL,
    body_template TEXT NOT NULL, -- With placeholders like {{pharmacy_name}}
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    created_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Admin Performance Metrics
CREATE TABLE admin_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Performance data
    verifications_completed INTEGER DEFAULT 0,
    average_processing_time_hours DECIMAL(5,2),
    approval_rate DECIMAL(5,2),
    rejection_rate DECIMAL(5,2),
    escalation_rate DECIMAL(5,2),
    
    -- Quality metrics
    accuracy_score DECIMAL(5,2), -- Based on spot checks
    customer_satisfaction_score DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_verification_queue_status ON verification_queue(status);
CREATE INDEX idx_verification_queue_assigned_to ON verification_queue(assigned_to);
CREATE INDEX idx_verification_queue_due_date ON verification_queue(due_date);
CREATE INDEX idx_verification_activities_pharmacy ON verification_activities(pharmacy_id);
CREATE INDEX idx_verification_activities_admin ON verification_activities(admin_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- RLS Policies for admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_activities ENABLE ROW LEVEL SECURITY;

-- Admins can see their own data and manage their assignments
CREATE POLICY "admin_own_data" ON admin_users FOR ALL USING (auth_id = auth.uid());
CREATE POLICY "admin_queue_access" ON verification_queue FOR ALL USING (assigned_to IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));
CREATE POLICY "admin_activities_access" ON verification_activities FOR ALL USING (admin_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));

-- Functions for workflow automation
CREATE OR REPLACE FUNCTION assign_verification_to_admin(pharmacy_id UUID)
RETURNS UUID AS $$
DECLARE
    chosen_admin_id UUID;
    queue_id UUID;
BEGIN
    -- Find admin with lowest current workload and relevant specialization
    SELECT id INTO chosen_admin_id
    FROM admin_users
    WHERE is_active = true
    AND role IN ('verification_specialist', 'super_admin')
    AND current_workload < max_daily_verifications
    ORDER BY current_workload ASC, total_verifications_completed ASC
    LIMIT 1;
    
    IF chosen_admin_id IS NULL THEN
        RAISE EXCEPTION 'No available admin found for assignment';
    END IF;
    
    -- Create queue entry
    INSERT INTO verification_queue (pharmacy_id, assigned_to, assigned_at, due_date, priority)
    VALUES (pharmacy_id, chosen_admin_id, NOW(), NOW() + INTERVAL '48 hours', 1)
    RETURNING id INTO queue_id;
    
    -- Update admin workload
    UPDATE admin_users SET current_workload = current_workload + 1 WHERE id = chosen_admin_id;
    
    -- Log the assignment
    INSERT INTO verification_activities (pharmacy_id, admin_id, activity_type, notes)
    VALUES (pharmacy_id, chosen_admin_id, 'assigned', 'Automatically assigned for verification');
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign when pharmacy submits for verification
CREATE OR REPLACE FUNCTION trigger_auto_assign_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- When pharmacy becomes ready for verification, auto-assign to admin
    IF NEW.ver_status = 'pending' AND OLD.ver_status != 'pending' THEN
        PERFORM assign_verification_to_admin(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_verification
    AFTER UPDATE ON pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_assign_verification();