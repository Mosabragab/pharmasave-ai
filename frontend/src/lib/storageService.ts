// Simplified Storage Service for Client-Side Usage
// This version works with the client-side Supabase instance

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Storage buckets configuration
 */
export const STORAGE_BUCKETS = {
  PHARMACY_DOCS: 'pharmacy-documents',  // This is the correct bucket name
  VERIFICATION_DOCS: 'verification-documents',
  LISTING_IMAGES: 'listing-images'
} as const

/**
 * Extract file path from Supabase storage URL or path
 */
function extractFilePathFromUrl(fileUrl: string, bucket: string): string {
  if (!fileUrl) return ''

  // If it's already just a path
  if (!fileUrl.includes('http') && !fileUrl.includes('/storage/')) {
    return fileUrl.replace(`${bucket}/`, '')
  }

  // Extract from full URL
  const patterns = [
    new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`),
    new RegExp(`${bucket}/(.+)$`)
  ]

  for (const pattern of patterns) {
    const match = fileUrl.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  // Fallback: return the original if no pattern matches
  console.warn(`Could not extract file path from URL: ${fileUrl}`)
  return fileUrl
}

/**
 * Clean up all storage files for a pharmacy
 */
export async function cleanupPharmacyStorage(
  pharmacyId: string,
  supabase: SupabaseClient
): Promise<{
  success: boolean
  filesDeleted: number
  errors: string[]
}> {
  const errors: string[] = []
  let totalDeleted = 0

  try {
    console.log(`🧹 Starting storage cleanup for pharmacy: ${pharmacyId}`)

    // 1. Get all documents from pharmacy_documents table
    const { data: pharmacyDocs, error: pharmacyDocsError } = await supabase
      .from('pharmacy_documents')
      .select('file_url, file_path')
      .eq('pharmacy_id', pharmacyId)

    if (pharmacyDocsError) {
      console.error('Error fetching pharmacy documents:', pharmacyDocsError)
      errors.push(`Failed to fetch pharmacy documents: ${pharmacyDocsError.message}`)
    }

    // 2. Get all verification documents
    const { data: verificationDocs, error: verificationDocsError } = await supabase
      .from('vrfy_docs')
      .select('file_url, file_path')
      .eq('pharmacy_id', pharmacyId)

    if (verificationDocsError) {
      console.error('Error fetching verification documents:', verificationDocsError)
      errors.push(`Failed to fetch verification documents: ${verificationDocsError.message}`)
    }

    // 3. Delete pharmacy documents
    if (pharmacyDocs && pharmacyDocs.length > 0) {
      console.log(`📄 Found ${pharmacyDocs.length} pharmacy documents to delete`)
      
      for (const doc of pharmacyDocs) {
        const filePath = doc.file_path || doc.file_url
        if (filePath) {
          try {
            // Extract the actual file path
            const cleanPath = extractFilePathFromUrl(filePath, STORAGE_BUCKETS.PHARMACY_DOCS)
            console.log(`Attempting to delete: ${cleanPath}`)
            
            const { error } = await supabase.storage
              .from(STORAGE_BUCKETS.PHARMACY_DOCS)
              .remove([cleanPath])

            if (error) {
              console.error(`Failed to delete ${cleanPath}:`, error)
              errors.push(`Failed to delete ${cleanPath}: ${error.message}`)
            } else {
              console.log(`✅ Deleted: ${cleanPath}`)
              totalDeleted++
            }
          } catch (err) {
            console.error(`Error processing ${filePath}:`, err)
            errors.push(`Error processing ${filePath}`)
          }
        }
      }
    }

    // 4. Delete verification documents from verification-documents bucket
    if (verificationDocs && verificationDocs.length > 0) {
      console.log(`📋 Found ${verificationDocs.length} verification documents to delete`)
      
      // First try pharmacy-documents bucket (in case they're stored there)
      for (const doc of verificationDocs) {
        const filePath = doc.file_path || doc.file_url
        if (filePath) {
          try {
            const cleanPath = extractFilePathFromUrl(filePath, STORAGE_BUCKETS.PHARMACY_DOCS)
            console.log(`Attempting to delete verification doc: ${cleanPath}`)
            
            const { error } = await supabase.storage
              .from(STORAGE_BUCKETS.PHARMACY_DOCS)
              .remove([cleanPath])

            if (error) {
              console.error(`Failed to delete ${cleanPath}:`, error)
              // Try verification-documents bucket
              const { error: error2 } = await supabase.storage
                .from(STORAGE_BUCKETS.VERIFICATION_DOCS)
                .remove([cleanPath])
              
              if (error2) {
                errors.push(`Failed to delete ${cleanPath} from both buckets`)
              } else {
                console.log(`✅ Deleted from verification-documents: ${cleanPath}`)
                totalDeleted++
              }
            } else {
              console.log(`✅ Deleted: ${cleanPath}`)
              totalDeleted++
            }
          } catch (err) {
            console.error(`Error processing ${filePath}:`, err)
            errors.push(`Error processing ${filePath}`)
          }
        }
      }
    }

    // 5. Try to clean up the pharmacy folder
    try {
      // Try common folder patterns
      const possibleFolders = [
        pharmacyId,
        `PH${pharmacyId.slice(0, 8)}`,
        `PH${pharmacyId.slice(0, 4).toUpperCase()}`
      ]

      for (const folder of possibleFolders) {
        console.log(`Checking for folder: ${folder}/`)
        const { data: folderFiles } = await supabase.storage
          .from(STORAGE_BUCKETS.PHARMACY_DOCS)
          .list(folder)

        if (folderFiles && folderFiles.length > 0) {
          console.log(`Found ${folderFiles.length} files in folder ${folder}`)
          const filesToDelete = folderFiles.map(file => `${folder}/${file.name}`)
          
          const { error } = await supabase.storage
            .from(STORAGE_BUCKETS.PHARMACY_DOCS)
            .remove(filesToDelete)

          if (!error) {
            console.log(`✅ Cleaned up folder: ${folder}`)
            totalDeleted += filesToDelete.length
          } else {
            console.error(`Failed to clean folder ${folder}:`, error)
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up folders:', err)
    }

    console.log(`🎉 Storage cleanup complete. Deleted ${totalDeleted} files`)

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