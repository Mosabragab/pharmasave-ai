'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import toast, { Toaster } from 'react-hot-toast'
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Get current user email
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      } else {
        // No user found, redirect to login
        router.push('/auth/signin')
      }
    }

    getUserEmail()
  }, [router])

  const handleResendConfirmation = async () => {
    if (!userEmail) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        toast.error('Failed to resend confirmation email')
        console.error('Resend error:', error)
      } else {
        toast.success('Confirmation email sent! Check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to resend confirmation email')
      console.error('Resend error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Confirmation Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Please confirm your email to access your dashboard
            </p>
            {userEmail && (
              <p className="text-pharmacy-green font-semibold mt-1">{userEmail}</p>
            )}
          </div>

          <Card className="bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="w-12 h-12 text-pharmacy-green mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Almost There!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We've sent a confirmation link to your email. Click the link to activate your account and access your dashboard.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Next steps:</strong><br />
                    1. Check your email inbox (and spam folder)<br />
                    2. Click the confirmation link<br />
                    3. You'll be automatically redirected to your dashboard
                  </p>
                </div>

                <Button
                  onClick={handleResendConfirmation}
                  disabled={isLoading || !userEmail}
                  className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Resend Confirmation Email
                </Button>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="flex-1"
                  >
                    Sign Out
                  </Button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Wrong email address? Sign out and create a new account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
