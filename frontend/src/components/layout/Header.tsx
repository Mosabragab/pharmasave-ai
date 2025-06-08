'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/contexts/NotificationContext'
import {
  Pill,
  Sun,
  Moon,
  Settings,
  LogOut,
  Building2,
  User,
  ArrowLeft,
  Bell,
  X,
  Clock,
  CheckCircle,
  DollarSign,
  Wallet,
  RefreshCw,
  XCircle
} from 'lucide-react'

interface HeaderProps {
  variant?: 'landing' | 'auth' | 'dashboard' | 'app'
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  title?: string
  subtitle?: string
  pharmacyName?: string
  pharmacyId?: string
  userRole?: string
  isVerified?: boolean
  showSettings?: boolean
  showSignOut?: boolean
  showProfileButton?: boolean
  showDashboardButton?: boolean
  showWalletButton?: boolean
  onSignOut?: () => void
}

export default function Header({
  variant = 'landing',
  showBackButton = false,
  backButtonText = 'Back',
  backButtonHref = '/',
  title,
  subtitle,
  pharmacyName,
  pharmacyId,
  userRole,
  isVerified = false,
  showSettings = false,
  showSignOut = false,
  showProfileButton = false,
  showDashboardButton = false,
  showWalletButton = false,
  onSignOut
}: HeaderProps) {
  const { theme, toggleTheme, mounted } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Always call useNotifications hook (required by Rules of Hooks)
  const notificationSystem = useNotifications()
  
  // Only use notifications for dashboard with pharmacy context
  const shouldShowNotifications = variant === 'dashboard' && pharmacyId
  const notifications = shouldShowNotifications ? (notificationSystem.notifications || []) : []
  const unreadCount = shouldShowNotifications ? (notificationSystem.unreadCount || 0) : 0
  const notificationsLoading = shouldShowNotifications ? (notificationSystem.isLoading || false) : false
  const markAsRead = shouldShowNotifications ? (notificationSystem.markAsRead || (() => {})) : (() => {})
  const markAllAsRead = shouldShowNotifications ? (notificationSystem.markAllAsRead || (() => {})) : (() => {})
  const refreshNotifications = shouldShowNotifications ? (notificationSystem.refreshNotifications || (() => {})) : (() => {})

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  const renderDarkModeToggle = () => (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center"
    >
      {mounted ? (
        theme === 'dark' ? (
          <Sun className="w-4 h-4 mr-2 text-yellow-500" />
        ) : (
          <Moon className="w-4 h-4 mr-2 text-gray-600" />
        )
      ) : (
        <Moon className="w-4 h-4 mr-2 text-gray-600" />
      )}
      {mounted && theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  )

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction_request':
        return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'transaction_approved':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'transaction_rejected':
        return <X className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'listing_expiry':
        return <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      case 'verification_update':
        return <CheckCircle className="w-4 h-4 text-pharmacy-green" />
      default:
        return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'transaction_request':
        return 'bg-blue-100 dark:bg-blue-900/20'
      case 'transaction_approved':
        return 'bg-green-100 dark:bg-green-900/20'
      case 'transaction_rejected':
        return 'bg-red-100 dark:bg-red-900/20'
      case 'payment_received':
        return 'bg-green-100 dark:bg-green-900/20'
      case 'listing_expiry':
        return 'bg-orange-100 dark:bg-orange-900/20'
      case 'verification_update':
        return 'bg-pharmacy-green/10 dark:bg-pharmacy-green/20'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    // Could navigate to relevant page based on notification type
  }

  const renderNotificationBell = () => (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
        disabled={notificationsLoading}
      >
        <Bell className={`w-4 h-4 ${notificationsLoading ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      
      {/* Enhanced Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refreshNotifications}
                disabled={notificationsLoading}
              >
                <RefreshCw className={`w-3 h-3 ${notificationsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificationsLoading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
                <p className="text-xs mt-1">New updates will appear here</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                        !notification.read ? 'font-semibold' : ''
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.created_at)} ago
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <Button 
                variant="ghost" 
                className="text-sm text-pharmacy-green hover:text-pharmacy-green/80"
                onClick={() => {
                  // Navigate to full notifications page
                  setShowNotifications(false)
                }}
              >
                View all notifications
              </Button>
              <p className="text-xs text-gray-500">
                Showing {Math.min(notifications.length, 10)} of {notifications.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Landing Page Header
  if (variant === 'landing') {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 z-50 border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Pill className="w-6 h-6 text-pharmacy-green" />
              <span className="ml-2 text-xl font-bold dark:text-white">PharmaSave AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              {renderDarkModeToggle()}
              <Link href="/auth/signin">
                <Button variant="tertiary" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Dashboard Header (Simplified)
  if (variant === 'dashboard') {
    return (
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-pharmacy-green rounded-full flex items-center justify-center mr-3">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pharmacyName || 'PharmaSave AI'}
                  {pharmacyName && pharmacyId && <span className="text-gray-500 dark:text-gray-400 font-normal"> • {pharmacyId}</span>}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userRole || 'Primary Admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {renderDarkModeToggle()}
              
              {/* Notifications Bell - Only for dashboard */}
              {variant === 'dashboard' && pharmacyId && renderNotificationBell()}
              
              {/* Navigation Buttons */}
              {showWalletButton && (
                <Link href={isVerified ? "/wallet" : "#"}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    disabled={!isVerified}
                    className={`${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isVerified ? 'Complete verification to access wallet' : 'View wallet'}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </Button>
                </Link>
              )}
              
              {showProfileButton && (
                <Link href="/dashboard/profile">
                  <Button variant="secondary" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              )}
              
              {showDashboardButton && (
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}
              
              {showSettings && (
                <Link href="/dashboard/settings">
                  <Button variant="secondary" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              )}
              
              {showSignOut && (
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Auth Pages Header (Sign In / Sign Up)
  if (variant === 'auth') {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 z-50 border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Top Left */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Pill className="w-6 h-6 text-pharmacy-green" />
              <span className="ml-2 text-xl font-bold dark:text-white">PharmaSave AI</span>
            </Link>
            
            {/* Controls - Top Right */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              {renderDarkModeToggle()}
              
              {/* Back Button */}
              {showBackButton && (
                <Link href={backButtonHref}>
                  <Button variant="tertiary" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {backButtonText}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Default fallback
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Pill className="w-6 h-6 text-pharmacy-green" />
            <span className="ml-2 text-xl font-bold dark:text-white">PharmaSave AI</span>
          </Link>
          <div className="flex items-center space-x-4">
            {renderDarkModeToggle()}
          </div>
        </div>
      </div>
    </nav>
  )
}
