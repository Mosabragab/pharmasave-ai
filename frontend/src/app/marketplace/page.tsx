'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { directTransactionService } from '@/lib/directTransactionService'
import { transactionNotifications, marketplaceNotifications } from '@/lib/notifications'
import toast from 'react-hot-toast'
import QuantitySelectionModal from '@/components/QuantitySelectionModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Header from '@/components/layout/Header'
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  TrendingUp,
  ShoppingCart,
  Heart,
  AlertCircle,
  AlertTriangle,
  Star,
  Loader2,
  RefreshCw,
  Eye,
  Lock,
  Settings,
  ArrowRight,
  CheckCircle,
  Shield,
  Truck,
  Tag,
  Building,
  List,
  Calendar,
  History,
  Plus
} from 'lucide-react'

interface MarketplaceListing {
  id: string
  pharmacy_id: string
  medicine_id?: string
  custom_medicine_name?: string
  batch_number: string
  expiry_date: string
  quantity: number
  unit_price: number | string // Can be number or string from database
  trade_value?: number
  listing_type: 'sale' | 'trade' | 'both' | string // Handle enum or string
  description?: string
  status: string // Handle database enum
  images?: string[] | any // JSONB array
  created_at: string
  views_count: number
  distance?: number
  // Medicine details
  medicine?: {
    name: string
    form: string
    strength?: string
    manufacturer?: string
  }
  // Pharmacy details (anonymized)
  pharmacy?: {
    display_id: string
    verified: boolean
    rating?: number
  }
}

interface PharmacyData {
  id: string
  name: string
  profile_completion_percent: number
  verified: boolean
  marketplace_access: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  role: string
  profile_completion_percent: number
}

