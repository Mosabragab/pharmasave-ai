'use client'

// ===============================================
// SYSTEM STATUS CHECKER
// Shows current database and service status
// ===============================================

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { enhancedTransactionService } from '@/lib/enhancedTransactionService'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface StatusCheck {
  name: string
  status: 'checking' | 'success' | 'warning' | 'error'
  message: string
  details?: string
}

export default function SystemStatusChecker() {
  const [checks, setChecks] = useState<StatusCheck[]>([
    { name: 'Supabase Connection', status: 'checking', message: 'Testing connection...' },
    { name: 'Notifications Table', status: 'checking', message: 'Checking table...' },
    { name: 'Transactions Table', status: 'checking', message: 'Checking table...' },
    { name: 'Transaction Service', status: 'checking', message: 'Testing service...' },
    { name: 'Console Errors', status: 'checking', message: 'Monitoring console...' }
  ])

  const updateCheck = (name: string, status: StatusCheck['status'], message: string, details?: string) => {
    setChecks(prev => prev.map(check => 
      check.name === name ? { ...check, status, message, details } : check
    ))
  }

  useEffect(() => {
    runStatusChecks()
  }, [])

  const runStatusChecks = async () => {
    // 1. Test Supabase Connection
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id')
        .limit(1)
      
      if (error) {
        updateCheck('Supabase Connection', 'warning', 'Connected, but some issues detected', error.message)
      } else {
        updateCheck('Supabase Connection', 'success', 'Connected successfully', `Found ${data?.length || 0} pharmacies`)
      }
    } catch (error) {
      updateCheck('Supabase Connection', 'error', 'Connection failed', String(error))
    }

    // 2. Check Notifications Table
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)
      
      if (error) {
        if (error.message.includes('does not exist')) {
          updateCheck('Notifications Table', 'warning', 'Table not found - using demo mode', 'Run DATABASE_SETUP_REQUIRED.sql to create')
        } else {
          updateCheck('Notifications Table', 'error', 'Table error', error.message)
        }
      } else {
        updateCheck('Notifications Table', 'success', 'Table exists and accessible', `Found ${data?.length || 0} records`)
      }
    } catch (error) {
      updateCheck('Notifications Table', 'error', 'Check failed', String(error))
    }

    // 3. Check Transactions Table
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .limit(1)
      
      if (error) {
        if (error.message.includes('does not exist')) {
          updateCheck('Transactions Table', 'warning', 'Table not found - using demo mode', 'Run DATABASE_SETUP_REQUIRED.sql to create')
        } else {
          updateCheck('Transactions Table', 'error', 'Table error', error.message)
        }
      } else {
        updateCheck('Transactions Table', 'success', 'Table exists and accessible', `Found ${data?.length || 0} records`)
      }
    } catch (error) {
      updateCheck('Transactions Table', 'error', 'Check failed', String(error))
    }

    // 4. Test Transaction Service
    try {
      const result = await enhancedTransactionService.getPharmacyTransactions('test-pharmacy-id')
      if (result.success) {
        updateCheck('Transaction Service', 'success', 'Service working correctly', `Returned ${result.data?.length || 0} transactions`)
      } else {
        updateCheck('Transaction Service', 'warning', 'Service working with fallbacks', result.error || 'Using mock data')
      }
    } catch (error) {
      updateCheck('Transaction Service', 'error', 'Service failed', String(error))
    }

    // 5. Console Error Check
    const originalError = console.error
    const originalWarn = console.warn
    let errorCount = 0
    let warnCount = 0

    console.error = (...args) => {
      errorCount++
      originalError(...args)
    }

    console.warn = (...args) => {
      warnCount++
      originalWarn(...args)
    }

    // Wait a bit to capture any immediate errors
    setTimeout(() => {
      console.error = originalError
      console.warn = originalWarn

      if (errorCount === 0 && warnCount === 0) {
        updateCheck('Console Errors', 'success', 'No errors detected', 'Console is clean')
      } else if (errorCount === 0) {
        updateCheck('Console Errors', 'warning', `${warnCount} warnings detected`, 'Some warnings but no errors')
      } else {
        updateCheck('Console Errors', 'error', `${errorCount} errors, ${warnCount} warnings`, 'Check browser console')
      }
    }, 2000)
  }

  const getStatusIcon = (status: StatusCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusColor = (status: StatusCheck['status']) => {
    switch (status) {
      case 'checking':
        return 'border-yellow-200 bg-yellow-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
    }
  }

  const overallStatus = checks.every(c => c.status === 'success') ? 'success' :
                       checks.some(c => c.status === 'error') ? 'error' : 'warning'

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PharmaSave AI System Status
        </h1>
        <p className="text-gray-600">
          Real-time status check of all system components
        </p>
      </div>

      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${
        overallStatus === 'success' ? 'border-green-200 bg-green-50' :
        overallStatus === 'error' ? 'border-red-200 bg-red-50' :
        'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon(overallStatus)}
          <div>
            <h3 className="font-semibold text-lg">
              Overall System Status: {
                overallStatus === 'success' ? '✅ All Systems Operational' :
                overallStatus === 'error' ? '❌ Issues Detected' :
                '⚠️ Some Issues Detected'
              }
            </h3>
            <p className="text-sm text-gray-600">
              {overallStatus === 'success' 
                ? 'All components are working correctly'
                : 'Some components need attention - see details below'}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-3">
        {checks.map((check) => (
          <div 
            key={check.name}
            className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
          >
            <div className="flex items-start space-x-3">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{check.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    check.status === 'success' ? 'bg-green-100 text-green-800' :
                    check.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    check.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {check.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                {check.details && (
                  <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
        <button
          onClick={runStatusChecks}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Recheck Status
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          📊 Go to Dashboard
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          💡 If you see warnings about missing tables, run the <code>DATABASE_SETUP_REQUIRED.sql</code> script in your Supabase dashboard.
        </p>
        <p className="mt-1">
          📁 Check <code>frontend/CONSOLE_ERRORS_FIXED.md</code> for detailed setup instructions.
        </p>
      </div>
    </div>
  )
}
