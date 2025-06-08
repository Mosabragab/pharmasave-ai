// Admin Authentication Guard
// This component protects admin routes by checking authentication

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AdminAuthGuardProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
}

export default function AdminAuthGuard({ 
  children, 
  loadingComponent 
}: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/admin/signin')
        return
      }

      // Check if user is an admin
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (error || !adminData) {
        await supabase.auth.signOut()
        router.push('/admin/signin')
        return
      }

      setIsAuthenticated(true)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/admin/signin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}