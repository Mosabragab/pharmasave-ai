'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingDown,
  Loader2,
  Plus,
  Copy,
  ExternalLink,
  CheckCircle,
  Minus,
  Download,
  Clock,
  AlertTriangle,
  Eye,
  BarChart3,
  Target,
  Award,
  Calendar,
  FileText,
  Activity,
  Zap
} from 'lucide-react'

interface WalletData {
  balance: number
  pendingBalance: number
  totalEarnings: number
  totalSpent: number
  monthlyEarnings: number
  monthlySpent: number
}

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

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  category: string
  amount: number
  fee_amount?: number
  net_amount?: number
  description: string
  created_at: string
  processed_at?: string
  status: 'completed' | 'pending' | 'failed'
  reference_number?: string
  balance_after?: number
  counterparty_name?: string
}

interface FundRequest {
  id: string
  amount: number
  request_type: string
  reason: string
  reference_number: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  created_at: string
  processed_at?: string
}

interface WithdrawRequest {
  id: string
  amount: number
  bank_name: string
  account_number: string
  account_holder: string
  reference_number: string
  status: 'pending' | 'approved' | 'rejected' | 'processing'
  notes?: string
  created_at: string
  processed_at?: string
  admin_notes?: string
}

// Enhanced Analytics Interface
interface WalletAnalytics {
  wallet_id: string
  current_balance: number
  available_balance: number
  pending_balance: number
  total_earned: number
  total_spent: number
  monthly_earned: number
  monthly_spent: number
  transaction_count: number
  avg_transaction_amount: number
  largest_deposit: number
  largest_withdrawal: number
  fund_request_count: number
  fund_request_success_rate: number
  withdrawal_request_count: number
  withdrawal_success_rate: number
  last_transaction_date: string
}

