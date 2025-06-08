'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { 
  Bell, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Banknote,
  DollarSign,
  AlertCircle,
  Loader2,
  Trash2,
  Archive,
  Filter,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react'

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  amount?: number
  reference_number?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  metadata?: any
}

interface WalletNotificationsProps {
  pharmacyId: string
  onNotificationUpdate?: () => void
}

export default function WalletNotifications({ pharmacyId, onNotificationUpdate }: WalletNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [pharmacyId, filter])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .rpc('get_pharmacy_notifications', {
          p_pharmacy_id: pharmacyId,
          p_status: filter,
          p_limit: 50
        })

      if (error) {
        console.error('Error loading notifications:', error)
        toast.error('Failed to load notifications')
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_notification_count', {
          p_pharmacy_id: pharmacyId,
          p_status: 'unread'
        })

      if (!error && data !== null) {
        setUnreadCount(data)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      setIsMarkingRead(notificationId)
      
      const { data, error } = await supabase
        .rpc('mark_notification_read', {
          p_notification_id: notificationId,
          p_pharmacy_id: pharmacyId
        })

      if (error) {
        console.error('Error marking notification as read:', error)
        toast.error('Failed to mark as read')
        return
      }

      if (data) {
        // Update local state
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        
        if (onNotificationUpdate) {
          onNotificationUpdate()
        }
        
        toast.success('Notification marked as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark as read')
    } finally {
      setIsMarkingRead(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-500 text-red-800'
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800'
      case 'normal': return 'bg-blue-100 border-blue-500 text-blue-800'
      case 'low': return 'bg-gray-100 border-gray-500 text-gray-800'
      default: return 'bg-gray-100 border-gray-500 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <AlertCircle className="w-4 h-4" />
      case 'normal': return <Bell className="w-4 h-4" />
      case 'low': return <Clock className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fund_request_approved': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'fund_request_rejected': return <X className="w-5 h-5 text-red-600" />
      case 'withdrawal_approved': return <Banknote className="w-5 h-5 text-green-600" />
      case 'withdrawal_rejected': return <X className="w-5 h-5 text-red-600" />
      case 'balance_low': return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'transaction_completed': return <DollarSign className="w-5 h-5 text-blue-600" />
      default: return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-pharmacy-green" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-pharmacy-green" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Notifications
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Stay updated on your wallet activity
              </CardDescription>
            </div>
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span className="capitalize">{filter}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {[
                    { value: 'unread', label: 'Unread', icon: <EyeOff className="w-4 h-4" /> },
                    { value: 'read', label: 'Read', icon: <Eye className="w-4 h-4" /> },
                    { value: 'all', label: 'All', icon: <Filter className="w-4 h-4" /> }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value as 'all' | 'unread' | 'read')
                        setShowDropdown(false)
                      }}
                      className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        filter === option.value ? 'bg-pharmacy-green/10 text-pharmacy-green' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'unread' 
                  ? "You're all caught up! New notifications will appear here."
                  : "Notifications about your wallet activity will appear here."
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                  filter === 'unread' ? 'border-l-4 border-l-pharmacy-green' : 'border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {notification.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                          {getPriorityIcon(notification.priority)}
                          <span className="ml-1 capitalize">{notification.priority}</span>
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(notification.created_at)}</span>
                          {notification.amount && (
                            <span className="font-medium text-pharmacy-green">
                              {notification.amount.toFixed(2)} EGP
                            </span>
                          )}
                          {notification.reference_number && (
                            <span className="font-mono">
                              {notification.reference_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {filter === 'unread' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={isMarkingRead === notification.id}
                        className="flex items-center space-x-1"
                      >
                        {isMarkingRead === notification.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Mark Read</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {notifications.length >= 50 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={loadNotifications}
              className="flex items-center space-x-2"
            >
              <Loader2 className="w-4 h-4" />
              <span>Load More</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for notification count (can be used in header)
export function useNotificationCount(pharmacyId: string) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!pharmacyId) return
    
    const loadCount = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_notification_count', {
            p_pharmacy_id: pharmacyId,
            p_status: 'unread'
          })

        if (!error && data !== null) {
          setCount(data)
        }
      } catch (error) {
        console.error('Error loading notification count:', error)
      }
    }

    loadCount()
    
    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('wallet_notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'wallet_notifications',
          filter: `pharmacy_id=eq.${pharmacyId}`
        }, 
        () => {
          loadCount() // Reload count when notifications change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [pharmacyId])
  
  return count
}
