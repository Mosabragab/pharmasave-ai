'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { 
  CheckCircle, 
  X, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Building,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface FundRequest {
  id: string
  pharmacy_id: string
  amount: number
  request_type: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  created_at: string
  updated_at: string
  requested_by?: string
  approved_by?: string
  
  // Pharmacy details
  pharmacy_name: string
  pharmacy_display_id: string
  pharmacy_phone?: string
  pharmacy_email?: string
  pharmacy_verified: boolean
  
  // Pharmacist details
  pharmacist_name?: string
  pharmacist_email?: string
}

interface AdminFundManagementProps {
  adminId: string
}

export default function AdminFundManagement({ adminId }: AdminFundManagementProps) {
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalPending: 0,
    totalToday: 0,
    totalAmount: 0,
    approvalRate: 0
  })

  useEffect(() => {
    loadFundRequests()
    loadAnalytics()
  }, [filter])

  const loadFundRequests = async () => {
    try {
      setIsLoading(true)
      
      let query = supabase
        .from('fund_requests')
        .select(`
          id,
          pharmacy_id,
          amount,
          request_type,
          reason,
          status,
          admin_notes,
          created_at,
          updated_at,
          requested_by,
          approved_by,
          pharmacies!inner(
            id,
            name,
            display_id,
            phone,
            email,
            verified
          ),
          pharmacists(
            id,
            fname,
            lname,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading fund requests:', error)
        toast.error('Failed to load fund requests')
        return
      }

      // Transform data to match interface
      const transformedData: FundRequest[] = (data || []).map(req => ({
        id: req.id,
        pharmacy_id: req.pharmacy_id,
        amount: parseFloat(req.amount || '0'),
        request_type: req.request_type,
        reason: req.reason,
        status: req.status,
        admin_notes: req.admin_notes,
        created_at: req.created_at,
        updated_at: req.updated_at,
        requested_by: req.requested_by,
        approved_by: req.approved_by,
        
        pharmacy_name: req.pharmacies?.name || 'Unknown Pharmacy',
        pharmacy_display_id: req.pharmacies?.display_id || 'N/A',
        pharmacy_phone: req.pharmacies?.phone,
        pharmacy_email: req.pharmacies?.email,
        pharmacy_verified: req.pharmacies?.verified || false,
        
        pharmacist_name: req.pharmacists ? `${req.pharmacists.fname} ${req.pharmacists.lname}` : 'Unknown',
        pharmacist_email: req.pharmacists?.email
      }))

      // Filter by search term
      const filteredData = searchTerm 
        ? transformedData.filter(req => 
            req.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.pharmacy_display_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.pharmacist_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : transformedData

      setFundRequests(filteredData)
    } catch (error) {
      console.error('Error loading fund requests:', error)
      toast.error('Failed to load fund requests')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      // Get analytics data
      const today = new Date().toISOString().split('T')[0]
      
      const { data: allRequests } = await supabase
        .from('fund_requests')
        .select('status, amount, created_at')
      
      if (allRequests) {
        const pending = allRequests.filter(r => r.status === 'pending').length
        const todayRequests = allRequests.filter(r => r.created_at.startsWith(today)).length
        const totalAmount = allRequests.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0)
        const approved = allRequests.filter(r => r.status === 'approved').length
        const total = allRequests.length
        const approvalRate = total > 0 ? (approved / total) * 100 : 0
        
        setAnalytics({
          totalPending: pending,
          totalToday: todayRequests,
          totalAmount: totalAmount,
          approvalRate: approvalRate
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject', notes: string) => {
    try {
      setIsProcessing(requestId)
      
      const functionName = action === 'approve' 
        ? 'process_fund_request_approval_with_notification'
        : 'process_fund_request_rejection_with_notification'
      
      const { data, error } = await supabase.rpc(functionName, {
        p_fund_request_id: requestId,
        p_admin_notes: notes,
        p_admin_id: adminId
      })

      if (error) {
        console.error(`Error ${action}ing request:`, error)
        toast.error(`Failed to ${action} request`)
        return
      }

      const result = data?.[0]
      if (result?.success) {
        toast.success(result.message)
        
        // Update local state
        setFundRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: action === 'approve' ? 'approved' : 'rejected', admin_notes: notes }
              : req
          )
        )
        
        // Reload analytics
        loadAnalytics()
        
        // Close modal
        setShowModal(false)
        setSelectedRequest(null)
        setAdminNotes('')
        setAction(null)
      } else {
        toast.error(result?.message || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast.error(`Failed to ${action} request`)
    } finally {
      setIsProcessing(null)
    }
  }

  const openModal = (request: FundRequest, requestAction: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setAction(requestAction)
    setAdminNotes('')
    setShowModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <X className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fund Request Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and process pharmacy fund requests
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button
            variant="outline"
            onClick={loadFundRequests}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600">{analytics.totalPending}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Requests</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalToday}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-pharmacy-green">{formatCurrency(analytics.totalAmount)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-pharmacy-green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</p>
                <p className="text-3xl font-bold text-green-600">{analytics.approvalRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by pharmacy or pharmacist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status as any)}
                  className={filter === status ? 'bg-pharmacy-green hover:bg-pharmacy-green/90' : ''}
                >
                  <span className="capitalize">{status}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fund Requests List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-xl font-semibold">Fund Requests</CardTitle>
            <Badge variant="outline" className="text-sm">
              {fundRequests.length} requests
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-green" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading fund requests...</span>
            </div>
          ) : fundRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No fund requests found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'pending' 
                  ? 'No pending fund requests at the moment.'
                  : `No ${filter} fund requests found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fundRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 dark:border-slate-600 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Building className="w-5 h-5 text-pharmacy-green" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.pharmacy_name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {request.pharmacy_display_id}
                        </Badge>
                        {request.pharmacy_verified && (
                          <CheckCircle className="w-4 h-4 text-green-500" title="Verified Pharmacy" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-2xl font-bold text-pharmacy-green">
                            {formatCurrency(request.amount)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {request.pharmacist_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Request Type:</strong> {request.request_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      </div>

                      {request.admin_notes && (
                        <div className="mb-4 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.admin_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => openModal(request, 'approve')}
                              disabled={isProcessing === request.id}
                            >
                              {isProcessing === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              <span className="ml-1">Approve</span>
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => openModal(request, 'reject')}
                              disabled={isProcessing === request.id}
                            >
                              <X className="w-4 h-4" />
                              <span className="ml-1">Reject</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      {showModal && selectedRequest && action && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {action === 'approve' ? 'Approve Fund Request' : 'Reject Fund Request'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedRequest.pharmacy_name}
                  </h3>
                  <p className="text-2xl font-bold text-pharmacy-green mb-2">
                    {formatCurrency(selectedRequest.amount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedRequest.reason}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Notes {action === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      action === 'approve' 
                        ? 'Optional: Add approval notes...'
                        : 'Required: Explain reason for rejection...'
                    }
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => handleProcessRequest(selectedRequest.id, action, adminNotes)}
                    disabled={
                      isProcessing === selectedRequest.id || 
                      (action === 'reject' && !adminNotes.trim())
                    }
                    className={
                      action === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 text-white flex-1'
                        : 'bg-red-600 hover:bg-red-700 text-white flex-1'
                    }
                  >
                    {isProcessing === selectedRequest.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : action === 'approve' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    {action === 'approve' ? 'Approve Request' : 'Reject Request'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={isProcessing === selectedRequest.id}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
