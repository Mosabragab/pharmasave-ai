'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  CreditCard,
  Shield,
  TrendingUp,
  Filter,
  Search,
  Download,
  Eye,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface WithdrawalRequest {
  id: string;
  request_number: string;
  pharmacy_name: string;
  pharmacy_display_id: string;
  pharmacist_name: string;
  amount: number;
  currency: string;
  payment_method_type: string;
  payment_method_name: string;
  status: string;
  created_at: string;
  due_date?: string;
  risk_score: number;
  fraud_flags: string[];
  assigned_admin?: string;
  wallet_balance: number;
  platform_fee: number;
  processing_fee: number;
  net_amount: number;
  is_overdue: boolean;
  days_pending: number;
}

interface PaymentMethodDetails {
  method_type: string;
  method_name: string;
  instapay_identifier?: string;
  instapay_name?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  iban?: string;
  is_verified: boolean;
  successful_transactions: number;
}

interface WithdrawalStats {
  pending_requests: number;
  pending_amount: number;
  daily_processed: number;
  daily_amount: number;
  high_risk_requests: number;
  overdue_requests: number;
  average_processing_time: number;
  approval_rate: number;
}

const AdminWithdrawalDashboard: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentMethodDetails | null>(null);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterRisk, setFilterRisk] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [showRiskDetails, setShowRiskDetails] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchWithdrawalData();
  }, [filterStatus, filterRisk]);

  const fetchWithdrawalData = async () => {
    try {
      setLoading(true);
      
      // Build query filters
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          id,
          request_number,
          amount,
          currency,
          status,
          created_at,
          risk_score,
          platform_fee,
          processing_fee,
          net_amount,
          wallet_balance_before,
          assigned_to,
          pharmacies (name, display_id),
          pharmacists (fname, lname),
          pharmacy_payment_methods (method_type, method_name, instapay_identifier, bank_name, is_verified, successful_transactions),
          admin_users (name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: requestsData, error: requestsError } = await query;
      if (requestsError) throw requestsError;

      // Transform data
      const transformedRequests: WithdrawalRequest[] = requestsData?.map(request => ({
        id: request.id,
        request_number: request.request_number,
        pharmacy_name: request.pharmacies?.name || 'Unknown Pharmacy',
        pharmacy_display_id: request.pharmacies?.display_id || 'N/A',
        pharmacist_name: `${request.pharmacists?.fname || ''} ${request.pharmacists?.lname || ''}`.trim(),
        amount: request.amount,
        currency: request.currency,
        payment_method_type: request.pharmacy_payment_methods?.method_type || 'unknown',
        payment_method_name: request.pharmacy_payment_methods?.method_name || 'N/A',
        status: request.status,
        created_at: request.created_at,
        risk_score: request.risk_score || 0,
        fraud_flags: [], // Would populate from fraud checks
        assigned_admin: request.admin_users?.name,
        wallet_balance: request.wallet_balance_before,
        platform_fee: request.platform_fee || 0,
        processing_fee: request.processing_fee || 0,
        net_amount: request.net_amount || request.amount,
        is_overdue: Math.floor((new Date().getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 1,
        days_pending: Math.floor((new Date().getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24))
      })) || [];

      // Apply risk filter
      const filteredRequests = filterRisk === 'all' 
        ? transformedRequests
        : filterRisk === 'high'
        ? transformedRequests.filter(r => r.risk_score >= 50)
        : transformedRequests.filter(r => r.risk_score < 50);

      setRequests(filteredRequests);

      // Calculate stats
      const statsData: WithdrawalStats = {
        pending_requests: transformedRequests.filter(r => r.status === 'pending').length,
        pending_amount: transformedRequests
          .filter(r => r.status === 'pending')
          .reduce((sum, r) => sum + r.amount, 0),
        daily_processed: 0, // Would calculate from today's completed requests
        daily_amount: 0, // Would calculate from today's completed amount
        high_risk_requests: transformedRequests.filter(r => r.risk_score >= 50).length,
        overdue_requests: transformedRequests.filter(r => r.is_overdue).length,
        average_processing_time: 4.5, // Hours - would calculate from historical data
        approval_rate: 85.2 // Percentage - would calculate from historical data
      };

      setStats(statsData);

    } catch (error) {
      console.error('Error fetching withdrawal data:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          pharmacy_payment_methods (
            method_type,
            method_name,
            instapay_identifier,
            instapay_name,
            bank_name,
            account_holder_name,
            account_number,
            iban,
            is_verified,
            successful_transactions
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setPaymentDetails(data.pharmacy_payment_methods);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const handleRequestSelect = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    fetchPaymentDetails(request.id);
    setAdminNotes('');
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest || processing) return;

    setProcessing(true);
    try {
      // Call the process_withdrawal_decision function
      const { data, error } = await supabase.rpc('process_withdrawal_decision', {
        p_withdrawal_id: selectedRequest.id,
        p_admin_id: 'current_admin_id', // Replace with actual admin ID
        p_decision: 'approve',
        p_admin_notes: adminNotes || 'Approved by admin'
      });

      if (error) throw error;

      toast.success('Withdrawal request approved successfully');
      await fetchWithdrawalData();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !adminNotes.trim() || processing) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('process_withdrawal_decision', {
        p_withdrawal_id: selectedRequest.id,
        p_admin_id: 'current_admin_id', // Replace with actual admin ID
        p_decision: 'reject',
        p_admin_notes: adminNotes
      });

      if (error) throw error;

      toast.success('Withdrawal request rejected');
      await fetchWithdrawalData();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'under_review': return 'orange';
      case 'approved': return 'green';
      case 'processing': return 'blue';
      case 'completed': return 'green';
      case 'rejected': return 'red';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      default: return 'secondary';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 50) return 'orange';
    if (score >= 30) return 'yellow';
    return 'green';
  };

  const formatAmount = (amount: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredRequests = requests.filter(request => 
    request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.pharmacy_display_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Withdrawal Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Process pharmacy wallet withdrawal requests and manage financial operations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending_requests}</p>
                  <p className="text-sm text-gray-500">{formatAmount(stats.pending_amount)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                  <p className="text-2xl font-bold text-red-600">{stats.high_risk_requests}</p>
                  <p className="text-sm text-gray-500">Requires review</p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily Processed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.daily_processed}</p>
                  <p className="text-sm text-gray-500">{formatAmount(stats.daily_amount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approval Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.approval_rate}%</p>
                  <p className="text-sm text-gray-500">Avg: {stats.average_processing_time}h</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Request List */}
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk (50+)</option>
                    <option value="low">Low Risk (<50)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request List */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleRequestSelect(request)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedRequest?.id === request.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{request.request_number}</span>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getRiskColor(request.risk_score)}>
                          Risk: {request.risk_score}
                        </Badge>
                        {request.is_overdue && (
                          <Badge variant="destructive">OVERDUE</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg text-green-600">
                        {formatAmount(request.amount)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Net: {formatAmount(request.net_amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{request.pharmacy_name} • {request.pharmacy_display_id}</span>
                      <span>{request.days_pending} day{request.days_pending !== 1 ? 's' : ''} ago</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Method: {request.payment_method_type.replace('_', ' ')}</span>
                        <span>Balance: {formatAmount(request.wallet_balance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Request Details */}
        <div className="space-y-4">
          {selectedRequest ? (
            <>
              {/* Request Header */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Withdrawal Request
                        <Badge variant={getStatusColor(selectedRequest.status)}>
                          {selectedRequest.status.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedRequest.request_number} • {selectedRequest.pharmacy_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatAmount(selectedRequest.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Net: {formatAmount(selectedRequest.net_amount)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                    <Badge variant={getRiskColor(selectedRequest.risk_score)}>
                      Score: {selectedRequest.risk_score}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className={`font-semibold ${
                        selectedRequest.risk_score >= 70 ? 'text-red-600' :
                        selectedRequest.risk_score >= 50 ? 'text-orange-600' :
                        selectedRequest.risk_score >= 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedRequest.risk_score >= 70 ? 'HIGH' :
                         selectedRequest.risk_score >= 50 ? 'MEDIUM' :
                         selectedRequest.risk_score >= 30 ? 'LOW' : 'VERY LOW'}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          selectedRequest.risk_score >= 70 ? 'bg-red-600' :
                          selectedRequest.risk_score >= 50 ? 'bg-orange-600' :
                          selectedRequest.risk_score >= 30 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${selectedRequest.risk_score}%` }}
                      ></div>
                    </div>

                    {selectedRequest.fraud_flags && selectedRequest.fraud_flags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Fraud Flags:</p>
                        <div className="space-y-1">
                          {selectedRequest.fraud_flags.map((flag, index) => (
                            <Badge key={index} variant="destructive">
                              {flag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Details */}
              {paymentDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Type:</span>
                        <span>{paymentDetails.method_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{paymentDetails.method_name}</span>
                      </div>
                      
                      {paymentDetails.instapay_identifier && (
                        <div className="flex justify-between">
                          <span className="font-medium">InstaPay ID:</span>
                          <span>{paymentDetails.instapay_identifier}</span>
                        </div>
                      )}
                      
                      {paymentDetails.bank_name && (
                        <div className="flex justify-between">
                          <span className="font-medium">Bank:</span>
                          <span>{paymentDetails.bank_name}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Verified:</span>
                        <Badge variant={paymentDetails.is_verified ? 'green' : 'red'}>
                          {paymentDetails.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Success History:</span>
                        <span>{paymentDetails.successful_transactions} transactions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Requested Amount:</span>
                      <span className="font-bold">{formatAmount(selectedRequest.amount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Platform Fee:</span>
                      <span>-{formatAmount(selectedRequest.platform_fee)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Processing Fee:</span>
                      <span>-{formatAmount(selectedRequest.processing_fee)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-green-600">
                      <span>Net Amount:</span>
                      <span>{formatAmount(selectedRequest.net_amount)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span>Wallet Balance:</span>
                      <span>{formatAmount(selectedRequest.wallet_balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance After:</span>
                      <span>{formatAmount(selectedRequest.wallet_balance - selectedRequest.amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Actions */}
              {selectedRequest.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Admin Decision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add notes for your decision (required for rejection)..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={handleApproveRequest}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Withdrawal
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={handleRejectRequest}
                          disabled={!adminNotes.trim() || processing}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Withdrawal
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Note: Approving will immediately deduct the amount from the pharmacy's wallet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a withdrawal request to view details and take action</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalDashboard;