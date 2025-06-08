// Example: Update Admin Header Component
// This shows how to display admin IDs in your frontend

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Shield, User } from 'lucide-react'

interface AdminInfo {
  displayId: string
  email: string
  fullName: string
  role: string
  permissions: any
}

export function AdminIdentityBadge() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAdminInfo()
  }, [])

  const fetchAdminInfo = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check admin_users table first
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (adminData && !adminError) {
        // User is an admin
        setAdminInfo({
          displayId: adminData.display_id,
          email: adminData.email,
          fullName: adminData.full_name,
          role: adminData.role,
          permissions: adminData.permissions
        })
      } else {
        // Fallback to checking pharmacists table (for backward compatibility)
        const { data: pharmacistData } = await supabase
          .from('pharmacists')
          .select(`
            *,
            pharmacy:pharmacies(display_id, name)
          `)
          .eq('auth_id', user.id)
          .single()

        if (pharmacistData?.role === 'admin') {
          // Old system - show pharmacy ID (temporary)
          setAdminInfo({
            displayId: pharmacistData.pharmacy.display_id,
            email: pharmacistData.email,
            fullName: `${pharmacistData.fname} ${pharmacistData.lname}`,
            role: 'admin',
            permissions: {}
          })
        }
      }
    } catch (error) {
      console.error('Error fetching admin info:', error)
    }
  }

  if (!adminInfo) return null

  // Determine badge color and icon based on ID type
  const isAdminId = adminInfo.displayId.startsWith('AD')
  const badgeColor = isAdminId ? 'bg-blue-600' : 'bg-green-600'
  const textColor = isAdminId ? 'text-blue-600' : 'text-green-600'

  return (
    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Avatar */}
      <div className={`w-12 h-12 ${badgeColor} rounded-full flex items-center justify-center`}>
        {isAdminId ? (
          <Shield className="w-6 h-6 text-white" />
        ) : (
          <User className="w-6 h-6 text-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {adminInfo.fullName}
        </h3>
        <div className="flex items-center space-x-2 text-xs">
          <span className={`font-mono ${textColor}`}>
            {adminInfo.displayId}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600 dark:text-gray-400">
            {adminInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="flex flex-col items-end">
        {adminInfo.role === 'super_admin' && (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full">
            Full Access
          </span>
        )}
        {!isAdminId && (
          <span className="mt-1 text-xs text-orange-600 dark:text-orange-400">
            ⚠️ Legacy ID
          </span>
        )}
      </div>
    </div>
  )
}

// Example usage in admin layout:
export function AdminLayoutHeader() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <AdminIdentityBadge />
        </div>
      </div>
    </header>
  )
}

// Helper function to check admin access in pages
export async function requireAdminAccess(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { hasAccess: false, redirect: '/auth/login' }
  }

  // Check new admin system
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('display_id, role, is_active')
    .eq('auth_id', user.id)
    .single()

  if (adminData?.is_active) {
    return { 
      hasAccess: true, 
      adminId: adminData.display_id,
      role: adminData.role 
    }
  }

  // Fallback to old system (temporary)
  const { data: pharmacistData } = await supabase
    .from('pharmacists')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (pharmacistData?.role === 'admin') {
    return { 
      hasAccess: true, 
      adminId: 'LEGACY',
      role: 'admin',
      warning: 'Please migrate to new admin system' 
    }
  }

  return { hasAccess: false, redirect: '/dashboard' }
}