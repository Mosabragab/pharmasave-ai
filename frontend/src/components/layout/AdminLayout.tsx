'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  LayoutDashboard,
  Users,
  Shield,
  MessageSquare,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Pill,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  CreditCard
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = "Admin Dashboard",
  description = "PharmaSave AI Administration Panel" 
}) => {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [adminInfo, setAdminInfo] = useState<any>(null)

  useEffect(() => {
    fetchAdminInfo()
  }, [])

  const fetchAdminInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('admin_users')
        .select('display_id, name, email, role')
        .eq('email', user.email)
        .single()
      
      setAdminInfo(data)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/admin/signin')
    }
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin'
    },
    {
      name: 'Verification',
      href: '/admin/verification',
      icon: Shield,
      active: pathname.startsWith('/admin/verification')
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: MessageSquare,
      active: pathname.startsWith('/admin/support')
    },
    {
      name: 'Financial',
      href: '/admin/financial',
      icon: DollarSign,
      active: pathname.startsWith('/admin/financial')
    },
    {
      name: 'Fund Management',
      href: '/admin/fund-management',
      icon: CreditCard,
      active: pathname.startsWith('/admin/fund-management')
    },
    {
      name: 'Pharmacies',
      href: '/admin/pharmacies',
      icon: Building2,
      active: pathname.startsWith('/admin/pharmacies')
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: FileText,
      active: pathname.startsWith('/admin/reports')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      active: pathname.startsWith('/admin/settings')
    }
  ]

  return (
    <div className="min-h-screen bg-soft-white dark:bg-slate-900">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-pharmacy-green rounded-full flex items-center justify-center mr-3">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  PharmaSave AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {adminInfo?.display_id || 'AD0001'} • Admin Panel
                </p>
              </div>
            </Link>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {adminInfo && (
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {adminInfo.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {adminInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="flex items-center"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 mr-2 text-gray-600" />
                )}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16 flex">
        {/* Sidebar Navigation */}
        <nav className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-pharmacy-green text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          {/* Page Header */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
