'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard,
  PieChart,
  BarChart3,
  Calculator,
  FileText,
  Download,
  Calendar,
  Target,
  Building,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface FinancialOverview {
  // Revenue Metrics
  monthly_recurring_revenue: number;
  mrr_growth_rate: number;
  transaction_fee_revenue: number;
  withdrawal_fee_revenue: number;
  total_revenue: number;
  revenue_growth_rate: number;
  
  // Business Metrics
  total_pharmacies: number;
  active_pharmacies: number;
  new_pharmacies_this_month: number;
  churn_rate: number;
  
  // Transaction Metrics
  total_transactions: number;
  transaction_volume: number;
  avg_transaction_value: number;
  transactions_growth_rate: number;
  
  // Financial Health
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  cash_balance: number;
  burn_rate: number;
  runway_months: number;
}

interface RevenueBreakdown {
  subscription_revenue: number;
  transaction_fees: number;
  withdrawal_fees: number;
  other_revenue: number;
}

interface ExpenseBreakdown {
  infrastructure: number;
  personnel: number;
  marketing: number;
  admin: number;
  other: number;
}

interface BusinessMetric {
  name: string;
  current_value: number;
  previous_value: number;
  growth_rate: number;
  target_value?: number;
  units: string;
}

interface FinancialTransaction {
  id: string;
  transaction_number: string;
  transaction_type: string;
  amount: number;
  description: string;
  transaction_date: string;
  account_name: string;
  status: string;
}

const SuperAdminFinancialDashboard: React.FC = () => {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    type: 'operational',
    amount: '',
    description: '',
    category: 'infrastructure_cost'
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      switch (selectedPeriod) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'current_quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Fetch business metrics using the stored function
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_business_metrics', {
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0]
        });

      if (metricsError) throw metricsError;

      // Transform metrics data
      const transformedMetrics: BusinessMetric[] = metricsData?.map((metric: any) => ({
        name: metric.metric_name,
        current_value: metric.metric_value,
        previous_value: metric.comparison_period_value || 0,
        growth_rate: metric.growth_rate || 0,
        units: metric.metric_units
      })) || [];

      setBusinessMetrics(transformedMetrics);

      // Extract key metrics for overview
      const overviewData: FinancialOverview = {
        monthly_recurring_revenue: getMetricValue(transformedMetrics, 'Monthly Recurring Revenue'),
        mrr_growth_rate: getMetricGrowthRate(transformedMetrics, 'Monthly Recurring Revenue'),
        transaction_fee_revenue: getMetricValue(transformedMetrics, 'Transaction Fee Revenue') || 0,
        withdrawal_fee_revenue: getMetricValue(transformedMetrics, 'Withdrawal Fee Revenue') || 0,
        total_revenue: getMetricValue(transformedMetrics, 'Total Revenue'),
        revenue_growth_rate: getMetricGrowthRate(transformedMetrics, 'Total Revenue'),
        
        total_pharmacies: getMetricValue(transformedMetrics, 'Total Pharmacies'),
        active_pharmacies: getMetricValue(transformedMetrics, 'Active Pharmacies'),
        new_pharmacies_this_month: getMetricValue(transformedMetrics, 'New Pharmacies'),
        churn_rate: 0, // Would calculate from subscription data
        
        total_transactions: getMetricValue(transformedMetrics, 'Transaction Count'),
        transaction_volume: getMetricValue(transformedMetrics, 'Transaction Volume'),
        avg_transaction_value: getMetricValue(transformedMetrics, 'Average Transaction Value'),
        transactions_growth_rate: 0, // Would calculate from period comparison
        
        total_expenses: getMetricValue(transformedMetrics, 'Total Expenses'),
        net_profit: getMetricValue(transformedMetrics, 'Net Profit'),
        profit_margin: 0, // Would calculate from revenue and expenses
        cash_balance: 150000, // Would fetch from cash accounts
        burn_rate: 25000, // Would calculate from monthly expenses
        runway_months: 6 // Would calculate from cash balance and burn rate
      };

      // Calculate derived metrics
      if (overviewData.total_revenue > 0) {
        overviewData.profit_margin = (overviewData.net_profit / overviewData.total_revenue) * 100;
      }

      setOverview(overviewData);

      // Set revenue breakdown
      setRevenueBreakdown({
        subscription_revenue: overviewData.monthly_recurring_revenue,
        transaction_fees: overviewData.transaction_fee_revenue,
        withdrawal_fees: overviewData.withdrawal_fee_revenue,
        other_revenue: overviewData.total_revenue - overviewData.monthly_recurring_revenue - overviewData.transaction_fee_revenue - overviewData.withdrawal_fee_revenue
      });

      // Set expense breakdown (example data - would fetch from actual categories)
      setExpenseBreakdown({
        infrastructure: overviewData.total_expenses * 0.35,
        personnel: overviewData.total_expenses * 0.40,
        marketing: overviewData.total_expenses * 0.15,
        admin: overviewData.total_expenses * 0.07,
        other: overviewData.total_expenses * 0.03
      });

      // Fetch recent financial transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          id,
          transaction_number,
          transaction_type,
          amount,
          description,
          transaction_date,
          status,
          financial_accounts!debit_account_id (account_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      const transformedTransactions: FinancialTransaction[] = transactionsData?.map(tx => ({
        id: tx.id,
        transaction_number: tx.transaction_number,
        transaction_type: tx.transaction_type,
        amount: tx.amount,
        description: tx.description,
        transaction_date: tx.transaction_date,
        account_name: tx.financial_accounts?.account_name || 'Unknown',
        status: tx.status
      })) || [];

      setRecentTransactions(transformedTransactions);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (metrics: BusinessMetric[], name: string): number => {
    const metric = metrics.find(m => m.name === name);
    return metric ? metric.current_value : 0;
  };

  const getMetricGrowthRate = (metrics: BusinessMetric[], name: string): number => {
    const metric = metrics.find(m => m.name === name);
    return metric ? metric.growth_rate : 0;
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Add expense transaction
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          transaction_type: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          debit_account_id: 'expense_account_id', // Would get from account mapping
          credit_account_id: 'cash_account_id',   // Would get from account mapping
          expense_category: newExpense.type
        });

      if (error) throw error;

      toast.success('Expense added successfully');
      setShowExpenseModal(false);
      setNewExpense({ type: 'operational', amount: '', description: '', category: 'infrastructure_cost' });
      await fetchFinancialData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const generateFinancialReport = async (reportType: string) => {
    try {
      toast.success(`Generating ${reportType} report...`);
      // Would implement report generation logic here
    } catch (error) {
      toast.error(`Failed to generate ${reportType} report`);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

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
            Financial Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete financial overview and business intelligence
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
          >
            <option value="current_month">Current Month</option>
            <option value="last_month">Last Month</option>
            <option value="current_quarter">Current Quarter</option>
            <option value="current_year">Current Year</option>
          </select>
          <Button
            onClick={() => setShowExpenseModal(true)}
            variant="outline"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {overview && (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Recurring Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(overview.monthly_recurring_revenue)}</p>
                    <div className="flex items-center mt-1">
                      {overview.mrr_growth_rate >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${overview.mrr_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(overview.mrr_growth_rate)}
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Pharmacies</p>
                    <p className="text-2xl font-bold text-blue-600">{overview.active_pharmacies.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">+{overview.new_pharmacies_this_month} this month</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Volume</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(overview.transaction_volume)}</p>
                    <p className="text-sm text-gray-500">{overview.total_transactions.toLocaleString()} transactions</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Net Profit</p>
                    <p className={`text-2xl font-bold ${overview.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(overview.net_profit)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPercentage(overview.profit_margin)} margin
                    </p>
                  </div>
                  {overview.net_profit >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueBreakdown && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Subscription Revenue</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(revenueBreakdown.subscription_revenue)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(revenueBreakdown.subscription_revenue / overview.total_revenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Transaction Fees</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(revenueBreakdown.transaction_fees)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(revenueBreakdown.transaction_fees / overview.total_revenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Withdrawal Fees</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(revenueBreakdown.withdrawal_fees)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(revenueBreakdown.withdrawal_fees / overview.total_revenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total Revenue</span>
                        <span className="text-green-600">{formatCurrency(overview.total_revenue)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseBreakdown && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Personnel</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(expenseBreakdown.personnel)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${(expenseBreakdown.personnel / overview.total_expenses) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Infrastructure</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(expenseBreakdown.infrastructure)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${(expenseBreakdown.infrastructure / overview.total_expenses) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Marketing</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(expenseBreakdown.marketing)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${(expenseBreakdown.marketing / overview.total_expenses) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total Expenses</span>
                        <span className="text-red-600">{formatCurrency(overview.total_expenses)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Health Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cash Balance</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(overview.cash_balance)}</p>
                    <p className="text-sm text-gray-500">{overview.runway_months} months runway</p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Burn Rate</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(overview.burn_rate)}</p>
                    <p className="text-sm text-gray-500">Operating expenses</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Transaction Value</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(overview.avg_transaction_value)}</p>
                    <p className="text-sm text-gray-500">Per marketplace transaction</p>
                  </div>
                  <Calculator className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Financial Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.transaction_type.replace('_', ' ')} • {transaction.transaction_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.transaction_type.includes('revenue') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type.includes('revenue') ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant={transaction.status === 'posted' ? 'success' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports & Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => generateFinancialReport('income_statement')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Income Statement
                  </Button>
                  
                  <Button
                    onClick={() => generateFinancialReport('balance_sheet')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Balance Sheet
                  </Button>
                  
                  <Button
                    onClick={() => generateFinancialReport('cash_flow')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Cash Flow Statement
                  </Button>
                  
                  <Button
                    onClick={() => generateFinancialReport('tax_report')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Generate Tax Report
                  </Button>
                  
                  <Button
                    className="w-full justify-start bg-pharmacy-green hover:bg-pharmacy-green/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Financial Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expense Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
                  >
                    <option value="infrastructure_cost">Infrastructure</option>
                    <option value="admin_salary">Personnel</option>
                    <option value="marketing_expense">Marketing</option>
                    <option value="development_cost">Development</option>
                    <option value="legal_compliance">Legal & Compliance</option>
                    <option value="office_rent">Office & Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount (EGP)</label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Describe the expense..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddExpense}
                    className="flex-1 bg-pharmacy-green hover:bg-pharmacy-green/90"
                  >
                    Add Expense
                  </Button>
                  <Button
                    onClick={() => setShowExpenseModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperAdminFinancialDashboard;