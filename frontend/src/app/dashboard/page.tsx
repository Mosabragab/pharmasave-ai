'use client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/layout/Layout';
import SimpleDashboard from '@/components/SimpleDashboard';
import { Shield, CheckCircle, Lock, Eye, Plus, ShoppingCart, FileText, TrendingUp, Star, Users, Building2, Clock, Bell } from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  verified: boolean;
  ver_status?: 'unverified' | 'pending' | 'approved' | 'rejected' | 'expired';
  profile_completion_percent: number;
  display_id?: string;
  license_num?: string;
  email?: string;
  phone?: string;
  addr?: string;
}

interface Pharmacist {
  id: string;
  pharmacy_id: string;
  fname: string;
  lname: string;
  profile_completion_percent: number;
  role: string;
  pharmacist_id_num?: string;
  phone?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [pharmacist, setPharmacist] = useState<Pharmacist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const router = useRouter();

  // Function to create minimal profile inline
  const createMinimalProfile = async (user: User) => {
    try {
      console.log('🔄 Creating minimal profile for:', user.email);
      
      // Get user metadata from registration
      const userMetadata = user.user_metadata || {};
      const pharmacyName = userMetadata.pharmacy_name || 'My Pharmacy';
      const fullName = userMetadata.full_name || user.email?.split('@')[0] || 'User';
      
      // Create pharmacy
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert({ name: pharmacyName })
        .select('id, name, display_id')
        .single();
        
      if (pharmacyError) {
        console.error('❌ Pharmacy creation error:', pharmacyError);
        setError('Failed to create pharmacy profile');
        return;
      }
      
      // Create pharmacist
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .insert({
          auth_id: user.id,
          pharmacy_id: pharmacyData.id,
          fname: firstName.trim(),
          lname: lastName.trim(),
          email: user.email
        })
        .select('id, fname, lname')
        .single();
        
      if (pharmacistError) {
        console.error('❌ Pharmacist creation error:', pharmacistError);
        setError('Failed to create user profile');
        return;
      }
      
      // Create wallet (optional)
      await supabase.from('wlt').insert({
        pharmacy_id: pharmacyData.id,
        balance: 0
      });
      
      console.log('✅ Minimal profile created successfully');
      
      // Reload the page to fetch the new profile
      window.location.reload();
      
    } catch (error) {
      console.error('💥 Profile creation error:', error);
      setError('Failed to create profile');
    }
  };

