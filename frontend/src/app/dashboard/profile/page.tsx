'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { EGYPT_PHONE, EGYPT_ADDRESS } from '@/constants/regional'
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Upload, 
  ArrowRight, 
  ShoppingBag,
  Eye,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Edit3
} from 'lucide-react'

// 🎯 CLEAN 4-STAGE PROGRESS SYSTEM
// Fixes the confusing 77% issue with clear stage progression
// Database functions remain unchanged for permissions and logic
const getCleanDisplayProgress = (pharmacy: any, pharmacist: any) => {
  if (!pharmacy || !pharmacist) return 0
  
  // Stage 4: Verified (100%) - After admin approval
  if (pharmacy.verified) {
    return 100
  }
  
  // Stage 3: Business Details (75%) - Need license + pharmacist ID  
  if (pharmacy.license_num && pharmacist.pharmacist_id_num) {
    return 75
  }
  
  // Stage 2: Contact Info (50%) - Need business email + address + personal phone
  if (pharmacy.email && pharmacy.addr && pharmacist.phone) {
    return 50
  }
  
  // Stage 1: Basic Info (25%) - Always complete after registration
  return 25
}

// Types
interface Pharmacy {
  id: string
  display_id: string
  name: string
  email?: string
  phone?: string
  addr?: string
  license_num?: string
  verified: boolean
  ver_status?: 'unverified' | 'pending' | 'approved' | 'rejected' | 'expired'  // Proper enum typing
  profile_completion_percent: number
  can_submit_for_verification: boolean
  updated_at?: string
}

interface Pharmacist {
  id: string
  fname: string
  lname: string
  email: string
  phone?: string
  pharmacist_id_num?: string
  role: string
  is_primary: boolean
}

interface UploadedDocument {
  id: string
  document_type: string
  file_path: string
  file_name: string
  file_size?: number
  mime_type?: string
  status: string
  uploaded_at: string
  notes?: string
}

// 🎯 NEW: Modal Component for Clean Editing
const EditModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

