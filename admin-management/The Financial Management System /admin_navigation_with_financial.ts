'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  // Existing admin icons
  LayoutDashboard,
  Users,
  Building,
  ShieldCheck,
  MessageSquare,
  Settings,
  HelpCircle,
  FileText,
  
  // Financial management icons
  DollarSign,
  TrendingUp,
  PieChart,
  AlertTriangle,
  Receipt,
  BarChart3,
  CreditCard,
  Target,
  
  // UI icons
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  badge?: {
    text: string;
    color: 'red' | 'yellow' | 'green' | 'blue' | 'pharmacy-green';
  };
  description?: string;
}

interface AdminNavigationProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ 
  className = '', 
  onClose, 
  isMobile = false 
}) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [alertCounts, setAlertCounts] = useState({
    critical: 0,
    warning: 0,
    total: 0
  });

  // Fetch alert counts for badges
  useEffect(() => {
    fetchAlertCounts();
    // Refresh alert counts every 30 seconds
    const interval = setInterval(fetchAlertCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlertCounts = async () => {
    try {
      // Mock data - in production this would fetch from financial alerts
      setAlertCounts({
        critical: 1,
        warning: 2,
        total: 3
      });
    } catch (error) {
      console.error('Error fetching alert counts:', error);
    }
  };

  // Complete navigation structure with financial management
  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Overview and key metrics'
    },
    {
      name: 'Financial Management',
      icon: DollarSign,
      badge: alertCounts.total > 0 ? {
        text: alertCounts.total.toString(),
        color: alertCounts.critical > 0 ? 'red' : 'yellow'
      } : undefined,
      children: [
        {
          name: 'Financial Dashboard',
          href: '/admin/financial/dashboard',
          icon: BarChart3,
          description: 'Real-time financial analytics and KPIs'
        },
        {
          name: 'Expense Management',
          href: '/admin/financial/expenses',
          icon: Receipt,
          description: 'Track and manage business expenses'
        },
        {
          name: 'Financial Reports',
          href: '/admin/financial/reports',
          icon: FileText,
          description: 'Generate income statements and cash flow reports'
        },
        {
          name: 'Financial Alerts',
          href: '/admin/financial/alerts',
          icon: AlertTriangle,
          badge: alertCounts.total > 0 ? {
            text: alertCounts.total.toString(),
            color: alertCounts.critical > 0 ? 'red' : 'yellow'
          } : undefined,
          description: 'Monitor financial health and receive alerts'
        },
        {
          name: 'Budget Management',
          href: '/admin/financial/budgets',
          icon: Target,
          description: 'Set and track departmental budgets'
        },
        {
          name: 'Revenue Analytics',
          href: '/admin/financial/revenue',
          icon: TrendingUp,
          description: 'Detailed revenue analysis and forecasting'
        }
      ]
    },
    {
      name: 'Pharmacy Management',
      icon: Building,
      children: [
        {
          name: 'All Pharmacies',
          href: '/admin/pharmacies',
          icon: Building,
          description: 'View and manage all registered pharmacies'
        },
        {
          name: 'Verification Queue',
          href: '/admin/pharmacies/verification',
          icon: ShieldCheck,
          badge: {
            text: '5',
            color: 'blue'
          },
          description: 'Review and approve pharmacy verifications'
        },
        {
          name: 'Subscription Management',
          href: '/admin/pharmacies/subscriptions',
          icon: CreditCard,
          description: 'Manage pharmacy subscriptions and billing'
        },
        {
          name: 'Performance Analytics',
          href: '/admin/pharmacies/analytics',
          icon: PieChart,
          description: 'Pharmacy performance metrics and insights'
        }
      ]
    },
    {
      name: 'User Management',
      icon: Users,
      children: [
        {
          name: 'All Users',
          href: '/admin/users',
          icon: Users,
          description: 'Manage pharmacist accounts and permissions'
        },
        {
          name: 'Admin Users',
          href: '/admin/users/admins',
          icon: ShieldCheck,
          description: 'Manage administrative users and roles'
        },
        {
          name: 'User Analytics',
          href: '/admin/users/analytics',
          icon: BarChart3,
          description: 'User engagement and activity metrics'
        }
      ]
    },
    {
      name: 'Marketplace',
      icon: TrendingUp,
      children: [
        {
          name: 'Transaction Monitoring',
          href: '/admin/marketplace/transactions',
          icon: TrendingUp,
          description: 'Monitor marketplace transactions and activities'
        },
        {
          name: 'Listing Management',
          href: '/admin/marketplace/listings',
          icon: FileText,
          description: 'Manage and moderate marketplace listings'
        },
        {
          name: 'Revenue Analytics',
          href: '/admin/marketplace/revenue',
          icon: DollarSign,
          description: 'Marketplace revenue and commission analytics'
        }
      ]
    },
    {
      name: 'Support & Communications',
      icon: MessageSquare,
      children: [
        {
          name: 'Support Tickets',
          href: '/admin/support/tickets',
          icon: MessageSquare,
          badge: {
            text: '12',
            color: 'yellow'
          },
          description: 'Manage customer support tickets'
        },
        {
          name: 'Announcements',
          href: '/admin/support/announcements',
          icon: Bell,
          description: 'Send platform-wide announcements'
        },
        {
          name: 'Knowledge Base',
          href: '/admin/support/knowledge-base',
          icon: HelpCircle,
          description: 'Manage help articles and documentation'
        }
      ]
    },
    {
      name: 'System Settings',
      icon: Settings,
      children: [
        {
          name: 'Platform Configuration',
          href: '/admin/settings/platform',
          icon: Settings,
          description: 'Configure platform-wide settings'
        },
        {
          name: 'Payment Settings',
          href: '/admin/settings/payments',
          icon: CreditCard,
          description: 'Configure payment processing and fees'
        },
        {
          name: 'Security Settings',
          href: '/admin/settings/security',
          icon: ShieldCheck,
          description: 'Security policies and authentication settings'
        }
      ]
    }
  ];

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (children: NavigationItem[]) => {
    return children.some(child => child.href && isActive(child.href));
  };

  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    if (!searchQuery) return items;
    
    return items.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const descriptionMatch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const childrenMatch = item.children?.some(child => 
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return nameMatch || descriptionMatch || childrenMatch;
    });
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      case 'green':
        return 'bg-green-500 text-white';
      case 'blue':
        return 'bg-blue-500 text-white';
      case 'pharmacy-green':
        return 'bg-pharmacy-green text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    const itemIsActive = item.href ? isActive(item.href) : false;
    const parentIsActive = hasChildren ? isParentActive(item.children) : false;
    
    return (
      <div key={item.name} className="mb-1">
        {item.href ? (
          <Link
            href={item.href}
            onClick={onClose}
            className={`
              flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${itemIsActive 
                ? 'bg-pharmacy-green text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
              ${level > 0 ? 'ml-4' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.badge && (
                <Badge className={`text-xs ${getBadgeColor(item.badge.color)}`}>
                  {item.badge.text}
                </Badge>
              )}
            </div>
          </Link>
        ) : (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`
              flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${parentIsActive 
                ? 'bg-pharmacy-green/10 text-pharmacy-green' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
              ${level > 0 ? 'ml-4' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.badge && (
                <Badge className={`text-xs ${getBadgeColor(item.badge.color)}`}>
                  {item.badge.text}
                </Badge>
              )}
            </div>
            {hasChildren && (
              <div className="flex items-center">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredItems = filterItems(navigationItems);

  return (
    <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-pharmacy-green rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Financial Management
              </p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search admin features..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No matches found for "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredItems.map(item => renderNavigationItem(item))
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>PharmaSave AI Admin v2.0</p>
          <p>Financial Management System</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Navigation Toggle Button
export const MobileNavToggle: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-lg"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};

// Admin Layout with Navigation
export const AdminLayout: React.FC<{ 
  children: React.ReactNode;
  title: string;
  description?: string;
}> = ({ children, title, description }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Navigation Toggle */}
      <MobileNavToggle onToggle={() => setMobileNavOpen(true)} />

      {/* Desktop Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <AdminNavigation />
      </div>

      {/* Mobile Navigation */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64">
            <AdminNavigation 
              isMobile={true} 
              onClose={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation;