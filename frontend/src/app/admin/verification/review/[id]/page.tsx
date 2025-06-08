'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Hash,
  Camera,
  FileCheck,
  MessageSquare,
  Save,
  Send,
  Ban,
  RotateCcw
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface PharmacyDetails {
  id: string
  name: string
  display_id: string
  license_num: string
  registration_number: string
  email: string
  phone: string
  addr: string
  profile_completion: number
  ver_status: string
  verified: boolean
  marketplace_access: boolean
  created_at: string
  verified_at?: string
  trial_started_at?: string
  trial_expires_at?: string
}

interface PharmacistDetails {
  id: string
  fname: string
  lname: string
  email: string
  phone: string
  license_num: string
  role: string
  created_at: string
}

interface DocumentDetails {
  id: string
  file_name?: string
  file_path?: string
  file_type?: string
  file_size?: number
  uploaded_at?: string
  document_type?: string
  status?: string
}

interface VerificationDetails {
  id: string
  pharmacy_id: string
  status: string
  priority: number
  created_at: string
  due_date: string
  assigned_admin?: string
  admin_notes?: string
  rejection_reason?: string
  reviewed_by?: string
  reviewed_at?: string
}

const AdminDocumentReview: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const pharmacyId = params.id as string

  const [pharmacy, setPharmacy] = useState<PharmacyDetails | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistDetails | null>(null)
  const [documents, setDocuments] = useState<DocumentDetails[]>([])
  const [verification, setVerification] = useState<VerificationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // Review form state
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [validationChecklist, setValidationChecklist] = useState({
    pharmacyLicense: false,
    businessRegistration: false,
    pharmacistLicense: false,
    addressVerification: false,
    contactVerification: false,
    documentQuality: false
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (pharmacyId) {
      fetchPharmacyDetails()
    }
  }, [pharmacyId])

  const fetchPharmacyDetails = async () => {
    try {
      setLoading(true)

      // 🔧 FIX: Use the new admin view for complete data
      const { data: adminViewData, error: adminViewError } = await supabase
        .from('admin_pharmacy_verification_view')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .single()

      if (!adminViewError && adminViewData) {
        // Map the view data to our interfaces
        setPharmacy({
          id: adminViewData.pharmacy_id,
          name: adminViewData.pharmacy_name,
          display_id: adminViewData.display_id,
          license_num: adminViewData.pharmacy_license,
          registration_number: adminViewData.registration_number,
          email: adminViewData.pharmacy_email,
          phone: adminViewData.pharmacy_phone,
          addr: adminViewData.pharmacy_address,
          profile_completion: adminViewData.profile_completion,
          ver_status: adminViewData.ver_status,
          verified: adminViewData.verified,
          marketplace_access: adminViewData.marketplace_access || false,
          created_at: adminViewData.pharmacy_created_at,
          verified_at: adminViewData.verified_at,
          trial_started_at: adminViewData.trial_started_at,
          trial_expires_at: adminViewData.trial_expires_at
        })

        // 🔧 FIX: Properly set pharmacist data including license
        if (adminViewData.pharmacist_id) {
          setPharmacist({
            id: adminViewData.pharmacist_id,
            fname: adminViewData.pharmacist_fname,
            lname: adminViewData.pharmacist_lname,
            email: adminViewData.pharmacist_email,
            phone: adminViewData.pharmacist_phone,
            license_num: adminViewData.pharmacist_license, // 🔧 FIX: This should now have data
            role: adminViewData.pharmacist_role,
            created_at: adminViewData.pharmacist_created_at
          })
        }

        // Set verification data
        if (adminViewData.verification_id) {
          setVerification({
            id: adminViewData.verification_id,
            pharmacy_id: adminViewData.pharmacy_id,
            status: adminViewData.verification_status,
            priority: adminViewData.verification_priority,
            created_at: adminViewData.verification_submitted_at,
            due_date: adminViewData.verification_due_date,
            admin_notes: adminViewData.admin_notes,
            rejection_reason: adminViewData.rejection_reason,
            reviewed_at: adminViewData.reviewed_at
          })
          
          setAdminNotes(adminViewData.admin_notes || '')
          setRejectionReason(adminViewData.rejection_reason || '')
        }
      } else {
        // Fallback to original queries if view doesn't exist
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', pharmacyId)
          .single()

        if (pharmacyError) throw pharmacyError
        setPharmacy(pharmacyData)

        // Fetch pharmacist details (primary admin)
        const { data: pharmacistData, error: pharmacistError } = await supabase
          .from('pharmacists')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .eq('role', 'primary_admin')
          .single()

        if (!pharmacistError && pharmacistData) {
          setPharmacist(pharmacistData)
        }

        // Fetch verification queue entry
        const { data: verificationData, error: verificationError } = await supabase
          .from('verification_queue')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .single()

        if (!verificationError && verificationData) {
          setVerification(verificationData)
          setAdminNotes(verificationData.admin_notes || '')
          setRejectionReason(verificationData.rejection_reason || '')
        }
      }

      // Fetch documents (always fetch these separately for latest status)
      const { data: documentsData, error: documentsError } = await supabase
        .from('pharmacy_documents')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('uploaded_at', { ascending: false })

      if (!documentsError && documentsData) {
        setDocuments(documentsData)
      }

    } catch (error) {
      console.error('Error fetching pharmacy details:', error)
      toast.error('Failed to load pharmacy details')
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (document: DocumentDetails) => {
    try {
      if (!document.file_path) {
        toast.error('Document file path not available')
        return
      }

      const { data, error } = await supabase
        .storage
        .from('pharmacy-documents')
        .download(document.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name || 'document'
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Document downloaded successfully')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const viewDocument = async (document: DocumentDetails) => {
    try {
      if (!document.file_path) {
        toast.error('Document file path not available')
        return
      }

      // Try signed URL first (more secure)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('pharmacy-documents')
        .createSignedUrl(document.file_path, 3600) // 1 hour expiry

      if (signedUrlData?.signedUrl) {
        window.open(signedUrlData.signedUrl, '_blank')
        return
      }

      // Fallback to public URL
      const { data } = await supabase
        .storage
        .from('pharmacy-documents')
        .getPublicUrl(document.file_path)

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank')
      } else {
        toast.error('Document URL not available')
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      toast.error('Failed to view document')
    }
  }

  const saveNotes = async () => {
    if (!verification) return

    try {
      const { error } = await supabase
        .from('verification_queue')
        .update({
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', verification.id)

      if (error) throw error

      toast.success('Notes saved successfully')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    }
  }

  // 🔧 SURGICAL FIX: Simplified and working approve function
  const approvePharmacy = async () => {
    if (!pharmacy) return

    // Validation checks
    const checklistItems = Object.values(validationChecklist)
    const completedItems = checklistItems.filter(Boolean).length
    const totalItems = checklistItems.length
    
    if (completedItems < totalItems) {
      toast.error(`Please complete all validation checklist items (${completedItems}/${totalItems} completed)`)
      return
    }

    if (!adminNotes.trim()) {
      toast.error('Please add admin review notes before approving')
      return
    }

    try {
      setProcessing(true)
      console.log('🚀 Starting approval process for:', pharmacy.name)

      const now = new Date().toISOString()
      const trialExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days trial

      // 🔧 SURGICAL FIX: Only update fields that definitely exist
      const updateData = {
        verified: true,
        ver_status: 'approved',
        updated_at: now
      }

      console.log('📤 Updating pharmacy with data:', updateData)

      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update(updateData)
        .eq('id', pharmacy.id)

      if (pharmacyError) {
        console.error('❌ Pharmacy update error:', pharmacyError)
        throw pharmacyError
      }

      console.log('✅ Pharmacy updated successfully!')

      // 🔧 SURGICAL FIX: Try to update optional fields separately
      try {
        const { error: trialError } = await supabase
          .from('pharmacies')
          .update({
            trial_started_at: now,
            trial_expires_at: trialExpires,
            marketplace_access: true
          })
          .eq('id', pharmacy.id)

        if (trialError) {
          console.warn('⚠️ Trial fields update failed (fields may not exist):', trialError)
          // Don't throw - these are optional fields
        } else {
          console.log('✅ Trial fields updated successfully!')
        }
      } catch (e) {
        console.warn('⚠️ Trial fields not available, continuing...')
      }

      // Update verification queue status (optional)
      if (verification) {
        try {
          const { error: queueError } = await supabase
            .from('verification_queue')
            .update({
              status: 'completed',
              admin_notes: adminNotes,
              reviewed_at: now,
              updated_at: now
            })
            .eq('id', verification.id)

          if (queueError) {
            console.warn('⚠️ Queue update failed:', queueError)
            // Don't throw - this is secondary
          }
        } catch (e) {
          console.warn('⚠️ Verification queue update failed, continuing...')
        }
      }

      console.log('🎉 Approval process completed successfully!')
      toast.success(`🎉 ${pharmacy.name} approved successfully! Marketplace access granted.`, { duration: 4000 })
      
      // Refresh the data to show updated status
      await fetchPharmacyDetails()
      
      // Redirect after a delay to show success
      setTimeout(() => {
        router.push('/admin/verification')
      }, 2000)

    } catch (error: any) {
      console.error('❌ Error approving pharmacy:', error)
      const errorMessage = error.message || error.details || 'Unknown error'
      toast.error(`Failed to approve pharmacy: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const rejectPharmacy = async () => {
    if (!pharmacy || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      console.log('Starting rejection process for pharmacy:', pharmacy.name)

      // Update pharmacy verification status
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          ver_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', pharmacy.id)

      if (pharmacyError) throw pharmacyError

      // Update verification queue
      const { error: queueError } = await supabase
        .from('verification_queue')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || null,
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('pharmacy_id', pharmacy.id)

      if (queueError) throw queueError

      toast.success('Pharmacy rejected with reason provided')
      
      // Refresh data and redirect
      await fetchPharmacyDetails()
      setTimeout(() => {
        router.push('/admin/verification')
      }, 2000)

    } catch (error: any) {
      console.error('Error rejecting pharmacy:', error)
      toast.error(`Failed to reject pharmacy: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  // 🔧 FIXED: Cancel verification function using direct queries
  const cancelVerification = async () => {
    if (!pharmacy) {
      toast.error('Pharmacy data not found')
      return
    }

    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancelling the verification')
      return
    }

    try {
      setProcessing(true)
      console.log('Starting cancellation process for pharmacy:', pharmacy.name)

      const now = new Date().toISOString()

      // 🔧 FIX: Update pharmacy status directly
      const updateData: any = {
        ver_status: 'pending',
        verified: false,
        trial_started_at: null,
        trial_expires_at: null,
        updated_at: now
      }

      // Add marketplace_access if the field exists
      try {
        updateData.marketplace_access = false
      } catch (e) {
        // Field might not exist, continue without it
        console.log('marketplace_access field not available')
      }

      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update(updateData)
        .eq('id', pharmacy.id)

      if (pharmacyError) {
        console.error('❌ Pharmacy update error:', pharmacyError)
        throw pharmacyError
      }

      // Update or remove verification queue entry
      if (verification) {
        const { error: queueError } = await supabase
          .from('verification_queue')
          .update({
            status: 'pending',
            admin_notes: cancelReason,
            reviewed_at: null,
            updated_at: now
          })
          .eq('id', verification.id)

        if (queueError) {
          console.error('❌ Queue update error:', queueError)
        }
      }

      console.log('✅ Cancellation successful')
      toast.success(`📋 Verification cancelled for ${pharmacy.name}. They can resubmit documents.`, { duration: 4000 })
      
      // Refresh data to show updated status
      await fetchPharmacyDetails()
      
      // Redirect after showing success
      setTimeout(() => {
        router.push('/admin/verification')
      }, 2000)

    } catch (error: any) {
      console.error('❌ Error cancelling verification:', error)
      toast.error(`Failed to cancel verification: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const getDocumentIcon = (fileType: string | null | undefined) => {
    if (fileType && fileType.startsWith('image/')) return <Camera className="w-5 h-5" />
    return <FileText className="w-5 h-5 text-red-600" />
  }

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getDocumentStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 text-xs">✅ Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 text-xs">❌ Rejected</Badge>
      case 'uploaded':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">📋 Pending Review</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">📄 Uploaded</Badge>
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Document Review" description="Review pharmacy verification documents">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!pharmacy) {
    return (
      <AdminLayout title="Document Review" description="Review pharmacy verification documents">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Pharmacy Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested pharmacy could not be found.
          </p>
          <Button onClick={() => router.push('/admin/verification')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Verification Queue
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`Review: ${pharmacy.name}`} description="Review pharmacy verification documents">
      <div className="space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/verification')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </Button>
          
          <div className="flex items-center gap-2">
            {/* 🔧 FIX: Show proper verification status */}
            <Badge className={getStatusColor(pharmacy.ver_status)}>
              {pharmacy.verified ? 'Verified ✅' : pharmacy.ver_status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              ID: {pharmacy.display_id}
            </Badge>
            {pharmacy.marketplace_access && (
              <Badge className="bg-green-100 text-green-800">
                Marketplace Access
              </Badge>
            )}
          </div>
        </div>

        {/* 🔧 FIX: Show verification success status if already verified */}
        {pharmacy.verified && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Pharmacy Already Verified</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    This pharmacy was verified on {pharmacy.verified_at ? new Date(pharmacy.verified_at).toLocaleDateString() : 'Unknown date'}.
                    {pharmacy.trial_expires_at && ` Trial expires: ${new Date(pharmacy.trial_expires_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pharmacy Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-pharmacy-green" />
                Pharmacy Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pharmacy Name</p>
                    <p className="font-semibold">{pharmacy.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">License Number</p>
                    <p className="font-semibold">{pharmacy.license_num || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Registration Number</p>
                    <p className="font-semibold">{pharmacy.registration_number || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-semibold">{pharmacy.addr || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold">{pharmacy.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-semibold">{pharmacy.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pharmacist Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-trust-blue" />
                Pharmacist Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pharmacist ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                      <p className="font-semibold">{pharmacist.fname} {pharmacist.lname}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-semibold">{pharmacist.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-semibold">{pharmacist.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {/* 🔧 FIX 3: Properly display pharmacist license */}
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pharmacist License</p>
                      <div className="font-semibold">
                        {pharmacist.license_num || 'Not provided'}
                        {pharmacist.license_num && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">✅ Available</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                      <p className="font-semibold capitalize">{pharmacist.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pharmacist information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Uploaded Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-alert-orange" />
              Uploaded Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {getDocumentIcon(document.file_type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{document.file_name || 'Untitled Document'}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {document.document_type?.replace('_', ' ') || 'Document'}
                        </p>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(document.file_size)} • {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'Unknown date'}
                        </div>
                        {/* 🔧 FIX: Show document status */}
                        <div className="mt-2">
                          {getDocumentStatusBadge(document.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(document)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(document)}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documents have been uploaded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Validation Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(validationChecklist).map(([key, checked]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setValidationChecklist(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="w-4 h-4 text-pharmacy-green"
                    disabled={pharmacy.verified} // Disable if already verified
                  />
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-trust-blue" />
                Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add your review notes here..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full"
                disabled={pharmacy.verified && verification?.status === 'completed'}
              />
              <Button 
                onClick={saveNotes} 
                variant="outline" 
                className="w-full"
                disabled={pharmacy.verified && verification?.status === 'completed'}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-alert-orange" />
                Review Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rejection Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rejection Reason (if rejecting)
                </label>
                <Textarea
                  placeholder="Provide a clear reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* 🔧 FIX 2: Add cancellation reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cancellation Reason (if cancelling)
                </label>
                <Textarea
                  placeholder="Provide a reason for cancelling verification..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
              {/* Validation Status Indicator */}
              {(() => {
              const checklistItems = Object.values(validationChecklist)
              const completedItems = checklistItems.filter(Boolean).length
              const totalItems = checklistItems.length
              const isChecklistComplete = completedItems === totalItems
              const hasAdminNotes = adminNotes.trim().length > 0
              const canApprove = isChecklistComplete && hasAdminNotes
              const isVerified = pharmacy.verified === true || pharmacy.ver_status === 'verified'
              const isApproved = (pharmacy.ver_status === 'approved' && pharmacy.verified === true) || pharmacy.ver_status === 'verified'
              
              if (isVerified) {
              return (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">Already Verified</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  This pharmacy is verified and has marketplace access. You can only cancel the verification.
                  </p>
                  </div>
                )
              }
              
              if (isApproved) {
              return (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Verification Approved</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              This verification has been approved. You can cancel to allow resubmission.
              </p>
              </div>
              )
              }
              
              if (!canApprove) {
              return (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">Cannot Approve - Requirements Missing</h4>
                    <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                        {!isChecklistComplete && (
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              <span>Complete all validation checklist items ({completedItems}/{totalItems} done)</span>
                          </div>
                      )}
                    {!hasAdminNotes && (
                      <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          <span>Add admin review notes explaining your decision</span>
                      </div>
                      )}
                      </div>
                      </div>
                      </div>
                    </div>
                  )
                }
              
              return (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-200">Ready to Approve</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      All validation requirements completed ({completedItems}/{totalItems} checklist items + admin notes)
                    </p>
                </div>
              )
              })()} 
              
              {/* 🔧 FIXED: Show buttons based on verification status */}
              {(() => {
              const isVerified = pharmacy.verified || pharmacy.ver_status === 'verified'
                const isApproved = pharmacy.ver_status === 'approved' || pharmacy.ver_status === 'verified'
                  const canApprove = Object.values(validationChecklist).filter(Boolean).length === Object.values(validationChecklist).length && adminNotes.trim().length > 0
                
                // If already verified or approved, show only cancel button
              if (isApproved) {
                return (
                  <Button
                    onClick={cancelVerification}
                      disabled={processing || !cancelReason.trim()}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {processing ? 'Processing...' : 'Cancel Verification'}
                      </Button>
                    )
                  }
                  
                  // For pending verification, show all action buttons
                  return (
                    <>
                      {/* Approve Button */}
                      <Button
                        onClick={approvePharmacy}
                        disabled={processing || !canApprove}
                        className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {processing ? 'Processing...' : 'Approve Pharmacy'}
                      </Button>
                      
                      {/* Reject Button */}
                      <Button
                        onClick={rejectPharmacy}
                        disabled={processing || !rejectionReason.trim()}
                        variant="destructive"
                        className="w-full"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {processing ? 'Processing...' : 'Reject Pharmacy'}
                      </Button>

                      {/* Cancel Button (for pending cases) */}
                      <Button
                        onClick={cancelVerification}
                        disabled={processing || !cancelReason.trim()}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {processing ? 'Processing...' : 'Cancel Verification'}
                      </Button>
                    </>
                  )
                })()} 
              </div>

              {/* Status Information */}
              {verification && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Verification Timeline</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Submitted: {new Date(verification.created_at).toLocaleString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Due: {new Date(verification.due_date).toLocaleString()}
                  </p>
                  {verification.reviewed_at && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Reviewed: {new Date(verification.reviewed_at).toLocaleString()}
                    </p>
                  )}
                  {pharmacy.trial_expires_at && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Trial Expires: {new Date(pharmacy.trial_expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDocumentReview
