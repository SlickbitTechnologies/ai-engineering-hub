'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { File, FileText, CheckCircle, Clock, AlertCircle, Eye, EyeOff, Download, ArrowLeft, ChevronRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../../lib/AuthContext';
import { getDocument, updateDocument } from '../../../lib/firebase';

export default function DocumentDetail({ params }) {
  const documentId = params.id;
  const { user, isAuthenticated, loading } = useAuth();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const router = useRouter();
  
  // Mock templates - in a real app, these would be fetched from Firestore
  const templates = [
    { id: 'template1', name: 'HIPAA Compliance', description: 'Redacts PHI including names, addresses, emails, and medical record numbers' },
    { id: 'template2', name: 'GDPR Standard', description: 'Redacts personal identifiable information as per GDPR guidelines' },
    { id: 'template3', name: 'Internal Communications', description: 'Redacts employee IDs, internal codes and proprietary information' },
  ];

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    async function fetchDocument() {
      if (!documentId || !user) return;
      
      try {
        const doc = await getDocument('documents', documentId);
        
        if (!doc) {
          setError('Document not found');
          return;
        }
        
        if (doc.userId !== user.uid) {
          setError('You do not have permission to view this document');
          return;
        }
        
        setDocument(doc);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchDocument();
    }
  }, [documentId, user]);

  const handleProcessDocument = async () => {
    if (!selectedTemplate || !document) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate document processing with progress
    const simulateProgress = () => {
      setProcessingProgress(prev => {
        if (prev < 95) {
          return prev + Math.floor(Math.random() * 5) + 1;
        }
        return prev;
      });
    };
    
    const progressInterval = setInterval(simulateProgress, 500);
    
    try {
      // In a real application, this would call your redaction API/service
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing time
      
      // Update document status
      await updateDocument('documents', documentId, {
        status: 'redacted',
        redactedAt: new Date(),
        templateId: selectedTemplate,
        redactedItems: [
          { type: 'email', count: 15 },
          { type: 'name', count: 23 },
          { type: 'address', count: 7 },
          { type: 'phone', count: 12 },
        ]
      });
      
      // Update local state
      setDocument(prev => ({
        ...prev,
        status: 'redacted',
        redactedAt: { seconds: Date.now() / 1000 },
        templateId: selectedTemplate,
        redactedItems: [
          { type: 'email', count: 15 },
          { type: 'name', count: 23 },
          { type: 'address', count: 7 },
          { type: 'phone', count: 12 },
        ]
      }));
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      // Navigate to report page after completion
      setTimeout(() => {
        router.push(`/documents/${documentId}/report`);
      }, 1500);
      
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSelectedTemplateName = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    return template ? template.name : 'Select a template';
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <Link href="/documents" className="font-medium underline hover:text-red-600">
                    Return to documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with navigation */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <Link href="/documents" className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {document?.filename || 'Document Details'}
              </h1>
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {document?.type || 'Unknown type'}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Uploaded on {formatDate(document?.createdAt)}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                {document?.status === 'redacted' ? (
                  <>
                    <CheckCircle className="flex-shrink-0 mr-1.5 h-5 w-5 text-chateau-green-500" />
                    <span className="text-chateau-green-600">Redacted</span>
                  </>
                ) : (
                  <>
                    <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-yellow-500" />
                    <span className="text-yellow-600">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex md:mt-0 md:ml-4 space-x-3">
            {document?.status === 'redacted' && (
              <Link
                href={`/documents/${documentId}/report`}
                className="btn-primary inline-flex items-center"
              >
                <Eye className="mr-2 h-5 w-5" />
                View Report
              </Link>
            )}
          </div>
        </div>

        {/* Document Preview and Redaction Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Document Preview */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Original Document</h3>
              <a 
                href={document?.file?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-chateau-green-600 hover:text-chateau-green-500"
              >
                <Eye className="mr-1 h-4 w-4" />
                Preview
              </a>
            </div>
            <div className="border-t border-gray-200">
              <div className="h-96 bg-gray-50 flex flex-col items-center justify-center">
                <File className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">
                  {document?.type === 'application/pdf' ? 'PDF Document' : 'DOCX Document'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {document?.filename}
                </p>
                <a
                  href={document?.file?.url}
                  download={document?.filename}
                  className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>

          {/* Redacted Preview or Process Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {document?.status === 'redacted' ? 'Redacted Document' : 'Redaction Process'}
              </h3>
              {document?.status === 'redacted' && (
                <a 
                  href="#" // In a real app, this would be the redacted document URL
                  className="inline-flex items-center text-sm font-medium text-chateau-green-600 hover:text-chateau-green-500"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Preview
                </a>
              )}
            </div>
            <div className="border-t border-gray-200">
              {document?.status === 'redacted' ? (
                // Redacted document preview
                <div className="h-96 bg-gray-50 flex flex-col items-center justify-center">
                  <File className="h-16 w-16 text-chateau-green-600 mb-4" />
                  <p className="text-sm text-gray-700">
                    Redacted using <span className="font-medium">{getSelectedTemplateName()}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Processed on {formatDate(document?.redactedAt)}
                  </p>
                  <div className="mt-4 flex space-x-3">
                    <a
                      href="#" // In a real app, this would be the redacted document URL
                      download={`redacted-${document?.filename}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                    <Link
                      href={`/documents/${documentId}/report`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                    >
                      View Full Report
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : isProcessing ? (
                // Processing progress indicator
                <div className="h-96 bg-gray-50 flex flex-col items-center justify-center px-8">
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div 
                      className="bg-chateau-green-600 h-4 rounded-full" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Processing Your Document
                  </h3>
                  <p className="text-center text-sm text-gray-500 mb-4">
                    We're applying the {getSelectedTemplateName()} template to your document.
                    This may take a few moments.
                  </p>
                  <div className="text-center text-sm text-gray-500 mt-4">
                    <p>Progress: {processingProgress}%</p>
                  </div>
                </div>
              ) : (
                // Redaction template selection and process button
                <div className="h-96 bg-gray-50 flex flex-col items-center justify-center px-8">
                  <EyeOff className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Apply Redaction Template
                  </h3>
                  <p className="text-center text-sm text-gray-500 mb-4">
                    Select a redaction template to process this document.
                    The template will determine which types of sensitive information
                    will be redacted from your document.
                  </p>
                  <div className="w-full max-w-sm">
                    <Dialog.Root open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                      <Dialog.Trigger asChild>
                        <button
                          className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-chateau-green-500"
                        >
                          <span>{getSelectedTemplateName()}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6">
                          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                            Select a Redaction Template
                          </Dialog.Title>
                          <div className="space-y-3 mt-2 max-h-80 overflow-y-auto">
                            {templates.map((template) => (
                              <div 
                                key={template.id} 
                                className={`border rounded-md p-3 cursor-pointer hover:border-chateau-green-500 ${
                                  selectedTemplate === template.id ? 'border-chateau-green-500 bg-chateau-green-50' : 'border-gray-200'
                                }`}
                                onClick={() => {
                                  setSelectedTemplate(template.id);
                                  setIsTemplateDialogOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                                  {selectedTemplate === template.id && (
                                    <CheckCircle className="h-5 w-5 text-chateau-green-500" />
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-5 sm:mt-6 flex justify-end">
                            <Dialog.Close asChild>
                              <button
                                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-chateau-green-600 text-sm font-medium text-white hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                              >
                                Done
                              </button>
                            </Dialog.Close>
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                    
                    <button
                      onClick={handleProcessDocument}
                      disabled={!selectedTemplate}
                      className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Process Document
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 