'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, Download, AlertCircle,
  FileText, ChevronRight, Eye, AlertTriangle, Trash2, Play, 
  ShieldCheck, RefreshCw, X, Check, FileType
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { getDocumentById, deleteDocument } from '../../../../app/lib/firebase';
import { redactDocument, getRedactionReport, getUserTemplates } from '../../../../app/lib/redactionEngine';
import { useAuth } from '../../../../app/lib/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function DocumentDetail() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id;

  const [document, setDocument] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!user && !authLoading) {
      console.log('Document detail: Not authenticated, redirecting to login page');
      router.push('/auth');
      return;
    }

    if (user && documentId) {
      fetchDocumentDetails();
      fetchTemplates();
    }
  }, [user, authLoading, documentId, router]);

  const fetchDocumentDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const doc = await getDocumentById(documentId);
      
      if (!doc) {
        setError('Document not found');
        setIsLoading(false);
        return;
      }
      
      if (doc.userId !== user.uid) {
        setError('You do not have permission to view this document');
        setIsLoading(false);
        return;
      }
      
      setDocument(doc);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!user) {
      console.error('No user available to fetch templates');
      return;
    }
    
    setIsTemplatesLoading(true);
    try {
      console.log('Fetching templates for user:', user.uid);
      
      // Try to get templates using our function
      let userTemplates = await getUserTemplates(user.uid);
      console.log('Templates returned from getUserTemplates:', userTemplates);
      
      // Add logging to check if rules are attached to templates
      if (userTemplates && userTemplates.length > 0) {
        console.log(`Fetched ${userTemplates.length} templates for document redaction`);
        userTemplates.forEach(template => {
          const hasRules = template.rules && Array.isArray(template.rules) && template.rules.length > 0;
          console.log(`Template ${template.id} - ${template.name}:`, 
            hasRules ? `Contains ${template.rules.length} rules` : "No rules attached",
            template.ruleIds ? `Has ${template.ruleIds.length} ruleIds` : "No ruleIds"
          );
          
          // If we have ruleIds but no rules, attach rules from ruleIds
          if (!hasRules && template.ruleIds && template.ruleIds.length > 0) {
            console.log(`Template ${template.id} has ruleIds but no rules, will need rule fetching when redacting`);
          }
        });
      }
      
      // If no templates were found, try a direct Firestore query as fallback
      if (!userTemplates || userTemplates.length === 0) {
        console.log('No templates found with getUserTemplates, trying direct Firestore query');
        
        // Import Firebase directly in this function to avoid circular dependencies
        const { db, collection, query, where, getDocs } = await import('../../../../app/lib/firebase');
        
        // Direct query to Firestore
        const templatesQuery = query(
          collection(db, 'templates'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(templatesQuery);
        userTemplates = [];
        
        querySnapshot.forEach((doc) => {
          userTemplates.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('Templates retrieved from direct Firestore query:', userTemplates);
      }
      
      // Set templates regardless of source
      setTemplates(userTemplates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load redaction templates: ' + err.message);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateIds(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  const handleStartRedaction = async () => {
    setIsTemplateModalOpen(true);
  };

  const handleProcessDocument = async () => {
    if (isProcessing || selectedTemplateIds.length === 0) return;
    
    setIsTemplateModalOpen(false);
    setIsProcessing(true);
    setProcessingProgress(0);
    setError('');
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 99 : newProgress;
        });
      }, 500);
      
      // Process the document using the redaction engine with the first selected template
      // In a real implementation, you might want to process with all selected templates
      const result = await redactDocument(documentId, selectedTemplateIds[0]);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      // Brief delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use setTimeout to push the route after the current render cycle
      setTimeout(() => {
        router.push(`/documents/${documentId}/report`);
      }, 0);
    } catch (err) {
      console.error('Error processing document:', err);
      setError(`Failed to process document: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await deleteDocument(documentId, user.uid);
      setIsDeleteModalOpen(false);
      router.push('/documents');
    } catch (err) {
      console.error('Error deleting document:', err);
      setDeleteError('Failed to delete document. Please try again.');
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = () => {
    if (document.status === 'redacted') {
      return (
        <>
          <CheckCircle className="h-3 w-3 mr-1" />
          Redacted
        </>
      );
    } else if (document.status === 'processing') {
      return (
        <>
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </>
      );
    } else if (document.status === 'failed') {
      return (
        <>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Failed
        </>
      );
    } else {
      return (
        <>
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </>
      );
    }
  };

  const getStatusColor = () => {
    if (document.status === 'redacted') {
      return 'bg-green-100 text-green-800';
    } else if (document.status === 'processing') {
      return 'bg-blue-100 text-blue-800';
    } else if (document.status === 'failed') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getFileIcon = () => {
    const fileType = document?.fileType || document?.contentType || '';
    const fileName = document?.fileName || document?.filename || '';
    
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else {
      return <FileType className="h-8 w-8 text-gray-500" />;
    }
  };

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link href="/documents" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Documents
        </Link>
      </motion.div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
        </div>
      ) : error ? (
        <motion.div
          initial={fadeIn.hidden}
          animate={fadeIn.visible}
          className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200"
        >
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">{error}</p>
          <Link
            href="/documents"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700"
          >
            Return to Documents
          </Link>
        </motion.div>
      ) : document ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Preview Panel */}
          <motion.div
            initial={fadeIn.hidden}
            animate={fadeIn.visible}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Document Preview</h2>
              {document.downloadUrl && (
                <a
                  href={document.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </a>
              )}
            </div>
            
            <div className="flex-grow p-4 flex items-center justify-center bg-gray-100 min-h-[400px]">
              {document.downloadUrl ? (
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.downloadUrl)}&embedded=true`}
                  className="w-full h-full min-h-[400px] border-0"
                  title="Document Preview"
                ></iframe>
              ) : (
                <div className="text-center p-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    {getFileIcon()}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Preview Not Available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Processing may be needed before preview is available.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Document Details Panel */}
          <motion.div
            initial={fadeIn.hidden}
            animate={fadeIn.visible}
            className="space-y-6"
          >
            {/* Document Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-gray-100">
                    {getFileIcon()}
                  </div>
                  <div className="ml-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {document.fileName || document.filename || 'Unnamed Document'}
                    </h1>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Uploaded on {formatDate(document.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}
                      >
                        {getStatusDisplay()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <Dialog.Trigger asChild>
                    <button className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </button>
                  </Dialog.Trigger>
                  
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-20">
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="mt-3">
                          <Dialog.Title className="text-lg font-medium text-gray-900">
                            Delete Document
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Are you sure you want to delete this document? This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {deleteError && (
                        <div className="mt-4 p-3 bg-red-50 text-red-800 text-sm rounded-md">
                          {deleteError}
                        </div>
                      )}
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <Dialog.Close asChild>
                          <button
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={isDeleting}
                          >
                            Cancel
                          </button>
                        </Dialog.Close>
                        <button
                          onClick={handleDeleteDocument}
                          disabled={isDeleting}
                          className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>
            
            {/* Document Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">File Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{document.fileName || document.filename || 'N/A'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Upload Date</h3>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(document.createdAt)}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">File Type</h3>
                    <p className="mt-1 text-sm text-gray-900">{document.fileType || document.contentType || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}
                      >
                        {getStatusDisplay()}
                      </span>
                    </div>
                  </div>
                  
                  {document.lastModified && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Last Modified</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(document.lastModified)}</p>
                    </div>
                  )}
                  
                  {document.fileSize && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500">File Size</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {Math.round(document.fileSize / 1024)} KB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Processing Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Processing Status</h2>
              
              {isProcessing ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                    </div>
                    <div className="ml-3 w-full">
                      <h3 className="text-sm font-medium text-blue-800">Processing In Progress</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Your document is currently being processed. This may take a few minutes.</p>
                      </div>
                      <div className="mt-4 w-full bg-blue-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : document.status === 'redacted' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Processing Complete</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          This document has been successfully processed and redacted.
                          {document.redactedAt && 
                            ` Completed on ${formatDate(document.redactedAt)}.`}
                        </p>
                      </div>
                      <div className="mt-4">
                        <Link
                          href={`/documents/${documentId}/report`}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          View Redaction Report
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : document.status === 'failed' ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Processing Failed</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          There was an error processing this document.
                          {document.processingError && 
                            ` Error: ${document.processingError}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Ready for Processing</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            This document is ready to be processed with our redaction engine.
                            Select a redaction template to begin.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleStartRedaction}
                    disabled={isTemplatesLoading || templates.length === 0}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 disabled:opacity-50"
                  >
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Start Redaction
                  </button>
                  
                  {templates.length === 0 && (
                    <div className="mt-4 text-center text-xs text-red-600">
                      <Link href="/redaction-settings" className="underline hover:text-red-800">
                        Create templates in Redaction Settings
                      </Link> before starting redaction
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
      
      {/* Template Selection Modal */}
      <Dialog.Root open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-20">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Select Redaction Templates
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full p-1 hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Choose one or more templates to use for redacting sensitive information from this document.
              </p>
            </div>
            
            <div className="max-h-60 overflow-y-auto mb-6">
              {isTemplatesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-chateau-green-600 border-t-transparent rounded-full"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-500">
                    No templates available. Create templates in Redaction Settings.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <div key={template.id} 
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedTemplateIds.includes(template.id) 
                          ? 'border-chateau-green-500 bg-chateau-green-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                          {template.description && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{template.description}</p>
                          )}
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {template.ruleIds?.length || 0} rules
                            </span>
                          </div>
                        </div>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border ${
                          selectedTemplateIds.includes(template.id) 
                            ? 'bg-chateau-green-500 border-chateau-green-500' 
                            : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {selectedTemplateIds.includes(template.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Dialog.Close asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleProcessDocument}
                disabled={selectedTemplateIds.length === 0}
                className="px-4 py-2 bg-chateau-green-600 text-white rounded-md text-sm font-medium hover:bg-chateau-green-700 disabled:opacity-50"
              >
                <span className="flex items-center">
                  <Play className="h-4 w-4 mr-1.5" />
                  Proceed
                </span>
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
} 