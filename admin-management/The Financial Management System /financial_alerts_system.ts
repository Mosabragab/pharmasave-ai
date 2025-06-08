'use client'

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Bell,
  BellRing,
  Settings,
  X,
  Eye,
  Archive,
  RefreshCw,
  Filter,
  Calendar,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types for financial alerts
interface FinancialAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  title: string;
  message: string;
  action?: string;
  severity: number;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface AlertSummary {
  critical_count: number;
  warning_count: number;
  info_count: number;
  unread_count: number;
  last_check: string;
}

interface AlertSettings {
  cash_runway_threshold: number;
  churn_rate_threshold: number;
  revenue_decline_threshold: number;
  expense_budget_threshold: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  daily_summary: boolean;
}

const FinancialAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<FinancialAlert | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alertTypes = [
    { value: 'all', label: 'All Alerts', icon: Bell },
    { value: 'critical', label: 'Critical', icon: AlertTriangle },
    { value: 'warning', label: 'Warning', icon: AlertCircle },
    { value: 'info', label: 'Information', icon: Info },
    { value: 'success', label: 'Success', icon: CheckCircle }
  ];

  const alertCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'cash_flow', label: 'Cash Flow' },
    { value: 'revenue_growth', label: 'Revenue Growth' },
    { value: 'customer_retention', label: 'Customer Retention' },
    { value: 'profitability', label: 'Profitability' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'subscriptions', label: 'Subscriptions' },
    { value: 'system', label: 'System' }
  ];

  useEffect(() => {
    fetchAlerts();
    fetchAlertSummary();
    fetchAlertSettings();
    
    // Set up real-time updates
    const interval = setInterval(fetchAlerts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [filterType, filterCategory]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, we'll simulate financial alerts
      // In production, these would come from the financial health monitoring system
      const mockAlerts: FinancialAlert[] = [
        {
          id: '1',
          type: 'critical',
          category: 'cash_flow',
          title: 'Low Cash Runway',
          message: 'Cash runway has dropped to 4 months. Immediate attention required.',
          action: 'Review expenses and consider fundraising',
          severity: 1,
          is_read: false,
          is_dismissed: false,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            current_runway: 4,
            threshold: 6,
            cash_balance: 120000
          }
        },
        {
          id: '2',
          type: 'warning',
          category: 'customer_retention',
          title: 'Increased Churn Rate',
          message: 'Monthly churn rate has increased to 8.5%. Monitor customer satisfaction.',
          action: 'Conduct customer feedback surveys',
          severity: 2,
          is_read: false,
          is_dismissed: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: {
            current_churn: 8.5,
            threshold: 5.0,
            lost_customers: 12
          }
        },
        {
          id: '3',
          type: 'warning',
          category: 'revenue_growth',
          title: 'Revenue Growth Declining',
          message: 'Revenue growth rate has declined to 5% month-over-month.',
          action: 'Analyze customer acquisition and retention strategies',
          severity: 2,
          is_read: true,
          is_dismissed: false,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          metadata: {
            current_growth: 5.0,
            previous_growth: 15.0,
            revenue_change: -2500
          }
        },
        {
          id: '4',
          type: 'info',
          category: 'subscriptions',
          title: 'Subscription Renewals Due',
          message: '25 pharmacy subscriptions are due for renewal this week.',
          action: 'Send renewal reminders',
          severity: 3,
          is_read: true,
          is_dismissed: false,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metadata: {
            due_renewals: 25,
            renewal_value: 24975
          }
        },
        {
          id: '5',
          type: 'success',
          category: 'profitability',
          title: 'Gross Margin Improved',
          message: 'Gross margin has improved to 87%, exceeding the target of 85%.',
          severity: 4,
          is_read: true,
          is_dismissed: false,
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metadata: {
            current_margin: 87,
            target_margin: 85,
            improvement: 2
          }
        }
      ];

      // Apply filters
      let filteredAlerts = mockAlerts;
      
      if (filterType !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filterType);
      }
      
      if (filterCategory !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.category === filterCategory);
      }

      // Sort by severity and creation time
      filteredAlerts.sort((a, b) => {
        if (a.severity !== b.severity) {
          return a.severity - b.severity;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAlerts(filteredAlerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load financial alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertSummary = async () => {
    try {
      // Mock summary data
      setSummary({
        critical_count: 1,
        warning_count: 2,
        info_count: 1,
        unread_count: 2,
        last_check: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error fetching alert summary:', err);
    }
  };

  const fetchAlertSettings = async () => {
    try {
      // Mock settings data
      setSettings({
        cash_runway_threshold: 6,
        churn_rate_threshold: 5.0,
        revenue_decline_threshold: -10.0,
        expense_budget_threshold: 90.0,
        email_notifications: true,
        sms_notifications: false,
        daily_summary: true
      });
    } catch (err) {
      console.error('Error fetching alert settings:', err);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
      
      // Update summary
      if (summary) {
        setSummary(prev => prev ? { ...prev, unread_count: Math.max(0, prev.unread_count - 1) } : null);
      }
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
      if (summary) {
        setSummary(prev => prev ? { ...prev, unread_count: 0 } : null);
      }
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
    }
  };

  const runHealthCheck = async () => {
    try {
      setLoading(true);
      // This would call the check_financial_health() function
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      await fetchAlerts();
      await fetchAlertSummary();
    } catch (err) {
      console.error('Error running health check:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      case 'info':
        return Info;
      case 'success':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Layout variant="dashboard" title="Financial Alerts" description="Monitor financial health and receive automated alerts">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pharmacy-green to-trust-blue">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Financial Alerts
              </h1>
              <p className="text-white/80 text-lg">
                Real-time financial health monitoring and alerts
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                onClick={runHealthCheck}
                disabled={loading}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Health Check
              </Button>
              <Button 
                onClick={markAllAsRead}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button 
                onClick={() => setShowSettings(true)}
                className="bg-white text-pharmacy-green hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Summary */}
      <section className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-red-600">
                      Critical Alerts
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-red-600">
                      {summary?.critical_count || 0}
                    </CardTitle>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-yellow-600">
                      Warning Alerts
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-yellow-600">
                      {summary?.warning_count || 0}
                    </CardTitle>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-blue-600">
                      Info Alerts
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-blue-600">
                      {summary?.info_count || 0}
                    </CardTitle>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-pharmacy-green">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-sm font-medium text-pharmacy-green">
                      Unread Alerts
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-pharmacy-green">
                      {summary?.unread_count || 0}
                    </CardTitle>
                  </div>
                  <div className="p-3 bg-pharmacy-green/10 rounded-full">
                    <BellRing className="h-6 w-6 text-pharmacy-green" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alert Type
                    </label>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      {alertTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      {alertCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Last check: {summary?.last_check ? formatTimeAgo(summary.last_check) : 'Never'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg font-semibold mb-6">Active Alerts</CardTitle>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin h-8 w-8 text-pharmacy-green mr-3" />
                  <span className="text-lg text-gray-600 dark:text-gray-400">Loading alerts...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <Button 
                    onClick={fetchAlerts} 
                    className="mt-4 bg-pharmacy-green hover:bg-pharmacy-green/90"
                  >
                    Retry
                  </Button>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <CardTitle className="text-green-600 dark:text-green-400 mb-2">All Clear!</CardTitle>
                  <CardDescription>No financial alerts at this time. Your system is healthy.</CardDescription>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const AlertIcon = getAlertIcon(alert.type);
                    const colorClass = getAlertColor(alert.type);
                    
                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${colorClass} ${
                          !alert.is_read ? 'bg-opacity-20' : 'bg-opacity-10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <AlertIcon className={`h-5 w-5 mt-0.5 ${alert.type === 'critical' ? 'text-red-600' : 
                              alert.type === 'warning' ? 'text-yellow-600' : 
                              alert.type === 'info' ? 'text-blue-600' : 'text-green-600'}`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`font-semibold ${
                                  alert.type === 'critical' ? 'text-red-800' : 
                                  alert.type === 'warning' ? 'text-yellow-800' : 
                                  alert.type === 'info' ? 'text-blue-800' : 'text-green-800'
                                }`}>
                                  {alert.title}
                                </h3>
                                {!alert.is_read && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pharmacy-green text-white">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-2">{alert.message}</p>
                              {alert.action && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <strong>Recommended Action:</strong> {alert.action}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatTimeAgo(alert.created_at)}</span>
                                <span className="capitalize">{alert.category.replace('_', ' ')}</span>
                                {alert.expires_at && (
                                  <span>Expires: {new Date(alert.expires_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!alert.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(alert.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedAlert(alert)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissAlert(alert.id)}
                              className="text-gray-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedAlert(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alert Type
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getAlertColor(selectedAlert.type)}`}>
                    {selectedAlert.type.charAt(0).toUpperCase() + selectedAlert.type.slice(1)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {selectedAlert.category.replace('_', ' ')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedAlert.message}</p>
                </div>
                
                {selectedAlert.action && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recommended Action
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.action}</p>
                  </div>
                )}
                
                {selectedAlert.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Information
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <pre className="text-sm text-gray-700 dark:text-gray-300">
                        {JSON.stringify(selectedAlert.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Created: {new Date(selectedAlert.created_at).toLocaleString()}</span>
                  {selectedAlert.expires_at && (
                    <span>Expires: {new Date(selectedAlert.expires_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </Button>
                {!selectedAlert.is_read && (
                  <Button 
                    onClick={() => {
                      markAsRead(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && settings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Settings</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cash Runway Threshold (months)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={settings.cash_runway_threshold}
                    onChange={(e) => setSettings({...settings, cash_runway_threshold: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Churn Rate Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={settings.churn_rate_threshold}
                    onChange={(e) => setSettings({...settings, churn_rate_threshold: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Revenue Decline Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={settings.revenue_decline_threshold}
                    onChange={(e) => setSettings({...settings, revenue_decline_threshold: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notification Preferences
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                      className="rounded border-gray-300 text-pharmacy-green focus:ring-pharmacy-green"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.sms_notifications}
                      onChange={(e) => setSettings({...settings, sms_notifications: e.target.checked})}
                      className="rounded border-gray-300 text-pharmacy-green focus:ring-pharmacy-green"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">SMS Notifications</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.daily_summary}
                      onChange={(e) => setSettings({...settings, daily_summary: e.target.checked})}
                      className="rounded border-gray-300 text-pharmacy-green focus:ring-pharmacy-green"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Daily Summary Email</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Save settings logic here
                    setShowSettings(false);
                  }}
                  className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FinancialAlerts;