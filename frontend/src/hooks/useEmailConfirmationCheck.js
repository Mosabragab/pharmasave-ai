// Dashboard Email Confirmation Check
// Add this to your dashboard page to protect it from unconfirmed users

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function useEmailConfirmationCheck() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      try {
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          console.log('❌ No authenticated user found')
          router.push('/auth/signin')
          return
        }

        console.log('👤 Current user:', user.email)
        console.log('📧 Email confirmed at:', user.email_confirmed_at)

        // Check if email is confirmed
        if (!user.email_confirmed_at) {
          console.log('❌ Email not confirmed - redirecting to confirmation')
          toast.error('Please confirm your email before accessing the dashboard')
          router.push('/auth/confirm-email')
          return
        }

        console.log('✅ Email confirmed - allowing dashboard access')
        setIsConfirmed(true)
      } catch (error) {
        console.error('💥 Error checking email confirmation:', error)
        router.push('/auth/signin')
      } finally {
        setIsChecking(false)
      }
    }

    checkEmailConfirmation()
  }, [router])

  return { isChecking, isConfirmed }
}

// Usage in your dashboard page:
/*
import useEmailConfirmationCheck from '@/hooks/useEmailConfirmationCheck'

export default function DashboardPage() {
  const { isChecking, isConfirmed } = useEmailConfirmationCheck()

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pharmacy-green"></div>
      </div>
    )
  }

  if (!isConfirmed) {
    return null // Will redirect automatically
  }

  return (
    <div>
      {/* Your dashboard content */}
    </div>
  )
}
*/
