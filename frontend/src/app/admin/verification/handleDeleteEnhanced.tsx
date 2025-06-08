// Updated handleDeleteVerification function for your verification page
// This replaces the existing handleDeleteVerification function in page.tsx

import { deletePharmacyWithCleanup } from '@/lib/pharmacyActions'

// Add this enhanced delete function to your AdminVerificationDashboard component
// Replace the existing handleDeleteVerification function with this one:

const handleDeleteVerificationEnhanced = async (pharmacyId: string, pharmacyName: string) => {
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
    // Use the enhanced delete function that includes storage cleanup
    const result = await deletePharmacyWithCleanup(pharmacyId, supabase)

    toast.dismiss(loadingToast)

    if (result.success) {
      // Show detailed success message
      toast.success(
        <div>
          <p className="font-semibold">✅ {result.message}</p>
          {result.details?.storageFilesDeleted && (
            <p className="text-sm mt-1">
              Cleaned up {result.details.storageFilesDeleted} file(s) from storage
            </p>
          )}
          {result.details?.storageErrors && result.details.storageErrors.length > 0 && (
            <p className="text-sm mt-1 text-yellow-600">
              ⚠️ Some files could not be deleted: {result.details.storageErrors.length} error(s)
            </p>
          )}
        </div>,
        { duration: 5000 }
      )
      
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

// IMPORTANT: In your component, update the delete button onClick to use the new function:
// Change from: onClick={() => handleDeleteVerification(item.pharmacy_id, item.pharmacy_name)}
// To: onClick={() => handleDeleteVerificationEnhanced(item.pharmacy_id, item.pharmacy_name)}

// Also add this import at the top of your page.tsx file:
// import { deletePharmacyWithCleanup } from '@/lib/pharmacyActions'