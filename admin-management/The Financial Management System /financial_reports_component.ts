'use client'

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Printer,
  Mail,
  Settings,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types for financial reports
interface IncomeStatementItem {
  category: string;
  amount: number;
  percentage: number;
}

interface CashFlowItem {
  category: string;
  amount: number;
}

interface ReportPeriod {
  label: string;
  start_date: string;
  end_date: string;
}

interface FinancialReportData {
  period: ReportPeriod;
  income_statement: IncomeStatementItem[];
  cash_flow: CashFlowItem[];
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_income: number;
    gross_margin: number;
    operating_margin: number;
  };
}

const FinancialReports: React.FC = () => {
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [reportType, setReportType] = useState('comprehensive');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['revenue', 'expenses']));
  const [error, setError] = useState<string | null>(null);

  const reportPeriods = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report' },
    { value: 'income_statement', label: 'Income Statement Only' },
    { value: 'cash_flow', label: 'Cash Flow Statement Only' },
    { value: 'summary', label: 'Executive Summary' }
  ];

  useEffect(() => {
    generateReport();
  }, [selectedPeriod, reportType]);

  const getPeriodDates = (period: string) => {
    const now = new Date();
    let start_date, end_date, label;

    switch (period) {
      case 'current_month':
        start_date = new Date(now.getFullYear(), now.getMonth(), 1);
        end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        label = 'Current Month';
        break;
      case 'last_month':
        start_date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end_date = new Date(now.getFullYear(), now.getMonth(), 0);
        label = 'Last Month';
        break;
      case 'current_quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start_date = new Date(now.getFullYear(), quarterStart, 1);
        end_date = new Date(now.getFullYear(), quarterStart + 3, 0);
        label = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
        break;
      case 'current_year':
        start_date = new Date(now.getFullYear(), 0, 1);
        end_date = new Date(now.getFullYear(), 11, 31);
        label = `Year ${now.getFullYear()}`;
        break;
      default:
        start_date = new Date(now.getFullYear(), now.getMonth(), 1);
        end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        label = 'Current Month';
    }

    return {
      label,
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date.toISOString().split('T')[0]
    };
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const period = getPeriodDates(selectedPeriod);

      // Generate income statement
      const { data: incomeData, error: incomeError } = await supabase
        .rpc('generate_income_statement', {
          p_start_date: period.start_date,
          p_end_date: period.end_date
        });

      if (incomeError) throw incomeError;

      // Generate cash flow statement
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .rpc('generate_cash_flow_statement', {
          p_start_date: period.start_date,
          p_end_date: period.end_date
        });

      if (cashFlowError) throw cashFlowError;

      // Calculate summary metrics
      const totalRevenue = incomeData?.find(item => item.category === 'TOTAL REVENUE')?.amount || 0;
      const totalExpenses = Math.abs(incomeData?.find(item => item.category === 'TOTAL EXPENSES')?.amount || 0);
      const netIncome = incomeData?.find(item => item.category === 'NET INCOME')?.amount || 0;

      const summary = {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_income: netIncome,
        gross_margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
        operating_margin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      };

      setReportData({
        period,
        income_statement: incomeData || [],
        cash_flow: cashFlowData || [],
        summary
      });

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate financial report. Please try again.');
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

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`);
    // This would integrate with a report generation service
  };

  const printReport = () => {
    window.print();
  };

  const scheduleReport = () => {
    // Implement scheduled report functionality
    console.log('Scheduling report');
  };

  if (loading) {
    return (
      <Layout variant="dashboard" title="Financial Reports" description="Generate comprehensive financial reports and statements">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="animate-spin h-8 w-8 text-pharmacy-green" />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Generating financial report...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="dashboard" title="Financial Reports" description="Generate comprehensive financial reports and statements">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pharmacy-green to-trust-blue">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Financial Reports
              </h1>
              <p className="text-white/80 text-lg">
                Professional financial statements and business reports
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                onClick={printReport}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={() => exportReport('pdf')}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                onClick={scheduleReport}
                className="bg-white text-pharmacy-green hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Report Controls */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Report Period
                    </label>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      {reportPeriods.map(period => (
                        <option key={period.value} value={period.value}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Report Type
                    </label>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      {reportTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={generateReport}
                  className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Report Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {error ? (
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-red-800">Error Generating Report</CardTitle>
                    <CardDescription className="text-red-600">{error}</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : reportData ? (
            <>
              {/* Report Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      PharmaSave AI Financial Report
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                      {reportData.period.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Period: {new Date(reportData.period.start_date).toLocaleDateString()} - {new Date(reportData.period.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Executive Summary */}
              <Card>
                <CardContent className="p-6">
                  <CardTitle className="text-lg font-semibold mb-6">Executive Summary</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="p-4 bg-pharmacy-green/10 rounded-lg mb-3">
                        <DollarSign className="h-8 w-8 text-pharmacy-green mx-auto" />
                      </div>
                      <CardDescription className="text-sm font-medium mb-1">Total Revenue</CardDescription>
                      <CardTitle className="text-xl font-bold text-pharmacy-green">
                        {formatCurrency(reportData.summary.total_revenue)}
                      </CardTitle>
                    </div>
                    <div className="text-center">
                      <div className="p-4 bg-red-100 rounded-lg mb-3">
                        <TrendingUp className="h-8 w-8 text-red-600 mx-auto" />
                      </div>
                      <CardDescription className="text-sm font-medium mb-1">Total Expenses</CardDescription>
                      <CardTitle className="text-xl font-bold text-red-600">
                        {formatCurrency(reportData.summary.total_expenses)}
                      </CardTitle>
                    </div>
                    <div className="text-center">
                      <div className={`p-4 rounded-lg mb-3 ${reportData.summary.net_income >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        {reportData.summary.net_income >= 0 ? (
                          <ArrowUpRight className="h-8 w-8 text-green-600 mx-auto" />
                        ) : (
                          <ArrowDownRight className="h-8 w-8 text-red-600 mx-auto" />
                        )}
                      </div>
                      <CardDescription className="text-sm font-medium mb-1">Net Income</CardDescription>
                      <CardTitle className={`text-xl font-bold ${reportData.summary.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.summary.net_income)}
                      </CardTitle>
                    </div>
                    <div className="text-center">
                      <div className="p-4 bg-trust-blue/10 rounded-lg mb-3">
                        <PieChart className="h-8 w-8 text-trust-blue mx-auto" />
                      </div>
                      <CardDescription className="text-sm font-medium mb-1">Gross Margin</CardDescription>
                      <CardTitle className="text-xl font-bold text-trust-blue">
                        {formatPercentage(reportData.summary.gross_margin)}
                      </CardTitle>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Income Statement */}
              {(reportType === 'comprehensive' || reportType === 'income_statement') && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <CardTitle className="text-lg font-semibold">Income Statement</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('income')}
                      >
                        {expandedSections.has('income') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedSections.has('income') && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Account</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">% of Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.income_statement.map((item, index) => (
                              <tr key={index} className={`border-b border-gray-100 dark:border-gray-800 ${
                                item.category.includes('TOTAL') ? 'font-bold bg-gray-50 dark:bg-gray-800' : ''
                              }`}>
                                <td className="py-3 px-4 text-gray-900 dark:text-white">
                                  {item.category.replace('REVENUE - ', '').replace('EXPENSE - ', '')}
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${
                                  item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                                  {formatPercentage(item.percentage)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cash Flow Statement */}
              {(reportType === 'comprehensive' || reportType === 'cash_flow') && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <CardTitle className="text-lg font-semibold">Cash Flow Statement</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('cashflow')}
                      >
                        {expandedSections.has('cashflow') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedSections.has('cashflow') && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Cash Flow Item</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.cash_flow.map((item, index) => (
                              <tr key={index} className={`border-b border-gray-100 dark:border-gray-800 ${
                                item.category.includes('Net') || item.category.includes('NET') ? 'font-bold bg-gray-50 dark:bg-gray-800' : ''
                              }`}>
                                <td className="py-3 px-4 text-gray-900 dark:text-white">
                                  {item.category}
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${
                                  item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(item.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Report Footer */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                    <p className="mt-2">PharmaSave AI Financial Management System</p>
                    <p>© 2025 PharmaSave AI. All rights reserved.</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="text-gray-600 dark:text-gray-400 mb-2">No Report Generated</CardTitle>
                  <CardDescription>Select a period and report type, then click "Generate Report" to create your financial report.</CardDescription>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FinancialReports;