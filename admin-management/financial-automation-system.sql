-- PharmaSave AI V2: Financial Automation & Integration System
-- Automated financial tracking, revenue recognition, and reporting

-- Function to automatically record subscription revenue
CREATE OR REPLACE FUNCTION record_subscription_revenue(
    p_pharmacy_id UUID,
    p_amount DECIMAL,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_cash_account_id UUID;
    v_revenue_account_id UUID;
BEGIN
    -- Get account IDs
    SELECT id INTO v_cash_account_id FROM financial_accounts WHERE account_number = '1001'; -- Cash
    SELECT id INTO v_revenue_account_id FROM financial_accounts WHERE account_number = '4001'; -- Subscription Revenue
    
    -- Record the revenue transaction
    INSERT INTO financial_transactions (
        transaction_type,
        amount,
        debit_account_id,
        credit_account_id,
        pharmacy_id,
        description,
        revenue_period
    ) VALUES (
        'subscription_revenue',
        p_amount,
        v_cash_account_id,
        v_revenue_account_id,
        p_pharmacy_id,
        'Subscription revenue for period ' || p_period_start || ' to ' || p_period_end,
        p_period_start
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically record transaction fees
CREATE OR REPLACE FUNCTION record_transaction_fee(
    p_marketplace_transaction_id UUID,
    p_buyer_pharmacy_id UUID,
    p_seller_pharmacy_id UUID,
    p_total_fee DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_cash_account_id UUID;
    v_revenue_account_id UUID;
BEGIN
    -- Get account IDs
    SELECT id INTO v_cash_account_id FROM financial_accounts WHERE account_number = '1001'; -- Cash
    SELECT id INTO v_revenue_account_id FROM financial_accounts WHERE account_number = '4002'; -- Transaction Fee Revenue
    
    -- Record the transaction fee revenue
    INSERT INTO financial_transactions (
        transaction_type,
        amount,
        debit_account_id,
        credit_account_id,
        marketplace_transaction_id,
        description,
        revenue_status
    ) VALUES (
        'transaction_fee_revenue',
        p_total_fee,
        v_cash_account_id,
        v_revenue_account_id,
        p_marketplace_transaction_id,
        'Transaction fee from marketplace transaction',
        'recognized'
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record withdrawal processing fees
CREATE OR REPLACE FUNCTION record_withdrawal_fee(
    p_withdrawal_request_id UUID,
    p_pharmacy_id UUID,
    p_fee_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_cash_account_id UUID;
    v_revenue_account_id UUID;
BEGIN
    -- Get account IDs
    SELECT id INTO v_cash_account_id FROM financial_accounts WHERE account_number = '1001'; -- Cash
    SELECT id INTO v_revenue_account_id FROM financial_accounts WHERE account_number = '4003'; -- Withdrawal Fee Revenue
    
    -- Record the withdrawal fee revenue
    INSERT INTO financial_transactions (
        transaction_type,
        amount,
        debit_account_id,
        credit_account_id,
        withdrawal_request_id,
        pharmacy_id,
        description,
        revenue_status
    ) VALUES (
        'withdrawal_fee_revenue',
        p_fee_amount,
        v_cash_account_id,
        v_revenue_account_id,
        p_withdrawal_request_id,
        p_pharmacy_id,
        'Withdrawal processing fee',
        'recognized'
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically calculate and record monthly business metrics
CREATE OR REPLACE FUNCTION calculate_and_record_monthly_metrics()
RETURNS TEXT AS $$
DECLARE
    v_current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    v_current_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    v_previous_month_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
    v_previous_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
    
    -- Business metrics variables
    v_mrr DECIMAL;
    v_previous_mrr DECIMAL;
    v_total_revenue DECIMAL;
    v_total_expenses DECIMAL;
    v_net_profit DECIMAL;
    v_total_pharmacies INTEGER;
    v_active_pharmacies INTEGER;
    v_new_pharmacies INTEGER;
    v_churned_pharmacies INTEGER;
    v_transaction_count INTEGER;
    v_transaction_volume DECIMAL;
    v_avg_transaction_value DECIMAL;
    v_customer_acquisition_cost DECIMAL;
    v_lifetime_value DECIMAL;
    
    v_metrics_recorded INTEGER := 0;
BEGIN
    -- Calculate Monthly Recurring Revenue (MRR)
    SELECT COALESCE(SUM(amount), 0) INTO v_mrr
    FROM financial_transactions
    WHERE transaction_type = 'subscription_revenue'
    AND transaction_date BETWEEN v_current_month_start AND v_current_month_end;
    
    -- Previous month MRR
    SELECT COALESCE(SUM(amount), 0) INTO v_previous_mrr
    FROM financial_transactions
    WHERE transaction_type = 'subscription_revenue'
    AND transaction_date BETWEEN v_previous_month_start AND v_previous_month_end;
    
    -- Total Revenue
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
    FROM financial_transactions
    WHERE transaction_type IN ('subscription_revenue', 'transaction_fee_revenue', 'withdrawal_fee_revenue')
    AND transaction_date BETWEEN v_current_month_start AND v_current_month_end;
    
    -- Total Expenses
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM financial_transactions
    WHERE transaction_type IN ('infrastructure_cost', 'admin_salary', 'marketing_expense', 'development_cost', 'legal_compliance', 'office_rent', 'software_licenses', 'bank_charges')
    AND transaction_date BETWEEN v_current_month_start AND v_current_month_end;
    
    -- Net Profit
    v_net_profit := v_total_revenue - v_total_expenses;
    
    -- Pharmacy Metrics
    SELECT COUNT(*) INTO v_total_pharmacies FROM pharmacies;
    SELECT COUNT(*) INTO v_active_pharmacies FROM pharmacies WHERE verified = TRUE;
    
    SELECT COUNT(*) INTO v_new_pharmacies
    FROM pharmacies
    WHERE created_at::DATE BETWEEN v_current_month_start AND v_current_month_end;
    
    -- Transaction Metrics
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0), COALESCE(AVG(total_amount), 0)
    INTO v_transaction_count, v_transaction_volume, v_avg_transaction_value
    FROM txn
    WHERE created_at::DATE BETWEEN v_current_month_start AND v_current_month_end
    AND status = 'completed';
    
    -- Calculate Customer Acquisition Cost (CAC)
    SELECT COALESCE(SUM(amount), 0) / NULLIF(v_new_pharmacies, 0) INTO v_customer_acquisition_cost
    FROM financial_transactions
    WHERE transaction_type = 'marketing_expense'
    AND transaction_date BETWEEN v_current_month_start AND v_current_month_end;
    
    -- Estimate Customer Lifetime Value (LTV) - simplified calculation
    v_lifetime_value := v_mrr / NULLIF(v_active_pharmacies, 0) * 24; -- Assuming 24 month average lifetime
    
    -- Insert/Update business metrics
    INSERT INTO business_metrics (metric_name, metric_category, period_type, period_start, period_end, metric_value, metric_units, previous_period_value)
    VALUES 
        ('Monthly Recurring Revenue', 'revenue', 'monthly', v_current_month_start, v_current_month_end, v_mrr, 'EGP', v_previous_mrr),
        ('Total Revenue', 'revenue', 'monthly', v_current_month_start, v_current_month_end, v_total_revenue, 'EGP', NULL),
        ('Total Expenses', 'financial', 'monthly', v_current_month_start, v_current_month_end, v_total_expenses, 'EGP', NULL),
        ('Net Profit', 'financial', 'monthly', v_current_month_start, v_current_month_end, v_net_profit, 'EGP', NULL),
        ('Total Pharmacies', 'growth', 'monthly', v_current_month_start, v_current_month_end, v_total_pharmacies, 'count', NULL),
        ('Active Pharmacies', 'growth', 'monthly', v_current_month_start, v_current_month_end, v_active_pharmacies, 'count', NULL),
        ('New Pharmacies', 'growth', 'monthly', v_current_month_start, v_current_month_end, v_new_pharmacies, 'count', NULL),
        ('Transaction Count', 'engagement', 'monthly', v_current_month_start, v_current_month_end, v_transaction_count, 'count', NULL),
        ('Transaction Volume', 'revenue', 'monthly', v_current_month_start, v_current_month_end, v_transaction_volume, 'EGP', NULL),
        ('Average Transaction Value', 'engagement', 'monthly', v_current_month_start, v_current_month_end, v_avg_transaction_value, 'EGP', NULL),
        ('Customer Acquisition Cost', 'financial', 'monthly', v_current_month_start, v_current_month_end, COALESCE(v_customer_acquisition_cost, 0), 'EGP', NULL),
        ('Customer Lifetime Value', 'financial', 'monthly', v_current_month_start, v_current_month_end, COALESCE(v_lifetime_value, 0), 'EGP', NULL)
    ON CONFLICT (metric_name, period_type, period_start, period_end) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        previous_period_value = EXCLUDED.previous_period_value,
        updated_at = NOW();
    
    GET DIAGNOSTICS v_metrics_recorded = ROW_COUNT;
    
    RETURN 'Successfully calculated and recorded ' || v_metrics_recorded || ' monthly business metrics';
END;
$$ LANGUAGE plpgsql;

-- Function to generate comprehensive financial dashboard data
CREATE OR REPLACE FUNCTION get_financial_dashboard_data(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    -- Revenue Metrics
    total_revenue DECIMAL,
    subscription_revenue DECIMAL,
    transaction_fee_revenue DECIMAL,
    withdrawal_fee_revenue DECIMAL,
    revenue_growth_rate DECIMAL,
    
    -- Expense Metrics
    total_expenses DECIMAL,
    infrastructure_expenses DECIMAL,
    personnel_expenses DECIMAL,
    marketing_expenses DECIMAL,
    admin_expenses DECIMAL,
    
    -- Profitability
    gross_profit DECIMAL,
    net_profit DECIMAL,
    profit_margin DECIMAL,
    
    -- Business Metrics
    total_pharmacies INTEGER,
    active_pharmacies INTEGER,
    new_pharmacies INTEGER,
    churn_rate DECIMAL,
    
    -- Transaction Metrics
    total_transactions INTEGER,
    transaction_volume DECIMAL,
    avg_transaction_value DECIMAL,
    
    -- Financial Health
    cash_balance DECIMAL,
    accounts_receivable DECIMAL,
    accounts_payable DECIMAL,
    current_ratio DECIMAL
) AS $$
DECLARE
    v_start_date DATE := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE));
    v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
    
    -- Revenue variables
    v_total_revenue DECIMAL;
    v_subscription_revenue DECIMAL;
    v_transaction_fee_revenue DECIMAL;
    v_withdrawal_fee_revenue DECIMAL;
    v_revenue_growth_rate DECIMAL;
    
    -- Expense variables
    v_total_expenses DECIMAL;
    v_infrastructure_expenses DECIMAL;
    v_personnel_expenses DECIMAL;
    v_marketing_expenses DECIMAL;
    v_admin_expenses DECIMAL;
    
    -- Other variables
    v_gross_profit DECIMAL;
    v_net_profit DECIMAL;
    v_profit_margin DECIMAL;
    v_total_pharmacies INTEGER;
    v_active_pharmacies INTEGER;
    v_new_pharmacies INTEGER;
    v_churn_rate DECIMAL;
    v_total_transactions INTEGER;
    v_transaction_volume DECIMAL;
    v_avg_transaction_value DECIMAL;
    v_cash_balance DECIMAL;
    v_accounts_receivable DECIMAL;
    v_accounts_payable DECIMAL;
    v_current_ratio DECIMAL;
BEGIN
    -- Calculate Revenue Metrics
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'subscription_revenue' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'transaction_fee_revenue' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal_fee_revenue' THEN amount ELSE 0 END), 0)
    INTO v_subscription_revenue, v_transaction_fee_revenue, v_withdrawal_fee_revenue
    FROM financial_transactions
    WHERE transaction_type IN ('subscription_revenue', 'transaction_fee_revenue', 'withdrawal_fee_revenue')
    AND transaction_date BETWEEN v_start_date AND v_end_date;
    
    v_total_revenue := v_subscription_revenue + v_transaction_fee_revenue + v_withdrawal_fee_revenue;
    
    -- Calculate Expense Metrics
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'infrastructure_cost' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type IN ('admin_salary') THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'marketing_expense' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type IN ('office_rent', 'legal_compliance', 'software_licenses') THEN amount ELSE 0 END), 0)
    INTO v_infrastructure_expenses, v_personnel_expenses, v_marketing_expenses, v_admin_expenses
    FROM financial_transactions
    WHERE transaction_type IN ('infrastructure_cost', 'admin_salary', 'marketing_expense', 'office_rent', 'legal_compliance', 'software_licenses')
    AND transaction_date BETWEEN v_start_date AND v_end_date;
    
    v_total_expenses := v_infrastructure_expenses + v_personnel_expenses + v_marketing_expenses + v_admin_expenses;
    
    -- Calculate Profitability
    v_gross_profit := v_total_revenue;
    v_net_profit := v_total_revenue - v_total_expenses;
    v_profit_margin := CASE WHEN v_total_revenue > 0 THEN (v_net_profit / v_total_revenue) * 100 ELSE 0 END;
    
    -- Calculate Business Metrics
    SELECT COUNT(*) INTO v_total_pharmacies FROM pharmacies;
    SELECT COUNT(*) INTO v_active_pharmacies FROM pharmacies WHERE verified = TRUE;
    SELECT COUNT(*) INTO v_new_pharmacies FROM pharmacies WHERE created_at::DATE BETWEEN v_start_date AND v_end_date;
    
    -- Calculate churn rate (simplified)
    v_churn_rate := 2.5; -- Placeholder - would calculate from subscription cancellations
    
    -- Calculate Transaction Metrics
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0), COALESCE(AVG(total_amount), 0)
    INTO v_total_transactions, v_transaction_volume, v_avg_transaction_value
    FROM txn
    WHERE created_at::DATE BETWEEN v_start_date AND v_end_date
    AND status = 'completed';
    
    -- Calculate Financial Health Metrics
    SELECT COALESCE(current_balance, 0) INTO v_cash_balance 
    FROM financial_accounts WHERE account_number = '1001'; -- Cash account
    
    SELECT COALESCE(current_balance, 0) INTO v_accounts_receivable 
    FROM financial_accounts WHERE account_number = '1010'; -- AR account
    
    SELECT COALESCE(current_balance, 0) INTO v_accounts_payable 
    FROM financial_accounts WHERE account_number = '2001'; -- AP account
    
    -- Calculate current ratio (simplified)
    v_current_ratio := CASE WHEN v_accounts_payable > 0 THEN (v_cash_balance + v_accounts_receivable) / v_accounts_payable ELSE 0 END;
    
    -- Return all calculated metrics
    RETURN QUERY SELECT
        v_total_revenue, v_subscription_revenue, v_transaction_fee_revenue, v_withdrawal_fee_revenue, v_revenue_growth_rate,
        v_total_expenses, v_infrastructure_expenses, v_personnel_expenses, v_marketing_expenses, v_admin_expenses,
        v_gross_profit, v_net_profit, v_profit_margin,
        v_total_pharmacies, v_active_pharmacies, v_new_pharmacies, v_churn_rate,
        v_total_transactions, v_transaction_volume, v_avg_transaction_value,
        v_cash_balance, v_accounts_receivable, v_accounts_payable, v_current_ratio;
