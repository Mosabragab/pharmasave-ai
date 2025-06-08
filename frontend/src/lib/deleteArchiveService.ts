// 🔧 SURGICAL ARCHIVE FIX: Working archive solution without RPC dependency
// This replaces the broken RPC-based archive with a direct database approach

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface OperationResult {
  success: boolean
  message: string
  error?: string
  details?: any
}

/**
 * Delete a pharmacy completely (database + storage)
 */
export async function deletePharmacyComplete(
  pharmacyId: string,
  supabase: SupabaseClient
): Promise<OperationResult> {
  console.log('🗑️ Starting complete pharmacy deletion:', pharmacyId)

  try {
    // Step 1: Get pharmacy info before deletion
    const { data: pharmacy, error: fetchError } = await supabase
      .from('pharmacies')
      .select(`
        id,
        display_id,
        name,
        pharmacy_documents (
          id,
          file_url,
          file_path
        )
      `)
      .eq('id', pharmacyId)
      .single()

    if (fetchError || !pharmacy) {
      console.error('❌ Pharmacy not found:', fetchError)
      return {
        success: false,
        message: 'Pharmacy not found',
        error: fetchError?.message || 'Pharmacy not found'
      }
    }

    console.log('📋 Found pharmacy:', pharmacy.display_id, pharmacy.name)

    // Step 2: Delete storage files first
    const storageFiles: string[] = []
    const storageErrors: string[] = []
    
    // Collect file paths from documents
    if (pharmacy.pharmacy_documents && pharmacy.pharmacy_documents.length > 0) {
      pharmacy.pharmacy_documents.forEach((doc: any) => {
        if (doc.file_path) {
          storageFiles.push(doc.file_path)
        } else if (doc.file_url) {
          // Extract path from URL
          const match = doc.file_url.match(/pharmacy-documents\/(.+)$/)
          if (match) storageFiles.push(match[1])
        }
      })
    }

    console.log('📁 Files to delete:', storageFiles)

    // Delete individual files
    if (storageFiles.length > 0) {
      const { error: deleteFilesError } = await supabase.storage
        .from('pharmacy-documents')
        .remove(storageFiles)
      
      if (deleteFilesError) {
        console.error('⚠️ Some files could not be deleted:', deleteFilesError)
        storageErrors.push(deleteFilesError.message)
      } else {
        console.log(`✅ Deleted ${storageFiles.length} storage files`)
      }
    }

    // Step 3: Delete from database tables in correct order (foreign key constraints)
    console.log('🗃️ Starting database deletion...')

    // Delete verification queue entries
    const { error: queueError } = await supabase
      .from('verification_queue')
      .delete()
      .eq('pharmacy_id', pharmacyId)
    
    if (queueError) console.log('⚠️ Verification queue deletion:', queueError.message)

    // Delete pharmacy documents
    const { error: docsError } = await supabase
      .from('pharmacy_documents')
      .delete()
      .eq('pharmacy_id', pharmacyId)
    
    if (docsError) console.log('⚠️ Documents deletion:', docsError.message)

    // Delete pharmacists
    const { error: pharmacistsError } = await supabase
      .from('pharmacists')
      .delete()
      .eq('pharmacy_id', pharmacyId)
    
    if (pharmacistsError) {
      console.error('❌ Failed to delete pharmacists:', pharmacistsError)
      return {
        success: false,
        message: 'Failed to delete pharmacist accounts',
        error: pharmacistsError.message
      }
    }
    console.log('✅ Deleted pharmacist accounts')

    // Delete pharmacy (this should be last due to foreign keys)
    const { error: pharmacyError } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', pharmacyId)
    
    if (pharmacyError) {
      console.error('❌ Failed to delete pharmacy:', pharmacyError)
      return {
        success: false,
        message: 'Failed to delete pharmacy record',
        error: pharmacyError.message
      }
    }
    console.log('✅ Deleted pharmacy record')

    console.log('🎉 Pharmacy deletion completed successfully!')

    return {
      success: true,
      message: `Successfully deleted ${pharmacy.name} (${pharmacy.display_id})`,
      details: {
        pharmacyName: pharmacy.name,
        displayId: pharmacy.display_id,
        storageFilesDeleted: storageFiles.length,
        storageErrors: storageErrors.length > 0 ? storageErrors : undefined
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
 * 🔧 SURGICAL FIX: Archive a pharmacy using direct database updates
 */
export async function archivePharmacyComplete(
  pharmacyId: string,
  reason: string = 'Manual archive',
  supabase: SupabaseClient
): Promise<OperationResult> {
  console.log('📁 Starting pharmacy archive:', pharmacyId)

  try {
    // Step 1: Get pharmacy info before archiving
    const { data: pharmacy, error: fetchError } = await supabase
      .from('pharmacies')
      .select(`
        id,
        display_id,
        name,
        verified,
        ver_status,
        marketplace_access
      `)
      .eq('id', pharmacyId)
      .single()

    if (fetchError || !pharmacy) {
      console.error('❌ Pharmacy not found:', fetchError)
      return {
        success: false,
        message: 'Pharmacy not found',
        error: fetchError?.message || 'Pharmacy not found'
      }
    }

    console.log('📋 Found pharmacy to archive:', pharmacy.display_id, pharmacy.name)

    const now = new Date().toISOString()

    // Step 2: Update pharmacy to archived status
    const { error: pharmacyError } = await supabase
      .from('pharmacies')
      .update({
        verified: false,
        marketplace_access: false,
        archived_at: now,
        archive_reason: reason,
        updated_at: now
        // 🔧 REMOVED: ver_status = 'archived' (enum may not support this)
      })
      .eq('id', pharmacyId)

    if (pharmacyError) {
      console.error('❌ Failed to archive pharmacy:', pharmacyError)
      return {
        success: false,
        message: 'Failed to update pharmacy archive status',
        error: pharmacyError.message
      }
    }

    console.log('✅ Pharmacy archived successfully')

    // Step 3: Update verification queue status
    const { error: queueError } = await supabase
      .from('verification_queue')
      .update({
        status: 'archived',
        reviewed_at: now,
        admin_notes: `Archived: ${reason}`,
        updated_at: now
      })
      .eq('pharmacy_id', pharmacyId)

    if (queueError) {
      console.warn('⚠️ Verification queue archive warning:', queueError.message)
      // Don't fail the entire operation for this
    }

    // Step 4: Try to create archive record (if table exists)
    try {
      const { error: archiveInsertError } = await supabase
        .from('archived_pharmacies')
        .insert({
          original_id: pharmacyId,
          pharmacy_name: pharmacy.name,
          display_id: pharmacy.display_id,
          archive_reason: reason,
          archived_at: now,
          original_data: {
            verified: pharmacy.verified,
            ver_status: pharmacy.ver_status,
            marketplace_access: pharmacy.marketplace_access
          }
        })

      if (archiveInsertError) {
        console.warn('⚠️ Archive table insert failed (table may not exist):', archiveInsertError.message)
        // Don't fail the operation - the main archive status is set
      } else {
        console.log('✅ Archive record created')
      }
    } catch (archiveTableError) {
      console.warn('⚠️ Archive table not available, continuing with status update only')
    }

    return {
      success: true,
      message: `Successfully archived ${pharmacy.name} (${pharmacy.display_id})`,
      details: {
        pharmacyName: pharmacy.name,
        displayId: pharmacy.display_id,
        reason: reason,
        archivedAt: now
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error during archive:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during archive',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get archived pharmacies
 */
export async function getArchivedPharmacies(
  supabase: SupabaseClient
): Promise<any[]> {
  try {
    // Try to get from archive table first
    const { data: archiveData, error: archiveError } = await supabase
      .from('archived_pharmacies')
      .select('*')
      .order('archived_at', { ascending: false })

    if (!archiveError && archiveData) {
      return archiveData
    }

    // Fallback: get pharmacies with archived_at timestamp
    const { data: pharmacyData, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select(`
        id,
        name,
        display_id,
        ver_status,
        archived_at,
        archive_reason,
        updated_at
      `)
      .not('archived_at', 'is', null)  // 🔧 FIXED: Use archived_at field
      .order('updated_at', { ascending: false })

    if (pharmacyError) {
      console.error('Error fetching archived pharmacies:', pharmacyError)
      return []
    }

    return pharmacyData || []
  } catch (error) {
    console.error('Error fetching archives:', error)
    return []
  }
}

/**
 * Restore an archived pharmacy
 */
export async function restoreArchivedPharmacy(
  pharmacyId: string,
  supabase: SupabaseClient
): Promise<OperationResult> {
  try {
    const now = new Date().toISOString()

    // Update the pharmacy status to pending for re-review
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
        admin_notes: 'Restored from archive',
        updated_at: now
      })
      .eq('pharmacy_id', pharmacyId)

    if (queueError) {
      console.warn('⚠️ Queue restore warning:', queueError.message)
    }

    // Optionally remove from archive table
    try {
      await supabase
        .from('archived_pharmacies')
        .delete()
        .eq('original_id', pharmacyId)
    } catch (archiveDeleteError) {
      console.warn('⚠️ Archive table cleanup warning:', archiveDeleteError)
    }

    return {
      success: true,
      message: 'Pharmacy restored successfully'
    }

  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}