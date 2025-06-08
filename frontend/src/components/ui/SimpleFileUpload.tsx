'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UploadedFile {
  file: File
  preview?: string
  uploading?: boolean
  uploaded?: boolean
  error?: string
}

interface SimpleFileUploadProps {
  title: string
  description: string
  accept?: string
  maxSize?: number // in MB
  onFilesChange: (files: File[]) => void
  multiple?: boolean
  required?: boolean
}

export default function SimpleFileUpload({
  title,
  description,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  onFilesChange,
  multiple = false,
  required = false
}: SimpleFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
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
      (type === '.png' && mimeType === 'image/png')
    )

    if (!isValidType) {
      return `File type not supported. Allowed: ${accept}`
    }

    return null
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []
    const errors: string[] = []

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
        uploaded: true // For now, mark as uploaded immediately
      })
    }

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles])
      onFilesChange([...files.map(f => f.file), ...newFiles.map(f => f.file)])
    } else {
      // Clean up previous preview URLs
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      setFiles(newFiles)
      onFilesChange(newFiles.map(f => f.file))
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

  const removeFile = (index: number) => {
    const newFiles = [...files]
    const removedFile = newFiles[index]
    
    // Clean up preview URL
    if (removedFile.preview) {
      URL.revokeObjectURL(removedFile.preview)
    }
    
    newFiles.splice(index, 1)
    setFiles(newFiles)
    onFilesChange(newFiles.map(f => f.file))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
            {files.length > 0 && !multiple ? 'Replace file' : 'Upload file'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports: {accept} • Max {maxSize}MB
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
            Uploaded Files ({files.length})
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
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center space-x-2">
                    {uploadedFile.uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-pharmacy-green" />
                    ) : uploadedFile.uploaded ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
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