END;
$$ LANGUAGE plpgsql;

-- Function to generate automated financial reports
CREATE OR REPLACE FUNCTION generate_automated_financial_report(
    p_report_type TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_report JSONB := '{}'::jsonb;
    v_income_statement JSONB := '[]'::jsonb;
    v_balance_sheet JSONB := '[]'::jsonb;
    v_cash_flow JSONB := '[]'::jsonb;
    v_line_item JSONB;
    v_account_record RECORD;
BEGIN
    CASE p_report_type
        WHEN 'income_statement' THEN
            -- Generate Income Statement
            FOR v_account_record IN 
                SELECT 
                    fa.account_name,
                    fa.account_type,
                    COALESCE(SUM(CASE 
                        WHEN fa.account_type = 'revenue' THEN ft.amount 
                        WHEN fa.account_type = 'expense' THEN ft.amount 
                        ELSE 0 
                    END), 0) as amount
                FROM financial_accounts fa
                LEFT JOIN financial_transactions ft ON (
                    (fa.account_type = 'revenue' AND ft.credit_account_id = fa.id) OR
                    (fa.account_type = 'expense' AND ft.debit_account_id = fa.id)
                )
                AND ft.transaction_date BETWEEN p_start_date AND p_end_date
                WHERE fa.account_type IN ('revenue', 'expense')
                GROUP BY fa.account_name, fa.account_type, fa.account_number
                ORDER BY fa.account_type DESC, fa.account_number
            LOOP
                v_line_item := jsonb_build_object(
                    'account_name', v_account_record.account_name,
                    'account_type', v_account_record.account_type,
                    'amount', v_account_record.amount
                );
                v_income_statement := v_income_statement || v_line_item;
            END LOOP;
            
            v_report := jsonb_build_object(
                'report_type', 'Income Statement',
                'period_start', p_start_date,
                'period_end', p_end_date,
                'line_items', v_income_statement
            );
            
        WHEN 'balance_sheet' THEN
            -- Generate Balance Sheet
            FOR v_account_record IN 
                SELECT 
                    fa.account_name,
                    fa.account_type,
                    fa.current_balance as amount
                FROM financial_accounts fa
                WHERE fa.account_type IN ('asset', 'liability', 'equity')
                ORDER BY fa.account_type, fa.account_number
            LOOP
                v_line_item := jsonb_build_object(
                    'account_name', v_account_record.account_name,
                    'account_type', v_account_record.account_type,
                    'amount', v_account_record.amount
                );
                v_balance_sheet := v_balance_sheet || v_line_item;
            END LOOP;
            
            v_report := jsonb_build_object(
                'report_type', 'Balance Sheet',
                'as_of_date', p_end_date,
                'line_items', v_balance_sheet
            );
            
        WHEN 'cash_flow' THEN
            -- Generate Cash Flow Statement (simplified)
            SELECT jsonb_agg(
                jsonb_build_object(
                    'transaction_type', transaction_type,
                    'total_amount', SUM(amount),
                    'transaction_count', COUNT(*)
                )
            ) INTO v_cash_flow
            FROM financial_transactions
            WHERE transaction_date BETWEEN p_start_date AND p_end_date
            GROUP BY transaction_type
            ORDER BY transaction_type;
            
            v_report := jsonb_build_object(
                'report_type', 'Cash Flow Statement',
                'period_start', p_start_date,
                'period_end', p_end_date,
                'cash_flows', v_cash_flow
            );
    END CASE;
    
    RETURN v_report;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically record financial transactions

-- Trigger for marketplace transactions (record transaction fees)
CREATE OR REPLACE FUNCTION auto_record_transaction_fee()
RETURNS TRIGGER AS $$
BEGIN
    -- Only record fee when transaction is completed
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

-- Create trigger for transaction fee recording
DROP TRIGGER IF EXISTS auto_record_transaction_fee_trigger ON txn;
CREATE TRIGGER auto_record_transaction_fee_trigger
    AFTER UPDATE ON txn
    FOR EACH ROW
    EXECUTE FUNCTION auto_record_transaction_fee();

-- Trigger for withdrawal requests (record withdrawal fees)
CREATE OR REPLACE FUNCTION auto_record_withdrawal_fee()
RETURNS TRIGGER AS $$
BEGIN
    -- Record withdrawal fee when withdrawal is approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        PERFORM record_withdrawal_fee(
            NEW.id,
            NEW.pharmacy_id,
            NEW.platform_fee + NEW.processing_fee
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal fee recording
DROP TRIGGER IF EXISTS auto_record_withdrawal_fee_trigger ON withdrawal_requests;
CREATE TRIGGER auto_record_withdrawal_fee_trigger
    AFTER UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_record_withdrawal_fee();

-- Function to run monthly financial automation
CREATE OR REPLACE FUNCTION run_monthly_financial_automation()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
    v_metrics_result TEXT;
    v_reports_generated INTEGER := 0;
BEGIN
    -- Calculate and record monthly business metrics
    SELECT calculate_and_record_monthly_metrics() INTO v_metrics_result;
    
    -- Generate automated monthly reports
    INSERT INTO financial_reports (
        report_name,
        report_type,
        report_config,
        is_scheduled,
        last_generated
    ) VALUES (
        'Monthly Income Statement - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
        'income_statement',
        jsonb_build_object(
            'period_start', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
            'period_end', DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
            'auto_generated', true
        ),
        true,
        NOW()
    );
    
    v_reports_generated := v_reports_generated + 1;
    
    v_result := v_metrics_result || '. Generated ' || v_reports_generated || ' automated reports.';
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create a view for real-time financial KPIs
CREATE OR REPLACE VIEW financial_kpis AS
SELECT 
    -- Current Month Revenue
    (SELECT COALESCE(SUM(amount), 0) 
     FROM financial_transactions 
     WHERE transaction_type IN ('subscription_revenue', 'transaction_fee_revenue', 'withdrawal_fee_revenue')
     AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as current_month_revenue,
    
    -- Current Month Expenses
    (SELECT COALESCE(SUM(amount), 0) 
     FROM financial_transactions 
     WHERE transaction_type IN ('infrastructure_cost', 'admin_salary', 'marketing_expense', 'development_cost', 'legal_compliance', 'office_rent')
     AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as current_month_expenses,
    
    -- Cash Balance
    (SELECT COALESCE(current_balance, 0) 
     FROM financial_accounts 
     WHERE account_number = '1001') as cash_balance,
    
    -- Monthly Recurring Revenue (MRR)
    (SELECT COALESCE(SUM(amount), 0) 
     FROM financial_transactions 
     WHERE transaction_type = 'subscription_revenue'
     AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as mrr,
    
    -- Total Active Pharmacies
    (SELECT COUNT(*) FROM pharmacies WHERE verified = TRUE) as active_pharmacies,
    
    -- This Month's New Pharmacies
    (SELECT COUNT(*) FROM pharmacies 
     WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_pharmacies_this_month,
    
    -- This Month's Transaction Volume
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM txn 
     WHERE status = 'completed' 
     AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as transaction_volume_this_month;

-- Grant permissions to admin users
GRANT SELECT ON financial_kpis TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_and_record_monthly_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION generate_automated_financial_report TO authenticated;