export default function MarketplacePage() {
  const router = useRouter()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMarketplaceAccess, setHasMarketplaceAccess] = useState(false)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [radiusFilter, setRadiusFilter] = useState(10)
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  
  // Quantity Selection Modal State
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false)
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (pharmacy && hasMarketplaceAccess) {
      loadMarketplaceListings()
    }
  }, [pharmacy, hasMarketplaceAccess])

  useEffect(() => {
    if (hasMarketplaceAccess) {
      filterAndSortListings()
    }
  }, [listings, searchTerm, priceRange, typeFilter, sortBy, hasMarketplaceAccess])

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
      // Use IMPROVED calculation: 60% pharmacy + 40% pharmacist (was 70/30)
      const overallProgress = Math.round((pharmacyData.profile_completion_percent * 0.6) + (pharmacistData.profile_completion_percent * 0.4))
      const hasAccess = overallProgress >= 50 || pharmacyData.verified  // FIXED: Changed from 70% to 50%
      setHasMarketplaceAccess(hasAccess)

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMarketplaceListings = async () => {
    if (!pharmacy || !hasMarketplaceAccess) return

    try {
      // Query active listings from other pharmacies with medicine and pharmacy details
      // Using updated column names that match database structure
      const { data, error } = await supabase
        .from('lstng')
        .select(`
          id,
          pharmacy_id,
          medicine_id,
          custom_medicine_name,
          batch_number,
          expiry_date,
          quantity,
          unit_price,
          trade_value,
          listing_type,
          status,
          description,
          condition_notes,
          images,
          views_count,
          created_at,
          medicine:meds(name, form, strength, manufacturer),
          pharmacy:pharmacies(display_id, verified)
        `)
        .eq('status', 'active')
        .neq('pharmacy_id', pharmacy.id) // Exclude own listings
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading marketplace listings:', error)
        return
      }

      console.log('Loaded marketplace listings:', data)
      
      // Add mock distance to listings (column names now match interface)
      const listingsWithDistance = (data || []).map(listing => ({
        ...listing,
        views_count: listing.views_count || 0,
        listing_type: listing.listing_type || 'sale',
        distance: Math.round(Math.random() * radiusFilter * 2) // Mock distance
      }))

      setListings(listingsWithDistance)

    } catch (error) {
      console.error('Error loading marketplace listings:', error)
    }
  }

  const filterAndSortListings = () => {
    let filtered = [...listings]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(listing => {
        const medicineName = listing.medicine?.name || listing.custom_medicine_name || ''
        const manufacturer = listing.medicine?.manufacturer || ''
        const description = listing.description || ''
        
        return (
          medicineName.toLowerCase().includes(search) ||
          manufacturer.toLowerCase().includes(search) ||
          description.toLowerCase().includes(search)
        )
      })
    }

    // Price range filter - ensure unit_price is a number
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min)
      filtered = filtered.filter(listing => {
        const price = typeof listing.unit_price === 'number' ? listing.unit_price : parseFloat(listing.unit_price || '0')
        return price >= minPrice
      })
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max)
      filtered = filtered.filter(listing => {
        const price = typeof listing.unit_price === 'number' ? listing.unit_price : parseFloat(listing.unit_price || '0')
        return price <= maxPrice
      })
    }

    // Type filter - handle both string and enum types
    if (typeFilter !== 'all') {
      filtered = filtered.filter(listing => {
        const listingType = typeof listing.listing_type === 'string' 
          ? listing.listing_type 
          : String(listing.listing_type || 'sale')
        return listingType === typeFilter || listingType === 'both'
      })
    }

    // Distance filter (mock implementation)
    filtered = filtered.filter(listing => (listing.distance || 0) <= radiusFilter)

    // Sort listings
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => {
          const priceA = typeof a.unit_price === 'number' ? a.unit_price : parseFloat(a.unit_price || '0')
          const priceB = typeof b.unit_price === 'number' ? b.unit_price : parseFloat(b.unit_price || '0')
          return priceA - priceB
        })
        break
      case 'price_high':
        filtered.sort((a, b) => {
          const priceA = typeof a.unit_price === 'number' ? a.unit_price : parseFloat(a.unit_price || '0')
          const priceB = typeof b.unit_price === 'number' ? b.unit_price : parseFloat(b.unit_price || '0')
          return priceB - priceA
        })
        break
      case 'expiry':
        filtered.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
        break
      case 'distance':
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredListings(filtered)
  }

  const handlePurchaseRequest = async (quantity: number, notes?: string) => {
    if (!selectedListing || !pharmacy) {
      transactionNotifications.error('Missing required information')
      return
    }

    setIsProcessingTransaction(true)
    
    try {
      const transactionType = String(selectedListing.listing_type).toLowerCase() === 'trade' ? 'trade' : 'purchase'

      console.log('Creating transaction request...', {
        buyer_pharmacy_id: pharmacy.id,
        seller_pharmacy_id: selectedListing.pharmacy_id,
        listing_id: selectedListing.id,
        quantity,
        transaction_type: transactionType,
        notes
      })

      // Call the real transaction service
      const result = await directTransactionService.createTransaction({
        buyer_pharmacy_id: pharmacy.id,
        seller_pharmacy_id: selectedListing.pharmacy_id,
        listing_id: selectedListing.id,
        quantity: quantity,
        transaction_type: transactionType
      })

      if (result.success) {
        // Show beautiful success notification
        transactionNotifications.success({
          transactionId: result.transaction_id,
          amount: result.amount,
          fees: result.fee_amount,
          type: transactionType
        })
        
        // Close modal and refresh listings
        setIsQuantityModalOpen(false)
        setSelectedListing(null)
        await loadMarketplaceListings()
      } else {
        transactionNotifications.error(result.error || 'Unknown error occurred')
      }
      
    } catch (error) {
      console.error('Error creating purchase request:', error)
      transactionNotifications.error('Network error. Please try again.')
    } finally {
      setIsProcessingTransaction(false)
    }
  }

  const openQuantityModal = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setIsQuantityModalOpen(true)
  }

  const closeQuantityModal = () => {
    setIsQuantityModalOpen(false)
    setSelectedListing(null)
    setIsProcessingTransaction(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') return 'Invalid Date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return 0
    try {
      const today = new Date()
      const expiry = new Date(expiryDate)
      if (isNaN(expiry.getTime())) return 0
      const diffTime = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays) // Ensure non-negative
    } catch (error) {
      return 0
    }
  }

  const getUrgencyIndicator = (daysLeft: number) => {
    if (daysLeft <= 30) return { color: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400' };
    if (daysLeft <= 90) return { color: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20', textColor: 'text-amber-600 dark:text-amber-400' };
    return { color: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20', textColor: 'text-emerald-600 dark:text-emerald-400' };
  }

  const getOverallProgress = () => {
    if (!pharmacy || !pharmacist) return 0
    // Use IMPROVED calculation: 60% pharmacy + 40% pharmacist (consistent everywhere)
    return Math.round((pharmacy.profile_completion_percent * 0.6) + (pharmacist.profile_completion_percent * 0.4))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header 
        variant="dashboard"
        pharmacyName={pharmacy?.name || 'Loading...'}
        pharmacyId={pharmacy?.display_id}
        userRole={pharmacist?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}
        isVerified={pharmacy?.verified || false}
        showSettings={true}
        showSignOut={true}
        showDashboardButton={true}
        showWalletButton={true}
        onSignOut={handleSignOut}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
            <p className="text-gray-600 dark:text-gray-400">Loading marketplace...</p>
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
          pharmacyId={pharmacy?.display_id}
          userRole={pharmacist?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}
          isVerified={pharmacy?.verified || false}
          showSettings={true}
          showSignOut={true}
          showDashboardButton={true}
          showWalletButton={true}
          onSignOut={handleSignOut}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-400">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Marketplace Access Locked
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your profile to 50% to unlock marketplace access and start browsing medications from verified pharmacies.
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
                  <span className={overallProgress >= 50 ? 'text-pharmacy-green font-medium' : ''}>
                    50% Marketplace {overallProgress >= 50 ? '✓' : ''}
                  </span>
                  <span>100% Complete</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/profile">
                  <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                    <Settings className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>

              {/* What you'll unlock */}
              <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  🎉 What you'll unlock at 50% completion:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Browse marketplace listings
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Create your own listings
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Send purchase requests
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Connect with verified pharmacies
                  </div>
                </div>
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
        pharmacyId={pharmacy.display_id}
        userRole={pharmacist.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        isVerified={pharmacy.verified}
        showSettings={true}
        showSignOut={true}
        showDashboardButton={true}
        showWalletButton={true}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Wallet-Style Header with Safety Notice */}
        <div className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-blue-800 dark:text-blue-300 font-medium">All transactions are secure and monitored for your safety.</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Marketplace</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Discover near-expired medications from verified pharmacies</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/transactions">
                <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                  <History className="h-4 w-4 mr-2" />
                  Transaction History
                </Button>
              </Link>
              <Link href="/listings/create">
                <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
              <Link href="/listings">
                <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                  <List className="h-4 w-4 mr-2" />
                  My Listings
                </Button>
              </Link>
              <Button 
                onClick={() => loadMarketplaceListings()}
                className="bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Wallet-Style Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Available Items Card - Featured */}
          <Card className="bg-gradient-to-r from-pharmacy-green to-pharmacy-green/80 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Available Items</p>
                  <p className="text-3xl font-bold text-white">{listings.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Within 10km */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Within 10km</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredListings.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg. Price */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg. Price</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {listings.length > 0 
                      ? (() => {
                          const validPrices = listings.filter(l => {
                            const price = typeof l.unit_price === 'number' ? l.unit_price : parseFloat(l.unit_price || '0')
                            return price && !isNaN(price) && price > 0
                          })
                          if (validPrices.length === 0) return 'N/A'
                          const avgPrice = validPrices.reduce((sum, l) => {
                            const price = typeof l.unit_price === 'number' ? l.unit_price : parseFloat(l.unit_price || '0')
                            return sum + price
                          }, 0) / validPrices.length
                          return isNaN(avgPrice) ? 'N/A' : Math.round(avgPrice) + ' EGP'
                        })()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Items */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Urgent (≤30 days)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {listings.filter(l => {
                      const days = getDaysUntilExpiry(l.expiry_date)
                      return days <= 30 && days >= 0
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex gap-3 items-center">
                <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  Nearby (10km)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No items available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                There are currently no medications available in your area. Check back later or expand your search radius.
              </p>
              <Button 
                onClick={() => loadMarketplaceListings()}
                variant="outline"
                className="dark:border-slate-600 dark:text-gray-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Marketplace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredListings.map((listing) => {
              const daysLeft = getDaysUntilExpiry(listing.expiry_date)
              const urgency = getUrgencyIndicator(daysLeft)
              
              const currentPriceRaw = listing.unit_price
              const currentPrice = typeof currentPriceRaw === 'number' ? currentPriceRaw : parseFloat(currentPriceRaw || '0')
              const originalPrice = currentPrice > 0 ? Math.round(currentPrice * 1.67) : 0
              const discount = originalPrice > 0 && currentPrice > 0 
                ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                : 0
              
              return (
                <Card key={listing.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  
                  {/* Header with Badge */}
                  <div className="relative p-6 pb-4">
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-pharmacy-green text-white animate-pulse">
                        LIVE
                      </span>
                    </div>
                    
                    <div className="pr-20">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{listing.medicine?.name || listing.custom_medicine_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">{listing.medicine?.manufacturer || 'Generic'}</span>
                        {listing.batch_number && (
                          <>
                            <span>•</span>
                            <span>Batch: {listing.batch_number}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          String(listing.listing_type).toLowerCase() === 'sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                          String(listing.listing_type).toLowerCase() === 'trade' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {String(listing.listing_type).charAt(0).toUpperCase() + String(listing.listing_type).slice(1)}
                        </span>
                        <div className={`px-2.5 py-1 text-xs font-medium rounded-full border ${urgency.color} ${urgency.textColor}`}>
                          {daysLeft} days left
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quantity:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{listing.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expires:</p>
                        <p className={`font-semibold ${urgency.textColor}`}>{formatDate(listing.expiry_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Distance:</p>
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <p className="font-semibold text-gray-900 dark:text-white">~{listing.distance}km</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating:</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-current" />
                          <p className="font-semibold text-gray-900 dark:text-white">4.8</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">(127)</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
                      <div className="flex items-end justify-between">
                        <div>
                          {originalPrice > currentPrice && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-through mb-1">
                              {originalPrice} EGP
                            </p>
                          )}
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {currentPrice > 0 ? `${currentPrice} EGP` : 'Price not set'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">per unit</p>
                        </div>
                        {discount > 0 && (
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                              <Tag className="h-4 w-4 mr-1" />
                              {discount}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pharmacy Info */}
                    <div className="flex items-center justify-between mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">Verified Pharmacy</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <Shield className="h-4 w-4" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => openQuantityModal(listing)}
                        className="flex-1 bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {String(listing.listing_type).toLowerCase() === 'trade' ? 'Request Trade' : 'Request Now'}
                      </Button>
                      <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-gray-300">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Load More */}
        {filteredListings.length > 0 && (
          <div className="mt-12 text-center">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400">Showing {filteredListings.length} of {filteredListings.length} available items</p>
            </div>
            <Button 
              onClick={() => loadMarketplaceListings()}
              variant="outline"
              className="dark:border-slate-600 dark:text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Load More Items
            </Button>
          </div>
        )}

        {/* Quantity Selection Modal */}
        {selectedListing && (
          <QuantitySelectionModal
            isOpen={isQuantityModalOpen}
            onClose={closeQuantityModal}
            onConfirm={handlePurchaseRequest}
            isLoading={isProcessingTransaction}
            listing={{
              id: selectedListing.id,
              medicine_name: selectedListing.medicine?.name || selectedListing.custom_medicine_name || 'Unknown Medicine',
              medicine_details: selectedListing.medicine ? 
                `${selectedListing.medicine.strength || ''} ${selectedListing.medicine.form || ''}`.trim() : undefined,
              unit_price: typeof selectedListing.unit_price === 'number' 
                ? selectedListing.unit_price 
                : parseFloat(selectedListing.unit_price || '0'),
              available_quantity: selectedListing.quantity,
              expiry_date: selectedListing.expiry_date,
              listing_type: String(selectedListing.listing_type),
              seller_name: 'Verified Pharmacy' // We keep seller anonymous
            }}
          />
        )}

      </div>
    </div>
  )
}