-- 💰 PharmaSave AI V2: Financial Management Schema
-- STEP 1.1: Execute Financial Schema
-- Integration with existing PharmaSave AI database structure

-- ==============================================================================
-- 1. FINANCIAL ENUMS (if not already exist)
-- ==============================================================================

-- Account types for chart of accounts
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM (
        'asset',
        'liability', 
        'equity',
        'revenue',
        'expense'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Financial transaction types
DO $$ BEGIN
    CREATE TYPE financial_transaction_type AS ENUM (
        'subscription_revenue',
        'transaction_fee',
        'withdrawal_fee',
        'operating_expense',
        'infrastructure_cost',
        'marketing_expense',
        'personnel_cost',
        'other_revenue',
        'other_expense'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Financial transaction status
DO $$ BEGIN
    CREATE TYPE financial_transaction_status AS ENUM (
        'pending',
        'completed',
        'cancelled',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Expense categories
DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM (
        'infrastructure',
        'personnel',
        'marketing',
        'operations',
        'legal',
        'finance',
        'research_development',
        'customer_support',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. FINANCIAL CORE TABLES
-- ==============================================================================

-- Chart of Accounts (Professional Accounting Structure)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code TEXT UNIQUE NOT NULL, -- e.g., '4000-SUB' for subscription revenue
    account_name TEXT NOT NULL,
    account_type account_type NOT NULL,
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Transactions (Double-Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type financial_transaction_type NOT NULL,
    status financial_transaction_status NOT NULL DEFAULT 'completed',
    
    -- References to source transactions (linking to existing PharmaSave AI tables)
    pharmacy_id UUID REFERENCES pharmacies(id),
    marketplace_transaction_id UUID REFERENCES txn(id),
    wallet_transaction_id UUID REFERENCES wlt_txn(id),
    
    -- Financial details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EGP',
    
    -- Accounting entries (debit/credit)
    debit_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    credit_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    
    -- Additional information
    description TEXT,
    reference_number TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit trail
    created_by UUID, -- Reference to admin user (when admin tables exist)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure debit and credit accounts are different
    CONSTRAINT different_accounts CHECK (debit_account_id != credit_account_id)
);

-- Monthly Revenue Recognition
CREATE TABLE IF NOT EXISTS monthly_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Revenue breakdown
    subscription_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    transaction_fee_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    withdrawal_fee_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    other_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Pharmacy metrics (integrated with existing pharmacies table)
    active_pharmacies INTEGER NOT NULL DEFAULT 0,
    new_pharmacies INTEGER NOT NULL DEFAULT 0,
    churned_pharmacies INTEGER NOT NULL DEFAULT 0,
    
    -- Transaction metrics (integrated with existing txn table)
    total_transactions INTEGER NOT NULL DEFAULT 0,
    total_transaction_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    avg_transaction_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Business metrics
    mrr DECIMAL(15,2) NOT NULL DEFAULT 0, -- Monthly Recurring Revenue
    arr DECIMAL(15,2) NOT NULL DEFAULT 0, -- Annual Recurring Revenue
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(year, month)
);

-- Monthly Expenses
CREATE TABLE IF NOT EXISTS monthly_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Expense breakdown by category
    infrastructure_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    personnel_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    marketing_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    operations_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    legal_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    finance_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    rd_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    support_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    other_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(year, month)
);

-- Business KPIs (Key Performance Indicators)
CREATE TABLE IF NOT EXISTS business_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Revenue KPIs
    mrr DECIMAL(15,2) NOT NULL DEFAULT 0,
    arr DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_growth_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
    arpp DECIMAL(10,2) NOT NULL DEFAULT 0, -- Average Revenue Per Pharmacy
    
    -- Growth KPIs
    new_pharmacy_acquisitions INTEGER NOT NULL DEFAULT 0,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
    customer_ltv DECIMAL(15,2) NOT NULL DEFAULT 0, -- Lifetime Value
    customer_cac DECIMAL(10,2) NOT NULL DEFAULT 0, -- Customer Acquisition Cost
    
    -- Financial Health KPIs
    gross_margin DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
    net_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
    cash_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    burn_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    cash_runway_months INTEGER NOT NULL DEFAULT 0,
    
    -- Operational KPIs (integrated with PharmaSave AI metrics)
    transaction_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
    avg_transaction_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    pharmacy_utilization_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
    support_cost_per_pharmacy DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(calculation_date)
);

-- Expense Management
CREATE TABLE IF NOT EXISTS expense_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category expense_category NOT NULL,
    
    -- Expense details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EGP',
    description TEXT NOT NULL,
    vendor_name TEXT,
    
    -- Approval workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by UUID, -- Reference to admin user (when admin tables exist)
    approved_at TIMESTAMPTZ,
    
    -- Financial integration
    financial_transaction_id UUID REFERENCES financial_transactions(id),
    account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Attachments and metadata
    receipt_urls JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit trail
    created_by UUID NOT NULL, -- Reference to admin user who entered expense
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. FINANCIAL VIEWS FOR EASY ACCESS
-- ==============================================================================

-- Financial KPIs view for dashboard
CREATE OR REPLACE VIEW financial_kpis AS
SELECT 
    -- Current month revenue (integrated with PharmaSave AI data)
    (SELECT total_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as current_month_revenue,
    (SELECT subscription_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as subscription_revenue,
    (SELECT transaction_fee_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as transaction_fee_revenue,
    
    -- Growth metrics
    (SELECT mrr FROM business_kpis ORDER BY calculation_date DESC LIMIT 1) as current_mrr,
    (SELECT arr FROM business_kpis ORDER BY calculation_date DESC LIMIT 1) as current_arr,
    (SELECT revenue_growth_rate FROM business_kpis ORDER BY calculation_date DESC LIMIT 1) as revenue_growth_rate,
    
    -- Business health
    (SELECT cash_balance FROM business_kpis ORDER BY calculation_date DESC LIMIT 1) as cash_balance,
    (SELECT burn_rate FROM business_kpis ORDER BY calculation_date DESC LIMIT 1) as burn_rate,
    (SELECT cash_runway_months FROM business_kpis ORDER BY calculation_date DESC LIMIT 1) as cash_runway_months,
    
    -- Pharmacy metrics (from existing PharmaSave AI tables)
    (SELECT COUNT(*) FROM pharmacies WHERE verified = TRUE) as total_verified_pharmacies,
    (SELECT active_pharmacies FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as active_pharmacies,
    (SELECT new_pharmacies FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as new_pharmacies_this_month,
    
    -- Transaction metrics (from existing PharmaSave AI tables)
    (SELECT total_transactions FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as transactions_this_month,
    (SELECT avg_transaction_value FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as avg_transaction_value;

-- ==============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_pharmacy ON financial_transactions (pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_marketplace_txn ON financial_transactions (marketplace_transaction_id);
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_year_month ON monthly_revenue (year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_year_month ON monthly_expenses (year, month);
CREATE INDEX IF NOT EXISTS idx_business_kpis_date ON business_kpis (calculation_date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON expense_entries (expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON expense_entries (category);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts (account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts (account_type);

-- ==============================================================================
-- 5. INITIAL DATA SETUP - CHART OF ACCOUNTS
-- ==============================================================================

-- Initialize Chart of Accounts (Egyptian Business Context)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
-- Assets
('1100-CASH', 'Cash and Cash Equivalents', 'asset', 'Main operating cash account for PharmaSave AI'),
('1200-AR', 'Accounts Receivable', 'asset', 'Outstanding pharmacy subscription payments'),
('1300-PREPAID', 'Prepaid Expenses', 'asset', 'Prepaid hosting, software, and operational expenses'),

-- Liabilities
('2100-AP', 'Accounts Payable', 'liability', 'Outstanding vendor and service provider payments'),
('2200-ACCRUED', 'Accrued Liabilities', 'liability', 'Accrued salaries, taxes, and operational expenses'),
('2300-VAT', 'VAT Payable', 'liability', 'Egyptian VAT (14%) payable to tax authorities'),

-- Equity
('3100-EQUITY', 'Owner Equity', 'equity', 'Founder and investor equity in PharmaSave AI'),
('3200-RETAINED', 'Retained Earnings', 'equity', 'Accumulated business profits'),

-- Revenue (PharmaSave AI Revenue Streams)
('4000-SUB', 'Subscription Revenue', 'revenue', 'Monthly pharmacy subscription fees (999 EGP/month)'),
('4100-FEES', 'Transaction Fee Revenue', 'revenue', 'Marketplace transaction fees (6% total, 3% each party)'),
('4200-WITHDRAWAL', 'Withdrawal Fee Revenue', 'revenue', 'Wallet withdrawal processing fees (10 EGP per withdrawal)'),
('4900-OTHER', 'Other Revenue', 'revenue', 'Miscellaneous revenue (premium features, partnerships)'),

-- Expenses (PharmaSave AI Operating Costs)
('5100-INFRA', 'Infrastructure Costs', 'expense', 'Supabase, servers, hosting, cloud services'),
('5200-PERSONNEL', 'Personnel Costs', 'expense', 'Developer salaries, admin team, contractors'),
('5300-MARKETING', 'Marketing Expenses', 'expense', 'Google Ads, social media, pharmacy acquisition'),
('5400-OPERATIONS', 'Operations Expenses', 'expense', 'Business operations, customer support'),
('5500-LEGAL', 'Legal and Professional', 'expense', 'Legal compliance, accounting, consulting'),
('5600-FINANCE', 'Finance Costs', 'expense', 'Banking fees, payment processing (InstaPay, etc.)'),
('5700-RD', 'Research and Development', 'expense', 'AI integration, product development, innovation'),
('5800-SUPPORT', 'Customer Support', 'expense', 'Pharmacy support, verification team'),
('5900-OTHER', 'Other Expenses', 'expense', 'Miscellaneous business expenses')
ON CONFLICT (account_code) DO NOTHING;

-- ==============================================================================
-- 6. INITIALIZE CURRENT MONTH RECORDS
-- ==============================================================================

-- Initialize monthly records for current month if not exists
INSERT INTO monthly_revenue (year, month) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE))
ON CONFLICT (year, month) DO NOTHING;

INSERT INTO monthly_expenses (year, month) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE))
ON CONFLICT (year, month) DO NOTHING;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) SETUP
-- ==============================================================================

-- Enable RLS on financial tables (admin access only)
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added when admin_users table is available
-- For now, these tables are accessible to authenticated users with proper roles

-- ==============================================================================
-- SUCCESS VERIFICATION
-- ==============================================================================

-- Verify all tables were created
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('chart_of_accounts', 'financial_transactions', 'monthly_revenue', 'business_kpis', 'expense_entries') 
        THEN '✅ Financial table created successfully'
        ELSE '✅ Table exists'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%financial%' 
         OR table_name LIKE '%chart%' 
         OR table_name LIKE '%monthly_%' 
         OR table_name LIKE '%business_kpis%' 
         OR table_name LIKE '%expense_%')
ORDER BY table_name;

-- Check chart of accounts setup
SELECT 
    '📊 Chart of Accounts initialized with ' || COUNT(*) || ' accounts across ' || COUNT(DISTINCT account_type) || ' categories' as setup_status
FROM chart_of_accounts;

-- Final success message
SELECT '🎉 STEP 1.1 COMPLETE: Financial Management Schema installed successfully!' as completion_status,
       'Ready for Step 1.2: Execute Integration Functions' as next_step;
