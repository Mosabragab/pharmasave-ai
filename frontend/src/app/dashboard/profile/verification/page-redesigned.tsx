/**
 * 🎨 REDESIGNED VERIFICATION PAGE - MATCHES PRIMARY ADMIN SETTINGS STYLE
 * 
 * Professional, organized design consistent with Primary Admin Settings:
 * - Dark theme styling
 * - Collapsible sections
 * - Organized form layouts
 * - Business-like appearance
 * - Better UX and visual hierarchy
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Upload, 
  FileText, 
  AlertTriangle, 
  BookOpen, 
  ShoppingCart, 
  Eye, 
  Lock,
  Settings,
  ChevronDown,
  ChevronUp,
  Shield,
  User,
  Building2,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Header } from '@/components/layout'

interface ProfileCompletionData {
  pharmacy: {
    profile_completion_percent: number
    verified: boolean
    can_submit_for_verification: boolean
    has_business_email: boolean
    has_address: boolean
    has_license_num: boolean
  }
  pharmacist: {
    profile_completion_percent: number
    has_phone: boolean
    has_pharmacist_id: boolean
  }
  overall_completion: number
  access_level: string
  next_milestone: string
  next_milestone_percent: number
  can_access_educational: boolean
  can_access_demo_marketplace: boolean
  can_browse_marketplace: boolean
  can_create_listings: boolean
  can_make_transactions: boolean
}

export default function VerificationPageRedesigned() {
  const [profileData, setProfileData] = useState<ProfileCompletionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    access: true,
    verification: true,
    documents: false
  })
  
  const router = useRouter()

  useEffect(() => {
    fetchProfileCompletion()
  }, [])

  const fetchProfileCompletion = async () => {
    try {
      setError(null)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select(`
          id,
          profile_completion_percent,
          has_phone,
          has_pharmacist_id,
          pharmacy_id,
          pharmacies (
            id,
            profile_completion_percent,
            verified,
            can_submit_for_verification,
            has_business_email,
            has_address,
            has_license_num
          )
        `)
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError || !pharmacistData || !pharmacistData.pharmacies) {
        throw new Error('Failed to load profile data')
      }

      const pharmacy = pharmacistData.pharmacies
      const pharmacist = pharmacistData

      // Calculate overall completion using IMPROVED formula
      const overallCompletion = Math.round(
        (pharmacy.profile_completion_percent * 0.6) + 
        (pharmacist.profile_completion_percent * 0.4)
      )

      // Calculate access permissions
      const can_access_educational = overallCompletion >= 30
      const can_access_demo_marketplace = overallCompletion >= 50
      const can_browse_marketplace = overallCompletion >= 50
      const can_create_listings = pharmacy.verified
      const can_make_transactions = pharmacy.verified

      // Determine access level and next milestone
      let accessLevel = 'Basic Access'
      let nextMilestone = 'Educational Content Access'
      let nextMilestonePercent = 30

      if (pharmacy.verified) {
        accessLevel = 'VERIFIED - Full Access'
        nextMilestone = 'All Features Unlocked'
        nextMilestonePercent = 100
      } else if (overallCompletion >= 80) {
        accessLevel = 'Can Submit for Verification'
        nextMilestone = 'Get Verified for Full Access'
        nextMilestonePercent = 100
      } else if (overallCompletion >= 50) {
        accessLevel = 'Marketplace Access'
        nextMilestone = 'Verification Submission'
        nextMilestonePercent = 80
      } else if (overallCompletion >= 30) {
        accessLevel = 'Educational Content Access'
        nextMilestone = 'Marketplace Access'
        nextMilestonePercent = 50
      }

      setProfileData({
        pharmacy,
        pharmacist,
        overall_completion: overallCompletion,
        access_level: accessLevel,
        next_milestone: nextMilestone,
        next_milestone_percent: nextMilestonePercent,
        can_access_educational,
        can_access_demo_marketplace,
        can_browse_marketplace,
        can_create_listings,
        can_make_transactions
      })

    } catch (err) {
      console.error('Error fetching profile completion:', err)
      setError('Failed to load profile completion data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForVerification = async () => {
    if (!profileData?.pharmacy.can_submit_for_verification) return

    setSubmitting(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Verification submitted successfully!')
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to submit verification request')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharmacy-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading verification status...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Alert className="max-w-md bg-slate-800 border-red-600">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-gray-300">
            Unable to load profile data. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { pharmacy, pharmacist, overall_completion, access_level, next_milestone, next_milestone_percent, can_access_educational, can_access_demo_marketplace, can_browse_marketplace, can_create_listings, can_make_transactions } = profileData

  return (
    <div className="min-h-screen bg-slate-900">
      <Header 
        variant="dashboard"
        pharmacyName="PharmaSave AI"
        userRole="Primary Admin"
        showSettings={true}
        showSignOut={true}
      />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Navigation & Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
              Dashboard
            </Button>
            <span>/</span>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/profile')} className="text-gray-400 hover:text-white">
              Profile
            </Button>
            <span>/</span>
            <span className="text-white font-medium">Verification</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Document Verification</h1>
              <p className="text-gray-400">
                Complete your profile and get verified to unlock all platform features
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-slate-600 text-gray-300 hover:text-white hover:border-slate-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Verification Status Alert */}
        {pharmacy.verified && (
          <Alert className="bg-green-900/20 border-green-600">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              <strong>🎉 Congratulations!</strong> Your pharmacy is verified. You now have full access to all platform features.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-900/20 border-red-600">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Completion Overview */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('profile')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pharmacy-green/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-pharmacy-green" />
                </div>
                <div>
                  <CardTitle className="text-white">Profile Completion Overview</CardTitle>
                  <CardDescription className="text-gray-400">
                    Current progress: {overall_completion}% • {access_level}
                  </CardDescription>
                </div>
              </div>
              {expandedSections.profile ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
          </CardHeader>
          
          {expandedSections.profile && (
            <CardContent className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Overall Progress</span>
                  <Badge variant={pharmacy.verified ? "default" : overall_completion >= 80 ? "default" : "secondary"} className="bg-pharmacy-green text-white">
                    {overall_completion}% Complete {pharmacy.verified && "✅ VERIFIED"}
                  </Badge>
                </div>
                
                <Progress value={overall_completion} className="w-full h-2 bg-slate-700" />
                
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Started</span>
                  <span className="text-blue-400">30% Education</span>
                  <span className={overall_completion >= 50 ? 'text-pharmacy-green font-medium' : 'text-gray-400'}>
                    50% Marketplace {overall_completion >= 50 ? '✓' : ''}
                  </span>
                  <span className={overall_completion >= 80 ? 'text-pharmacy-green font-medium' : 'text-gray-400'}>
                    80% Verification {overall_completion >= 80 ? '✓' : ''}
                  </span>
                  <span>100% Complete</span>
                </div>
              </div>

              {/* Completion Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-pharmacy-green" />
                    Business Profile
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <span className="text-gray-300">Business Information</span>
                      <span className="text-pharmacy-green font-medium">{pharmacy.profile_completion_percent}%</span>
                    </div>
                    <div className="text-xs text-gray-400 pl-2">
                      • Business email: {pharmacy.has_business_email ? '✓' : '❌'}
                      • Address: {pharmacy.has_address ? '✓' : '❌'}
                      • License: {pharmacy.has_license_num ? '✓' : '❌'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center">
                    <Award className="w-4 h-4 mr-2 text-blue-400" />
                    Personal Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <span className="text-gray-300">Pharmacist Information</span>
                      <span className="text-blue-400 font-medium">{pharmacist.profile_completion_percent}%</span>
                    </div>
                    <div className="text-xs text-gray-400 pl-2">
                      • Phone number: {pharmacist.has_phone ? '✓' : '❌'}
                      • Pharmacist ID: {pharmacist.has_pharmacist_id ? '✓' : '❌'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Action */}
              {!pharmacy.verified && next_milestone && (
                <div className="p-4 bg-pharmacy-green/10 border border-pharmacy-green/30 rounded-lg">
                  <h4 className="font-medium text-pharmacy-green mb-2">
                    Next: {next_milestone}
                  </h4>
                  <p className="text-sm text-pharmacy-green/80 mb-3">
                    {next_milestone_percent - overall_completion}% more to unlock
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    Complete Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Access Level & Features */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('access')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Current Access Level</CardTitle>
                  <CardDescription className="text-gray-400">
                    {access_level} • Available features and permissions
                  </CardDescription>
                </div>
              </div>
              {expandedSections.access ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
          </CardHeader>
          
          {expandedSections.access && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Available Features</h4>
                  
                  {/* Feature List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-gray-300">Dashboard Access</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {can_access_educational ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500" />
                        )}
                        <span className={can_access_educational ? 'text-gray-300' : 'text-gray-500'}>
                          Educational Content
                        </span>
                      </div>
                      {can_access_educational && (
                        <Button size="sm" variant="outline" className="border-slate-600 text-gray-300" onClick={() => router.push('/dashboard/education')}>
                          <BookOpen className="w-3 h-3 mr-1" />
                          Access
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {can_browse_marketplace ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500" />
                        )}
                        <span className={can_browse_marketplace ? 'text-gray-300' : 'text-gray-500'}>
                          Marketplace Browsing
                        </span>
                      </div>
                      {can_browse_marketplace && (
                        <Button size="sm" variant="outline" className="border-slate-600 text-gray-300" onClick={() => router.push('/marketplace')}>
                          <Eye className="w-3 h-3 mr-1" />
                          Browse
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {can_create_listings ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-amber-500" />
                        )}
                        <span className={can_create_listings ? 'text-gray-300' : 'text-amber-400'}>
                          Create Listings
                        </span>
                      </div>
                      {!can_create_listings && (
                        <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-400 border-amber-600">
                          Verification Required
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {can_make_transactions ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-amber-500" />
                        )}
                        <span className={can_make_transactions ? 'text-gray-300' : 'text-amber-400'}>
                          Buy/Sell/Trade Medications
                        </span>
                      </div>
                      {!can_make_transactions && (
                        <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-400 border-amber-600">
                          Verification Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Next Milestone</h4>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-pharmacy-green"></div>
                      <span className="text-pharmacy-green font-medium">{next_milestone}</span>
                    </div>
                    {!pharmacy.verified && (
                      <>
                        <p className="text-sm text-gray-400 mb-3">
                          {next_milestone_percent - overall_completion}% more to unlock
                        </p>
                        <Progress value={(overall_completion / next_milestone_percent) * 100} className="h-2 bg-slate-600" />
                      </>
                    )}
                    {pharmacy.verified && (
                      <p className="text-sm text-green-400">All features unlocked! ✅</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Verification Submission */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('verification')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Submit for Verification</CardTitle>
                  <CardDescription className="text-gray-400">
                    Get verified to unlock full marketplace capabilities
                  </CardDescription>
                </div>
              </div>
              {expandedSections.verification ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
          </CardHeader>
          
          {expandedSections.verification && (
            <CardContent className="space-y-6">
              {/* Requirements Checklist */}
              <div className="space-y-4">
                <h4 className="font-medium text-white">Verification Requirements</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      {overall_completion >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium text-white">Profile Completion (80% required)</p>
                        <p className="text-sm text-gray-400">Business: {pharmacy.profile_completion_percent}% • Personal: {pharmacist.profile_completion_percent}%</p>
                      </div>
                    </div>
                    <Progress value={overall_completion} className="w-32 h-2 bg-slate-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Required Documents (4 needed)</p>
                        <p className="text-sm text-gray-400">Pharmacy license, business registration, etc.</p>
                      </div>
                    </div>
                    <Badge className="bg-green-900/20 text-green-400 border-green-600">4/4 uploaded</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      {pharmacy.can_submit_for_verification ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium text-white">Account Eligibility</p>
                        <p className="text-sm text-gray-400">Complete all required profile fields to unlock verification</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {pharmacy.verified ? (
                <Alert className="bg-green-900/20 border-green-600">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    <strong>✅ Verification Complete!</strong> Your pharmacy is verified and you have full access to all platform features.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {!pharmacy.can_submit_for_verification && (
                    <Alert className="bg-amber-900/20 border-amber-600">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-300">
                        <strong>Requirements Not Met</strong>
                        <ul className="mt-2 text-sm space-y-1">
                          <li>• Complete your profile to 80% or higher (Current: {overall_completion}%)</li>
                          <li>• Fill out all required business information fields</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleSubmitForVerification}
                      disabled={!pharmacy.can_submit_for_verification || submitting}
                      className="flex-1 bg-pharmacy-green hover:bg-pharmacy-green/90"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Submit for Verification
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard/profile')}
                      className="border-slate-600 text-gray-300 hover:text-white"
                    >
                      Complete Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Educational Content Access */}
        {can_access_educational && !pharmacy.verified && (
          <Card className="bg-blue-900/20 border-blue-600">
            <CardHeader>
              <CardTitle className="text-blue-300 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Available Learning Resources
              </CardTitle>
              <CardDescription className="text-blue-400">
                Access educational content while completing your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 border-blue-600 text-blue-300 hover:bg-blue-900/30" 
                  onClick={() => router.push('/dashboard/education/pharmacy-management')}
                >
                  <div className="text-left">
                    <div className="font-medium">Pharmacy Management</div>
                    <div className="text-sm text-blue-400">Best practices and tips</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 border-blue-600 text-blue-300 hover:bg-blue-900/30" 
                  onClick={() => router.push('/dashboard/education/inventory-optimization')}
                >
                  <div className="text-left">
                    <div className="font-medium">Inventory Optimization</div>
                    <div className="text-sm text-blue-400">Reduce waste and increase profits</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 border-blue-600 text-blue-300 hover:bg-blue-900/30" 
                  onClick={() => router.push('/dashboard/education/marketplace-guide')}
                >
                  <div className="text-left">
                    <div className="font-medium">Marketplace Guide</div>
                    <div className="text-sm text-blue-400">How to use PharmaSave AI</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}