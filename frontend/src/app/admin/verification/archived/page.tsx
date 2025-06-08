'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { getArchivedPharmacies, restoreArchivedPharmacy } from '@/lib/deleteArchiveService'
import { format } from 'date-fns'

export default function ArchivedPharmacies() {
  const [archives, setArchives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchArchives()
  }, [])

  const fetchArchives = async () => {
    setLoading(true)
    try {
      const data = await getArchivedPharmacies(supabase)
      setArchives(data)
    } catch (error) {
      console.error('Error fetching archives:', error)
      toast.error('Failed to load archived pharmacies')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (archiveId: string, pharmacyName: string) => {
    const confirmed = window.confirm(`Restore "${pharmacyName}" to verification queue?`)
    if (!confirmed) return

    const loadingToast = toast.loading('Restoring pharmacy...')
    
    try {
      const result = await restoreArchivedPharmacy(archiveId, supabase)
      
      toast.dismiss(loadingToast)
      
      if (result.success) {
        toast.success(result.message)
        fetchArchives() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to restore pharmacy')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('An error occurred while restoring')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Pharmacies ({archives.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archives.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No archived pharmacies</p>
          ) : (
            <div className="space-y-4">
              {archives.map((archive) => {
                const pharmacyData = archive.pharmacy_data
                return (
                  <div
                    key={archive.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{pharmacyData.name}</h3>
                        <Badge variant="secondary">{pharmacyData.display_id}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Archived: {format(new Date(archive.archived_at), 'PPp')}
                      </p>
                      {archive.archive_reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {archive.archive_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(archive.id, pharmacyData.name)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}