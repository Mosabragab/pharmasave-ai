// Enhanced Storage Service - Only deletes specific pharmacy folders
// NEVER deletes the entire bucket!

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Storage buckets configuration
 */
export const STORAGE_BUCKETS = {
  PHARMACY_DOCS: 'pharmacy-documents',
  VERIFICATION_DOCS: 'verification-documents',
  LISTING_IMAGES: 'listing-images'
} as const

/**
 * Delete all files for a specific pharmacy
 * This ONLY deletes the pharmacy's folder (e.g., PH0003), NOT the entire bucket!
 */
export async function cleanupPharmacyStorage(
  pharmacyId: string,
  pharmacyDisplayId: string, // e.g., 'PH0003'
  supabase: SupabaseClient
): Promise<{
  success: boolean
  filesDeleted: number
  errors: string[]
}> {
  const errors: string[] = []
  let totalDeleted = 0

  try {
    console.log(`🧹 Cleaning up storage for pharmacy: ${pharmacyDisplayId} (${pharmacyId})`)
    console.log(`📁 This will ONLY delete the ${pharmacyDisplayId} folder, NOT the entire bucket!`)

    // List all files in the pharmacy's folder
    const pharmacyFolder = pharmacyDisplayId || `PH${pharmacyId.slice(0, 4).toUpperCase()}`
    
    console.log(`📂 Looking for files in folder: ${pharmacyFolder}/`)
    
    // Get all files in the pharmacy folder
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKETS.PHARMACY_DOCS)
      .list(pharmacyFolder, {
        limit: 1000,
        offset: 0
      })

    if (listError) {
      console.error('Error listing files:', listError)
      errors.push(`Failed to list files: ${listError.message}`)
      return { success: false, filesDeleted: 0, errors }
    }

    if (!files || files.length === 0) {
      console.log(`📭 No files found in folder ${pharmacyFolder}`)
      return { success: true, filesDeleted: 0, errors: [] }
    }

    console.log(`📋 Found ${files.length} files to delete in ${pharmacyFolder}/`)

    // Delete all files in the pharmacy folder
    const filePaths = files.map(file => `${pharmacyFolder}/${file.name}`)
    
    console.log('🗑️ Deleting files:', filePaths)
    
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKETS.PHARMACY_DOCS)
      .remove(filePaths)

    if (deleteError) {
      console.error('Error deleting files:', deleteError)
      errors.push(`Failed to delete files: ${deleteError.message}`)
    } else {
      console.log(`✅ Successfully deleted ${files.length} files from ${pharmacyFolder}/`)
      totalDeleted = files.length
    }

    // Also check for nested folders (like verification/)
    const { data: nestedFolders } = await supabase.storage
      .from(STORAGE_BUCKETS.PHARMACY_DOCS)
      .list(`${pharmacyFolder}/verification`)

    if (nestedFolders && nestedFolders.length > 0) {
      console.log(`📂 Found ${nestedFolders.length} files in verification subfolder`)
      const nestedPaths = nestedFolders.map(file => `${pharmacyFolder}/verification/${file.name}`)
      
      const { error: nestedDeleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.PHARMACY_DOCS)
        .remove(nestedPaths)

      if (!nestedDeleteError) {
        totalDeleted += nestedFolders.length
        console.log(`✅ Deleted ${nestedFolders.length} files from verification subfolder`)
      }
    }

    console.log(`🎉 Storage cleanup complete. Deleted ${totalDeleted} files from ${pharmacyFolder}/`)
    console.log(`✅ Other pharmacy folders remain untouched!`)

    return {
      success: true,
      filesDeleted: totalDeleted,
      errors
    }

  } catch (error) {
    console.error('Storage cleanup failed:', error)
    return {
      success: false,
      filesDeleted: totalDeleted,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * List all files for a pharmacy (for debugging)
 */
export async function listPharmacyFiles(
  pharmacyDisplayId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  try {
    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKETS.PHARMACY_DOCS)
      .list(pharmacyDisplayId)

    if (!files) return []
    
    return files.map(file => `${pharmacyDisplayId}/${file.name}`)
  } catch (error) {
    console.error('Error listing files:', error)
    return []
  }
}