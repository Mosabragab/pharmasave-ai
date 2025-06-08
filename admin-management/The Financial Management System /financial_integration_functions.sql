-- 🔗 PharmaSave AI V2: Financial System Integration Functions
-- These functions integrate the financial management system with existing PharmaSave AI operations
-- Ensures automatic recording of all financial events

-- ==============================================================================
-- 1. INTEGRATION WITH PHARMACY SUBSCRIPTION SYSTEM
-- ==============================================================================

-- Enhanced function to handle pharmacy subscription payments with financial recording
CREATE OR REPLACE FUNCTION process_pharmacy_subscription_payment(
    p_pharmacy_id UUID,
    p_payment_amount DECIMAL DEFAULT 999.00,
    p_payment_method TEXT DEFAULT 'instapay',
    p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    financial_txn_id UUID;
    wallet_balance DECIMAL;
BEGIN
    -- Start transaction
    BEGIN
        -- 1. Update pharmacy subscription status
        UPDATE pharmacies 
        SET 
            subscription_status = 'active',
            marketplace_access = TRUE,
            trial_expires_at = CASE 
                WHEN trial_expires_at IS NULL OR trial_expires_at < NOW() 
                THEN NOW() + INTERVAL '30 days'
                ELSE trial_expires_at + INTERVAL '30 days'
            END,
            updated_at = NOW()
        WHERE id = p_pharmacy_id;

        -- 2. Record subscription revenue in financial system
        SELECT record_subscription_revenue(
            p_pharmacy_id,
            p_payment_amount,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days'
        ) INTO financial_txn_id;

        -- 3. Update monthly metrics
        PERFORM update_monthly_revenue_metrics();
        PERFORM calculate_business_kpis();

        -- 4. Create notification for pharmacy
        INSERT INTO notifications (
            pharmacy_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            p_pharmacy_id,
            'account',
            'Subscription Payment Processed',
            'Your monthly subscription payment has been processed successfully. Your marketplace access is now active.',
            jsonb_build_object(
                'payment_amount', p_payment_amount,
                'payment_method', p_payment_method,
                'payment_reference', p_payment_reference,
                'financial_transaction_id', financial_txn_id
            )
        );

        result := jsonb_build_object(
            'success', true,
            'message', 'Subscription payment processed successfully',
            'financial_transaction_id', financial_txn_id,
            'pharmacy_id', p_pharmacy_id,
            'amount', p_payment_amount,
            'next_billing_date', CURRENT_DATE + INTERVAL '30 days'
        );

    EXCEPTION
        WHEN OTHERS THEN
            result := jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Failed to process subscription payment'
            );
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. INTEGRATION WITH MARKETPLACE TRANSACTIONS
-- ==============================================================================

-- Enhanced function to handle marketplace transaction completion with financial recording
CREATE OR REPLACE FUNCTION complete_marketplace_transaction(
    p_transaction_id UUID
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    txn_record RECORD;
    financial_txn_id UUID;
    buyer_wallet_id UUID;
    seller_wallet_id UUID;
    platform_fee DECIMAL;
    buyer_fee DECIMAL;
    seller_fee DECIMAL;
BEGIN
    -- Get transaction details
    SELECT * INTO txn_record 
    FROM txn 
    WHERE id = p_transaction_id AND status = 'approved';

    IF txn_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction not found or not approved'
        );
    END IF;

    BEGIN
        -- Calculate fees (already calculated, but ensure they exist)
        platform_fee := txn_record.platform_fee;
        buyer_fee := txn_record.buyer_fee;
        seller_fee := txn_record.seller_fee;

        -- Get wallet IDs
        SELECT id INTO buyer_wallet_id FROM wlt WHERE pharmacy_id = txn_record.buyer_pharmacy_id;
        SELECT id INTO seller_wallet_id FROM wlt WHERE pharmacy_id = txn_record.seller_pharmacy_id;

        -- 1. Process wallet transactions
        -- Deduct from buyer (total amount + buyer fee)
        INSERT INTO wlt_txn (
            wallet_id,
            type,
            amount,
            balance_before,
            balance_after,
            status,
            transaction_id,
            description
        ) 
        SELECT 
            buyer_wallet_id,
            'purchase',
            -(txn_record.total_amount + buyer_fee),
            w.balance,
            w.balance - (txn_record.total_amount + buyer_fee),
            'completed',
            p_transaction_id,
            'Purchase payment for transaction #' || p_transaction_id
        FROM wlt w WHERE id = buyer_wallet_id;

        -- Credit to seller (total amount - seller fee)
        INSERT INTO wlt_txn (
            wallet_id,
            type,
            amount,
            balance_before,
            balance_after,
            status,
            transaction_id,
            description
        ) 
        SELECT 
            seller_wallet_id,
            'sale',
            txn_record.total_amount - seller_fee,
            w.balance,
            w.balance + (txn_record.total_amount - seller_fee),
            'completed',
            p_transaction_id,
            'Sale proceeds for transaction #' || p_transaction_id
        FROM wlt w WHERE id = seller_wallet_id;

        -- 2. Update wallet balances
        UPDATE wlt 
        SET balance = balance - (txn_record.total_amount + buyer_fee),
            updated_at = NOW()
        WHERE id = buyer_wallet_id;

        UPDATE wlt 
        SET balance = balance + (txn_record.total_amount - seller_fee),
            updated_at = NOW()
        WHERE id = seller_wallet_id;

        -- 3. Record platform fee revenue in financial system
        SELECT record_transaction_fee(
            p_transaction_id,
            txn_record.buyer_pharmacy_id,
            txn_record.seller_pharmacy_id,
            platform_fee
        ) INTO financial_txn_id;

        -- 4. Update transaction status
        UPDATE txn 
        SET 
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_transaction_id;

        -- 5. Update listing status
        UPDATE lstng 
        SET 
            status = 'sold',
            updated_at = NOW()
        WHERE id = txn_record.listing_id;

        -- 6. Update financial metrics
        PERFORM update_monthly_revenue_metrics();
        PERFORM calculate_business_kpis();

        -- 7. Create notifications for both pharmacies
        INSERT INTO notifications (
            pharmacy_id,
            type,
            title,
            message,
            reference_id,
            reference_type,
            metadata
        ) VALUES 
        (
            txn_record.buyer_pharmacy_id,
            'transaction',
            'Purchase Completed',
            'Your purchase has been completed successfully. Payment has been processed.',
            p_transaction_id,
            'transaction',
            jsonb_build_object(
                'transaction_type', 'purchase',
                'amount_paid', txn_record.total_amount + buyer_fee,
                'fee_amount', buyer_fee
            )
        ),
        (
            txn_record.seller_pharmacy_id,
            'transaction',
            'Sale Completed',
            'Your sale has been completed successfully. Funds have been credited to your wallet.',
            p_transaction_id,
            'transaction',
            jsonb_build_object(
                'transaction_type', 'sale',
                'amount_received', txn_record.total_amount - seller_fee,
                'fee_amount', seller_fee
            )
        );

        result := jsonb_build_object(
            'success', true,
            'message', 'Transaction completed successfully',
            'transaction_id', p_transaction_id,
            'financial_transaction_id', financial_txn_id,
            'platform_fee', platform_fee,
            'buyer_amount_paid', txn_record.total_amount + buyer_fee,
            'seller_amount_received', txn_record.total_amount - seller_fee
        );

    EXCEPTION
        WHEN OTHERS THEN
            result := jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Failed to complete marketplace transaction'
            );
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. INTEGRATION WITH WALLET WITHDRAWAL SYSTEM
-- ==============================================================================

