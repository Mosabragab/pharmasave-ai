-- PharmaSave AI V2: Wallet Withdrawal Management System
-- Comprehensive financial operations management for admin panel

-- Withdrawal Status Enum
CREATE TYPE withdrawal_status AS ENUM (
    'pending',           -- New withdrawal request
    'under_review',      -- Admin reviewing request
    'approved',          -- Approved, ready for processing
    'processing',        -- Being processed by payment provider
    'completed',         -- Successfully completed
    'rejected',          -- Rejected by admin
    'failed',            -- Payment processing failed
    'cancelled',         -- Cancelled by user before processing
    'refunded'          -- Refunded due to error/reversal
);

-- Payment Method Types (Egypt-focused)
CREATE TYPE payment_method_type AS ENUM (
    'instapay_mobile',    -- InstaPay mobile number
    'instapay_email',     -- InstaPay email address
    'instapay_wallet',    -- InstaPay wallet ID
    'bank_account',       -- Traditional bank account
    'bank_card',          -- Bank card/IBAN
    'vodafone_cash',      -- Vodafone Cash wallet
    'orange_money',       -- Orange Money wallet
    'etisalat_cash'       -- Etisalat Cash wallet
);

-- KYC Verification Status
CREATE TYPE kyc_status AS ENUM (
    'not_required',
    'pending',
    'under_review',
    'approved',
    'rejected',
    'expired'
);

-- 1. Pharmacy Payment Methods
CREATE TABLE pharmacy_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    
    -- Payment method details
    method_type payment_method_type NOT NULL,
    method_name TEXT NOT NULL, -- User-friendly name like "Main Bank Account"
    
    -- Method-specific data (JSON for flexibility)
    payment_details JSONB NOT NULL, -- Encrypted sensitive data
    
    -- InstaPay specific fields
    instapay_identifier TEXT, -- Phone, email, or wallet ID
    instapay_name TEXT,       -- Registered name
    
    -- Bank account specific fields
    bank_name TEXT,
    account_holder_name TEXT,
    account_number TEXT,
    iban TEXT,
    swift_code TEXT,
    branch_code TEXT,
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES admin_users(id),
    
    -- KYC requirements
    kyc_status kyc_status DEFAULT 'not_required',
    kyc_documents JSONB DEFAULT '[]'::jsonb,
    
    -- Usage tracking
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT one_primary_per_pharmacy UNIQUE (pharmacy_id) WHERE is_primary = TRUE
);

-- 2. Withdrawal Requests
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request identification
    request_number TEXT UNIQUE NOT NULL, -- WR-2025-001234
    
    -- Pharmacy and user info
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    requested_by UUID NOT NULL REFERENCES pharmacists(id),
    
    -- Withdrawal details
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EGP',
    
    -- Payment method
    payment_method_id UUID NOT NULL REFERENCES pharmacy_payment_methods(id),
    payment_method_snapshot JSONB NOT NULL, -- Snapshot of payment details at time of request
    
    -- Request details
    reason TEXT, -- Optional reason for withdrawal
    notes TEXT,  -- User notes
    
    -- Admin processing
    status withdrawal_status NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Admin decision
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Processing details
    processed_by UUID REFERENCES admin_users(id),
    processed_at TIMESTAMPTZ,
    processing_reference TEXT, -- External payment provider reference
    
    -- Fees and calculations
    platform_fee DECIMAL(10,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    total_deducted DECIMAL(12,2), -- Total amount deducted from wallet
    net_amount DECIMAL(12,2),     -- Amount sent to user
    
    -- Wallet state at time of request
    wallet_balance_before DECIMAL(12,2) NOT NULL,
    wallet_balance_after DECIMAL(12,2),
    
    -- Completion details
    completed_at TIMESTAMPTZ,
    external_transaction_id TEXT,
    receipt_url TEXT,
    
    -- Security and fraud prevention
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    fraud_check_passed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Auto-cancel after expiry
);

-- 3. Withdrawal Limits Configuration
CREATE TABLE withdrawal_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Limit type
    limit_type TEXT NOT NULL CHECK (limit_type IN ('daily', 'weekly', 'monthly', 'per_transaction', 'lifetime')),
    
    -- Pharmacy classification (for different limits)
    pharmacy_tier TEXT DEFAULT 'standard' CHECK (pharmacy_tier IN ('standard', 'premium', 'enterprise')),
    verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'kyc_complete')),
    
    -- Limit amounts
    min_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_amount DECIMAL(12,2) NOT NULL,
    
    -- Additional rules
    requires_admin_approval BOOLEAN DEFAULT FALSE,
    cooling_period_hours INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(limit_type, pharmacy_tier, verification_level)
);

-- 4. Withdrawal Processing Log
CREATE TABLE withdrawal_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID NOT NULL REFERENCES withdrawal_requests(id),
    
    -- Processing step
    step_type TEXT NOT NULL CHECK (step_type IN (
        'request_created', 'fraud_check', 'admin_review', 'payment_initiated', 
        'payment_processing', 'payment_completed', 'payment_failed', 'refund_initiated'
    )),
    
    -- Step details
    status TEXT NOT NULL,
    message TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    
    -- External references
    external_reference TEXT,
    provider_response JSONB,
    
    -- Processing admin
    processed_by UUID REFERENCES admin_users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Fraud Detection Rules
CREATE TABLE fraud_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule details
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Rule conditions (JSON for flexibility)
    conditions JSONB NOT NULL,
    
    -- Actions
    action TEXT NOT NULL CHECK (action IN ('flag', 'require_review', 'auto_reject', 'increase_fee')),
    risk_score_impact INTEGER DEFAULT 0,
    
    -- Usage tracking
    triggered_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMPTZ,
    
    created_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Financial Audit Log
CREATE TABLE financial_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction reference
    withdrawal_id UUID REFERENCES withdrawal_requests(id),
    wallet_id UUID REFERENCES wlt(id),
    
    -- Audit details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'withdrawal_requested', 'withdrawal_approved', 'withdrawal_rejected', 
        'amount_deducted', 'payment_sent', 'refund_processed', 'fee_charged'
    )),
    
    -- Financial data
    amount DECIMAL(12,2),
    balance_before DECIMAL(12,2),
    balance_after DECIMAL(12,2),
    
    -- Audit trail
    performed_by UUID REFERENCES admin_users(id),
    notes TEXT,
    
    -- Compliance
    compliance_checked BOOLEAN DEFAULT FALSE,
    compliance_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_pharmacy_id ON withdrawal_requests(pharmacy_id);
CREATE INDEX idx_withdrawal_requests_assigned_to ON withdrawal_requests(assigned_to);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);
CREATE INDEX idx_withdrawal_requests_amount ON withdrawal_requests(amount);
CREATE INDEX idx_payment_methods_pharmacy_id ON pharmacy_payment_methods(pharmacy_id);
CREATE INDEX idx_payment_methods_verified ON pharmacy_payment_methods(is_verified);
CREATE INDEX idx_processing_log_withdrawal_id ON withdrawal_processing_log(withdrawal_id);
CREATE INDEX idx_audit_log_withdrawal_id ON financial_audit_log(withdrawal_id);

-- Functions for withdrawal management

-- Function to generate withdrawal request numbers
CREATE OR REPLACE FUNCTION generate_withdrawal_request_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num INTEGER;
    new_request_number TEXT;
