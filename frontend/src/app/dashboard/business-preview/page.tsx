'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { 
  Shield,
  Package,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Users,
  Building2,
  FileText,
  CheckCircle,
  Lock,
  ArrowRight,
  Eye,
  Heart,
  Loader2,
  AlertCircle,
  Settings,
  Upload,
  Award,
  Zap,
  Sparkles
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  profile_completion_percent: number
  verified: boolean
  ver_status: string
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  role: string
  profile_completion_percent: number
}

interface DemoListing {
  id: string
  medicine_name: string
  manufacturer: string
  strength: string
  form: string
  price: number
  quantity: number
  expiry_date: string
  distance: number
  pharmacy_rating: number
  type: 'sale' | 'trade' | 'both'
}

const demoListings: DemoListing[] = [
  {
    id: '1',
    medicine_name: 'Panadol Extra',
    manufacturer: 'GSK',
    strength: '500mg',
    form: 'Tablets',
    price: 15,
    quantity: 100,
    expiry_date: '2025-03-15',
    distance: 2.5,
    pharmacy_rating: 4.8,
    type: 'sale'
  },
  {
    id: '2',
    medicine_name: 'Augmentin',
    manufacturer: 'GSK',
    strength: '625mg',
    form: 'Tablets',
    price: 85,
    quantity: 50,
    expiry_date: '2025-02-28',
    distance: 5.2,
    pharmacy_rating: 4.6,
    type: 'both'
  },
  {
    id: '3',
    medicine_name: 'Nexium',
    manufacturer: 'AstraZeneca',
    strength: '40mg',
    form: 'Capsules',
    price: 120,
    quantity: 30,
    expiry_date: '2025-04-10',
    distance: 8.1,
    pharmacy_rating: 4.9,
    type: 'trade'
  }
]

export default function BusinessPreviewPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)

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

  const getOverallProgress = () => {
    if (!pharmacy || !pharmacist) return 0
    return Math.round((pharmacy.profile_completion_percent * 0.7) + (pharmacist.profile_completion_percent * 0.3))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getExpiryColor = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate)
    if (days <= 30) return 'text-red-600'
    if (days <= 60) return 'text-orange-600'
    if (days <= 90) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return <DollarSign className="w-4 h-4" />
      case 'trade': return <Package className="w-4 h-4" />
      case 'both': return <TrendingUp className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
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
            <p className="text-gray-600 dark:text-gray-400">Loading business preview...</p>
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
                Unable to Load Business Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't load the business preview. Please try again.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const overallProgress = getOverallProgress()
  const isVerified = pharmacy.verified
  const canSubmitVerification = overallProgress >= 80

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏪 Business Platform Preview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore PharmaSave AI's powerful features for verified pharmacy businesses
          </p>
        </div>

        {/* Verification Status Banner */}
        <Card className={`mb-8 border-l-4 ${
          isVerified 
            ? 'border-l-pharmacy-green bg-pharmacy-green/5 dark:bg-pharmacy-green/10'
            : 'border-l-alert-orange bg-alert-orange/5 dark:bg-alert-orange/10'
        } border-gray-200 dark:border-slate-700`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`text-lg mb-1 ${
                  isVerified 
                    ? 'text-pharmacy-green dark:text-pharmacy-green' 
                    : 'text-alert-orange dark:text-alert-orange'
                }`}>
                  {isVerified 
                    ? '✅ Your Pharmacy is Verified!' 
                    : `📋 Complete Profile to Unlock (${overallProgress}% done)`
                  }
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {isVerified 
                    ? 'You have full access to all marketplace features below'
                    : `${canSubmitVerification 
                        ? 'Ready to submit for verification! Upload documents to get verified.'
                        : `Complete ${80 - overallProgress}% more to unlock verification submission.`
                      }`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                {isVerified ? (
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-pharmacy-green mr-2" />
                    <Sparkles className="w-6 h-6 text-pharmacy-green" />
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="w-16 h-16 relative">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${overallProgress * 100 / 100}, 100`}
                          className="text-pharmacy-green"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-200 dark:text-gray-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {overallProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isVerified && (
              <div className="mt-4 flex space-x-3">
                <Link href="/dashboard/profile">
                  <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                    <Settings className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </Link>
                {canSubmitVerification && (
                  <Link href="/dashboard/profile/verification">
                    <Button variant="outline" className="border-pharmacy-green text-pharmacy-green hover:bg-pharmacy-green/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Marketplace Preview */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mr-3">
                  <ShoppingCart className="w-5 h-5 text-pharmacy-green" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Marketplace Access
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Browse medications from verified pharmacies
                  </CardDescription>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {demoListings.slice(0, 2).map((listing) => (
                  <div key={listing.id} className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {listing.medicine_name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(listing.type)}
                        <span className="text-xs text-gray-500 capitalize">
                          {listing.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-pharmacy-green font-medium">
                        {listing.price} EGP
                      </span>
                      <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                        <span>Qty: {listing.quantity}</span>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {listing.distance}km
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  disabled
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Button>
                <Button variant="outline" size="icon" disabled>
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Listing Creation Preview */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-trust-blue/10 dark:bg-trust-blue/20 rounded-full flex items-center justify-center mr-3">
                  <Package className="w-5 h-5 text-trust-blue" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Create Listings
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    List near-expired medications for sale or trade
                  </CardDescription>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    AI-Powered Features
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-pharmacy-green" />
                      Smart pricing recommendations
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-pharmacy-green" />
                      Automatic medicine catalog
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-pharmacy-green" />
                      Market demand insights
                    </div>
                  </div>
                </div>

                <div className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Batch Operations
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload multiple medications at once with CSV import
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                disabled
              >
                <Lock className="w-4 h-4 mr-2" />
                Create Listing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Preview */}
        <Card className="mb-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-6">
            <CardTitle className="text-lg text-gray-900 dark:text-white mb-4">
              📊 Business Analytics Preview
            </CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-pharmacy-green" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2,450</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">EGP Saved</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-trust-blue/10 dark:bg-trust-blue/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6 text-trust-blue" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Medications Sold</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-alert-orange/10 dark:bg-alert-orange/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-6 h-6 text-alert-orange" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Partner Pharmacies</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-pharmacy-green" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Privacy Protected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your business identity remains anonymous until transaction approval
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-trust-blue/10 dark:bg-trust-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-trust-blue" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Team Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Invite pharmacists and manage roles within your business account
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-alert-orange/10 dark:bg-alert-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-alert-orange" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reduce Waste
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Transform near-expired inventory into revenue before expiration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Educational Content */}
        <Card className="mb-8 bg-pharmacy-green/5 dark:bg-pharmacy-green/10 border-pharmacy-green/30">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mr-4 mt-1">
                <Award className="w-6 h-6 text-pharmacy-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎯 Getting Started Guide
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-pharmacy-green mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 1:</strong> Complete your pharmacy profile with license information</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-pharmacy-green mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 2:</strong> Upload verification documents (license, registration, credentials)</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-pharmacy-green mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 3:</strong> Wait 2-3 business days for admin verification</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-pharmacy-green mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 4:</strong> Start listing medications and connecting with nearby pharmacies</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🚀 Ready to Unlock Full Access?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your profile and get verified to access all these powerful features and start reducing medicine waste while increasing revenue.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Link href="/dashboard/profile" className="flex-1">
                  <Button className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90">
                    <Settings className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>60-day free trial</strong> starts immediately after verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}