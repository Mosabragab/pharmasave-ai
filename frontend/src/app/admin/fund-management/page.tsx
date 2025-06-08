'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  FileText,
  Copy,
  ExternalLink,
  TrendingUp,
  Banknote,
  Wallet,
  Download,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface FundRequest {
  id: string
  pharmacy_id: string
  pharmacy_name: string
  pharmacy_display_id: string
  amount: number
  reference_number: string
  instapay_receipt?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected' | 'processing'
  created_at: string
  processed_at?: string
  processed_by?: string
  admin_notes?: string
  // Pharmacy details
  pharmacy_contact_email?: string
  pharmacy_contact_phone?: string
  current_wallet_balance?: number
}

interface WithdrawRequest {
  id: string
  pharmacy_id: string
  pharmacy_name: string
  pharmacy_display_id: string
  amount: number
  reference_number: string
  bank_name: string
  account_number: string
  account_holder: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected' | 'processing'
  created_at: string
  processed_at?: string
  processed_by?: string
  admin_notes?: string
  // Pharmacy details
  pharmacy_contact_email?: string
  pharmacy_contact_phone?: string
  current_wallet_balance?: number
}

interface AdminStats {
  // Fund stats
  fund_pending: number
  fund_approved_today: number
  fund_amount_processed_today: number
  fund_pending_amount: number
  // Withdrawal stats
  withdrawal_pending: number
  withdrawal_approved_today: number
  withdrawal_amount_processed_today: number
  withdrawal_pending_amount: number
  // Combined stats
  average_processing_time: number
}

