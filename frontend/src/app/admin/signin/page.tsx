'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Pill, 
  Sun, 
  Moon, 
  Shield, 
  Eye, 
  EyeOff,
  AlertCircle 
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

const AdminSignIn: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()

      if (adminError || !adminData) {
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin privileges required.')
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminData.id)

      toast.success('Welcome back, ' + adminData.name)
      router.push('/admin')
    } catch (error: any) {
      console.error('Admin sign in error:', error)
      setError(error.message || 'Failed to sign in')
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-soft-white dark:bg-slate-900">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 z-50 border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Pill className="w-6 h-6 text-pharmacy-green" />
              <span className="ml-2 text-xl font-bold dark:text-white">PharmaSave AI</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
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
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-pharmacy-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold dark:text-white">
                Admin Sign In
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Access PharmaSave AI Administration Panel
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pharmasave.ai"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Sign In to Admin Panel
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This is a restricted area. Admin access only.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  All activities are logged and monitored.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact{' '}
              <a href="mailto:admin@pharmasave.ai" className="text-pharmacy-green hover:underline">
                admin@pharmasave.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSignIn
