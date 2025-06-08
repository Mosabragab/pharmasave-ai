'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Pill
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const AdminReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [loading, setLoading] = useState(false)

  const generateReport = async (reportType: string) => {
    setLoading(true)
    try {
      toast.success(`Generating ${reportType} report...`)
      // Simulate report generation
      setTimeout(() => {
        toast.success(`${reportType} report generated successfully!`)
        setLoading(false)
      }, 2000)
    } catch (error) {
      toast.error(`Failed to generate ${reportType} report`)
      setLoading(false)
    }
  }

  const reports = [
    {
      id: 'financial',
      title: 'Financial Overview Report',
      description: 'Complete financial dashboard with revenue, expenses, and profit analysis',
      icon: DollarSign,
      type: 'Financial',
      format: 'PDF/Excel'
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy Analytics Report',
      description: 'Pharmacy performance, subscription status, and activity metrics',
      icon: Users,
      type: 'Analytics',
      format: 'PDF/Excel'
    },
    {
      id: 'transactions',
      title: 'Transaction Summary Report',
      description: 'Detailed transaction analysis including fees and volumes',
      icon: BarChart3,
      type: 'Financial',
      format: 'PDF/Excel'
    },
    {
      id: 'revenue',
      title: 'Revenue Breakdown Report',
      description: 'Revenue analysis by source: subscriptions, fees, and other income',
      icon: TrendingUp,
      type: 'Financial',
      format: 'PDF/Excel'
    },
    {
      id: 'medications',
      title: 'Medication Trading Report',
      description: 'Medication categories, quantities, and marketplace activity',
      icon: Pill,
      type: 'Analytics',
      format: 'PDF/Excel'
    },
    {
      id: 'compliance',
      title: 'Compliance & Verification Report',
      description: 'Pharmacy verification status and compliance metrics',
      icon: FileText,
      type: 'Compliance',
      format: 'PDF'
    }
  ]

  return (
    <AdminLayout title="Reports & Analytics" description="Generate comprehensive business reports and analytics">
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
              <option value="last_quarter">Last Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Reports
            </Button>
            <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
              <Download className="h-4 w-4 mr-2" />
              Bulk Export
            </Button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const Icon = report.icon
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-pharmacy-green/10 rounded-lg">
                      <Icon className="h-6 w-6 text-pharmacy-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {report.format}
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => generateReport(report.title)}
                      disabled={loading}
                      className="flex-1"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reports Generated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">247</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
                </div>
                <FileText className="h-10 w-10 text-pharmacy-green bg-pharmacy-green/10 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Most Requested</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">Financial Reports</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">67% of requests</p>
                </div>
                <BarChart3 className="h-10 w-10 text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Generation Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">2.3s</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 bg-green-100 dark:bg-green-900 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active schedules</p>
                </div>
                <Calendar className="h-10 w-10 text-purple-600 bg-purple-100 dark:bg-purple-900 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Monthly Financial Report - May 2025', type: 'Financial', date: '2025-06-01', status: 'completed', size: '2.3 MB' },
                { name: 'Pharmacy Analytics Q1 2025', type: 'Analytics', date: '2025-05-28', status: 'completed', size: '1.8 MB' },
                { name: 'Transaction Summary - Week 22', type: 'Financial', date: '2025-05-25', status: 'completed', size: '950 KB' },
                { name: 'Compliance Report - May 2025', type: 'Compliance', date: '2025-05-24', status: 'completed', size: '1.2 MB' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-pharmacy-green bg-pharmacy-green/10 rounded-lg p-2" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {report.type} • {report.date} • {report.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {report.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminReportsPage