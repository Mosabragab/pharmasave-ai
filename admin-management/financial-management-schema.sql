-- PharmaSave AI V2: Financial Management & Business Intelligence System
-- Comprehensive financial tracking, reporting, and business analytics

-- Financial Transaction Types
CREATE TYPE financial_transaction_type AS ENUM (
    -- Revenue
    'subscription_revenue',      -- Monthly subscription payments
    'transaction_fee_revenue',   -- Marketplace transaction fees
    'withdrawal_fee_revenue',    -- Withdrawal processing fees
    'late_payment_fee',         -- Late subscription payment fees
    'setup_fee',                -- One-time setup fees
    'premium_feature_revenue',   -- Premium feature subscriptions
    
    -- Expenses  
    'infrastructure_cost',       -- Server, database, storage costs
    'payment_processing_cost',   -- Payment gateway fees
    'admin_salary',             -- Admin team salaries
    'marketing_expense',        -- Marketing and advertising costs
    'development_cost',         -- Development and maintenance
    'legal_compliance',         -- Legal and compliance costs
    'customer_support_cost',    -- Support team costs
    'office_rent',              -- Office and operational expenses
    'software_licenses',        -- Third-party software costs
    'bank_charges',             -- Banking and financial fees
    
    -- Adjustments
    'refund',                   -- Customer refunds
    'chargeback',               -- Payment chargebacks
    'discount',                 -- Promotional discounts
    'bonus',                    -- Admin bonuses
    'tax_payment',              -- Tax payments
    'adjustment'                -- Manual adjustments
);

-- Revenue Recognition Status
CREATE TYPE revenue_status AS ENUM (
    'pending',      -- Revenue recorded but not yet recognized
    'recognized',   -- Revenue officially recognized
    'deferred',     -- Deferred revenue (future periods)
    'refunded',     -- Revenue refunded to customer
    'disputed'      -- Revenue under dispute
);

-- Expense Categories
CREATE TYPE expense_category AS ENUM (
    'operational',  -- Day-to-day operational expenses
    'personnel',    -- Salaries, benefits, HR costs
    'technology',   -- Infrastructure, software, development
    'marketing',    -- Marketing, advertising, PR
    'legal',        -- Legal, compliance, regulatory
    'financial',    -- Banking, accounting, audit
    'administrative' -- Office, utilities, misc admin
);

-- 1. Financial Accounts (Chart of Accounts)
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Account details
    account_number TEXT UNIQUE NOT NULL, -- 1001, 2001, etc.
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_subtype TEXT, -- current_asset, fixed_asset, etc.
    
    -- Account hierarchy
    parent_account_id UUID REFERENCES financial_accounts(id),
    account_level INTEGER NOT NULL DEFAULT 1,
    
    -- Account properties
    is_active BOOLEAN DEFAULT TRUE,
    is_system_account BOOLEAN DEFAULT FALSE, -- System-generated accounts
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Balance tracking
    current_balance DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    description TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Financial Transactions (General Ledger)
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction identification
    transaction_number TEXT UNIQUE NOT NULL, -- FT-2025-001234
    reference_number TEXT, -- External reference (invoice, receipt, etc.)
    
    -- Transaction details
    transaction_type financial_transaction_type NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Amounts
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'EGP',
    
    -- Accounts involved (double entry)
    debit_account_id UUID NOT NULL REFERENCES financial_accounts(id),
    credit_account_id UUID NOT NULL REFERENCES financial_accounts(id),
    
    -- Related entities
    pharmacy_id UUID REFERENCES pharmacies(id),
    admin_id UUID REFERENCES admin_users(id),
    
    -- External references
    marketplace_transaction_id UUID, -- References txn table
    withdrawal_request_id UUID REFERENCES withdrawal_requests(id),
    subscription_id UUID, -- Would reference subscription table
    
    -- Transaction status
    status TEXT DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'reconciled', 'reversed')),
    
    -- Revenue recognition (for revenue transactions)
    revenue_status revenue_status DEFAULT 'recognized',
    revenue_period DATE, -- Which period this revenue belongs to
    
    -- Expense categorization (for expense transactions)
    expense_category expense_category,
    expense_period DATE,
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    description TEXT NOT NULL,
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure debit and credit accounts are different
    CONSTRAINT different_accounts CHECK (debit_account_id != credit_account_id)
);

