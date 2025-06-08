// ===============================================
// MODERN NOTIFICATION SYSTEM FOR PHARMASAVE AI
// Beautiful, branded toast notifications
// ===============================================

import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  ShoppingCart, 
  DollarSign,
  Clock,
  Shield,
  Package,
  Heart,
  TrendingUp,
  AlertTriangle,
  Zap
} from 'lucide-react';

// Custom notification styles matching PharmaSave AI brand
const notificationStyles = {
  success: {
    style: {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      color: '#166534',
      border: '1px solid #22c55e',
      boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05)',
    },
    iconTheme: {
      primary: '#22c55e',
      secondary: '#f0fdf4',
    },
  },
  error: {
    style: {
      background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      color: '#dc2626',
      border: '1px solid #ef4444',
      boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fef2f2',
    },
  },
  loading: {
    style: {
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      color: '#1d4ed8',
      border: '1px solid #3b82f6',
      boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#eff6ff',
    },
  },
  warning: {
    style: {
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      color: '#d97706',
      border: '1px solid #f59e0b',
      boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05)',
    },
    iconTheme: {
      primary: '#f59e0b',
      secondary: '#fffbeb',
    },
  },
  info: {
    style: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      color: '#0369a1',
      border: '1px solid #0ea5e9',
      boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
    },
    iconTheme: {
      primary: '#0ea5e9',
      secondary: '#f0f9ff',
    },
  }
};

// Custom toast function with icon
const customToast = (message: string, type: 'success' | 'error' | 'loading' | 'warning' | 'info', icon?: any) => {
  return toast[type](message, {
    ...notificationStyles[type],
    duration: type === 'loading' ? 0 : 6000,
    icon: icon,
  });
};

// Transaction-specific notifications
export const transactionNotifications = {
  // Transaction creation
  creating: () => {
    return toast.loading('Creating transaction...', {
      ...notificationStyles.loading,
      icon: '⚡',
    });
  },

  success: (data: {
    transactionId?: string;
    amount?: number;
    fees?: number;
    type?: string;
  }) => {
    const { transactionId, amount, fees, type = 'purchase' } = data;
    
    return toast.success(
      `🎉 ${type === 'trade' ? 'Trade' : 'Purchase'} request created!\n\n` +
      `Transaction ID: ${transactionId?.slice(0, 8)}...\n` +
      `Amount: ${amount} EGP\n` +
      `${fees ? `Fees: ${fees} EGP\n` : ''}` +
      `The seller will be notified.`,
      {
        ...notificationStyles.success,
        duration: 8000,
        icon: '🎉',
      }
    );
  },

  approved: (transactionId: string) => {
    return toast.success(
      `✅ Transaction approved!\n\nTransaction ${transactionId.slice(0, 8)}... has been approved and is being processed.`,
      {
        ...notificationStyles.success,
        duration: 6000,
        icon: '✅',
      }
    );
  },

  rejected: (transactionId: string, reason?: string) => {
    return toast.error(
      `❌ Transaction rejected\n\nTransaction ${transactionId.slice(0, 8)}... was rejected.\n${reason ? `Reason: ${reason}` : ''}`,
      {
        ...notificationStyles.error,
        duration: 6000,
        icon: '❌',
      }
    );
  },

  error: (message: string) => {
    return toast.error(
      `Transaction failed\n\n${message}`,
      {
        ...notificationStyles.error,
        duration: 6000,
        icon: '🚫',
      }
    );
  },

  insufficientFunds: () => {
    return toast.error(
      `💳 Insufficient funds\n\nPlease add funds to your wallet to complete this transaction.`,
      {
        ...notificationStyles.error,
        duration: 8000,
        icon: '💳',
      }
    );
  },

  listingUnavailable: () => {
    return toast.error(
      `📦 Listing unavailable\n\nThis medication is no longer available or out of stock.`,
      {
        ...notificationStyles.warning,
        duration: 6000,
        icon: '📦',
      }
    );
  }
};

