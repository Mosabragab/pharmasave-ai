// 🗑️ ARCHIVE DELETION SERVICE
// Complete archive management including permanent deletion

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface OperationResult {
  success: boolean
  message: string
  error?: string
  details?: any
}

interface ArchivedPharmacy {
  id: string
  display_id: string
  name: string
  archived_at: string
  archive_reason: string
  days_archived: number
}

interface ArchiveStatistics {
  total_archived: number
  archived_this_month: number
  archived_this_year: number
  oldest_archive: string
  newest_archive: string
  archives_by_reason: Record<string, number>
}

/**
 * Get all archived pharmacies
 */
export async function getArchivedPharmacies(
  supabase: SupabaseClient
): Promise<ArchivedPharmacy[]> {
  try {
    const { data, error } = await supabase
      .from('pharmacies')
      .select(`
        id,
        display_id,
        name,
        archived_at,
        archive_reason
      `)
      .not('archived_at', 'is', null)  // 🔧 FIXED: Use archived_at field instead of enum
      .order('archived_at', { ascending: false })

    if (error) {
      console.error('Error fetching archived pharmacies:', error)
      return []
    }

    return (data || []).map(pharmacy => ({
      ...pharmacy,
      days_archived: pharmacy.archived_at 
        ? Math.floor((Date.now() - new Date(pharmacy.archived_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }))
  } catch (error) {
    console.error('Error fetching archived pharmacies:', error)
    return []
  }
}

/**
 * Get archive statistics
 */
export async function getArchiveStatistics(
  supabase: SupabaseClient
): Promise<ArchiveStatistics | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_archive_statistics')

    if (error) {
      console.error('Error fetching archive statistics:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching archive statistics:', error)
    return null
  }
}

/**
 * Permanently delete an archived pharmacy
 * This includes all related data and storage files
 */
export async function deleteArchivedPharmacy(
  pharmacyId: string,
  pharmacyName: string,
  supabase: SupabaseClient
): Promise<OperationResult> {
  console.log('🗑️ Permanently deleting archived pharmacy:', pharmacyId, pharmacyName)

  try {
    // Step 1: Get pharmacy documents for storage cleanup
    const { data: documents, error: docsError } = await supabase
      .from('pharmacy_documents')
      .select('file_path, file_name')
      .eq('pharmacy_id', pharmacyId)

    if (docsError) {
      console.warn('⚠️ Could not fetch documents for cleanup:', docsError)
    }

    // Step 2: Delete storage files first
    const storageFiles: string[] = []
    if (documents && documents.length > 0) {
      documents.forEach(doc => {
        if (doc.file_path) {
          storageFiles.push(doc.file_path)
        }
      })

      if (storageFiles.length > 0) {
        console.log(`📁 Deleting ${storageFiles.length} storage files...`)
        const { error: storageError } = await supabase.storage
          .from('pharmacy-documents')
          .remove(storageFiles)

        if (storageError) {
          console.warn('⚠️ Some storage files could not be deleted:', storageError)
        } else {
          console.log('✅ Storage files deleted successfully')
        }
      }
    }

    // Step 3: Use database function for safe deletion
    const { data: result, error } = await supabase
      .rpc('delete_archived_pharmacy', {
        p_pharmacy_id: pharmacyId,
        p_confirm_deletion: 'CONFIRM_DELETE_PERMANENTLY'
      })

    if (error) {
      console.error('❌ Database deletion failed:', error)
      return {
        success: false,
        message: 'Failed to delete archived pharmacy',
        error: error.message
      }
    }

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Deletion failed',
        error: result.error
      }
    }

    console.log('✅ Archived pharmacy deleted successfully')

    return {
      success: true,
      message: `Successfully deleted ${pharmacyName} and all related data`,
      details: {
        ...result.details,
        storageFilesDeleted: storageFiles.length
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error during deletion:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during deletion',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Bulk cleanup old archived pharmacies
 */
export async function cleanupOldArchives(
  daysOld: number = 365,
  supabase: SupabaseClient
): Promise<OperationResult> {
  console.log(`🧹 Cleaning up archives older than ${daysOld} days`)

  try {
    // First, get list of old archives to delete their storage files
    const { data: oldArchives, error: fetchError } = await supabase
      .from('pharmacies')
      .select(`
        id,
        display_id,
        name,
        pharmacy_documents(file_path)
      `)
      .not('archived_at', 'is', null)  // 🔧 FIXED: Use archived_at field
      .lt('archived_at', new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString())

    if (fetchError) {
      console.error('❌ Failed to fetch old archives:', fetchError)
      return {
        success: false,
        message: 'Failed to identify old archives',
        error: fetchError.message
      }
    }

    // Collect all storage files to delete
    const allStorageFiles: string[] = []
    if (oldArchives && oldArchives.length > 0) {
      oldArchives.forEach(pharmacy => {
        if (pharmacy.pharmacy_documents) {
          pharmacy.pharmacy_documents.forEach((doc: any) => {
            if (doc.file_path) {
              allStorageFiles.push(doc.file_path)
            }
          })
        }
      })

      // Delete storage files
      if (allStorageFiles.length > 0) {
        console.log(`📁 Bulk deleting ${allStorageFiles.length} storage files...`)
        const { error: storageError } = await supabase.storage
          .from('pharmacy-documents')
          .remove(allStorageFiles)

        if (storageError) {
          console.warn('⚠️ Some storage files could not be deleted:', storageError)
        }
      }
    }

    // Use database function for bulk cleanup
    const { data: result, error } = await supabase
      .rpc('cleanup_old_archives', {
        p_days_old: daysOld,
        p_confirm_cleanup: 'CONFIRM_BULK_CLEANUP'
      })

    if (error) {
      console.error('❌ Bulk cleanup failed:', error)
      return {
        success: false,
        message: 'Failed to cleanup old archives',
        error: error.message
      }
    }

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Cleanup failed',
        error: result.error
      }
    }

    return {
      success: true,
      message: `Successfully cleaned up ${result.deleted_count} old archives`,
      details: {
        ...result,
        storageFilesDeleted: allStorageFiles.length
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error during cleanup:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during cleanup',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Restore an archived pharmacy back to pending status
 */
export async function restoreArchivedPharmacy(
  pharmacyId: string,
  pharmacyName: string,
  supabase: SupabaseClient
): Promise<OperationResult> {
  console.log('🔄 Restoring archived pharmacy:', pharmacyId, pharmacyName)

  try {
    const now = new Date().toISOString()

    // Update pharmacy status
    const { error: updateError } = await supabase
      .from('pharmacies')
      .update({
        ver_status: 'pending',
        verified: false,
        marketplace_access: false,
        archived_at: null,
        archive_reason: null,
        updated_at: now
      })
      .eq('id', pharmacyId)
      .not('archived_at', 'is', null)  // 🔧 SAFETY: Only restore actually archived pharmacies

    if (updateError) {
      console.error('❌ Failed to restore pharmacy:', updateError)
      return {
        success: false,
        message: 'Failed to restore pharmacy',
        error: updateError.message
      }
    }

    // Update verification queue
    const { error: queueError } = await supabase
      .from('verification_queue')
      .update({
        status: 'pending',
        reviewed_at: null,
        admin_notes: `Restored from archive on ${new Date().toLocaleDateString()}`,
        updated_at: now
      })
      .eq('pharmacy_id', pharmacyId)

    if (queueError) {
      console.warn('⚠️ Queue update failed:', queueError)
    }

    // Remove from archived_pharmacies table if it exists
    try {
      await supabase
        .from('archived_pharmacies')
        .delete()
        .eq('original_id', pharmacyId)
    } catch (archiveError) {
      console.warn('⚠️ Archive table cleanup warning:', archiveError)
    }

    console.log('✅ Pharmacy restored successfully')

    return {
      success: true,
      message: `Successfully restored ${pharmacyName} to pending verification`,
      details: {
        pharmacyName,
        restoredAt: now
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error during restore:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during restore',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Export archive data for backup/compliance
 */
export async function exportArchiveData(
  supabase: SupabaseClient
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data: pharmacies, error: pharmaciesError } = await supabase
      .from('pharmacies')
      .select(`
        *,
        pharmacy_documents(*),
        verification_queue(*)
      `)
      .not('archived_at', 'is', null)  // 🔧 FIXED: Use archived_at field
      .order('archived_at', { ascending: false })

    if (pharmaciesError) {
      return {
        success: false,
        error: pharmaciesError.message
      }
    }

    // Get archive statistics
    const stats = await getArchiveStatistics(supabase)

    const exportData = {
      export_date: new Date().toISOString(),
      statistics: stats,
      archived_pharmacies: pharmacies,
      total_count: pharmacies?.length || 0
    }

    return {
      success: true,
      data: exportData
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
}