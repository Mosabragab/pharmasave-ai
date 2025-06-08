'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import toast, { Toaster } from 'react-hot-toast'
import { Building2, User, CheckCircle, Loader2 } from 'lucide-react'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    handleProfileCompletion()
  }, [])

  const handleProfileCompletion = async () => {
    try {
      setStep(1)
      console.log('🔄 Starting profile completion process...')

      // Step 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('❌ Not authenticated:', authError)
        toast.error('Please sign in to complete your profile')
        router.push('/auth/signin')
        return
      }

      setUser(user)
      console.log('✅ User authenticated:', user.email)

      // Step 2: Check email confirmation
      if (!user.email_confirmed_at) {
        console.log('❌ Email not confirmed')
        toast.error('Please confirm your email first')
        router.push('/auth/confirm-email')
        return
      }

      console.log('✅ Email confirmed')
      setStep(2)

      // Step 3: Check if profile already exists
      console.log('🔄 Checking if profile already exists...')
      const { data: existingPharmacist } = await supabase
        .from('pharmacists')
        .select('*, pharmacies(*)')
        .eq('auth_id', user.id)
        .single()

      if (existingPharmacist) {
        console.log('✅ Profile already exists, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      console.log('🔄 Profile not found, creating new profile...')
      setStep(3)

      // Step 4: Get user metadata from registration
      const userMetadata = user.user_metadata || {}
      const pharmacyName = userMetadata.pharmacy_name || 'My Pharmacy'
      const fullName = userMetadata.full_name || user.email?.split('@')[0] || 'User'

      console.log('📝 User metadata:', { pharmacyName, fullName })

      // Step 5: Create pharmacy
      console.log('🔄 Creating pharmacy...')
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert({
          name: pharmacyName
        })
        .select('id, name, display_id')
        .single()

      if (pharmacyError) {
        console.error('❌ Pharmacy creation error:', pharmacyError)
        toast.error('Failed to create pharmacy profile')
        return
      }

      console.log('✅ Pharmacy created:', pharmacyData)
      setStep(4)

      // Step 6: Create pharmacist
      console.log('🔄 Creating pharmacist profile...')
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ') || ''

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
        .single()

      if (pharmacistError) {
        console.error('❌ Pharmacist creation error:', pharmacistError)
        toast.error('Failed to create user profile')
        return
      }

      console.log('✅ Pharmacist created:', pharmacistData)
      setStep(5)

      // Step 7: Create wallet
      console.log('🔄 Creating wallet...')
      const { error: walletError } = await supabase
        .from('wlt')
        .insert({
          pharmacy_id: pharmacyData.id,
          balance: 0
        })

      if (walletError) {
        console.warn('⚠️ Wallet creation failed (not critical):', walletError)
      } else {
        console.log('✅ Wallet created')
      }

      setStep(6)
      setProfileData({ pharmacy: pharmacyData, pharmacist: pharmacistData })

      // Step 8: Success
      console.log('🎉 Profile completion successful!')
      toast.success('Profile created successfully! Welcome to PharmaSave AI!')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('💥 Profile completion error:', error)
      toast.error('An error occurred while creating your profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getStepMessage = () => {
    switch (step) {
      case 1: return 'Verifying authentication...'
      case 2: return 'Checking email confirmation...'
      case 3: return 'Creating pharmacy profile...'
      case 4: return 'Setting up user account...'
      case 5: return 'Initializing wallet...'
      case 6: return 'Finalizing setup...'
      default: return 'Completing profile...'
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Header 
          variant="auth"
          showBackButton={true}
          backButtonText="Back to Home"
          backButtonHref="/"
        />

        <div className="max-w-md w-full mt-20">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-pharmacy-green rounded-full flex items-center justify-center">
                {step < 6 ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {step < 6 ? 'Setting Up Your Account' : 'Profile Complete!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {step < 6 ? 'Please wait while we create your profile...' : 'Redirecting to your dashboard...'}
            </p>
          </div>

          <Card className="bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              {step < 6 ? (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-pharmacy-green/10 rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-8 h-8 text-pharmacy-green" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Creating Your Profile
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {getStepMessage()}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-pharmacy-green h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(step / 6) * 100}%` }}
                    ></div>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Step {step} of 6
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Welcome to PharmaSave AI! 🎉
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Your profile has been created successfully.
                    </p>
                  </div>

                  {profileData && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <strong>Pharmacy:</strong> {profileData.pharmacy.name}<br />
                        <strong>ID:</strong> {profileData.pharmacy.display_id}<br />
                        <strong>User:</strong> {profileData.pharmacist.fname} {profileData.pharmacist.lname}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Redirecting to dashboard in 2 seconds...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
