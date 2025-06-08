'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { EGYPT_PHONE, EGYPT_ADDRESS } from '@/constants/regional'
import { 
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Globe,
  Building2,
  User,
  Info
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  email: string | null
  phone: string | null
  addr: string | null
  profile_completion_percent: number
  has_business_email: boolean
  has_address: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  email: string
  phone: string | null
  role: string
  profile_completion_percent: number
  has_phone: boolean
}

interface ContactFormData {
  // Personal contact
  personal_phone: string
  
  // Business contact
  business_email: string
  business_phone: string
  business_address: string
  
  // Operating details
  operating_hours: string
  business_description: string
}

export default function ContactInformationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<ContactFormData>({
    personal_phone: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    operating_hours: '',
    business_description: ''
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
        personal_phone: pharmacistData.phone || '',
        business_email: pharmacyData.email || '',
        business_phone: pharmacyData.phone || '',
        business_address: pharmacyData.addr || '',
        operating_hours: pharmacyData.operating_hours || '',
        business_description: pharmacyData.business_description || ''
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

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
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

    // Validate business email
    if (formData.business_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.business_email)) {
        newErrors.business_email = 'Please enter a valid email address'
      }
    }

    // Validate phone numbers
    if (formData.personal_phone) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
      if (!phoneRegex.test(formData.personal_phone.replace(/\s/g, ''))) {
        newErrors.personal_phone = 'Please enter a valid phone number'
      }
    }

    if (formData.business_phone) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
      if (!phoneRegex.test(formData.business_phone.replace(/\s/g, ''))) {
        newErrors.business_phone = 'Please enter a valid phone number'
      }
    }

    // Validate business address (if provided)
    if (formData.business_address && formData.business_address.length < 10) {
      newErrors.business_address = 'Please provide a complete address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateCompletionImpact = () => {
    if (!pharmacy || !pharmacist) return { pharmacy: 0, pharmacist: 0 }

    let pharmacyBoost = 0
    let pharmacistBoost = 0

    // Business email (+10%)
    if (formData.business_email && !pharmacy.has_business_email) {
      pharmacyBoost += 10
    }

    // Business phone (+10%)
    if (formData.business_phone && !pharmacy.phone) {
      pharmacyBoost += 10
    }

    // Business address (+15%)
    if (formData.business_address && !pharmacy.has_address) {
      pharmacyBoost += 15
    }

    // Personal phone (+10%)
    if (formData.personal_phone && !pharmacist.has_phone) {
      pharmacistBoost += 10
    }

    // Operating hours (+5%)
    if (formData.operating_hours) {
      pharmacyBoost += 5
    }

    // Business description (+5%)
    if (formData.business_description) {
      pharmacyBoost += 5
    }

    return { pharmacy: pharmacyBoost, pharmacist: pharmacistBoost }
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
      // Update pharmacist data (personal phone)
      if (formData.personal_phone !== pharmacist.phone) {
        const { error: pharmacistError } = await supabase
          .from('pharmacists')
          .update({
            phone: formData.personal_phone || null,
            has_phone: !!formData.personal_phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', pharmacist.id)

        if (pharmacistError) {
          throw new Error(`Failed to update personal info: ${pharmacistError.message}`)
        }
      }

      // Update pharmacy data (business contact info)
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          email: formData.business_email || null,
          phone: formData.business_phone || null,
          addr: formData.business_address || null,
          has_business_email: !!formData.business_email,
          has_address: !!formData.business_address,
          operating_hours: formData.operating_hours || null,
          business_description: formData.business_description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy.id)

      if (pharmacyError) {
        throw new Error(`Failed to update business info: ${pharmacyError.message}`)
      }

      // Update local state
      setPharmacy(prev => prev ? {
        ...prev,
        email: formData.business_email || null,
        phone: formData.business_phone || null,
        addr: formData.business_address || null,
        has_business_email: !!formData.business_email,
        has_address: !!formData.business_address
      } : null)

      setPharmacist(prev => prev ? {
        ...prev,
        phone: formData.personal_phone || null,
        has_phone: !!formData.personal_phone
      } : null)

      setSuccessMessage('✅ Contact information saved successfully!')

      // Auto-redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 2000)

    } catch (error: any) {
      console.error('Error saving contact info:', error)
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
            <p className="text-gray-600 dark:text-gray-400">Loading contact form...</p>
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
                We couldn't load the contact form. Please try again.
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

  const completionImpact = calculateCompletionImpact()

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
            Contact Information
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add your business and personal contact details to unlock marketplace features
          </p>
        </div>

        {/* Completion Impact Card */}
        <Card className="mb-8 border-l-4 border-l-pharmacy-green bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white mb-1">
                  📈 Completion Impact
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Complete this form to boost your profile completion percentage
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-pharmacy-green">
                  +{completionImpact.pharmacy + completionImpact.pharmacist}%
                </div>
                <div className="text-xs text-gray-500">potential boost</div>
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
          {/* Personal Contact Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-trust-blue" />
                Personal Contact Information
              </CardTitle>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Your Personal Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.personal_phone}
                    onChange={(e) => handleInputChange('personal_phone', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.personal_phone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder={EGYPT_PHONE.placeholders.mobile}
                  />
                  {errors.personal_phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.personal_phone}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: For direct communication when needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Contact Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Building2 className="w-5 h-5 mr-2 text-pharmacy-green" />
                Business Contact Information
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Business Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => handleInputChange('business_email', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.business_email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="contact@yourpharmacy.com"
                  />
                  {errors.business_email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.business_email}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required: For business communications and order coordination
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Business Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.business_phone}
                    onChange={(e) => handleInputChange('business_phone', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.business_phone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder={EGYPT_PHONE.placeholders.business}
                  />
                  {errors.business_phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.business_phone}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required: Main pharmacy contact number
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Business Address *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.business_address ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder={EGYPT_ADDRESS.placeholder}
                  />
                  {errors.business_address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.business_address}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required: Complete physical address for delivery coordination
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Operations */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Clock className="w-5 h-5 mr-2 text-alert-orange" />
                Business Operations
              </CardTitle>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formData.operating_hours}
                    onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="e.g., Sun-Thu 9AM-6PM, Fri 9AM-2PM, Sat Closed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Helps other pharmacies know when to contact you
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Business Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.business_description}
                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Brief description of your pharmacy, specializations, or services"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Describe your pharmacy for better connections with other businesses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="bg-pharmacy-green/10 dark:bg-pharmacy-green/20 border-pharmacy-green/30">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-pharmacy-green mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-pharmacy-green dark:text-pharmacy-green mb-2">
                    Privacy Protection
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>• Your contact information is only shared after transaction approval</p>
                    <p>• Other pharmacies see you as "Verified Pharmacy" during browsing</p>
                    <p>• Real business details are revealed only for delivery coordination</p>
                    <p>• You maintain full control over your privacy settings</p>
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
                  Save Contact Info
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}