export default function AdminFundManagementPage() {
  const [activeTab, setActiveTab] = useState<'funds' | 'withdrawals'>('funds')
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([])
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<FundRequest[] | WithdrawRequest[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<FundRequest | WithdrawRequest | null>(null)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject'>('approve')
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Authentication is handled by AdminAuthGuard, so we can load data directly
    loadFundRequests()
    loadWithdrawRequests()
  }, [])

  useEffect(() => {
    // Load stats after data is loaded
    if (fundRequests.length >= 0 && withdrawRequests.length >= 0) {
      loadStats()
    }
  }, [fundRequests, withdrawRequests])

  useEffect(() => {
    filterRequests()
  }, [fundRequests, withdrawRequests, statusFilter, searchTerm, activeTab])



  const loadFundRequests = async () => {
    try {
      console.log('🔍 Loading real fund requests from database')
      
      // Load real fund requests from database with pharmacy details
      const { data: fundData, error: fundError } = await supabase
        .from('fund_requests')
        .select(`
          *,
          pharmacy:pharmacies(
            name,
            display_id,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fundError) {
        console.error('Error loading fund requests:', fundError)
        toast.error('Failed to load fund requests')
        return
      }

      // Convert database format to frontend format
      const realFundRequests: FundRequest[] = (fundData || []).map(req => ({
        id: req.id,
        pharmacy_id: req.pharmacy_id,
        pharmacy_name: req.pharmacy?.name || 'Unknown Pharmacy',
        pharmacy_display_id: req.pharmacy?.display_id || 'Unknown',
        amount: parseFloat(req.amount || '0'),
        reference_number: `${req.pharmacy?.display_id || 'PH'}-FUND-${req.id.slice(-6)}`,
        notes: req.reason,
        status: req.status as 'pending' | 'approved' | 'rejected' | 'processing',
        created_at: req.created_at,
        processed_at: req.updated_at !== req.created_at ? req.updated_at : undefined,
        processed_by: req.approved_by,
        admin_notes: req.admin_notes,
        pharmacy_contact_email: req.pharmacy?.email,
        pharmacy_contact_phone: req.pharmacy?.phone
      }))

      setFundRequests(realFundRequests)
      console.log('✅ Real fund requests loaded:', realFundRequests.length, 'requests')

    } catch (error) {
      console.error('Error loading fund requests:', error)
      toast.error('Failed to load fund requests')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWithdrawRequests = async () => {
    try {
      console.log('🔍 Loading real withdrawal requests from database')
      
      // Load real withdrawal requests from database with pharmacy details
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          pharmacy:pharmacies(
            name,
            display_id,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (withdrawalError) {
        console.error('Error loading withdrawal requests:', withdrawalError)
        toast.error('Failed to load withdrawal requests')
        return
      }

      // Convert database format to frontend format
      const realWithdrawRequests: WithdrawRequest[] = (withdrawalData || []).map(req => ({
        id: req.id,
        pharmacy_id: req.pharmacy_id,
        pharmacy_name: req.pharmacy?.name || 'Unknown Pharmacy',
        pharmacy_display_id: req.pharmacy?.display_id || 'Unknown',
        amount: parseFloat(req.amount || '0'),
        reference_number: req.reference_number,
        bank_name: req.bank_name,
        account_number: '*****' + (req.account_number || '').slice(-4),
        account_holder: req.account_holder_name,
        notes: req.admin_notes,
        status: req.status as 'pending' | 'approved' | 'rejected' | 'processing',
        created_at: req.created_at,
        processed_at: req.processed_at,
        processed_by: req.processed_by,
        admin_notes: req.admin_notes,
        pharmacy_contact_email: req.pharmacy?.email,
        pharmacy_contact_phone: req.pharmacy?.phone
      }))

      setWithdrawRequests(realWithdrawRequests)
      console.log('✅ Real withdrawal requests loaded:', realWithdrawRequests.length, 'requests')

    } catch (error) {
      console.error('Error loading withdrawal requests:', error)
      toast.error('Failed to load withdrawal requests')
    }
  }

  const loadStats = async () => {
    try {
      // Calculate real stats from loaded data
      // Fund stats
      const pendingFundRequests = fundRequests.filter(r => r.status === 'pending')
      const approvedFundToday = fundRequests.filter(r => 
        r.status === 'approved' && 
        r.processed_at && 
        new Date(r.processed_at).toDateString() === new Date().toDateString()
      )

      // Withdrawal stats
      const pendingWithdrawRequests = withdrawRequests.filter(r => r.status === 'pending')
      const approvedWithdrawToday = withdrawRequests.filter(r => 
        r.status === 'approved' && 
        r.processed_at && 
        new Date(r.processed_at).toDateString() === new Date().toDateString()
      )

      // Calculate average processing time (simplified calculation)
      const processedRequests = [...fundRequests, ...withdrawRequests].filter(r => 
        r.status === 'approved' && r.processed_at && r.created_at
      )
      
      let avgProcessingTime = 25 // default
      if (processedRequests.length > 0) {
        const totalTime = processedRequests.reduce((sum, req) => {
          const created = new Date(req.created_at).getTime()
          const processed = new Date(req.processed_at!).getTime()
          return sum + (processed - created)
        }, 0)
        avgProcessingTime = Math.round(totalTime / processedRequests.length / (1000 * 60)) // Convert to minutes
      }

      setStats({
        fund_pending: pendingFundRequests.length,
        fund_approved_today: approvedFundToday.length,
        fund_amount_processed_today: approvedFundToday.reduce((sum, r) => sum + r.amount, 0),
        fund_pending_amount: pendingFundRequests.reduce((sum, r) => sum + r.amount, 0),
        withdrawal_pending: pendingWithdrawRequests.length,
        withdrawal_approved_today: approvedWithdrawToday.length,
        withdrawal_amount_processed_today: approvedWithdrawToday.reduce((sum, r) => sum + r.amount, 0),
        withdrawal_pending_amount: pendingWithdrawRequests.reduce((sum, r) => sum + r.amount, 0),
        average_processing_time: avgProcessingTime
      })

      console.log('✅ Stats calculated from real data:', {
        fundPending: pendingFundRequests.length,
        withdrawalPending: pendingWithdrawRequests.length,
        avgProcessingTime
      })

    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const filterRequests = () => {
    const requests = activeTab === 'funds' ? fundRequests : withdrawRequests
    let filtered = [...requests]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(request =>
        request.pharmacy_name.toLowerCase().includes(search) ||
        request.pharmacy_display_id.toLowerCase().includes(search) ||
        request.reference_number.toLowerCase().includes(search)
      )
    }

    setFilteredRequests(filtered)
  }

  // 🎯 SURGICAL FIX: Enhanced wallet integration for fund approval
  const processWithWalletIntegration = async (requestId: string, action: 'approve' | 'reject', pharmacyId: string, amount: number, displayId: string) => {
    if (action === 'approve') {
      try {
        // 1. Get or create wallet
        let { data: wallet, error: walletError } = await supabase
          .from('pharmacy_wallets')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .single()

        if (walletError && walletError.code === 'PGRST116') {
          // Wallet doesn't exist, create it
          const { data: newWallet, error: createError } = await supabase
            .from('pharmacy_wallets')
            .insert({
              pharmacy_id: pharmacyId,
              available_balance: 0,
              pending_withdrawals: 0,
              total_earned: 0,
              total_spent: 0
            })
            .select()
            .single()

          if (createError) {
            throw new Error(`Failed to create wallet: ${createError.message}`)
          }
          wallet = newWallet
        } else if (walletError) {
          throw new Error(`Failed to get wallet: ${walletError.message}`)
        }

        // 2. Calculate new balance
        const currentBalance = parseFloat(wallet.available_balance || '0')
        const newBalance = currentBalance + amount
        const newTotalEarned = parseFloat(wallet.total_earned || '0') + amount

        // 3. Update wallet balance
        const { error: updateWalletError } = await supabase
          .from('pharmacy_wallets')
          .update({
            available_balance: newBalance,
            total_earned: newTotalEarned,
            last_transaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id)

        if (updateWalletError) {
          throw new Error(`Failed to update wallet: ${updateWalletError.message}`)
        }

        // 4. Create wallet transaction record
        const { error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            pharmacy_id: pharmacyId,
            transaction_type: 'deposit',
            amount: amount,
            balance_before: currentBalance,
            balance_after: newBalance,
            status: 'completed',
            description: `Fund request approved: ${amount} EGP added to wallet`,
            reference_number: `FUND-${displayId}-${requestId.slice(-6)}`,
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString()
          })

        if (transactionError) {
          throw new Error(`Failed to create transaction: ${transactionError.message}`)
        }

        return { success: true, newBalance }
      } catch (error) {
        console.error('Wallet integration error:', error)
        throw error
      }
    }
    return { success: true, newBalance: 0 }
  }

  const handleProcessRequest = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return

    setIsProcessing(true)

    try {
      console.log(`🔧 Processing ${activeTab === 'funds' ? 'fund' : 'withdrawal'} request:`, selectedRequest.id, action)

      if (activeTab === 'funds') {
        // 🎯 NEW: Enhanced fund request processing with wallet integration
        if (action === 'approve') {
          console.log('💰 Processing fund approval with wallet integration...')
          
          // First, integrate with wallet system
          const walletResult = await processWithWalletIntegration(
            selectedRequest.id,
            action,
            selectedRequest.pharmacy_id,
            selectedRequest.amount,
            selectedRequest.pharmacy_display_id
          )

          console.log('✅ Wallet integration successful:', walletResult)
        }

        // Update fund request status
        const { error: updateError } = await supabase
          .from('fund_requests')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            admin_notes: adminNotes || (action === 'approve' ? 'Fund request approved and added to wallet' : 'Fund request rejected'),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRequest.id)

        if (updateError) {
          console.error('Error updating fund request:', updateError)
          toast.error('Failed to process fund request')
          return
        }

        if (action === 'approve') {
          toast.success(`✅ Fund request approved! ${selectedRequest.amount} EGP added to ${selectedRequest.pharmacy_display_id}'s wallet balance.`)
        } else {
          toast.success('Fund request rejected')
        }

        // Update local state
        setFundRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? {
                ...req,
                status: action === 'approve' ? 'approved' as const : 'rejected' as const,
                processed_at: new Date().toISOString(),
                admin_notes: adminNotes || (action === 'approve' ? 'Fund request approved and added to wallet' : 'Fund request rejected')
              }
            : req
        ))
        
      } else {
        // Enhanced withdrawal processing with wallet integration
        if (action === 'approve') {
          try {
            // Get current wallet balance
            const { data: wallet, error: walletError } = await supabase
              .from('pharmacy_wallets')
              .select('*')
              .eq('pharmacy_id', selectedRequest.pharmacy_id)
              .single()

            if (walletError || !wallet) {
              throw new Error('Pharmacy wallet not found')
            }

            const currentBalance = parseFloat(wallet.available_balance || '0')
            if (currentBalance < selectedRequest.amount) {
              toast.error(`Insufficient wallet balance. Available: ${currentBalance} EGP, Requested: ${selectedRequest.amount} EGP`)
              return
            }

            // Update wallet balance (deduct withdrawal amount)
            const newBalance = currentBalance - selectedRequest.amount
            const newTotalSpent = parseFloat(wallet.total_spent || '0') + selectedRequest.amount
            
            const { error: updateWalletError } = await supabase
              .from('pharmacy_wallets')
              .update({
                available_balance: newBalance,
                total_spent: newTotalSpent,
                last_transaction_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', wallet.id)

            if (updateWalletError) {
              throw new Error(`Failed to update wallet: ${updateWalletError.message}`)
            }

            // Create withdrawal transaction record
            const { error: transactionError } = await supabase
              .from('wallet_transactions')
              .insert({
                pharmacy_id: selectedRequest.pharmacy_id,
                transaction_type: 'withdrawal',
                amount: selectedRequest.amount,
                balance_before: currentBalance,
                balance_after: newBalance,
                status: 'completed',
                description: `Withdrawal approved: ${selectedRequest.amount} EGP withdrawn from wallet`,
                reference_number: selectedRequest.reference_number,
                created_at: new Date().toISOString(),
                processed_at: new Date().toISOString()
              })

            if (transactionError) {
              throw new Error(`Failed to create transaction: ${transactionError.message}`)
            }

            console.log('✅ Withdrawal wallet integration successful')
          } catch (error) {
            console.error('Withdrawal wallet integration error:', error)
            toast.error(`Failed to process withdrawal: ${error.message}`)
            return
          }
        }

        // Update withdrawal request in database
        const { error: updateError } = await supabase
          .from('withdrawal_requests')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            admin_notes: adminNotes || (action === 'approve' ? 'Withdrawal request approved and processed' : 'Withdrawal request rejected'),
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRequest.id)

        if (updateError) {
          console.error('Error updating withdrawal request:', updateError)
          toast.error('Failed to process withdrawal request')
          return
        }

        if (action === 'approve') {
          toast.success(`✅ Withdrawal approved! ${selectedRequest.amount} EGP deducted from wallet and will be transferred to bank account.`)
        } else {
          toast.success('Withdrawal request rejected')
        }

        // Update local state
        setWithdrawRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? {
                ...req,
                status: action === 'approve' ? 'approved' as const : 'rejected' as const,
                processed_at: new Date().toISOString(),
                admin_notes: adminNotes || (action === 'approve' ? 'Withdrawal request approved and processed' : 'Withdrawal request rejected')
              }
            : req
        ))
      }

      console.log('✅ Request processed successfully with wallet integration')
      
      // Refresh stats
      await loadStats()
      
      // Close modal
      setShowProcessModal(false)
      setSelectedRequest(null)
      setAdminNotes('')

    } catch (error) {
      console.error('Error processing request:', error)
      toast.error(`Failed to process request: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
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
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'processing': return <RefreshCw className="w-4 h-4 animate-spin" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
            <p className="text-gray-600 dark:text-gray-400">Loading fund management...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Financial Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage pharmacy fund and withdrawal requests with automatic wallet integration
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" onClick={() => {
              setIsLoading(true)
              Promise.all([
                loadFundRequests(),
                loadWithdrawRequests()
              ]).finally(() => {
                setIsLoading(false)
                toast.success('Data refreshed successfully')
              })
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* 🎯 Integration Status Notice */}
        <div className="mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-400">
                  ✅ Wallet Integration Active
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Fund approvals automatically update pharmacy wallet balances and create transaction records. Withdrawal approvals deduct from wallet balances.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('funds')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'funds'
                    ? 'border-pharmacy-green text-pharmacy-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Fund Requests</span>
                  {stats && stats.fund_pending > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {stats.fund_pending}
                    </Badge>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'withdrawals'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Withdrawal Requests</span>
                  {stats && stats.withdrawal_pending > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {stats.withdrawal_pending}
                    </Badge>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-800 text-sm font-medium">Pending {activeTab === 'funds' ? 'Funds' : 'Withdrawals'}</p>
                    <p className="text-3xl font-bold text-yellow-900">
                      {activeTab === 'funds' ? stats.fund_pending : stats.withdrawal_pending}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 text-sm font-medium">Approved Today</p>
                    <p className="text-3xl font-bold text-green-900">
                      {activeTab === 'funds' ? stats.fund_approved_today : stats.withdrawal_approved_today}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 text-sm font-medium">Amount Processed</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(activeTab === 'funds' ? stats.fund_amount_processed_today : stats.withdrawal_amount_processed_today)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-800 text-sm font-medium">Pending Amount</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(activeTab === 'funds' ? stats.fund_pending_amount : stats.withdrawal_pending_amount)}
                    </p>
                  </div>
                  <Banknote className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-800 text-sm font-medium">Avg Processing</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.average_processing_time}m</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by pharmacy, ID, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
              </select>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Filter className="w-4 h-4 mr-2" />
                {filteredRequests.length} of {activeTab === 'funds' ? fundRequests.length : withdrawRequests.length} requests
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pharmacy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    {activeTab === 'withdrawals' && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Bank Details
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {request.pharmacy_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {request.pharmacy_display_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-semibold ${
                          activeTab === 'funds' ? 'text-pharmacy-green' : 'text-orange-600'
                        }`}>
                          {activeTab === 'funds' ? '+' : '-'}{formatCurrency(request.amount)}
                        </div>
                      </td>
                      {activeTab === 'withdrawals' && (
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {(request as WithdrawRequest).bank_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {(request as WithdrawRequest).account_number}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {(request as WithdrawRequest).account_holder}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {request.reference_number}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(request.reference_number)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
                            title="Copy reference"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowProcessModal(true)
                            }}
                            disabled={request.status !== 'pending'}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {request.status === 'pending' ? 'Process' : 'View'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  {activeTab === 'funds' ? (
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  ) : (
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  )}
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    No {activeTab === 'funds' ? 'fund' : 'withdrawal'} requests found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : `${activeTab === 'funds' ? 'Fund' : 'Withdrawal'} requests will appear here when pharmacies submit them`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Process Modal */}
        {showProcessModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Process {activeTab === 'funds' ? 'Fund' : 'Withdrawal'} Request
                  </h2>
                  <button
                    onClick={() => setShowProcessModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Request Details */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pharmacy
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedRequest.pharmacy_name} ({selectedRequest.pharmacy_display_id})
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount
                      </label>
                      <p className={`text-2xl font-bold ${
                        activeTab === 'funds' ? 'text-pharmacy-green' : 'text-orange-600'
                      }`}>
                        {activeTab === 'funds' ? '+' : '-'}{formatCurrency(selectedRequest.amount)}
                      </p>
                    </div>
                    
                    {activeTab === 'withdrawals' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bank Details
                        </label>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(selectedRequest as WithdrawRequest).bank_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Account: {(selectedRequest as WithdrawRequest).account_number}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Holder: {(selectedRequest as WithdrawRequest).account_holder}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reference Number
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-white dark:bg-slate-800 px-3 py-1 rounded border">
                          {selectedRequest.reference_number}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedRequest.reference_number)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Requested On
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(selectedRequest.created_at)}
                      </p>
                    </div>
                  </div>

                  {selectedRequest.notes && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {activeTab === 'funds' ? 'Pharmacy Notes' : 'Withdrawal Notes'}
                      </label>
                      <p className="text-gray-900 dark:text-white bg-white dark:bg-slate-800 p-3 rounded border">
                        {selectedRequest.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Selection */}
                {selectedRequest.status === 'pending' && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Action
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setProcessingAction('approve')}
                          className={`flex items-center px-4 py-3 rounded-lg border-2 transition-colors ${
                            processingAction === 'approve'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'border-gray-300 dark:border-slate-600 hover:border-green-300'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {activeTab === 'funds' ? 'Approve & Add to Wallet' : 'Approve & Deduct from Wallet'}
                        </button>
                        
                        <button
                          onClick={() => setProcessingAction('reject')}
                          className={`flex items-center px-4 py-3 rounded-lg border-2 transition-colors ${
                            processingAction === 'reject'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-gray-300 dark:border-slate-600 hover:border-red-300'
                          }`}
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          {activeTab === 'funds' ? 'Reject Fund Request' : 'Reject Withdrawal'}
                        </button>
                      </div>
                    </div>

                    {/* Wallet Integration Notice */}
                    {processingAction === 'approve' && (
                      <div className="mb-6">
                        <div className="bg-pharmacy-green/5 dark:bg-pharmacy-green/10 border border-pharmacy-green/20 rounded-lg p-4">
                          <div className="flex items-center">
                            <Wallet className="w-5 h-5 text-pharmacy-green mr-2" />
                            <div>
                              <h4 className="font-semibold text-pharmacy-green text-sm">
                                Automatic Wallet Integration
                              </h4>
                              <p className="text-sm text-pharmacy-green mt-1">
                                {activeTab === 'funds' 
                                  ? `Approving will add ${formatCurrency(selectedRequest.amount)} to the pharmacy's wallet balance and create a transaction record.`
                                  : `Approving will deduct ${formatCurrency(selectedRequest.amount)} from the pharmacy's wallet balance and create a transaction record.`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Notes {processingAction === 'reject' && <span className="text-red-500">*</span>}
                      </label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder={
                          processingAction === 'approve' 
                            ? `Optional notes about the ${activeTab === 'funds' ? 'fund' : 'withdrawal'} approval...`
                            : `Please explain why this ${activeTab === 'funds' ? 'fund' : 'withdrawal'} request is being rejected...`
                        }
                        rows={3}
                        className="w-full"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleProcessRequest(processingAction)}
                        disabled={isProcessing || (processingAction === 'reject' && !adminNotes.trim())}
                        className={
                          processingAction === 'approve'
                            ? 'bg-green-600 hover:bg-green-700 flex-1'
                            : 'bg-red-600 hover:bg-red-700 flex-1'
                        }
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : processingAction === 'approve' ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        {isProcessing ? 'Processing...' : `${processingAction === 'approve' ? 'Approve' : 'Reject'} ${activeTab === 'funds' ? 'Fund Request' : 'Withdrawal'}`}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowProcessModal(false)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {/* Already Processed */}
                {selectedRequest.status !== 'pending' && (
                  <div className={`p-4 rounded-lg ${
                    selectedRequest.status === 'approved' 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                  }`}>
                    <div className="flex items-center mb-2">
                      {selectedRequest.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      )}
                      <span className="font-medium capitalize">
                        {selectedRequest.status === 'approved' 
                          ? `${activeTab === 'funds' ? 'Fund Request' : 'Withdrawal'} Approved` 
                          : `${activeTab === 'funds' ? 'Fund Request' : 'Withdrawal'} Rejected`
                        }
                      </span>
                    </div>
                    {selectedRequest.processed_at && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Processed on {formatDate(selectedRequest.processed_at)}
                      </p>
                    )}
                    {selectedRequest.admin_notes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedRequest.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
