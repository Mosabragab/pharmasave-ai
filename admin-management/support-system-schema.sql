-- PharmaSave AI V2: Support System Database Schema
-- Comprehensive support ticket and communication management

-- Support Categories Enum
CREATE TYPE support_category AS ENUM (
    'technical',           -- Technical issues, bugs, app problems
    'verification',        -- Verification process questions
    'financial',          -- Wallet, payments, withdrawals
    'marketplace',        -- Listing, transaction issues
    'account',            -- Profile, login, permissions
    'general',            -- General inquiries
    'billing',            -- Subscription, invoicing
    'feature_request',    -- New feature suggestions
    'complaint',          -- Service complaints
    'emergency'           -- Urgent issues requiring immediate attention
);

-- Support Priority Levels
CREATE TYPE support_priority AS ENUM (
    'low',       -- 1-2 days response
    'medium',    -- 4-8 hours response
    'high',      -- 1-2 hours response
    'urgent',    -- 30 minutes response
    'emergency'  -- Immediate response
);

-- Support Status
CREATE TYPE support_status AS ENUM (
    'open',           -- New ticket, awaiting assignment
    'assigned',       -- Assigned to admin
    'in_progress',    -- Admin working on it
    'waiting_user',   -- Waiting for user response
    'escalated',      -- Escalated to senior admin
    'resolved',       -- Issue resolved, awaiting user confirmation
    'closed',         -- Ticket closed
    'reopened'        -- Ticket reopened after being closed
);

-- 1. Support Tickets Table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ticket identification
    ticket_number TEXT UNIQUE NOT NULL, -- ST-2025-001234
    
    -- Reporter details
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    pharmacist_id UUID NOT NULL REFERENCES pharmacists(id),
    reporter_name TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    reporter_phone TEXT,
    
    -- Ticket details
    category support_category NOT NULL,
    priority support_priority NOT NULL DEFAULT 'medium',
    status support_status NOT NULL DEFAULT 'open',
    
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Assignment and handling
    assigned_to UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Resolution tracking
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- User satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    satisfaction_feedback TEXT,
    
    -- SLA tracking
    first_response_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    tags TEXT[],
    internal_notes TEXT,
    escalation_reason TEXT,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 2. Support Messages Table (for ticket conversations)
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Message details
    message_type TEXT NOT NULL CHECK (message_type IN ('user_message', 'admin_response', 'system_note', 'internal_note')),
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    
    -- Sender info
    sender_id UUID, -- pharmacist_id or admin_id
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    
    -- Message content
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal admin notes not visible to user
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Read tracking
    read_by_user BOOLEAN DEFAULT FALSE,
    read_by_admin BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Support Knowledge Base
CREATE TABLE support_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article details
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Categorization
    category support_category NOT NULL,
    tags TEXT[],
    
    -- Search optimization
    search_vector TSVECTOR,
    
    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,
    
    -- Management
    created_by UUID NOT NULL REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Support Templates (for quick responses)
CREATE TABLE support_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template details
    name TEXT NOT NULL,
    category support_category NOT NULL,
    
    -- Template content
    subject_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Management
    created_by UUID NOT NULL REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Support SLA Configuration
CREATE TABLE support_sla_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    priority support_priority NOT NULL,
    category support_category NOT NULL,
    
    -- Response time targets (in minutes)
    first_response_minutes INTEGER NOT NULL,
    resolution_target_minutes INTEGER NOT NULL,
    
    -- Escalation rules
    escalate_after_minutes INTEGER,
    escalate_to_role TEXT,
    
    -- Business hours
    business_hours_only BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(priority, category)
);

-- 6. Support Escalation Rules
CREATE TABLE support_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id),
    
    -- Escalation details
    escalated_from UUID REFERENCES admin_users(id),
    escalated_to UUID REFERENCES admin_users(id),
    escalation_reason TEXT NOT NULL,
    
    -- Timing
    escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_pharmacy_id ON support_tickets(pharmacy_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_due_date ON support_tickets(due_date);
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at DESC);
CREATE INDEX idx_support_kb_category ON support_knowledge_base(category);
CREATE INDEX idx_support_kb_search_vector ON support_knowledge_base USING GIN(search_vector);

-- Full-text search for knowledge base
CREATE OR REPLACE FUNCTION update_kb_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.content || ' ' || COALESCE(NEW.summary, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kb_search_trigger
    BEFORE INSERT OR UPDATE ON support_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_kb_search_vector();

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num INTEGER;
    new_ticket_number TEXT;
BEGIN
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(RIGHT(ticket_number, 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM support_tickets
    WHERE ticket_number LIKE 'ST-' || current_year || '-%';
    
    -- Generate ticket number: ST-2025-001234
    new_ticket_number := 'ST-' || current_year || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.ticket_number := new_ticket_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket number generation
CREATE TRIGGER generate_ticket_number_trigger
    BEFORE INSERT ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Function to calculate SLA due date
CREATE OR REPLACE FUNCTION calculate_sla_due_date(p_priority support_priority, p_category support_category)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    target_minutes INTEGER;
    due_date TIMESTAMPTZ;
BEGIN
    -- Get SLA configuration
    SELECT first_response_minutes INTO target_minutes
    FROM support_sla_config
    WHERE priority = p_priority AND category = p_category;
    
    -- Default SLA if not configured
    IF target_minutes IS NULL THEN
        target_minutes := CASE 
            WHEN p_priority = 'emergency' THEN 15
            WHEN p_priority = 'urgent' THEN 30
            WHEN p_priority = 'high' THEN 120
            WHEN p_priority = 'medium' THEN 480
            ELSE 1440
        END;
    END IF;
    
    -- Calculate due date (excluding weekends for non-emergency)
    due_date := NOW() + (target_minutes || ' minutes')::INTERVAL;
    
    RETURN due_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set SLA due date on ticket creation
CREATE OR REPLACE FUNCTION set_ticket_sla()
RETURNS TRIGGER AS $$
BEGIN
    NEW.due_date := calculate_sla_due_date(NEW.priority, NEW.category);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_sla_trigger
    BEFORE INSERT ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION set_ticket_sla();

-- Initial SLA configuration
INSERT INTO support_sla_config (priority, category, first_response_minutes, resolution_target_minutes, escalate_after_minutes) VALUES
('emergency', 'technical', 15, 60, 30),
('emergency', 'financial', 15, 60, 30),
('urgent', 'technical', 30, 120, 60),
('urgent', 'financial', 30, 120, 60),
('urgent', 'verification', 30, 240, 120),
('high', 'technical', 120, 480, 240),
('high', 'financial', 60, 240, 120),
('high', 'verification', 120, 480, 240),
('medium', 'technical', 480, 1440, 720),
('medium', 'financial', 240, 720, 360),
('medium', 'verification', 480, 1440, 720),
('medium', 'marketplace', 480, 1440, 720),
('low', 'general', 1440, 2880, 1440),
('low', 'feature_request', 2880, 10080, 4320);

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets
CREATE POLICY "users_own_tickets" ON support_tickets
    FOR ALL USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM pharmacists WHERE auth_id = auth.uid()
        )
    );

-- Users can see messages for their tickets
CREATE POLICY "users_own_ticket_messages" ON support_messages
    FOR ALL USING (
        ticket_id IN (
            SELECT st.id FROM support_tickets st
            JOIN pharmacists p ON p.pharmacy_id = st.pharmacy_id
            WHERE p.auth_id = auth.uid()
        )
    );

-- Everyone can read published knowledge base articles
CREATE POLICY "public_knowledge_base" ON support_knowledge_base
    FOR SELECT USING (is_published = TRUE);