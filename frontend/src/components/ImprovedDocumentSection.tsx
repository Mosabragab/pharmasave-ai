'use client'

import React from 'react';
import { 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText, 
  Trash2,
  Info,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SimpleFileUpload from '@/components/ui/SimpleFileUpload';

interface UploadedDocument {
  id: string
  document_type: string
  file_path: string
  file_name: string
  file_size?: number
  mime_type?: string
  status: string
  uploaded_at: string
  notes?: string
}

interface ImprovedDocumentSectionProps {
  pharmacy: any;
  uploadedDocuments: UploadedDocument[];
  onDocumentUpload: (files: File[], documentType: string) => Promise<void>;
  onDocumentDelete: (documentType: string) => void;
  uploadingFiles: Record<string, boolean>;
}

const ImprovedDocumentSection: React.FC<ImprovedDocumentSectionProps> = ({
  pharmacy,
  uploadedDocuments,
  onDocumentUpload,
  onDocumentDelete,
  uploadingFiles
}) => {
  // Document types configuration
  const documentTypes = [
    {
      type: 'pharmacy_license',
      name: 'Pharmacy License',
      description: 'Official pharmacy business license from regulatory authority',
      required: true,
      icon: '🏪',
      helpText: 'Upload your current pharmacy operating license issued by the Ministry of Health'
    },
    {
      type: 'business_registration', 
      name: 'Business Registration',
      description: 'Commercial registration certificate',
      required: true,
      icon: '📋',
      helpText: 'Upload your commercial registration document from the Commercial Registry'
    },
    {
      type: 'pharmacist_credentials',
      name: 'Pharmacist Credentials',
      description: 'Professional pharmacist certification and ID',
      required: true,
      icon: '👨‍⚕️',
      helpText: 'Upload your pharmacist license and professional ID from the Pharmacists Syndicate'
    },
    {
      type: 'identity_verification',
      name: 'Identity Verification',
      description: 'Additional verification documents (optional)',
      required: false,
      icon: '🆔',
      helpText: 'Optional: Additional documents to support your verification'
    }
  ];

  // ✨ IMPROVED STATUS SYSTEM
  const getDocumentStatus = (documentType: string) => {
    const doc = uploadedDocuments.find(d => d.document_type === documentType);
    
    if (!doc) {
      return {
        status: 'pending',
        icon: Upload,
        iconColor: 'text-gray-400',
        badgeText: 'UPLOAD REQUIRED',
        badgeColor: 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
        timeline: null,
        showTimeline: false
      };
    }

    switch (doc.status) {
      case 'approved':
        return {
          status: 'approved',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          badgeText: '✅ APPROVED',
          badgeColor: 'text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-400',
          timeline: 'Verification complete!',
          showTimeline: true
        };
      case 'rejected':
        return {
          status: 'rejected', 
          icon: XCircle,
          iconColor: 'text-red-600',
          badgeText: '❌ NEEDS REVISION',
          badgeColor: 'text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-400',
          timeline: 'Please review feedback and resubmit',
          showTimeline: true
        };
      case 'under_review':
      case 'uploaded':
      default:
        return {
          status: 'under_review',
          icon: Clock,
          iconColor: 'text-yellow-600', // ✨ FIXED: Yellow instead of green
          badgeText: '⏳ UNDER REVIEW',
          badgeColor: 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-400',
          timeline: 'Review typically takes 1-2 business days', // ✨ CLEAR TIMELINE
          showTimeline: true
        };
    }
  };

  // ✨ CONTEXT-AWARE BUTTON TEXT
  const getButtonText = (documentType: string) => {
    const doc = uploadedDocuments.find(d => d.document_type === documentType);
    return doc ? 'Replace Document' : 'Upload Document';
  };

  const totalRequired = documentTypes.filter(d => d.required).length;
  const uploadedRequired = documentTypes.filter(d => 
    d.required && uploadedDocuments.some(doc => doc.document_type === d.type)
  ).length;

  return (
    <div className="space-y-6">
      {/* 📊 PROGRESS OVERVIEW */}
      <div className="bg-gradient-to-r from-pharmacy-green/10 to-blue-500/10 rounded-lg p-6 border border-pharmacy-green/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Document Verification Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload required documents to complete verification
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-pharmacy-green">
              {uploadedRequired}/{totalRequired}
            </div>
            <div className="text-xs text-gray-500">Required documents</div>
          </div>
        </div>
        
        {/* Overall Status Alert */}
        {uploadedRequired === totalRequired ? (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-400">
              <strong>✅ All documents submitted!</strong> Our team will review your documents within 1-2 business days. 
              You'll receive an email once verification is complete.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-400">
              <strong>📋 Upload Guidelines:</strong> Documents must be clear and legible • 
              Accepted formats: PDF (preferred), JPG, PNG • Maximum size: 10MB per document
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* 📄 DOCUMENT SECTIONS */}
      <div className="space-y-4">
        {documentTypes.map((docType) => {
          const statusInfo = getDocumentStatus(docType.type);
          const isUploading = uploadingFiles[docType.type];
          const document = uploadedDocuments.find(d => d.document_type === docType.type);
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={docType.type} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Document Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <StatusIcon className={`w-6 h-6 ${statusInfo.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {docType.icon} {docType.name}
                            {docType.required && <span className="text-red-500 ml-1">*</span>}
                          </h4>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.badgeColor}`}>
                            {statusInfo.badgeText}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {docType.description}
                        </p>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          💡 {docType.helpText}
                        </p>

                        {/* ✨ TIMELINE INFORMATION */}
                        {statusInfo.showTimeline && (
                          <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                            statusInfo.status === 'approved' 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
                              : statusInfo.status === 'rejected'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-400'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                          }`}>
                            <p className={`text-sm font-medium ${
                              statusInfo.status === 'approved'
                                ? 'text-green-800 dark:text-green-400'
                                : statusInfo.status === 'rejected'
                                ? 'text-red-800 dark:text-red-400'
                                : 'text-yellow-800 dark:text-yellow-400'
                            }`}>
                              {statusInfo.timeline}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {document && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('View document:', document.file_name)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDocumentDelete(docType.type)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Current Document Display */}
                  {document && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {document.file_name || document.file_path?.split('/').pop()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                            {document.notes && ` • ${document.notes}`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Rejection Feedback */}
                      {document.status === 'rejected' && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                          <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                            ❌ Document rejected:
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {document.notes || 'Please review and resubmit with correct information.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Component */}
                  <div>
                    <SimpleFileUpload
                      title={getButtonText(docType.type)} // ✨ CONTEXT-AWARE BUTTON TEXT
                      description={`Upload your ${docType.name.toLowerCase()} document`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                      onFilesChange={(files) => onDocumentUpload(files, docType.type)}
                      multiple={false}
                      required={docType.required}
                    />
                  </div>

                  {/* Upload Status */}
                  {isUploading && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center text-sm text-blue-800 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                        <span>Uploading {docType.name.toLowerCase()}... Please wait.</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ImprovedDocumentSection;