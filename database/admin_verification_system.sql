-- Admin Verification System Database Schema
-- PharmaSave AI - Complete verification workflow
-- Run this to create the admin verification system

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
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
CREATE TABLE IF NOT EXISTS verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    
    -- Assignment
    assigned_to UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Priority and scheduling
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=highest, 5=lowest
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
CREATE TABLE IF NOT EXISTS verification_activities (
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
CREATE TABLE IF NOT EXISTS verification_templates (
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

-- 5. Support Tickets System
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES pharmacies(id),
    
    -- Ticket details
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'verification', 'billing', 'general')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment and status
    assigned_to UUID REFERENCES admin_users(id),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_customer', 'resolved', 'closed')),
    
    -- Communication
    customer_email TEXT,
    customer_phone TEXT,
    
    -- Tracking
    due_date TIMESTAMPTZ,
    resolution_notes TEXT,
    customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_assigned_to ON verification_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_verification_queue_due_date ON verification_queue(due_date);
CREATE INDEX IF NOT EXISTS idx_verification_queue_pharmacy ON verification_queue(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_verification_activities_pharmacy ON verification_activities(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_verification_activities_admin ON verification_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);

-- RLS Policies for admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "admin_own_data" ON admin_users;
DROP POLICY IF EXISTS "admin_queue_access" ON verification_queue;
DROP POLICY IF EXISTS "admin_activities_access" ON verification_activities;
DROP POLICY IF EXISTS "admin_templates_access" ON verification_templates;
DROP POLICY IF EXISTS "admin_tickets_access" ON support_tickets;

-- Admins can see their own data and manage their assignments
CREATE POLICY "admin_own_data" ON admin_users FOR ALL USING (auth_id = auth.uid());
CREATE POLICY "admin_queue_access" ON verification_queue FOR ALL USING (
    assigned_to IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()) OR
    auth.uid() IN (SELECT auth_id FROM admin_users WHERE role IN ('super_admin', 'verification_specialist'))
);
CREATE POLICY "admin_activities_access" ON verification_activities FOR ALL USING (
    admin_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()) OR
    auth.uid() IN (SELECT auth_id FROM admin_users WHERE role = 'super_admin')
);
CREATE POLICY "admin_templates_access" ON verification_templates FOR ALL USING (
    created_by IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()) OR
    auth.uid() IN (SELECT auth_id FROM admin_users WHERE role IN ('super_admin', 'verification_specialist'))
);
CREATE POLICY "admin_tickets_access" ON support_tickets FOR ALL USING (
    assigned_to IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()) OR
    auth.uid() IN (SELECT auth_id FROM admin_users WHERE role IN ('super_admin', 'support_manager'))
);

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
        -- If no admin available, create unassigned entry
        INSERT INTO verification_queue (pharmacy_id, due_date, priority, status)
        VALUES (pharmacy_id, NOW() + INTERVAL '48 hours', 2, 'pending')
        RETURNING id INTO queue_id;
        
        RETURN queue_id;
    END IF;
    
    -- Create queue entry with assignment
    INSERT INTO verification_queue (pharmacy_id, assigned_to, assigned_at, due_date, priority, status)
    VALUES (pharmacy_id, chosen_admin_id, NOW(), NOW() + INTERVAL '48 hours', 2, 'pending')
    RETURNING id INTO queue_id;
    
    -- Update admin workload
    UPDATE admin_users SET current_workload = current_workload + 1 WHERE id = chosen_admin_id;
    
    -- Log the assignment
    INSERT INTO verification_activities (pharmacy_id, admin_id, activity_type, notes)
    VALUES (pharmacy_id, chosen_admin_id, 'status_changed', 'Automatically assigned for verification');
    
    RETURN queue_id;
EXCEPTION
    WHEN OTHERS THEN
        -- If function fails, just create basic queue entry
        INSERT INTO verification_queue (pharmacy_id, due_date, priority, status)
        VALUES (pharmacy_id, NOW() + INTERVAL '48 hours', 2, 'pending')
        RETURNING id INTO queue_id;
        
        RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign when pharmacy submits for verification  
DROP TRIGGER IF EXISTS auto_assign_verification ON pharmacies;
DROP FUNCTION IF EXISTS trigger_auto_assign_verification();

CREATE OR REPLACE FUNCTION trigger_auto_assign_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- When pharmacy becomes ready for verification, auto-assign to admin
    IF NEW.ver_status = 'pending' AND (OLD.ver_status IS NULL OR OLD.ver_status != 'pending') THEN
        BEGIN
            PERFORM assign_verification_to_admin(NEW.id);
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but don't fail the pharmacy update
                RAISE WARNING 'Failed to auto-assign verification for pharmacy %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_verification
    AFTER UPDATE ON pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_assign_verification();

-- Insert default admin user for testing (you should update this)
INSERT INTO admin_users (auth_id, email, name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual Supabase auth ID
    'admin@pharmasave.ai',
    'Default Admin',
    'super_admin',
    true
) ON CONFLICT (auth_id) DO NOTHING;

-- Insert default verification templates
INSERT INTO verification_templates (name, category, subject, body_template, created_by)
SELECT 
    'Approval Email',
    'approval',
    'PharmaSave AI - Verification Approved!',
    'Dear {{pharmacy_name}},

Congratulations! Your pharmacy verification has been approved. You now have full access to the PharmaSave AI platform.

Next steps:
1. Explore the marketplace
2. List your first medication
3. Connect with nearby pharmacies

Welcome to PharmaSave AI!

Best regards,
The PharmaSave AI Team',
    id
FROM admin_users 
WHERE role = 'super_admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO verification_templates (name, category, subject, body_template, created_by)
SELECT 
    'Rejection Email',
    'rejection',
    'PharmaSave AI - Additional Information Required',
    'Dear {{pharmacy_name}},

We need additional information to complete your verification. Please review the following:

{{rejection_reasons}}

Please resubmit your documents with the required updates.

If you have questions, contact our support team.

Best regards,
The PharmaSave AI Team',
    id
FROM admin_users 
WHERE role = 'super_admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Admin Verification System created successfully!';
    RAISE NOTICE 'Tables created: admin_users, verification_queue, verification_activities, verification_templates, support_tickets';
    RAISE NOTICE 'Remember to update the default admin user with a real Supabase auth ID';
END $$;