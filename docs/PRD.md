# PharmaSave AI: Product Requirements Document (PRD) - UPDATED

## 1. Introduction

### 1.1 Purpose
This document outlines the product requirements for PharmaSave AI, a specialized SaaS platform designed to help pharmacies in Egypt reduce financial losses from near-expired medicines by creating a secure marketplace for verified pharmacies to sell or trade these medications.

### 1.2 Product Overview  
PharmaSave AI connects verified pharmacy businesses within an admin-configurable radius (default 10km), enabling them to sell or trade near-expired medications through authenticated pharmacist employees. The platform transforms potential waste into value while implementing an enhanced anonymized identity system that protects business privacy. The platform incorporates AI-driven features powered by both OpenAI and Claude, and fully supports both Arabic and English languages.

### 1.3 Business Model Overview
**OWNER-FIRST AUTHENTICATION LOGIC:**
- **Pharmacy Owners/Managers** = Create and control pharmacy business accounts
- **Primary Admin Role** = Full business control including employee management and invitations
- **Employee Invitation System** = Owners invite pharmacists via email-based invitations
- **Role Hierarchy** = Primary Admin → Co-Admin → Staff Pharmacist permissions
- **Multiple pharmacists** can access the same pharmacy business account
- **One pharmacy** can have multiple pharmacist employees
- **Verification applies to the pharmacy business**, not individual pharmacist accounts

### 1.4 Target Users
- **Primary**: Licensed pharmacists (employees) working at Egyptian pharmacies
- **Secondary**: Pharmacy owners and managers 
- **Tertiary**: Independent pharmacies and pharmacy chains
- **Admin**: Platform administrators for system management

## 2. Product Features

### 2.1 Core Features

#### 2.1.1 Owner-First Authentication & Access Management
- **Owner Registration**
  - Pharmacy owner/manager creates account with email/password
  - Owner creates pharmacy business profile during registration
  - Owner handles pharmacy business verification process
  - Owner becomes Primary Admin with full business control
  - Business verification applies to entire pharmacy entity

- **Employee Invitation System**
  - Primary Admin invites pharmacist employees via email
  - Invitation includes pre-assigned role (Co-Admin or Staff Pharmacist)
  - Invited pharmacists receive email invitation link
  - Pharmacists create personal accounts via invitation acceptance
  - Multiple pharmacists can access the same pharmacy account

- **Pharmacy Business Management**
  - Pharmacy business profiles (separate from pharmacist accounts)
  - Business verification process (pharmacy license, business registration)
  - Anonymized business IDs (PHxxxxx) for marketplace privacy
  - Business settings and preferences shared across all pharmacist employees
  - Subscription management at the pharmacy business level

- **Role-Based Access Control**
  - **Primary Admin (Owner)**: Full business control, employee management, subscription control
  - **Co-Admin**: Business operations, can invite Staff Pharmacists (cannot modify other admins)
  - **Staff Pharmacist**: Marketplace access, listing creation, transaction management
  - **Invitation Management**: Primary Admin can invite, modify roles, deactivate employees
  - **Permission Hierarchy**: Clear role escalation rules prevent unauthorized access
  - **Employee Lifecycle**: Complete onboarding and offboarding via invitation system

#### 2.1.2 Pharmacy Verification Process
- **Business Entity Verification** (not individual pharmacists)
  - Pharmacy business license verification
  - Business registration documentation
  - Physical address and location verification
  - Multiple pharmacist credentials (pharmacist IDs) for linked employees
  - AI-assisted document authenticity checking
  - Admin approval workflow for pharmacy businesses

- **60-Day Trial Activation**
  - Trial activates upon pharmacy business verification (not individual pharmacist verification)  
  - All pharmacists at verified pharmacy gain marketplace access
  - Trial period shared across all pharmacist employees
  - Subscription applies to the pharmacy business entity

#### 2.1.3 Marketplace & Listing Management
- **Pharmacy-Level Listings**
  - Listings belong to pharmacy businesses (not individual pharmacists)
  - Any authorized pharmacist can create listings for their pharmacy
  - Listings show "Verified Pharmacy" label (not pharmacist names)
  - PHxxxxx pharmacy identifier revealed only after transaction approval
  - Tracking of which pharmacist created each listing (internal audit)

- **Business-to-Business Transactions**
  - Transactions occur between pharmacy businesses  
  - Any authorized pharmacist can initiate transactions for their pharmacy
  - Both buyer and seller pharmacy identities protected until approval
  - Contact exchange happens at pharmacy business level
  - Transaction approval by authorized pharmacists at each pharmacy

