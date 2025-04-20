'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  File, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Download, 
  ArrowLeft, 
  ChevronRight, 
  X 
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../../lib/AuthContext';
import { getDocumentById, updateDocumentStatus, getTemplates } from '../../../../lib/firebase';
import { processDocument } from '../../../../lib/redaction';
import { generateDocumentPreview } from '../../../../lib/redactionService';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Add document preview component
const DocumentPreviewModal = ({ isOpen, onClose, documentUrl, documentType, documentName }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load document preview when the modal opens
  useEffect(() => {
    const loadPreview = async () => {
      if (isOpen && documentUrl) {
        setIsLoading(true);
        setError('');
        
        try {
          // For PDFs, we can use the URL directly
          if (documentType.toLowerCase().includes('pdf')) {
            setPreviewUrl(documentUrl);
          } else {
            // For other document types, use generateDocumentPreview helper
            const preview = await generateDocumentPreview(documentUrl, documentType);
            setPreviewUrl(preview);
          }
        } catch (err) {
          console.error('Error generating preview:', err);
          setError('Failed to generate document preview');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadPreview();
    
    // Clean up when modal closes
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, documentUrl, documentType]);

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-10 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-5xl h-[80vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
          <Dialog.Title className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-chateau-green-600" />
              <span className="font-medium text-lg">
                {documentName || 'Document Preview'}
              </span>
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </Dialog.Title>
          
          <div className="flex-1 overflow-hidden bg-gray-50">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center p-4">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <p className="text-gray-500 mt-2">Unable to load document preview</p>
              </div>
            ) : documentType.toLowerCase().includes('pdf') ? (
              <iframe 
                src={`${previewUrl}#toolbar=0&navpanes=0`} 
                className="w-full h-full border-0" 
                title="Document Preview"
              />
            ) : (
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-0" 
                title="Document Preview"
              />
            )}
          </div>
          
          <div className="p-4 border-t flex justify-between">
            <Dialog.Close asChild>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </Dialog.Close>
            <a 
              href={documentUrl} 
              download={documentName}
              className="px-4 py-2 bg-chateau-green-600 text-white rounded-md hover:bg-chateau-green-700 inline-flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default function DocumentDetail({ params }) {
  const unwrappedParams = use(params);
  const documentId = unwrappedParams.id;
  const { user, isAuthenticated, loading } = useAuth();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const router = useRouter();
  
  // Fetch templates from Firebase
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const templatesData = await getTemplates();
        setTemplates(templatesData);
      } catch (err) {
        console.error('Error fetching templates:', err);
        // Fallback to default templates if fetch fails
        setTemplates([
          { id: 'template1', name: 'HIPAA Compliance', description: 'Redacts PHI including names, addresses, emails, and medical record numbers' },
          { id: 'template2', name: 'GDPR Standard', description: 'Redacts personal identifiable information as per GDPR guidelines' },
          { id: 'template3', name: 'Internal Communications', description: 'Redacts employee IDs, internal codes and proprietary information' },
        ]);
      }
    }
    
    fetchTemplates();
  }, []);

  useEffect(() => {
    async function fetchDocument() {
      if (!documentId || !user) return;
      
      try {
        console.log(`Fetching document with ID: ${documentId}`);
        const doc = await getDocumentById(documentId);
        
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
    if (!selectedTemplate || !document || !user) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Start progress animation
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
      // Use the real redaction service
      const results = await processDocument(documentId, selectedTemplate, user.uid);
      
      // Update local state
      setDocument(prev => ({
        ...prev,
        status: 'redacted',
        redactedAt: { seconds: Date.now() / 1000 },
        templateId: selectedTemplate,
        redactionResults: results
      }));
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      // Navigate to report page after completion
      setTimeout(() => {
        router.push(`/documents/${documentId}/report`);
      }, 1500);
      
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to process document: ' + err.message);
      clearInterval(progressInterval);
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
      <div className="flex items-center justify-center h-full min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="p-6 md:p-8"
      >
        <div className="max-w-7xl mx-auto">
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
      </motion.div>
    );
  }

  // Modify the document cards to include proper preview functionality
  const documentCards = (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Original Document Preview */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Original Document</h3>
          <button 
            onClick={() => {
              setPreviewDocument({
                url: document?.file?.url,
                type: document?.type || 'application/pdf',
                name: document?.filename
              });
              setIsPreviewModalOpen(true);
            }}
            className="inline-flex items-center text-sm font-medium text-chateau-green-600 hover:text-chateau-green-500"
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </button>
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
          {document?.status === 'redacted' && document?.redactedUrl && (
            <button 
              onClick={() => {
                setPreviewDocument({
                  url: document.redactedUrl,
                  type: document?.type || 'application/pdf',
                  name: `Redacted-${document?.filename}`
                });
                setIsPreviewModalOpen(true);
              }}
              className="inline-flex items-center text-sm font-medium text-chateau-green-600 hover:text-chateau-green-500"
            >
              <Eye className="mr-1 h-4 w-4" />
              Preview
            </button>
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
                {document?.redactedUrl && (
                  <a
                    href={document.redactedUrl}
                    download={`redacted-${document?.filename}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                )}
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
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-chateau-green-600 h-4 rounded-full" 
                ></motion.div>
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
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-chateau-green-500"
                    >
                      <span>{getSelectedTemplateName()}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-50">
                      <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                        Select a Redaction Template
                      </Dialog.Title>
                      <div className="space-y-3 mt-2 max-h-80 overflow-y-auto">
                        {templates.map((template) => (
                          <motion.div 
                            key={template.id} 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
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
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-5 sm:mt-6 flex justify-end">
                        <Dialog.Close asChild>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-chateau-green-600 text-sm font-medium text-white hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                          >
                            Done
                          </motion.button>
                        </Dialog.Close>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProcessDocument}
                  disabled={!selectedTemplate}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Process Document
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Add preview modal to the component render
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-6 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with navigation */}
        <motion.div 
          variants={slideUp}
          className="md:flex md:items-center md:justify-between mb-6"
        >
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 transition-colors"
              >
                <Eye className="mr-2 h-5 w-5" />
                View Report
              </Link>
            )}
          </div>
        </motion.div>

        {/* Document cards section */}
        {documentCards}
        
        {/* Document Preview Modal */}
        <DocumentPreviewModal 
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          documentUrl={previewDocument?.url}
          documentType={previewDocument?.type}
          documentName={previewDocument?.name}
        />
      </div>
    </motion.div>
  );
} 