export default function WalletPage() {
  const router = useRouter()
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([])
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showTransactionDetails, setShowTransactionDetails] = useState<Transaction | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [withdrawNotes, setWithdrawNotes] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
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

      // Check if pharmacy is verified
      if (!pharmacyData.verified) {
        router.push('/dashboard/profile/verification')
        return
      }

      // Load wallet data with enhanced error handling
      await loadEnhancedWalletData(pharmacyData.id)

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadEnhancedWalletData = async (pharmacyId: string) => {
    try {
      console.log('🔍 Loading CONSOLIDATED wallet data for pharmacy:', pharmacyId)
      
      // 🔧 SURGICAL FIX: Use ONLY consolidated pharmacy_wallets system
      let realAnalytics: WalletAnalytics | null = null
      let realWalletData: WalletData

      // Primary: Load analytics (uses consolidated functions ✅)
      try {
        const { data: analyticsData, error: analyticsError } = await supabase
          .rpc('get_pharmacy_wallet_analytics', {
            p_pharmacy_id: pharmacyId
          })

        if (!analyticsError && analyticsData && analyticsData.length > 0) {
          const analytics = analyticsData[0]
          realAnalytics = {
            wallet_id: analytics.wallet_id,
            current_balance: parseFloat(analytics.current_balance || '0'),
            available_balance: parseFloat(analytics.available_balance || '0'),
            pending_balance: parseFloat(analytics.pending_balance || '0'),
            total_earned: parseFloat(analytics.total_earned || '0'),
            total_spent: parseFloat(analytics.total_spent || '0'),
            monthly_earned: parseFloat(analytics.monthly_earned || '0'),
            monthly_spent: parseFloat(analytics.monthly_spent || '0'),
            transaction_count: parseInt(analytics.transaction_count || '0'),
            avg_transaction_amount: parseFloat(analytics.avg_transaction_amount || '0'),
            largest_deposit: parseFloat(analytics.largest_deposit || '0'),
            largest_withdrawal: parseFloat(analytics.largest_withdrawal || '0'),
            fund_request_count: parseInt(analytics.fund_request_count || '0'),
            fund_request_success_rate: parseFloat(analytics.fund_request_success_rate || '0'),
            withdrawal_request_count: parseInt(analytics.withdrawal_request_count || '0'),
            withdrawal_success_rate: parseFloat(analytics.withdrawal_success_rate || '0'),
            last_transaction_date: analytics.last_transaction_date || ''
          }

          realWalletData = {
            balance: realAnalytics.current_balance,
            pendingBalance: realAnalytics.pending_balance,
            totalEarnings: realAnalytics.total_earned,
            totalSpent: realAnalytics.total_spent,
            monthlyEarnings: realAnalytics.monthly_earned,
            monthlySpent: realAnalytics.monthly_spent
          }

          console.log('✅ CONSOLIDATED analytics loaded successfully:', realAnalytics)
        } else {
          throw new Error('Analytics function error: ' + (analyticsError?.message || 'Unknown error'))
        }
      } catch (analyticsError) {
        console.error('Analytics error, using direct query fallback:', analyticsError)
        
        // 🔧 SURGICAL FIX: Fallback ONLY to consolidated pharmacy_wallets
        try {
          const { data: walletData, error: walletError } = await supabase
            .from('pharmacy_wallets')
            .select('*')
            .eq('pharmacy_id', pharmacyId)
            .single()

          if (!walletError && walletData) {
            // 🔧 CRITICAL: Use YOUR actual column names from consolidated table
            const balance = parseFloat(walletData.available_balance || '0')
            const pending = parseFloat(walletData.pending_withdrawals || '0')
            const totalEarned = parseFloat(walletData.total_earned || '0')
            const totalSpent = parseFloat(walletData.total_spent || '0')
            
            realWalletData = {
              balance: balance,
              pendingBalance: pending,
              totalEarnings: totalEarned,
              totalSpent: totalSpent,
              monthlyEarnings: totalEarned, // Simplified for fallback
              monthlySpent: totalSpent
            }
            
            console.log('✅ CONSOLIDATED fallback data loaded:', realWalletData)
          } else {
            throw new Error('Consolidated wallet not found - creating...')
          }
        } catch (walletError) {
          console.error('Wallet error, creating new consolidated wallet:', walletError)
          
          // Create consolidated wallet if missing
          try {
            const { data: newWallet, error: createError } = await supabase
              .from('pharmacy_wallets')
              .insert({
                pharmacy_id: pharmacyId,
                available_balance: 0.00,
                pending_withdrawals: 0.00,
                total_earned: 0.00,
                total_spent: 0.00,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (!createError && newWallet) {
              realWalletData = {
                balance: 0.00,
                pendingBalance: 0.00,
                totalEarnings: 0.00,
                totalSpent: 0.00,
                monthlyEarnings: 0.00,
                monthlySpent: 0.00
              }
              console.log('✅ Created new consolidated wallet')
            } else {
              throw new Error('Failed to create wallet: ' + (createError?.message || 'Unknown error'))
            }
          } catch (createError) {
            console.error('Critical error - using safe defaults:', createError)
            realWalletData = {
              balance: 0.00,
              pendingBalance: 0.00,
              totalEarnings: 0.00,
              totalSpent: 0.00,
              monthlyEarnings: 0.00,
              monthlySpent: 0.00
            }
          }
        }
      }
      
      setWalletData(realWalletData)
      setAnalytics(realAnalytics)

      // 🔧 Load consolidated transaction history
      try {
        const { data: transactionData, error: transactionError } = await supabase
          .rpc('get_enhanced_transaction_history', {
            p_pharmacy_id: pharmacyId,
            p_limit: 50,
            p_offset: 0
          })

        if (!transactionError && transactionData) {
          const realTransactions: Transaction[] = transactionData.map(txn => ({
            id: txn.transaction_id,
            type: ['credit', 'refund', 'deposit', 'fund_approval'].includes(txn.transaction_type) ? 'credit' : 'debit',
            category: txn.category,
            amount: parseFloat(txn.amount || '0'),
            fee_amount: parseFloat(txn.fee_amount || '0'),
            net_amount: parseFloat(txn.net_amount || '0'),
            description: txn.description || 'Transaction',
            created_at: txn.created_at,
            processed_at: txn.processed_at,
            status: txn.status === 'completed' ? 'completed' : txn.status === 'pending' ? 'pending' : 'failed',
            reference_number: txn.reference_number,
            balance_after: parseFloat(txn.balance_after || '0'),
            counterparty_name: txn.counterparty_name
          }))
          setTransactions(realTransactions)
          console.log('✅ CONSOLIDATED transaction history loaded:', realTransactions.length, 'transactions')
        } else {
          throw new Error('Transaction history function error')
        }
      } catch (transactionError) {
        console.error('Transaction history error, using direct query:', transactionError)
        
        // Fallback to direct consolidated wallet_transactions query
        try {
          const { data: fallbackTransactions, error: fallbackError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('pharmacy_id', pharmacyId)
            .order('created_at', { ascending: false })
            .limit(20)

          if (!fallbackError && fallbackTransactions) {
            const realTransactions: Transaction[] = fallbackTransactions.map(txn => ({
              id: txn.id,
              type: ['credit', 'refund', 'deposit', 'fund_approval'].includes(txn.transaction_type) ? 'credit' : 'debit',
              category: txn.transaction_type === 'credit' ? 'Fund Addition' : 
                       txn.transaction_type === 'deposit' ? 'Fund Addition' :
                       txn.transaction_type === 'withdrawal' ? 'Withdrawal' :
                       txn.transaction_type === 'debit' ? 'Deduction' :
                       txn.transaction_type === 'refund' ? 'Refund' :
                       txn.transaction_type === 'fee' ? 'Platform Fee' : 'Transaction',
              amount: parseFloat(txn.amount || '0'),
              fee_amount: 0,
              net_amount: parseFloat(txn.amount || '0'),
              description: txn.description || 'Transaction',
              created_at: txn.created_at,
              processed_at: txn.created_at,
              status: 'completed',
              reference_number: txn.reference_id || '',
              balance_after: parseFloat(txn.balance_after || '0'),
              counterparty_name: txn.reference_type === 'consolidation' ? 'System Consolidation' : 'System'
            }))
            setTransactions(realTransactions)
            console.log('✅ CONSOLIDATED fallback transactions loaded:', realTransactions.length, 'transactions')
          } else {
            setTransactions([])
          }
        } catch (fallbackError) {
          console.error('Fallback transaction error:', fallbackError)
          setTransactions([])
        }
      }

      // Load fund requests (no changes needed - already consolidated ✅)
      const { data: fundData, error: fundError } = await supabase
        .from('fund_requests')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!fundError && fundData) {
        const realFundRequests: FundRequest[] = fundData.map(req => ({
          id: req.id,
          amount: parseFloat(req.amount || '0'),
          request_type: req.request_type,
          reason: req.reason,
          reference_number: `${pharmacy?.display_id || 'PH'}-FUND-${req.id.slice(-6)}`,
          status: req.status as 'pending' | 'approved' | 'rejected',
          admin_notes: req.admin_notes,
          created_at: req.created_at,
          processed_at: req.updated_at !== req.created_at ? req.updated_at : undefined
        }))
        setFundRequests(realFundRequests)
      }

      // Load withdrawal requests (no changes needed - already consolidated ✅)
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!withdrawalError && withdrawalData) {
        const realWithdrawRequests: WithdrawRequest[] = withdrawalData.map(req => ({
          id: req.id,
          amount: parseFloat(req.amount || '0'),
          bank_name: req.bank_name,
          account_number: '*****' + (req.account_number || '').slice(-4),
          account_holder: req.account_holder_name,
          reference_number: req.reference_number,
          status: req.status as 'pending' | 'approved' | 'rejected' | 'processing',
          notes: req.admin_notes,
          created_at: req.created_at,
          processed_at: req.processed_at,
          admin_notes: req.admin_notes
        }))
        setWithdrawRequests(realWithdrawRequests)
      }

    } catch (error) {
      console.error('Critical error loading CONSOLIDATED wallet data:', error)
      toast.error('Failed to load wallet data')
      
      // Ultimate safety fallback
      const safeWalletData: WalletData = {
        balance: 0.00,
        pendingBalance: 0.00,
        totalEarnings: 0.00,
        totalSpent: 0.00,
        monthlyEarnings: 0.00,
        monthlySpent: 0.00
      }
      setWalletData(safeWalletData)
    }
  }

  const handleRefresh = async () => {
    if (!pharmacy) return
    
    setIsRefreshing(true)
    try {
      await loadEnhancedWalletData(pharmacy.id)
      toast.success('Wallet data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh wallet data')
    }
    setIsRefreshing(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Enhanced error handling and validation functions remain the same...
  const validateFundAmount = (amount: string): string | null => {
    const numAmount = parseFloat(amount)
    
    if (!amount || isNaN(numAmount)) {
      return 'Please enter a valid amount'
    }
    
    if (numAmount < 100) {
      return 'Minimum fund request amount is 100 EGP'
    }
    
    if (numAmount > 10000) {
      return 'Maximum fund request amount is 10,000 EGP per transaction'
    }
    
    if (numAmount % 1 !== 0) {
      return 'Amount must be a whole number (no decimals)'
    }
    
    if (numAmount === 1111 || numAmount === 2222 || numAmount === 3333) {
      return 'Please avoid repetitive number patterns'
    }
    
    return null
  }

  const validateWithdrawalData = (amount: string, bankName: string, accountNumber: string, accountHolder: string): {[key: string]: string} => {
    const errors: {[key: string]: string} = {}
    const numAmount = parseFloat(amount)
    
    if (!amount || isNaN(numAmount)) {
      errors.amount = 'Please enter a valid withdrawal amount'
    } else if (numAmount < 100) {
      errors.amount = 'Minimum withdrawal amount is 100 EGP'
    } else if (walletData && numAmount > walletData.balance) {
      errors.amount = `Insufficient balance. Available: ${walletData.balance.toFixed(2)} EGP`
    } else if (numAmount % 1 !== 0) {
      errors.amount = 'Amount must be a whole number (no decimals)'
    }
    
    if (!bankName.trim()) {
      errors.bankName = 'Bank name is required'
    } else if (bankName.length < 3) {
      errors.bankName = 'Bank name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s\-\.]+$/.test(bankName)) {
      errors.bankName = 'Bank name can only contain letters, spaces, hyphens, and periods'
    }
    
    if (!accountNumber.trim()) {
      errors.accountNumber = 'Account number is required'
    } else if (accountNumber.length < 10) {
      errors.accountNumber = 'Please enter a valid account number (minimum 10 digits)'
    } else if (!/^\d+$/.test(accountNumber)) {
      errors.accountNumber = 'Account number must contain only numbers'
    } else if (accountNumber.length > 20) {
      errors.accountNumber = 'Account number is too long (maximum 20 digits)'
    }
    
    if (!accountHolder.trim()) {
      errors.accountHolder = 'Account holder name is required'
    } else if (accountHolder.length < 3) {
      errors.accountHolder = 'Account holder name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s\-\.]+$/.test(accountHolder)) {
      errors.accountHolder = 'Name can only contain letters, spaces, hyphens, and periods'
    } else if (accountHolder.length > 50) {
      errors.accountHolder = 'Name is too long (maximum 50 characters)'
    }
    
    return errors
  }

  const handleSubmitFundRequest = async () => {
    setErrors({})
    
    if (!pharmacy) {
      toast.error('Pharmacy information not found')
      return
    }

    const amountError = validateFundAmount(fundAmount)
    if (amountError) {
      setErrors({amount: amountError})
      toast.error(amountError)
      return
    }

    const amount = parseFloat(fundAmount)
    setIsSubmittingRequest(true)

    try {
      const reference = `${pharmacy.display_id}-FUND-${Date.now().toString().slice(-6)}`
      
      console.log('🔧 Creating fund request in database...')
      
      const { data, error } = await supabase
        .from('fund_requests')
        .insert({
          pharmacy_id: pharmacy.id,
          amount: amount,
          request_type: 'bank_transfer',
          reason: `Fund request via InstaPay transfer - Amount: ${amount} EGP - Reference: ${reference}`,
          status: 'pending',
          requested_by: pharmacist?.id || null
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating fund request:', error)
        toast.error('Failed to submit fund request. Please try again.')
        return
      }

      console.log('✅ Fund request created successfully:', data)

      const newFundRequest: FundRequest = {
        id: data.id,
        amount: amount,
        request_type: data.request_type,
        reason: data.reason,
        reference_number: reference,
        status: 'pending',
        created_at: data.created_at
      }
      
      setFundRequests(prev => [newFundRequest, ...prev])
      
      toast.success(`Fund request for ${amount} EGP submitted! Admin will review and approve within 30 minutes.`)
      setShowAddFundsModal(false)
      setFundAmount('')
      
    } catch (error) {
      console.error('Error submitting fund request:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  // Withdrawal submission remains the same...
  const handleSubmitWithdrawRequest = async () => {
    setErrors({})
    
    if (!pharmacy || !walletData) {
      toast.error('Pharmacy or wallet information not found')
      return
    }

    const validationErrors = validateWithdrawalData(withdrawAmount, bankName, accountNumber, accountHolder)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fix the validation errors')
      return
    }

    const amount = parseFloat(withdrawAmount)
    setIsSubmittingWithdraw(true)

    try {
      const reference = `WD-${pharmacy.display_id}-${Date.now().toString().slice(-6)}`
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          pharmacy_id: pharmacy.id,
          amount: amount,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder_name: accountHolder,
          reference_number: reference,
          admin_notes: withdrawNotes,
          status: 'pending'
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating withdraw request:', error)
        toast.error('Failed to submit withdrawal request. Please try again.')
        return
      }

      console.log('✅ Withdrawal request created successfully:', data)

      const newWithdrawRequest: WithdrawRequest = {
        id: data.id,
        amount: amount,
        bank_name: bankName,
        account_number: '*****' + accountNumber.slice(-4),
        account_holder: accountHolder,
        reference_number: data.reference_number,
        status: 'pending',
        notes: withdrawNotes,
        created_at: data.created_at
      }
      
      setWithdrawRequests(prev => [newWithdrawRequest, ...prev])
      
      toast.success(`Withdrawal request for ${amount} EGP submitted! Admin will process within 24 hours.`)
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setBankName('')
      setAccountNumber('')
      setAccountHolder('')
      setWithdrawNotes('')
      
    } catch (error) {
      console.error('Error submitting withdrawal request:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmittingWithdraw(false)
    }
  }

  // Helper functions remain the same...
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
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <AlertTriangle className="w-4 h-4" />
      case 'processing': return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fund Addition': return <Plus className="w-4 h-4 text-green-600" />
      case 'Withdrawal': return <Download className="w-4 h-4 text-orange-600" />
      case 'Purchase': return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'Sale': return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'Platform Fee': return <Minus className="w-4 h-4 text-gray-600" />
      case 'Transfer Received': return <ArrowDownLeft className="w-4 h-4 text-blue-600" />
      case 'Transfer Sent': return <ArrowUpRight className="w-4 h-4 text-purple-600" />
      case 'Refund': return <RefreshCw className="w-4 h-4 text-green-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
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
          onSignOut={handleSignOut}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
            <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header 
        variant="dashboard"
        pharmacyName={pharmacy!.name}
        pharmacyId={pharmacy!.display_id}
        userRole={pharmacist!.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        isVerified={pharmacy!.verified}
        showSettings={true}
        showSignOut={true}
        showDashboardButton={true}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your pharmacy wallet with analytics and insights
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90" onClick={() => setShowAddFundsModal(true)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
            <Button 
              variant="outline" 
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={() => setShowWithdrawModal(true)}
              disabled={!walletData || walletData.balance <= 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* 🔧 FIXED: Enhanced Balance Cards with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-pharmacy-green to-pharmacy-green/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Available Balance</p>
                  <p className="text-3xl font-bold">{walletData?.balance.toFixed(2)} EGP</p>
                  {analytics && analytics.last_transaction_date && (
                    <p className="text-green-200 text-xs mt-1">
                      Last updated: {formatDate(analytics.last_transaction_date)}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month Earned</p>
                  <p className="text-2xl font-bold text-green-600">{walletData?.monthlyEarnings.toFixed(2)} EGP</p>
                  {analytics && (
                    <p className="text-gray-500 text-xs mt-1">
                      {analytics.transaction_count} total transactions
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month Spent</p>
                  <p className="text-2xl font-bold text-red-600">{walletData?.monthlySpent.toFixed(2)} EGP</p>
                  {analytics && analytics.avg_transaction_amount > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Avg: {analytics.avg_transaction_amount.toFixed(0)} EGP per transaction
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pending Balance</p>
                  <p className="text-2xl font-bold text-orange-600">{walletData?.pendingBalance.toFixed(2)} EGP</p>
                  {fundRequests.filter(req => req.status === 'pending').length > 0 && (
                    <p className="text-orange-500 text-xs mt-1">
                      {fundRequests.filter(req => req.status === 'pending').length} pending requests
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section - Only show if available */}
        {analytics && (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-pharmacy-green" />
                    Wallet Analytics & Insights
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Your financial performance and transaction patterns</CardDescription>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>Real-time data</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-pharmacy-green/10 to-pharmacy-green/5 rounded-lg border border-pharmacy-green/20">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-pharmacy-green" />
                  <p className="text-2xl font-bold text-pharmacy-green">{analytics.transaction_count}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Transactions</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-25 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(analytics.avg_transaction_amount)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Avg Transaction</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-25 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-lg font-bold text-green-600">{formatCurrency(analytics.largest_deposit)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Largest Deposit</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-600" />
                  <p className="text-lg font-bold text-red-600">{formatCurrency(analytics.largest_withdrawal)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Largest Withdrawal</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-25 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Award className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-lg font-bold text-purple-600">{analytics.fund_request_success_rate.toFixed(0)}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Fund Success Rate</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-25 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <Download className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-lg font-bold text-orange-600">{analytics.withdrawal_success_rate.toFixed(0)}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Withdrawal Success</p>
                </div>
              </div>

              {/* Additional insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fund Requests</span>
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {analytics.fund_request_count} total
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Withdrawals</span>
                    <Download className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {analytics.withdrawal_request_count} total
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Position</span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className={`text-lg font-bold mt-1 ${
                    analytics.total_earned >= analytics.total_spent 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(analytics.total_earned - analytics.total_spent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fund Requests Section */}
        {fundRequests.length > 0 && (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Fund Requests</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Track your pending and processed fund requests</CardDescription>
                </div>
              </div>

              <div className="space-y-4">
                {fundRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Fund Request via {request.request_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {request.reference_number} • {formatDate(request.created_at)}
                        </p>
                        {request.admin_notes && request.status !== 'pending' && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Admin: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +{request.amount.toFixed(2)} EGP
                      </p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Transaction History */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Transaction History</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Your transaction history with categories and detailed information</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                     onClick={() => setShowTransactionDetails(transaction)}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.category}</p>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.reference_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">{transaction.reference_number}</span>
                          </>
                        )}
                        {transaction.counterparty_name && transaction.counterparty_name !== 'System' && (
                          <>
                            <span>•</span>
                            <span className="text-xs">{transaction.counterparty_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'credit' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(2)} EGP
                    </p>
                    {transaction.fee_amount && transaction.fee_amount > 0 && (
                      <p className="text-xs text-gray-500">
                        Fee: {transaction.fee_amount.toFixed(2)} EGP
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm capitalize ${
                        transaction.status === 'completed' 
                          ? 'text-green-600 dark:text-green-400' 
                          : transaction.status === 'pending'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.status}
                      </p>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your enhanced transaction history will appear here once you start buying, selling, or adding funds
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals remain the same... */}
        {/* Add Funds Modal */}
        {showAddFundsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Funds</h2>
                  <button
                    onClick={() => {
                      setShowAddFundsModal(false)
                      setFundAmount('')
                      setErrors({})
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* InstaPay Instructions */}
                  <div className="bg-pharmacy-green/5 dark:bg-pharmacy-green/10 border border-pharmacy-green/20 rounded-xl p-4">
                    <h3 className="font-semibold text-pharmacy-green mb-2 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Quick & Secure via InstaPay
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Transfer funds instantly to your PharmaSave wallet using InstaPay. Admin approval typically takes 15-30 minutes.
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Amount to Add
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Enter amount..."
                          value={fundAmount}
                          onChange={(e) => {
                            setFundAmount(e.target.value)
                            if (errors.amount) {
                              setErrors(prev => ({...prev, amount: ''}))
                            }
                          }}
                          className={`text-lg py-3 pr-16 text-center font-semibold ${
                            errors.amount ? 'border-red-500' : ''
                          }`}
                          min="100"
                          max="10000"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          EGP
                        </div>
                      </div>
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum: 100 EGP • Maximum: 10,000 EGP
                      </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quick Select:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[500, 1000, 2500, 5000].map(amount => (
                          <button
                            key={amount}
                            onClick={() => {
                              setFundAmount(amount.toString())
                              if (errors.amount) {
                                setErrors(prev => ({...prev, amount: ''}))
                              }
                            }}
                            className={`p-2 border rounded-lg transition-colors text-sm font-medium ${
                              fundAmount === amount.toString()
                                ? 'border-pharmacy-green bg-pharmacy-green/10 text-pharmacy-green'
                                : 'border-gray-300 dark:border-slate-600 hover:bg-pharmacy-green/5 hover:border-pharmacy-green'
                            }`}
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  {fundAmount && parseFloat(fundAmount) >= 100 && !validateFundAmount(fundAmount) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          1. Transfer via InstaPay
                        </label>
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Transfer <span className="font-bold text-pharmacy-green">{fundAmount} EGP</span> via InstaPay to:
                          </p>
                          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border">
                            <div>
                              <p className="font-mono text-lg font-bold text-pharmacy-green">01234567890</p>
                              <p className="text-xs text-gray-500">PharmaSave AI - Funds Account</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText('01234567890')
                                toast.success('Account number copied!')
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Copy account number"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          2. Include Reference
                        </label>
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Include this reference in your transfer:
                          </p>
                          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border">
                            <p className="font-mono font-bold text-pharmacy-green">
                              {pharmacy?.display_id || 'PH0001'}-FUND-{Date.now().toString().slice(-6)}
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${pharmacy?.display_id || 'PH0001'}-FUND-${Date.now().toString().slice(-6)}`)
                                toast.success('Reference copied!')
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Copy reference"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          3. Submit Request
                        </label>
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            After completing the InstaPay transfer, submit your fund request:
                          </p>
                          <Button 
                            className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90 flex items-center justify-center"
                            onClick={handleSubmitFundRequest}
                            disabled={!!validateFundAmount(fundAmount) || isSubmittingRequest}
                          >
                            {isSubmittingRequest ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {isSubmittingRequest ? 'Submitting...' : `Submit ${fundAmount} EGP Request`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Important Notes */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-400 text-sm mb-2">
                      Important Notes:
                    </h4>
                    <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                      <li>• Minimum deposit: 100 EGP</li>
                      <li>• Maximum deposit: 10,000 EGP per transaction</li>
                      <li>• Admin approval typically takes 15-30 minutes</li>
                      <li>• Keep your InstaPay receipt until funds are confirmed</li>
                      <li>• Contact support if funds aren't added within 2 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Funds Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h2>
                  <button
                    onClick={() => {
                      setShowWithdrawModal(false)
                      setWithdrawAmount('')
                      setBankName('')
                      setAccountNumber('')
                      setAccountHolder('')
                      setWithdrawNotes('')
                      setErrors({})
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Balance Info */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-400 mb-2 flex items-center">
                      <Wallet className="w-5 h-5 mr-2" />
                      Available Balance
                    </h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {walletData?.balance.toFixed(2)} EGP
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Minimum withdrawal: 100 EGP
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Withdrawal Amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Enter amount..."
                        value={withdrawAmount}
                        onChange={(e) => {
                          setWithdrawAmount(e.target.value)
                          if (errors.amount) {
                            setErrors(prev => ({...prev, amount: ''}))
                          }
                        }}
                        className={`text-lg py-3 pr-16 text-center font-semibold ${
                          errors.amount ? 'border-red-500' : ''
                        }`}
                        min="100"
                        max={walletData?.balance || 0}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        EGP
                      </div>
                    </div>
                    {errors.amount && (
                      <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                    )}
                    {parseFloat(withdrawAmount) > (walletData?.balance || 0) && withdrawAmount && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Amount exceeds available balance
                      </p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quick Select:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, Math.floor((walletData?.balance || 0) / 100) * 100].filter(amount => amount <= (walletData?.balance || 0) && amount >= 100).map(amount => (
                        <button
                          key={amount}
                          onClick={() => {
                            setWithdrawAmount(amount.toString())
                            if (errors.amount) {
                              setErrors(prev => ({...prev, amount: ''}))
                            }
                          }}
                          className={`p-2 border rounded-lg transition-colors text-sm font-medium ${
                            withdrawAmount === amount.toString()
                              ? 'border-orange-600 bg-orange-50 text-orange-600'
                              : 'border-gray-300 dark:border-slate-600 hover:bg-orange-50 hover:border-orange-600'
                          }`}
                        >
                          {amount === Math.floor((walletData?.balance || 0) / 100) * 100 ? 'Max' : amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Bank Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., National Bank of Egypt"
                        value={bankName}
                        onChange={(e) => {
                          setBankName(e.target.value)
                          if (errors.bankName) {
                            setErrors(prev => ({...prev, bankName: ''}))
                          }
                        }}
                        className={errors.bankName ? 'border-red-500' : ''}
                      />
                      {errors.bankName && (
                        <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Account Number
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your account number"
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value)
                          if (errors.accountNumber) {
                            setErrors(prev => ({...prev, accountNumber: ''}))
                          }
                        }}
                        className={errors.accountNumber ? 'border-red-500' : ''}
                        maxLength={20}
                      />
                      {errors.accountNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Account Holder Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Full name as per bank records"
                        value={accountHolder}
                        onChange={(e) => {
                          setAccountHolder(e.target.value)
                          if (errors.accountHolder) {
                            setErrors(prev => ({...prev, accountHolder: ''}))
                          }
                        }}
                        className={errors.accountHolder ? 'border-red-500' : ''}
                        maxLength={50}
                      />
                      {errors.accountHolder && (
                        <p className="text-red-500 text-sm mt-1">{errors.accountHolder}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Additional Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Any special instructions or notes..."
                        value={withdrawNotes}
                        onChange={(e) => setWithdrawNotes(e.target.value)}
                        className="min-h-[80px]"
                        maxLength={200}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center"
                      onClick={handleSubmitWithdrawRequest}
                      disabled={
                        !withdrawAmount || 
                        !bankName ||
                        !accountNumber ||
                        !accountHolder ||
                        parseFloat(withdrawAmount) < 100 || 
                        parseFloat(withdrawAmount) > (walletData?.balance || 0) ||
                        isSubmittingWithdraw ||
                        Object.keys(validateWithdrawalData(withdrawAmount, bankName, accountNumber, accountHolder)).length > 0
                      }
                    >
                      {isSubmittingWithdraw ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {isSubmittingWithdraw ? 'Submitting...' : `Request ${withdrawAmount || '0'} EGP Withdrawal`}
                    </Button>
                  </div>

                  {/* Important Notes */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 text-sm mb-2">
                      Withdrawal Information:
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Minimum withdrawal: 100 EGP</li>
                      <li>• Processing time: 12-24 hours after approval</li>
                      <li>• Admin approval required for all withdrawals</li>
                      <li>• Ensure account details are correct</li>
                      <li>• Contact support for urgent withdrawals</li>
                      <li>• Bank transfer fees may apply</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
