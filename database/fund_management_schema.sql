-- Fund Management System Database Schema
-- This creates the tables needed for pharmacy fund requests and wallet management

-- =====================================================
-- FUND REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS fund_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reference_number VARCHAR(255) NOT NULL UNIQUE,
  instapay_receipt TEXT, -- URL to receipt image if uploaded
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES admins(id),
  admin_notes TEXT,
  
  -- Indexes for better performance
  CONSTRAINT fund_requests_reference_unique UNIQUE (reference_number)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_fund_requests_pharmacy_id ON fund_requests(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON fund_requests(status);
CREATE INDEX IF NOT EXISTS idx_fund_requests_created_at ON fund_requests(created_at);

-- =====================================================
-- PHARMACY WALLETS TABLE 
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint
ALTER TABLE pharmacy_wallets ADD CONSTRAINT IF NOT EXISTS pharmacy_wallets_pharmacy_unique UNIQUE (pharmacy_id);

-- =====================================================
-- WALLET TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'fee', 'refund', 'transfer')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(10,2), -- Balance after this transaction
  description TEXT NOT NULL,
  reference_id UUID, -- Links to fund_requests, transactions, etc.
  reference_type VARCHAR(50), -- 'fund_request', 'marketplace_transaction', etc.
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_pharmacy_id ON wallet_transactions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id, reference_type);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE fund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Fund Requests Policies
-- Pharmacists can only see their own pharmacy's fund requests
CREATE POLICY fund_requests_pharmacist_policy ON fund_requests
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid()
    )
  );

-- Admins can see all fund requests
CREATE POLICY fund_requests_admin_policy ON fund_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE auth_id = auth.uid()
    )
  );

-- Pharmacy Wallets Policies  
-- Pharmacists can only see their own pharmacy's wallet
CREATE POLICY pharmacy_wallets_pharmacist_policy ON pharmacy_wallets
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid()
    )
  );

-- Admins can see all wallets
CREATE POLICY pharmacy_wallets_admin_policy ON pharmacy_wallets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE auth_id = auth.uid()
    )
  );

-- Wallet Transactions Policies
-- Pharmacists can only see their own pharmacy's transactions
CREATE POLICY wallet_transactions_pharmacist_policy ON wallet_transactions
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid()
    )
  );

-- Admins can see all transactions  
CREATE POLICY wallet_transactions_admin_policy ON wallet_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE auth_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get fund request statistics
CREATE OR REPLACE FUNCTION get_fund_request_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_pending INTEGER,
  total_approved_today INTEGER,
  total_amount_processed_today DECIMAL(10,2),
  pending_amount DECIMAL(10,2),
  average_processing_time INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM fund_requests WHERE status = 'pending') as total_pending,
    (SELECT COUNT(*)::INTEGER FROM fund_requests 
     WHERE status = 'approved' AND DATE(processed_at) = p_date) as total_approved_today,
    (SELECT COALESCE(SUM(amount), 0) FROM fund_requests 
     WHERE status = 'approved' AND DATE(processed_at) = p_date) as total_amount_processed_today,
    (SELECT COALESCE(SUM(amount), 0) FROM fund_requests WHERE status = 'pending') as pending_amount,
    (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))/60), 0)::INTEGER
     FROM fund_requests WHERE status IN ('approved', 'rejected') AND processed_at IS NOT NULL) as average_processing_time;
END;
$$;

-- Function to update pharmacy wallet balance
CREATE OR REPLACE FUNCTION update_pharmacy_wallet(
  p_pharmacy_id UUID,
  p_amount DECIMAL(10,2),
  p_transaction_type VARCHAR(20),
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM pharmacy_wallets 
  WHERE pharmacy_id = p_pharmacy_id;
  
  -- If wallet doesn't exist, create it
  IF v_current_balance IS NULL THEN
    INSERT INTO pharmacy_wallets (pharmacy_id, balance)
    VALUES (p_pharmacy_id, 0)
    ON CONFLICT (pharmacy_id) DO NOTHING;
    v_current_balance := 0;
  END IF;
  
  -- Calculate new balance
  IF p_transaction_type IN ('deposit', 'refund') THEN
    v_new_balance := v_current_balance + p_amount;
  ELSIF p_transaction_type IN ('withdrawal', 'fee', 'transfer') THEN
    v_new_balance := v_current_balance - p_amount;
    -- Check for insufficient funds
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient funds. Current balance: %, Requested: %', v_current_balance, p_amount;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;
  
  -- Update wallet balance
  UPDATE pharmacy_wallets 
  SET balance = v_new_balance, last_updated = CURRENT_TIMESTAMP
  WHERE pharmacy_id = p_pharmacy_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (
    pharmacy_id, type, amount, balance_after, description, 
    reference_id, reference_type, status
  ) VALUES (
    p_pharmacy_id, p_transaction_type, p_amount, v_new_balance, p_description,
    p_reference_id, p_reference_type, 'completed'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update wallet balance when fund request is approved
CREATE OR REPLACE FUNCTION handle_fund_request_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Add funds to pharmacy wallet
    PERFORM update_pharmacy_wallet(
      NEW.pharmacy_id,
      NEW.amount,
      'deposit',
      'Fund request approved - ' || NEW.reference_number,
      NEW.id,
      'fund_request'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER fund_request_approval_trigger
  AFTER UPDATE ON fund_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_fund_request_approval();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create default wallets for existing pharmacies
INSERT INTO pharmacy_wallets (pharmacy_id, balance)
SELECT id, 0.00 
FROM pharmacies
ON CONFLICT (pharmacy_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON fund_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pharmacy_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON wallet_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_fund_request_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_pharmacy_wallet TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE fund_requests IS 'Stores pharmacy fund requests submitted via InstaPay';
COMMENT ON TABLE pharmacy_wallets IS 'Stores current wallet balance for each pharmacy';
COMMENT ON TABLE wallet_transactions IS 'Stores all wallet transaction history for audit trail';
COMMENT ON FUNCTION get_fund_request_stats IS 'Returns statistics for admin fund management dashboard';
COMMENT ON FUNCTION update_pharmacy_wallet IS 'Safely updates pharmacy wallet balance with transaction logging';