-- 3. Recurring Financial Entries (for predictable income/expenses)
CREATE TABLE recurring_financial_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entry details
    entry_name TEXT NOT NULL,
    entry_type financial_transaction_type NOT NULL,
    
    -- Recurrence pattern
    recurrence_pattern TEXT NOT NULL CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    recurrence_day INTEGER, -- Day of month/week for recurrence
    
    -- Amounts and accounts
    amount DECIMAL(15,2) NOT NULL,
    debit_account_id UUID NOT NULL REFERENCES financial_accounts(id),
    credit_account_id UUID NOT NULL REFERENCES financial_accounts(id),
    
    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE,
    last_generated_date DATE,
    next_generation_date DATE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    auto_generate BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    description TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Business Metrics Tracking
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric identification
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL CHECK (metric_category IN ('revenue', 'growth', 'engagement', 'financial', 'operational')),
    
    -- Time period
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metric value
    metric_value DECIMAL(15,4) NOT NULL,
    metric_units TEXT, -- 'EGP', 'count', 'percentage', etc.
    
    -- Comparison data
    previous_period_value DECIMAL(15,4),
    target_value DECIMAL(15,4),
    
    -- Metadata
    calculation_method TEXT,
    data_source TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for metric per period
    UNIQUE(metric_name, period_type, period_start, period_end)
);

-- 5. Financial Reports Configuration
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Report details
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('income_statement', 'balance_sheet', 'cash_flow', 'custom')),
    report_description TEXT,
    
    -- Report configuration
    report_config JSONB NOT NULL, -- Flexible configuration for different report types
    
    -- Scheduling
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_pattern TEXT, -- 'monthly', 'quarterly', etc.
    last_generated TIMESTAMPTZ,
    next_generation TIMESTAMPTZ,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    allowed_roles TEXT[] DEFAULT ARRAY['super_admin'],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tax Configuration and Tracking
CREATE TABLE tax_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tax details
    tax_name TEXT NOT NULL,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('vat', 'income_tax', 'withholding_tax', 'municipal_tax')),
    tax_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.14 for 14% VAT
    
    -- Applicability
    applies_to TEXT[] NOT NULL, -- Array of transaction types this tax applies to
    
    -- Date range
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Configuration
    calculation_method TEXT DEFAULT 'percentage',
    is_inclusive BOOLEAN DEFAULT FALSE, -- Whether tax is included in amounts
    
    -- Accounts
    tax_payable_account_id UUID REFERENCES financial_accounts(id),
    tax_expense_account_id UUID REFERENCES financial_accounts(id),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Budget Planning and Tracking
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Budget details
    budget_name TEXT NOT NULL,
    budget_year INTEGER NOT NULL,
    budget_type TEXT NOT NULL CHECK (budget_type IN ('annual', 'quarterly', 'monthly')),
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'closed')),
    
    -- Approval
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Budget Line Items
CREATE TABLE budget_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    
    -- Account and category
    account_id UUID NOT NULL REFERENCES financial_accounts(id),
    category TEXT,
    line_item_name TEXT NOT NULL,
    
    -- Budget amounts
    budgeted_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    variance DECIMAL(15,2) DEFAULT 0,
    variance_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Period breakdown (for monthly/quarterly budgets)
    period_amounts JSONB DEFAULT '{}'::jsonb,
    
    -- Notes and justification
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_debit ON financial_transactions(debit_account_id);
CREATE INDEX idx_financial_transactions_credit ON financial_transactions(credit_account_id);
CREATE INDEX idx_financial_transactions_pharmacy ON financial_transactions(pharmacy_id);
CREATE INDEX idx_financial_transactions_reference ON financial_transactions(reference_number);
CREATE INDEX idx_business_metrics_name_period ON business_metrics(metric_name, period_start, period_end);
CREATE INDEX idx_accounts_type ON financial_accounts(account_type);
CREATE INDEX idx_accounts_number ON financial_accounts(account_number);

-- Functions for financial operations

-- Function to generate financial transaction numbers
CREATE OR REPLACE FUNCTION generate_financial_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num INTEGER;
    new_transaction_number TEXT;
