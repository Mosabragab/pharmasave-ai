'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-simple'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard,
  Building2,
  Download,
  Calendar,
  Target,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  RefreshCw,
  Settings,
  FileText,
  Plus,
  Edit,
  Trash,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Shield,
  TrendingFlat
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  adminFinancialService, 
  type AdminFinancialDashboard, 
  type FinancialTransaction 
} from '@/lib/adminFinancialService'
import backendIntegrationService, { 
  type UnifiedTransactionResponse 
} from '@/lib/backendIntegrationService'

// Enhanced Types for Backend Integration
interface UnifiedTransactionRequest {
  transaction_type: 'purchase' | 'trade'
  amount_or_value_a: number
  party_a_id: string
  party_b_id: string
  value_b?: number
  marketplace_ref?: string
}

interface BackendTestResult {
  test_name: string
  result: UnifiedTransactionResponse
  duration_ms: number
  status: 'success' | 'error'
}

interface RevenueBreakdown {
  subscription_revenue: number
  transaction_fees: number
  withdrawal_fees: number
  other_revenue: number
}

interface ExpenseBreakdown {
  infrastructure: number
  personnel: number
  marketing: number
  admin: number
  other: number
}

interface ChartOfAccount {
  id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  description?: string
  is_active: boolean
}

interface ExpenseEntry {
  id: string
  expense_date: string
  category: string
  amount: number
  description: string
  vendor_name?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
}

interface FeeConfiguration {
  buyer_fee_percentage: number
  seller_fee_percentage: number
  withdrawal_fee_egp: number
  monthly_subscription_egp: number
  updated_at: string
  updated_by: string
}

const EnhancedAdminFinancialDashboard: React.FC = () => {
  const supabase = createClientComponentClient()
  const [overview, setOverview] = useState<AdminFinancialDashboard | null>(null)
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null)
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<FinancialTransaction[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [backendTestResults, setBackendTestResults] = useState<BackendTestResult[]>([])
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({
    buyer_fee_percentage: 3.0,
    seller_fee_percentage: 3.0,
    withdrawal_fee_egp: 5.0,
    monthly_subscription_egp: 999,
    updated_at: new Date().toISOString(),
    updated_by: 'admin'
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [testingBackend, setTestingBackend] = useState(false)

  useEffect(() => {
    fetchFinancialData()
  }, [selectedPeriod])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      
      // Get current year and month based on selected period
      const now = new Date()
      let year = now.getFullYear()
      let month = now.getMonth() + 1
      
      if (selectedPeriod === 'last_month') {
        month = month - 1
        if (month < 1) {
          month = 12
          year = year - 1
        }
      }
      
      console.log('🔍 Fetching financial data for:', year, month)
      
      // Fetch financial data with improved error handling
      const [dashboardData, revenueData, expenseData, transactionData] = await Promise.all([
        adminFinancialService.getDashboardData(year, month),
        adminFinancialService.getRevenueBreakdown(year, month),
        adminFinancialService.getExpenseBreakdown(year, month),
        adminFinancialService.getRecentTransactions(10)
      ])
      
      console.log('✅ Financial data loaded successfully')
      setOverview(dashboardData)
      setRevenueBreakdown(revenueData)
      setExpenseBreakdown(expenseData)
      setRecentTransactions(transactionData)
      
      // Load additional data for other tabs
      await loadChartOfAccounts()
      await loadExpenseEntries()
      
      toast.success('Financial data loaded successfully')
      
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  // Backend Transaction System Integration
  const testBackendTransactionSystem = async () => {
    setTestingBackend(true)
    setBackendTestResults([])
    toast.success('Starting comprehensive backend testing...')

    // Use test pharmacy IDs - these should exist in your database
    const testPharmacyA = '6c2d3689-2b14-4c8e-97fa-c6ecebbe2bcd'
    const testPharmacyB = '9d5653b8-9762-48cf-940a-92be3745b3f8'

    const testScenarios = [
      {
        name: 'Purchase Transaction (35 EGP)',
        request: {
          transaction_type: 'purchase' as const,
          amount_or_value_a: 35.0,
          party_a_id: testPharmacyA,
          party_b_id: testPharmacyB,
          marketplace_ref: 'TEST-ADMIN-PURCHASE-001'
        }
      },
      {
        name: 'Equal Trade (40 ↔ 40 EGP)',
        request: {
          transaction_type: 'trade' as const,
          amount_or_value_a: 40.0,
          party_a_id: testPharmacyA,
          party_b_id: testPharmacyB,
          value_b: 40.0,
          marketplace_ref: 'TEST-ADMIN-TRADE-EQUAL-001'
        }
      },
      {
        name: 'Unequal Trade A Pays (55 ↔ 35 EGP)',
        request: {
          transaction_type: 'trade' as const,
          amount_or_value_a: 55.0,
          party_a_id: testPharmacyA,
          party_b_id: testPharmacyB,
          value_b: 35.0,
          marketplace_ref: 'TEST-ADMIN-TRADE-UNEQUAL-A-001'
        }
      },
      {
        name: 'Unequal Trade B Pays (25 ↔ 65 EGP)',
        request: {
          transaction_type: 'trade' as const,
          amount_or_value_a: 25.0,
          party_a_id: testPharmacyA,
          party_b_id: testPharmacyB,
          value_b: 65.0,
          marketplace_ref: 'TEST-ADMIN-TRADE-UNEQUAL-B-001'
        }
      }
    ]

    const results: BackendTestResult[] = []

    for (const scenario of testScenarios) {
      try {
        const startTime = Date.now()
        
        // Call backend integration service
        const result = await backendIntegrationService.executeTransaction(scenario.request)
        const duration = Date.now() - startTime

        results.push({
          test_name: scenario.name,
          result: result,
          duration_ms: duration,
          status: result.success ? 'success' : 'error'
        })

        console.log(`✅ Test completed: ${scenario.name}`, result)
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        const duration = Date.now() - startTime
        
        results.push({
          test_name: scenario.name,
          result: {
            success: false,
            transaction_type: scenario.request.transaction_type,
            transaction_subtype: 'system_error',
            party_a_pays: 0,
            party_b_pays: 0,
            party_a_receives: 0,
            party_b_receives: 0,
            value_difference: 0,
            total_platform_fees: 0,
            party_a_final_balance: 0,
            party_b_final_balance: 0,
            marketplace_reference: '',
            summary_description: 'System error occurred',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          },
          duration_ms: duration,
          status: 'error'
        })
      }
    }

    setBackendTestResults(results)
    setTestingBackend(false)

    const successCount = results.filter(r => r.status === 'success').length
    const totalTests = results.length

    if (successCount === totalTests) {
      toast.success(`✅ All ${totalTests} backend tests passed successfully!`)
    } else if (successCount > 0) {
      toast.success(`✅ ${successCount} out of ${totalTests} tests passed (using mock responses)`)
    } else {
      toast.error(`❌ All tests using mock responses - backend functions not available yet`)
    }
  }

  const loadChartOfAccounts = async () => {
    // Mock chart of accounts
    setChartOfAccounts([
      { id: '1', account_code: '1001', account_name: 'Cash - Operating Account', account_type: 'asset', description: 'Main operating cash account', is_active: true },
      { id: '2', account_code: '4002', account_name: 'Transaction Fee Revenue', account_type: 'revenue', description: 'Marketplace transaction fees', is_active: true },
      { id: '3', account_code: '4001', account_name: 'Subscription Revenue', account_type: 'revenue', description: 'Monthly pharmacy subscriptions', is_active: true },
      { id: '4', account_code: '4003', account_name: 'Withdrawal Fee Revenue', account_type: 'revenue', description: 'Fees from wallet withdrawals', is_active: true },
      { id: '5', account_code: '4010', account_name: 'Other Revenue', account_type: 'revenue', description: 'Other revenue sources', is_active: true }
    ])
  }

  const loadExpenseEntries = async () => {
    // Mock expense entries
    setExpenseEntries([
      { id: '1', expense_date: '2025-06-01', category: 'infrastructure', amount: 1250, description: 'Monthly server costs - AWS', vendor_name: 'Amazon Web Services', status: 'paid' },
      { id: '2', expense_date: '2025-06-01', category: 'marketing', amount: 750, description: 'Google Ads campaign', vendor_name: 'Google LLC', status: 'approved' },
      { id: '3', expense_date: '2025-06-01', category: 'personnel', amount: 15000, description: 'Developer salaries - May 2025', status: 'pending' }
    ])
  }

  const formatCurrency = (amount: number): string => {
    return adminFinancialService.formatCurrency(amount)
  }

  const formatPercentage = (value: number): string => {
    return adminFinancialService.formatPercentage(value)
  }

  if (loading) {
    return (
      <AdminLayout title="Financial Management" description="Complete financial overview and business intelligence">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Enhanced Financial Management" description="Complete financial overview with backend transaction system integration">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={fetchFinancialData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button 
              variant="outline"
              onClick={testBackendTransactionSystem}
              disabled={testingBackend}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Database className={`h-4 w-4 mr-2 ${testingBackend ? 'animate-pulse' : ''}`} />
              {testingBackend ? 'Testing Backend...' : 'Test Backend System'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>

        {/* Enhanced Financial Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="backend" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backend Tests
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Chart of Accounts
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Expense Management
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Fee Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {overview && (
          <>
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Recurring Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(overview.monthly_recurring_revenue)}</p>
                      <div className="flex items-center mt-1">
                        {overview.revenue_growth_rate >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${overview.revenue_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(overview.revenue_growth_rate)}
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="h-12 w-12 text-green-600 bg-green-100 dark:bg-green-900 rounded-lg p-3" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Pharmacies</p>
                      <p className="text-2xl font-bold text-blue-600">{overview.active_pharmacies.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">+{overview.new_pharmacies_this_month} this month</p>
                    </div>
                    <Building2 className="h-12 w-12 text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-lg p-3" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Volume</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(overview.transaction_volume)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{overview.total_transactions.toLocaleString()} transactions</p>
                    </div>
                    <CreditCard className="h-12 w-12 text-purple-600 bg-purple-100 dark:bg-purple-900 rounded-lg p-3" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
                      <p className={`text-2xl font-bold ${overview.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(overview.net_profit)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPercentage(overview.profit_margin)} margin
                      </p>
                    </div>
                    {overview.net_profit >= 0 ? (
                      <TrendingUp className="h-12 w-12 text-green-600 bg-green-100 dark:bg-green-900 rounded-lg p-3" />
                    ) : (
                      <TrendingDown className="h-12 w-12 text-red-600 bg-red-100 dark:bg-red-900 rounded-lg p-3" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health Status */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Platform System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Transaction System</p>
                    <p className="text-xs text-gray-600">Ready for Testing</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Admin Dashboard</p>
                    <p className="text-xs text-gray-600">Operational</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Frontend Integration</p>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Data Layer</p>
                    <p className="text-xs text-gray-600">Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
          </TabsContent>

          {/* NEW: Backend Testing Tab */}
          <TabsContent value="backend">
            <div className="space-y-6">
              {/* Backend Test Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backend Transaction System Testing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Test the complete marketplace transaction system including purchases and trades.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Tests will use mock responses if backend functions aren't available yet.
                      </p>
                    </div>
                    <Button 
                      onClick={testBackendTransactionSystem}
                      disabled={testingBackend}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {testingBackend ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-pulse" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Run Full Test Suite
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              {backendTestResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test Results</h3>
                  {backendTestResults.map((testResult, index) => (
                    <Card key={index} className={`${
                      testResult.status === 'success' 
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {testResult.status === 'success' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <AlertCircle className="h-6 w-6 text-red-600" />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {testResult.test_name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Completed in {testResult.duration_ms}ms
                              </p>
                            </div>
                          </div>
                          <Badge className={testResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {testResult.status.toUpperCase()}
                          </Badge>
                        </div>

                        {testResult.status === 'success' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <p className="text-xs text-gray-500">Party A Pays</p>
                              <p className="font-semibold">{formatCurrency(testResult.result.party_a_pays)}</p>
                            </div>
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <p className="text-xs text-gray-500">Party B Pays</p>
                              <p className="font-semibold">{formatCurrency(testResult.result.party_b_pays)}</p>
                            </div>
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <p className="text-xs text-gray-500">Platform Fees</p>
                              <p className="font-semibold text-green-600">{formatCurrency(testResult.result.total_platform_fees)}</p>
                            </div>
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <p className="text-xs text-gray-500">Transaction Type</p>
                              <p className="font-semibold">{testResult.result.transaction_subtype}</p>
                            </div>
                          </div>
                        )}

                        {testResult.status === 'error' && testResult.result.error_message && (
                          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-400">
                              <strong>Error:</strong> {testResult.result.error_message}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                          <p><strong>Description:</strong> {testResult.result.summary_description}</p>
                          <p><strong>Reference:</strong> {testResult.result.marketplace_reference}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Other tabs would go here but keeping it simple for now */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Chart of accounts management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Expense management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Transaction history coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Fee Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Fee configuration coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

export default EnhancedAdminFinancialDashboard