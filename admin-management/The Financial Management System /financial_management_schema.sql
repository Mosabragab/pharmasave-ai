-- 💰 PharmaSave AI V2: Financial Management & Business Intelligence System
-- Complete database schema for Super Admin financial management

-- ==============================================================================
-- 1. FINANCIAL MANAGEMENT ENUMS
-- ==============================================================================

-- Account types for chart of accounts
CREATE TYPE account_type AS ENUM (
  'asset',
  'liability', 
  'equity',
  'revenue',
  'expense'
);

-- Transaction types for financial records
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

-- Financial transaction status
CREATE TYPE financial_transaction_status AS ENUM (
  'pending',
  'completed',
  'cancelled',
  'failed'
);

-- Expense categories
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

-- ==============================================================================
-- 2. FINANCIAL CORE TABLES
-- ==============================================================================

-- Chart of Accounts (Professional Accounting Structure)
CREATE TABLE chart_of_accounts (
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
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type financial_transaction_type NOT NULL,
  status financial_transaction_status NOT NULL DEFAULT 'completed',
  
  -- References to source transactions
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
  created_by UUID, -- Reference to admin user
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly Revenue Recognition
CREATE TABLE monthly_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Revenue breakdown
  subscription_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  transaction_fee_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  withdrawal_fee_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  other_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Pharmacy metrics
  active_pharmacies INTEGER NOT NULL DEFAULT 0,
  new_pharmacies INTEGER NOT NULL DEFAULT 0,
  churned_pharmacies INTEGER NOT NULL DEFAULT 0,
  
  -- Transaction metrics
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
CREATE TABLE monthly_expenses (
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
CREATE TABLE business_kpis (
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
  
  -- Operational KPIs
  transaction_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  avg_transaction_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  pharmacy_utilization_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
  support_cost_per_pharmacy DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(calculation_date)
);

-- Expense Management
CREATE TABLE expense_entries (
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
  approved_by UUID, -- Reference to admin user
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
-- 3. FINANCIAL FUNCTIONS
-- ==============================================================================

-- Function to record subscription revenue
CREATE OR REPLACE FUNCTION record_subscription_revenue(
    p_pharmacy_id UUID,
    p_amount DECIMAL,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    revenue_account_id UUID;
    cash_account_id UUID;
BEGIN
    -- Get account IDs
    SELECT id INTO revenue_account_id FROM chart_of_accounts WHERE account_code = '4000-SUB';
    SELECT id INTO cash_account_id FROM chart_of_accounts WHERE account_code = '1100-CASH';
    
    -- Record financial transaction
    INSERT INTO financial_transactions (
        transaction_type,
        pharmacy_id,
        amount,
        debit_account_id,
        credit_account_id,
        description,
        metadata
    ) VALUES (
        'subscription_revenue',
        p_pharmacy_id,
        p_amount,
        cash_account_id,
        revenue_account_id,
        'Monthly subscription revenue',
        jsonb_build_object(
            'period_start', p_period_start,
            'period_end', p_period_end,
            'subscription_amount', p_amount
        )
    ) RETURNING id INTO transaction_id;
    
    -- Update MRR tracking
    PERFORM update_monthly_revenue_metrics();
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record transaction fees
CREATE OR REPLACE FUNCTION record_transaction_fee(
    p_transaction_id UUID,
    p_buyer_pharmacy_id UUID,
    p_seller_pharmacy_id UUID,
    p_fee_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    financial_transaction_id UUID;
    revenue_account_id UUID;
    cash_account_id UUID;
BEGIN
    -- Get account IDs
    SELECT id INTO revenue_account_id FROM chart_of_accounts WHERE account_code = '4100-FEES';
    SELECT id INTO cash_account_id FROM chart_of_accounts WHERE account_code = '1100-CASH';
    
    -- Record financial transaction
    INSERT INTO financial_transactions (
        transaction_type,
        marketplace_transaction_id,
        amount,
        debit_account_id,
        credit_account_id,
        description,
        metadata
    ) VALUES (
        'transaction_fee',
        p_transaction_id,
        p_fee_amount,
        cash_account_id,
        revenue_account_id,
        'Marketplace transaction fee',
        jsonb_build_object(
            'buyer_pharmacy_id', p_buyer_pharmacy_id,
            'seller_pharmacy_id', p_seller_pharmacy_id,
            'fee_amount', p_fee_amount
        )
    ) RETURNING id INTO financial_transaction_id;
    
    -- Update transaction metrics
    PERFORM update_monthly_revenue_metrics();
    
    RETURN financial_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update monthly revenue metrics
CREATE OR REPLACE FUNCTION update_monthly_revenue_metrics()
RETURNS VOID AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    sub_revenue DECIMAL := 0;
    fee_revenue DECIMAL := 0;
    withdrawal_revenue DECIMAL := 0;
    total_rev DECIMAL := 0;
    active_pharms INTEGER := 0;
    new_pharms INTEGER := 0;
    total_txns INTEGER := 0;
    total_txn_value DECIMAL := 0;
    avg_txn_value DECIMAL := 0;
    calculated_mrr DECIMAL := 0;
    calculated_arr DECIMAL := 0;
BEGIN
    -- Calculate subscription revenue for current month
    SELECT COALESCE(SUM(amount), 0) INTO sub_revenue
    FROM financial_transactions
    WHERE transaction_type = 'subscription_revenue'
    AND EXTRACT(YEAR FROM transaction_date) = current_year
    AND EXTRACT(MONTH FROM transaction_date) = current_month;
    
    -- Calculate transaction fee revenue for current month
    SELECT COALESCE(SUM(amount), 0) INTO fee_revenue
    FROM financial_transactions
    WHERE transaction_type = 'transaction_fee'
    AND EXTRACT(YEAR FROM transaction_date) = current_year
    AND EXTRACT(MONTH FROM transaction_date) = current_month;
    
    -- Calculate withdrawal fee revenue for current month
    SELECT COALESCE(SUM(amount), 0) INTO withdrawal_revenue
    FROM financial_transactions
    WHERE transaction_type = 'withdrawal_fee'
    AND EXTRACT(YEAR FROM transaction_date) = current_year
    AND EXTRACT(MONTH FROM transaction_date) = current_month;
    
    -- Calculate total revenue
    total_rev := sub_revenue + fee_revenue + withdrawal_revenue;
    
    -- Count active pharmacies (had any activity this month)
    SELECT COUNT(DISTINCT pharmacy_id) INTO active_pharms
    FROM financial_transactions
    WHERE EXTRACT(YEAR FROM transaction_date) = current_year
    AND EXTRACT(MONTH FROM transaction_date) = current_month;
    
    -- Count new pharmacies (created this month)
    SELECT COUNT(*) INTO new_pharms
    FROM pharmacies
    WHERE EXTRACT(YEAR FROM created_at) = current_year
    AND EXTRACT(MONTH FROM created_at) = current_month;
    
    -- Count total transactions this month
    SELECT COUNT(*) INTO total_txns
    FROM txn
    WHERE EXTRACT(YEAR FROM created_at) = current_year
    AND EXTRACT(MONTH FROM created_at) = current_month;
    
    -- Calculate total transaction value
    SELECT COALESCE(SUM(total_amount), 0) INTO total_txn_value
    FROM txn
    WHERE EXTRACT(YEAR FROM created_at) = current_year
    AND EXTRACT(MONTH FROM created_at) = current_month;
    
    -- Calculate average transaction value
    IF total_txns > 0 THEN
        avg_txn_value := total_txn_value / total_txns;
    END IF;
    
    -- Calculate MRR and ARR
    calculated_mrr := sub_revenue; -- Monthly subscription revenue
    calculated_arr := calculated_mrr * 12; -- Annual projection
    
    -- Insert or update monthly revenue record
    INSERT INTO monthly_revenue (
        year, month, subscription_revenue, transaction_fee_revenue,
        withdrawal_fee_revenue, total_revenue, active_pharmacies,
        new_pharmacies, total_transactions, total_transaction_value,
        avg_transaction_value, mrr, arr
    ) VALUES (
        current_year, current_month, sub_revenue, fee_revenue,
        withdrawal_revenue, total_rev, active_pharms,
        new_pharms, total_txns, total_txn_value,
        avg_txn_value, calculated_mrr, calculated_arr
    )
    ON CONFLICT (year, month) DO UPDATE SET
        subscription_revenue = EXCLUDED.subscription_revenue,
        transaction_fee_revenue = EXCLUDED.transaction_fee_revenue,
        withdrawal_fee_revenue = EXCLUDED.withdrawal_fee_revenue,
        total_revenue = EXCLUDED.total_revenue,
        active_pharmacies = EXCLUDED.active_pharmacies,
        new_pharmacies = EXCLUDED.new_pharmacies,
        total_transactions = EXCLUDED.total_transactions,
        total_transaction_value = EXCLUDED.total_transaction_value,
        avg_transaction_value = EXCLUDED.avg_transaction_value,
        mrr = EXCLUDED.mrr,
        arr = EXCLUDED.arr,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update business KPIs
CREATE OR REPLACE FUNCTION calculate_business_kpis()
RETURNS VOID AS $$
DECLARE
    current_mrr DECIMAL := 0;
    current_arr DECIMAL := 0;
    growth_rate DECIMAL := 0;
    avg_revenue_per_pharmacy DECIMAL := 0;
    churn_rate_calc DECIMAL := 0;
    ltv_calc DECIMAL := 0;
    cac_calc DECIMAL := 0;
    gross_margin_calc DECIMAL := 0;
    net_margin_calc DECIMAL := 0;
    cash_balance_calc DECIMAL := 0;
    burn_rate_calc DECIMAL := 0;
    runway_months INTEGER := 0;
    txn_volume DECIMAL := 0;
    avg_txn_val DECIMAL := 0;
    utilization_rate DECIMAL := 0;
    support_cost_calc DECIMAL := 0;
BEGIN
    -- Get current month's MRR
    SELECT COALESCE(mrr, 0) INTO current_mrr
    FROM monthly_revenue
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Calculate ARR
    current_arr := current_mrr * 12;
    
    -- Calculate revenue growth rate (vs previous month)
    SELECT COALESCE(
        ((current_mrr - LAG(mrr) OVER (ORDER BY year, month)) / NULLIF(LAG(mrr) OVER (ORDER BY year, month), 0)) * 100,
        0
    ) INTO growth_rate
    FROM monthly_revenue
    WHERE year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
    ORDER BY year DESC, month DESC
    LIMIT 1;
    
    -- Calculate average revenue per pharmacy
    SELECT COALESCE(current_mrr / NULLIF(COUNT(*), 0), 0) INTO avg_revenue_per_pharmacy
    FROM pharmacies
    WHERE verified = TRUE;
    
    -- Calculate churn rate (simplified - pharmacies that became inactive)
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'deactivated') * 100.0) / NULLIF(COUNT(*), 0),
        0
    ) INTO churn_rate_calc
    FROM pharmacies;
    
    -- Calculate LTV (simplified - average revenue per pharmacy / churn rate)
    IF churn_rate_calc > 0 THEN
        ltv_calc := (avg_revenue_per_pharmacy * 12) / (churn_rate_calc / 100);
    END IF;
    
    -- Calculate customer acquisition cost (marketing spend / new acquisitions)
    SELECT COALESCE(
        (SELECT SUM(amount) FROM expense_entries WHERE category = 'marketing' AND expense_date >= CURRENT_DATE - INTERVAL '30 days') /
        NULLIF((SELECT new_pharmacies FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)), 0),
        0
    ) INTO cac_calc;
    
    -- Calculate gross margin (revenue - direct costs / revenue)
    SELECT COALESCE(
        ((SELECT total_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) - 
         (SELECT COALESCE(infrastructure_costs + operations_costs, 0) FROM monthly_expenses WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE))) /
        NULLIF((SELECT total_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)), 0) * 100,
        0
    ) INTO gross_margin_calc;
    
    -- Calculate net profit margin
    SELECT COALESCE(
        ((SELECT total_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) - 
         (SELECT total_expenses FROM monthly_expenses WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE))) /
        NULLIF((SELECT total_revenue FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)), 0) * 100,
        0
    ) INTO net_margin_calc;
    
    -- Calculate cash balance (sum of all cash transactions)
    SELECT COALESCE(SUM(
        CASE 
            WHEN debit_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100-CASH') THEN amount
            WHEN credit_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100-CASH') THEN -amount
            ELSE 0
        END
    ), 0) INTO cash_balance_calc
    FROM financial_transactions;
    
    -- Calculate burn rate (monthly expenses)
    SELECT COALESCE(total_expenses, 0) INTO burn_rate_calc
    FROM monthly_expenses
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Calculate runway (cash balance / burn rate)
    IF burn_rate_calc > 0 THEN
        runway_months := FLOOR(cash_balance_calc / burn_rate_calc);
    END IF;
    
    -- Calculate transaction volume
    SELECT COALESCE(total_transaction_value, 0) INTO txn_volume
    FROM monthly_revenue
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Calculate average transaction value
    SELECT COALESCE(avg_transaction_value, 0) INTO avg_txn_val
    FROM monthly_revenue
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Calculate pharmacy utilization rate (active vs total verified)
    SELECT COALESCE(
        (SELECT active_pharmacies FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) * 100.0 /
        NULLIF(COUNT(*), 0),
        0
    ) INTO utilization_rate
    FROM pharmacies
    WHERE verified = TRUE;
    
    -- Calculate support cost per pharmacy
    SELECT COALESCE(
        (SELECT SUM(amount) FROM expense_entries WHERE category = 'customer_support' AND expense_date >= CURRENT_DATE - INTERVAL '30 days') /
        NULLIF(COUNT(*), 0),
        0
    ) INTO support_cost_calc
    FROM pharmacies
    WHERE verified = TRUE;
    
    -- Insert or update KPIs
    INSERT INTO business_kpis (
        calculation_date, mrr, arr, revenue_growth_rate, arpp,
        new_pharmacy_acquisitions, churn_rate, customer_ltv, customer_cac,
        gross_margin, net_profit_margin, cash_balance, burn_rate, cash_runway_months,
        transaction_volume, avg_transaction_value, pharmacy_utilization_rate, support_cost_per_pharmacy
    ) VALUES (
        CURRENT_DATE, current_mrr, current_arr, growth_rate, avg_revenue_per_pharmacy,
        (SELECT COALESCE(new_pharmacies, 0) FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)),
        churn_rate_calc, ltv_calc, cac_calc,
        gross_margin_calc, net_margin_calc, cash_balance_calc, burn_rate_calc, runway_months,
        txn_volume, avg_txn_val, utilization_rate, support_cost_calc
    )
    ON CONFLICT (calculation_date) DO UPDATE SET
        mrr = EXCLUDED.mrr,
        arr = EXCLUDED.arr,
        revenue_growth_rate = EXCLUDED.revenue_growth_rate,
        arpp = EXCLUDED.arpp,
        new_pharmacy_acquisitions = EXCLUDED.new_pharmacy_acquisitions,
        churn_rate = EXCLUDED.churn_rate,
        customer_ltv = EXCLUDED.customer_ltv,
        customer_cac = EXCLUDED.customer_cac,
        gross_margin = EXCLUDED.gross_margin,
        net_profit_margin = EXCLUDED.net_profit_margin,
        cash_balance = EXCLUDED.cash_balance,
        burn_rate = EXCLUDED.burn_rate,
        cash_runway_months = EXCLUDED.cash_runway_months,
        transaction_volume = EXCLUDED.transaction_volume,
        avg_transaction_value = EXCLUDED.avg_transaction_value,
        pharmacy_utilization_rate = EXCLUDED.pharmacy_utilization_rate,
        support_cost_per_pharmacy = EXCLUDED.support_cost_per_pharmacy,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. VIEWS FOR EASY ACCESS
-- ==============================================================================

-- Financial KPIs view for dashboard
CREATE OR REPLACE VIEW financial_kpis AS
SELECT 
    -- Current month revenue
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
    
    -- Pharmacy metrics
    (SELECT COUNT(*) FROM pharmacies WHERE verified = TRUE) as total_verified_pharmacies,
    (SELECT active_pharmacies FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as active_pharmacies,
    (SELECT new_pharmacies FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as new_pharmacies_this_month,
    
    -- Transaction metrics
    (SELECT total_transactions FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as transactions_this_month,
    (SELECT avg_transaction_value FROM monthly_revenue WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE)) as avg_transaction_value;

-- ==============================================================================
-- 5. TRIGGERS AND AUTOMATION
-- ==============================================================================

-- Trigger to automatically record subscription revenue
CREATE OR REPLACE FUNCTION trigger_record_subscription_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Record subscription revenue when pharmacy payment is processed
    IF NEW.subscription_status = 'active' AND OLD.subscription_status != 'active' THEN
        PERFORM record_subscription_revenue(
            NEW.id,
            999.00, -- Monthly subscription amount
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pharmacy_subscription_payment
    AFTER UPDATE ON pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_record_subscription_payment();

-- Trigger to automatically record transaction fees
CREATE OR REPLACE FUNCTION trigger_record_transaction_fee()
RETURNS TRIGGER AS $$
BEGIN
    -- Record transaction fee when marketplace transaction is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM record_transaction_fee(
            NEW.id,
            NEW.buyer_pharmacy_id,
            NEW.seller_pharmacy_id,
            NEW.platform_fee
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_transaction_fee
    AFTER UPDATE ON txn
    FOR EACH ROW
    EXECUTE FUNCTION trigger_record_transaction_fee();

-- ==============================================================================
-- 6. INITIAL DATA SETUP
-- ==============================================================================

-- Initialize Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
-- Assets
('1100-CASH', 'Cash and Cash Equivalents', 'asset', 'Main operating cash account'),
('1200-AR', 'Accounts Receivable', 'asset', 'Outstanding customer payments'),
('1300-PREPAID', 'Prepaid Expenses', 'asset', 'Prepaid operational expenses'),

-- Liabilities
('2100-AP', 'Accounts Payable', 'liability', 'Outstanding vendor payments'),
('2200-ACCRUED', 'Accrued Liabilities', 'liability', 'Accrued but unpaid expenses'),

-- Equity
('3100-EQUITY', 'Owner Equity', 'equity', 'Owner/investor equity'),
('3200-RETAINED', 'Retained Earnings', 'equity', 'Accumulated earnings'),

-- Revenue
('4000-SUB', 'Subscription Revenue', 'revenue', 'Monthly pharmacy subscriptions'),
('4100-FEES', 'Transaction Fee Revenue', 'revenue', 'Marketplace transaction fees'),
('4200-WITHDRAWAL', 'Withdrawal Fee Revenue', 'revenue', 'Wallet withdrawal processing fees'),
('4900-OTHER', 'Other Revenue', 'revenue', 'Miscellaneous revenue'),

-- Expenses
('5100-INFRA', 'Infrastructure Costs', 'expense', 'Servers, hosting, cloud services'),
('5200-PERSONNEL', 'Personnel Costs', 'expense', 'Salaries, benefits, contractors'),
('5300-MARKETING', 'Marketing Expenses', 'expense', 'Advertising, promotions, events'),
('5400-OPERATIONS', 'Operations Expenses', 'expense', 'General operating expenses'),
('5500-LEGAL', 'Legal and Professional', 'expense', 'Legal fees, accounting, consulting'),
('5600-FINANCE', 'Finance Costs', 'expense', 'Banking fees, payment processing'),
('5700-RD', 'Research and Development', 'expense', 'Product development, innovation'),
('5800-SUPPORT', 'Customer Support', 'expense', 'Support team costs, tools'),
('5900-OTHER', 'Other Expenses', 'expense', 'Miscellaneous business expenses')
ON CONFLICT (account_code) DO NOTHING;

-- Initialize current month revenue and expense records
INSERT INTO monthly_revenue (year, month) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE))
ON CONFLICT (year, month) DO NOTHING;

INSERT INTO monthly_expenses (year, month) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE))
ON CONFLICT (year, month) DO NOTHING;

-- Create initial KPI calculation
SELECT calculate_business_kpis();

-- ==============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_pharmacy ON financial_transactions (pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_year_month ON monthly_revenue (year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_year_month ON monthly_expenses (year, month);
CREATE INDEX IF NOT EXISTS idx_business_kpis_date ON business_kpis (calculation_date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON expense_entries (expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON expense_entries (category);

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================

SELECT '🎉 Financial Management System installed successfully! Ready for comprehensive business intelligence.' as status;