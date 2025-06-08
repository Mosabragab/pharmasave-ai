/**
 * 🎯 REDESIGNED PROFILE COMPLETION PAGE
 * 
 * Completely redesigned to match settings page style:
 * - Clean expandable card sections
 * - Professional business appearance
 * - Consistent with verification page design
 * - Organized information architecture
 * - Better user experience and flow
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Layout from '@/components/layout/Layout'
import { 
  User, 
  Building2,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Award,
  Settings,
  Mail,
  Shield,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  Star,
  Target
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  email: string | null
  phone: string | null
  addr: string | null
  license_num: string | null
  status: string
  verified: boolean
  profile_completion_percent: number
  has_license_num: boolean
  has_business_email: boolean
  has_address: boolean
  has_location: boolean
  has_primary_pharmacist_id: boolean
  can_submit_for_verification: boolean
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  email: string
  phone: string | null
  pharmacist_id_num: string | null
  role: string
  profile_completion_percent: number
  has_phone: boolean
  has_pharmacist_id: boolean
}

interface CompletionStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  completed: boolean
  points: number
  route: string
  category: 'basic' | 'contact' | 'business' | 'verification'
  required: boolean
}

interface ProfileSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  expanded: boolean
}

export default function ProfileCompletionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)
  
  // Expandable sections state (like settings page)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    basic: false,
    contact: false,
    business: false,
    verification: false
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

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

  const getCompletionSteps = (): CompletionStep[] => {
    if (!pharmacy || !pharmacist) return []
    
    return [
      // BASIC INFORMATION (Always completed)
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Pharmacy name, your name, email',
        icon: User,
        completed: true, // Always completed after registration
        points: 15,
        route: '/dashboard/profile/basic',
        category: 'basic',
        required: true
      },

      // CONTACT INFORMATION
      {
        id: 'personal_phone',
        title: 'Personal Phone Number',
        description: 'Your personal contact number',
        icon: Phone,
        completed: pharmacist.has_phone,
        points: 10,
        route: '/dashboard/profile/contact',
        category: 'contact',
        required: false
      },
      {
        id: 'business_email',
        title: 'Business Email',
        description: 'Pharmacy business email address',
        icon: Mail,
        completed: pharmacy.has_business_email,
        points: 10,
        route: '/dashboard/profile/contact',
        category: 'contact',
        required: true
      },
      {
        id: 'business_phone',
        title: 'Business Phone',
        description: 'Pharmacy business phone number',
        icon: Phone,
        completed: !!pharmacy.phone,
        points: 10,
        route: '/dashboard/profile/contact',
        category: 'contact',
        required: true
      },
      {
        id: 'business_address',
        title: 'Business Address',
        description: 'Physical pharmacy location',
        icon: MapPin,
        completed: pharmacy.has_address,
        points: 15,
        route: '/dashboard/profile/contact',
        category: 'contact',
        required: true
      },

      // BUSINESS DETAILS
      {
        id: 'pharmacist_credentials',
        title: 'Pharmacist Credentials',
        description: 'Your professional pharmacist ID',
        icon: Award,
        completed: pharmacist.has_pharmacist_id,
        points: 10,
        route: '/dashboard/profile/business',
        category: 'business',
        required: true
      },
      {
        id: 'pharmacy_license',
        title: 'Pharmacy License',
        description: 'Business license number and details',
        icon: FileText,
        completed: pharmacy.has_license_num,
        points: 15,
        route: '/dashboard/profile/business',
        category: 'business',
        required: true
      },

      // VERIFICATION
      {
        id: 'document_upload',
        title: 'Document Verification',
        description: 'Upload required verification documents',
        icon: Shield,
        completed: pharmacy.verified,
        points: 25,
        route: '/dashboard/profile/verification',
        category: 'verification',
        required: true
      }
    ]
  }

  const getOverallProgress = () => {
    if (!pharmacy || !pharmacist) return 0
    
    // Use the IMPROVED calculation formula (consistent with verification page)
    const pharmacyCompletion = pharmacy.profile_completion_percent || 15
    const pharmacistCompletion = pharmacist.profile_completion_percent || 60
    
    // More balanced: 60% pharmacy + 40% pharmacist (was 70/30)
    return Math.round((pharmacyCompletion * 0.6) + (pharmacistCompletion * 0.4))
  }

  const getNextStep = () => {
    const steps = getCompletionSteps()
    return steps.find(step => !step.completed)
  }

  const getStepsByCategory = () => {
    const steps = getCompletionSteps()
    return {
      basic: steps.filter(s => s.category === 'basic'),
      contact: steps.filter(s => s.category === 'contact'),
      business: steps.filter(s => s.category === 'business'),
      verification: steps.filter(s => s.category === 'verification')
    }
  }

  const getCategoryProgress = (category: keyof ReturnType<typeof getStepsByCategory>) => {
    const steps = getStepsByCategory()
    const categorySteps = steps[category]
    if (categorySteps.length === 0) return 100
    
    const completedSteps = categorySteps.filter(s => s.completed).length
    return Math.round((completedSteps / categorySteps.length) * 100)
  }

  const getAccessLevel = () => {
    const overallProgress = getOverallProgress()
    
    if (overallProgress >= 100) {
      return {
        level: 'Full Access',
        description: 'All features unlocked',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: CheckCircle
      }
    } else if (overallProgress >= 50) {  // FIXED: Changed from 70% to 50%
      return {
        level: 'Marketplace Ready',
        description: 'Can browse and create listings',
        color: 'text-pharmacy-green',
        bgColor: 'bg-pharmacy-green/10 dark:bg-pharmacy-green/20',
        icon: Award
      }
    } else if (overallProgress >= 30) {
      return {
        level: 'Basic Access',
        description: 'Dashboard and profile editing',
        color: 'text-alert-orange',
        bgColor: 'bg-alert-orange/10 dark:bg-alert-orange/20',
        icon: Clock
      }
    } else {
      return {
        level: 'Limited Access',
        description: 'Complete profile to unlock features',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        icon: AlertCircle
      }
    }
  }

  if (isLoading) {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
              <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!pharmacy || !pharmacist) {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Unable to Load Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't load your profile information. Please try again.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const overallProgress = getOverallProgress()
  const nextStep = getNextStep()
  const accessLevel = getAccessLevel()
  const stepsByCategory = getStepsByCategory()
  const AccessIcon = accessLevel.icon

  // Define profile sections (like settings page)
  const profileSections: ProfileSection[] = [
    {
      id: 'overview',
      title: 'Profile Overview',
      description: 'Overall progress and next steps',
      icon: User,
      expanded: expandedSections.overview
    },
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Essential account and pharmacy details',
      icon: User,
      expanded: expandedSections.basic
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'Business and personal contact details',
      icon: Phone,
      expanded: expandedSections.contact
    },
    {
      id: 'business',
      title: 'Business Details',
      description: 'Professional credentials and licenses',
      icon: Building2,
      expanded: expandedSections.business
    },
    {
      id: 'verification',
      title: 'Document Verification',
      description: 'Upload and verify required documents',
      icon: Shield,
      expanded: expandedSections.verification
    }
  ]

  return (
    <Layout 
      variant="dashboard"
      pharmacyName={pharmacy.name}
      userRole={pharmacist.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      showSettings={true}
      showSignOut={true}
      onSignOut={handleSignOut}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Your Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Unlock all platform features by completing your pharmacy profile
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

        {/* Profile Sections */}
        <div className="space-y-6">
          {profileSections.map((section) => {
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
                        {/* Progress indicator for each section */}
                        {section.id !== 'overview' && (
                          <div className="mr-4 text-right">
                            <div className="text-sm font-medium text-pharmacy-green">
                              {section.id === 'basic' ? '100%' :
                               section.id === 'contact' ? `${getCategoryProgress('contact')}%` :
                               section.id === 'business' ? `${getCategoryProgress('business')}%` :
                               section.id === 'verification' ? (pharmacy.verified ? '100%' : '0%') : '0%'}
                            </div>
                            <div className="text-xs text-gray-500">Complete</div>
                          </div>
                        )}
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
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="p-4 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg border border-pharmacy-green/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-pharmacy-green/20 rounded-full flex items-center justify-center mr-3">
                    <AccessIcon className="h-5 w-5 text-pharmacy-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pharmacy-green">
                      Profile Completion: {overallProgress}%
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {accessLevel.description}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg ${accessLevel.bgColor}`}>
                  <div className={`font-medium ${accessLevel.color}`}>
                    {accessLevel.level}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <Progress value={overallProgress} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Started</span>
                  <span className={overallProgress >= 50 ? 'text-pharmacy-green font-medium' : ''}>
                    50% Marketplace {overallProgress >= 50 ? '✓' : ''}
                  </span>
                  <span className={overallProgress >= 80 ? 'text-pharmacy-green font-medium' : ''}>
                    80% Verification {overallProgress >= 80 ? '✓' : ''}
                  </span>
                  <span>100% Complete</span>
                </div>
              </div>

              {/* Next Action */}
              {nextStep && (
                <div className="p-4 bg-white dark:bg-slate-700 rounded border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        Next: {nextStep.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {nextStep.description} • +{nextStep.points}% completion
                      </p>
                    </div>
                    <Link href={nextStep.route}>
                      <Button size="sm" className="bg-pharmacy-green hover:bg-pharmacy-green/90">
                        Complete Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {overallProgress >= 100 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-400">
                        🎉 Profile Complete!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        All features unlocked. You can now access the full marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'basic':
        return (
          <div className="space-y-4">
            {stepsByCategory.basic.map((step) => {
              const IconComponent = step.icon
              return (
                <div key={step.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                  <div className="flex items-center">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {step.title}
                        {step.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">+{step.points}%</span>
                    <Link href={step.route}>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            <div className="mt-4">
              <Link href="/dashboard/profile/basic">
                <Button className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90">
                  Complete Basic Information
                </Button>
              </Link>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-4">
            {stepsByCategory.contact.map((step) => (
              <Link key={step.id} href={step.route}>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {step.title}
                        {step.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">+{step.points}%</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
            <div className="mt-4">
              <Link href="/dashboard/profile/contact">
                <Button className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90">
                  Complete Contact Information
                </Button>
              </Link>
            </div>
          </div>
        )

      case 'business':
        return (
          <div className="space-y-4">
            {stepsByCategory.business.map((step) => (
              <Link key={step.id} href={step.route}>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {step.title}
                        {step.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">+{step.points}%</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
            <div className="mt-4">
              <Link href="/dashboard/profile/business">
                <Button className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90">
                  Complete Business Details
                </Button>
              </Link>
            </div>
          </div>
        )

      case 'verification':
        return (
          <div className="space-y-4">
            {stepsByCategory.verification.map((step) => (
              <Link key={step.id} href={step.route}>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {step.title}
                        {step.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">+{step.points}%</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
            
            <div className="mt-4">
              {pharmacy.can_submit_for_verification ? (
                <Link href="/dashboard/profile/verification">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Submit for Verification
                  </Button>
                </Link>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Info className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-400">Requirements Not Met</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Complete 80% of your profile to submit for verification. Current: {overallProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      
      default:
        return <div>Section content not implemented yet.</div>
    }
  }
}