const ProfilePage: React.FC = () => {
  const router = useRouter()
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null)
  const [pharmacist, setPharmacist] = useState<Pharmacist | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [loading, setLoading] = useState(true)
  
  // 🎯 NEW: Modal states instead of inline forms
  const [showContactModal, setShowContactModal] = useState(false)
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({})

  // 🎯 GET DISPLAY PROGRESS (Clean 4-Stage: 25%, 50%, 75%, 100%)
  const getDisplayProgress = () => {
    return getCleanDisplayProgress(pharmacy, pharmacist)
  }

  // 🎯 GET DATABASE PROGRESS (For logic and permissions)
  const getDatabaseProgress = () => {
    return pharmacy?.profile_completion_percent || 0
  }

  // 🎯 CLEAN ACCESS LEVELS - FIXED FOR 4-STAGE SYSTEM
  const getAccessLevel = () => {
    const progress = getDisplayProgress() // Use clean display progress
    console.log('📊 Progress:', progress, '| Verified:', pharmacy?.verified, '| Status:', pharmacy?.ver_status)
    
    // Check if verification is pending
    if (pharmacy?.ver_status === 'pending') {
      console.log('⏳ Returning pending status')
      return {
        level: 'Stage 4: Under Review ⏳',
        description: 'Verification submitted • Admin reviewing your documents',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        icon: Upload,
        action: 'waiting',
        actionText: 'Awaiting Review',
        actionIcon: Upload
      }
    }
    
    if (progress === 100) {
      console.log('✅ Returning marketplace action for 100% progress')
      return {
        level: 'Stage 4: Verified! ✅',
        description: 'All features unlocked • Full marketplace access',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: CheckCircle,
        action: 'marketplace',
        actionText: 'Browse Marketplace',
        actionIcon: ShoppingBag
      }
    } else if (progress === 75) {
      // Check if documents are uploaded
      const requiredDocs = ['pharmacy_license', 'business_registration', 'pharmacist_credentials']
      const hasAllDocs = requiredDocs.every(type => 
        uploadedDocuments.some(doc => doc.document_type === type)
      )
      
      if (hasAllDocs) {
        return {
          level: 'Stage 3: Ready to Submit! 🚀',
          description: 'Documents uploaded • Submit for admin review',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          icon: Upload,
          action: 'submit',
          actionText: 'Submit for Verification',
          actionIcon: ArrowRight
        }
      } else {
        return {
          level: 'Stage 3: Upload Documents 💾',
          description: 'Business details complete • Upload verification documents',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          icon: Upload,
          action: 'upload',
          actionText: 'Upload Documents',
          actionIcon: Upload
        }
      }
    } else if (progress === 50) {
      return {
        level: 'Stage 2: Add Business Details 🏢',
        description: 'Contact info complete • Add business license & pharmacist ID',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        icon: Building2,
        action: 'business',
        actionText: 'Complete Business Details',
        actionIcon: ArrowRight
      }
    } else if (progress === 25) {
      return {
        level: 'Stage 1: Add Contact Info 📞',
        description: 'Basic info complete • Add contact information',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        icon: Phone,
        action: 'contact',
        actionText: 'Add Contact Info',
        actionIcon: ArrowRight
      }
    } else {
      return {
        level: 'Getting Started 🚀',
        description: 'Complete your profile step by step',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        icon: User,
        action: 'basic',
        actionText: 'Start Profile',
        actionIcon: ArrowRight
      }
    }
  }

  const handleBusinessUpdate = async (businessData: any) => {
    setUpdating(true)
    try {
      // Update pharmacy license
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          license_num: businessData.pharmacyLicense,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy?.id)

      if (pharmacyError) throw pharmacyError

      // Update pharmacist ID
      const { error: pharmacistError } = await supabase
        .from('pharmacists')
        .update({
          pharmacist_id_num: businessData.pharmacistId,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacist?.id)

      if (pharmacistError) throw pharmacistError

      toast.success('✅ Business details updated successfully!')
      setShowBusinessModal(false)
      loadProfileData() // Refresh data
    } catch (error: any) {
      console.error('Error updating business details:', error)
      toast.error('Failed to update business details')
    } finally {
      setUpdating(false)
    }
  }

  // 🎯 CLEAN STAGE INDICATORS
  const getStageStatus = () => {
    const progress = getDisplayProgress() // Use clean display progress
    
    return {
      stage1: { complete: progress >= 25, current: progress === 25 },
      stage2: { complete: progress >= 50, current: progress === 50 },
      stage3: { complete: progress >= 75, current: progress === 75 },
      stage4: { complete: progress === 100, current: false }
    }
  }

  // 🎯 CAN UPLOAD DOCUMENTS? (Fixed - Use actual 75% progress logic)
  // 🛠️ SUSTAINABLE FIX: Checks actual data instead of database flag to ensure
  //    consistent behavior when users reach 75% (license_num + pharmacist_id_num)
  const canUploadDocuments = () => {
    // Check actual progress: Need 75% (both license_num and pharmacist_id_num) and not already verified
    const hasRequiredData = pharmacy?.license_num && pharmacist?.pharmacist_id_num
    return hasRequiredData && !pharmacy?.verified && pharmacy?.ver_status !== 'pending'
  }

  // 🎯 CAN SUBMIT FOR VERIFICATION? (Fixed - Use actual 75% progress + document check)
  // 🛠️ SUSTAINABLE FIX: Consistent with canUploadDocuments() - checks real data
  const canSubmitForVerification = () => {
    // Must have 75% progress (business details complete)
    const hasRequiredData = pharmacy?.license_num && pharmacist?.pharmacist_id_num
    if (!hasRequiredData) return false
    
    // Can't submit if already verified or pending
    if (pharmacy?.verified || pharmacy?.ver_status === 'pending') return false
    
    const requiredDocs = ['pharmacy_license', 'business_registration', 'pharmacist_credentials']
    const hasAllDocs = requiredDocs.every(type => 
      uploadedDocuments.some(doc => doc.document_type === type)
    )
    
    return hasAllDocs
  }

  // Load data
  useEffect(() => {
    loadProfileData()
    fetchUploadedDocuments()
  }, [])

  // Track pharmacy state changes for UI updates
  useEffect(() => {
    // Re-render when verification status changes
  }, [pharmacy?.ver_status, pharmacy?.verified, uploadedDocuments])

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get pharmacist data
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError) throw pharmacistError

      // Get pharmacy data with explicit field selection
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select(`
          id,
          display_id,
          name,
          email,
          phone,
          addr,
          license_num,
          verified,
          ver_status,
          profile_completion_percent,
          can_submit_for_verification,
          updated_at
        `)
        .eq('id', pharmacistData.pharmacy_id)
        .single()

      if (pharmacyError) throw pharmacyError

      setPharmacist(pharmacistData)
      setPharmacy(pharmacyData)

    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUploadedDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: pharmacistData } = await supabase
        .from('pharmacists')
        .select('pharmacy_id')
        .eq('auth_id', user.id)
        .single()

      if (!pharmacistData) return

      const { data: documents, error } = await supabase
        .from('pharmacy_documents')
        .select('*')
        .eq('pharmacy_id', pharmacistData.pharmacy_id)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      setUploadedDocuments(documents || [])
    } catch (error: any) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleActionClick = () => {
    const accessLevel = getAccessLevel()
    console.log('🔍 Button clicked! Action:', accessLevel.action)
    
    switch (accessLevel.action) {
      case 'contact':
        console.log('📞 Opening contact modal')
        setShowContactModal(true)
        break
      case 'business':
        console.log('🏢 Opening business modal')
        setShowBusinessModal(true)
        break
      case 'marketplace':
        console.log('🛒 Navigating to marketplace: /marketplace')
        router.push('/marketplace')
        break
      case 'submit':
        console.log('📋 Submitting for verification')
        handleSubmitForVerification()
        break
      default:
        console.log('❓ Unknown action:', accessLevel.action)
        break
    }
  }

  const handleSubmitForVerification = async () => {
    if (!canSubmitForVerification()) {
      toast.error('Please upload all required documents first')
      return
    }

    try {
      
      // Update pharmacy status - database trigger will handle queue creation
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          ver_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy?.id)
        .select()

      if (pharmacyError) {
        console.error('Pharmacy update error:', pharmacyError)
        throw pharmacyError
      }

      toast.success('🎉 Verification submitted! We will review your documents within 24-48 hours.')
      
      // Force refresh the data
      await Promise.all([
        loadProfileData(),
        fetchUploadedDocuments()
      ])
      
    } catch (error: any) {
      console.error('Error submitting verification:', error)
      toast.error(`Failed to submit verification: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDocumentDelete = async (documentType: string) => {
    const document = uploadedDocuments.find(doc => doc.document_type === documentType)
    if (!document) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pharmacy-documents')
        .remove([document.file_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('pharmacy_documents')
        .delete()
        .eq('id', document.id)

      if (dbError) throw dbError

      toast.success(`🗑️ ${getDocumentDisplayName(documentType)} deleted successfully!`)
      fetchUploadedDocuments() // Refresh documents list
      loadProfileData() // Refresh profile data
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(`Delete failed: ${error.message}`)
    }
  }

  const getDocumentDisplayName = (documentType: string): string => {
    const displayNames: Record<string, string> = {
      'pharmacy_license': 'Pharmacy License',
      'business_registration': 'Business Registration',
      'pharmacist_credentials': 'Pharmacist Credentials',
      'identity_verification': 'Identity Verification'
    }
    return displayNames[documentType] || documentType
  }

  // 🎯 NEW: Modal form update functions
  const handleContactUpdate = async (contactData: any) => {
    setUpdating(true)
    try {
      // Update pharmacy contact info
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          email: contactData.businessEmail,
          phone: contactData.businessPhone,
          addr: contactData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy?.id)

      if (pharmacyError) throw pharmacyError

      // Update pharmacist personal phone
      const { error: pharmacistError } = await supabase
        .from('pharmacists')
        .update({
          phone: contactData.personalPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacist?.id)

      if (pharmacistError) throw pharmacistError

      toast.success('✅ Contact information updated successfully!')
      setShowContactModal(false)
      loadProfileData() // Refresh data
    } catch (error: any) {
      console.error('Error updating contact info:', error)
      toast.error('Failed to update contact information')
    } finally {
      setUpdating(false)
    }
  }

  // 🎯 RESTORED: Working Document Upload System
  const handleDocumentUpload = async (files: File[], documentType: string) => {
    if (files.length === 0) return
    
    const file = files[0]
    setUploadingFiles(prev => ({ ...prev, [documentType]: true }))

    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, JPG, and PNG files are allowed')
      }

      // Generate file path
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `verification/${pharmacy.display_id}/${documentType}/${timestamp}_${sanitizedFileName}`
      

      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('pharmacy-documents')
        .upload(fileName, file)

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Create public URL
      const { data: urlData } = supabase.storage
        .from('pharmacy-documents')
        .getPublicUrl(data.path)

      // Save to database
      const documentData = {
        pharmacy_id: pharmacy?.id,
        document_type: documentType,
        file_path: data.path,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded'
      }
      
      const { data: insertedData, error: updateError } = await supabase
        .from('pharmacy_documents')
        .insert(documentData)
        .select()

      if (updateError) {
        console.error('Database error:', updateError)
        // Clean up uploaded file
        await supabase.storage
          .from('pharmacy-documents')
          .remove([data.path])
        throw new Error(`Database error: ${updateError.message}`)
      }
      toast.success(`🎉 ${file.name} uploaded successfully!`)
      
      // Refresh data
      await Promise.all([
        fetchUploadedDocuments(),
        loadProfileData()
      ])
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }))
    }
  }

  // 🎯 CLEAN STAGE PROGRESS BAR - FIXED VISUAL INDICATORS
  const StageProgressBar = () => {
    const progress = getDisplayProgress() // Use clean display progress
    const currentStage = progress === 100 ? 4 : progress === 75 ? 3 : progress === 50 ? 2 : 1
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Completion Progress
          </span>
          <span className="text-sm font-bold text-pharmacy-green">
            Stage {currentStage} of 4 • {progress}%
          </span>
        </div>
        
        <div className="flex space-x-2 mb-4">
          {[1, 2, 3, 4].map((stage) => {
            const stageProgress = stage * 25
            const isComplete = progress >= stageProgress
            const isCurrent = progress === stageProgress - 25 || (stage === 1 && progress === 25)
            
            return (
              <div
                key={stage}
                className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                  isComplete 
                    ? 'bg-pharmacy-green shadow-sm' 
                    : isCurrent 
                      ? 'bg-pharmacy-green/60 animate-pulse' 
                      : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )
          })}
        </div>
        
        <div className="flex justify-between text-xs">
          <span className={`font-medium transition-colors ${
            progress >= 25 ? 'text-pharmacy-green' : 'text-gray-500 dark:text-gray-400'
          }`}>
            ✅ Basic Info
          </span>
          <span className={`font-medium transition-colors ${
            progress >= 50 ? 'text-pharmacy-green' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {progress >= 50 ? '✅' : '📞'} Contact
          </span>
          <span className={`font-medium transition-colors ${
            progress >= 75 ? 'text-pharmacy-green' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {progress >= 75 ? '✅' : '🏢'} Business
          </span>
          <span className={`font-medium transition-colors ${
            progress >= 100 ? 'text-pharmacy-green' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {progress >= 100 ? '✅' : '💾'} Verified
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header variant="dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!pharmacy || !pharmacist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header variant="dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load profile data</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const progress = getDisplayProgress() // Use clean display progress for UI
  const accessLevel = getAccessLevel()
  const AccessIcon = accessLevel.icon
  const ActionIcon = accessLevel.actionIcon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header 
        variant="dashboard"
        pharmacyName={pharmacy.name}
        pharmacyId={pharmacy.display_id}
        userRole={pharmacist.role.replace('_', ' ')}
        showSettings={true}
        showSignOut={true}
      />
      
      {/* 🎯 FIXED: Consistent Layout with Dashboard + Back Button */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* 🎯 NEW: Back to Dashboard Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-6 w-6 mr-2 text-pharmacy-green" />
              Profile Overview
            </CardTitle>
            <CardDescription>
              Complete your profile to unlock all platform features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg border border-pharmacy-green/30">
              <StageProgressBar />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-pharmacy-green/20 rounded-full flex items-center justify-center mr-3">
                    <AccessIcon className="h-5 w-5 text-pharmacy-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pharmacy-green">
                      {accessLevel.level}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {accessLevel.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-pharmacy-green">
                    {progress}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Stage {Math.min(Math.floor(progress / 25) + (progress % 25 > 0 ? 1 : 0), 4)}/4
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded border">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Next Step
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {accessLevel.description}
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    console.log('🎯 BUTTON CLICKED - handleActionClick called')
                    handleActionClick()
                  }}
                  className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                  disabled={false}
                >
                  <ActionIcon className="w-4 h-4 mr-2" />
                  {accessLevel.actionText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 NEW: Sequential Section Layout */}
        <div className="space-y-8">
          
          {/* Stage 1: Basic Information */}
          <Card className="relative">
            <div className="absolute -left-4 top-6 w-8 h-8 bg-pharmacy-green rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <CardHeader className="pl-8">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-pharmacy-green" />
                Basic Information
                <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
              </CardTitle>
              <CardDescription>
                Your account and pharmacy basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pharmacy Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{pharmacy.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Name</label>
                    <p className="text-gray-900 dark:text-white">{pharmacist.fname} {pharmacist.lname}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-gray-900 dark:text-white">{pharmacist.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <p className="text-gray-900 dark:text-white capitalize">{pharmacist.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stage 2: Contact Information */}
          <Card className="relative">
            <div className={`absolute -left-4 top-6 w-8 h-8 rounded-full flex items-center justify-center ${
              progress >= 50 ? 'bg-pharmacy-green' : 'bg-gray-300'
            }`}>
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <CardHeader className="pl-8">
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-pharmacy-green" />
                Contact Information
                {pharmacy.email && pharmacy.addr && pharmacist.phone ? (
                  <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                ) : (
                  <div className="ml-auto text-orange-500 text-xs bg-orange-100 px-2 py-1 rounded">Incomplete</div>
                )}
              </CardTitle>
              <CardDescription>
                Business and personal contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Email</label>
                    <p className="text-gray-900 dark:text-white">{pharmacy.email || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Phone</label>
                    <p className="text-gray-900 dark:text-white">{pharmacy.phone || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Personal Phone</label>
                    <p className="text-gray-900 dark:text-white">{pharmacist.phone || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                    <p className="text-gray-900 dark:text-white">{pharmacy.addr || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Update Contact Information
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stage 3: Business Details */}
          <Card className="relative">
            <div className={`absolute -left-4 top-6 w-8 h-8 rounded-full flex items-center justify-center ${
              progress >= 75 ? 'bg-pharmacy-green' : 'bg-gray-300'
            }`}>
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <CardHeader className="pl-8">
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-pharmacy-green" />
                Business Details
                {pharmacy.license_num && pharmacist.pharmacist_id_num ? (
                  <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                ) : (
                  <div className="ml-auto text-orange-500 text-xs bg-orange-100 px-2 py-1 rounded">Incomplete</div>
                )}
              </CardTitle>
              <CardDescription>
                Official pharmacy and pharmacist credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pharmacy License</label>
                    <p className="text-gray-900 dark:text-white font-mono">{pharmacy.license_num || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pharmacist ID</label>
                    <p className="text-gray-900 dark:text-white font-mono">{pharmacist.pharmacist_id_num || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display ID</label>
                    <p className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded">{pharmacy.display_id}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBusinessModal(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Update Business Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stage 4: Document Verification */}
          <Card className="relative">
            <div className={`absolute -left-4 top-6 w-8 h-8 rounded-full flex items-center justify-center ${
              progress >= 100 ? 'bg-pharmacy-green' : progress >= 75 ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <CardHeader className="pl-8">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-pharmacy-green" />
                Document Verification
                {pharmacy.verified ? (
                  <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                ) : pharmacy?.ver_status === 'pending' ? (
                  <div className="ml-auto text-yellow-600 text-xs bg-yellow-100 px-2 py-1 rounded flex items-center gap-1">
                    <div className="animate-pulse w-2 h-2 bg-yellow-600 rounded-full"></div>
                    Under Review
                  </div>
                ) : (
                  <div className={`ml-auto text-xs px-2 py-1 rounded ${
                    canUploadDocuments() 
                      ? 'text-blue-600 bg-blue-100' 
                      : 'text-gray-500 bg-gray-100'
                  }`}>
                    {canUploadDocuments() ? 'Ready' : 'Locked'}
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Upload verification documents for admin review
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-8">
              {!canUploadDocuments() && (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Complete Previous Steps
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Finish your contact and business information to unlock document uploads
                  </p>
                  <div className="text-sm text-gray-500 bg-white dark:bg-slate-700 p-3 rounded border">
                    Current Progress: {progress}% • Need pharmacy license & pharmacist ID to unlock uploads
                  </div>
                </div>
              )}

              {canUploadDocuments() && (
                <div className="space-y-6">
                  {/* Document Upload Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Pharmacy License Upload */}
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-pharmacy-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Building2 className="h-6 w-6 text-pharmacy-green" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Pharmacy License
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Official operating license
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-2">
                          {uploadedDocuments.filter(d => d.document_type === 'pharmacy_license').length > 0 ? '✅ Uploaded' : '📋 Required'}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length > 0) {
                              handleDocumentUpload(files, 'pharmacy_license')
                            }
                          }}
                          className="hidden"
                          id="pharmacy-license-upload"
                        />
                        <label 
                          htmlFor="pharmacy-license-upload"
                          className="inline-flex items-center px-3 py-2 bg-pharmacy-green text-white rounded text-sm hover:bg-pharmacy-green/90 cursor-pointer transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {uploadedDocuments.filter(d => d.document_type === 'pharmacy_license').length > 0 ? 'Replace' : 'Upload'}
                        </label>
                        {uploadingFiles['pharmacy_license'] && (
                          <div className="mt-2 text-xs text-pharmacy-green">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pharmacy-green mx-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Business Registration Upload */}
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Business Registration
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Commercial certificate
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-2">
                          {uploadedDocuments.filter(d => d.document_type === 'business_registration').length > 0 ? '✅ Uploaded' : '📋 Required'}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length > 0) {
                              handleDocumentUpload(files, 'business_registration')
                            }
                          }}
                          className="hidden"
                          id="business-registration-upload"
                        />
                        <label 
                          htmlFor="business-registration-upload"
                          className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 cursor-pointer transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {uploadedDocuments.filter(d => d.document_type === 'business_registration').length > 0 ? 'Replace' : 'Upload'}
                        </label>
                        {uploadingFiles['business_registration'] && (
                          <div className="mt-2 text-xs text-blue-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pharmacist Credentials Upload */}
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <User className="h-6 w-6 text-purple-500" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Pharmacist Credentials
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Professional license
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-2">
                          {uploadedDocuments.filter(d => d.document_type === 'pharmacist_credentials').length > 0 ? '✅ Uploaded' : '📋 Required'}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length > 0) {
                              handleDocumentUpload(files, 'pharmacist_credentials')
                            }
                          }}
                          className="hidden"
                          id="pharmacist-credentials-upload"
                        />
                        <label 
                          htmlFor="pharmacist-credentials-upload"
                          className="inline-flex items-center px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 cursor-pointer transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {uploadedDocuments.filter(d => d.document_type === 'pharmacist_credentials').length > 0 ? 'Replace' : 'Upload'}
                        </label>
                        {uploadingFiles['pharmacist_credentials'] && (
                          <div className="mt-2 text-xs text-purple-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  {uploadedDocuments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-pharmacy-green mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getDocumentDisplayName(doc.document_type)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {doc.file_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                                doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {doc.status}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentDelete(doc.document_type)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button or Status */}
                  {pharmacy?.ver_status === 'pending' ? (
                    <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1 flex items-center gap-2">
                            <div className="animate-pulse w-3 h-3 bg-yellow-500 rounded-full"></div>
                            ⏳ Verification Under Review
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your documents are being reviewed by our admin team. We'll notify you within 24-48 hours.
                          </p>
                        </div>
                        <div className="text-yellow-600 bg-yellow-100 px-3 py-2 rounded-lg">
                          <div className="text-sm font-medium">Submitted</div>
                          <div className="text-xs">Awaiting Review</div>
                        </div>
                      </div>
                    </div>
                  ) : canSubmitForVerification() ? (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            🎉 Ready for Verification!
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            All required documents uploaded. Submit for admin review.
                          </p>
                        </div>
                        <Button 
                          onClick={handleSubmitForVerification}
                          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit for Verification
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Modal */}
        <EditModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          title="Update Contact Information"
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const contactData = {
                businessEmail: formData.get('businessEmail') as string,
                businessPhone: formData.get('businessPhone') as string,
                personalPhone: formData.get('personalPhone') as string,
                address: formData.get('address') as string
              }
              handleContactUpdate(contactData)
            }}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Email *
                </label>
                <input
                  name="businessEmail"
                  type="email"
                  defaultValue={pharmacy.email || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white"
                  placeholder="pharmacy@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Phone
                </label>
                <input
                  name="businessPhone"
                  type="tel"
                  defaultValue={pharmacy.phone || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white"
                  placeholder={EGYPT_PHONE.placeholders.business}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Personal Phone *
                </label>
                <input
                  name="personalPhone"
                  type="tel"
                  defaultValue={pharmacist.phone || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white"
                  placeholder={EGYPT_PHONE.placeholders.mobile}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address *
                </label>
                <input
                  name="address"
                  type="text"
                  defaultValue={pharmacy.addr || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white"
                  placeholder={EGYPT_ADDRESS.placeholder}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowContactModal(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Contact Info'}
              </Button>
            </div>
          </form>
        </EditModal>

        {/* Business Modal */}
        <EditModal
          isOpen={showBusinessModal}
          onClose={() => setShowBusinessModal(false)}
          title="Update Business Details"
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const businessData = {
                pharmacyLicense: formData.get('pharmacyLicense') as string,
                pharmacistId: formData.get('pharmacistId') as string
              }
              handleBusinessUpdate(businessData)
            }}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pharmacy License Number *
                </label>
                <input
                  name="pharmacyLicense"
                  type="text"
                  defaultValue={pharmacy.license_num || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., PH-2024-1234"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your official pharmacy operating license number
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pharmacist ID Number *
                </label>
                <input
                  name="pharmacistId"
                  type="text"
                  defaultValue={pharmacist.pharmacist_id_num || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., RPH-2024-5678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your registered pharmacist ID number
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBusinessModal(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Business Details'}
              </Button>
            </div>
          </form>
        </EditModal>
        

      </main>
    </div>
  )
}

export default ProfilePage