#### 2.1.4 Enhanced Privacy & Anonymity System
- **Progressive Business Identity Disclosure**
  - Stage 1: "Verified Pharmacy" labels during browsing
  - Stage 2: PHxxxxx identifiers after transaction approval  
  - Stage 3: Pharmacy business contact details for delivery coordination
  - **Important**: Real pharmacy business names NEVER revealed to other users
  - **Important**: Individual pharmacist identities NEVER revealed

- **Review System Privacy**
  - Reviews written by pharmacist employees on behalf of their pharmacy
  - Reviews always show "Verified Pharmacy" for both reviewer and reviewed
  - No pharmacist names or PHxxxxx identifiers in review system
  - Admin moderation ensures no identifying information leaks

#### 2.1.5 Wallet & Financial Management
- **Pharmacy Business Wallets**
  - One wallet per pharmacy business (not per pharmacist)
  - Multiple pharmacists can view wallet (if permissions allow)
  - Transaction fees deducted at pharmacy business level
  - Financial permissions managed by primary/manager pharmacists
  - Audit trail of which pharmacist initiated financial actions

### 2.2 User Workflows

#### 2.2.1 Owner-First Onboarding & Invitation Workflow
1. **Primary Admin (Owner) Registration**:
   - Pharmacy owner/manager creates personal account with email/password
   - Owner provides personal details (name, pharmacist ID number)
   - Owner creates pharmacy business profile with business information
   - Owner uploads pharmacy business verification documents
   - System creates pharmacy business entity with owner as Primary Admin
   - Admin reviews and approves pharmacy business verification
   - Upon approval: 60-day trial activates for entire pharmacy business
   - Primary Admin gains full permissions and employee management access

2. **Employee Invitation Process**:
   - Primary Admin accesses employee management dashboard
   - Primary Admin sends email invitation with pre-assigned role
   - Invited pharmacist receives invitation email with secure link
   - Pharmacist clicks invitation link and creates personal account
   - System automatically links pharmacist to pharmacy business
   - Employee gains access based on assigned role and pharmacy verification status
   - If pharmacy verified: immediate marketplace access based on role
   - If pharmacy unverified: access to preview mode only

3. **Role Management by Primary Admin**:
   - Primary Admin can modify employee roles at any time
   - Primary Admin can deactivate employee access when needed
   - Co-Admins can invite Staff Pharmacists but cannot modify other admin roles
   - Full audit trail maintained for all employee management actions

#### 2.2.2 Business Transaction Workflow
1. **Transaction Initiation** (any authorized pharmacist):
   - Pharmacist browses marketplace (sees "Verified Pharmacy" labels)
   - Pharmacist finds desired medication from another pharmacy business
   - Pharmacist initiates purchase/trade request on behalf of their pharmacy
   - System verifies pharmacy business wallet has sufficient funds
   - Request sent to seller pharmacy business

2. **Transaction Approval** (authorized pharmacist at seller pharmacy):
   - Any authorized pharmacist at seller pharmacy receives notification
   - Pharmacist reviews request and approves/rejects on behalf of pharmacy
   - Upon approval: PHxxxxx identifiers revealed to both pharmacies
   - Contact information shared at pharmacy business level
   - Pharmacists coordinate delivery on behalf of their respective pharmacies

3. **Transaction Completion**:
   - Delivery coordination between pharmacy businesses
   - Both pharmacies confirm delivery completion
   - Payment processed at pharmacy business level (wallet-to-wallet)
   - Platform fees deducted from both pharmacy wallets
   - Transaction recorded in both pharmacy business histories

#### 2.2.3 Owner-Controlled Employee Management Workflow
1. **Invitation-Based Employee Addition**:
   - Primary Admin accesses employee management interface
   - Primary Admin enters employee email and selects role (Co-Admin or Staff Pharmacist)
   - System sends secure email invitation with role details
   - Employee accepts invitation and completes account setup
   - Employee automatically gains access based on assigned role
   - Primary Admin receives confirmation of successful employee onboarding

2. **Advanced Permission Management**:
   - Primary Admin views all employees with their roles and access levels
   - Primary Admin can promote/demote employees (Staff → Co-Admin or vice versa)
   - Primary Admin can deactivate employee access (maintains data for audit)
   - Co-Admins can invite Staff Pharmacists but cannot modify admin roles
   - Complete activity tracking for all employee actions within business
   - Role change notifications sent to affected employees

### 2.3 Technical Architecture Updates

#### 2.3.1 Database Schema (Aligned with Tables.sql)
- **pharmacies table**: Business entities with verification status
- **pharmacists table**: Employee accounts with auth_id and pharmacy_id relationships
- **lstng table**: Listings belong to pharmacy_id (not user_id)
- **txn table**: Transactions between buyer_pharmacy_id and seller_pharmacy_id
- **wlt table**: Wallets belong to pharmacy_id (not user_id)
- **rvw table**: Reviews between pharmacy businesses

