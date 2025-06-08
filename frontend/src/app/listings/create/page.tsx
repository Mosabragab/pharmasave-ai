'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { 
  Pill, 
  Calendar, 
  DollarSign, 
  Package, 
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  Info,
  Settings,
  Lock,
  Upload,
  Plus
} from 'lucide-react'

interface ListingFormData {
  medicine_id: string
  custom_medicine_name: string
  dosage_form: string
  concentration: string
  batch_number: string
  expiry_date: string
  quantity: number
  unit_price: number
  trade_value: number
  listing_type: 'sale' | 'trade' | 'both'
  description: string
  condition_notes: string
}

interface Medicine {
  id: string
  name: string
  generic_name?: string
  form: string
  strength?: string
  manufacturer?: string
}

interface PharmacyData {
  id: string
  name: string
  profile_completion_percent: number
  verified: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  role: string
  profile_completion_percent: number
}

export default function CreateListingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [hasMarketplaceAccess, setHasMarketplaceAccess] = useState(false)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<ListingFormData>({
    medicine_id: '',
    custom_medicine_name: '',
    dosage_form: '',
    concentration: '',
    batch_number: '',
    expiry_date: '',
    quantity: 1,
    unit_price: 0,
    trade_value: 0,
    listing_type: 'sale',
    description: '',
    condition_notes: ''
  })

  useEffect(() => {
    checkAuth()
    loadMedicines()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/auth/signin')
        return
      }

      // Get pharmacist data
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError || !pharmacistData) {
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
        router.push('/auth/signin')
        return
      }

      setPharmacy(pharmacyData)

      // Check marketplace access based on profile completion
      const overallProgress = Math.round((pharmacyData.profile_completion_percent * 0.7) + (pharmacistData.profile_completion_percent * 0.3))
      const hasAccess = overallProgress >= 70 || pharmacyData.verified
      setHasMarketplaceAccess(hasAccess)

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('meds')
        .select('id, name, generic_name, form, strength, manufacturer')
        .order('name')

      if (error) {
        console.error('Error loading medicines:', error)
        return
      }

      setMedicines(data || [])
    } catch (error) {
      console.error('Error loading medicines:', error)
    }
  }

  const handleInputChange = (field: keyof ListingFormData, value: string | number) => {
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

    // Medicine validation
    if (!formData.medicine_id && !formData.custom_medicine_name) {
      newErrors.medicine = 'Please select a medicine or enter a custom medicine name'
    }

    if (formData.medicine_id === 'custom' && !formData.custom_medicine_name) {
      newErrors.custom_medicine_name = 'Custom medicine name is required'
    }

    // Dosage form validation
    if (!formData.dosage_form) {
      newErrors.dosage_form = 'Please select a dosage form'
    }

    // Concentration validation
    if (!formData.concentration) {
      newErrors.concentration = 'Concentration is required (e.g., 500mg, 10ml)'
    }

    // Batch number validation
    if (!formData.batch_number) {
      newErrors.batch_number = 'Batch number is required'
    }

    // Expiry date validation
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required'
    } else {
      const expiryDate = new Date(formData.expiry_date)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (expiryDate <= today) {
        newErrors.expiry_date = 'Expiry date must be in the future'
      } else if (daysUntilExpiry > 365) {
        newErrors.expiry_date = 'Medications with more than 1 year until expiry are not suitable for this platform'
      }
    }

    // Quantity validation
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }

    // Price validation
    if (!formData.unit_price || formData.unit_price <= 0) {
      newErrors.unit_price = 'Unit price must be greater than 0'
    }

    // Trade value validation (if applicable)
    if ((formData.listing_type === 'trade' || formData.listing_type === 'both') && (!formData.trade_value || formData.trade_value <= 0)) {
      newErrors.trade_value = 'Trade value is required for trade listings'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateAIPricing = () => {
    if (!formData.expiry_date || !formData.unit_price) return formData.unit_price

    const today = new Date()
    const expiry = new Date(formData.expiry_date)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry <= 30) {
      return Math.round(formData.unit_price * 0.5) // 50% discount for < 30 days
    } else if (daysUntilExpiry <= 60) {
      return Math.round(formData.unit_price * 0.7) // 30% discount for < 60 days
    } else if (daysUntilExpiry <= 90) {
      return Math.round(formData.unit_price * 0.85) // 15% discount for < 90 days
    }
    
    return formData.unit_price
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!pharmacy || !pharmacist) {
      setErrors({ general: 'Authentication error. Please refresh and try again.' })
      return
    }

    setIsSaving(true)
    setErrors({})

    try {
      // Prepare listing data
      const listingData = {
        pharmacy_id: pharmacy.id,
        created_by: pharmacist.id,
        medicine_id: formData.medicine_id === 'custom' ? null : formData.medicine_id || null,
        custom_medicine_name: formData.medicine_id === 'custom' ? formData.custom_medicine_name : null,
        dosage_form: formData.dosage_form,
        concentration: formData.concentration,
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        trade_value: (formData.listing_type !== 'sale') ? formData.trade_value : null,
        listing_type: formData.listing_type,
        description: formData.description || null,
        condition_notes: formData.condition_notes || null,
        images: [], // Empty for now - file upload can be added later
        status: 'active'
      }

      console.log('Creating listing with data:', listingData)

      // Insert listing into database
      const { data: insertedListing, error: listingError } = await supabase
        .from('lstng')
        .insert(listingData)
        .select()
        .single()

      if (listingError) {
        throw new Error(`Failed to create listing: ${listingError.message}`)
      }

      console.log('Listing created successfully:', insertedListing)

      setSuccessMessage('✅ Listing created successfully!')

      // Auto-redirect to listings page after 2 seconds
      setTimeout(() => {
        router.push('/listings')
      }, 2000)

    } catch (error: any) {
      console.error('Error creating listing:', error)
      setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getOverallProgress = () => {
    if (!pharmacy || !pharmacist) return 0
    return Math.round((pharmacy.profile_completion_percent * 0.7) + (pharmacist.profile_completion_percent * 0.3))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header 
          variant="dashboard"
          pharmacyName={pharmacy?.name || 'Loading...'}
          userRole={pharmacist?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}
          showSettings={true}
          showSignOut={true}
          onSignOut={handleSignOut}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
            <p className="text-gray-600 dark:text-gray-400">Loading create listing...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied if profile completion is insufficient
  if (!hasMarketplaceAccess) {
    const overallProgress = getOverallProgress()
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header 
          variant="dashboard"
          pharmacyName={pharmacy?.name || 'PharmaSave AI'}
          userRole={pharmacist?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}
          showSettings={true}
          showSignOut={true}
          onSignOut={handleSignOut}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-l-4 border-l-alert-orange bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-alert-orange" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Listing Creation Locked
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your profile to 70% to unlock listing creation and start selling your near-expired medications.
              </p>
              
              {/* Progress Display */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profile Completion</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-pharmacy-green h-3 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Started</span>
                  <span className={overallProgress >= 70 ? 'text-pharmacy-green font-medium' : ''}>
                    70% Marketplace ✓
                  </span>
                  <span>100% Complete</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Complete Profile
                </Button>
                <Button variant="outline" onClick={() => router.push('/listings')}>
                  Back to Listings
                </Button>
              </div>
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
            onClick={() => router.push('/listings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Listing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            List your near-expired medications for sale or trade
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-8 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-green-600 mr-3" />
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

        {/* Info Card */}
        <Card className="mb-8 border-l-4 border-l-pharmacy-green bg-pharmacy-green/10 dark:bg-pharmacy-green/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-pharmacy-green mt-0.5" />
              <div>
                <h3 className="font-medium text-pharmacy-green dark:text-pharmacy-green mb-1">
                  Listing Guidelines
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Only list medications that are near expiry but still valid</li>
                  <li>• Include accurate batch numbers and expiry dates</li>
                  <li>• Set competitive prices based on remaining shelf life</li>
                  <li>• Provide clear descriptions of condition and storage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Medicine Selection */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Pill className="w-5 h-5 mr-2 text-pharmacy-green" />
                Medicine Information
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Medicine *
                  </label>
                  <select
                    value={formData.medicine_id}
                    onChange={(e) => handleInputChange('medicine_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.medicine ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    <option value="">Choose a medicine...</option>
                    {medicines.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} {med.strength && `(${med.strength})`} - {med.form}
                      </option>
                    ))}
                    <option value="custom">⚡ Add Custom Medicine</option>
                  </select>
                  {errors.medicine && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.medicine}</p>
                  )}
                </div>

                {formData.medicine_id === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={formData.custom_medicine_name}
                      onChange={(e) => handleInputChange('custom_medicine_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                        errors.custom_medicine_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="Enter medicine name"
                    />
                    {errors.custom_medicine_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.custom_medicine_name}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dosage Form *
                  </label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) => handleInputChange('dosage_form', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.dosage_form ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    <option value="">Select dosage form...</option>
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="suspension">Suspension</option>
                    <option value="injection">Injection/Vial</option>
                    <option value="cream">Cream</option>
                    <option value="ointment">Ointment</option>
                    <option value="gel">Gel</option>
                    <option value="drops">Drops</option>
                    <option value="spray">Spray</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="patch">Patch</option>
                    <option value="suppository">Suppository</option>
                    <option value="powder">Powder</option>
                    <option value="granules">Granules</option>
                    <option value="lotion">Lotion</option>
                    <option value="solution">Solution</option>
                    <option value="emulsion">Emulsion</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.dosage_form && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dosage_form}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Concentration/Strength *
                  </label>
                  <input
                    type="text"
                    value={formData.concentration}
                    onChange={(e) => handleInputChange('concentration', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.concentration ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="e.g., 500mg, 10ml, 250mg/5ml"
                  />
                  {errors.concentration && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.concentration}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the strength/concentration (e.g., 500mg, 10ml, 250mg/5ml)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => handleInputChange('batch_number', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.batch_number ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter batch number"
                  />
                  {errors.batch_number && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.batch_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.expiry_date ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.expiry_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiry_date}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity and Pricing */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="flex items-center mb-4">
                <Package className="w-5 h-5 mr-2 text-pharmacy-green" />
                Quantity & Pricing
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.quantity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Original Unit Price (EGP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.unit_price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.unit_price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit_price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Suggested Price (EGP)
                  </label>
                  <div className="px-3 py-2 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 border border-pharmacy-green/30 rounded-md text-pharmacy-green font-medium">
                    {calculateAIPricing()} EGP
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on expiry date and market data
                  </p>
                </div>
              </div>

              {/* Listing Type */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing Type *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                    <input
                      type="radio"
                      value="sale"
                      checked={formData.listing_type === 'sale'}
                      onChange={(e) => handleInputChange('listing_type', e.target.value)}
                      className="text-pharmacy-green"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Sale Only</span>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                    <input
                      type="radio"
                      value="trade"
                      checked={formData.listing_type === 'trade'}
                      onChange={(e) => handleInputChange('listing_type', e.target.value)}
                      className="text-pharmacy-green"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Trade Only</span>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                    <input
                      type="radio"
                      value="both"
                      checked={formData.listing_type === 'both'}
                      onChange={(e) => handleInputChange('listing_type', e.target.value)}
                      className="text-pharmacy-green"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Sale or Trade</span>
                  </label>
                </div>
              </div>

              {/* Trade Value (if applicable) */}
              {(formData.listing_type === 'trade' || formData.listing_type === 'both') && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trade Value (EGP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.trade_value}
                    onChange={(e) => handleInputChange('trade_value', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                      errors.trade_value ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Value for trade calculations"
                  />
                  {errors.trade_value && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.trade_value}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Used to calculate fair trade values with other medications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images Placeholder */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="mb-4">Medication Images</CardTitle>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Image Upload Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  File upload functionality will be available in the next update
                </p>
                <Button disabled variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <CardTitle className="mb-4">Additional Information</CardTitle>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Additional details about the medication (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.condition_notes}
                    onChange={(e) => handleInputChange('condition_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Any notes about storage conditions or packaging (optional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/listings')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-pharmacy-green hover:bg-pharmacy-green/90 min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Listing
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
