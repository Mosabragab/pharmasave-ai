'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Layout from '@/components/layout/Layout'
import { 
  Building2,
  Users,
  CreditCard,
  Shield,
  Globe,
  BarChart2,
  Bell,
  CheckCircle,
  Edit,
  Upload,
  Clock,
  Save,
  Settings,
  Eye,
  Download,
  MapPin,
  Filter,
  TrendingUp,
  Mail,
  AlertCircle,
  Key,
  Lock,
  Activity,
  Star,
  Package,
  FileText,
  ExternalLink,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  license_number: string | null
  registration_number: string | null
  license_expiry: string | null
  operating_hours: string | null
  description: string | null
  status: string
  verified: boolean
  profile_completion_percent: number
  display_id: string | null
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  email: string
  role: string
  is_primary: boolean
}

interface SettingsSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  expanded: boolean
}

// Helper function for InstaPay placeholders
const getInstapayPlaceholder = (type: string) => {
  switch (type) {
    case 'mobile': return '+20 123 456 7890'
    case 'address': return 'payment.address@instapay.com'
    case 'bank': return 'Account number or IBAN'
    case 'wallet': return 'Wallet ID or username'
    default: return 'Enter your identifier'
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    business: true, // Start with business profile expanded
    employees: false,
    billing: false,
    security: false,
    marketplace: false,
    analytics: false,
    notifications: false,
    verification: false
  })

  // Form states for different sections
  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    operating_hours: ''
  })

  // InstaPay form state
  const [instapayForm, setInstapayForm] = useState({
    identifier_type: '',
    identifier: '',
    display_name: '',
    verified: false,
    setup_completed: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    allowReviews: true,
    allowReviewResponses: false,
    dataRetentionPeriod: 'legal_minimum'
  })

  const [marketplaceSettings, setMarketplaceSettings] = useState({
    searchRadius: 10,
    preferredTypes: ['buy', 'sell', 'trade'],
    autoAccept: false,
    listingExpiry: 30
  })

  const [notificationSettings, setNotificationSettings] = useState({
    newTransactions: true,
    employeeActivity: true,
    systemAnnouncements: true,
    securityAlerts: true,
    emailNotifications: true,
    smsNotifications: false
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Get pharmacist data
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError || !pharmacistData) {
        console.error('Pharmacist data error:', pharmacistError)
        router.push('/auth/signin')
        return
      }

      setPharmacist(pharmacistData)

      // Check if user is Primary Admin
      if (pharmacistData.role !== 'primary_admin') {
        router.push('/dashboard')
        return
      }

      // Get pharmacy data
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacistData.pharmacy_id)
        .single()

      if (pharmacyError || !pharmacyData) {
        console.error('Pharmacy data error:', pharmacyError)
        router.push('/auth/signin')
        return
      }

      setPharmacy(pharmacyData)
      
      // Initialize form with existing data
      setBusinessForm({
        name: pharmacyData.name || '',
        email: pharmacyData.email || '',
        phone: pharmacyData.phone || '',
        address: pharmacyData.address || '',
        description: pharmacyData.description || '',
        operating_hours: pharmacyData.operating_hours || ''
      })

      // Initialize InstaPay form with existing data
      setInstapayForm({
        identifier_type: pharmacyData.instapay_identifier_type || '',
        identifier: pharmacyData.instapay_identifier || '',
        display_name: pharmacyData.instapay_display_name || '',
        verified: pharmacyData.payment_method_verified || false,
        setup_completed: pharmacyData.payment_setup_completed || false
      })

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const saveBusinessInfo = async () => {
    if (!pharmacy || !pharmacist) return

    try {
      setSaving('business')
      
      const { error } = await supabase
        .from('pharmacies')
        .update({
          name: businessForm.name,
          email: businessForm.email,
          phone: businessForm.phone,
          address: businessForm.address,
          description: businessForm.description,
          operating_hours: businessForm.operating_hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy.id)

      if (error) {
        throw error
      }

      // Update local state
      setPharmacy(prev => prev ? {
        ...prev,
        name: businessForm.name,
        email: businessForm.email,
        phone: businessForm.phone,
        address: businessForm.address,
        description: businessForm.description,
        operating_hours: businessForm.operating_hours
      } : null)

      alert('Business information updated successfully!')

    } catch (error: any) {
      console.error('Error saving business info:', error)
      alert(`Error saving business information: ${error.message}`)
    } finally {
      setSaving(null)
    }
  }

  const saveInstapayInfo = async () => {
    if (!pharmacy || !pharmacist) return

    try {
      setSaving('instapay')
      
      const { error } = await supabase
        .from('pharmacies')
        .update({
          instapay_identifier_type: instapayForm.identifier_type,
          instapay_identifier: instapayForm.identifier,
          instapay_display_name: instapayForm.display_name,
          payment_setup_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy.id)

      if (error) {
        throw error
      }

      // Update local state
      setInstapayForm(prev => ({
        ...prev,
        setup_completed: true
      }))

      alert('InstaPay withdrawal details saved successfully!')

    } catch (error: any) {
      console.error('Error saving InstaPay info:', error)
      alert(`Error saving InstaPay information: ${error.message}`)
    } finally {
      setSaving(null)
    }
  }

  if (isLoading) {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!pharmacy || !pharmacist || pharmacist.role !== 'primary_admin') {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Only Primary Admins can access the settings page.
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const settingsSections: SettingsSection[] = [
    {
      id: 'business',
      title: 'Business Profile Management',
      description: 'Manage your pharmacy business information and contact details',
      icon: Building2,
      expanded: expandedSections.business
    },
    {
      id: 'employees',
      title: 'Employee Management Controls',
      description: 'Control team access and permissions for your pharmacy',
      icon: Users,
      expanded: expandedSections.employees
    },
    {
      id: 'billing',
      title: 'Subscription & Billing Management',
      description: 'Manage your subscription plan and payment methods',
      icon: CreditCard,
      expanded: expandedSections.billing
    },
    {
      id: 'security',
      title: 'Security & Privacy Settings',
      description: 'Configure account security and privacy preferences',
      icon: Shield,
      expanded: expandedSections.security
    },
    {
      id: 'marketplace',
      title: 'Marketplace Preferences',
      description: 'Customize your marketplace search and listing preferences',
      icon: Globe,
      expanded: expandedSections.marketplace
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting Preferences',
      description: 'Configure dashboard metrics and report preferences',
      icon: BarChart2,
      expanded: expandedSections.analytics
    },
    {
      id: 'notifications',
      title: 'Notification Management',
      description: 'Control how and when you receive notifications',
      icon: Bell,
      expanded: expandedSections.notifications
    },
    {
      id: 'verification',
      title: 'Verification & Compliance',
      description: 'Manage verification status and compliance documents',
      icon: CheckCircle,
      expanded: expandedSections.verification
    }
  ]

  return (
    <Layout 
      variant="dashboard"
      pharmacyName={pharmacy.name}
      userRole={pharmacist.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      showSettings={false}
      showSignOut={true}
      onSignOut={handleSignOut}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Primary Admin Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your pharmacy business settings and preferences
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              className="flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => {
            const IconComponent = section.icon
            const isExpanded = expandedSections[section.id]

            return (
              <Card key={section.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardContent className="p-0">
                  {/* Section Header - Always visible */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mr-4">
                          <IconComponent className="w-5 h-5 text-pharmacy-green" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-white mb-1">
                            {section.title}
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Content - Expandable */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-600">
                      <div className="pt-6">
                        {renderSectionContent(section.id)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </Layout>
  )

  function renderSectionContent(sectionId: string) {
    switch (sectionId) {
      case 'business':
        return (
          <div className="space-y-6">
            {/* Pharmacy Business Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Pharmacy Business Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    placeholder="Your pharmacy name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pharmacy License Number
                  </label>
                  <input
                    type="text"
                    value={pharmacy?.license_number || ''}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    placeholder="License number"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to update</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    value={pharmacy?.registration_number || ''}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    placeholder="Registration number"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to update</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    License Expiration Date
                  </label>
                  <input
                    type="date"
                    value={pharmacy?.license_expiry || ''}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to update</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={businessForm.operating_hours}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, operating_hours: e.target.value }))}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Mon-Fri 9AM-6PM, Sat 9AM-2PM"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Description
                  </label>
                  <textarea
                    rows={3}
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    placeholder="Brief description of your pharmacy"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Email Address
                  </label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    placeholder="business@pharmacy.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Phone Number
                  </label>
                  <input
                    type="tel"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    placeholder="Street address, city, governorate"
                  />
                </div>
              </div>
            </div>

            {/* Anonymous Business ID */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Anonymous Business ID Display
              </h4>
              <div className="p-4 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Anonymous ID:
                  </span>
                  <span className="text-lg font-mono font-bold text-pharmacy-green">
                    {pharmacy?.display_id || 'PH000001'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This ID protects your pharmacy's identity in the marketplace. Other pharmacies will see you as "Verified Pharmacy" until transactions are approved.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={saveBusinessInfo}
                disabled={saving === 'business'}
                className="bg-pharmacy-green hover:bg-pharmacy-green/90"
              >
                {saving === 'business' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                Upload New License
              </Button>
              <Button variant="secondary">
                <Clock className="w-4 h-4 mr-2" />
                Update Operating Hours
              </Button>
            </div>
          </div>
        )

      case 'employees':
        return (
          <div className="space-y-6">
            {/* Current Team Overview */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Current Team Overview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-pharmacy-green">3</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Employees</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role Distribution</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Primary Admin</span>
                      <span>1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Co-Admin</span>
                      <span>1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Pharmacist</span>
                      <span>1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Access Controls */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Employee Access Controls
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Default Permissions for New Employees</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Staff Pharmacist - Marketplace access only</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Marketplace Access Settings</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">All employees can create listings and browse</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Financial Access Restrictions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Only Primary Admin and Co-Admins</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Modify
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Link href="/dashboard/employees">
                <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team
                </Button>
              </Link>
              <Button variant="secondary">
                <Settings className="w-4 h-4 mr-2" />
                Set Default Permissions
              </Button>
              <Button variant="secondary">
                <Activity className="w-4 h-4 mr-2" />
                Employee Activity Reports
              </Button>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            {/* Current Subscription Status */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Current Subscription Status
              </h4>
              <div className="p-4 bg-trust-blue/10 dark:bg-trust-blue/20 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Plan Type</div>
                    <div className="font-semibold text-trust-blue">Free Trial</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</div>
                    <div className="font-semibold text-alert-orange">45 days</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Billing</div>
                    <div className="font-semibold text-gray-900 dark:text-white">999 EGP</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Next Billing Date</div>
                    <div className="font-semibold text-gray-900 dark:text-white">June 24, 2025</div>
                  </div>
                </div>
              </div>
            </div>

            {/* InstaPay Withdrawal Setup */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                InstaPay Withdrawal Setup
              </h4>
              <div className="space-y-4">
                {instapayForm.setup_completed ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800 dark:text-green-400">InstaPay Configured</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Type:</span>
                        <span className="text-sm font-medium text-green-800 dark:text-green-400 capitalize">
                          {instapayForm.identifier_type?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Display Name:</span>
                        <span className="text-sm font-medium text-green-800 dark:text-green-400">
                          {instapayForm.display_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Status:</span>
                        <span className="text-sm font-medium text-green-800 dark:text-green-400">
                          {instapayForm.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-400">InstaPay Setup Required</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Configure your InstaPay withdrawal details to receive earnings from transactions.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      InstaPay Type
                    </label>
                    <select
                      value={instapayForm.identifier_type}
                      onChange={(e) => setInstapayForm(prev => ({ ...prev, identifier_type: e.target.value }))}
                      className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select InstaPay Type</option>
                      <option value="mobile">Mobile Number</option>
                      <option value="address">Payment Address</option>
                      <option value="bank">Bank Account</option>
                      <option value="wallet">Wallet Identifier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Identifier
                    </label>
                    <input
                      type="text"
                      value={instapayForm.identifier}
                      onChange={(e) => setInstapayForm(prev => ({ ...prev, identifier: e.target.value }))}
                      className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      placeholder={getInstapayPlaceholder(instapayForm.identifier_type)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={instapayForm.display_name}
                      onChange={(e) => setInstapayForm(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Main Business Account"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={saveInstapayInfo}
                  disabled={!instapayForm.identifier_type || !instapayForm.identifier || !instapayForm.display_name || saving === 'instapay'}
                  className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  {saving === 'instapay' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save InstaPay Details
                </Button>
              </div>
            </div>

            {/* Transaction Fee Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Transaction Fee Settings
              </h4>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Current Fee Structure</span>
                    <span className="text-pharmacy-green font-bold">6% total (3% each party)</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Standard marketplace fees applied to all transactions
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Fees Paid</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">0 EGP</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">0</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade to Paid Plan
              </Button>
              <Button variant="secondary">
                <Edit className="w-4 h-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="secondary">
                <FileText className="w-4 h-4 mr-2" />
                View Billing History
              </Button>
              <Button variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Download Invoices
              </Button>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            {/* Account Security */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Account Security
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Password</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Last changed 30 days ago</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {securitySettings.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                    </div>
                  </div>
                  <Button 
                    variant={securitySettings.twoFactorEnabled ? "secondary" : "default"} 
                    size="sm"
                    onClick={() => setSecuritySettings(prev => ({ 
                      ...prev, 
                      twoFactorEnabled: !prev.twoFactorEnabled 
                    }))}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Login Activity</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monitor account access</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    <Activity className="w-4 h-4 mr-2" />
                    View Login History
                  </Button>
                </div>
              </div>
            </div>

            {/* Business Privacy Controls */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Business Privacy Controls
              </h4>
              <div className="space-y-4">
                {/* Enhanced Privacy Protection - MANDATORY */}
                <div className="p-4 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg border border-pharmacy-green/30">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-pharmacy-green mr-2" />
                    <span className="font-medium text-pharmacy-green dark:text-pharmacy-green">Enhanced Privacy Protection</span>
                    <span className="ml-2 px-2 py-1 bg-pharmacy-green text-white text-xs rounded">Mandatory</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Your pharmacy identity is automatically protected throughout all marketplace activities:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-pharmacy-green rounded-full mr-2"></div>
                      <span><strong>Browsing:</strong> Shown as "Verified Pharmacy" only</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-pharmacy-green rounded-full mr-2"></div>
                      <span><strong>After Approval:</strong> Your PHxxxxx ID is revealed</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-pharmacy-green rounded-full mr-2"></div>
                      <span><strong>Never:</strong> Your real business name is revealed to competitors</span>
                    </li>
                  </ul>
                </div>

                {/* Progressive Contact Disclosure - AUTOMATIC */}
                <div className="p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Progressive Contact Disclosure
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Contact details automatically shared with PHxxxxx ID after transaction approval (required for delivery)
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 rounded text-sm font-medium">
                      Automatic
                    </span>
                  </div>
                </div>

                {/* Review Privacy - CONFIGURABLE */}
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Review Privacy</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Allow anonymous reviews of your pharmacy (both parties shown as "Verified Pharmacy")</div>
                  </div>
                  <Button 
                    variant={securitySettings.allowReviews ? "default" : "secondary"} 
                    size="sm"
                    onClick={() => setSecuritySettings(prev => ({ 
                      ...prev, 
                      allowReviews: !prev.allowReviews 
                    }))}
                  >
                    {securitySettings.allowReviews ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {/* Review Response Rights - CONFIGURABLE */}
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Review Response Rights</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Allow responding to reviews about your pharmacy (anonymously as "Verified Pharmacy")</div>
                  </div>
                  <Button 
                    variant={securitySettings.allowReviewResponses ? "default" : "secondary"} 
                    size="sm"
                    onClick={() => setSecuritySettings(prev => ({ 
                      ...prev, 
                      allowReviewResponses: !prev.allowReviewResponses 
                    }))}
                  >
                    {securitySettings.allowReviewResponses ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {/* Data Retention Preferences - CONFIGURABLE */}
                <div className="p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Data Retention Period
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">How long to keep your business transaction history and data</div>
                    </div>
                    <select 
                      value={securitySettings.dataRetentionPeriod}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        dataRetentionPeriod: e.target.value 
                      }))}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                    >
                      <option value="legal_minimum">Legal Minimum (5 years)</option>
                      <option value="extended">Extended (10 years)</option>
                      <option value="maximum">Maximum (Unlimited)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="secondary">
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button variant="secondary">
                <Shield className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
              <Button variant="secondary">
                <Activity className="w-4 h-4 mr-2" />
                View Login History
              </Button>
              <Button variant="secondary">
                <Eye className="w-4 h-4 mr-2" />
                Privacy Settings
              </Button>
            </div>
          </div>
        )

      case 'marketplace':
        return (
          <div className="space-y-6">
            {/* Search & Discovery Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Search & Discovery Settings
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Search Radius (km)
                    </label>
                    <select
                      value={marketplaceSettings.searchRadius}
                      onChange={(e) => setMarketplaceSettings(prev => ({ 
                        ...prev, 
                        searchRadius: parseInt(e.target.value) 
                      }))}
                      className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    >
                      <option value={5}>5 km</option>
                      <option value={10}>10 km (Default)</option>
                      <option value={15}>15 km</option>
                      <option value={20}>20 km</option>
                      <option value={50}>50 km</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Listing Expiration (days)
                    </label>
                    <select
                      value={marketplaceSettings.listingExpiry}
                      onChange={(e) => setMarketplaceSettings(prev => ({ 
                        ...prev, 
                        listingExpiry: parseInt(e.target.value) 
                      }))}
                      className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days (Default)</option>
                      <option value={60}>60 days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Transaction Types
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['buy', 'sell', 'trade'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={marketplaceSettings.preferredTypes.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...marketplaceSettings.preferredTypes, type]
                              : marketplaceSettings.preferredTypes.filter(t => t !== type)
                            setMarketplaceSettings(prev => ({ ...prev, preferredTypes: newTypes }))
                          }}
                          className="mr-2 rounded border-gray-300 text-pharmacy-green focus:ring-pharmacy-green"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Auto-Acceptance</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Automatically accept purchase requests</div>
                  </div>
                  <Button 
                    variant={marketplaceSettings.autoAccept ? "default" : "secondary"} 
                    size="sm"
                    onClick={() => setMarketplaceSettings(prev => ({ 
                      ...prev, 
                      autoAccept: !prev.autoAccept 
                    }))}
                  >
                    {marketplaceSettings.autoAccept ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Business Verification Display */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Business Verification Display
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800 dark:text-green-400">Verified Pharmacy</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your pharmacy verification badge will be displayed to other users
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Business Rating</div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-semibold text-gray-900 dark:text-white">New Pharmacy</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">0</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="secondary">
                <MapPin className="w-4 h-4 mr-2" />
                Update Search Radius
              </Button>
              <Button variant="secondary">
                <Filter className="w-4 h-4 mr-2" />
                Configure Auto-Accept
              </Button>
              <Button variant="secondary">
                <Package className="w-4 h-4 mr-2" />
                Listing Preferences
              </Button>
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Dashboard Customization */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart2 className="w-4 h-4 mr-2" />
                Dashboard Customization
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preferred Metrics Display
                    </label>
                    <select className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                      <option>Revenue Focus</option>
                      <option>Transaction Focus</option>
                      <option>Inventory Focus</option>
                      <option>Custom Layout</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reporting Frequency
                    </label>
                    <select className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                      <option>Daily</option>
                      <option>Weekly (Recommended)</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Report Subscriptions
                  </label>
                  {['Weekly Performance Summary', 'Monthly Financial Report', 'Inventory Alerts', 'Market Trends'].map((report) => (
                    <label key={report} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={['Weekly Performance Summary', 'Inventory Alerts'].includes(report)}
                        className="mr-2 rounded border-gray-300 text-pharmacy-green focus:ring-pharmacy-green"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{report}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Export Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Data Export Settings
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Export Format Preference
                    </label>
                    <select className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                      <option>Excel (XLSX)</option>
                      <option>PDF Report</option>
                      <option>CSV Data</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Historical Data Retention
                    </label>
                    <select className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white">
                      <option>6 Months</option>
                      <option>1 Year (Recommended)</option>
                      <option>2 Years</option>
                      <option>Unlimited</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Automatic Backup</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Weekly automatic data backup to your email</div>
                  </div>
                  <Button variant="default" size="sm">
                    Enabled
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="secondary">
                <BarChart2 className="w-4 h-4 mr-2" />
                Customize Dashboard
              </Button>
              <Button variant="secondary">
                <Settings className="w-4 h-4 mr-2" />
                Report Preferences
              </Button>
              <Button variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Business Notifications */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Business Notifications
              </h4>
              <div className="space-y-3">
                {[
                  { key: 'newTransactions', label: 'New Transaction Alerts', description: 'Get notified when someone wants to buy from you' },
                  { key: 'employeeActivity', label: 'Employee Activity Notifications', description: 'Updates when employees create listings or make transactions' },
                  { key: 'systemAnnouncements', label: 'System Announcements', description: 'Important platform updates and maintenance notices' },
                  { key: 'securityAlerts', label: 'Security Alerts', description: 'Login attempts and security-related notifications' }
                ].map((notification) => (
                  <div key={notification.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{notification.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{notification.description}</div>
                    </div>
                    <Button 
                      variant={notificationSettings[notification.key as keyof typeof notificationSettings] ? "default" : "secondary"} 
                      size="sm"
                      onClick={() => setNotificationSettings(prev => ({ 
                        ...prev, 
                        [notification.key]: !prev[notification.key as keyof typeof notificationSettings] 
                      }))}
                    >
                      {notificationSettings[notification.key as keyof typeof notificationSettings] ? 'On' : 'Off'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Preferences */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Communication Preferences
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</div>
                  </div>
                  <Button 
                    variant={notificationSettings.emailNotifications ? "default" : "secondary"} 
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({ 
                      ...prev, 
                      emailNotifications: !prev.emailNotifications 
                    }))}
                  >
                    {notificationSettings.emailNotifications ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">SMS Notifications</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Receive urgent alerts via SMS</div>
                  </div>
                  <Button 
                    variant={notificationSettings.smsNotifications ? "default" : "secondary"} 
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({ 
                      ...prev, 
                      smsNotifications: !prev.smsNotifications 
                    }))}
                  >
                    {notificationSettings.smsNotifications ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <div className="flex items-center mb-2">
                    <Info className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800 dark:text-blue-400">Emergency Contact</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Current emergency contact: {businessForm.phone || 'Not set'}
                  </p>
                  <Button variant="secondary" size="sm">
                    Update Emergency Contact
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="secondary">
                <Settings className="w-4 h-4 mr-2" />
                Notification Preferences
              </Button>
              <Button variant="secondary">
                <Bell className="w-4 h-4 mr-2" />
                Test Notifications
              </Button>
              <Button variant="secondary">
                <Mail className="w-4 h-4 mr-2" />
                Emergency Contacts
              </Button>
            </div>
          </div>
        )

      case 'verification':
        return (
          <div className="space-y-6">
            {/* Current Verification Status */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Current Verification Status
              </h4>
              {pharmacy?.verified ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      <div>
                        <div className="font-semibold text-green-800 dark:text-green-400">Verified Pharmacy</div>
                        <div className="text-sm text-green-700 dark:text-green-300">All documents approved</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-green-800 dark:text-green-400">Business License</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Verified</div>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-green-800 dark:text-green-400">Registration</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Verified</div>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-green-800 dark:text-green-400">Identity</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Verified</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Clock className="w-6 h-6 text-yellow-600 mr-3" />
                      <div>
                        <div className="font-semibold text-yellow-800 dark:text-yellow-400">Verification Pending</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">Your documents are under admin review</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                      {pharmacy?.ver_status === 'pending' ? 'Under Review' : pharmacy?.ver_status || 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Business License</div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">Under Review</div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Registration</div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">Under Review</div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Identity</div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">Under Review</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Management */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Document Management
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'Pharmacy License', type: 'pharmacy_license', expiry: '2025-12-31' },
                  { name: 'Business Registration', type: 'business_registration', expiry: null },
                  { name: 'Pharmacist Credentials', type: 'pharmacist_credentials', expiry: '2026-06-30' }
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{doc.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Uploaded: 2024-01-15
                        {doc.expiry && (
                          <span className="ml-2">• Expires: {doc.expiry}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pharmacy?.verified 
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400'
                      }`}>
                        {pharmacy?.verified ? 'Verified' : 'Under Review'}
                      </span>
                      <Button variant="secondary" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Renewal Reminders */}
            {pharmacy?.verified && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Upcoming Renewals
                </h4>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-400">Pharmacy License Renewal</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Your pharmacy license expires on December 31, 2025. We'll remind you 60 days before expiration.
                  </p>
                  <Button variant="secondary" size="sm">
                    Set Renewal Reminder
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="secondary">
                <CheckCircle className="w-4 h-4 mr-2" />
                View Verification Status
              </Button>
              <Button variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
              <Button variant="secondary">
                <Clock className="w-4 h-4 mr-2" />
                Renewal Reminders
              </Button>
            </div>
          </div>
        )

      default:
        return <div>Section content not implemented yet.</div>
    }
  }
}
