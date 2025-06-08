'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Eye,
  Lock,
  Star,
  Calendar,
  Package,
  Pill,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  display_id?: string
  verified: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  role: string
}

// Sample demo data
const demoListings = [
  {
    id: 'demo-1',
    medicineName: 'Amoxicillin 500mg',
    manufacturer: 'GSK',
    batchNumber: 'AMX2024-156',
    expiryDate: '2025-08-15',
    quantity: 120,
    originalPrice: 450,
    salePrice: 270,
    discount: 40,
    type: 'sale',
    pharmacyName: 'Verified Pharmacy',
    distance: '2.3 km',
    rating: 4.8,
    reviews: 127,
    daysUntilExpiry: 80,
    status: 'active'
  },
  {
    id: 'demo-2', 
    medicineName: 'Paracetamol 500mg',
    manufacturer: 'Pharco',
    batchNumber: 'PAR2024-892',
    expiryDate: '2025-06-30',
    quantity: 200,
    originalPrice: 180,
    salePrice: 108,
    discount: 40,
    type: 'sale',
    pharmacyName: 'Verified Pharmacy',
    distance: '3.7 km',
    rating: 4.9,
    reviews: 89,
    daysUntilExpiry: 35,
    status: 'active'
  },
  {
    id: 'demo-3',
    medicineName: 'Insulin Glargine 100IU/ml',
    manufacturer: 'Sanofi',
    batchNumber: 'INS2024-443',
    expiryDate: '2025-07-22',
    quantity: 15,
    originalPrice: 1200,
    salePrice: 720,
    discount: 40,
    type: 'trade',
    pharmacyName: 'Verified Pharmacy',
    distance: '1.8 km',
    rating: 4.7,
    reviews: 203,
    daysUntilExpiry: 57,
    status: 'active'
  },
  {
    id: 'demo-4',
    medicineName: 'Omeprazole 20mg',
    manufacturer: 'AstraZeneca',
    batchNumber: 'OME2024-781',
    expiryDate: '2025-09-10',
    quantity: 75,
    originalPrice: 320,
    salePrice: 192,
    discount: 40,
    type: 'sale',
    pharmacyName: 'Verified Pharmacy',
    distance: '4.2 km',
    rating: 4.6,
    reviews: 156,
    daysUntilExpiry: 106,
    status: 'active'
  },
  {
    id: 'demo-5',
    medicineName: 'Metformin 500mg',
    manufacturer: 'Novartis',
    batchNumber: 'MET2024-329',
    expiryDate: '2025-07-05',
    quantity: 300,
    originalPrice: 240,
    salePrice: 144,
    discount: 40,
    type: 'both',
    pharmacyName: 'Verified Pharmacy',
    distance: '2.9 km',
    rating: 4.8,
    reviews: 94,
    daysUntilExpiry: 40,
    status: 'active'
  },
  {
    id: 'demo-6',
    medicineName: 'Atorvastatin 40mg',
    manufacturer: 'Pfizer',
    batchNumber: 'ATO2024-667',
    expiryDate: '2025-08-28',
    quantity: 180,
    originalPrice: 580,
    salePrice: 348,
    discount: 40,
    type: 'sale',
    pharmacyName: 'Verified Pharmacy',
    distance: '3.4 km',
    rating: 4.9,
    reviews: 178,
    daysUntilExpiry: 93,
    status: 'active'
  }
]

