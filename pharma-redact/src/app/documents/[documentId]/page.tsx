"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document, updateDocumentStatus, updateDocumentProperties, removeDocument } from "@/store/slices/documentsSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { PDFProcessor } from '@/utils/pdf-processor';
import { storeRedactedFileLocally, getViewableUrl, deleteDocument as deleteLocalDocument } from '@/utils/localStorage';
import { redactionTemplates } from "@/config/redactionTemplates";
import { motion, AnimatePresence } from "framer-motion";
import { RedactionTemplate, RedactionReport } from "@/types/redaction";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveRedactionReport } from "@/store/slices/redactionSlice";
import { CheckCircle, Loader2, XCircle, AlertCircle, XIcon, ChevronDown, Check } from "lucide-react";
import { Toast, ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { RedactionPreview } from './components/RedactionPreview';
import { DocumentProcessor, ProcessingStatus, ProcessingStats } from '@/components/DocumentProcessor';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  // Get documentId with null check
  const documentId = params?.documentId as string;
  
  // Get document from Redux store
  const { documents, isLoading } = useSelector((state: RootState) => state.documents);
  const { templates } = useSelector((state: RootState) => state.redaction);
  
  // Find the document with matching ID
  const documentFromStore = documents.find(doc => doc.id === documentId);
  
  // Create a ref to allow cancellation
  const processingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Use document from store or redirect if not found
  useEffect(() => {
    if (!documentFromStore && !isLoading && documents.length > 0) {
      router.push('/documents');
    }
  }, [documentFromStore, documents, router, isLoading]);
  
  const [document, setDocument] = useState<Document | undefined>(documentFromStore);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [redactedPdfBytes, setRedactedPdfBytes] = useState<Uint8Array | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTemplateValidation, setShowTemplateValidation] = useState(false);
  const [processingStats, setProcessingStats] = useState<{
    page?: number;
    totalPages?: number;
    entitiesFound?: number;
  }>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null);
  
  // Update local state when Redux store changes
  useEffect(() => {
    if (documentFromStore) {
      setDocument(documentFromStore);
    }
  }, [documentFromStore]);
  
  // Initialize templates when component loads
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
      console.log("Selected initial template:", templates[0].name);
    }
  }, [templates, selectedTemplateId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing processing when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Add a new effect to handle template selection and validation
  useEffect(() => {
    // Validate if we have a template selected
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId) || 
                       redactionTemplates.find(t => t.id === selectedTemplateId);
      
      if (template) {
        // Validate template
        const isValid = validateTemplate(template);
        setShowTemplateValidation(isValid);
      } else {
        setShowTemplateValidation(false);
      }
    } else {
      setShowTemplateValidation(false);
    }
  }, [selectedTemplateId, templates, redactionTemplates]);

  const handleShowTemplateSelector = () => {
    setShowTemplateSelector(true);
    // Default select the first template if none selected
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
      console.log("Selected template in handler:", templates[0].name);
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    processingRef.current = false;
    setIsProcessing(false);
    setErrorMessage(null);
    
    // Update document status back to pending if it was processing
    if (document?.status === 'processing') {
      dispatch(updateDocumentStatus({
        id: documentId,
        status: 'pending'
      }));
      
      toast({
        title: "Processing cancelled",
        description: "Document processing was cancelled successfully.",
        variant: "default",
      });
    }
  };

  const formatStageName = (stage: string) => {
    switch (stage) {
      case 'extracting':
        return 'Extracting Text';
      case 'detecting':
        return 'Detecting Sensitive Information';
      case 'mapping':
        return 'Mapping Coordinates';
      case 'redacting':
        return 'Applying Redactions';
      case 'complete':
        return 'Complete';
      default:
        return 'Processing';
    }
  };

  const validateTemplate = (template: RedactionTemplate): boolean => {
    // Check if template has at least one category
    if (!template.categories || template.categories.length === 0) {
      setErrorMessage("Selected template has no redaction categories");
      return false;
    }
    
    // Check if categories have valid patterns
    const hasValidPatterns = template.categories.some(
      category => category.patterns && category.patterns.length > 0
    );
    
    if (!hasValidPatterns) {
      setErrorMessage("Selected template has no valid redaction patterns");
      return false;
    }
    
    return true;
  };

  const handleProcessDocument = async () => {
    if (!selectedTemplateId) {
      toast({
        title: "Template Required",
        description: "Please select a redaction template first",
        variant: "destructive",
      });
      return;
    }

    setShowTemplateSelector(false);
    setErrorMessage(null);
    
    // Get the document from Redux store
    const document = documents.find(doc => doc.id === documentId);
    if (!document) {
      setErrorMessage("Document not found");
      return;
    }

    // Get the selected template
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || 
                            redactionTemplates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      setErrorMessage("Template not found");
      return;
    }
    
    // Validate the template before proceeding
    if (!validateTemplate(selectedTemplate)) {
      return;
    }

    try {
      // Fetch the PDF file for preview
      let pdfBytes;
      if (document.fileUrl && document.fileUrl.startsWith('local://')) {
        const blob = await fetch(await getViewableUrl(document.fileUrl)).then(res => res.arrayBuffer());
        pdfBytes = new Uint8Array(blob);
      } else {
        const response = await fetch(document.path);
        const arrayBuffer = await response.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      }
      
      // Save the bytes for processing later
      setPreviewBytes(pdfBytes);
      
      // Show the preview component
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error fetching document for preview:', error);
      setErrorMessage(`Error fetching document: ${error.message}`);
    }
  };

  const handleContinueFromPreview = async () => {
    setShowPreview(false);
    
    if (!previewBytes || !selectedTemplateId) {
      setErrorMessage("Missing document data or template");
      return;
    }
    
    try {
      setIsProcessing(true);
      setProgress(0);
      setProcessingStage('');
      setRedactedPdfBytes(null);
      
      // Set processing ref flag to true
      processingRef.current = true;
      
      // Create new AbortController for this processing run
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Get the document from Redux store
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check if document size exceeds threshold (20MB) for warning
      const sizeInMB = document.size / (1024 * 1024);
      if (sizeInMB > 20) {
        toast({
          title: "Large Document Warning",
          description: `This document is ${sizeInMB.toFixed(1)}MB in size. Processing may take some time.`,
          variant: "warning",
        });
      }

      // Get the selected template
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || 
                              redactionTemplates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        throw new Error('Template not found');
      }

      // Update document status to processing
      dispatch(updateDocumentStatus({
        id: documentId,
        status: 'processing'
      }));

      // Setup progress callback
      PDFProcessor.setProgressCallback((progress) => {
        if (!processingRef.current) return; // Skip updates if processing was cancelled
        
        console.log(`Processing progress: ${progress.stage} - ${progress.progress}%`);
        setProcessingStage(progress.stage);
        setProgress(progress.progress);
        
        // Update additional stats if available
        if (progress.page !== undefined) {
          setProcessingStats(prev => ({ ...prev, page: progress.page, totalPages: progress.totalPages }));
        }
        if (progress.entitiesFound !== undefined) {
          setProcessingStats(prev => ({ ...prev, entitiesFound: progress.entitiesFound }));
        }
      });

      // Check if processing was cancelled
      if (signal?.aborted) return;

      console.log("Starting PDF processing with template:", selectedTemplate.name);
      const { redactedPdf: redactedPdfData, entities } = await PDFProcessor.processPDF(previewBytes, selectedTemplate, signal);
      
      // Check if processing was cancelled
      if (!processingRef.current) return;
      
      console.log("PDF processing complete, got result of size:", redactedPdfData.length, "bytes");
      
      if (!redactedPdfData || redactedPdfData.length === 0) {
        throw new Error("Processed PDF is empty");
      }
      
      setRedactedPdfBytes(redactedPdfData);

      // Store the redacted PDF locally
      const redactedFileName = `redacted_${document.name}`;
      const redactedUrl = await storeRedactedFileLocally(
        documentId,
        redactedPdfData,
        redactedFileName
      );

      // Update document status and redactedUrl in Redux
      dispatch(updateDocumentProperties({
        id: documentId,
        properties: {
          status: 'redacted',
          redactedUrl: redactedUrl,
          entitiesFound: entities.length
        }
      }));
      
      // Create and save the redaction report
      const entitiesByType: Record<string, number> = {};
      const entitiesByPage: Record<number, number> = {};
      
      if (entities && entities.length > 0) {
        // Calculate statistics
        entities.forEach(entity => {
          // Count by type
          entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
          
          // Count by page
          entitiesByPage[entity.page] = (entitiesByPage[entity.page] || 0) + 1;
        });
        
        // Create the report
        const report: RedactionReport = {
          totalEntities: entities.length,
          entitiesByType,
          entitiesByPage,
          entityList: entities,
        };
        
        // Save the report to Redux
        dispatch(saveRedactionReport({
          documentId,
          report
        }));
        
        console.log("Redaction report created with", entities.length, "entities");
        
        // Show success toast
        toast({
          title: "Document Processed Successfully",
          description: `Redacted ${entities.length} sensitive items from the document.`,
          variant: "success",
        });
      } else {
        console.log("No entities detected, creating empty report");
        // Create an empty report
        const report: RedactionReport = {
          totalEntities: 0,
          entitiesByType: {},
          entitiesByPage: {},
          entityList: [],
        };
        
        // Save the report to Redux
        dispatch(saveRedactionReport({
          documentId,
          report
        }));
        
        toast({
          title: "Document Processed",
          description: "No sensitive information was found to redact.",
          variant: "default",
        });
      }

      setProgress(100);
      
      // After successful processing, navigate to the report page
      router.push(`/documents/${documentId}/report`);
      
    } catch (error: any) {
      console.error('Error processing document:', error);
      
      // Handle specific error types
      let errorMsg = "An unknown error occurred during processing";
      
      if (error.name === 'AbortError') {
        console.log('Processing aborted');
        return;
      } else if (error.message.includes('PDF')) {
        errorMsg = `PDF Error: ${error.message}`;
      } else if (error.message.includes('network')) {
        errorMsg = `Network Error: ${error.message}`;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      // Show error toast
      toast({
        title: "Processing Failed",
        description: errorMsg,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try Again</ToastAction>,
      });
      
      // Update document status to error
      dispatch(updateDocumentStatus({
        id: documentId,
        status: 'error'
      }));
    } finally {
      processingRef.current = false;
      abortControllerRef.current = null;
      setIsProcessing(false);
      setPreviewBytes(null);
    }
  };

  const handleDownloadRedactedPDF = async () => {
    if (!document?.redactedUrl) return;
    
    try {
      if (redactedPdfBytes) {
        // Use the in-memory redacted PDF if available
        PDFProcessor.downloadRedactedPDF(
          redactedPdfBytes, 
          `redacted-${document.name || 'document.pdf'}`
        );
      } else {
        // Otherwise fetch from storage
        const viewableUrl = await getViewableUrl(document.redactedUrl);
        window.open(viewableUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error downloading redacted PDF:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the redacted PDF",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Show loading state while document is being fetched
  if (isLoading || !document) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <svg 
                className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h2 className="text-xl font-medium text-gray-700">Loading document...</h2>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Go back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{document.name}</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-1 ml-9">
                {document.type.toUpperCase()} • {formatFileSize(document.size)}
              </p>
            </div>
          </div>

          {/* Document Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h2>
                
                {isProcessing || document.status === 'processing' ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    {/* Processing Progress Section */}
                    <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                      <div 
                        className="bg-primary-600 h-4 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                    <p className="text-gray-600">{formatStageName(processingStage)} ({progress}%)</p>
                    
                    {processingStage === 'detecting' && processingStats.page && processingStats.totalPages && (
                      <p className="text-sm text-gray-500 mt-2">
                        Page {processingStats.page} of {processingStats.totalPages}
                      </p>
                    )}
                    
                    {processingStage === 'redacting' && processingStats.entitiesFound && (
                      <p className="text-sm text-gray-500 mt-2">
                        Redacting {processingStats.entitiesFound} sensitive items
                      </p>
                    )}
                    
                    {/* Cancel Button */}
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={handleCancelProcessing}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancel Processing
                    </Button>
                  </div>
                ) : document.status === 'redacted' ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <p className="text-green-700">
                        This document has been successfully redacted.
                        {document.entitiesFound !== undefined && (
                          <span className="ml-1">
                            {document.entitiesFound} {document.entitiesFound === 1 ? 'entity' : 'entities'} were redacted.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : document.status === 'error' ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="text-red-700">
                          There was an error processing this document.
                        </p>
                        {errorMessage && (
                          <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={handleShowTemplateSelector}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                    <div className="mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-gray-400 mx-auto">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 13h6" />
                        <path d="M9 17h6" />
                        <path d="M10 9h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Ready to Process</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-4">
                      Select a redaction template and click "Process Document" to start redacting sensitive information.
                    </p>
                    
                    <div className="flex flex-col items-center justify-center gap-6">
                      {/* Template Selector */}
                      <div className="w-full max-w-md">
                        <div className="relative">
                          <Button
                            variant="outline"
                            onClick={handleShowTemplateSelector}
                            className="w-full justify-between font-normal relative"
                          >
                            <span>
                              {selectedTemplateId ? (
                                <>
                                  Template: <span className="font-medium">
                                    {templates.find(t => t.id === selectedTemplateId)?.name || 
                                     redactionTemplates.find(t => t.id === selectedTemplateId)?.name || 
                                     "Select Template"}
                                  </span>
                                </>
                              ) : (
                                "Select Redaction Template"
                              )}
                            </span>
                            <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                            
                            {/* Template Selected Indicator */}
                            {showTemplateValidation && (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.5 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-8 text-primary-500"
                              >
                                <Check className="h-4 w-4" />
                              </motion.span>
                            )}
                          </Button>
                          
                          {!selectedTemplateId && (
                            <motion.p 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }}
                              className="text-sm text-amber-600 mt-2 text-left"
                            >
                              Please select a template to enable processing
                            </motion.p>
                          )}
                        </div>
                      </div>
                      
                      {/* Processing Button */}
                      <motion.div 
                        className="w-full max-w-md"
                        animate={{ 
                          scale: showTemplateValidation ? 1 : 0.98,
                          opacity: showTemplateValidation ? 1 : 0.7
                        }}
                        transition={{ type: "spring", bounce: 0.3 }}
                      >
                        <Button
                          size="lg"
                          className="w-full"
                          disabled={!showTemplateValidation}
                          onClick={handleProcessDocument}
                        >
                          Process Document
                        </Button>
                        
                        {!showTemplateValidation && (
                          <p className="text-xs text-gray-500 mt-2">
                            Button is disabled until a valid template is selected
                          </p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                )}
                
                {/* Error Message Display */}
                {errorMessage && !isProcessing && document.status !== 'error' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Document Details</h2>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        document.status === 'pending' ? 'bg-yellow-500' :
                        document.status === 'processing' ? 'bg-blue-500' :
                        document.status === 'redacted' ? 'bg-primary-500' :
                        document.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></span>
                      <p className="text-gray-900 font-medium capitalize">{document.status}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Source</p>
                    <p className="text-gray-900 capitalize">{document.source}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Uploaded</p>
                    <p className="text-gray-900">{new Date(document.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">File Type</p>
                    <p className="text-gray-900">{document.type.toUpperCase()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">File Size</p>
                    <p className="text-gray-900">{formatFileSize(document.size)}</p>
                  </div>

                  {document.fileUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Storage Location</p>
                      <a 
                        href={document.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline truncate block"
                      >
                        View Original File
                      </a>
                    </div>
                  )}
                </div>

                {document.status === 'redacted' && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Redaction Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Sensitive Items Redacted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {document.entitiesFound !== undefined 
                            ? `${document.entitiesFound} ${document.entitiesFound === 1 ? 'item' : 'items'}`
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add the DocumentProcessor with conditional rendering */}
        {document.status === 'pending' && selectedTemplateId && showTemplateValidation && (
          <div className="fixed bottom-6 right-6 z-40">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-72"
            >
              <DocumentProcessor
                documentId={documentId}
                documentSize={document.size}
                selectedTemplate={
                  templates.find(t => t.id === selectedTemplateId) || 
                  redactionTemplates.find(t => t.id === selectedTemplateId)
                }
                onComplete={(stats: ProcessingStats) => {
                  // Update document status and redactedUrl in Redux
                  dispatch(updateDocumentProperties({
                    id: documentId,
                    properties: {
                      status: 'redacted',
                      entitiesFound: stats.totalEntitiesFound
                    }
                  }));
                  // Navigate to report
                  router.push(`/documents/${documentId}/report`);
                }}
                onCancel={handleCancelProcessing}
                processDocument={async (docId, templateId, signal) => {
                  if (!templateId) {
                    throw new Error("Template is required");
                  }
                  
                  // Get the document from Redux store
                  const document = documents.find(doc => doc.id === docId);
                  if (!document) {
                    throw new Error("Document not found");
                  }
                  
                  // Get the selected template
                  const selectedTemplate = templates.find(t => t.id === templateId) || 
                                         redactionTemplates.find(t => t.id === templateId);
                  if (!selectedTemplate) {
                    throw new Error("Template not found");
                  }
                  
                  try {
                    // Fetch the PDF file
                    let pdfBytes;
                    if (document.fileUrl && document.fileUrl.startsWith('local://')) {
                      const blob = await fetch(await getViewableUrl(document.fileUrl)).then(res => res.arrayBuffer());
                      pdfBytes = new Uint8Array(blob);
                    } else {
                      const response = await fetch(document.path);
                      const arrayBuffer = await response.arrayBuffer();
                      pdfBytes = new Uint8Array(arrayBuffer);
                    }
                    
                    // Process PDF
                    const startTime = Date.now();
                    const { redactedPdf, entities } = await PDFProcessor.processPDF(pdfBytes, selectedTemplate, signal);
                    const processingTime = Date.now() - startTime;
                    
                    // Store the redacted PDF locally
                    const redactedFileName = `redacted_${document.name}`;
                    const redactedUrl = await storeRedactedFileLocally(
                      docId,
                      redactedPdf,
                      redactedFileName
                    );
                    
                    // Update document with redactedUrl
                    dispatch(updateDocumentProperties({
                      id: docId,
                      properties: {
                        redactedUrl
                      }
                    }));
                    
                    // Create and save the redaction report
                    const entitiesByType: Record<string, number> = {};
                    const entitiesByPage: Record<number, number> = {};
                    
                    if (entities && entities.length > 0) {
                      // Calculate statistics
                      entities.forEach(entity => {
                        // Count by type
                        entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
                        
                        // Count by page
                        entitiesByPage[entity.page] = (entitiesByPage[entity.page] || 0) + 1;
                      });
                      
                      // Create the report
                      const report: RedactionReport = {
                        totalEntities: entities.length,
                        entitiesByType,
                        entitiesByPage,
                        entityList: entities,
                      };
                      
                      // Save the report to Redux
                      dispatch(saveRedactionReport({
                        documentId: docId,
                        report
                      }));
                    } else {
                      // Create an empty report
                      const report: RedactionReport = {
                        totalEntities: 0,
                        entitiesByType: {},
                        entitiesByPage: {},
                        entityList: [],
                      };
                      
                      // Save the report to Redux
                      dispatch(saveRedactionReport({
                        documentId: docId,
                        report
                      }));
                    }
                    
                    toast({
                      title: "Document Processed Successfully",
                      description: `Redacted ${entities.length} sensitive items from the document.`,
                      variant: "success",
                    });
                    
                    // Return processing stats
                    return {
                      totalEntitiesFound: entities.length,
                      processingTimeMs: processingTime
                    };
                  } catch (error: any) {
                    console.error('Error processing document:', error);
                    throw new Error(error.message || "Unknown error occurred");
                  }
                }}
              />
            </motion.div>
          </div>
        )}

        {/* Template Selector Modal with Animation */}
        <AnimatePresence>
          {showTemplateSelector && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Select Redaction Template
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Choose a template to apply to your document. Each template contains different redaction rules.
                  {templates.length > 0 && (
                    <span className="ml-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      {templates.length} template{templates.length !== 1 ? 's' : ''} available
                    </span>
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {templates.length > 0 ? (
                    templates.map((template: RedactionTemplate) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`border rounded-lg p-4 cursor-pointer transition-all relative ${
                          selectedTemplateId === template.id 
                            ? 'bg-primary-50 shadow-sm'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                        style={{
                          borderWidth: selectedTemplateId === template.id ? '2px' : '1px',
                          borderColor: selectedTemplateId === template.id ? '#16a34a' : '',
                          boxShadow: selectedTemplateId === template.id ? '0 0 0 1px rgba(22, 163, 74, 0.2)' : ''
                        }}
                        onClick={() => {
                          console.log("Selected template:", template.name);
                          setSelectedTemplateId(template.id);
                          setErrorMessage(null);
                        }}
                      >
                        {selectedTemplateId === template.id && (
                          <motion.div 
                            className="absolute top-3 right-3 text-white rounded-full p-0.5"
                            style={{ backgroundColor: '#16a34a' }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.3 }}
                          >
                            <Check className="h-4 w-4" />
                          </motion.div>
                        )}
                        <h3 className={`font-medium ${selectedTemplateId === template.id ? 'text-[#16a34a]' : 'text-gray-900'}`}>{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {template.categories.map((category, index) => (
                            <Badge key={index} variant={selectedTemplateId === template.id ? "default" : "secondary"}>
                              {category.type}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 border border-dashed rounded-lg">
                      <p className="text-gray-500">No templates available. Please create templates in the Redaction Settings section.</p>
                    </div>
                  )}
                </div>
                
                {/* Error message in template modal */}
                {errorMessage && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <p className="text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => {
                      setShowTemplateSelector(false);
                      setErrorMessage(null);
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!selectedTemplateId || templates.length === 0}
                    className={`px-4 py-2 rounded-md text-white ${
                      selectedTemplateId && templates.length > 0
                        ? "hover:bg-opacity-90" 
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    style={{
                      backgroundColor: (selectedTemplateId && templates.length > 0) ? '#16a34a' : ''
                    }}
                    onClick={() => {
                      console.log("Processing with template ID:", selectedTemplateId);
                      const template = templates.find(t => t.id === selectedTemplateId);
                      console.log("Template name:", template?.name);
                      handleProcessDocument();
                    }}
                  >
                    {selectedTemplateId ? (
                      <>
                        Process with{" "}
                        <span className="font-bold">
                          {templates.find(t => t.id === selectedTemplateId)?.name || 
                           redactionTemplates.find(t => t.id === selectedTemplateId)?.name}
                        </span>
                      </>
                    ) : (
                      "Process with Selected Template"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && previewBytes && selectedTemplateId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Redaction Preview
                </h2>
                
                <RedactionPreview
                  documentId={documentId}
                  documentFile={previewBytes}
                  template={
                    templates.find(t => t.id === selectedTemplateId) || 
                    redactionTemplates.find(t => t.id === selectedTemplateId)!
                  }
                  onContinue={handleContinueFromPreview}
                  onCancel={() => {
                    setShowPreview(false);
                    setPreviewBytes(null);
                  }}
                  onError={(message) => {
                    setErrorMessage(message);
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
} 