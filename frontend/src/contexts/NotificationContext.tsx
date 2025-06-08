'use client'

// ===============================================
// ENHANCED NOTIFICATION SYSTEM FOR PHARMASAVE AI
// Real-time notifications with better UX and responsiveness
// ===============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Package, 
  AlertCircle,
  TrendingUp
} from 'lucide-react'

// ===============================================
// TYPES AND INTERFACES
// ===============================================

export interface Notification {
  id: string
  type: 'transaction_request' | 'transaction_approved' | 'transaction_rejected' | 'payment_received' | 'listing_expiry' | 'verification_update' | 'system_update'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  pharmacy_id: string
  created_at: string
  expires_at?: string
}

export interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  pharmacyId: string | null
  notificationPermission: string
  showPermissionBanner: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  refreshNotifications: () => Promise<void>
  setPharmacyId: (id: string | null) => void
  requestNotificationPermission: () => Promise<void>
  dismissPermissionBanner: () => void
}

// ===============================================
// NOTIFICATION CONTEXT
// ===============================================

const NotificationContext = createContext<NotificationContextValue | null>(null)

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext)
  if (!context) {
    // Return a default object instead of throwing an error
    console.warn('useNotifications called outside of NotificationProvider, returning default values')
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      pharmacyId: null,
      notificationPermission: 'default',
      showPermissionBanner: false,
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      deleteNotification: async () => {},
      clearAll: async () => {},
      refreshNotifications: async () => {},
      setPharmacyId: () => {},
      requestNotificationPermission: async () => {},
      dismissPermissionBanner: () => {}
    }
  }
  return context
}

// ===============================================
// NOTIFICATION PROVIDER
// ===============================================

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children
}) => {
  const [pharmacyId, setPharmacyId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // ===============================================
  // AUTO-DETECT PHARMACY ID FROM AUTH
  // ===============================================

  const detectPharmacyId = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setPharmacyId(null)
        return
      }

      // Get pharmacist data to find pharmacy_id
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('pharmacy_id')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError || !pharmacistData) {
        setPharmacyId(null)
        return
      }

      setPharmacyId(pharmacistData.pharmacy_id)
      
    } catch (error) {
      console.error('Error detecting pharmacy ID:', error)
      setPharmacyId(null)
    }
  }, [])

  // ===============================================
  // LOAD NOTIFICATIONS FROM DATABASE
  // ===============================================

  const loadNotifications = useCallback(async () => {
    if (!pharmacyId) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Load recent notifications for the pharmacy
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Handle different types of errors gracefully
        if (error.message.includes('relation "public.notifications" does not exist')) {
          console.log('📊 Notifications table not yet created - using demo mode')
          // Use demo notifications instead of empty array
          setNotifications(getDemoNotifications(pharmacyId))
        } else {
          console.warn('Error loading notifications:', error.message)
          setNotifications([])
        }
        return
      }

      setNotifications(data || [])
      
      // Show toast for new unread notifications (only if we have data)
      if (data && data.length > 0) {
        const newUnreadCount = data.filter(n => !n.read).length
        if (newUnreadCount > 0) {
          showUnreadCountToast(newUnreadCount)
        }
      }

    } catch (error) {
      console.warn('Error in loadNotifications:', error)
      // Set empty array instead of leaving loading state
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [pharmacyId])

  // ===============================================
  // AUTHENTICATION DETECTION
  // ===============================================

  useEffect(() => {
    // Detect pharmacy ID on mount
    detectPharmacyId()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        detectPharmacyId()
      } else if (event === 'SIGNED_OUT') {
        setPharmacyId(null)
        setNotifications([])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [detectPharmacyId])

  // ===============================================
  // REAL-TIME SUBSCRIPTION
  // ===============================================

  useEffect(() => {
    let subscription: any = null

    if (pharmacyId) {
      // Initial load
      loadNotifications()

      // Set up real-time subscription
      subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `pharmacy_id=eq.${pharmacyId}`
        }, (payload) => {
          console.log('New notification received:', payload)
          const newNotification = payload.new as Notification
          
          // Add to state
          setNotifications(prev => [newNotification, ...prev])
          
          // Show real-time toast
          showNewNotificationToast(newNotification)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `pharmacy_id=eq.${pharmacyId}`
        }, (payload) => {
          console.log('Notification updated:', payload)
          const updatedNotification = payload.new as Notification
          
          // Update in state
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
        })
        .subscribe()
    } else {
      setNotifications([])
      setIsLoading(false)
    }

    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [pharmacyId, loadNotifications])

  // ===============================================
  // EXPOSE PHARMACY ID FOR COMPONENTS
  // ===============================================

  const setCurrentPharmacyId = useCallback((id: string | null) => {
    setPharmacyId(id)
  }, [])

  // ===============================================
  // NOTIFICATION ACTIONS
  // ===============================================

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )

    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!pharmacyId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('pharmacy_id', pharmacyId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )

      toast.success('All notifications marked as read')

    } catch (error) {
      console.error('Error in markAllAsRead:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      )

      toast.success('Notification deleted')

    } catch (error) {
      console.error('Error in deleteNotification:', error)
    }
  }

  const clearAll = async () => {
    if (!pharmacyId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('pharmacy_id', pharmacyId)

      if (error) {
        console.error('Error clearing all notifications:', error)
        return
      }

      // Update local state
      setNotifications([])

      toast.success('All notifications cleared')

    } catch (error) {
      console.error('Error in clearAll:', error)
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
    toast.success('Notifications refreshed')
  }

  // ===============================================
  // TOAST NOTIFICATIONS
  // ===============================================

  const showNewNotificationToast = (notification: Notification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'transaction_request': return '🛒'
        case 'transaction_approved': return '✅'
        case 'transaction_rejected': return '❌'
        case 'payment_received': return '💰'
        case 'listing_expiry': return '⏰'
        case 'verification_update': return '🔒'
        default: return '📢'
      }
    }

    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">{getIcon()}</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-slate-600">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-pharmacy-green hover:text-pharmacy-green/80 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-right'
    })

    // Also show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false
      })
    }
  }

  const showUnreadCountToast = (count: number) => {
    if (count > 0) {
      toast(`You have ${count} unread notification${count > 1 ? 's' : ''}`, {
        icon: '🔔',
        duration: 4000,
        style: {
          background: '#1E8A6E',
          color: 'white',
        }
      })
    }
  }

  // ===============================================
  // BROWSER NOTIFICATION PERMISSION (BETTER UX)
  // ===============================================

  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      // Don't auto-show permission banner - make it user-initiated only
      // setShowPermissionBanner will only be true when user manually requests it
    }
  }, [pharmacyId])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        setShowPermissionBanner(false)
        
        if (permission === 'granted') {
          toast.success('Notifications enabled! You\'ll receive real-time updates.')
        } else {
          toast('You can enable notifications later in your browser settings.')
        }
      } catch (error) {
        console.warn('Error requesting notification permission:', error)
        setShowPermissionBanner(false)
      }
    }
  }

  const dismissPermissionBanner = () => {
    setShowPermissionBanner(false)
  }

  // ===============================================
  // CONTEXT VALUE
  // ===============================================

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    pharmacyId,
    notificationPermission,
    showPermissionBanner,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
    setPharmacyId: setCurrentPharmacyId,
    requestNotificationPermission,
    dismissPermissionBanner
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// ===============================================
// NOTIFICATION HELPER FUNCTIONS
// ===============================================

