-- PharmaSave AI V2: Enumerated Types (OWNER-FIRST BUSINESS MODEL)
-- Defines all enum types used in the database schema with owner-first pharmacy business model

-- Pharmacy status (for business entities)
CREATE TYPE pharmacy_status AS ENUM (
  'pending_verification',
  'verified',
  'suspended',
  'deactivated'
);

-- User roles (Owner-First Model with role hierarchy)
CREATE TYPE user_role AS ENUM (
  'admin', -- System administrator (super user)
  'primary_admin', -- Pharmacy owner/manager (full business control)
  'co_admin', -- Business operations manager (can invite staff, limited admin access)
  'staff_pharmacist', -- Regular pharmacist employee (marketplace access only)
  'support' -- Support staff role
);

-- Employee status (for pharmacists)
CREATE TYPE employee_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'terminated'
);

-- Invitation status (Owner-First Model)
CREATE TYPE invitation_status AS ENUM (
  'pending', -- Invitation sent, awaiting response
  'accepted', -- Invitation accepted and account created
  'declined', -- Invitation declined by recipient
  'expired', -- Invitation expired without response
  'revoked' -- Invitation cancelled by sender
);

-- Verification status
CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- Document types for verification
CREATE TYPE document_type AS ENUM (
  'pharmacy_license',
  'pharmacist_id',
  'business_registration',
  'additional_proof'
);

-- Listing types
CREATE TYPE listing_type AS ENUM (
  'sale',
  'trade',
  'both'
);

-- Listing status
CREATE TYPE listing_status AS ENUM (
  'draft',
  'active',
  'pending',
  'sold',
  'expired',
  'removed'
);

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
  'purchase',
  'trade'
);

-- Transaction status
CREATE TYPE transaction_status AS ENUM (
  'requested',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'disputed',
  'cancelled'
);

-- Transaction item direction (for trade items)
CREATE TYPE transaction_direction AS ENUM (
  'from_buyer',
  'from_seller'
);

-- Wallet transaction types
CREATE TYPE wallet_transaction_type AS ENUM (
  'deposit',
  'withdrawal',
  'fee',
  'purchase',
  'sale',
  'trade_balance',
  'refund',
  'adjustment'
);

-- Wallet transaction status
CREATE TYPE wallet_transaction_status AS ENUM (
  'pending',
  'completed',
  'rejected',
  'failed'
);

-- Notification types (Enhanced for Owner-First Model)
CREATE TYPE notification_type AS ENUM (
  'transaction',
  'system',
  'account',
  'review',
  'wallet',
  'employee_management',
  'invitation_sent', -- New invitation sent
  'invitation_accepted', -- Employee accepted invitation
  'invitation_declined', -- Employee declined invitation
  'role_changed' -- Employee role was modified
);

-- Notification status
CREATE TYPE notification_status AS ENUM (
  'unread',
  'read',
  'archived'
);

-- Medicine forms
CREATE TYPE medicine_form AS ENUM (
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'cream',
  'ointment',
  'drops',
  'inhaler',
  'patch',
  'suppository',
  'other'
);

-- Message channels
CREATE TYPE message_channel AS ENUM (
  'whatsapp',
  'sms',
  'in_app'
);