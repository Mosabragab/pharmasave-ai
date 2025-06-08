'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  Loader2,
  Settings,
  Lock,
  ShoppingCart,
  Building,
  Edit3,
  Share2,
  Bell,
  Moon,
  LogOut
} from 'lucide-react'

interface Listing {
  id: string
  medicine_id?: string
  custom_medicine_name?: string
  batch_number: string
  expiry_date: string
  quantity: number
  unit_price: number
  trade_value?: number
  listing_type: 'sale' | 'trade' | 'both'
  description?: string
  status: 'draft' | 'active' | 'sold' | 'expired' | 'removed'
  images?: string[]
  created_at: string
  updated_at: string
  views_count: number
  // Medicine details if joined
  medicine?: {
    name: string
    form: string
    strength?: string
  }
}

interface PharmacyData {
  id: string
  name: string
  display_id: string
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

export default function ListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMarketplaceAccess, setHasMarketplaceAccess] = useState(false)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (pharmacy && hasMarketplaceAccess) {
      loadListings()
    }
  }, [pharmacy, hasMarketplaceAccess])

  useEffect(() => {
    if (hasMarketplaceAccess) {
      filterListings()
    }
  }, [listings, searchTerm, filterStatus, filterType, hasMarketplaceAccess])

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

  const loadListings = async () => {
    if (!pharmacy || !hasMarketplaceAccess) return

    try {
      // Query listings with medicine details
      const { data, error } = await supabase
        .from('lstng')
        .select(`
          *,
          medicine:meds(name, form, strength)
        `)
        .eq('pharmacy_id', pharmacy.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading listings:', error)
        return
      }

      console.log('Loaded listings:', data)
      setListings(data || [])

    } catch (error) {
      console.error('Error loading listings:', error)
    }
  }

  const filterListings = () => {
    let filtered = [...listings]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(listing => {
        const medicineName = listing.medicine?.name || listing.custom_medicine_name || ''
        const batchNumber = listing.batch_number || ''
        const description = listing.description || ''
        
        return (
          medicineName.toLowerCase().includes(search) ||
          batchNumber.toLowerCase().includes(search) ||
          description.toLowerCase().includes(search)
        )
      })
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(listing => listing.status === filterStatus)
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(listing => listing.listing_type === filterType)
    }

    setFilteredListings(filtered)
  }

  const toggleListingStatus = async (listingId: string, newStatus: 'active' | 'removed') => {
    try {
      const { error } = await supabase
        .from('lstng')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', listingId)

      if (error) {
        console.error('Error updating listing status:', error)
        alert('Failed to update listing status')
        return
      }

      // Update local state
      setListings(prev => prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, status: newStatus }
          : listing
      ))

      alert(`Listing ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)

    } catch (error) {
      console.error('Error updating listing status:', error)
      alert('An error occurred while updating the listing')
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('lstng')
        .delete()
        .eq('id', listingId)

      if (error) {
        console.error('Error deleting listing:', error)
        alert('Failed to delete listing')
        return
      }

      // Update local state
      setListings(prev => prev.filter(listing => listing.id !== listingId))
      alert('Listing deleted successfully')

    } catch (error) {
      console.error('Error deleting listing:', error)
      alert('An error occurred while deleting the listing')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
      case 'sold': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'expired': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'removed': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return <DollarSign className="w-4 h-4" />
      case 'trade': return <Package className="w-4 h-4" />
      case 'both': return <TrendingUp className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isNearExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30
  }

  const getOverallProgress = () => {
    if (!pharmacy || !pharmacist) return 0
    return Math.round((pharmacy.profile_completion_percent * 0.7) + (pharmacist.profile_completion_percent * 0.3))
  }

  const getDaysLeft = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
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
            <p className="text-gray-600 dark:text-gray-400">Loading your listings...</p>
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
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Started</span>
                  <span className={overallProgress >= 70 ? 'text-pharmacy-green font-medium' : ''}>
                    70% Marketplace ✓
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
                  🎉 What you'll unlock at 70% completion:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Create unlimited listings
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Manage listing inventory
                  </div>
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Browse marketplace
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-pharmacy-green" />
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
        
        {/* Wallet-Style Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Listings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your near-expired medication listings
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Link href="/marketplace">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </Link>
            <Link href="/listings/create">
              <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Wallet-Style Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Listings Card - Featured */}
          <Card className="bg-gradient-to-r from-pharmacy-green to-pharmacy-green/80 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Listings</p>
                  <p className="text-3xl font-bold text-white">{listings.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {listings.filter(l => l.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sold */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Sold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {listings.filter(l => l.status === 'sold').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Near Expiry */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Near Expiry</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {listings.filter(l => isNearExpiry(l.expiry_date) && l.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by medicine name, batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="sold">Sold</option>
                  <option value="expired">Expired</option>
                  <option value="removed">Removed</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="sale">Sale</option>
                  <option value="trade">Trade</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings */}
        {filteredListings.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {listings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {listings.length === 0 
                  ? 'Create your first listing to start selling near-expired medications'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {listings.length === 0 ? (
                <Link href="/listings/create">
                  <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Listing
                  </Button>
                </Link>
              ) : (
                <Button onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterType('all')
                }} variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredListings.map((listing) => {
              const daysLeft = getDaysLeft(listing.expiry_date)
              const isUrgent = daysLeft <= 30
              
              return (
                <Card key={listing.id} className={`bg-white dark:bg-slate-800 border hover:shadow-lg transition-all duration-300 ${
                  isUrgent ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-slate-700'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {listing.medicine?.name || listing.custom_medicine_name}
                          </h3>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(listing.status)}`}>
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </span>
                        </div>
                        {listing.batch_number && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Batch:</span> {listing.batch_number}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span><span className="font-medium">Qty:</span> {listing.quantity}</span>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            listing.listing_type === 'sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            listing.listing_type === 'trade' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {listing.listing_type.charAt(0).toUpperCase() + listing.listing_type.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pharmacy-green mb-1">{listing.unit_price} EGP</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span className={isUrgent ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {daysLeft} days left
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                        <span className={`font-medium ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                          {formatDate(listing.expiry_date)}
                          {isUrgent && <AlertCircle className="w-4 h-4 inline ml-1" />}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="text-gray-900 dark:text-white">{formatDate(listing.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 dark:border-slate-600 dark:text-gray-300"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 dark:border-slate-600 dark:text-gray-300"
                        onClick={() => toggleListingStatus(
                          listing.id, 
                          listing.status === 'active' ? 'removed' : 'active'
                        )}
                      >
                        {listing.status === 'active' ? (
                          <><EyeOff className="h-4 w-4 mr-2" />Hide</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" />Show</>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteListing(listing.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-slate-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Load More */}
        {filteredListings.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
              Load More Listings
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}