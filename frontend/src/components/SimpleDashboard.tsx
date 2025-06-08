'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  Plus,
  ArrowRight,
  Zap,
  Star
} from 'lucide-react'

interface SimpleDashboardProps {
  pharmacy: {
    id: string
    name: string
    display_id: string
  }
  pharmacist: {
    id: string
    fname: string
    lname: string
    role: string
  }
}

export default function SimpleDashboard({ pharmacy, pharmacist }: SimpleDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const quickActions = [
    {
      title: 'Browse Marketplace',
      description: 'Find medications from verified pharmacies',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/marketplace',
      primary: true
    },
    {
      title: 'Create Listing',
      description: 'List near-expired medications',
      icon: <Plus className="w-5 h-5" />,
      href: '/listings/create'
    },
    {
      title: 'Transaction History',
      description: 'View all your transactions',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/transactions'
    },
    {
      title: 'My Listings',
      description: 'Manage your active listings',
      icon: <Package className="w-5 h-5" />,
      href: '/listings'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Good evening, {pharmacist.fname}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {pharmacy.name} • {pharmacy.display_id}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-500">Needs attention</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-500">In marketplace</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0 EGP</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0 EGP</p>
              <p className="text-xs text-gray-500">Available funds</p>
            </div>
            <div className="w-10 h-10 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-pharmacy-green dark:text-pharmacy-green" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-pharmacy-green" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                action.primary 
                  ? 'border-pharmacy-green bg-pharmacy-green/5 hover:bg-pharmacy-green/10'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`p-1 rounded ${
                        action.primary 
                          ? 'bg-pharmacy-green/20 text-pharmacy-green'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {action.icon}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
