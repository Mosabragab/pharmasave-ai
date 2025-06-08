// Alternative Delete Function - Direct Database Delete
// This bypasses the RPC function and deletes directly

import { cleanupPharmacyStorage } from './storageServiceEnhanced'
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

export async function deletePharmacyDirectly(
  pharmacyId: string,
  supabase: SupabaseClient
): Promise<DeleteResult> {
  console.log('🗑️ Starting direct pharmacy deletion:', pharmacyId)

  try {
    // Step 1: Get pharmacy info before deletion
    const { data: pharmacy, error: fetchError } = await supabase
      .from('pharmacies')
      .select('name, display_id')
      .eq('id', pharmacyId)
      .single()

    if (fetchError) {
      console.error('Cannot find pharmacy:', fetchError)
      return {
        success: false,
        message: 'Pharmacy not found',
        error: fetchError.message
      }
    }

    const pharmacyName = pharmacy?.name || 'Unknown'
    const pharmacyDisplayId = pharmacy?.display_id || ''

    // Step 2: Clean up storage files FIRST (before database deletion)
    console.log('Step 1: Cleaning up storage files...')
    const storageResult = await cleanupPharmacyStorage(pharmacyId, pharmacyDisplayId, supabase)
    
    console.log('Storage cleanup result:', {
      filesDeleted: storageResult.filesDeleted,
      errors: storageResult.errors.length
    })

    // Step 3: Delete pharmacy from database (CASCADE will handle related records)
    console.log('Step 2: Deleting pharmacy from database...')
    const { error: deleteError } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', pharmacyId)

    if (deleteError) {
      console.error('Database deletion error:', deleteError)
      return {
        success: false,
        message: 'Failed to delete pharmacy from database',
        error: deleteError.message
      }
    }

    console.log('✅ Pharmacy deleted successfully')

    return {
      success: true,
      message: `Successfully deleted pharmacy "${pharmacyName}"`,
      details: {
        pharmacyName: pharmacyName,
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