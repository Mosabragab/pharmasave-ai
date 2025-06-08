'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface PharmacyDetails {
  id: string;
  display_id: string;
  name: string;
  email: string;
  phone: string;
  addr: string;
  license_num: string;
  profile_completion_percent: number;
  created_at: string;
  ver_status: string;
  ver_notes?: string;
}

interface PharmacistDetails {
  id: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  pharmacist_id_num: string;
  role: string;
  is_primary: boolean;
}

interface DocumentDetails {
  id: string;
  document_type: string;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  notes?: string;
}

const DOCUMENT_TYPES = {
  pharmacy_license: {
    name: 'Pharmacy License',
    description: 'Official pharmacy operating license',
    requirements: ['Valid license number', 'Current expiry date', 'Clear photo/scan', 'Official format']
  },
  business_registration: {
    name: 'Business Registration',
    description: 'Business registration certificate',
    requirements: ['Company name matches', 'Valid registration', 'Clear documentation', 'Complete information']
  },
  pharmacist_credentials: {
    name: 'Pharmacist Credentials',
    description: 'Professional pharmacist identification',
    requirements: ['Valid pharmacist license', 'Current status', 'Identity match', 'Clear photo']
  },
  additional_proof: {
    name: 'Additional Proof',
    description: 'Supporting documentation',
    requirements: ['Relevant supporting documents', 'Clear and readable', 'Valid format']
  }
};

interface PharmacyReviewInterfaceProps {
  pharmacyId: string;
  queueId: string;
  onBack: () => void;
}