BEGIN
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(RIGHT(request_number, 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM withdrawal_requests
    WHERE request_number LIKE 'WR-' || current_year || '-%';
    
    -- Generate request number: WR-2025-001234
    new_request_number := 'WR-' || current_year || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.request_number := new_request_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_withdrawal_request_number_trigger
    BEFORE INSERT ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION generate_withdrawal_request_number();

-- Function to check withdrawal limits
CREATE OR REPLACE FUNCTION check_withdrawal_limits(
    p_pharmacy_id UUID,
    p_amount DECIMAL,
    p_payment_method_id UUID
)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    max_allowed DECIMAL,
    current_usage DECIMAL
) AS $$
DECLARE
    v_pharmacy_record RECORD;
    v_payment_method RECORD;
    v_daily_limit DECIMAL;
    v_daily_usage DECIMAL;
    v_per_transaction_limit DECIMAL;
    v_tier TEXT := 'standard';
    v_verification_level TEXT := 'basic';
BEGIN
    -- Get pharmacy details
    SELECT * INTO v_pharmacy_record FROM pharmacies WHERE id = p_pharmacy_id;
    
    -- Determine pharmacy tier and verification level
    IF v_pharmacy_record.verified THEN
        v_verification_level := 'verified';
    END IF;
    
    -- Get payment method details
    SELECT * INTO v_payment_method FROM pharmacy_payment_methods WHERE id = p_payment_method_id;
    
    -- Check per-transaction limit
    SELECT max_amount INTO v_per_transaction_limit
    FROM withdrawal_limits
    WHERE limit_type = 'per_transaction'
    AND pharmacy_tier = v_tier
    AND verification_level = v_verification_level;
    
    IF v_per_transaction_limit IS NOT NULL AND p_amount > v_per_transaction_limit THEN
        RETURN QUERY SELECT FALSE, 'Amount exceeds per-transaction limit', v_per_transaction_limit, 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Check daily limit
    SELECT max_amount INTO v_daily_limit
    FROM withdrawal_limits
    WHERE limit_type = 'daily'
    AND pharmacy_tier = v_tier
    AND verification_level = v_verification_level;
    
    -- Calculate daily usage
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_usage
    FROM withdrawal_requests
    WHERE pharmacy_id = p_pharmacy_id
    AND created_at >= CURRENT_DATE
    AND status NOT IN ('rejected', 'cancelled', 'failed');
    
    IF v_daily_limit IS NOT NULL AND (v_daily_usage + p_amount) > v_daily_limit THEN
        RETURN QUERY SELECT FALSE, 'Daily withdrawal limit exceeded', v_daily_limit, v_daily_usage;
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT TRUE, 'Withdrawal allowed', v_daily_limit, v_daily_usage;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate withdrawal fees
CREATE OR REPLACE FUNCTION calculate_withdrawal_fees(
    p_amount DECIMAL,
    p_payment_method_type payment_method_type
)
RETURNS TABLE(
    platform_fee DECIMAL,
    processing_fee DECIMAL,
    total_fees DECIMAL,
    net_amount DECIMAL
) AS $$
DECLARE
    v_platform_fee DECIMAL := 0;
    v_processing_fee DECIMAL := 0;
BEGIN
    -- Platform fee calculation (e.g., 1% of amount, minimum 5 EGP, maximum 50 EGP)
    v_platform_fee := GREATEST(LEAST(p_amount * 0.01, 50), 5);
    
    -- Processing fee based on payment method
    CASE p_payment_method_type
        WHEN 'instapay_mobile', 'instapay_email', 'instapay_wallet' THEN
            v_processing_fee := 2; -- Fixed 2 EGP for InstaPay
        WHEN 'bank_account', 'bank_card' THEN
            v_processing_fee := 10; -- Fixed 10 EGP for bank transfer
        WHEN 'vodafone_cash', 'orange_money', 'etisalat_cash' THEN
            v_processing_fee := 5; -- Fixed 5 EGP for mobile wallets
        ELSE
            v_processing_fee := 15; -- Default higher fee for unknown methods
    END CASE;
    
    RETURN QUERY SELECT 
        v_platform_fee,
        v_processing_fee,
        v_platform_fee + v_processing_fee,
        p_amount - v_platform_fee - v_processing_fee;
END;
$$ LANGUAGE plpgsql;

-- Function to perform fraud check
CREATE OR REPLACE FUNCTION perform_fraud_check(p_withdrawal_id UUID)
RETURNS TABLE(
    risk_score INTEGER,
    fraud_flags TEXT[],
    requires_review BOOLEAN
) AS $$
DECLARE
    v_withdrawal RECORD;
    v_risk_score INTEGER := 0;
    v_flags TEXT[] := ARRAY[]::TEXT[];
    v_requires_review BOOLEAN := FALSE;
BEGIN
    -- Get withdrawal details
    SELECT * INTO v_withdrawal FROM withdrawal_requests WHERE id = p_withdrawal_id;
    
    -- Check 1: Large amount (>5000 EGP)
    IF v_withdrawal.amount > 5000 THEN
        v_risk_score := v_risk_score + 20;
        v_flags := array_append(v_flags, 'large_amount');
    END IF;
    
    -- Check 2: New payment method (used <3 times)
    IF (SELECT successful_transactions FROM pharmacy_payment_methods WHERE id = v_withdrawal.payment_method_id) < 3 THEN
        v_risk_score := v_risk_score + 15;
        v_flags := array_append(v_flags, 'new_payment_method');
    END IF;
    
    -- Check 3: Multiple withdrawals in short time
    IF (SELECT COUNT(*) FROM withdrawal_requests 
        WHERE pharmacy_id = v_withdrawal.pharmacy_id 
        AND created_at > NOW() - INTERVAL '1 hour'
        AND id != p_withdrawal_id) > 2 THEN
        v_risk_score := v_risk_score + 25;
        v_flags := array_append(v_flags, 'frequent_withdrawals');
        v_requires_review := TRUE;
    END IF;
    
    -- Check 4: Unusual hours (between 11 PM and 6 AM)
    IF EXTRACT(HOUR FROM v_withdrawal.created_at) BETWEEN 23 AND 23 
       OR EXTRACT(HOUR FROM v_withdrawal.created_at) BETWEEN 0 AND 6 THEN
        v_risk_score := v_risk_score + 10;
        v_flags := array_append(v_flags, 'unusual_hours');
    END IF;
    
    -- High risk score requires review
    IF v_risk_score >= 50 THEN
        v_requires_review := TRUE;
    END IF;
    
    -- Update withdrawal request with fraud check results
    UPDATE withdrawal_requests 
    SET 
        risk_score = v_risk_score,
        fraud_check_passed = NOT v_requires_review,
        status = CASE 
            WHEN v_requires_review THEN 'under_review'::withdrawal_status
            ELSE status 
        END
    WHERE id = p_withdrawal_id;
    
    RETURN QUERY SELECT v_risk_score, v_flags, v_requires_review;
END;
$$ LANGUAGE plpgsql;

-- Function to process withdrawal approval/rejection
CREATE OR REPLACE FUNCTION process_withdrawal_decision(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_decision TEXT, -- 'approve' or 'reject'
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    new_status withdrawal_status
) AS $$
DECLARE
    v_withdrawal RECORD;
    v_wallet RECORD;
    v_fees RECORD;
    v_new_status withdrawal_status;
BEGIN
    -- Validate decision
    IF p_decision NOT IN ('approve', 'reject') THEN
        RETURN QUERY SELECT FALSE, 'Invalid decision', NULL::withdrawal_status;
        RETURN;
    END IF;
    
    -- Get withdrawal request
    SELECT * INTO v_withdrawal FROM withdrawal_requests WHERE id = p_withdrawal_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Withdrawal request not found', NULL::withdrawal_status;
        RETURN;
    END IF;
    
    -- Check if already processed
    IF v_withdrawal.status NOT IN ('pending', 'under_review') THEN
        RETURN QUERY SELECT FALSE, 'Withdrawal already processed', v_withdrawal.status;
        RETURN;
    END IF;
    
    IF p_decision = 'approve' THEN
        -- Get wallet details
        SELECT * INTO v_wallet FROM wlt WHERE pharmacy_id = v_withdrawal.pharmacy_id;
        
        -- Check if sufficient balance
        IF v_wallet.balance < v_withdrawal.amount THEN
            RETURN QUERY SELECT FALSE, 'Insufficient wallet balance', 'rejected'::withdrawal_status;
            RETURN;
        END IF;
        
        -- Calculate fees
        SELECT * INTO v_fees FROM calculate_withdrawal_fees(
            v_withdrawal.amount, 
            (SELECT method_type FROM pharmacy_payment_methods WHERE id = v_withdrawal.payment_method_id)
        );
        
        -- Deduct amount from wallet
        UPDATE wlt 
        SET 
            balance = balance - v_withdrawal.amount,
            updated_at = NOW()
        WHERE pharmacy_id = v_withdrawal.pharmacy_id;
        
        -- Update withdrawal request
        v_new_status := 'approved';
        
        UPDATE withdrawal_requests 
        SET 
            status = v_new_status,
            reviewed_by = p_admin_id,
            reviewed_at = NOW(),
            admin_notes = p_admin_notes,
            platform_fee = v_fees.platform_fee,
            processing_fee = v_fees.processing_fee,
            total_deducted = v_withdrawal.amount,
            net_amount = v_fees.net_amount,
            wallet_balance_before = v_wallet.balance,
            wallet_balance_after = v_wallet.balance - v_withdrawal.amount,
            updated_at = NOW()
        WHERE id = p_withdrawal_id;
        
        -- Create wallet transaction record
        INSERT INTO wlt_txn (
            wallet_id, type, amount, balance_before, balance_after, 
            status, transaction_id, description
        ) VALUES (
            v_wallet.id, 'withdrawal', -v_withdrawal.amount, 
            v_wallet.balance, v_wallet.balance - v_withdrawal.amount,
            'completed', p_withdrawal_id::TEXT, 
            'Withdrawal request: ' || v_withdrawal.request_number
        );
        
        -- Log financial audit
        INSERT INTO financial_audit_log (
            withdrawal_id, wallet_id, action_type, amount, 
            balance_before, balance_after, performed_by, notes
        ) VALUES (
            p_withdrawal_id, v_wallet.id, 'withdrawal_approved', v_withdrawal.amount,
            v_wallet.balance, v_wallet.balance - v_withdrawal.amount, 
            p_admin_id, 'Withdrawal approved by admin'
        );
        
    ELSE
        -- Reject withdrawal
        v_new_status := 'rejected';
        
        UPDATE withdrawal_requests 
        SET 
            status = v_new_status,
            reviewed_by = p_admin_id,
            reviewed_at = NOW(),
            admin_notes = p_admin_notes,
            rejection_reason = p_admin_notes,
            updated_at = NOW()
        WHERE id = p_withdrawal_id;
    END IF;
    
    -- Log processing step
    INSERT INTO withdrawal_processing_log (
        withdrawal_id, step_type, status, message, processed_by
    ) VALUES (
        p_withdrawal_id, 'admin_review', p_decision, p_admin_notes, p_admin_id
    );
    
    -- Create notification for pharmacy
    INSERT INTO notifications (
        pharmacy_id, type, title, message, status, reference_id, reference_type
    ) VALUES (
        v_withdrawal.pharmacy_id,
        'wallet',
        CASE WHEN p_decision = 'approve' THEN 'Withdrawal Approved ✅' 
             ELSE 'Withdrawal Rejected ❌' END,
        CASE WHEN p_decision = 'approve' 
             THEN 'Your withdrawal request ' || v_withdrawal.request_number || ' has been approved and is being processed.'
             ELSE 'Your withdrawal request ' || v_withdrawal.request_number || ' has been rejected. Reason: ' || COALESCE(p_admin_notes, 'No reason provided.') END,
        'unread',
        p_withdrawal_id,
        'withdrawal'
    );
    
    RETURN QUERY SELECT TRUE, 
        CASE WHEN p_decision = 'approve' THEN 'Withdrawal approved successfully'
             ELSE 'Withdrawal rejected' END,
        v_new_status;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 'Error processing withdrawal: ' || SQLERRM, NULL::withdrawal_status;
END;
$$ LANGUAGE plpgsql;

-- Initial withdrawal limits configuration
INSERT INTO withdrawal_limits (limit_type, pharmacy_tier, verification_level, min_amount, max_amount, requires_admin_approval) VALUES
('per_transaction', 'standard', 'basic', 10, 1000, FALSE),
('per_transaction', 'standard', 'verified', 10, 5000, FALSE),
('per_transaction', 'premium', 'verified', 10, 10000, FALSE),
('daily', 'standard', 'basic', 0, 2000, FALSE),
('daily', 'standard', 'verified', 0, 10000, FALSE),
('daily', 'premium', 'verified', 0, 25000, FALSE),
('weekly', 'standard', 'basic', 0, 10000, TRUE),
('weekly', 'standard', 'verified', 0, 50000, FALSE),
('monthly', 'standard', 'basic', 0, 30000, TRUE),
('monthly', 'standard', 'verified', 0, 200000, FALSE);

-- RLS Policies
ALTER TABLE pharmacy_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Pharmacies can manage their own payment methods
CREATE POLICY "pharmacy_own_payment_methods" ON pharmacy_payment_methods
    FOR ALL USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM pharmacists WHERE auth_id = auth.uid()
        )
    );

-- Pharmacies can manage their own withdrawal requests
CREATE POLICY "pharmacy_own_withdrawals" ON withdrawal_requests
    FOR ALL USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM pharmacists WHERE auth_id = auth.uid()
        )
    );