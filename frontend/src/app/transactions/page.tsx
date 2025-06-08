'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { enhancedTransactionService, type TransactionDetails } from '@/lib/enhancedTransactionService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Header from '@/components/layout/Header'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  FileText,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Info,
  XCircle,
  CreditCard,
  Wallet,
  ShoppingBag,
  List,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface PharmacyData {
  id: string
  name: string
  display_id: string
  verified: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  role: string
}

export default function TransactionHistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<TransactionDetails[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionDetails[]>([])
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalTransactions: 0,
    totalEarned: 0,
    totalSpent: 0,
    pendingCount: 0,
    completedCount: 0
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (pharmacy) {
      loadTransactions()
    }
  }, [pharmacy])

  useEffect(() => {
    filterAndSortTransactions()
  }, [transactions, searchTerm, statusFilter])

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

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransactions = async () => {
    if (!pharmacy) return

    try {
      setIsLoading(true)
      console.log('🔍 Loading transactions for pharmacy:', pharmacy.id)

      const result = await enhancedTransactionService.getPharmacyTransactions(
        pharmacy.id,
        'all',
        undefined,
        100 // Load more transactions for history page
      )

      if (result.success && result.data) {
        setTransactions(result.data)
        calculateSummaryStats(result.data)
        
        // Check if we're using mock data
        const usingMock = result.message?.includes('mock') || false
        setIsUsingMockData(usingMock)
        
        if (usingMock) {
          toast.success('Demo transaction data loaded successfully')
        } else {
          toast.success('Transaction history loaded successfully')
        }
      } else {
        console.error('Failed to load transactions:', result.error)
        toast.error('Failed to load transaction history')
      }

    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Network error while loading transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSummaryStats = (transactions: TransactionDetails[]) => {
    if (!pharmacy) return

    const stats = {
      totalTransactions: transactions.length,
      totalEarned: 0,
      totalSpent: 0,
      pendingCount: 0,
      completedCount: 0
    }

    transactions.forEach(txn => {
      if (txn.seller_pharmacy_id === pharmacy.id) {
        // This pharmacy is selling
        if (txn.status === 'approved' || txn.status === 'completed') {
          stats.totalEarned += txn.amount
          stats.completedCount++
        } else if (txn.status === 'requested') {
          stats.pendingCount++
        }
      } else if (txn.buyer_pharmacy_id === pharmacy.id) {
        // This pharmacy is buying
        if (txn.status === 'approved' || txn.status === 'completed') {
          stats.totalSpent += txn.amount
          stats.completedCount++
        } else if (txn.status === 'requested') {
          stats.pendingCount++
        }
      }
    })

    setSummaryStats(stats)
  }

  const filterAndSortTransactions = () => {
    if (!pharmacy) return

    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(txn => {
        const medicineName = txn.listing?.medicine?.name || txn.listing?.custom_medicine_name || ''
        const buyerName = txn.buyer_pharmacy?.name || ''
        const sellerName = txn.seller_pharmacy?.name || ''
        const transactionId = txn.id

        return (
          medicineName.toLowerCase().includes(search) ||
          buyerName.toLowerCase().includes(search) ||
          sellerName.toLowerCase().includes(search) ||
          transactionId.toLowerCase().includes(search)
        )
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter)
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFilteredTransactions(filtered)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount).replace('EGP', 'EGP')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'requested':
        return <Clock className="w-4 h-4 text-amber-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'requested':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getTransactionDirection = (transaction: TransactionDetails) => {
    if (!pharmacy) return 'unknown'
    return transaction.seller_pharmacy_id === pharmacy.id ? 'incoming' : 'outgoing'
  }

  // CRITICAL: Anonymization function per business policy
  const getPharmacyDisplayName = (transaction: TransactionDetails, isOtherPharmacy: boolean = true) => {
    // NEVER show real pharmacy names - always "Verified Pharmacy" before approval
    if (transaction.status === 'requested') {
      return "Verified Pharmacy"
    }
    
    // After approval, show PHxxxx ID (never real name)
    if (transaction.status === 'approved' || transaction.status === 'completed') {
      const direction = getTransactionDirection(transaction)
      if (direction === 'incoming') {
        return transaction.buyer_pharmacy?.display_id || "PH****"
      } else {
        return transaction.seller_pharmacy?.display_id || "PH****" 
      }
    }
    
    // For rejected transactions, keep anonymous
    return "Verified Pharmacy"
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading transaction history...</p>
          </div>
        </div>
      </div>
    )
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Wallet-Style Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Transaction History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your pharmacy transactions and financial activity
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Link href="/marketplace">
              <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
            <Link href="/listings">
              <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                <List className="h-4 w-4 mr-2" />
                My Listings
              </Button>
            </Link>
            <Link href="/listings/create">
              <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </Link>
            <Button 
              onClick={() => loadTransactions()}
              className="bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Demo Data Notice */}
        {isUsingMockData && (
          <Alert className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-800 dark:text-blue-400">
              <strong>Demo Mode:</strong> Showing sample transaction data for demonstration. Real transaction data will appear here once your system is fully deployed.
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet-Style Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Available Balance Card - Featured */}
          <Card className="bg-gradient-to-r from-pharmacy-green to-pharmacy-green/80 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Available Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {(summaryStats.totalEarned - summaryStats.totalSpent).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <p className="text-green-100 text-sm">EGP</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summaryStats.pendingCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Earned */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month Earned</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summaryStats.totalEarned)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Spent */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summaryStats.totalSpent)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button 
                  variant="outline"
                  onClick={clearFilters}
                  className="dark:border-slate-600 dark:text-gray-300"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Your latest payments and purchases</p>
              </div>
              <Button variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No transactions found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isUsingMockData 
                    ? "This is your transaction history area. Real transactions will appear here once you start trading."
                    : "Try adjusting your search criteria or check back later"
                  }
                </p>
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="dark:border-slate-600 dark:text-gray-300"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const direction = getTransactionDirection(transaction)
                  const isIncoming = direction === 'incoming'

                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isIncoming ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                          {isIncoming ? (
                            <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {isIncoming ? 'Payment from' : 'Purchase from'} {getPharmacyDisplayName(transaction)}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.listing?.medicine?.name || transaction.listing?.custom_medicine_name || 'Medical Product'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isIncoming ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            transaction.status === 'requested' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                          }`}>
                            {transaction.status === 'completed' ? 'Completed' : 
                             transaction.status === 'requested' ? 'Pending' : 
                             transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}