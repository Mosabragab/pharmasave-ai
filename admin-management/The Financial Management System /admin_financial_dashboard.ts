'use client'

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Activity,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Target,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types for financial data
interface FinancialKPIs {
  current_month_revenue: number;
  subscription_revenue: number;
  transaction_fee_revenue: number;
  current_mrr: number;
  current_arr: number;
  revenue_growth_rate: number;
  cash_balance: number;
  burn_rate: number;
  cash_runway_months: number;
  total_verified_pharmacies: number;
  active_pharmacies: number;
  new_pharmacies_this_month: number;
  transactions_this_month: number;
  avg_transaction_value: number;
}

interface MonthlyRevenue {
  year: number;
  month: number;
  total_revenue: number;
  subscription_revenue: number;
  transaction_fee_revenue: number;
  withdrawal_fee_revenue: number;
  active_pharmacies: number;
  new_pharmacies: number;
  total_transactions: number;
  avg_transaction_value: number;
}

interface BusinessKPI {
  calculation_date: string;
  mrr: number;
  arr: number;
  revenue_growth_rate: number;
  arpp: number;
  new_pharmacy_acquisitions: number;
  churn_rate: number;
  customer_ltv: number;
  customer_cac: number;
  gross_margin: number;
  net_profit_margin: number;
  cash_balance: number;
  burn_rate: number;
  cash_runway_months: number;
  transaction_volume: number;
  avg_transaction_value: number;
  pharmacy_utilization_rate: number;
  support_cost_per_pharmacy: number;
}

const SuperAdminFinancialDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [businessKpis, setBusinessKpis] = useState<BusinessKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [error, setError] = useState<string | null>(null);

  // Fetch financial data
  useEffect(() => {
    fetchFinancialData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs
      const { data: kpiData, error: kpiError } = await supabase
        .from('financial_kpis')
        .select('*')
        .single();

      if (kpiError) throw kpiError;

      // Fetch monthly revenue data (last 12 months)
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_revenue')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);

      if (monthlyError) throw monthlyError;

      // Fetch latest business KPIs
      const { data: businessData, error: businessError } = await supabase
        .from('business_kpis')
        .select('*')
        .order('calculation_date', { ascending: false })
        .limit(1)
        .single();

      if (businessError) throw businessError;

      setKpis(kpiData);
      setMonthlyData(monthlyData || []);
      setBusinessKpis(businessData);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-EG').format(value);
  };

  // Calculate revenue growth for display
  const getRevenueGrowth = () => {
    if (!monthlyData || monthlyData.length < 2) return 0;
    const current = monthlyData[0]?.total_revenue || 0;
    const previous = monthlyData[1]?.total_revenue || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  const getPharmacyGrowth = () => {
    if (!monthlyData || monthlyData.length < 2) return 0;
    const current = monthlyData[0]?.active_pharmacies || 0;
    const previous = monthlyData[1]?.active_pharmacies || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  if (loading) {
    return (
      <Layout variant="dashboard" title="Financial Dashboard" description="Comprehensive financial analytics and business intelligence">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading financial data...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout variant="dashboard" title="Financial Dashboard" description="Comprehensive financial analytics and business intelligence">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="border-alert-orange">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-alert-orange" />
                  <div>
                    <CardTitle className="text-alert-orange">Error Loading Financial Data</CardTitle>
                    <CardDescription>{error}</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={fetchFinancialData} 
                  className="mt-4 bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="dashboard" title="Financial Dashboard" description="Comprehensive financial analytics and business intelligence">
      {/* Header Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pharmacy-green to-trust-blue">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Financial Dashboard
              </h1>
              <p className="text-white/80 text-lg">
                Real-time business intelligence and financial analytics
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Cards */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Monthly Revenue */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Monthly Revenue
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(kpis?.current_month_revenue || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      {getRevenueGrowth() >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${getRevenueGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(getRevenueGrowth())}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-pharmacy-green/10 rounded-full">
                    <DollarSign className="h-6 w-6 text-pharmacy-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MRR */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Monthly Recurring Revenue
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(kpis?.current_mrr || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">
                        ARR: {formatCurrency(kpis?.current_arr || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-trust-blue/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-trust-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Pharmacies */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Pharmacies
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(kpis?.active_pharmacies || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      {getPharmacyGrowth() >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${getPharmacyGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(getPharmacyGrowth())}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-alert-orange/10 rounded-full">
                    <Building className="h-6 w-6 text-alert-orange" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Balance */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Cash Balance
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(kpis?.cash_balance || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm font-medium text-gray-600">
                        {kpis?.cash_runway_months || 0} months runway
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <CardTitle className="text-lg font-semibold mb-4">Revenue Breakdown</CardTitle>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-pharmacy-green rounded-full"></div>
                      <span className="text-sm font-medium">Subscription Revenue</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(kpis?.subscription_revenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-trust-blue rounded-full"></div>
                      <span className="text-sm font-medium">Transaction Fees</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(kpis?.transaction_fee_revenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-alert-orange rounded-full"></div>
                      <span className="text-sm font-medium">Withdrawal Fees</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency((kpis?.current_month_revenue || 0) - (kpis?.subscription_revenue || 0) - (kpis?.transaction_fee_revenue || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CardTitle className="text-lg font-semibold mb-4">Business Metrics</CardTitle>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">New Pharmacies This Month</span>
                    <span className="text-sm font-semibold">{formatNumber(kpis?.new_pharmacies_this_month || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</span>
                    <span className="text-sm font-semibold">{formatNumber(kpis?.transactions_this_month || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Transaction Value</span>
                    <span className="text-sm font-semibold">{formatCurrency(kpis?.avg_transaction_value || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue Growth Rate</span>
                    <span className={`text-sm font-semibold ${(kpis?.revenue_growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(kpis?.revenue_growth_rate || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced KPIs */}
          {businessKpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <CardTitle className="text-lg font-semibold mb-4">Profitability</CardTitle>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gross Margin</span>
                      <span className="text-sm font-semibold">{formatPercentage(businessKpis.gross_margin)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Net Profit Margin</span>
                      <span className="text-sm font-semibold">{formatPercentage(businessKpis.net_profit_margin)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Burn Rate</span>
                      <span className="text-sm font-semibold">{formatCurrency(businessKpis.burn_rate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CardTitle className="text-lg font-semibold mb-4">Customer Metrics</CardTitle>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Customer LTV</span>
                      <span className="text-sm font-semibold">{formatCurrency(businessKpis.customer_ltv)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Customer CAC</span>
                      <span className="text-sm font-semibold">{formatCurrency(businessKpis.customer_cac)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Churn Rate</span>
                      <span className="text-sm font-semibold">{formatPercentage(businessKpis.churn_rate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CardTitle className="text-lg font-semibold mb-4">Operational Efficiency</CardTitle>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pharmacy Utilization</span>
                      <span className="text-sm font-semibold">{formatPercentage(businessKpis.pharmacy_utilization_rate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Support Cost/Pharmacy</span>
                      <span className="text-sm font-semibold">{formatCurrency(businessKpis.support_cost_per_pharmacy)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">ARPP</span>
                      <span className="text-sm font-semibold">{formatCurrency(businessKpis.arpp)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Items */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg font-semibold mb-4">Financial Health Status</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Revenue Growing</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Month-over-month growth positive</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Cash Runway Healthy</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{kpis?.cash_runway_months || 0} months remaining</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-pharmacy-green/10 rounded-lg">
                  <Target className="h-5 w-5 text-pharmacy-green" />
                  <div>
                    <p className="text-sm font-medium text-pharmacy-green">On Target</p>
                    <p className="text-xs text-pharmacy-green/80">Meeting growth projections</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default SuperAdminFinancialDashboard;