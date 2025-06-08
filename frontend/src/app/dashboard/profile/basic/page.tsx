'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { 
  User,
  Building2,
  Mail,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  profile_completion_percent: number
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  email: string
  role: string
  profile_completion_percent: number
}

interface BasicFormData {
  pharmacy_name: string
  first_name: string
  last_name: string
  email: string
}

export default function BasicInformationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<BasicFormData>({
    pharmacy_name: '',
    first_name: '',
    last_name: '',
    email: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Get pharmacist data
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError || !pharmacistData) {
        console.error('Pharmacist data error:', pharmacistError)
        router.push('/auth/signin')
        return
      }

      setPharmacist(pharmacistData)

      // Get pharmacy data
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacistData.pharmacy_id)
        .single()

      if (pharmacyError || !pharmacyData) {
        console.error('Pharmacy data error:', pharmacyError)
        router.push('/auth/signin')
        return
      }

      setPharmacy(pharmacyData)

      // Initialize form with existing data
      setFormData({
        pharmacy_name: pharmacyData.name || '',
        first_name: pharmacistData.fname || '',
        last_name: pharmacistData.lname || '',
        email: pharmacistData.email || ''
      })

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleInputChange = (field: keyof BasicFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear success message when editing
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields
    if (!formData.pharmacy_name.trim()) {
      newErrors.pharmacy_name = 'Pharmacy name is required'
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!pharmacy || !pharmacist) {
      setErrors({ general: 'Unable to save. Please refresh and try again.' })
      return
    }

    setIsSaving(true)
    setErrors({})

    try {
      // Update pharmacy name
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          name: formData.pharmacy_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy.id)

      if (pharmacyError) {
        throw new Error(`Failed to update pharmacy name: ${pharmacyError.message}`)
      }

      // Update pharmacist data
      const { error: pharmacistError } = await supabase
        .from('pharmacists')
        .update({
          fname: formData.first_name.trim(),
          lname: formData.last_name.trim(),
          email: formData.email.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacist.id)

      if (pharmacistError) {
        throw new Error(`Failed to update personal info: ${pharmacistError.message}`)
      }

      // Update auth user email if it changed
      if (formData.email !== pharmacist.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email
        })

        if (authError) {
          console.warn('Auth email update failed:', authError)
          // Don't fail the whole operation for this
        }
      }

      // Update local state
      setPharmacy(prev => prev ? { ...prev, name: formData.pharmacy_name } : null)
      setPharmacist(prev => prev ? {
        ...prev,
        fname: formData.first_name,
        lname: formData.last_name,
        email: formData.email
      } : null)

      setSuccessMessage('✅ Basic information updated successfully!')

      // Auto-redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 2000)

    } catch (error: any) {
      console.error('Error saving basic info:', error)
      setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header 
          variant="dashboard"
          pharmacyName="Loading..."
          userRole=""
          showSettings={true}
          showSignOut={true}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
            <p className="text-gray-600 dark:text-gray-400">Loading basic information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!pharmacy || !pharmacist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header 
          variant="dashboard"
          pharmacyName="Error"
          userRole=""
          showSettings={true}
          showSignOut={true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Unable to Load Form
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't load the basic information form. Please try again.
              </p>
              <Button onClick={() => router.push('/dashboard/profile')}>
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header 
        variant="dashboard"
        pharmacyName={pharmacy.name}
        userRole={pharmacist.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        showSettings={true}
        showSignOut={true}
        onSignOut={handleSignOut}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/profile')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Basic Information
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your essential account information
          </p>
        </div>

        {/* Completion Status */}
        <Card className="mb-8 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <CardTitle className="text-lg text-green-800 dark:text-green-400 mb-1">
                  ✅ Basic Information Complete
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Your basic information was completed during registration. You can update it here if needed.
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-8 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <p className="text-green-800 dark:text-green-400">{successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* General Error */}
        {errors.general && (
          <Card className="mb-8 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-red-800 dark:text-red-400">{errors.general}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Building2 className="w-5 h-5 mr-2 text-pharmacy-green" />
                Business Information
              </CardTitle>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Pharmacy Name *
                  </label>
                  <input
                    type="text"
                    value={formData.pharmacy_name}
                    onChange={(e) => handleInputChange('pharmacy_name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.pharmacy_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your pharmacy name"
                  />
                  {errors.pharmacy_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacy_name}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This is your official pharmacy business name
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-trust-blue" />
                Personal Information
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.first_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your first name"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.last_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your last name"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This email is used for login and important notifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                    Important Notes
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• Your pharmacy name will be used for business verification</p>
                    <p>• Email changes may require verification before taking effect</p>
                    <p>• This information should match your official business documents</p>
                    <p>• All fields are required for platform access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/profile')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-pharmacy-green hover:bg-pharmacy-green/90 min-w-[160px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}