# PharmaSave AI V2: Supabase Setup Guide (CORRECTED)

## Overview

This guide provides step-by-step instructions for setting up Supabase for PharmaSave AI V2 with the **corrected pharmacy-centric business model**. The setup implements proper authentication where **pharmacist employees** authenticate and access **pharmacy business accounts**.

## ⚠️ **CRITICAL UPDATE (May 23, 2025)**

**Owner-First Authentication Model**: This setup now properly implements:
- **Pharmacy owners/managers** create and control pharmacy business accounts
- **Employee invitation system** allows owners to invite pharmacists via email
- **Role hierarchy** with Primary Admin (owner) → Co-Admin → Staff Pharmacist
- **Multiple pharmacists** can access the same pharmacy business account
- **Business continuity** maintained when pharmacist employees change

---

## Prerequisites

- Supabase account (free tier is sufficient for development)
- Node.js 18+ for running setup scripts
- PostgreSQL knowledge (helpful but not required)

## 1. Create Supabase Project

1. **Sign up/Login** to [Supabase](https://supabase.com)
2. **Create New Project**:
   - Project Name: `pharmasave-ai-v2`
   - Database Password: Generate strong password (save securely)
   - Region: Select closest to Egypt (Europe West recommended)
3. **Wait for project initialization** (2-3 minutes)

## 2. Database Setup

### 2.1 Enable Required Extensions

Go to **Database → Extensions** and enable:

```sql
-- Enable PostGIS for geographic features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 2.2 Run Database Schema Scripts

Execute the following scripts in order through **SQL Editor**:

#### Step 1: Create Extensions
```sql
-- File: database/schema/extensions.sql
-- Copy and paste the entire content of this file
```

#### Step 2: Create Enums
```sql
-- File: database/schema/enums.sql
-- Copy and paste the entire content of this file
```

#### Step 3: Create Tables (CORRECTED BUSINESS MODEL)
```sql
-- File: database/schema/tables.sql
-- This implements the corrected pharmacy-centric business model
-- CRITICAL: Uses pharmacies + pharmacists tables, NOT pharm + users
```

Key tables created:
- **`pharmacies`** - Business entities (NO authentication, owns subscriptions)
- **`pharmacists`** - Employee accounts (WITH authentication via auth_id)
- **`pharmacy_invitations`** - Email-based employee invitation system
- **`lstng`** - Listings belong to pharmacy businesses (`pharmacy_id`)
- **`txn`** - Transactions between businesses (`buyer_pharmacy_id`, `seller_pharmacy_id`)
- **`wlt`** - Wallets belong to businesses (`pharmacy_id`)

#### Step 4: Create Functions
```sql
-- File: database/schema/functions.sql
-- Copy and paste the entire content of this file
```

#### Step 5: Create Authentication Functions (NEW)
```sql
-- File: database/schema/functions_auth.sql
-- CRITICAL: Implements pharmacy-employee authentication logic
```

#### Step 6: Create Triggers
```sql
-- File: database/schema/triggers.sql
-- Copy and paste the entire content of this file
```

#### Step 7: Create Indexes
```sql
-- File: database/schema/indexes.sql
-- Copy and paste the entire content of this file
```

#### Step 8: Setup Row Level Security (CORRECTED)
```sql
-- File: database/schema/rls_policies.sql
-- CRITICAL: Implements correct pharmacy-employee access control
```

Key RLS Policies:
```sql
-- Pharmacists can access their own records
CREATE POLICY pharmacists_own_data ON pharmacists
  FOR ALL USING (auth_id = auth.uid());

-- Pharmacists can access their pharmacy's data
CREATE POLICY pharmacies_employee_access ON pharmacies
  FOR ALL USING (
    id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid()
    )
  );

-- Only Primary Admin can manage all employees; Co-Admins can invite Staff only
CREATE POLICY pharmacists_invitation_management ON pharmacists
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid() 
      AND (role = 'primary_admin' OR 
           (role = 'co_admin' AND EXISTS (
             SELECT 1 FROM pharmacists p2 
             WHERE p2.pharmacy_id = pharmacists.pharmacy_id 
             AND p2.role = 'staff_pharmacist'
           )))
    )
  );

-- Invitation access: Primary Admin sees all, Co-Admin sees their invitations
CREATE POLICY pharmacy_invitations_access ON pharmacy_invitations
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacists 
      WHERE auth_id = auth.uid() 
      AND role IN ('primary_admin', 'co_admin')
    )
  );
```

#### Step 9: Setup Realtime (Optional)
```sql
-- File: database/schema/publications.sql
-- Copy and paste the entire content of this file
```

## 3. Authentication Setup (CORRECTED)

### 3.1 Enable Authentication Providers

Go to **Authentication → Providers**:

1. **Email**: Enable (required for pharmacist login)
2. **Phone**: Enable (optional, for SMS verification)
3. **Google**: Enable (optional, for easier pharmacist login)

### 3.2 Configure Email Templates

Go to **Authentication → Email Templates**:

1. **Confirm signup**: Customize for pharmacy owner registration
2. **Invite user**: **CRITICAL** - Customize for pharmacist employee invitations
   ```html
   Subject: You're invited to join {{ .SiteURL }} pharmacy team
   
   Hello!
   
   You've been invited to join a pharmacy team on PharmaSave AI.
   
   Role: {{ .Data.role }}
   Pharmacy: {{ .Data.pharmacy_name }}
   
   Click here to accept the invitation and set up your account:
   {{ .ConfirmationURL }}
   
   This invitation will expire in 72 hours.
   ```
3. **Magic Link**: Customize for pharmacist login
4. **Change Email Address**: Customize for pharmacist email updates  
5. **Reset Password**: Customize for pharmacist password reset

### 3.3 Authentication Settings

Go to **Authentication → Settings**:

```javascript
// Site URL (update for your domain)
Site URL: https://your-domain.com

// Redirect URLs (add all your domains)
Redirect URLs: 
- http://localhost:3000/**
- https://your-domain.com/**
- https://staging.your-domain.com/**

// JWT Settings
JWT expiry: 3600 (1 hour)
Refresh token rotation: Enabled
Reuse interval: 10 seconds
```

## 4. Storage Setup

### 4.1 Create Storage Buckets

Go to **Storage** and create the following buckets:

#### Verification Documents Bucket
```sql
-- Create bucket for pharmacy verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false);
```

**Bucket Policies**:
```sql
-- Only pharmacists can upload docs for their pharmacy
CREATE POLICY "Pharmacists can upload verification docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-docs' AND
    auth.uid() IN (
      SELECT auth_id FROM pharmacists 
      WHERE pharmacy_id::text = (storage.foldername(name))[1]
    )
  );

-- Only pharmacists can view docs for their pharmacy
CREATE POLICY "Pharmacists can view their pharmacy docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-docs' AND
    auth.uid() IN (
      SELECT auth_id FROM pharmacists 
      WHERE pharmacy_id::text = (storage.foldername(name))[1]
    )
  );
```

#### Listing Images Bucket
```sql
-- Create bucket for medication listing images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-images', 'listing-images', true);
```

**Bucket Policies**:
```sql
-- Pharmacists can upload images for their pharmacy's listings
CREATE POLICY "Pharmacists can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images' AND
    auth.uid() IN (
      SELECT p.auth_id FROM pharmacists p
      JOIN lstng l ON l.pharmacy_id = p.pharmacy_id
      WHERE l.id::text = (storage.foldername(name))[1]
    )
  );

-- Anyone can view listing images (public marketplace)
CREATE POLICY "Anyone can view listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');
```

## 5. Environment Variables Setup

### 5.1 Get Supabase Credentials

Go to **Settings → API**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URL (for direct connections)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

### 5.2 Environment File Template

See the `.env.example` file in the project root for a complete template.

## 6. Test Database Setup

### 6.1 Verify Table Creation

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `pharmacies` (business entities)
- `pharmacists` (employee accounts)
- `lstng` (listings)
- `txn` (transactions)
- `wlt` (wallets)
- `rvw` (reviews)
- And others...

### 6.2 Test Owner-First Authentication Flow

1. **Create Test Pharmacy Business (Owner Registration)**:
```sql
INSERT INTO pharmacies (name, license_num, email, phone, addr, location)
VALUES (
  'Test Pharmacy',
  'PH123456789',
  'owner@testpharmacy.com',
  '+201234567890',
  '123 Test Street, Cairo, Egypt',
  ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326)
);
```

2. **Create Test Primary Admin (Owner)**:
```sql
-- First, create user in Supabase Auth, then:
INSERT INTO pharmacists (auth_id, pharmacy_id, fname, lname, email, pharmacist_id_num, role)
VALUES (
  'auth-uid-owner-from-supabase',
  (SELECT id FROM pharmacies WHERE email = 'owner@testpharmacy.com'),
  'Ahmed',
  'Mohamed',
  'owner@testpharmacy.com',
  'PHARM123456',
  'primary_admin'
);
```

3. **Test Employee Invitation System**:
```sql
-- Primary Admin creates invitation
INSERT INTO pharmacy_invitations (pharmacy_id, invited_by, email, role, status)
VALUES (
  (SELECT pharmacy_id FROM pharmacists WHERE auth_id = auth.uid()),
  (SELECT id FROM pharmacists WHERE auth_id = auth.uid()),
  'employee@testpharmacy.com',
  'staff_pharmacist',
  'pending'
);

-- After employee accepts invitation and creates account:
INSERT INTO pharmacists (auth_id, pharmacy_id, fname, lname, email, pharmacist_id_num, role)
VALUES (
  'auth-uid-employee-from-supabase',
  (SELECT pharmacy_id FROM pharmacy_invitations WHERE email = 'employee@testpharmacy.com'),
  'Fatima',
  'Ali',
  'employee@testpharmacy.com',
  'PHARM789012',
  'staff_pharmacist'
);

-- Update invitation status
UPDATE pharmacy_invitations 
SET status = 'accepted', accepted_at = NOW()
WHERE email = 'employee@testpharmacy.com';
```

## 7. Development Setup

### 7.1 Install Supabase CLI (Optional)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

### 7.2 Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id your-project-ref > src/types/supabase.ts
```

### 7.3 Set up Database Migrations

```bash
supabase db reset
supabase db push
```

## 8. Production Deployment

### 8.1 Environment Configuration

Update production environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
```

### 8.2 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Storage policies configured
- [ ] Authentication providers configured
- [ ] JWT settings optimized
- [ ] Rate limiting enabled
- [ ] SSL enforced
- [ ] Database backups enabled

### 8.3 Performance Optimization

```sql
-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_pharmacists_pharmacy_auth 
ON pharmacists (pharmacy_id, auth_id);

CREATE INDEX CONCURRENTLY idx_listings_pharmacy_status 
ON lstng (pharmacy_id, status, created_at);

CREATE INDEX CONCURRENTLY idx_transactions_pharmacy_status 
ON txn (buyer_pharmacy_id, seller_pharmacy_id, status);
```

## 9. Common Issues & Solutions

### Issue 1: RLS Policy Violations
**Error**: "new row violates row-level security policy"
**Solution**: Ensure pharmacist is properly linked to pharmacy in `pharmacists` table

### Issue 2: Authentication Not Working
**Error**: "User not found" or "Access denied"
**Solution**: Verify `auth_id` in `pharmacists` table matches Supabase Auth user ID

### Issue 3: Invitation System Not Working
**Error**: "Cannot create invitation" or "Invalid role assignment"
**Solution**: Ensure Primary Admin role and check pharmacy_invitations table structure

### Issue 4: Storage Upload Fails
**Error**: "Storage policy violation"
**Solution**: Check storage policies and folder structure (pharmacy_id/file_name)

### Issue 5: Wrong Table References
**Error**: "relation 'pharm' does not exist"
**Solution**: Use correct table names: `pharmacies` not `pharm`, `pharmacists` not `users`

### Issue 6: Employee Cannot Access Pharmacy Data
**Error**: "Permission denied for relation pharmacies"
**Solution**: Verify employee invitation was accepted and pharmacist record created properly

## Next Steps

After completing this setup:

1. **Test the authentication flow** with pharmacy business registration
2. **Verify employee management** by adding multiple pharmacists to one pharmacy
3. **Test RLS policies** to ensure proper access control
4. **Set up your frontend** to use the corrected database schema
5. **Deploy to staging** environment for testing

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)

For PharmaSave AI setup issues:
- Check the database schema files in `database/schema/`
- Review the corrected authentication model in `docs/PRD.md`
- Verify business logic implementation in `README.md`

---

**Last Updated**: May 23, 2025  
**Version**: 2.0 (Corrected Business Model)  
**Status**: Ready for Implementation