BEGIN
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(RIGHT(transaction_number, 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM financial_transactions
    WHERE transaction_number LIKE 'FT-' || current_year || '-%';
    
    -- Generate transaction number: FT-2025-001234
    new_transaction_number := 'FT-' || current_year || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.transaction_number := new_transaction_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_financial_transaction_number_trigger
    BEFORE INSERT ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION generate_financial_transaction_number();

-- Function to update account balances
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Update debit account balance (increase for assets/expenses, decrease for liabilities/revenue/equity)
    UPDATE financial_accounts 
    SET 
        current_balance = current_balance + 
            CASE 
                WHEN account_type IN ('asset', 'expense') THEN NEW.amount
                ELSE -NEW.amount
            END,
        last_updated = NOW()
    WHERE id = NEW.debit_account_id;
    
    -- Update credit account balance (decrease for assets/expenses, increase for liabilities/revenue/equity)
    UPDATE financial_accounts 
    SET 
        current_balance = current_balance + 
            CASE 
                WHEN account_type IN ('liability', 'equity', 'revenue') THEN NEW.amount
                ELSE -NEW.amount
            END,
        last_updated = NOW()
    WHERE id = NEW.credit_account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_balances_trigger
    AFTER INSERT ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balances();

-- Function to calculate key business metrics
CREATE OR REPLACE FUNCTION calculate_business_metrics(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    metric_name TEXT,
    metric_value DECIMAL,
    metric_units TEXT,
    comparison_period_value DECIMAL,
    growth_rate DECIMAL
) AS $$
DECLARE
    v_current_mrr DECIMAL;
    v_previous_mrr DECIMAL;
    v_total_pharmacies INTEGER;
    v_active_pharmacies INTEGER;
    v_new_pharmacies INTEGER;
    v_churned_pharmacies INTEGER;
    v_transaction_count INTEGER;
    v_transaction_volume DECIMAL;
    v_avg_transaction_value DECIMAL;
    v_total_revenue DECIMAL;
    v_total_expenses DECIMAL;
    v_net_profit DECIMAL;
    v_previous_period_start DATE;
    v_previous_period_end DATE;
BEGIN
    -- Calculate previous period dates
    v_previous_period_start := p_start_date - (p_end_date - p_start_date + 1);
    v_previous_period_end := p_start_date - 1;
    
    -- Monthly Recurring Revenue (MRR)
    SELECT COALESCE(SUM(amount), 0) INTO v_current_mrr
    FROM financial_transactions
    WHERE transaction_type = 'subscription_revenue'
    AND transaction_date BETWEEN p_start_date AND p_end_date;
    
    -- Previous period MRR
    SELECT COALESCE(SUM(amount), 0) INTO v_previous_mrr
    FROM financial_transactions
    WHERE transaction_type = 'subscription_revenue'
    AND transaction_date BETWEEN v_previous_period_start AND v_previous_period_end;
    
    -- Pharmacy metrics
    SELECT COUNT(*) INTO v_total_pharmacies FROM pharmacies;
    SELECT COUNT(*) INTO v_active_pharmacies FROM pharmacies WHERE verified = TRUE;
    
    SELECT COUNT(*) INTO v_new_pharmacies
    FROM pharmacies
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
    
    -- Transaction metrics
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0), COALESCE(AVG(total_amount), 0)
    INTO v_transaction_count, v_transaction_volume, v_avg_transaction_value
    FROM txn
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
    AND status = 'completed';
    
    -- Financial metrics
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
    FROM financial_transactions
    WHERE transaction_type IN ('subscription_revenue', 'transaction_fee_revenue', 'withdrawal_fee_revenue')
    AND transaction_date BETWEEN p_start_date AND p_end_date;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM financial_transactions
    WHERE transaction_type IN ('infrastructure_cost', 'admin_salary', 'marketing_expense', 'development_cost')
    AND transaction_date BETWEEN p_start_date AND p_end_date;
    
    v_net_profit := v_total_revenue - v_total_expenses;
    
    -- Return metrics
    RETURN QUERY VALUES
        ('Monthly Recurring Revenue', v_current_mrr, 'EGP', v_previous_mrr, 
         CASE WHEN v_previous_mrr > 0 THEN ((v_current_mrr - v_previous_mrr) / v_previous_mrr) * 100 ELSE 0 END),
        ('Total Pharmacies', v_total_pharmacies::DECIMAL, 'count', NULL, NULL),
        ('Active Pharmacies', v_active_pharmacies::DECIMAL, 'count', NULL, NULL),
        ('New Pharmacies', v_new_pharmacies::DECIMAL, 'count', NULL, NULL),
        ('Transaction Count', v_transaction_count::DECIMAL, 'count', NULL, NULL),
        ('Transaction Volume', v_transaction_volume, 'EGP', NULL, NULL),
        ('Average Transaction Value', v_avg_transaction_value, 'EGP', NULL, NULL),
        ('Total Revenue', v_total_revenue, 'EGP', NULL, NULL),
        ('Total Expenses', v_total_expenses, 'EGP', NULL, NULL),
        ('Net Profit', v_net_profit, 'EGP', NULL, NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to generate income statement
CREATE OR REPLACE FUNCTION generate_income_statement(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    account_name TEXT,
    account_type TEXT,
    amount DECIMAL,
    percentage_of_revenue DECIMAL
) AS $$
DECLARE
    v_total_revenue DECIMAL;
BEGIN
    -- Calculate total revenue for percentage calculations
    SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
    FROM financial_transactions ft
    JOIN financial_accounts fa ON fa.id = ft.credit_account_id
    WHERE fa.account_type = 'revenue'
    AND ft.transaction_date BETWEEN p_start_date AND p_end_date;
    
    -- Return revenue accounts
    RETURN QUERY
    SELECT 
        fa.account_name,
        fa.account_type,
        COALESCE(SUM(ft.amount), 0) as amount,
        CASE WHEN v_total_revenue > 0 THEN (COALESCE(SUM(ft.amount), 0) / v_total_revenue) * 100 ELSE 0 END as percentage
    FROM financial_accounts fa
    LEFT JOIN financial_transactions ft ON (
        (fa.account_type = 'revenue' AND ft.credit_account_id = fa.id) OR
        (fa.account_type = 'expense' AND ft.debit_account_id = fa.id)
    )
    AND ft.transaction_date BETWEEN p_start_date AND p_end_date
    WHERE fa.account_type IN ('revenue', 'expense')
    GROUP BY fa.account_name, fa.account_type, fa.account_number
    ORDER BY fa.account_type DESC, fa.account_number;
END;
$$ LANGUAGE plpgsql;

-- Initialize Chart of Accounts
INSERT INTO financial_accounts (account_number, account_name, account_type, account_subtype, is_system_account) VALUES
-- Assets
('1001', 'Cash - Operating Account', 'asset', 'current_asset', TRUE),
('1002', 'Cash - Reserve Account', 'asset', 'current_asset', TRUE),
('1010', 'Accounts Receivable', 'asset', 'current_asset', TRUE),
('1020', 'Prepaid Expenses', 'asset', 'current_asset', TRUE),
('1500', 'Computer Equipment', 'asset', 'fixed_asset', TRUE),
('1510', 'Software Licenses', 'asset', 'fixed_asset', TRUE),

-- Liabilities
('2001', 'Accounts Payable', 'liability', 'current_liability', TRUE),
('2010', 'Accrued Expenses', 'liability', 'current_liability', TRUE),
('2020', 'VAT Payable', 'liability', 'current_liability', TRUE),
('2030', 'Income Tax Payable', 'liability', 'current_liability', TRUE),
('2100', 'Deferred Revenue', 'liability', 'current_liability', TRUE),

-- Equity
('3001', 'Share Capital', 'equity', 'equity', TRUE),
('3002', 'Retained Earnings', 'equity', 'equity', TRUE),

-- Revenue
('4001', 'Subscription Revenue', 'revenue', 'operating_revenue', TRUE),
('4002', 'Transaction Fee Revenue', 'revenue', 'operating_revenue', TRUE),
('4003', 'Withdrawal Fee Revenue', 'revenue', 'operating_revenue', TRUE),
('4010', 'Other Revenue', 'revenue', 'other_revenue', TRUE),

-- Expenses
('5001', 'Infrastructure Costs', 'expense', 'operating_expense', TRUE),
('5002', 'Payment Processing Fees', 'expense', 'operating_expense', TRUE),
('5010', 'Salaries - Admin', 'expense', 'personnel_expense', TRUE),
('5011', 'Salaries - Development', 'expense', 'personnel_expense', TRUE),
('5012', 'Salaries - Support', 'expense', 'personnel_expense', TRUE),
('5020', 'Marketing Expenses', 'expense', 'marketing_expense', TRUE),
('5030', 'Legal & Compliance', 'expense', 'administrative_expense', TRUE),
('5040', 'Office Expenses', 'expense', 'administrative_expense', TRUE),
('5050', 'Software Subscriptions', 'expense', 'technology_expense', TRUE),
('5060', 'Banking Fees', 'expense', 'financial_expense', TRUE);

-- Initialize recurring entries (example: monthly infrastructure costs)
INSERT INTO recurring_financial_entries (
    entry_name, entry_type, recurrence_pattern, recurrence_day,
    amount, debit_account_id, credit_account_id,
    start_date, next_generation_date, description
) VALUES (
    'Monthly Infrastructure Costs',
    'infrastructure_cost',
    'monthly',
    1,
    15000.00,
    (SELECT id FROM financial_accounts WHERE account_number = '5001'),
    (SELECT id FROM financial_accounts WHERE account_number = '1001'),
    CURRENT_DATE,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
    'Monthly server, database, and infrastructure costs'
);

-- RLS Policies
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

-- Only super admins and financial admins can access financial data
CREATE POLICY "financial_data_access" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_id = auth.uid() 
            AND role IN ('super_admin', 'financial_admin')
        )
    );

CREATE POLICY "financial_accounts_access" ON financial_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_id = auth.uid() 
            AND role IN ('super_admin', 'financial_admin')
        )
    );

CREATE POLICY "business_metrics_access" ON business_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_id = auth.uid() 
            AND role IN ('super_admin', 'admin_manager', 'financial_admin')
        )
    );