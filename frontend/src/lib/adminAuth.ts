// Admin Authentication Helper
// This updates the authentication logic to use the new admin system

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Check if the current user is an admin
 */
export async function checkAdminAccess(supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { isAdmin: false, adminData: null }
    
    // Check if user exists in admin_users table
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !adminData) {
      return { isAdmin: false, adminData: null }
    }
    
    return {
      isAdmin: true,
      adminData: {
        id: adminData.display_id,
        email: adminData.email,
        name: adminData.full_name,
        role: adminData.role,
        permissions: adminData.permissions,
        department: adminData.department
      }
    }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return { isAdmin: false, adminData: null }
  }
}

/**
 * Get admin profile
 */
export async function getAdminProfile(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('auth_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching admin profile:', error)
    return null
  }
  
  return data
}

/**
 * Update the admin dashboard to show admin ID
 */
export function AdminHeader({ adminData }: { adminData: any }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">
            {adminData.role === 'super_admin' ? 'SA' : 'A'}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {adminData.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {adminData.id} • {adminData.role.replace('_', ' ').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Check if an ID is an admin ID
 */
export function isAdminId(id: string): boolean {
  return id && id.startsWith('AD')
}

/**
 * Check if an ID is a pharmacy ID
 */
export function isPharmacyId(id: string): boolean {
  return id && id.startsWith('PH')
}

/**
 * Format ID for display with appropriate icon/color
 */
export function formatIdDisplay(id: string) {
  if (isAdminId(id)) {
    return {
      text: id,
      className: 'text-blue-600 font-medium',
      icon: '👤', // or use an admin icon component
      type: 'admin'
    }
  } else if (isPharmacyId(id)) {
    return {
      text: id,
      className: 'text-green-600 font-medium',
      icon: '🏪', // or use a pharmacy icon component
      type: 'pharmacy'
    }
  } else {
    return {
      text: id,
      className: 'text-gray-600',
      icon: '',
      type: 'unknown'
    }
  }
}