const getExpiryBadgeColor = (days: number) => {
  if (days <= 30) return 'bg-red-100 text-red-700 border-red-200'
  if (days <= 60) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'sale':
      return { text: 'For Sale', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'trade':
      return { text: 'Trade Only', className: 'bg-purple-100 text-purple-700 border-purple-200' }
    case 'both':
      return { text: 'Sale/Trade', className: 'bg-green-100 text-green-700 border-green-200' }
    default:
      return { text: 'Available', className: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
}

export default function MarketplaceDemoPage() {
  const router = useRouter()
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('🔍 Starting auth check for demo marketplace...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        router.push('/auth/signin')
        return
      }
      
      if (!user) {
        console.log('❌ No user found')
        router.push('/auth/signin')
        return
      }
      
      console.log('✅ User found:', user.email)

      // Get pharmacist data
      console.log('🔍 Looking for pharmacist data...')
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError) {
        console.error('❌ Pharmacist error:', pharmacistError)
        router.push('/auth/signin')
        return
      }
      
      if (!pharmacistData) {
        console.log('❌ No pharmacist data found')
        router.push('/auth/signin')
        return
      }
      
      console.log('✅ Pharmacist found:', pharmacistData.fname, pharmacistData.lname)
      setPharmacist(pharmacistData)

      // Get pharmacy data
      console.log('🔍 Looking for pharmacy data...')
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacistData.pharmacy_id)
        .single()

      if (pharmacyError) {
        console.error('❌ Pharmacy error:', pharmacyError)
        router.push('/auth/signin')
        return
      }
      
      if (!pharmacyData) {
        console.log('❌ No pharmacy data found')
        router.push('/auth/signin')
        return
      }
      
      console.log('✅ Pharmacy found:', pharmacyData.name, pharmacyData.display_id)
      setPharmacy(pharmacyData)
      
    } catch (error) {
      console.error('💥 Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
          <p className="text-gray-600 dark:text-gray-400">Loading demo marketplace...</p>
        </div>
      </div>
    )
  }

  if (!pharmacy || !pharmacist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Unable to load user data. Please try again.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Layout 
      variant="dashboard"
      pharmacyName={pharmacy.name}
      pharmacyId={pharmacy.display_id || 'PH0001'}
      userRole={pharmacist.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      isVerified={pharmacy.verified}
      showSettings={true}
      showSignOut={true}
      showDashboardButton={true}
      showWalletButton={true}
      onSignOut={handleSignOut}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <Eye className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <strong>Demo Marketplace</strong> - This is a preview of our platform with sample data. 
                <span className="block text-sm mt-1">Complete verification to access the real marketplace and start trading!</span>
              </div>
              <Button 
                onClick={() => router.push('/dashboard/profile')}
                className="ml-4 bg-blue-600 hover:bg-blue-700"
              >
                Get Verified
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Marketplace Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover how verified pharmacies trade near-expired medications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              <Eye className="w-3 h-3 mr-1" />
              Preview Mode
            </Badge>
          </div>
        </div>

        {/* Search and Filters - Disabled */}
        <Card className="mb-6 opacity-75">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines... (Available after verification)"
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled className="flex items-center cursor-not-allowed">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" disabled className="flex items-center cursor-not-allowed">
                  <MapPin className="w-4 h-4 mr-2" />
                  Nearby (10km)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Pill className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medicines Saved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">15,632</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified Pharmacies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">284</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {demoListings.map((listing) => {
            const typeBadge = getTypeBadge(listing.type)
            
            return (
              <Card key={listing.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                {/* Demo Overlay */}
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs font-medium rounded-bl-md z-10">
                  DEMO
                </div>
                
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {listing.medicineName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {listing.manufacturer} • Batch: {listing.batchNumber}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={`${typeBadge.className} border`}>
                      {typeBadge.text}
                    </Badge>
                    <Badge className={`${getExpiryBadgeColor(listing.daysUntilExpiry)} border`}>
                      {listing.daysUntilExpiry} days left
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="font-medium">{listing.quantity} units</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                      <span className="font-medium">{new Date(listing.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                      <span className="font-medium">{listing.distance}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 line-through">{listing.originalPrice} EGP</p>
                        <p className="text-lg font-bold text-green-600">{listing.salePrice} EGP</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {listing.discount}% OFF
                      </Badge>
                    </div>
                  </div>

                  {/* Pharmacy Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Verified Pharmacy</p>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          <span className="text-xs text-gray-600">{listing.rating} ({listing.reviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disabled Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      disabled 
                      className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Contact Seller (Verification Required)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ready to Start Trading?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your pharmacy verification to access the real marketplace, connect with verified pharmacies, 
                and start reducing medicine waste while earning revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Verification
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered recommendations connect you with the most relevant listings near you.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Verified Network</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trade only with verified, licensed pharmacies for complete safety and trust.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quality Guaranteed</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All medicines are verified for quality and authenticity before listing.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}