'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowRight, Building2, User, Mail, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [formData, setFormData] = useState({
    pharmacyName: '',
    yourName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Basic validation
      const newErrors: Record<string, string> = {}
      if (!formData.pharmacyName.trim()) newErrors.pharmacyName = 'Pharmacy name is required'
      if (!formData.yourName.trim()) newErrors.yourName = 'Your name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsLoading(false)
        return
      }

      console.log('🔄 Starting registration process...')

      // Step 1: Test database connection first
      console.log('🔄 Testing database connection...')
      const { data: testData, error: testError } = await supabase
        .from('pharmacies')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ Database connection test failed:', testError)
        setErrors({ general: `Database connection failed: ${testError.message}` })
        setIsLoading(false)
        return
      }
      console.log('✅ Database connection successful')

      // Step 2: Create auth user
      console.log('🔄 Creating auth user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.yourName,
            pharmacy_name: formData.pharmacyName
          }
        }
      })

      if (authError) {
        console.error('❌ Auth creation failed:', authError)
        setErrors({ general: authError.message })
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth')
        setErrors({ general: 'Failed to create account' })
        setIsLoading(false)
        return
      }
      console.log('✅ Auth user created:', authData.user.id)
      console.log('📧 Email confirmed status:', authData.user.email_confirmed_at)

      // Step 3: Check if email confirmation is required
      const needsEmailConfirmation = !authData.user.email_confirmed_at && !authData.session
      
      if (needsEmailConfirmation) {
        console.log('📧 Email confirmation required - showing confirmation screen')
        setUserEmail(formData.email)
        setRegistrationComplete(true)
        setIsLoading(false)
        
        toast.success('🎉 Account created! Please check your email to confirm.', {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            border: 'none',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
          },
          icon: '📧',
        })
        return // Stop here and show email confirmation screen
      }

      console.log('✅ Email confirmed or not required - proceeding with profile creation')

      // Step 4: Create pharmacy business - COMPLETELY MINIMAL APPROACH
      console.log('🔄 Creating pharmacy with minimal data...')
      const pharmacyInsertData = {
        name: formData.pharmacyName.trim()
      }
      console.log('📝 Pharmacy insert data:', pharmacyInsertData)

      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert(pharmacyInsertData)
        .select('id, name')
        .single()

      if (pharmacyError) {
        console.error('❌ Pharmacy creation error (detailed):', {
          message: pharmacyError.message,
          details: pharmacyError.details,
          hint: pharmacyError.hint,
          code: pharmacyError.code,
          insertData: pharmacyInsertData
        })
        setErrors({ general: `Failed to create pharmacy profile: ${pharmacyError.message}` })
        setIsLoading(false)
        return
      }
      console.log('✅ Pharmacy created:', pharmacyData)

      // Step 5: Create pharmacist (primary admin) - MINIMAL APPROACH
      console.log('🔄 Creating pharmacist...')
      const [firstName, ...lastNameParts] = formData.yourName.split(' ')
      const lastName = lastNameParts.join(' ') || ''

      const pharmacistInsertData = {
        auth_id: authData.user.id,
        pharmacy_id: pharmacyData.id,
        fname: firstName.trim(),
        lname: lastName.trim(),
        email: formData.email.trim()
      }
      console.log('📝 Pharmacist insert data:', pharmacistInsertData)

      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .insert(pharmacistInsertData)
        .select('id, fname, lname')
        .single()

      if (pharmacistError) {
        console.error('❌ Pharmacist creation error (detailed):', {
          message: pharmacistError.message,
          details: pharmacistError.details,
          hint: pharmacistError.hint,
          code: pharmacistError.code,
          insertData: pharmacistInsertData
        })
        setErrors({ general: `Failed to create user profile: ${pharmacistError.message}` })
        setIsLoading(false)
        return
      }
      console.log('✅ Pharmacist created:', pharmacistData)

      // Step 6: Create wallet for pharmacy (optional - don't fail if this doesn't work)
      console.log('🔄 Creating wallet...')
      const { error: walletError } = await supabase
        .from('wlt')
        .insert({
          pharmacy_id: pharmacyData.id,
          balance: 0
        })

      if (walletError) {
        console.warn('⚠️ Wallet creation failed (not critical):', walletError.message)
        // Don't fail registration for wallet creation error
      } else {
        console.log('✅ Wallet created')
      }

      // Success! Show toast and redirect to dashboard
      console.log('🎉 Registration completed successfully!')
      console.log('👉 About to show toast notification...')
      
      const toastId = toast.success('🎉 Account created successfully! Welcome to PharmaSave AI!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '16px',
          border: 'none',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
        },
        icon: '🎉',
      })
      
      console.log('✅ Toast created with ID:', toastId)
      
      // Small delay to ensure toast appears before navigation
      setTimeout(() => {
        setIsLoading(false) // Reset loading state
        router.push('/dashboard')
      }, 1000)

    } catch (error) {
      console.error('💥 Unexpected registration error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        toast.error('Failed to resend confirmation email')
      } else {
        toast.success('Confirmation email sent! Check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to resend confirmation email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Email confirmation screen
  if (registrationComplete) {
    return (
      <>
        <Toaster 
          position="top-center"
          containerStyle={{ zIndex: 9999 }}
        />
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
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Check Your Email</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                We've sent a confirmation link to
              </p>
              <p className="text-pharmacy-green font-semibold">{userEmail}</p>
            </div>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <CheckCircle className="w-12 h-12 text-pharmacy-green mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Account Created Successfully!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click the confirmation link in your email to activate your account and access your dashboard.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Next steps:</strong><br />
                      1. Check your email inbox<br />
                      2. Click the confirmation link<br />
                      3. You'll be redirected to your dashboard
                    </p>
                  </div>

                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Resend Confirmation Email
                  </Button>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the email? Check your spam folder or click resend.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{ zIndex: 9999 }}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#10B981',
            color: 'white',
            zIndex: 9999,
          }
        }}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Use Shared Header Component */}
      <Header 
        variant="auth"
        showBackButton={true}
        backButtonText="Back to Home"
        backButtonHref="/"
      />

      <div className="max-w-md w-full mt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-pharmacy-green rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Your Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join 500+ pharmacies reducing medicine waste
          </p>
        </div>

        {/* Quick Registration Card */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700">
          <CardContent className="p-8">
            <div className="mb-6">
              <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                Quick Registration (4 fields only)
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Get started in under 30 seconds! Complete your profile later.
              </CardDescription>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pharmacy Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Pharmacy Name *
                </label>
                <input
                  type="text"
                  value={formData.pharmacyName}
                  onChange={(e) => handleInputChange('pharmacyName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-pharmacy-green ${
                    errors.pharmacyName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your pharmacy name"
                />
                {errors.pharmacyName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacyName}</p>
                )}
              </div>

              {/* Your Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.yourName}
                  onChange={(e) => handleInputChange('yourName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-pharmacy-green ${
                    errors.yourName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.yourName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.yourName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-pharmacy-green ${
                    errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-pharmacy-green pr-12 ${
                      errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password - NEW */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-pharmacy-green pr-12 ${
                      errors.confirmPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button - BRAND GUIDELINES APPLIED */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90 text-white py-3 flex items-center justify-center rounded border-0 font-medium"
                style={{ borderRadius: '4px' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-trust-blue hover:text-trust-blue/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-8 p-4 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg">
              <h4 className="text-sm font-medium text-pharmacy-green dark:text-pharmacy-green mb-2">
                ✨ What happens next:
              </h4>
              <ul className="text-sm text-pharmacy-green/80 dark:text-pharmacy-green/90 space-y-1">
                <li>• Account created instantly</li>
                <li>• Check email for confirmation link</li>
                <li>• You become Primary Admin</li>
                <li>• Complete profile at your own pace</li>
                <li>• Invite pharmacist employees later</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}