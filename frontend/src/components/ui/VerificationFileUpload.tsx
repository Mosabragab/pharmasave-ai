'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface UploadedFile {
  file: File
  preview?: string
  uploading?: boolean
  uploaded?: boolean
  error?: string
  url?: string
  path?: string
}

interface VerificationFileUploadProps {
  title: string
  description: string
  documentType: string
  pharmacyId: string
  onUploadComplete: (files: { path: string; url: string; fileName: string }[], isNewUpload?: boolean) => void
  onUploadError: (error: string) => void
  onFileDeleted?: (filePath: string) => void  // Add this callback
  accept?: string
  maxSize?: number // in MB
  multiple?: boolean
  required?: boolean
  existingFiles?: { path: string; url: string; fileName: string }[]
}

export default function VerificationFileUpload({
  title,
  description,
  documentType,
  pharmacyId,
  onUploadComplete,
  onUploadError,
  onFileDeleted,  // Add this
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 20,
  multiple = false,
  required = false,
  existingFiles = []
}: VerificationFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    // Check file type
    const allowedTypes = accept.split(',').map(t => t.trim())
    const fileType = '.' + file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type.toLowerCase()
    
    const isValidType = allowedTypes.some(type => 
      type === fileType || 
      (type === '.jpg' && mimeType === 'image/jpeg') ||
      (type === '.pdf' && mimeType === 'application/pdf') ||
      (type === '.png' && mimeType === 'image/png') ||
      (type === '.jpeg' && mimeType === 'image/jpeg')
    )

    if (!isValidType) {
      return `File type not supported. Allowed: ${accept}`
    }

    return null
  }

  const uploadToSupabase = async (file: File): Promise<{ path: string; url: string }> => {
    try {
      // Verify user is authenticated before upload
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Authentication error:', authError)
        throw new Error('You must be logged in to upload documents. Please refresh the page and try again.')
      }

      console.log('User authenticated for upload:', user.id)

      // Sanitize filename to prevent invalid key errors
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const sanitizedOriginalName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .toLowerCase()
      
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileName = `${timestamp}_${randomId}_${sanitizedOriginalName}`
      
      // Use correct bucket structure: pharmacy-documents/verification/{pharmacy_id}/{document_type}/{filename}
      const filePath = `verification/${pharmacyId}/${documentType}/${fileName}`

      console.log('Uploading file with path:', filePath)

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-documents')
        .getPublicUrl(filePath)

      console.log('File uploaded successfully. Public URL:', publicUrl)
      return { path: filePath, url: publicUrl }

    } catch (error: any) {
      console.error('Upload error:', error)
      throw new Error(error.message || 'Failed to upload file')
    }
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []
    const errors: string[] = []

    // Validate files first
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const error = validateFile(file)
      
      if (error) {
        errors.push(`${file.name}: ${error}`)
        continue
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newFiles.push({ 
        file, 
        preview,
        uploading: true
      })
    }

    if (errors.length > 0) {
      onUploadError(errors.join('\n'))
      return
    }

    // Update files state with uploading files
    if (multiple) {
      setFiles(prev => [...prev, ...newFiles])
    } else {
      // Clean up previous preview URLs
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      setFiles(newFiles)
    }

    // Upload files one by one
    const uploadedFiles: { path: string; url: string; fileName: string }[] = []
    
    for (let i = 0; i < newFiles.length; i++) {
      const fileInfo = newFiles[i]
      const fileId = `${Date.now()}-${i}`
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        
        // Simulate progress for demo (in real implementation, use upload progress callback)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
          }))
        }, 200)

        const { path, url } = await uploadToSupabase(fileInfo.file)
        
        clearInterval(progressInterval)
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))

        // Now save to database using correct table name with explicit user context
        console.log('Saving to database with pharmacy_id:', pharmacyId)
        
        const { error: dbError } = await supabase
          .from('pharmacy_documents')
          .insert({
            pharmacy_id: pharmacyId,
            document_type: documentType,
            file_path: path,
            file_url: url,
            file_name: fileInfo.file.name,
            file_size: fileInfo.file.size,
            mime_type: fileInfo.file.type,
            status: 'uploaded'
          })

        if (dbError) {
          console.error('Database error:', dbError)
          // If database save fails, try to clean up the uploaded file
          try {
            await supabase.storage
              .from('pharmacy-documents')
              .remove([path])
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError)
          }
          throw new Error(`Database save failed: ${dbError.message}`)
        }

        console.log('Document saved to database successfully')

        // Update file status
        setFiles(prev => prev.map((f, index) => {
          if (f === fileInfo) {
            return { ...f, uploading: false, uploaded: true, url, path }
          }
          return f
        }))

        uploadedFiles.push({ path, url, fileName: fileInfo.file.name })

      } catch (error: any) {
        console.error('Upload error:', error)
        
        // Update file with error
        setFiles(prev => prev.map((f, index) => {
          if (f === fileInfo) {
            return { ...f, uploading: false, error: error.message }
          }
          return f
        }))

        onUploadError(`Failed to upload ${fileInfo.file.name}: ${error.message}`)
      }
    }

    // Call completion callback with successfully uploaded files
    if (uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles, true)  // true = new upload
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = async (index: number) => {
    const fileToRemove = files[index]
    
    // If file was uploaded to Supabase, delete it from storage AND database
    if (fileToRemove.path) {
      try {
        // Delete from database first
        const { error: dbDeleteError } = await supabase
          .from('pharmacy_documents')
          .delete()
          .eq('file_path', fileToRemove.path)
          .eq('pharmacy_id', pharmacyId)
        
        if (dbDeleteError) {
          console.error('Database deletion error:', dbDeleteError)
          throw new Error(`Database deletion failed: ${dbDeleteError.message}`)
        }

        // Then delete from storage
        const { error: storageDeleteError } = await supabase.storage
          .from('pharmacy-documents')
          .remove([fileToRemove.path])
          
        if (storageDeleteError) {
          console.error('Storage deletion error:', storageDeleteError)
          // Don't throw here as database is already cleaned up
        }
          
      } catch (error) {
        console.error('Error deleting file:', error)
        toast.error('Error deleting file. Please try again.')
        return
      }
    }
    
    // Clean up preview URL
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
    
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    
    // Reset file input to allow new uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Reset upload progress
    setUploadProgress({})
    
    // Update parent with remaining uploaded files (NOT a new upload)
    const remainingUploadedFiles = newFiles
      .filter(f => f.uploaded && f.path && f.url)
      .map(f => ({ path: f.path!, url: f.url!, fileName: f.file.name }))
    
    onUploadComplete(remainingUploadedFiles, false)  // false = not a new upload
  }

  // Function to delete existing files from database
  const deleteExistingFile = async (filePath: string, fileName: string) => {
    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('pharmacy_documents')
        .delete()
        .eq('file_path', filePath)
        .eq('pharmacy_id', pharmacyId)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        throw new Error(`Database deletion failed: ${dbError.message}`)
      }

      // Then delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('pharmacy-documents')
        .remove([filePath])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Don't throw here as database is already cleaned up
      }

      // Notify parent component
      if (onFileDeleted) {
        onFileDeleted(filePath)
      }

      console.log('File deleted successfully:', fileName)
      
      // Show success message for existing file deletion
      toast.success(`🗋 ${fileName} removed from verification!`)

    } catch (error: any) {
      console.error('Error deleting existing file:', error)
      toast.error(`Failed to delete ${fileName}: ${error.message}`)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const viewFile = (file: UploadedFile) => {
    if (file.url) {
      window.open(file.url, '_blank')
    } else if (file.preview) {
      window.open(file.preview, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {description}
        </p>
      </div>

      {/* Show existing files */}
      {existingFiles.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Previously Uploaded
          </h4>
          <div className="space-y-2">
            {existingFiles.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-green-600">Previously uploaded</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExistingFile(file.path, file.fileName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? 'border-pharmacy-green bg-pharmacy-green/5' 
            : 'border-gray-300 dark:border-gray-600 hover:border-pharmacy-green/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {files.length > 0 && !multiple ? 'Replace file' : 'Upload documents'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports: {accept} • Max {maxSize}MB each
          </p>
        </div>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {files.filter(f => f.uploaded).length > 0 ? 'Uploaded Files' : 'Uploading Files'} ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((uploadedFile, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center space-x-3">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img 
                        src={uploadedFile.preview} 
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                        {uploadedFile.file.type.includes('image') ? (
                          <Image className="w-5 h-5 text-gray-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                      {uploadedFile.uploading && (
                        <div className="flex items-center space-x-1">
                          <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pharmacy-green transition-all duration-300"
                              style={{ width: `${uploadProgress[`${Date.now()}-${index}`] || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {uploadProgress[`${Date.now()}-${index}`] || 0}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center space-x-2">
                    {uploadedFile.uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-pharmacy-green" />
                    ) : uploadedFile.uploaded ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            viewFile(uploadedFile)
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </>
                    ) : uploadedFile.error ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : null}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {uploadedFile.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {uploadedFile.error}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}