-- Enhanced function to handle wallet withdrawals with financial recording
CREATE OR REPLACE FUNCTION process_wallet_withdrawal(
    p_pharmacy_id UUID,
    p_withdrawal_amount DECIMAL,
    p_instapay_identifier TEXT,
    p_instapay_type TEXT DEFAULT 'mobile'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    wallet_record RECORD;
    withdrawal_fee DECIMAL := 10.00; -- 10 EGP withdrawal fee
    net_withdrawal DECIMAL;
    financial_txn_id UUID;
BEGIN
    -- Get wallet details
    SELECT * INTO wallet_record 
    FROM wlt 
    WHERE pharmacy_id = p_pharmacy_id;

    IF wallet_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Wallet not found for pharmacy'
        );
    END IF;

    -- Calculate net withdrawal amount
    net_withdrawal := p_withdrawal_amount - withdrawal_fee;

    -- Check if sufficient balance
    IF wallet_record.balance < p_withdrawal_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient wallet balance',
            'available_balance', wallet_record.balance,
            'requested_amount', p_withdrawal_amount
        );
    END IF;

    BEGIN
        -- 1. Record withdrawal transaction in wallet
        INSERT INTO wlt_txn (
            wallet_id,
            type,
            amount,
            balance_before,
            balance_after,
            status,
            description,
            metadata
        ) VALUES (
            wallet_record.id,
            'withdrawal',
            -p_withdrawal_amount,
            wallet_record.balance,
            wallet_record.balance - p_withdrawal_amount,
            'completed',
            'Wallet withdrawal to ' || p_instapay_type || ': ' || p_instapay_identifier,
            jsonb_build_object(
                'withdrawal_fee', withdrawal_fee,
                'net_amount', net_withdrawal,
                'instapay_identifier', p_instapay_identifier,
                'instapay_type', p_instapay_type
            )
        );

        -- 2. Update wallet balance
        UPDATE wlt 
        SET 
            balance = balance - p_withdrawal_amount,
            updated_at = NOW()
        WHERE id = wallet_record.id;

        -- 3. Record withdrawal fee as revenue in financial system
        INSERT INTO financial_transactions (
            transaction_type,
            pharmacy_id,
            amount,
            debit_account_id,
            credit_account_id,
            description,
            metadata
        ) VALUES (
            'withdrawal_fee',
            p_pharmacy_id,
            withdrawal_fee,
            (SELECT id FROM chart_of_accounts WHERE account_code = '1100-CASH'),
            (SELECT id FROM chart_of_accounts WHERE account_code = '4200-WITHDRAWAL'),
            'Withdrawal processing fee',
            jsonb_build_object(
                'withdrawal_amount', p_withdrawal_amount,
                'net_amount', net_withdrawal,
                'instapay_identifier', p_instapay_identifier
            )
        ) RETURNING id INTO financial_txn_id;

        -- 4. Update financial metrics
        PERFORM update_monthly_revenue_metrics();
        PERFORM calculate_business_kpis();

        -- 5. Create notification for pharmacy
        INSERT INTO notifications (
            pharmacy_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            p_pharmacy_id,
            'wallet',
            'Withdrawal Processed',
            'Your withdrawal request has been processed successfully. Funds will be transferred within 24 hours.',
            jsonb_build_object(
                'withdrawal_amount', p_withdrawal_amount,
                'fee_amount', withdrawal_fee,
                'net_amount', net_withdrawal,
                'instapay_identifier', p_instapay_identifier,
                'financial_transaction_id', financial_txn_id
            )
        );

        result := jsonb_build_object(
            'success', true,
            'message', 'Withdrawal processed successfully',
            'withdrawal_amount', p_withdrawal_amount,
            'fee_amount', withdrawal_fee,
            'net_amount', net_withdrawal,
            'remaining_balance', wallet_record.balance - p_withdrawal_amount,
            'financial_transaction_id', financial_txn_id
        );

    EXCEPTION
        WHEN OTHERS THEN
            result := jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Failed to process withdrawal'
            );
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. AUTOMATED MONTHLY FINANCIAL PROCESSING
-- ==============================================================================

-- Function to run monthly financial automation (called via cron job)
CREATE OR REPLACE FUNCTION run_monthly_financial_automation()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    processed_count INTEGER := 0;
BEGIN
    result_text := 'Monthly Financial Automation - ' || CURRENT_DATE || E'\n';
    result_text := result_text || '================================================' || E'\n';

    -- 1. Update monthly revenue metrics
    PERFORM update_monthly_revenue_metrics();
    result_text := result_text || '✅ Updated monthly revenue metrics' || E'\n';

    -- 2. Calculate and update business KPIs
    PERFORM calculate_business_kpis();
    result_text := result_text || '✅ Calculated business KPIs' || E'\n';

    -- 3. Process subscription renewals (pharmacies with expired subscriptions)
    UPDATE pharmacies 
    SET 
        subscription_status = 'expired',
        marketplace_access = FALSE,
        updated_at = NOW()
    WHERE subscription_status = 'active' 
    AND trial_expires_at < CURRENT_DATE;
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    result_text := result_text || '⚠️  Expired ' || processed_count || ' pharmacy subscriptions' || E'\n';

    -- 4. Generate renewal reminders (3 days before expiry)
    INSERT INTO notifications (
        pharmacy_id,
        type,
        title,
        message,
        action_url,
        action_label
    )
    SELECT 
        p.id,
        'account',
        'Subscription Expiring Soon',
        'Your PharmaSave AI subscription expires in 3 days. Renew now to maintain marketplace access.',
        '/dashboard/billing',
        'Renew Subscription'
    FROM pharmacies p
    WHERE p.subscription_status = 'active'
    AND p.trial_expires_at BETWEEN CURRENT_DATE + INTERVAL '2 days' AND CURRENT_DATE + INTERVAL '4 days'
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.pharmacy_id = p.id 
        AND n.type = 'account' 
        AND n.title = 'Subscription Expiring Soon'
        AND n.created_at > CURRENT_DATE - INTERVAL '7 days'
    );

    GET DIAGNOSTICS processed_count = ROW_COUNT;
    result_text := result_text || '📧 Sent ' || processed_count || ' renewal reminders' || E'\n';

    -- 5. Archive old notifications (older than 90 days)
    UPDATE notifications 
    SET archived_at = NOW()
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
    AND archived_at IS NULL;

    GET DIAGNOSTICS processed_count = ROW_COUNT;
    result_text := result_text || '🗂️  Archived ' || processed_count || ' old notifications' || E'\n';

    -- 6. Clean up expired invitation tokens
    DELETE FROM pharmacy_invitations 
    WHERE status = 'pending' 
    AND expires_at < NOW();

    GET DIAGNOSTICS processed_count = ROW_COUNT;
    result_text := result_text || '🧹 Cleaned up ' || processed_count || ' expired invitations' || E'\n';

    result_text := result_text || '================================================' || E'\n';
    result_text := result_text || '✅ Monthly financial automation completed successfully';

    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 5. FINANCIAL HEALTH MONITORING
-- ==============================================================================

-- Function to check financial health and generate alerts
CREATE OR REPLACE FUNCTION check_financial_health()
RETURNS JSONB AS $$
DECLARE
    alerts JSONB := '[]'::jsonb;
    current_kpis RECORD;
    cash_balance DECIMAL;
    burn_rate DECIMAL;
    runway_months INTEGER;
    churn_rate DECIMAL;
    growth_rate DECIMAL;
BEGIN
    -- Get latest KPIs
    SELECT * INTO current_kpis 
    FROM business_kpis 
    ORDER BY calculation_date DESC 
    LIMIT 1;

    IF current_kpis IS NULL THEN
        RETURN jsonb_build_object(
            'healthy', false,
            'alerts', jsonb_build_array('No KPI data available - run calculate_business_kpis()')
        );
    END IF;

    cash_balance := current_kpis.cash_balance;
    burn_rate := current_kpis.burn_rate;
    runway_months := current_kpis.cash_runway_months;
    churn_rate := current_kpis.churn_rate;
    growth_rate := current_kpis.revenue_growth_rate;

    -- Check cash runway (alert if less than 6 months)
    IF runway_months < 6 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'critical',
            'category', 'cash_flow',
            'message', 'Critical: Cash runway is ' || runway_months || ' months. Immediate attention required.',
            'action', 'Reduce burn rate or secure additional funding'
        );
    ELSIF runway_months < 12 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'warning',
            'category', 'cash_flow',
            'message', 'Warning: Cash runway is ' || runway_months || ' months. Plan funding strategy.',
            'action', 'Consider fundraising or cost optimization'
        );
    END IF;

    -- Check churn rate (alert if above 10%)
    IF churn_rate > 10 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'critical',
            'category', 'customer_retention',
            'message', 'Critical: Churn rate is ' || churn_rate || '%. Customer retention needs immediate attention.',
            'action', 'Investigate customer satisfaction and improve retention'
        );
    ELSIF churn_rate > 5 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'warning',
            'category', 'customer_retention',
            'message', 'Warning: Churn rate is ' || churn_rate || '%. Monitor customer satisfaction.',
            'action', 'Conduct customer feedback surveys'
        );
    END IF;

    -- Check revenue growth (alert if negative for 2+ months)
    IF growth_rate < -10 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'critical',
            'category', 'revenue_growth',
            'message', 'Critical: Revenue declining by ' || ABS(growth_rate) || '%. Growth strategy needed.',
            'action', 'Review pricing, marketing, and customer acquisition'
        );
    ELSIF growth_rate < 0 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'warning',
            'category', 'revenue_growth',
            'message', 'Warning: Revenue growth is ' || growth_rate || '%. Monitor closely.',
            'action', 'Analyze revenue trends and customer behavior'
        );
    END IF;

    -- Check gross margin (alert if below 70%)
    IF current_kpis.gross_margin < 70 THEN
        alerts := alerts || jsonb_build_object(
            'type', 'warning',
            'category', 'profitability',
            'message', 'Warning: Gross margin is ' || current_kpis.gross_margin || '%. Below target of 70%.',
            'action', 'Review operational efficiency and cost structure'
        );
    END IF;

    RETURN jsonb_build_object(
        'healthy', jsonb_array_length(alerts) = 0,
        'cash_runway_months', runway_months,
        'churn_rate', churn_rate,
        'revenue_growth_rate', growth_rate,
        'gross_margin', current_kpis.gross_margin,
        'alerts', alerts,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 6. FINANCIAL REPORTING FUNCTIONS
-- ==============================================================================

-- Function to generate income statement
CREATE OR REPLACE FUNCTION generate_income_statement(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    category TEXT,
    amount DECIMAL,
    percentage DECIMAL
) AS $$
DECLARE
    total_revenue DECIMAL := 0;
    total_expenses DECIMAL := 0;
BEGIN
    -- Calculate total revenue for percentage calculations
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND credit_account_id IN (
        SELECT id FROM chart_of_accounts WHERE account_type = 'revenue'
    );

    -- Return revenue items
    RETURN QUERY
    SELECT 
        'REVENUE - ' || coa.account_name,
        COALESCE(SUM(ft.amount), 0),
        CASE WHEN total_revenue > 0 THEN (COALESCE(SUM(ft.amount), 0) / total_revenue) * 100 ELSE 0 END
    FROM chart_of_accounts coa
    LEFT JOIN financial_transactions ft ON ft.credit_account_id = coa.id
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
    WHERE coa.account_type = 'revenue'
    GROUP BY coa.account_name, coa.account_code
    ORDER BY coa.account_code;

    -- Add total revenue row
    RETURN QUERY
    SELECT 
        'TOTAL REVENUE'::TEXT,
        total_revenue,
        100.00::DECIMAL;

    -- Calculate total expenses
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND debit_account_id IN (
        SELECT id FROM chart_of_accounts WHERE account_type = 'expense'
    );

    -- Return expense items
    RETURN QUERY
    SELECT 
        'EXPENSE - ' || coa.account_name,
        -COALESCE(SUM(ft.amount), 0), -- Negative for expenses
        CASE WHEN total_revenue > 0 THEN (-COALESCE(SUM(ft.amount), 0) / total_revenue) * 100 ELSE 0 END
    FROM chart_of_accounts coa
    LEFT JOIN financial_transactions ft ON ft.debit_account_id = coa.id
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
    WHERE coa.account_type = 'expense'
    GROUP BY coa.account_name, coa.account_code
    ORDER BY coa.account_code;

    -- Add total expenses row
    RETURN QUERY
    SELECT 
        'TOTAL EXPENSES'::TEXT,
        -total_expenses,
        CASE WHEN total_revenue > 0 THEN (-total_expenses / total_revenue) * 100 ELSE 0 END;

    -- Add net income row
    RETURN QUERY
    SELECT 
        'NET INCOME'::TEXT,
        total_revenue - total_expenses,
        CASE WHEN total_revenue > 0 THEN ((total_revenue - total_expenses) / total_revenue) * 100 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Function to generate cash flow statement
CREATE OR REPLACE FUNCTION generate_cash_flow_statement(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    category TEXT,
    amount DECIMAL
) AS $$
BEGIN
    -- Operating Activities
    RETURN QUERY
    SELECT 
        'OPERATING ACTIVITIES'::TEXT,
        0.00::DECIMAL;

    RETURN QUERY
    SELECT 
        'Cash from subscription revenue',
        COALESCE(SUM(amount), 0)
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND transaction_type = 'subscription_revenue';

    RETURN QUERY
    SELECT 
        'Cash from transaction fees',
        COALESCE(SUM(amount), 0)
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND transaction_type = 'transaction_fee';

    RETURN QUERY
    SELECT 
        'Cash paid for expenses',
        -COALESCE(SUM(amount), 0)
    FROM expense_entries
    WHERE expense_date BETWEEN p_start_date AND p_end_date
    AND status = 'paid';

    -- Add net cash from operating activities
    RETURN QUERY
    SELECT 
        'Net Cash from Operating Activities',
        (
            COALESCE((SELECT SUM(amount) FROM financial_transactions WHERE transaction_date BETWEEN p_start_date AND p_end_date AND transaction_type IN ('subscription_revenue', 'transaction_fee', 'withdrawal_fee')), 0) -
            COALESCE((SELECT SUM(amount) FROM expense_entries WHERE expense_date BETWEEN p_start_date AND p_end_date AND status = 'paid'), 0)
        );

    -- Net Change in Cash
    RETURN QUERY
    SELECT 
        'NET CHANGE IN CASH',
        (
            COALESCE((SELECT SUM(amount) FROM financial_transactions WHERE transaction_date BETWEEN p_start_date AND p_end_date AND transaction_type IN ('subscription_revenue', 'transaction_fee', 'withdrawal_fee')), 0) -
            COALESCE((SELECT SUM(amount) FROM expense_entries WHERE expense_date BETWEEN p_start_date AND p_end_date AND status = 'paid'), 0)
        );
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 7. SETUP AUTOMATED TRIGGERS FOR EXISTING SYSTEM
-- ==============================================================================

-- Update existing triggers to use new financial integration functions

-- Replace pharmacy subscription trigger
DROP TRIGGER IF EXISTS trigger_pharmacy_subscription_payment ON pharmacies;
CREATE TRIGGER trigger_pharmacy_subscription_financial_integration
    AFTER UPDATE ON pharmacies
    FOR EACH ROW
    WHEN (NEW.subscription_status = 'active' AND OLD.subscription_status != 'active')
    EXECUTE FUNCTION trigger_record_subscription_payment();

-- Replace marketplace transaction trigger
DROP TRIGGER IF EXISTS trigger_marketplace_transaction_fee ON txn;
CREATE TRIGGER trigger_marketplace_transaction_financial_integration
    AFTER UPDATE ON txn
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION trigger_record_transaction_fee();

-- ==============================================================================
-- 8. INITIALIZATION AND VERIFICATION
-- ==============================================================================

-- Initialize monthly records for current month if not exists
INSERT INTO monthly_revenue (year, month) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE))
ON CONFLICT (year, month) DO NOTHING;

INSERT INTO monthly_expenses (year, month) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE))
ON CONFLICT (year, month) DO NOTHING;

-- Calculate initial KPIs
SELECT calculate_business_kpis();

-- Create initial financial health check
SELECT check_financial_health() as initial_health_check;

-- Success message
SELECT '🎉 Financial Integration System installed successfully! All PharmaSave AI operations now integrate with financial management.' as status;