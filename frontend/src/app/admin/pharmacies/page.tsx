'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  DollarSign,
  Download
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Pharmacy {
  id: string
  name: string
  display_id: string
  license_num: string
  business_reg: string
  address: string
  city: string
  phone: string
  email: string
  ver_status: 'pending' | 'verified' | 'rejected'
  ver_date: string | null
  subscription_status: 'active' | 'inactive' | 'trial'
  subscription_expires: string | null
  created_at: string
  updated_at: string
  pharmacist_count: number
  listing_count: number
  transaction_count: number
  total_revenue: number
  last_active: string | null
}

interface PharmacyStats {
  total_pharmacies: number
  verified_pharmacies: number
  pending_verification: number
  active_subscriptions: number
  trial_subscriptions: number
  expired_subscriptions: number
  total_revenue: number
  monthly_revenue: number
}

const AdminPharmaciesManagement: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [stats, setStats] = useState<PharmacyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSubscription, setFilterSubscription] = useState('all')
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPharmaciesData()
  }, [filterStatus, filterSubscription])

  const fetchPharmaciesData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching pharmacies with corrected field names...')
      
      // ✅ CORRECTED: Using EXACT field names from your database + sustainability field
      const { data: pharmaciesData, error: pharmaciesError } = await supabase
        .from('pharmacies')
        .select(`
          id,
          name,
          display_id,
          license_num,
          email,
          phone,
          addr,
          verified,
          ver_status,
          profile_completion_percent,
          trial_started_at,
          trial_expires_at,
          marketplace_access,
          subscription_status,
          is_test_data,
          created_at,
          updated_at
        `)
        .eq('is_test_data', false)  // 🎯 SURGICAL FIX: Only real pharmacies
        .order('created_at', { ascending: false })

      console.log('📊 Fetched pharmacies data:', pharmaciesData)
      console.log('❌ Query error (if any):', pharmaciesError)

      if (pharmaciesError) {
        console.error('❌ Database query failed:', pharmaciesError)
        throw pharmaciesError
      }

      if (!pharmaciesData || pharmaciesData.length === 0) {
        console.log('⚠️ No pharmacies found in database')
        setPharmacies([])
        setStats({
          total_pharmacies: 0,
          verified_pharmacies: 0,
          pending_verification: 0,
          active_subscriptions: 0,
          trial_subscriptions: 0,
          expired_subscriptions: 0,
          total_revenue: 0,
          monthly_revenue: 0
        })
        return
      }

      console.log('✅ Raw pharmacies data:', pharmaciesData)

      // ✅ CORRECTED: Transform with exact field mapping
      const transformedPharmacies: Pharmacy[] = pharmaciesData.map(pharmacy => {
        console.log('🔄 Processing pharmacy:', pharmacy.display_id, pharmacy)
        
        const isVerified = pharmacy.verified === true
        const verificationStatus = isVerified ? 'verified' : (pharmacy.ver_status || 'pending')
        
        // 💎 TWO-STATUS SYSTEM: Trial vs Premium logic
        let subscriptionStatus: 'trial' | 'active' | 'inactive' = 'inactive'
        
        if (isVerified && pharmacy.marketplace_access === true) {
          const now = new Date()
          const trialExpires = pharmacy.trial_expires_at ? new Date(pharmacy.trial_expires_at) : null
          
          if (pharmacy.subscription_status === 'active') {
            subscriptionStatus = 'active'  // 💳 Paid subscriber
          } else if (trialExpires && now <= trialExpires) {
            subscriptionStatus = 'trial'   // 🆓 Free trial
          } else {
            subscriptionStatus = 'inactive' // ❌ Expired
          }
        }
        
        console.log(`📋 ${pharmacy.display_id}: verified=${isVerified}, status=${verificationStatus}, subscription=${subscriptionStatus}`)
        
        return {
          id: pharmacy.id,
          name: pharmacy.name || 'Unknown Pharmacy',
          display_id: pharmacy.display_id || 'N/A',
          license_num: pharmacy.license_num || '',
          business_reg: '', // This field doesn't exist in database
          address: pharmacy.addr || '', // ✅ CORRECTED: addr -> address mapping
          city: pharmacy.addr?.split(',').pop()?.trim() || '',
          phone: pharmacy.phone || '',
          email: pharmacy.email || '',
          ver_status: verificationStatus as 'pending' | 'verified' | 'rejected',
          ver_date: isVerified ? pharmacy.updated_at : null,
          subscription_status: subscriptionStatus,
          subscription_expires: pharmacy.trial_expires_at || null,
          created_at: pharmacy.created_at,
          updated_at: pharmacy.updated_at,
          pharmacist_count: 1,
          listing_count: 0,
          transaction_count: 0,
          total_revenue: 0,
          last_active: pharmacy.updated_at
        }
      })

      console.log('✨ Transformed pharmacies:', transformedPharmacies)

      // 🎯 SUSTAINABLE FIX: Database already filtered real pharmacies (is_test_data = false)
      // No need for frontend filtering - PH0002 (NAHDI) will now appear!
      let filteredPharmacies = transformedPharmacies
      
      console.log(`🎯 Real pharmacies loaded: ${filteredPharmacies.length} (test data excluded by database)`)

      // Apply user-selected filters
      if (filterStatus !== 'all') {
        const beforeCount = filteredPharmacies.length
        filteredPharmacies = filteredPharmacies.filter(p => p.ver_status === filterStatus)
        console.log(`🔍 Status filter '${filterStatus}': ${beforeCount} → ${filteredPharmacies.length}`)
      }
      
      if (filterSubscription !== 'all') {
        const beforeCount = filteredPharmacies.length
        filteredPharmacies = filteredPharmacies.filter(p => p.subscription_status === filterSubscription)
        console.log(`🔍 Subscription filter '${filterSubscription}': ${beforeCount} → ${filteredPharmacies.length}`)
      }

      console.log('🎉 Final filtered pharmacies:', filteredPharmacies)
      setPharmacies(filteredPharmacies)

      // ✅ Calculate stats for real pharmacies (already filtered by database)
      const realPharmacies = transformedPharmacies  // All are real since we filtered by is_test_data = false
      
      const statsData: PharmacyStats = {
        total_pharmacies: realPharmacies.length,
        verified_pharmacies: realPharmacies.filter(p => p.ver_status === 'verified').length,
        pending_verification: realPharmacies.filter(p => p.ver_status === 'pending').length,
        active_subscriptions: realPharmacies.filter(p => p.subscription_status === 'active').length,
        trial_subscriptions: realPharmacies.filter(p => p.subscription_status === 'trial').length,
        expired_subscriptions: realPharmacies.filter(p => p.subscription_status === 'inactive').length,
        total_revenue: realPharmacies.reduce((sum, p) => sum + p.total_revenue, 0),
        monthly_revenue: realPharmacies.filter(p => p.subscription_status === 'active').length * 999
      }

      console.log('📈 Stats calculated:', statsData)
      setStats(statsData)

    } catch (error) {
      console.error('💥 Error fetching pharmacies:', error)
      toast.error('Failed to load pharmacies data')
    } finally {
      setLoading(false)
    }
  }



  const handleUpdatePharmacyStatus = async (pharmacyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({ 
          ver_status: newStatus,
          ver_date: newStatus === 'verified' ? new Date().toISOString() : null
        })
        .eq('id', pharmacyId)

      if (error) throw error

      toast.success(`Pharmacy status updated to ${newStatus}`)
      await fetchPharmaciesData()
    } catch (error) {
      console.error('Error updating pharmacy status:', error)
      toast.error('Failed to update pharmacy status')
    }
  }

  const handleViewPharmacyDetails = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' // 💳 Paid subscribers
      case 'trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'   // 🆓 Free trial users  
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'  // ❌ Expired/suspended
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getSubscriptionLabel = (status: string, pharmacy: Pharmacy) => {
    switch (status) {
      case 'active': return '💳 Premium'
      case 'trial': {
        if (pharmacy.subscription_expires) {
          const daysLeft = Math.ceil((new Date(pharmacy.subscription_expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysLeft > 0 ? `🆓 Trial (${daysLeft}d left)` : '❌ Trial Expired'
        }
        return '🆓 Free Trial'
      }
      case 'inactive': return '❌ Expired'
      default: return status
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.display_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout title="Pharmacy Management" description="Manage all registered pharmacies">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Pharmacy Management" description="Manage all registered pharmacies">
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Pharmacies</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total_pharmacies}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.verified_pharmacies} verified
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Verification</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending_verification}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Awaiting review
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active_subscriptions}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.trial_subscriptions} on trial
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.monthly_revenue)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      From subscriptions
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pharmacies by name, ID, city, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={filterSubscription}
                  onChange={(e) => setFilterSubscription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="inactive">Inactive</option>
                </select>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pharmacies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pharmacies ({filteredPharmacies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Pharmacy</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Subscription</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Metrics</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Revenue</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Last Active</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPharmacies.map((pharmacy) => (
                    <tr key={pharmacy.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-pharmacy-green rounded-full flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{pharmacy.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{pharmacy.display_id}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {pharmacy.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(pharmacy.ver_status)}>
                          {pharmacy.ver_status}
                        </Badge>
                        {pharmacy.ver_date && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(pharmacy.ver_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={getSubscriptionColor(pharmacy.subscription_status)}>
                          {pharmacy.subscription_status}
                        </Badge>
                        {pharmacy.subscription_expires && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Expires: {new Date(pharmacy.subscription_expires).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 text-gray-500 mr-1" />
                            <span>{pharmacy.pharmacist_count} staff</span>
                          </div>
                          <div className="flex items-center">
                            <Building2 className="w-3 h-3 text-gray-500 mr-1" />
                            <span>{pharmacy.listing_count} listings</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-3 h-3 text-gray-500 mr-1" />
                            <span>{pharmacy.transaction_count} txns</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(pharmacy.total_revenue)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Total revenue
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {pharmacy.last_active ? new Date(pharmacy.last_active).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPharmacyDetails(pharmacy)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {pharmacy.ver_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePharmacyStatus(pharmacy.id, 'verified')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePharmacyStatus(pharmacy.id, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPharmacies.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pharmacies found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pharmacy Details Modal */}
        {showDetailsModal && selectedPharmacy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-pharmacy-green" />
                      {selectedPharmacy.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPharmacy.display_id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-500 mr-2" />
                        <span>{selectedPharmacy.email || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span>{selectedPharmacy.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                        <span>{selectedPharmacy.address || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">License:</span> {selectedPharmacy.license_num || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Business Reg:</span> {selectedPharmacy.business_reg || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">City:</span> {selectedPharmacy.city || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{selectedPharmacy.pharmacist_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Staff Members</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Building2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{selectedPharmacy.listing_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Listings</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{selectedPharmacy.transaction_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Verification:</span>
                        <Badge className={getStatusColor(selectedPharmacy.ver_status)}>
                          {selectedPharmacy.ver_status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Subscription:</span>
                        <Badge className={getSubscriptionColor(selectedPharmacy.subscription_status)}>
                          {selectedPharmacy.subscription_status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                        <span>Registered: {new Date(selectedPharmacy.created_at).toLocaleDateString()}</span>
                      </div>
                      {selectedPharmacy.ver_date && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span>Verified: {new Date(selectedPharmacy.ver_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedPharmacy.last_active && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500 mr-2" />
                          <span>Last Active: {new Date(selectedPharmacy.last_active).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(selectedPharmacy.total_revenue)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminPharmaciesManagement
