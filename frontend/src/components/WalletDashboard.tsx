// ===============================================
// WALLET DASHBOARD COMPONENT
// Show wallet balance, pending transactions, and history
// ===============================================

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { directTransactionService } from '@/lib/directTransactionService'
import { walletNotifications } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  History,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface WalletData {
  balance: number
  total_earned: number
  total_spent: number
  pending_incoming: number
  pending_outgoing: number
  last_updated: string
}

interface RecentTransaction {
  id: string
  type: 'incoming' | 'outgoing'
  amount: number
  status: string
  created_at: string
  description: string
  other_pharmacy_name?: string
}

interface WalletDashboardProps {
  pharmacyId: string
  pharmacistId: string
}

export default function WalletDashboard({ pharmacyId, pharmacistId }: WalletDashboardProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadWalletData()
    loadRecentTransactions()
  }, [pharmacyId])

  const loadWalletData = async () => {
    try {
      setIsLoading(true)
      
      const result = await directTransactionService.getWalletSummary(pharmacyId)
      
      if (result.success) {
        setWalletData(result.data || {
          balance: 0,
          total_earned: 0,
          total_spent: 0,
          pending_incoming: 0,
          pending_outgoing: 0,
          last_updated: new Date().toISOString()
        })
      } else {
        console.error('Failed to load wallet data:', result.error)
        // Try direct query as fallback
        await loadWalletDataDirect()
      }
      
    } catch (error) {
      console.error('Error loading wallet data:', error)
      await loadWalletDataDirect()
    } finally {
      setIsLoading(false)
    }
  }

  const loadWalletDataDirect = async () => {
    try {
      // Direct wallet balance query
      const { data: walletBalance, error: walletError } = await supabase
        .from('wlt')
        .select('balance, created_at')
        .eq('pharmacy_id', pharmacyId)
        .single()

      if (walletError) {
        console.error('Wallet balance error:', walletError)
        return
      }

      // Get transaction summary
      const { data: transactions, error: txnError } = await supabase
        .from('txn')
        .select('amount, status, buyer_pharmacy_id, seller_pharmacy_id')
        .or(`buyer_pharmacy_id.eq.${pharmacyId},seller_pharmacy_id.eq.${pharmacyId}`)

      if (txnError) {
        console.error('Transaction summary error:', txnError)
        return
      }

      // Calculate summary
      let totalEarned = 0
      let totalSpent = 0
      let pendingIncoming = 0
      let pendingOutgoing = 0

      transactions?.forEach(txn => {
        if (txn.seller_pharmacy_id === pharmacyId) {
          // This pharmacy is selling
          if (txn.status === 'approved' || txn.status === 'completed') {
            totalEarned += txn.amount
          } else if (txn.status === 'requested') {
            pendingIncoming += txn.amount
          }
        } else if (txn.buyer_pharmacy_id === pharmacyId) {
          // This pharmacy is buying
          if (txn.status === 'approved' || txn.status === 'completed') {
            totalSpent += txn.amount
          } else if (txn.status === 'requested') {
            pendingOutgoing += txn.amount
          }
        }
      })

      setWalletData({
        balance: walletBalance?.balance || 0,
        total_earned: totalEarned,
        total_spent: totalSpent,
        pending_incoming: pendingIncoming,
        pending_outgoing: pendingOutgoing,
        last_updated: walletBalance?.created_at || new Date().toISOString()
      })

    } catch (error) {
      console.error('Error in direct wallet data load:', error)
    }
  }

  const loadRecentTransactions = async () => {
    try {
      const result = await directTransactionService.getPharmacyTransactions(
        pharmacyId, 
        'all', 
        undefined, 
        10
      )

      if (result.success && result.data) {
        const formattedTransactions: RecentTransaction[] = result.data.map((txn: any) => ({
          id: txn.id,
          type: txn.seller_pharmacy_id === pharmacyId ? 'incoming' : 'outgoing',
          amount: txn.amount,
          status: txn.status,
          created_at: txn.created_at,
          description: `${txn.seller_pharmacy_id === pharmacyId ? 'Sale to' : 'Purchase from'} ${
            txn.seller_pharmacy_id === pharmacyId 
              ? txn.buyer_pharmacy?.name 
              : txn.seller_pharmacy?.name
          }`,
          other_pharmacy_name: txn.seller_pharmacy_id === pharmacyId 
            ? txn.buyer_pharmacy?.name 
            : txn.seller_pharmacy?.name
        }))
        
        setRecentTransactions(formattedTransactions)
      }
      
    } catch (error) {
      console.error('Error loading recent transactions:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadWalletData(), loadRecentTransactions()])
    setIsRefreshing(false)
    walletNotifications.balanceUpdated(walletData?.balance || 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount).replace('EGP', 'EGP')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'requested':
        return <Clock className="w-4 h-4 text-yellow-600" />
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
        return 'text-green-600'
      case 'requested':
        return 'text-yellow-600'
      case 'rejected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
            <p className="text-gray-600">Loading wallet information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wallet Dashboard</h2>
          <p className="text-gray-600">Manage your pharmacy's financial transactions</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Balance */}
        <Card className="border-l-4 border-l-pharmacy-green">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(walletData?.balance || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Updated {walletData?.last_updated ? formatDate(walletData.last_updated) : 'Never'}
                </p>
              </div>
              <div className="w-12 h-12 bg-pharmacy-green/10 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-pharmacy-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(walletData?.total_earned || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">From sales</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(walletData?.total_spent || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">On purchases</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-yellow-600">
                    {formatCurrency((walletData?.pending_incoming || 0) + (walletData?.pending_outgoing || 0))}
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>In: {formatCurrency(walletData?.pending_incoming || 0)}</p>
                    <p>Out: {formatCurrency(walletData?.pending_outgoing || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Recent Transactions</span>
            </CardTitle>
            <Badge variant="outline">
              {recentTransactions.length} transactions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions yet
              </h3>
              <p className="text-gray-600">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'incoming' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {getStatusIcon(transaction.status)}
                        <span className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(transaction.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'incoming' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {transaction.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Withdraw Funds</h3>
                <p className="text-sm text-gray-600">Transfer money to your bank account</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                disabled={!walletData?.balance || walletData.balance <= 0}
                onClick={() => {
                  // Placeholder for withdraw functionality
                  walletNotifications.info('Withdraw feature coming soon!')
                }}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <p className="text-sm text-gray-600">View complete transaction log</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/transactions">
                  <History className="w-4 h-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}