// General marketplace notifications
export const marketplaceNotifications = {
  refresh: () => {
    return toast.success('🔄 Marketplace refreshed!', {
      ...notificationStyles.info,
      duration: 3000,
    });
  },

  listingAdded: () => {
    return toast.success('📋 Listing added to favorites!', {
      ...notificationStyles.success,
      duration: 4000,
      icon: '❤️',
    });
  },

  listingRemoved: () => {
    return toast.success('📋 Listing removed from favorites', {
      ...notificationStyles.info,
      duration: 3000,
    });
  },

  filterApplied: (count: number) => {
    return toast.success(`🔍 Found ${count} matching listings`, {
      ...notificationStyles.info,
      duration: 3000,
    });
  },

  noResults: () => {
    return toast('🔍 No listings match your criteria', {
      ...notificationStyles.warning,
      duration: 4000,
    });
  }
};

// Wallet notifications  
export const walletNotifications = {
  balanceUpdated: (newBalance: number) => {
    return toast.success(`💰 Wallet updated: ${newBalance} EGP`, {
      ...notificationStyles.success,
      duration: 4000,
    });
  },

  lowBalance: (balance: number) => {
    return toast('⚠️ Low wallet balance', `Current balance: ${balance} EGP\nConsider adding funds for smoother transactions.`, {
      ...notificationStyles.warning,
      duration: 8000,
    });
  },

  fundsAdded: (amount: number) => {
    return toast.success(`💵 ${amount} EGP added to wallet`, {
      ...notificationStyles.success,
      duration: 5000,
    });
  }
};

// Authentication notifications
export const authNotifications = {
  signInSuccess: (userName: string) => {
    return toast.success(`👋 Welcome back, ${userName}!`, {
      ...notificationStyles.success,
      duration: 4000,
    });
  },

  signOutSuccess: () => {
    return toast.success('👋 Signed out successfully', {
      ...notificationStyles.info,
      duration: 3000,
    });
  },

  unauthorized: () => {
    return toast.error('🔒 Please sign in to continue', {
      ...notificationStyles.error,
      duration: 5000,
    });
  },

  sessionExpired: () => {
    return toast.error('⏰ Session expired. Please sign in again.', {
      ...notificationStyles.warning,
      duration: 6000,
    });
  }
};

// Profile notifications
export const profileNotifications = {
  updated: () => {
    return toast.success('✅ Profile updated successfully!', {
      ...notificationStyles.success,
      duration: 4000,
    });
  },

  verificationSubmitted: () => {
    return toast.success('📋 Verification documents submitted!\n\nWe\'ll review and notify you within 24-48 hours.', {
      ...notificationStyles.success,
      duration: 8000,
    });
  },

  verified: () => {
    return toast.success('🎉 Pharmacy verified!\n\nYou now have full marketplace access.', {
      ...notificationStyles.success,
      duration: 8000,
      icon: '🎉',
    });
  },

  profileIncomplete: (percentage: number) => {
    return toast(`📝 Profile ${percentage}% complete\n\nComplete your profile to unlock more features.`, {
      ...notificationStyles.info,
      duration: 6000,
    });
  }
};

// System notifications
export const systemNotifications = {
  maintenance: () => {
    return toast('🔧 System maintenance in progress...', {
      ...notificationStyles.warning,
      duration: 10000,
    });
  },

  connectionError: () => {
    return toast.error('🌐 Connection error. Please check your internet.', {
      ...notificationStyles.error,
      duration: 5000,
    });
  },

  serverError: () => {
    return toast.error('⚠️ Server error. Please try again later.', {
      ...notificationStyles.error,
      duration: 6000,
    });
  },

  success: (message: string) => {
    return toast.success(message, notificationStyles.success);
  },

  error: (message: string) => {
    return toast.error(message, notificationStyles.error);
  },

  info: (message: string) => {
    return toast(message, notificationStyles.info);
  },

  warning: (message: string) => {
    return toast(message, notificationStyles.warning);
  }
};

// Export default toast for custom usage
export default toast;