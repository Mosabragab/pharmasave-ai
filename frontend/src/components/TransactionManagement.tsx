// ===============================================
// TRANSACTION MANAGEMENT DASHBOARD
// For sellers to approve/reject incoming requests
// ===============================================

'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { directTransactionService } from '@/lib/directTransactionService'
import { transactionNotifications } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  DollarSign,
  User,
  Calendar,
  RefreshCw,
  Eye,
  MessageSquare,
  AlertCircle
} from 'lucide-react'

interface PendingTransaction {
  id: string
  buyer_pharmacy_id: string
  seller_pharmacy_id: string
  lstng_id: string
  quantity: number
  amount: number
  status: string
  transaction_type: 'purchase' | 'trade'
  created_at: string
  notes?: string
  
  // Joined data
  buyer_pharmacy?: {
    name: string
    display_id: string
    phone?: string
  }
  listing?: {
    id: string
    medicine?: {
      name: string
      form: string
      strength?: string
    }
    custom_medicine_name?: string
    unit_price: number
    expiry_date: string
    qty: number
  }
}

interface TransactionManagementProps {
  pharmacyId: string
  pharmacistId: string
}

export default function TransactionManagement({ pharmacyId, pharmacistId }: TransactionManagementProps) {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPendingTransactions()
  }, [pharmacyId])

  const loadPendingTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Get pending transactions where current pharmacy is the seller
      const { data, error } = await supabase
        .from('txn')
        .select(`
          *,
          buyer_pharmacy:buyer_pharmacy_id(name, display_id, phone),
          listing:lstng_id(
            id,
            unit_price,
            expiry_date,
            qty,
            medicine:med_id(name, form, strength),
            custom_medicine_name
          )
        `)
        .eq('seller_pharmacy_id', pharmacyId)
        .eq('status', 'requested')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Database query error:', error.message)
        // Don't show error notification for empty results
        if (!error.message.includes('No rows') && !error.message.includes('relation')) {
          transactionNotifications.error('Failed to load pending transactions')
        }
        return
      }

      console.log('Loaded pending transactions:', data?.length || 0, 'found')
      setPendingTransactions(data || [])
      
    } catch (error) {
      console.warn('Network error loading transactions:', error)
      transactionNotifications.error('Network error while loading transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (transactionId: string, notes?: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(transactionId))
      
      const result = await directTransactionService.approveTransaction(
        transactionId, 
        notes || 'Transaction approved by seller'
      )

      if (result.success) {
        transactionNotifications.approved(transactionId)
        await loadPendingTransactions() // Refresh the list
      } else {
        transactionNotifications.error(result.error || 'Failed to approve transaction')
      }
      
    } catch (error) {
      console.error('Error approving transaction:', error)
      transactionNotifications.error('Network error while approving transaction')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
        return newSet
      })
    }
  }

  const handleReject = async (transactionId: string, reason?: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(transactionId))
      
      const result = await directTransactionService.rejectTransaction(
        transactionId, 
        reason || 'Transaction rejected by seller'
      )

      if (result.success) {
        transactionNotifications.rejected(transactionId, reason)
        await loadPendingTransactions() // Refresh the list
      } else {
        transactionNotifications.error(result.error || 'Failed to reject transaction')
      }
      
    } catch (error) {
      console.error('Error rejecting transaction:', error)
      transactionNotifications.error('Network error while rejecting transaction')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
        return newSet
      })
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
          <p className="text-gray-600">Loading pending transactions...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction Requests</h2>
          <p className="text-gray-600">Approve or reject incoming purchase requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-pharmacy-green border-pharmacy-green">
            {pendingTransactions.length} Pending
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadPendingTransactions}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      {pendingTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No pending requests
            </h3>
            <p className="text-gray-600">
              New purchase requests will appear here for your approval
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingTransactions.map((transaction) => (
            <Card key={transaction.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Transaction Details */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-pharmacy-green" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transaction.listing?.medicine?.name || transaction.listing?.custom_medicine_name}
                        </h3>
                        <Badge variant={transaction.transaction_type === 'trade' ? 'outline' : 'default'}>
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pharmacy-green">
                          {transaction.amount} EGP
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.quantity} × {transaction.listing?.unit_price} EGP
                        </p>
                      </div>
                    </div>

                    {/* Medicine Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Medicine Details:</p>
                        <p className="font-medium">
                          {transaction.listing?.medicine?.strength && `${transaction.listing.medicine.strength} `}
                          {transaction.listing?.medicine?.form}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Quantity Requested:</p>
                        <p className="font-medium">{transaction.quantity} units</p>
                        <p className="text-xs text-gray-500">
                          Available: {transaction.listing?.qty} units
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expires:</p>
                        <p className={`font-medium ${getExpiryColor(transaction.listing?.expiry_date || '')}`}>
                          {transaction.listing?.expiry_date && new Date(transaction.listing.expiry_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          ({getDaysUntilExpiry(transaction.listing?.expiry_date || '')} days)
                        </p>
                      </div>
                    </div>

                    {/* Buyer Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Buyer Information</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pharmacy:</p>
                          <p className="font-medium">{transaction.buyer_pharmacy?.name}</p>
                          <p className="text-xs text-gray-500">ID: {transaction.buyer_pharmacy?.display_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Request Date:</p>
                          <p className="font-medium">{formatDate(transaction.created_at)}</p>
                          <p className="text-xs text-gray-500">
                            {Math.floor((Date.now() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60))} hours ago
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {transaction.notes && (
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Buyer Notes</span>
                        </div>
                        <p className="text-blue-800 text-sm">{transaction.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Transaction ID: {transaction.id.slice(0, 8)}...</span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(transaction.id, 'Not available at this time')}
                      disabled={processingIds.has(transaction.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {processingIds.has(transaction.id) ? 'Rejecting...' : 'Reject'}
                    </Button>
                    
                    <Button
                      onClick={() => handleApprove(transaction.id, 'Approved by seller')}
                      disabled={processingIds.has(transaction.id)}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processingIds.has(transaction.id) ? 'Approving...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}