#### 2.3.2 Owner-First Authentication Flow
- **Owner Registration**: Primary Admin creates business account and personal login
- **Invitation System**: Email-based invitations create pending employee accounts
- **Employee Onboarding**: Invited pharmacists complete registration via invitation links
- **Supabase Auth**: Manages all pharmacist employee login accounts
- **Database Relationships**: pharmacists.auth_id → Supabase Auth, pharmacists.pharmacy_id → business
- **pharmacy_invitations table**: Tracks invitation status and role assignments
- **Row Level Security**: Policies ensure employees only access their business data
- **Permission System**: Owner-controlled role assignments determine employee access levels

## 3. Updated Success Metrics

### 3.1 Business Metrics
- **Pharmacy Business Acquisition**: Number of verified pharmacy businesses
- **Pharmacist User Adoption**: Number of active pharmacist employees per pharmacy
- **Business Transaction Volume**: Inter-pharmacy transaction frequency and value
- **Subscription Metrics**: Pharmacy business subscription renewal rates
- **Geographic Coverage**: Number of verified pharmacies per region

### 3.2 User Experience Metrics  
- **Employee Engagement**: Active pharmacist users per pharmacy business
- **Permission Utilization**: How effectively role-based permissions are used
- **Cross-Pharmacy Collaboration**: Transaction success rate between businesses
- **Privacy Satisfaction**: User feedback on anonymity protection features

### 3.3 Technical Performance Metrics
- **Authentication Success**: Login success rate for pharmacist accounts
- **Permission Enforcement**: Proper access control implementation
- **Business Data Integrity**: Accuracy of pharmacy-pharmacist relationships
- **Transaction Processing**: Business-to-business transaction completion rate

## 4. Implementation Priorities

### 4.1 Phase 1: Core Business Logic (Updated)
- Implement correct pharmacies/pharmacists database schema
- Build pharmacist authentication with pharmacy business linking
- Create pharmacy business verification workflow  
- Develop role-based permission system
- Implement basic marketplace with business anonymity

### 4.2 Phase 2: Enhanced Business Features
- Advanced employee management capabilities
- Enhanced privacy protection with progressive disclosure
- Business-to-business transaction workflows
- Pharmacy business analytics and reporting
- Review system with business anonymity

### 4.3 Phase 3: Advanced Features
- AI integration for business matching and optimization
- Advanced employee permission management
- Multi-location pharmacy chain support
- Advanced business analytics and insights
- Mobile app with full feature parity

### 4.4 Phase 4: Scale & Enterprise  
- Multi-region pharmacy business support
- Enterprise features for pharmacy chains
- Advanced business intelligence
- Third-party integration APIs
- Premium business features

## 5. Legal & Compliance Considerations

### 5.1 Business Entity Compliance
- Pharmacy business license verification requirements
- Business registration documentation standards
- Employee pharmacist credential verification
- Multi-employee access control compliance
- Business transaction record keeping

### 5.2 Privacy Protection for Businesses
- Business identity protection regulations
- Employee privacy within business context
- Inter-business communication privacy
- Business competitive information protection
- Review anonymity for business reputation

## 6. Risk Mitigation Updates

### 6.1 Business Model Risks
- **Risk**: Confusion about pharmacy vs pharmacist accounts
  - **Mitigation**: Clear onboarding explaining business-employee model
  
- **Risk**: Employee access control issues  
  - **Mitigation**: Robust permission system with audit trails
  
- **Risk**: Business verification complexity
  - **Mitigation**: Step-by-step verification with clear requirements

### 6.2 Technical Implementation Risks
- **Risk**: Authentication complexity with dual entity model
  - **Mitigation**: Well-documented database relationships and clear RLS policies
  
- **Risk**: Privacy system complexity
  - **Mitigation**: Comprehensive testing of anonymity features

## 7. Success Criteria

### 7.1 Launch Success Criteria
- Successfully verify 100+ pharmacy businesses in greater Cairo
- Achieve 80%+ pharmacist employee adoption rate per verified pharmacy
- Complete 1000+ successful inter-pharmacy transactions
- Maintain 99.9% business anonymity protection (no identity leaks)
- Achieve 4.5+ star rating from pharmacy business users

### 7.2 Long-term Success Criteria
- Expand to 500+ verified pharmacy businesses nationwide
- Process 10,000+ monthly inter-pharmacy transactions
- Achieve 80%+ subscription conversion rate post-trial
- Maintain industry-leading privacy protection standards
- Become the standard platform for inter-pharmacy medicine trading in Egypt

---

**Note**: This updated PRD reflects the corrected business logic where pharmacies are business entities accessed by authenticated pharmacist employees, ensuring proper separation of concerns and accurate technical implementation.