'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  FileText,
  Eye,
  Download,
  Building2,
  Trash2,
  Archive,
  Loader2
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { deletePharmacyComplete, archivePharmacyComplete } from '@/lib/deleteArchiveService'

interface VerificationQueueItem {
  id: string
  pharmacy_id: string
  pharmacy_name: string
  pharmacy_display_id: string
  pharmacist_name: string
  documents_count: number
  submission_date: string
  priority: number
  status: 'pending' | 'in_review' | 'escalated' | 'completed' | 'rejected'
  assigned_admin?: string
  due_date: string
  days_pending: number
  pharmacy_license: string
  business_registration: string
  verification_id: string
  can_be_deleted: boolean
  can_be_archived: boolean
}

interface AdminStats {
  total_pending: number
  in_review: number
  overdue: number
  completed_today: number
  my_workload: number
  average_processing_time: number
}

const AdminVerificationDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [queueItems, setQueueItems] = useState<VerificationQueueItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardData()
  }, [filterStatus, selectedPriority])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const { data: queueData, error: queueError } = await supabase
        .from('admin_verification_queue_view')
        .select(`
          pharmacy_id,
          pharmacy_name,
          display_id,
          pharmacist_fname,
          pharmacist_lname,
          verification_id,
          verification_status,
          verification_priority,
          verification_submitted_at,
          verification_due_date,
          days_pending,
          document_count,
          pharmacy_license
        `)
        .order('verification_submitted_at', { ascending: true })

      if (queueError) {
        console.error('Queue query error:', queueError)
        throw queueError
      }

      console.log('📊 Queue Data:', queueData)

      // Transform data to match interface and FILTER OUT PH0001 AND PH0004
      const transformedQueue: VerificationQueueItem[] = queueData
        ?.filter(item => {
          // 🚨 FILTER OUT PH0001 AND PH0004
          const displayId = item.display_id || ''
          return displayId !== 'PH0001' && displayId !== 'PH0004'
        })
        ?.map(item => ({
          id: item.pharmacy_id,
          pharmacy_id: item.pharmacy_id,
          pharmacy_name: item.pharmacy_name || 'Unknown Pharmacy',
          pharmacy_display_id: item.display_id || 'N/A',
          pharmacist_name: `${item.pharmacist_fname || ''} ${item.pharmacist_lname || ''}`.trim() || 'No pharmacist assigned',
          documents_count: item.document_count || 0,
          submission_date: item.verification_submitted_at,
          priority: item.verification_priority || 2,
          status: item.verification_status as any,
          assigned_admin: 'Admin',
          due_date: item.verification_due_date,
          days_pending: item.days_pending || 0,
          pharmacy_license: item.pharmacy_license || '',
          business_registration: 'N/A',
          verification_id: item.verification_id || item.pharmacy_id,
          can_be_deleted: item.verification_status === 'pending' || item.verification_status === 'rejected',
          can_be_archived: item.verification_status === 'completed' || item.verification_status === 'rejected'
        })) || []

      setQueueItems(transformedQueue)

      // Calculate stats (excluding filtered items)
      const now = new Date()
      const stats: AdminStats = {
        total_pending: transformedQueue.filter(item => item.status === 'pending').length,
        in_review: transformedQueue.filter(item => item.status === 'in_review').length,
        overdue: transformedQueue.filter(item => 
          new Date(item.due_date) < now && item.status !== 'completed'
        ).length,
        completed_today: 0,
        my_workload: transformedQueue.length,
        average_processing_time: 24
      }

      setStats(stats)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load verification data')
    } finally {
      setLoading(false)
    }
  }

  // 🔧 ENHANCED DELETE FUNCTION WITH STORAGE CLEANUP
  const handleDeleteVerification = async (pharmacyId: string, pharmacyName: string) => {
    console.log('🗑️ Delete attempt:', { pharmacyId, pharmacyName })
    
    if (!pharmacyId) {
      toast.error('❌ No pharmacy ID provided')
      return
    }

    const confirmed = confirm(`⚠️ DELETE VERIFICATION ENTRY

Pharmacy: ${pharmacyName}
ID: ${pharmacyId}

This will permanently delete:
• The pharmacy account
• All pharmacist accounts
• All uploaded documents (including storage files)
• All verification data
• All related records

This action cannot be undone.

Are you sure you want to continue?`)

    if (!confirmed) {
      console.log('Delete cancelled by user')
      return
    }

    setDeletingId(pharmacyId)
    const loadingToast = toast.loading('Deleting pharmacy and cleaning up storage...')

    try {
      // Use the new complete delete function
      const result = await deletePharmacyComplete(pharmacyId, supabase)

      toast.dismiss(loadingToast)

      if (result.success) {
        // Show detailed success message
        let successMessage = `✅ ${result.message}`
        if (result.details?.storageFilesDeleted) {
          successMessage += `\nCleaned up ${result.details.storageFilesDeleted} file(s) from storage`
        }
        if (result.details?.storageErrors && result.details.storageErrors.length > 0) {
          successMessage += `\n⚠️ Some files could not be deleted: ${result.details.storageErrors.length} error(s)`
        }
        
        toast.success(successMessage, { duration: 5000 })
        
        // Remove from local state immediately for better UX
        setQueueItems(prev => prev.filter(item => item.pharmacy_id !== pharmacyId))
        
        // Log success details
        console.log('✅ Delete successful:', result.details)
        
        // Refresh data to ensure consistency
        setTimeout(() => {
          fetchDashboardData()
        }, 500)
        
      } else {
        toast.error(`Failed to delete: ${result.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('❌ Delete exception:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to delete verification entry')
    } finally {
      setDeletingId(null)
    }
  }

  // 🔧 ENHANCED ARCHIVE FUNCTION
  const handleArchiveVerification = async (pharmacyId: string, pharmacyName: string) => {
    console.log('📁 Archive attempt:', { pharmacyId, pharmacyName })
    
    if (!pharmacyId) {
      toast.error('❌ No pharmacy ID provided')
      return
    }

    const confirmed = confirm(`📁 ARCHIVE VERIFICATION ENTRY

Pharmacy: ${pharmacyName}
ID: ${pharmacyId}

This will:
• Move the pharmacy to archived status
• Deactivate all pharmacist accounts
• Preserve all data for historical records
• Block marketplace access

The pharmacy can be restored later if needed.

Continue?`)

    if (!confirmed) {
      return
    }

    setArchivingId(pharmacyId)
    const loadingToast = toast.loading('Archiving pharmacy...')

    try {
      // Use the enhanced archive function
      const result = await archivePharmacyComplete(
        pharmacyId,
        'Archived by admin - business inactive or verification issues',
        supabase
      )

      toast.dismiss(loadingToast)

      if (result.success) {
        const archiveMessage = `📁 ${result.message}\nData preserved for analysis`
        toast.success(archiveMessage, { duration: 4000 })
        
        // Remove from local state
        setQueueItems(prev => prev.filter(item => item.pharmacy_id !== pharmacyId))
        
        console.log('✅ Archive successful:', result.details)
        
        // Refresh data
        setTimeout(() => {
          fetchDashboardData()
        }, 500)
        
      } else {
        toast.error(`Failed to archive: ${result.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('❌ Archive exception:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to archive pharmacy')
    } finally {
      setArchivingId(null)
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 2: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'escalated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Apply additional filtering (excluding PH0001 and PH0004 already filtered above)
  const filteredItems = queueItems.filter(item => {
    const matchesSearch = item.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.pharmacy_display_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.pharmacist_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesPriority = selectedPriority === 'all' || item.priority.toString() === selectedPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleReviewPharmacy = (pharmacyId: string) => {
    window.location.href = `/admin/verification/review/${pharmacyId}`
  }

  if (loading) {
    return (
      <AdminLayout title="Verification Management" description="Review and approve pharmacy registrations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Verification Management" description="Review and approve pharmacy registrations">
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.total_pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">In Review</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.in_review}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed_today}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">My Workload</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.my_workload}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time (hrs)</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.average_processing_time}</p>
                  </div>
                  <Clock className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by pharmacy name, ID, or pharmacist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="escalated">Escalated</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Priorities</option>
                  <option value="1">High (1)</option>
                  <option value="2">Medium (2)</option>
                  <option value="3">Low (3)</option>
                </select>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Verification Queue ({filteredItems.length})
              </span>
              <Link
                href="/admin/verification/archived"
                className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                View Archives
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Pharmacy</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Pharmacist</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Priority</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Documents</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Days Pending</th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-pharmacy-green rounded-full flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{item.pharmacy_name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{item.pharmacy_display_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900 dark:text-white">{item.pharmacist_name}</div>
                      </td>
                      <td className="p-3">
                        <Badge className={getPriorityColor(item.priority)}>
                          Priority {item.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.documents_count} docs
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${item.days_pending > 2 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {item.days_pending} days
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          {/* Review button - always show */}
                          <Button
                            size="sm"
                            onClick={() => handleReviewPharmacy(item.pharmacy_id)}
                            className="bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>

                          {/* Delete button with loading state */}
                          {item.can_be_deleted && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteVerification(item.pharmacy_id, item.pharmacy_name)}
                              disabled={deletingId === item.pharmacy_id}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              title={`Delete verification for ${item.pharmacy_name}`}
                            >
                              {deletingId === item.pharmacy_id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-1" />
                              )}
                              Delete
                            </Button>
                          )}

                          {/* Archive button with loading state */}
                          {item.can_be_archived && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchiveVerification(item.pharmacy_id, item.pharmacy_name)}
                              disabled={archivingId === item.pharmacy_id}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
                              title={`Archive verification for ${item.pharmacy_name}`}
                            >
                              {archivingId === item.pharmacy_id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Archive className="w-4 h-4 mr-1" />
                              )}
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No verification requests found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminVerificationDashboard
