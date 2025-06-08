// Enhanced Delete Service with Storage Cleanup
// This integrates with your existing delete functionality

import { cleanupPharmacyStorage } from './storageService'
import type { SupabaseClient } from '@supabase/supabase-js'

interface DeleteResult {
  success: boolean
  message: string
  details?: {
    pharmacyName?: string
    deletedPharmacists?: number
    deletedDocuments?: number
    storageFilesDeleted?: number
    storageErrors?: string[]
  }
  error?: string
}

/**
 * Enhanced pharmacy deletion with complete storage cleanup
 * This function handles both database and storage deletion
 */
export async function deletePharmacyWithCleanup(
  pharmacyId: string,
  supabase: SupabaseClient
): Promise<DeleteResult> {
  const client = supabase
  
  console.log('🗑️ Starting enhanced pharmacy deletion:', pharmacyId)

  try {
    // Step 1: Call the database delete function (CASCADE will handle related records)
    console.log('Step 1: Calling delete_verification_entry...')
    const { data, error: dbError } = await client.rpc('delete_verification_entry', {
      entry_id: pharmacyId
    })

    console.log('Database response:', { data, error: dbError })

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return {
        success: false,
        message: 'Failed to delete pharmacy from database',
        error: dbError.message
      }
    }

    // Parse the response from the delete function
    let dbResult: any = {}
    if (data && typeof data === 'object') {
      dbResult = data
      
      // Check if the database deletion failed
      if (data.success === false) {
        console.error('Database deletion failed:', data.error)
        return {
          success: false,
          message: data.error || 'Database deletion failed',
          error: data.error
        }
      }
    } else if (data === null) {
      // Some functions return null on success
      console.log('Database deletion returned null (might be success)')
      dbResult = { success: true }
    }

    // Step 2: Clean up storage files
    console.log('Step 2: Cleaning up storage files...')
    const storageResult = await cleanupPharmacyStorage(pharmacyId, client)
    
    console.log('Storage cleanup result:', {
      filesDeleted: storageResult.filesDeleted,
      errors: storageResult.errors.length
    })

    // Step 3: Log the complete deletion (optional - comment out if causing issues)
    /*
    await client.from('admin_activity_logs').insert({
      action_type: 'delete_pharmacy',
      target_id: pharmacyId,
      details: {
        pharmacy_name: dbResult.pharmacy_name,
        database_deletion: 'success',
        storage_files_deleted: storageResult.filesDeleted,
        storage_errors: storageResult.errors
      },
      created_at: new Date().toISOString()
    }).catch(err => {
      // Don't fail the deletion if logging fails
      console.error('Failed to log deletion:', err)
    })
    */

    return {
      success: true,
      message: `Successfully deleted pharmacy${dbResult.pharmacy_name ? ` "${dbResult.pharmacy_name}"` : ''}`,
      details: {
        pharmacyName: dbResult.pharmacy_name,
        deletedPharmacists: dbResult.deleted_pharmacists,
        deletedDocuments: dbResult.deleted_documents,
        storageFilesDeleted: storageResult.filesDeleted,
        storageErrors: storageResult.errors.length > 0 ? storageResult.errors : undefined
      }
    }

  } catch (error) {
    console.error('Unexpected error during deletion:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during deletion',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Archive a pharmacy (soft delete)
 * Keeps data but changes status to archived
 */
export async function archivePharmacy(
  pharmacyId: string,
  archiveReason?: string,
  supabase: SupabaseClient
): Promise<DeleteResult> {
  const client = supabase
  
  console.log('📁 Starting pharmacy archival:', pharmacyId)

  try {
    // Get pharmacy details first
    const { data: pharmacy, error: fetchError } = await client
      .from('pharmacies')
      .select('name, display_id')
      .eq('id', pharmacyId)
      .single()

    if (fetchError) {
      return {
        success: false,
        message: 'Failed to fetch pharmacy details',
        error: fetchError.message
      }
    }

    // Update pharmacy status to archived
    const { error: updateError } = await client
      .from('pharmacies')
      .update({
        status: 'archived',
        ver_status: 'archived',
        marketplace_access: false,
        verification_notes: archiveReason || `Archived by admin on ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', pharmacyId)

    if (updateError) {
      return {
        success: false,
        message: 'Failed to archive pharmacy',
        error: updateError.message
      }
    }

    // Deactivate all pharmacist accounts
    await client
      .from('pharmacists')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('pharmacy_id', pharmacyId)

    // Update verification queue if exists
    await client
      .from('verification_queue')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('pharmacy_id', pharmacyId)

    // Log the archival (optional - comment out if causing issues)
    /*
    await client.from('admin_activity_logs').insert({
      action_type: 'archive_pharmacy',
      target_id: pharmacyId,
      details: {
        pharmacy_name: pharmacy?.name,
        display_id: pharmacy?.display_id,
        reason: archiveReason
      },
      created_at: new Date().toISOString()
    }).catch(err => {
      console.error('Failed to log archival:', err)
    })
    */

    return {
      success: true,
      message: `Successfully archived pharmacy "${pharmacy?.name || pharmacyId}"`,
      details: {
        pharmacyName: pharmacy?.name
      }
    }

  } catch (error) {
    console.error('Unexpected error during archival:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during archival',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Restore an archived pharmacy
 */
export async function restorePharmacy(
  pharmacyId: string,
  supabase: SupabaseClient
): Promise<DeleteResult> {
  const client = supabase
  
  console.log('♻️ Starting pharmacy restoration:', pharmacyId)

  try {
    // Get pharmacy details
    const { data: pharmacy, error: fetchError } = await client
      .from('pharmacies')
      .select('name, display_id')
      .eq('id', pharmacyId)
      .single()

    if (fetchError) {
      return {
        success: false,
        message: 'Failed to fetch pharmacy details',
        error: fetchError.message
      }
    }

    // Restore pharmacy status
    const { error: updateError } = await client
      .from('pharmacies')
      .update({
        status: 'active',
        ver_status: 'verified',
        verification_notes: `Restored by admin on ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', pharmacyId)

    if (updateError) {
      return {
        success: false,
        message: 'Failed to restore pharmacy',
        error: updateError.message
      }
    }

    // Reactivate primary admin account
    await client
      .from('pharmacists')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('pharmacy_id', pharmacyId)
      .eq('is_primary', true)

    // Log the restoration (optional - comment out if causing issues)
    /*
    await client.from('admin_activity_logs').insert({
      action_type: 'restore_pharmacy',
      target_id: pharmacyId,
      details: {
        pharmacy_name: pharmacy?.name,
        display_id: pharmacy?.display_id
      },
      created_at: new Date().toISOString()
    }).catch(err => {
      console.error('Failed to log restoration:', err)
    })
    */

    return {
      success: true,
      message: `Successfully restored pharmacy "${pharmacy?.name || pharmacyId}"`,
      details: {
        pharmacyName: pharmacy?.name
      }
    }

  } catch (error) {
    console.error('Unexpected error during restoration:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during restoration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}