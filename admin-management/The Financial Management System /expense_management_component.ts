'use client'

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  Building,
  Users,
  Zap,
  TrendingUp,
  FileText,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types for expense data
interface ExpenseEntry {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  vendor_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by?: string;
  approved_at?: string;
  receipt_urls: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseStats {
  total_this_month: number;
  total_last_month: number;
  pending_approval: number;
  approved_unpaid: number;
  by_category: {
    [key: string]: number;
  };
}

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseEntry | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Form state for new expense
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'operations',
    amount: '',
    description: '',
    vendor_name: '',
    receipt_files: [] as File[]
  });

  const expenseCategories = [
    { value: 'infrastructure', label: 'Infrastructure', icon: Zap, color: 'text-blue-600' },
    { value: 'personnel', label: 'Personnel', icon: Users, color: 'text-green-600' },
    { value: 'marketing', label: 'Marketing', icon: TrendingUp, color: 'text-purple-600' },
    { value: 'operations', label: 'Operations', icon: Building, color: 'text-orange-600' },
    { value: 'legal', label: 'Legal', icon: FileText, color: 'text-red-600' },
    { value: 'finance', label: 'Finance', icon: DollarSign, color: 'text-yellow-600' },
    { value: 'research_development', label: 'R&D', icon: Zap, color: 'text-indigo-600' },
    { value: 'customer_support', label: 'Support', icon: Users, color: 'text-pink-600' },
    { value: 'other', label: 'Other', icon: FileText, color: 'text-gray-600' }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    paid: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  useEffect(() => {
    fetchExpenses();
    fetchExpenseStats();
  }, [filterStatus, filterCategory, searchQuery]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('expense_entries')
        .select('*')
        .order('expense_date', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      if (searchQuery) {
        query = query.or(`description.ilike.%${searchQuery}%,vendor_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseStats = async () => {
    try {
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Current month expenses
      const { data: currentMonthData } = await supabase
        .from('expense_entries')
        .select('amount')
        .gte('expense_date', currentMonthStart.toISOString().split('T')[0])
        .eq('status', 'approved');

      // Last month expenses
      const { data: lastMonthData } = await supabase
        .from('expense_entries')
        .select('amount')
        .gte('expense_date', lastMonth.toISOString().split('T')[0])
        .lt('expense_date', currentMonthStart.toISOString().split('T')[0])
        .eq('status', 'approved');

      // Pending approval
      const { data: pendingData } = await supabase
        .from('expense_entries')
        .select('amount')
        .eq('status', 'pending');

      // Approved but unpaid
      const { data: unpaidData } = await supabase
        .from('expense_entries')
        .select('amount')
        .eq('status', 'approved');

      // By category
      const { data: categoryData } = await supabase
        .from('expense_entries')
        .select('category, amount')
        .eq('status', 'approved')
        .gte('expense_date', currentMonthStart.toISOString().split('T')[0]);

      const categoryTotals: { [key: string]: number } = {};
      categoryData?.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
      });

      setStats({
        total_this_month: currentMonthData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        total_last_month: lastMonthData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        pending_approval: pendingData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        approved_unpaid: unpaidData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        by_category: categoryTotals
      });
    } catch (err) {
      console.error('Error fetching expense stats:', err);
    }
  };

  const handleAddExpense = async () => {
    try {
      if (!newExpense.amount || !newExpense.description) {
        alert('Please fill in all required fields');
        return;
      }

      // Upload receipt files if any
      const receiptUrls: string[] = [];
      for (const file of newExpense.receipt_files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        receiptUrls.push(uploadData.path);
      }

      const { error } = await supabase
        .from('expense_entries')
        .insert({
          expense_date: newExpense.expense_date,
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          vendor_name: newExpense.vendor_name || null,
          receipt_urls: receiptUrls,
          created_by: 'current-admin-id' // Replace with actual admin ID
        });

      if (error) throw error;

      // Reset form
      setNewExpense({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'operations',
        amount: '',
        description: '',
        vendor_name: '',
        receipt_files: []
      });
      setShowAddExpense(false);
      fetchExpenses();
      fetchExpenseStats();
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense');
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expense_entries')
        .update({
          status: 'approved',
          approved_by: 'current-admin-id', // Replace with actual admin ID
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (error) throw error;
      fetchExpenses();
      fetchExpenseStats();
    } catch (err) {
      console.error('Error approving expense:', err);
      alert('Failed to approve expense');
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expense_entries')
        .update({
          status: 'rejected',
          approved_by: 'current-admin-id', // Replace with actual admin ID
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (error) throw error;
      fetchExpenses();
      fetchExpenseStats();
    } catch (err) {
      console.error('Error rejecting expense:', err);
      alert('Failed to reject expense');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryInfo = (category: string) => {
    return expenseCategories.find(cat => cat.value === category) || expenseCategories[0];
  };

  const getGrowthPercentage = () => {
    if (!stats || stats.total_last_month === 0) return 0;
    return ((stats.total_this_month - stats.total_last_month) / stats.total_last_month) * 100;
  };

  return (
    <Layout variant="dashboard" title="Expense Management" description="Manage and track business expenses">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pharmacy-green to-trust-blue">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Expense Management
              </h1>
              <p className="text-white/80 text-lg">
                Track and manage all business expenses
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                onClick={() => setShowAddExpense(true)}
                className="bg-white text-pharmacy-green hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      This Month
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.total_this_month || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${getGrowthPercentage() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {getGrowthPercentage() >= 0 ? '+' : ''}{getGrowthPercentage().toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-pharmacy-green/10 rounded-full">
                    <DollarSign className="h-6 w-6 text-pharmacy-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Approval
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.pending_approval || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-yellow-600">
                        Awaiting review
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Approved Unpaid
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.approved_unpaid || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">
                        Ready to pay
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Last Month
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.total_last_month || 0)}
                    </CardTitle>
                    <div className="flex items-center mt-2">
                      <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm font-medium text-gray-600">
                        Previous period
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Calendar className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                  </select>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {expenseCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg font-semibold mb-4">Recent Expenses</CardTitle>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No expenses found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => {
                        const categoryInfo = getCategoryInfo(expense.category);
                        const CategoryIcon = categoryInfo.icon;
                        
                        return (
                          <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                              {formatDate(expense.expense_date)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {categoryInfo.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {expense.description}
                                </p>
                                {expense.vendor_name && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {expense.vendor_name}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[expense.status]}`}>
                                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setSelectedExpense(expense)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {expense.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleApproveExpense(expense.id)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleRejectExpense(expense.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Expense Modal */}
          {showAddExpense && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add New Expense</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.expense_date}
                        onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      >
                        {expenseCategories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount (EGP)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="Describe the expense..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vendor Name (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.vendor_name}
                        onChange={(e) => setNewExpense({...newExpense, vendor_name: e.target.value})}
                        placeholder="Vendor or supplier name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Receipt/Invoice (Optional)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        onChange={(e) => setNewExpense({...newExpense, receipt_files: Array.from(e.target.files || [])})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddExpense(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddExpense}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      Add Expense
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ExpenseManagement;