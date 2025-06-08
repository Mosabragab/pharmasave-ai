'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Shield, 
  MessageSquare, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  CreditCard,
  FileText,
  BarChart3,
  Eye,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface DashboardStats {
  // Verification metrics
  pending_verifications: number
  verified_pharmacies: number
  rejected_pharmacies: number
  
  // Support metrics
  open_tickets: number
  resolved_tickets_today: number
  avg_response_time: number
  
  // Financial metrics
  monthly_revenue: number
  daily_transactions: number
  total_balance: number
  
  // Transaction metrics
  total_transactions: number
  monthly_transactions: number
  avg_transaction_value: number
  transaction_volume: number
  
  // Growth metrics
  new_pharmacies_this_month: number
  revenue_growth: number
  active_users: number
}

interface TimeFrame {
  label: string
  value: string
  days: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  status: string
  pharmacy_name?: string
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('30')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  
  const supabase = createClientComponentClient()

  // Time frame options
  const timeFrames: TimeFrame[] = [
    { label: 'Last 7 Days', value: '7', days: 7 },
    { label: 'Last 30 Days', value: '30', days: 30 },
    { label: 'Last 90 Days', value: '90', days: 90 },
    { label: 'Last 6 Months', value: '180', days: 180 },
    { label: 'Last Year', value: '365', days: 365 },
    { label: 'Custom Range', value: 'custom', days: 0 }
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [selectedTimeFrame, customDateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on selected timeframe
      const currentDate = new Date()
      let startDate: Date
      let endDate: Date = currentDate
      
      if (selectedTimeFrame === 'custom') {
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start)
          endDate = new Date(customDateRange.end)
        } else {
          // Default to last 30 days if custom range not set
          startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      } else {
        const days = parseInt(selectedTimeFrame)
        startDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000)
      }
      
      // Fetch verification stats
      const { data: pharmacyStats, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('ver_status, created_at')
      
      if (pharmacyError) throw pharmacyError

      // Fetch support stats
      const { data: supportStats, error: supportError } = await supabase
        .from('support_tickets')
        .select('status, created_at')
      
      if (supportError) throw supportError

      // Calculate stats using our date range
      const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
      
      const statsData: DashboardStats = {
        pending_verifications: pharmacyStats?.filter(p => p.ver_status === 'pending').length || 0,
        verified_pharmacies: pharmacyStats?.filter(p => p.ver_status === 'verified').length || 0,
        rejected_pharmacies: pharmacyStats?.filter(p => p.ver_status === 'rejected').length || 0,
        
        open_tickets: supportStats?.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length || 0,
        resolved_tickets_today: supportStats?.filter(t => 
          t.status === 'resolved' && 
          new Date(t.created_at) >= today
        ).length || 0,
        avg_response_time: 2.5, // Mock data - would calculate from actual response times
        
        monthly_revenue: 125000, // Mock data - would fetch from financial_transactions
        daily_transactions: 45, // Mock data - would fetch from txn table
        total_balance: 850000, // Mock data - would fetch from financial accounts
        
        // Transaction metrics - would fetch from txn table
        total_transactions: 8547, // Total all-time transactions
        monthly_transactions: 1247, // Transactions this month
        avg_transaction_value: 2850, // Average transaction value in EGP
        transaction_volume: 3550000, // Total volume this month in EGP
        
        new_pharmacies_this_month: pharmacyStats?.filter(p => 
          new Date(p.created_at) >= thisMonth
        ).length || 0,
        revenue_growth: 12.5, // Mock data - would calculate from previous month
        active_users: 1247 // Mock data - would calculate from active pharmacists
      }
      
      setStats(statsData)
      
      // Mock recent activity data
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'verification',
          description: 'New pharmacy verification request',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'pending',
          pharmacy_name: 'Cairo Medical Pharmacy'
        },
        {
          id: '2',
          type: 'support',
          description: 'Support ticket resolved',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'resolved',
          pharmacy_name: 'Alexandria Health Center'
        },
        {
          id: '3',
          type: 'financial',
          description: 'Withdrawal request approved',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'approved',
          pharmacy_name: 'Giza Pharmacy'
        }
      ]
      
      setRecentActivity(mockActivity)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeFrameChange = (value: string) => {
    setSelectedTimeFrame(value)
    if (value !== 'custom') {
      setCustomDateRange({ start: '', end: '' })
    }
  }

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }))
  }

  const getSelectedTimeFrameLabel = () => {
    if (selectedTimeFrame === 'custom') {
      if (customDateRange.start && customDateRange.end) {
        return `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`
      }
      return 'Select Date Range'
    }
    return timeFrames.find(tf => tf.value === selectedTimeFrame)?.label || 'Last 30 Days'
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'verification': return Shield
      case 'support': return MessageSquare
      case 'financial': return DollarSign
      default: return FileText
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" description="System overview and key metrics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Admin Dashboard" description="System overview and key metrics">
      <div className="space-y-6">
        {/* Time Frame Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-pharmacy-green" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Analytics Period</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Viewing data for: {getSelectedTimeFrameLabel()}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Quick Time Frame Buttons */}
                <div className="flex gap-2">
                  {timeFrames.filter(tf => tf.value !== 'custom').map((timeFrame) => (
                    <Button
                      key={timeFrame.value}
                      variant={selectedTimeFrame === timeFrame.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTimeFrameChange(timeFrame.value)}
                      className={selectedTimeFrame === timeFrame.value ? 'bg-pharmacy-green hover:bg-pharmacy-green/90' : ''}
                    >
                      {timeFrame.label.replace('Last ', '')}
                    </Button>
                  ))}
                </div>
                
                {/* Custom Date Range */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedTimeFrame === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTimeFrameChange('custom')}
                    className={selectedTimeFrame === 'custom' ? 'bg-pharmacy-green hover:bg-pharmacy-green/90' : ''}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Custom
                  </Button>
                  
                  {selectedTimeFrame === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-gray-500 dark:text-gray-400">to</span>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </>
                  )}
                </div>
                
                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Key Metrics */}
        {stats && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Verifications</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending_verifications}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.verified_pharmacies} verified this month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Support Tickets</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open_tickets}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.resolved_tickets_today} resolved today
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthly_revenue)}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <p className="text-sm text-green-600">+{stats.revenue_growth}%</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.total_transactions.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(stats.transaction_volume)} volume
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Business Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Pharmacies</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.verified_pharmacies}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      +{stats.new_pharmacies_this_month} new this month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Transactions</p>
                    <p className="text-2xl font-bold text-green-600">{stats.monthly_transactions.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.daily_transactions} today
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Transaction</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.avg_transaction_value)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Per marketplace order
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.active_users}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Daily active pharmacists
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/verification">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Review Pending Verifications
                </Button>
              </Link>
              
              <Link href="/admin/support">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Handle Support Tickets
                </Button>
              </Link>
              
              <Link href="/admin/financial">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Financial Management
                </Button>
              </Link>
              
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        {activity.pharmacy_name && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.pharmacy_name}
                          </p>
                        )}
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Server</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">245ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">34%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.active_users || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Daily Logins</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">342</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Registrations</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