const PharmacyReviewInterface: React.FC<PharmacyReviewInterfaceProps> = ({ 
  pharmacyId, 
  queueId,
  onBack 
}) => {
  const [pharmacy, setPharmacy] = useState<PharmacyDetails | null>(null);
  const [pharmacists, setPharmacists] = useState<PharmacistDetails[]>([]);
  const [documents, setDocuments] = useState<DocumentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_info' | null>(null);
  const [documentDecisions, setDocumentDecisions] = useState<Record<string, 'approved' | 'rejected' | 'pending'>>({});

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPharmacyDetails();
  }, [pharmacyId]);

  const fetchPharmacyDetails = async () => {
    try {
      setLoading(true);

      // Fetch pharmacy details
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacyId)
        .single();

      if (pharmacyError) throw pharmacyError;
      setPharmacy(pharmacyData);

      // Fetch pharmacists
      const { data: pharmacistsData, error: pharmacistsError } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('pharmacy_id', pharmacyId);

      if (pharmacistsError) throw pharmacistsError;
      setPharmacists(pharmacistsData || []);

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('pharmacy_documents')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

      // Initialize document decisions
      const initialDecisions: Record<string, 'approved' | 'rejected' | 'pending'> = {};
      documentsData?.forEach(doc => {
        initialDecisions[doc.id] = doc.status === 'verified' ? 'approved' : 
                                  doc.status === 'rejected' ? 'rejected' : 'pending';
      });
      setDocumentDecisions(initialDecisions);

      // Set existing admin notes
      setAdminNotes(pharmacyData.ver_notes || '');

    } catch (error) {
      console.error('Error fetching pharmacy details:', error);
      toast.error('Failed to load pharmacy details');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = (documentId: string, action: 'approved' | 'rejected') => {
    setDocumentDecisions(prev => ({
      ...prev,
      [documentId]: action
    }));
  };

  const handleViewDocument = (documentUrl: string, fileName: string) => {
    // Open document in new tab
    window.open(documentUrl, '_blank');
  };

  const handleDownloadDocument = async (documentUrl: string, fileName: string) => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleFinalDecision = async () => {
    if (!selectedAction) {
      toast.error('Please select an action (Approve, Reject, or Request More Info)');
      return;
    }

    setProcessing(true);

    try {
      // Update document statuses
      for (const [docId, decision] of Object.entries(documentDecisions)) {
        if (decision !== 'pending') {
          await supabase
            .from('pharmacy_documents')
            .update({
              status: decision === 'approved' ? 'verified' : 'rejected',
              verified_at: new Date().toISOString(),
              notes: adminNotes
            })
            .eq('id', docId);
        }
      }

      // Update pharmacy verification status
      let newVerStatus: string;
      let isVerified = false;
      let trialStarted = false;

      switch (selectedAction) {
        case 'approve':
          newVerStatus = 'approved';
          isVerified = true;
          trialStarted = true;
          break;
        case 'reject':
          newVerStatus = 'rejected';
          break;
        case 'request_info':
          newVerStatus = 'pending';
          break;
        default:
          newVerStatus = 'pending';
      }

      const updateData: any = {
        ver_status: newVerStatus,
        verified: isVerified,
        ver_notes: adminNotes,
        updated_at: new Date().toISOString()
      };

      if (isVerified) {
        updateData.verified_at = new Date().toISOString();
        updateData.marketplace_access = true;
      }

      if (trialStarted) {
        updateData.trial_started_at = new Date().toISOString();
        updateData.trial_expires_at = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days
      }

      await supabase
        .from('pharmacies')
        .update(updateData)
        .eq('id', pharmacyId);

      // Update verification queue
      await supabase
        .from('verification_queue')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);

      // Log admin activity
      const { data: adminData } = await supabase.auth.getUser();
      if (adminData.user) {
        await supabase
          .from('verification_activities')
          .insert({
            pharmacy_id: pharmacyId,
            admin_id: adminData.user.id, // This should reference admin_users table
            activity_type: selectedAction === 'approve' ? 'completed' : 'rejected',
            notes: adminNotes,
            time_spent_minutes: 30 // Could track actual time spent
          });
      }

      toast.success(`Pharmacy verification ${selectedAction}d successfully!`);
      
      // Navigate back to dashboard
      onBack();

    } catch (error) {
      console.error('Error processing verification decision:', error);
      toast.error('Failed to process verification decision');
    } finally {
      setProcessing(false);
    }
  };

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.document_type === type);
  };

  const renderDocumentSection = (type: string) => {
    const typeInfo = DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES];
    const typeDocs = getDocumentsByType(type);

    return (
      <Card key={type} className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{typeInfo.name}</span>
            <Badge variant={typeDocs.length > 0 ? 'success' : 'secondary'}>
              {typeDocs.length} file{typeDocs.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {typeInfo.description}
          </p>
        </CardHeader>
        <CardContent>
          {/* Requirements checklist */}
          <div className="mb-4">
            <p className="font-semibold text-sm mb-2">Verification Requirements:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {typeInfo.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Documents */}
          {typeDocs.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
              No documents uploaded for this category
            </div>
          ) : (
            <div className="space-y-3">
              {typeDocs.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                          {doc.file_size && ` • ${Math.round(doc.file_size / 1024)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocument(doc.file_url, doc.file_name)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Document decision buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={documentDecisions[doc.id] === 'approved' ? 'default' : 'outline'}
                        onClick={() => handleDocumentAction(doc.id, 'approved')}
                        className={documentDecisions[doc.id] === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={documentDecisions[doc.id] === 'rejected' ? 'destructive' : 'outline'}
                        onClick={() => handleDocumentAction(doc.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                    <Badge 
                      variant={
                        documentDecisions[doc.id] === 'approved' ? 'success' :
                        documentDecisions[doc.id] === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {documentDecisions[doc.id] === 'approved' ? 'Approved' :
                       documentDecisions[doc.id] === 'rejected' ? 'Rejected' : 'Pending Review'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Pharmacy not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reviewing: {pharmacy.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pharmacy ID: {pharmacy.display_id} • 
              Submitted: {new Date(pharmacy.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={
          pharmacy.ver_status === 'approved' ? 'success' :
          pharmacy.ver_status === 'rejected' ? 'destructive' : 'secondary'
        }>
          {pharmacy.ver_status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pharmacy & Pharmacist Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pharmacy Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Pharmacy Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{pharmacy.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{pharmacy.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{pharmacy.addr || 'No address provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">License: {pharmacy.license_num || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm text-gray-600">{pharmacy.profile_completion_percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pharmacy-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pharmacy.profile_completion_percent}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pharmacists Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Pharmacists ({pharmacists.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pharmacists.map((pharmacist) => (
                  <div key={pharmacist.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {pharmacist.fname} {pharmacist.lname}
                      </p>
                      {pharmacist.is_primary && (
                        <Badge variant="primary">Primary Admin</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Email: {pharmacist.email}</p>
                      <p>Phone: {pharmacist.phone || 'Not provided'}</p>
                      <p>Pharmacist ID: {pharmacist.pharmacist_id_num || 'Not provided'}</p>
                      <p>Role: {pharmacist.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documents Review */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Verification</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review each document type and make individual decisions
                </p>
              </CardHeader>
            </Card>

            {/* Document sections */}
            {Object.keys(DOCUMENT_TYPES).map(type => renderDocumentSection(type))}

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes & Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your verification notes, feedback, or reasons for decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Final Decision */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Final Verification Decision</CardTitle>
                <p className="text-sm text-gray-600">
                  This action will update the pharmacy's verification status and trigger notifications.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      variant={selectedAction === 'approve' ? 'default' : 'outline'}
                      onClick={() => setSelectedAction('approve')}
                      className={selectedAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Pharmacy
                    </Button>
                    <Button
                      variant={selectedAction === 'reject' ? 'destructive' : 'outline'}
                      onClick={() => setSelectedAction('reject')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Pharmacy
                    </Button>
                    <Button
                      variant={selectedAction === 'request_info' ? 'default' : 'outline'}
                      onClick={() => setSelectedAction('request_info')}
                      className={selectedAction === 'request_info' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Request More Info
                    </Button>
                  </div>

                  <Button
                    onClick={handleFinalDecision}
                    disabled={!selectedAction || processing}
                    className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90 text-white"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      `Confirm ${selectedAction ? selectedAction.replace('_', ' ').toUpperCase() : 'DECISION'}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyReviewInterface;