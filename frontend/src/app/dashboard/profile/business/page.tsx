'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { 
  Award,
  FileText,
  Building2,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Hash,
  User,
  Shield,
  Info
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  license_num: string | null
  registration_number: string | null
  license_expiry: string | null
  profile_completion_percent: number
  has_license_num: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  email: string
  pharmacist_id_num: string | null
  role: string
  profile_completion_percent: number
  has_pharmacist_id: boolean
}

interface BusinessFormData {
  // Pharmacist credentials
  pharmacist_id_number: string
  
  // Pharmacy license details
  pharmacy_license_number: string
  business_registration_number: string
  license_expiry_date: string
  
  // Additional business details
  specializations: string
  services_offered: string
}

export default function BusinessDetailsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<BusinessFormData>({
    pharmacist_id_number: '',
    pharmacy_license_number: '',
    business_registration_number: '',
    license_expiry_date: '',
    specializations: '',
    services_offered: ''
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
        pharmacist_id_number: pharmacistData.pharmacist_id_num || '',
        pharmacy_license_number: pharmacyData.license_num || '',
        business_registration_number: pharmacyData.registration_number || '',
        license_expiry_date: pharmacyData.license_expiry || '',
        specializations: pharmacyData.specializations || '',
        services_offered: pharmacyData.services_offered || ''
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

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
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

    // Validate pharmacist ID number
    if (formData.pharmacist_id_number) {
      if (formData.pharmacist_id_number.length < 5) {
        newErrors.pharmacist_id_number = 'Pharmacist ID must be at least 5 characters'
      }
    }

    // Validate pharmacy license number
    if (formData.pharmacy_license_number) {
      if (formData.pharmacy_license_number.length < 5) {
        newErrors.pharmacy_license_number = 'License number must be at least 5 characters'
      }
    }

    // Validate business registration number
    if (formData.business_registration_number) {
      if (formData.business_registration_number.length < 5) {
        newErrors.business_registration_number = 'Registration number must be at least 5 characters'
      }
    }

    // Validate license expiry date
    if (formData.license_expiry_date) {
      const expiryDate = new Date(formData.license_expiry_date)
      const today = new Date()
      
      if (expiryDate <= today) {
        newErrors.license_expiry_date = 'License expiry date must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateCompletionImpact = () => {
    if (!pharmacy || !pharmacist) return { pharmacy: 0, pharmacist: 0 }

    let pharmacyBoost = 0
    let pharmacistBoost = 0

    // Pharmacist ID (+10%)
    if (formData.pharmacist_id_number && !pharmacist.has_pharmacist_id) {
      pharmacistBoost += 10
    }

    // Pharmacy license (+15%)
    if (formData.pharmacy_license_number && !pharmacy.has_license_num) {
      pharmacyBoost += 15
    }

    // Business registration (+10%)
    if (formData.business_registration_number) {
      pharmacyBoost += 10
    }

    // License expiry (+5%)
    if (formData.license_expiry_date) {
      pharmacyBoost += 5
    }

    // Specializations (+5%)
    if (formData.specializations) {
      pharmacyBoost += 5
    }

    // Services offered (+5%)
    if (formData.services_offered) {
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
      // Update pharmacist data (pharmacist ID)
      if (formData.pharmacist_id_number !== pharmacist.pharmacist_id_num) {
        const { error: pharmacistError } = await supabase
          .from('pharmacists')
          .update({
            pharmacist_id_num: formData.pharmacist_id_number || null,
            has_pharmacist_id: !!formData.pharmacist_id_number,
            updated_at: new Date().toISOString()
          })
          .eq('id', pharmacist.id)

        if (pharmacistError) {
          throw new Error(`Failed to update pharmacist credentials: ${pharmacistError.message}`)
        }
      }

      // Update pharmacy data (license and business details)
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          license_num: formData.pharmacy_license_number || null,
          registration_number: formData.business_registration_number || null,
          license_expiry: formData.license_expiry_date || null,
          has_license_num: !!formData.pharmacy_license_number,
          specializations: formData.specializations || null,
          services_offered: formData.services_offered || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy.id)

      if (pharmacyError) {
        throw new Error(`Failed to update business details: ${pharmacyError.message}`)
      }

      // Update local state
      setPharmacy(prev => prev ? {
        ...prev,
        license_num: formData.pharmacy_license_number || null,
        registration_number: formData.business_registration_number || null,
        license_expiry: formData.license_expiry_date || null,
        has_license_num: !!formData.pharmacy_license_number
      } : null)

      setPharmacist(prev => prev ? {
        ...prev,
        pharmacist_id_num: formData.pharmacist_id_number || null,
        has_pharmacist_id: !!formData.pharmacist_id_number
      } : null)

      setSuccessMessage('✅ Business details saved successfully!')

      // Auto-redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 2000)

    } catch (error: any) {
      console.error('Error saving business details:', error)
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
            <p className="text-gray-600 dark:text-gray-400">Loading business form...</p>
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
                We couldn't load the business details form. Please try again.
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
            Business Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add your professional credentials and pharmacy license information
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
          {/* Professional Credentials */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Award className="w-5 h-5 mr-2 text-trust-blue" />
                Professional Credentials
              </CardTitle>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Your Pharmacist ID Number *
                  </label>
                  <input
                    type="text"
                    value={formData.pharmacist_id_number}
                    onChange={(e) => handleInputChange('pharmacist_id_number', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.pharmacist_id_number ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your professional pharmacist ID"
                  />
                  {errors.pharmacist_id_number && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacist_id_number}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required: Your official pharmacist registration number from the Egyptian Pharmacists Syndicate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pharmacy License Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <FileText className="w-5 h-5 mr-2 text-pharmacy-green" />
                Pharmacy License Information
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Pharmacy License Number *
                  </label>
                  <input
                    type="text"
                    value={formData.pharmacy_license_number}
                    onChange={(e) => handleInputChange('pharmacy_license_number', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.pharmacy_license_number ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter pharmacy license number"
                  />
                  {errors.pharmacy_license_number && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacy_license_number}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required: Official pharmacy operating license number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.business_registration_number}
                    onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.business_registration_number ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter business registration number"
                  />
                  {errors.business_registration_number && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.business_registration_number}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Commercial registration number for business verification
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.license_expiry_date}
                    onChange={(e) => handleInputChange('license_expiry_date', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.license_expiry_date ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.license_expiry_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.license_expiry_date}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: When your pharmacy license expires (for renewal reminders)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Business Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Shield className="w-5 h-5 mr-2 text-alert-orange" />
                Additional Business Information
              </CardTitle>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Award className="w-4 h-4 inline mr-2" />
                    Specializations
                  </label>
                  <input
                    type="text"
                    value={formData.specializations}
                    onChange={(e) => handleInputChange('specializations', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="e.g., Oncology, Pediatrics, Geriatrics, Clinical Pharmacy"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Your pharmacy's areas of specialization or expertise
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Services Offered
                  </label>
                  <textarea
                    rows={3}
                    value={formData.services_offered}
                    onChange={(e) => handleInputChange('services_offered', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="e.g., Prescription dispensing, Medical consultations, Drug information, Home delivery"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: List the main services your pharmacy provides
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
                    Verification Requirements
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• All license numbers and credentials will be verified during the approval process</p>
                    <p>• Ensure all information matches your official documents exactly</p>
                    <p>• You'll be asked to upload supporting documents in the next step</p>
                    <p>• Verification typically takes 2-3 business days after document submission</p>
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
                  Save Business Details
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}