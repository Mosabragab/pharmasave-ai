'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowRight, Building2, Mail, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Basic validation
      const newErrors: Record<string, string> = {}
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      if (!formData.password) newErrors.password = 'Password is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsLoading(false)
        return
      }

      console.log('Attempting to sign in with:', formData.email)

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      })

      console.log('Sign in response:', { data, error })

      if (error) {
        console.error('Authentication error:', error)
        let errorMessage = 'Failed to sign in'
        
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many attempts. Please wait a moment and try again.'
        } else {
          errorMessage = error.message
        }
        
        setErrors({ general: errorMessage })
        setIsLoading(false)
        return
      }

      if (!data.user) {
        console.error('No user data returned')
        setErrors({ general: 'Authentication failed. Please try again.' })
        setIsLoading(false)
        return
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        console.log('Email not confirmed, redirecting to confirmation page')
        toast.error('Please confirm your email address first', {
          duration: 4000,
          position: 'top-center'
        })
        setIsLoading(false)
        router.push('/auth/confirm-email')
        return
      }

      console.log('Sign in successful! User:', data.user.email)
      console.log('Session:', data.session ? 'Active' : 'None')
      
      // Show success toast
      toast.success('✅ Sign in successful! Welcome back!', {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontWeight: '600',
        },
      })
      
      // Small delay to ensure authentication state is set
      setTimeout(() => {
        console.log('Redirecting to dashboard...')
        setIsLoading(false)
        router.push('/dashboard')
      }, 500)

    } catch (error) {
      console.error('Unexpected sign in error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear general error when user changes input
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        {/* Use Shared Header Component */}
        <Header 
          variant="auth"
          showBackButton={true}
          backButtonText="Back to Home"
          backButtonHref="/"
        />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-pharmacy-green rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign in to your PharmaSave AI account
          </p>
        </div>

        {/* Sign In Card */}
        <Card className="bg-white dark:bg-slate-800 shadow-lg border-gray-200 dark:border-slate-700">
          <CardContent className="p-8">
            <div className="mb-6">
              <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Access your pharmacy dashboard and manage your listings
              </CardDescription>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:focus:border-pharmacy-green transition-all ${
                    errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:focus:border-pharmacy-green pr-12 transition-all ${
                      errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-trust-blue hover:text-trust-blue/80 font-medium">
                  Create account
                </Link>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Link href="/auth/forgot-password" className="text-trust-blue hover:text-trust-blue/80 font-medium">
                  Forgot password?
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-trust-blue/10 dark:bg-trust-blue/20 rounded-lg text-center">
          <h4 className="text-sm font-medium text-trust-blue dark:text-trust-blue mb-2">
            🚀 New to PharmaSave AI?
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Join 500+ pharmacies saving money by reducing medicine waste
          </p>
          <Link href="/auth/signup">
            <Button 
              variant="secondary"
              className="hover:bg-trust-blue/20"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs">
            <details>
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
                🔧 Debug Info
              </summary>
              <div className="mt-2 space-y-1 text-gray-500 dark:text-gray-500">
                <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
                <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>Form Data: {JSON.stringify(formData, null, 2)}</div>
              </div>
            </details>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  )
}