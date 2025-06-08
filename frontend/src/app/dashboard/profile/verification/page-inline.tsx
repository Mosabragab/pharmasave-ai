/**
 * 🚀 INLINE VERIFICATION PAGE
 * 
 * Revolutionary UX improvements matching profile page approach:
 * - Inline editing for each document type
 * - Full CRUD operations with notifications
 * - Specific document titles (no bulk upload)
 * - Smart submit button (only when ready)
 * - Streamlined experience (no help center, no redundant buttons)
 * - Modern upload notifications and feedback
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Layout from '@/components/layout/Layout'
import { 
  User, 
  Building2,
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
  Upload,
  Eye,
  Trash2,
  Download,
  AlertTriangle,
  BadgeCheck,
  X
} from 'lucide-react'

interface PharmacyData {
  id: string
  name: string
  verified: boolean
  profile_completion_percent: number
  can_submit_for_verification: boolean
  documents_submitted_at: string | null
}

interface PharmacistData {
  id: string
  fname: string
  lname: string
  role: string
  profile_completion_percent: number
}

interface DocumentData {
  id: string
  document_type: string
  file_name: string
  file_size: number
  mime_type: string
  status: 'uploaded' | 'verified' | 'rejected'
  uploaded_at: string
  verified_at: string | null
  notes: string | null
  file_url: string
}

interface DocumentType {
  id: string
  title: string
  description: string
  required: boolean
  icon: React.ComponentType<any>
  guidelines: string[]
}

interface UploadStatus {
  uploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export default function InlineVerificationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [pharmacist, setPharmacist] = useState<PharmacistData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({})
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    pharmacy_license: false,
    business_registration: false,  
    pharmacist_credentials: false,
    identity_verification: false
  })

  // Document types configuration
  const documentTypes: DocumentType[] = [
    {
      id: 'pharmacy_license',
      title: 'Pharmacy License',
      description: 'Official pharmacy business operating license',
      required: true,
      icon: Building2,
      guidelines: [
        'Must be a current, valid pharmacy license',
        'Document should be clear and legible',
        'Include license number and expiry date',
        'Issued by Egyptian Ministry of Health'
      ]
    },
    {
      id: 'business_registration',
      title: 'Business Registration',
      description: 'Commercial registration certificate',
      required: true,
      icon: FileText,
      guidelines: [
        'Official commercial registration document',
        'Must match pharmacy name in profile',
        'Include registration number and date',
        'Issued by competent commercial authority'
      ]
    },
    {
      id: 'pharmacist_credentials',
      title: 'Pharmacist Credentials',
      description: 'Professional pharmacist certification',
      required: true,
      icon: BadgeCheck,
      guidelines: [
        'Valid pharmacist syndicate certificate',
        'Must match pharmacist ID in profile',
        'Include registration number and validity',
        'Issued by Egyptian Pharmacists Syndicate'
      ]
    },
    {
      id: 'identity_verification',
      title: 'Identity Verification',
      description: 'National ID or passport for identity confirmation',
      required: false,
      icon: User,
      guidelines: [
        'Clear photo of national ID or passport',
        'All details must be readable',
        'Document should be current and valid',
        'For additional identity confirmation'
      ]
    }
  ]

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

      // Get documents
      await loadDocuments(pharmacistData.pharmacy_id)

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async (pharmacyId: string) => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_documents')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!pharmacy) return

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: false, progress: 0, error: 'File size must be less than 10MB', success: false }
      }))
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: false, progress: 0, error: 'Only PDF, JPG, and PNG files are allowed', success: false }
      }))
      return
    }

    // Start upload
    setUploadStatus(prev => ({ 
      ...prev, 
      [documentType]: { uploading: true, progress: 0, error: null, success: false }
    }))

    try {
      // Check if document already exists
      const existingDoc = documents.find(doc => doc.document_type === documentType)

      // Upload to Supabase Storage
      const fileName = `${pharmacy.id}/${documentType}/${Date.now()}_${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-documents')
        .getPublicUrl(uploadData.path)

      // Update progress
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: true, progress: 50, error: null, success: false }
      }))

      // Save/update document in database
      if (existingDoc) {
        // Delete old file
        await supabase.storage
          .from('pharmacy-documents')
          .remove([existingDoc.file_url.split('/').pop() || ''])

        // Update existing document
        const { error: updateError } = await supabase
          .from('pharmacy_documents')
          .update({
            file_path: uploadData.path,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            status: 'uploaded',
            uploaded_at: new Date().toISOString(),
            verified_at: null,
            notes: null
          })
          .eq('id', existingDoc.id)

        if (updateError) throw updateError
      } else {
        // Create new document record
        const { error: insertError } = await supabase
          .from('pharmacy_documents')
          .insert({
            pharmacy_id: pharmacy.id,
            document_type: documentType,
            file_path: uploadData.path,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            status: 'uploaded'
          })

        if (insertError) throw insertError
      }

      // Update progress to complete
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: false, progress: 100, error: null, success: true }
      }))

      // Reload documents
      await loadDocuments(pharmacy.id)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus(prev => ({ 
          ...prev, 
          [documentType]: { uploading: false, progress: 0, error: null, success: false }
        }))
      }, 3000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: false, progress: 0, error: error.message, success: false }
      }))
    }
  }

  const handleDeleteDocument = async (documentId: string, documentType: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      const document = documents.find(doc => doc.id === documentId)
      if (!document) return

      // Delete file from storage
      await supabase.storage
        .from('pharmacy-documents')
        .remove([document.file_path])

      // Delete database record
      const { error } = await supabase
        .from('pharmacy_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      // Reload documents
      await loadDocuments(pharmacy!.id)

      // Show success notification
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: false, progress: 0, error: null, success: true }
      }))

    } catch (error: any) {
      console.error('Delete error:', error)
      setUploadStatus(prev => ({ 
        ...prev, 
        [documentType]: { uploading: false, progress: 0, error: `Failed to delete: ${error.message}`, success: false }
      }))
    }
  }

  const getRequiredDocumentsStatus = () => {
    const requiredTypes = documentTypes.filter(type => type.required).map(type => type.id)
    const uploadedRequired = documents.filter(doc => 
      requiredTypes.includes(doc.document_type) && doc.status === 'uploaded'
    )
    return {
      total: requiredTypes.length,
      uploaded: uploadedRequired.length,
      complete: uploadedRequired.length === requiredTypes.length
    }
  }

  const canSubmitVerification = () => {
    if (!pharmacy?.can_submit_for_verification) return false
    const docStatus = getRequiredDocumentsStatus()
    return docStatus.complete
  }

  const handleSubmitVerification = async () => {
    if (!canSubmitVerification()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({
          documents_submitted_at: new Date().toISOString()
        })
        .eq('id', pharmacy!.id)

      if (error) throw error

      alert('🎉 Verification submitted successfully! Our team will review your documents within 2-3 business days.')
      
      // Reload data
      await checkAuth()

    } catch (error: any) {
      console.error('Submit error:', error)
      alert(`Failed to submit verification: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getOverallProgress = () => {
    if (!pharmacy || !pharmacist) return 0
    return Math.round((pharmacy.profile_completion_percent * 0.6) + (pharmacist.profile_completion_percent * 0.4))
  }

  if (isLoading) {
    return (
      <Layout variant="dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pharmacy-green" />
              <p className="text-gray-600 dark:text-gray-400">Loading verification page...</p>
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
                Unable to Load Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please refresh the page or contact support if the problem persists.
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
  const docStatus = getRequiredDocumentsStatus()

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
                Document Verification
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload required documents to complete verification and unlock all features
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

        {/* Status Alerts */}
        {pharmacy.verified && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              <strong>🎉 Verification Complete!</strong> Your pharmacy is verified and you have full access to all platform features.
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Section */}
        <Card className="mb-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-0">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              onClick={() => toggleSection('overview')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mr-4">
                    <Shield className="w-5 h-5 text-pharmacy-green" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white mb-1">
                      Verification Overview
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Current status and document progress
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4 text-right">
                    <div className="text-sm font-medium text-pharmacy-green">
                      {docStatus.uploaded}/{docStatus.total}
                    </div>
                    <div className="text-xs text-gray-500">Required</div>
                  </div>
                  {expandedSections.overview ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedSections.overview && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-600">
                <div className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Summary */}
                    <div className="p-4 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg border border-pharmacy-green/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Shield className="w-6 h-6 text-pharmacy-green mr-3" />
                          <div>
                            <h3 className="font-semibold text-pharmacy-green">
                              {pharmacy.verified ? 'Verified' : 'Verification Pending'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Profile: {overallProgress}% complete
                            </p>
                          </div>
                        </div>
                        {pharmacy.verified && (
                          <BadgeCheck className="w-8 h-8 text-green-500" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Required Documents</span>
                          <span className={docStatus.complete ? 'text-green-600' : 'text-orange-600'}>
                            {docStatus.uploaded}/{docStatus.total}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Profile Completion</span>
                          <span className={overallProgress >= 75 ? 'text-green-600' : 'text-orange-600'}>
                            {overallProgress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Anonymous ID */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                            Anonymous ID
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Protects your identity in marketplace
                          </p>
                        </div>
                        <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                          PH0001
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Upload Sections */}
        {documentTypes.map((docType) => {
          const document = documents.find(doc => doc.document_type === docType.id)
          const status = uploadStatus[docType.id]
          const IconComponent = docType.icon

          return (
            <Card key={docType.id} className="mb-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardContent className="p-0">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => toggleSection(docType.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        document?.status === 'verified' ? 'bg-green-100 dark:bg-green-900/20' :
                        document?.status === 'uploaded' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          document?.status === 'verified' ? 'text-green-600' :
                          document?.status === 'uploaded' ? 'text-blue-600' :
                          'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white mb-1 flex items-center">
                          {docType.title}
                          {docType.required && <span className="text-red-500 ml-1">*</span>}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {docType.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4 text-right">
                        {document ? (
                          <div className={`text-sm font-medium ${
                            document.status === 'verified' ? 'text-green-600' :
                            document.status === 'uploaded' ? 'text-blue-600' :
                            'text-red-600'
                          }`}>
                            {document.status === 'verified' ? 'Verified' :
                             document.status === 'uploaded' ? 'Uploaded' :
                             'Rejected'}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-500">
                            Not uploaded
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {docType.required ? 'Required' : 'Optional'}
                        </div>
                      </div>
                      {expandedSections[docType.id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedSections[docType.id] && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-600">
                    <div className="pt-6 space-y-4">
                      
                      {/* Upload Guidelines */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                          Upload Guidelines
                        </h5>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          {docType.guidelines.map((guideline, index) => (
                            <li key={index}>• {guideline}</li>
                          ))}
                        </ul>
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            <strong>Accepted formats:</strong> PDF (preferred), JPG, PNG • <strong>Max size:</strong> 10MB
                          </div>
                        </div>
                      </div>

                      {/* Upload Status */}
                      {status && (
                        <div className="space-y-2">
                          {status.uploading && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center mb-2">
                                <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                  Uploading {docType.title}...
                                </span>
                              </div>
                              <Progress value={status.progress} className="h-2" />
                            </div>
                          )}
                          
                          {status.error && (
                            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800 dark:text-red-400">
                                {status.error}
                              </AlertDescription>
                            </Alert>
                          )}

                          {status.success && (
                            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800 dark:text-green-400">
                                Document uploaded successfully!
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {/* Document Actions */}
                      <div className="flex items-center justify-between">
                        {document ? (
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <FileText className="w-4 h-4 mr-1" />
                              <span>{document.file_name}</span>
                              <span className="ml-2">
                                ({(document.file_size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(document.file_url, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement('a')
                                  a.href = document.file_url
                                  a.download = document.file_name
                                  a.click()
                                }}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(document.id, docType.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No document uploaded yet</span>
                        )}

                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(file, docType.id)
                              }
                              e.target.value = '' // Reset input
                            }}
                            className="hidden"
                            id={`upload-${docType.id}`}
                          />
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => document.getElementById(`upload-${docType.id}`)?.click()}
                            disabled={status?.uploading}
                            className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            {document ? 'Replace' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Submit for Verification - Only show when ready */}
        {canSubmitVerification() && !pharmacy.verified && (
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-400/20 dark:to-green-500/10 border border-green-200 dark:border-green-400/30">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-4" />
              <h3 className="text-lg font-medium text-green-600 dark:text-green-300 mb-2">
                Ready for Verification!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                All required documents have been uploaded. Submit your verification request to complete the process.
              </p>
              <Button
                onClick={handleSubmitVerification}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-8 py-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Reminder - Only show if not ready */}
        {!canSubmitVerification() && !pharmacy.verified && (
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 dark:from-yellow-400/20 dark:to-orange-400/10 border border-yellow-200 dark:border-yellow-400/30">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto text-yellow-500 dark:text-yellow-400 mb-4" />
              <h3 className="text-lg font-medium text-yellow-600 dark:text-yellow-300 mb-2">
                Complete Requirements
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Upload all required documents to submit for verification.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Progress: {docStatus.uploaded}/{docStatus.total} required documents uploaded
                {overallProgress < 75 && (
                  <span> • Profile completion: {overallProgress}% (75% required)</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}