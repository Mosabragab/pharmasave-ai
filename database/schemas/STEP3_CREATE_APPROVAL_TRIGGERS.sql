-- ===============================================
-- STEP 3: CREATE ENHANCED APPROVAL TRIGGERS
-- ===============================================
-- This ensures fund/withdrawal approvals create wallet transactions

-- Create enhanced fund request approval trigger
CREATE OR REPLACE FUNCTION process_approved_fund_request_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    current_balance_val NUMERIC;
    new_balance NUMERIC;
BEGIN
    -- Only process when status changes to 'approved'
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        
        RAISE NOTICE '🔄 Processing fund request approval for pharmacy % - Amount: % EGP', NEW.pharmacy_id, NEW.amount;
        
        -- Get current pharmacy wallet balance
        SELECT available_balance INTO current_balance_val
        FROM pharmacy_wallets
        WHERE pharmacy_id = NEW.pharmacy_id;
        
        -- Calculate new balance
        new_balance := COALESCE(current_balance_val, 0) + NEW.amount;
        
        -- Update pharmacy wallet balance and totals
        UPDATE pharmacy_wallets
        SET 
            available_balance = new_balance,
            total_earned = COALESCE(total_earned, 0) + NEW.amount,
            last_transaction_at = NOW(),
            updated_at = NOW()
        WHERE pharmacy_id = NEW.pharmacy_id;
        
        -- Create wallet transaction record
        INSERT INTO wallet_transactions (
            pharmacy_id,
            transaction_type,
            amount,
            balance_after,
            description,
            reference_id,
            reference_type,
            created_at
        ) VALUES (
            NEW.pharmacy_id,
            'credit',
            NEW.amount,
            new_balance,
            'Fund request approved: ' || COALESCE(NEW.reason, 'Fund addition'),
            NEW.id,
            'fund_request',
            NOW()
        );
        
        RAISE NOTICE '✅ Fund request % approved - Added % EGP to wallet (Balance: % → %)', 
            NEW.id, NEW.amount, COALESCE(current_balance_val, 0), new_balance;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced withdrawal request approval trigger
CREATE OR REPLACE FUNCTION process_approved_withdrawal_request_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    current_balance_val NUMERIC;
    new_balance NUMERIC;
BEGIN
    -- Only process when status changes to 'approved'
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        
        RAISE NOTICE '🔄 Processing withdrawal request approval for pharmacy % - Amount: % EGP', NEW.pharmacy_id, NEW.amount;
        
        -- Get current pharmacy wallet balance
        SELECT available_balance INTO current_balance_val
        FROM pharmacy_wallets
        WHERE pharmacy_id = NEW.pharmacy_id;
        
        -- Check sufficient balance
        IF COALESCE(current_balance_val, 0) < NEW.amount THEN
            RAISE EXCEPTION 'Insufficient balance for withdrawal. Available: %, Requested: %', current_balance_val, NEW.amount;
        END IF;
        
        -- Calculate new balance
        new_balance := current_balance_val - NEW.amount;
        
        -- Update pharmacy wallet balance and totals
        UPDATE pharmacy_wallets
        SET 
            available_balance = new_balance,
            total_spent = COALESCE(total_spent, 0) + NEW.amount,
            last_transaction_at = NOW(),
            updated_at = NOW()
        WHERE pharmacy_id = NEW.pharmacy_id;
        
        -- Create wallet transaction record
        INSERT INTO wallet_transactions (
            pharmacy_id,
            transaction_type,
            amount,
            balance_after,
            description,
            reference_id,
            reference_type,
            created_at
        ) VALUES (
            NEW.pharmacy_id,
            'withdrawal',
            NEW.amount,
            new_balance,
            'Withdrawal approved to ' || NEW.bank_name || ' - Account: *****' || RIGHT(NEW.account_number, 4),
            NEW.id,
            'withdrawal_request',
            NOW()
        );
        
        RAISE NOTICE '✅ Withdrawal request % approved - Deducted % EGP from wallet (Balance: % → %)', 
            NEW.id, NEW.amount, current_balance_val, new_balance;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_process_approved_fund_request_enhanced ON fund_requests;
CREATE TRIGGER trigger_process_approved_fund_request_enhanced
    AFTER UPDATE ON fund_requests
    FOR EACH ROW
    EXECUTE FUNCTION process_approved_fund_request_enhanced();

DROP TRIGGER IF EXISTS trigger_process_approved_withdrawal_request_enhanced ON withdrawal_requests;
CREATE TRIGGER trigger_process_approved_withdrawal_request_enhanced
    AFTER UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION process_approved_withdrawal_request_enhanced();

-- Test message
DO $$
BEGIN
    RAISE NOTICE '✅ STEP 3 COMPLETE: Enhanced approval triggers created';
    RAISE NOTICE '📝 Fund request approvals will now automatically create wallet transactions';
    RAISE NOTICE '📝 Withdrawal request approvals will now automatically create wallet transactions';
    RAISE NOTICE '➡️ Proceed to Step 4 to backfill missing transactions';
END $$;