export const createNotification = async (
  pharmacyId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Record<string, any>
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        pharmacy_id: pharmacyId,
        type,
        title,
        message,
        data,
        read: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in createNotification:', error)
    return false
  }
}

// ===============================================
// DEMO NOTIFICATIONS (for when tables don't exist)
// ===============================================

const getDemoNotifications = (pharmacyId: string): Notification[] => {
  const now = new Date()
  return [
    {
      id: 'demo-notif-001',
      type: 'transaction_request',
      title: 'New Purchase Request',
      message: 'A verified pharmacy wants to buy Paracetamol 500mg from your listing',
      data: { medicine: 'Paracetamol 500mg', quantity: 50 },
      read: false,
      pharmacy_id: pharmacyId,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: 'demo-notif-002',
      type: 'payment_received',
      title: 'Payment Received',
      message: 'You received 450 EGP for your recent sale of Amoxicillin',
      data: { amount: 450, medicine: 'Amoxicillin' },
      read: true,
      pharmacy_id: pharmacyId,
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: 'demo-notif-003',
      type: 'system_update',
      title: 'Welcome to PharmaSave AI',
      message: 'Your pharmacy account has been successfully verified and activated',
      data: {},
      read: true,
      pharmacy_id: pharmacyId,
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    }
  ]
}

// ===============================================
// NOTIFICATION TEMPLATES
// ===============================================

export const NotificationTemplates = {
  transactionRequest: (medicineName: string, buyerPharmacy: string) => ({
    type: 'transaction_request' as const,
    title: 'New Purchase Request',
    message: `${buyerPharmacy} wants to buy ${medicineName}`
  }),

  transactionApproved: (medicineName: string, sellerPharmacy: string) => ({
    type: 'transaction_approved' as const,
    title: 'Purchase Approved!',
    message: `${sellerPharmacy} approved your request for ${medicineName}`
  }),

  transactionRejected: (medicineName: string, sellerPharmacy: string) => ({
    type: 'transaction_rejected' as const,
    title: 'Purchase Declined',
    message: `${sellerPharmacy} declined your request for ${medicineName}`
  }),

  paymentReceived: (amount: number, buyerPharmacy: string) => ({
    type: 'payment_received' as const,
    title: 'Payment Received',
    message: `Received ${amount} EGP payment from ${buyerPharmacy}`
  }),

  listingExpiry: (medicineName: string, daysUntilExpiry: number) => ({
    type: 'listing_expiry' as const,
    title: 'Listing Expires Soon',
    message: `${medicineName} listing expires in ${daysUntilExpiry} days`
  }),

  verificationUpdate: (status: string) => ({
    type: 'verification_update' as const,
    title: 'Verification Update',
    message: `Your pharmacy verification is now: ${status}`
  })
}

export default NotificationProvider
