'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Archive, 
  ArchiveRestore, 
  CheckCircle, 
  FileText, 
  AlertCircle,
  RefreshCw,
  Clock,
  Calendar,
  Building2
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface Pharmacy {
  id: string
  display_id: string
  name: string
  ver_status: string
  created_at: string
  archived_at?: string
  days_pending?: number
  days_archived?: number
}

const VerificationManagement: React.FC = () => {
  const [activeView, setActiveView] = useState('queue')
  const [activePharmacies, setActivePharmacies] = useState<Pharmacy[]>([])
  const [archivedPharmacies, setArchivedPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  // Load active pharmacies using the deployed minimal view
  const loadActivePharmacies = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('verification_queue_minimal')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setActivePharmacies(data || [])
    } catch (err: any) {
      const errorMsg = `Failed to load active pharmacies: ${err.message}`
      setError(errorMsg)
      toast.error(errorMsg)
      console.error('Load active pharmacies error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load archived pharmacies using the deployed minimal view
  const loadArchivedPharmacies = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('archived_pharmacies_minimal')
        .select('*')
        .order('archived_at', { ascending: false })
      
      if (error) throw error
      setArchivedPharmacies(data || [])
    } catch (err: any) {
      const errorMsg = `Failed to load archived pharmacies: ${err.message}`
      setError(errorMsg)
      toast.error(errorMsg)
      console.error('Load archived pharmacies error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Archive pharmacy using the deployed minimal function
  const handleArchive = async (pharmacyId: string, pharmacyName: string) => {
    setActionLoading(pharmacyId)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('archive_pharmacy_minimal', {
        pharmacy_id: pharmacyId
      })

      if (error) throw error
      
      const result = data[0]
      
      if (result.success) {
        const successMsg = `${result.pharmacy_name} (${pharmacyId}) archived successfully`
        toast.success(successMsg)
        
        // Refresh both views to ensure consistency
        await Promise.all([
          loadActivePharmacies(),
          activeView === 'archives' ? loadArchivedPharmacies() : Promise.resolve()
        ])
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      const errorMsg = `Archive failed: ${err.message}`
      setError(errorMsg)
      toast.error(errorMsg)
      console.error('Archive error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Unarchive pharmacy using the deployed minimal function
  const handleUnarchive = async (pharmacyId: string, pharmacyName: string) => {
    setActionLoading(pharmacyId)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('unarchive_pharmacy_minimal', {
        pharmacy_id: pharmacyId
      })

      if (error) throw error
      
      const result = data[0]
      
      if (result.success) {
        const successMsg = `${result.pharmacy_name} (${pharmacyId}) restored successfully`
        toast.success(successMsg)
        
        // Refresh both views to ensure consistency
        await Promise.all([
          loadArchivedPharmacies(),
          loadActivePharmacies()
        ])
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      const errorMsg = `Restore failed: ${err.message}`
      setError(errorMsg)
      toast.error(errorMsg)
      console.error('Unarchive error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Refresh current view
  const handleRefresh = () => {
    if (activeView === 'queue') {
      loadActivePharmacies()
    } else {
      loadArchivedPharmacies()
    }
  }

  // Load data when view changes
  useEffect(() => {
    if (activeView === 'queue') {
      loadActivePharmacies()
    } else {
      loadArchivedPharmacies()
    }
  }, [activeView])

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyle = (status: string) => {
      if (!status) return 'bg-gray-100 text-gray-800'
      
      const statusLower = status.toLowerCase()
      if (statusLower.includes('pending')) return 'bg-orange-100 text-orange-800'
      if (statusLower.includes('approved')) return 'bg-green-100 text-green-800'
      if (statusLower.includes('rejected')) return 'bg-red-100 text-red-800'
      if (statusLower.includes('review')) return 'bg-blue-100 text-blue-800'
      return 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
        {status || 'Unknown'}
      </span>
    )
  }

  // Error display component
  const ErrorDisplay = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
        <div className="flex-1">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 text-sm underline mt-2 hover:text-red-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )

  // Loading state component
  const LoadingState = () => (
    <div className="flex items-center justify-center p-12">
      <div className="flex items-center space-x-3">
        <div className="animate-spin w-6 h-6 border-2 border-pharmacy-green border-t-transparent rounded-full"></div>
        <span className="text-gray-600">Loading pharmacies...</span>
      </div>
    </div>
  )

  const handleReviewPharmacy = (pharmacyId: string) => {
    window.location.href = `/admin/verification/review/${pharmacyId}`
  }

  return (
    <AdminLayout title="Verification Management" description="Manage pharmacy verification and archive operations">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage pharmacy verification and archive operations
            </p>
          </div>
          
          {/* Tab Navigation + Refresh */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setActiveView('queue')}
              variant={activeView === 'queue' ? 'default' : 'outline'}
              className={`flex items-center space-x-2 ${
                activeView === 'queue' 
                  ? 'bg-pharmacy-green text-white shadow-md' 
                  : ''
              }`}
            >
              <CheckCircle size={16} />
              <span>Active Queue</span>
              <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                {activePharmacies.length}
              </span>
            </Button>
            
            <Button
              onClick={() => setActiveView('archives')}
              variant={activeView === 'archives' ? 'default' : 'outline'}
              className={`flex items-center space-x-2 ${
                activeView === 'archives' 
                  ? 'bg-gray-600 text-white shadow-md' 
                  : ''
              }`}
            >
              <Archive size={16} />
              <span>Archives</span>
              <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                {archivedPharmacies.length}
              </span>
            </Button>

            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorDisplay />}

        {/* Main Content */}
        <Card>
          {/* Content Header */}
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {activeView === 'queue' ? (
                  <>
                    <CheckCircle className="text-pharmacy-green" size={24} />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Verification Queue</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Pharmacies currently in verification process
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Archive className="text-gray-600" size={24} />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Archived Pharmacies</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Previously archived pharmacies with restore capability
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          {/* Content Body */}
          <CardContent>
            {loading ? (
              <LoadingState />
            ) : activeView === 'queue' ? (
              // ACTIVE QUEUE VIEW
              <div className="overflow-x-auto">
                {activePharmacies.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No pharmacies currently in the verification queue.
                    </p>
                    <p className="text-sm text-gray-400">
                      New pharmacy registrations will appear here for review.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pharmacy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Days Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {activePharmacies.map((pharmacy) => (
                        <tr key={pharmacy.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-pharmacy-green rounded-lg flex items-center justify-center mr-4">
                                <Building2 className="text-white" size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pharmacy.name || 'Unknown Pharmacy'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {pharmacy.display_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={pharmacy.ver_status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-1">
                              <Clock size={14} className="text-gray-400" />
                              <span>{Math.floor(pharmacy.days_pending || 0)} days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleReviewPharmacy(pharmacy.id)}
                              className="bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
                            >
                              Review
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchive(pharmacy.display_id, pharmacy.name)}
                              disabled={actionLoading === pharmacy.display_id}
                              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                            >
                              {actionLoading === pharmacy.display_id ? (
                                <RefreshCw size={14} className="animate-spin mr-1" />
                              ) : (
                                <Archive size={14} className="mr-1" />
                              )}
                              Archive
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              // ARCHIVED PHARMACIES VIEW
              <div className="overflow-x-auto">
                {archivedPharmacies.length === 0 ? (
                  <div className="p-12 text-center">
                    <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Archived Pharmacies</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Pharmacies that you archive will appear here.
                    </p>
                    <p className="text-sm text-gray-400">
                      Use the "Archive" button in the verification queue to archive pharmacies.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pharmacy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Original Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Archived Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Days Archived
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {archivedPharmacies.map((pharmacy) => (
                        <tr key={pharmacy.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                                <Archive className="text-gray-600 dark:text-gray-400" size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pharmacy.name || 'Unknown Pharmacy'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {pharmacy.display_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={pharmacy.ver_status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span>
                                {pharmacy.archived_at 
                                  ? new Date(pharmacy.archived_at).toLocaleDateString() 
                                  : 'Unknown'
                                }
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-1">
                              <Clock size={14} className="text-gray-400" />
                              <span className="font-medium">
                                {Math.floor(pharmacy.days_archived || 0)} days
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button 
                              size="sm"
                              onClick={() => handleUnarchive(pharmacy.display_id, pharmacy.name)}
                              disabled={actionLoading === pharmacy.display_id}
                              className="bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
                            >
                              {actionLoading === pharmacy.display_id ? (
                                <RefreshCw size={14} className="animate-spin mr-1" />
                              ) : (
                                <ArchiveRestore size={14} className="mr-1" />
                              )}
                              Restore
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default VerificationManagement
