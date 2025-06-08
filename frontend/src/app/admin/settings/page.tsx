'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  DollarSign,
  Shield,
  Bell,
  Database,
  Mail,
  Globe,
  Users,
  Cog,
  Save,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('platform')

  const saveSettings = async (section: string) => {
    setLoading(true)
    try {
      toast.success(`${section} settings saved successfully!`)
      setTimeout(() => setLoading(false), 1000)
    } catch (error) {
      toast.error(`Failed to save ${section} settings`)
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Admin Settings" description="Configure platform settings and preferences">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <Cog className="w-4 h-4" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Fees & Pricing
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Regional
            </TabsTrigger>
          </TabsList>

          {/* Platform Settings */}
          <TabsContent value="platform">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="h-5 w-5" />
                    General Platform Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        defaultValue="PharmaSave AI"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Geographic Radius (km)
                      </label>
                      <input
                        type="number"
                        defaultValue="10"
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Trial Period (days)
                      </label>
                      <input
                        type="number"
                        defaultValue="60"
                        min="0"
                        max="365"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Employees per Pharmacy
                      </label>
                      <input
                        type="number"
                        defaultValue="10"
                        min="1"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Platform settings affect all pharmacies and users
                      </span>
                    </div>
                    <Button 
                      onClick={() => saveSettings('Platform')}
                      disabled={loading}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fee Settings */}
          <TabsContent value="fees">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Platform Fee Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Fees</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Buyer Fee (%)
                          </label>
                          <input
                            type="number"
                            defaultValue="3.0"
                            step="0.1"
                            min="0"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Seller Fee (%)
                          </label>
                          <input
                            type="number"
                            defaultValue="3.0"
                            step="0.1"
                            min="0"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Pricing</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Monthly Subscription (EGP)
                          </label>
                          <input
                            type="number"
                            defaultValue="999"
                            step="1"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Withdrawal Fee (EGP)
                          </label>
                          <input
                            type="number"
                            defaultValue="5.0"
                            step="0.5"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Fee Calculation Preview</h4>
                    <div className="text-sm text-blue-800 dark:text-blue-400">
                      <p>• For 45 EGP medication transaction:</p>
                      <p>• Buyer pays: 46.35 EGP (45 + 1.35 fee)</p>
                      <p>• Seller receives: 43.65 EGP (45 - 1.35 fee)</p>
                      <p>• Platform revenue: 2.70 EGP total</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => saveSettings('Fee')}
                      disabled={loading}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Update Fee Structure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue="60"
                        min="15"
                        max="480"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        defaultValue="5"
                        min="3"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Require Email Verification</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">All new users must verify their email</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enable 2FA for admin accounts</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => saveSettings('Security')}
                      disabled={loading}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Update Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">New Pharmacy Registrations</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Notify when new pharmacies register</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">High Value Transactions</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Alert for transactions over 1000 EGP</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">System Errors</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Critical system error notifications</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Revenue Milestones</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Notify when reaching revenue targets</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => saveSettings('Notification')}
                      disabled={loading}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Caution Required</h4>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Database operations can affect system performance and data integrity.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-5 w-5" />
                        <span className="font-medium">Backup Database</span>
                      </div>
                      <span className="text-sm text-gray-500">Create full system backup</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-5 w-5" />
                        <span className="font-medium">Optimize Tables</span>
                      </div>
                      <span className="text-sm text-gray-500">Improve database performance</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Regional Settings */}
          <TabsContent value="regional">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Regional Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Currency
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                        <option value="EGP">Egyptian Pound (EGP)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Language
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                        <option value="ar">Arabic</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                        <option value="Africa/Cairo">Cairo (GMT+2)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date Format
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => saveSettings('Regional')}
                      disabled={loading}
                      className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Apply Regional Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

export default AdminSettingsPage