  useEffect(() => {
    async function loadUserData() {
      try {
        setDebugInfo('Starting authentication check...');
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setDebugInfo(`Auth error: ${authError.message}`);
          setError('Authentication failed. Please sign in again.');
          router.push('/auth/signin');
          return;
        }

        if (!user) {
          setDebugInfo('No authenticated user found');
          setError('Please sign in to access your dashboard.');
          router.push('/auth/signin');
          return;
        }

        setUser(user);
        setDebugInfo(`User found: ${user.email}`);

        // Check if pharmacist record exists
        setDebugInfo('Looking for pharmacist record...');
        const { data: pharmacistData, error: pharmacistError } = await supabase
          .from('pharmacists')
          .select(`
            id,
            pharmacy_id,
            fname,
            lname,
            email,
            role,
            pharmacist_id_num,
            phone,
            profile_completion_percent
          `)
          .eq('auth_id', user.id)
          .single();

        if (pharmacistError) {
          setDebugInfo(`Pharmacist query error: ${pharmacistError.message}`);
          if (pharmacistError.message.includes('relation "pharmacists" does not exist')) {
            setError('Database not set up. Please contact support.');
            return;
          }
          
          // Check if email confirmation is required
          if (!user.email_confirmed_at) {
            console.log('❌ Email not confirmed - redirecting to confirmation');
            router.push('/auth/confirm-email');
            return;
          }
          
          // Email confirmed but no profile - let dashboard handle this case
          console.log('📧 Email confirmed but no profile found - will create minimal profile');
          setDebugInfo('Creating profile...');
          setError('Creating your profile, please wait...');
          await createMinimalProfile(user);
          return; // Will reload after profile creation
        }

        if (!pharmacistData) {
          setDebugInfo('No pharmacist record found');
          
          // Check if email confirmation is required
          if (!user.email_confirmed_at) {
            console.log('❌ Email not confirmed - redirecting to confirmation');
            router.push('/auth/confirm-email');
            return;
          }
          
          // Email confirmed but no profile - create minimal profile inline
          console.log('📧 Email confirmed but no profile data - creating minimal profile');
          setDebugInfo('Creating profile...');
          setError('Creating your profile, please wait...');
          await createMinimalProfile(user);
          return; // Will reload after profile creation
        }

        setPharmacist(pharmacistData);
        setDebugInfo(`Pharmacist found: ${pharmacistData.fname} ${pharmacistData.lname}`);

        // Get pharmacy data
        setDebugInfo('Looking for pharmacy record...');
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select(`
            id,
            display_id,
            name,
            email,
            phone,
            addr,
            license_num,
            verified,
            ver_status,
            profile_completion_percent
          `)
          .eq('id', pharmacistData.pharmacy_id)
          .single();

        if (pharmacyError) {
          setDebugInfo(`Pharmacy query error: ${pharmacyError.message}`);
          setError('Failed to load pharmacy information.');
          return;
        }

        if (!pharmacyData) {
          setDebugInfo('No pharmacy record found');
          setError('Pharmacy not found. Please contact support.');
          return;
        }

        setPharmacy(pharmacyData);
        setDebugInfo(`Pharmacy found: ${pharmacyData.name}`);
        console.log('🎯 Pharmacy verification status:', pharmacyData.ver_status, '| Verified:', pharmacyData.verified);
        setError(null);

      } catch (error: any) {
        console.error('Error loading user data:', error);
        setError(`Unexpected error: ${error.message}`);
        setDebugInfo(`Unexpected error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Show loading state
  if (loading) {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading your dashboard...
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{debugInfo}</div>
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-4">
              <div className="h-2 bg-emerald-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Dashboard Access Error
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                
                {/* Debug information */}
                <details className="text-left mb-6">
                  <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    🔧 Debug Information
                  </summary>
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {debugInfo}
                  </div>
                </details>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                  >
                    Complete Registration
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    🔄 Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate completion percentage - FIXED: Use same logic as profile page
  const isVerified = pharmacy!.verified
  
  const getCompletionPercent = () => {
    if (!pharmacy || !pharmacist) return 0
    
    // Stage 4: Verified (100%) - After admin approval
    if (pharmacy.verified) {
      return 100
    }
    
    // Stage 3: Business Details (75%) - Need license + pharmacist ID  
    if (pharmacy.license_num && pharmacist.pharmacist_id_num) {
      return 75
    }
    
    // Stage 2: Contact Info (50%) - Need business email + address + personal phone
    if (pharmacy.email && pharmacy.addr && pharmacist.phone) {
      return 50
    }
    
    // Stage 1: Basic Info (25%) - Always complete after registration
    return 25
  }
  
  const completionPercent = getCompletionPercent()

  // 🎯 GET VERIFICATION STATUS MESSAGE - SUSTAINABLE FIX
  // Shows appropriate message based on actual verification status
  const getVerificationStatusMessage = () => {
    // Check if documents are submitted and under review
    if (pharmacy!.ver_status === 'pending') {
      return {
        title: 'Verification Under Review ⏳',
        message: 'Your documents have been submitted and are being reviewed by our admin team. We\'ll notify you within 24-48 hours.',
        icon: 'pending',
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderClass: 'border-yellow-200 dark:border-yellow-800',
        iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/40',
        titleClass: 'text-yellow-800 dark:text-yellow-200',
        textClass: 'text-yellow-700 dark:text-yellow-300',
        iconClass: 'bg-yellow-600 dark:bg-yellow-400'
      }
    }
    
    // Check if verification was rejected
    if (pharmacy!.ver_status === 'rejected') {
      return {
        title: 'Verification Updates Needed ❌',
        message: 'Please review the feedback and resubmit your verification documents.',
        icon: 'rejected',
        bgClass: 'bg-red-50 dark:bg-red-900/20',
        borderClass: 'border-red-200 dark:border-red-800',
        iconBgClass: 'bg-red-100 dark:bg-red-900/40',
        titleClass: 'text-red-800 dark:text-red-200',
        textClass: 'text-red-700 dark:text-red-300',
        iconClass: 'text-red-600 dark:text-red-400'
      }
    }
    
    // Default: Need to complete profile and submit documents
    return {
      title: 'Verification Required 🔒',
      message: 'Complete your profile and submit verification documents to unlock full marketplace access.',
      icon: 'required',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
      borderClass: 'border-amber-200 dark:border-amber-800',
      iconBgClass: 'bg-amber-100 dark:bg-amber-900/40',
      titleClass: 'text-amber-800 dark:text-amber-200',
      textClass: 'text-amber-700 dark:text-amber-300',
      iconClass: 'text-amber-600 dark:text-amber-400'
    }
  }

  // 🔒 UNVERIFIED USER - LIMITED ACCESS WITH PROFILE COMPLETION
  if (!isVerified) {
    return (
      <Layout 
        variant="dashboard"
        pharmacyName={pharmacy!.name}
        pharmacyId={pharmacy!.display_id || 'PH0001'}
        userRole={pharmacist!.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        isVerified={pharmacy!.verified}
        showSettings={true}
        showSignOut={true}
        showProfileButton={true}
        showWalletButton={true}
        onSignOut={handleSignOut}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {pharmacist!.fname}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Complete verification to unlock all features and start reducing medicine waste.
            </p>
          </div>

          {/* Profile Completion Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Profile Completion
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {completionPercent}% complete
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">{completionPercent}%</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>

            <div className={`${getVerificationStatusMessage().bgClass} border ${getVerificationStatusMessage().borderClass} rounded-xl p-4 mb-6`}>
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${getVerificationStatusMessage().iconBgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {getVerificationStatusMessage().icon === 'pending' ? (
                    <div className={`w-4 h-4 ${getVerificationStatusMessage().iconClass} rounded-full animate-pulse`} />
                  ) : (
                    <Lock className={`w-4 h-4 ${getVerificationStatusMessage().iconClass}`} />
                  )}
                </div>
                <div>
                  <h4 className={`font-semibold ${getVerificationStatusMessage().titleClass} mb-1`}>
                    {getVerificationStatusMessage().title}
                  </h4>
                  <p className={`${getVerificationStatusMessage().textClass} text-sm`}>
                    {getVerificationStatusMessage().message}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button 
                onClick={() => router.push('/dashboard/profile')}
                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>
                  {getVerificationStatusMessage().icon === 'pending' 
                    ? 'View Verification Status' 
                    : 'Complete Profile & Verification'
                  }
                </span>
              </button>
            </div>
          </div>

          {/* Quick Actions - Limited */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Available Features
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-6">
              <button 
                onClick={() => router.push('/marketplace/demo')}
                className="flex items-center justify-center space-x-2 bg-pharmacy-green hover:bg-pharmacy-green/90 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span>Demo Marketplace</span>
              </button>
            </div>

            {/* Locked Features */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">🔒 Unlock with verification:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Transaction Management</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Wallet Dashboard</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Create Listings</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Full Marketplace</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ VERIFIED USER - FULL ACCESS WITH ALL NEW FEATURES
  return (
    <Layout 
      variant="dashboard"
      pharmacyName={pharmacy!.name}
      pharmacyId={pharmacy!.display_id || 'PH0001'}
      userRole={pharmacist!.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      isVerified={pharmacy!.verified}
      showSettings={true}
      showSignOut={true}
      showProfileButton={true}
      showWalletButton={true}
      onSignOut={handleSignOut}
    >
      {/* Use the Simple Dashboard Component */}
      <SimpleDashboard
        pharmacy={{
          id: pharmacy!.id,
          name: pharmacy!.name,
          display_id: pharmacy!.display_id || 'PH0001'
        }}
        pharmacist={{
          id: pharmacist!.id,
          fname: pharmacist!.fname,
          lname: pharmacist!.lname,
          role: pharmacist!.role
        }}
      />
    </Layout>
  );
}
