"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document, updateDocumentStatus, updateDocumentProperties, removeDocument } from "@/store/slices/documentsSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { PDFProcessor } from '@/utils/pdf-processor';
import { saveRedactedDocument, getDownloadUrl, deleteDocument as deleteServerDocument, downloadDocument, getAuthTokenAndHeaders } from '@/utils/fileServices';
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
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// Helper to get redaction types from template categories
const getRedactionTypes = (template: RedactionTemplate): string[] => {
  return template.categories.map(category => category.type);
};

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.documentId as string;
  const { isAuthenticated } = useAuth();
  const { 
    currentDocument, 
    loading, 
    error, 
    fetchDocument, 
    saveRedactedDocument 
  } = useDocuments();
  
  const [isRedacting, setIsRedacting] = useState(false);
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RedactionTemplate | null>(null);
  
  // Replace single template selection with multi-select
  const [selectedTemplates, setSelectedTemplates] = useState<RedactionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState(redactionTemplates);
  
  const [redactedFile, setRedactedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // New states for template modal and progress tracking
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [redactionProgress, setRedactionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch document on mount
  useEffect(() => {
    async function loadDocument() {
      if (isAuthenticated && documentId) {
        try {
          console.log(`=== DEBUG: Attempting to fetch document with ID: ${documentId} ===`);
          
          // Debug user information
          console.log('Current user info:', {
            authenticated: isAuthenticated,
            userId: localStorage.getItem('firebase-user-id')
          });
          
          const doc = await fetchDocument(documentId);
          
          // Detailed document debugging
          if (doc) {
            console.log('=== Document data received ===', doc);
            console.log('=== Document data summary ===', {
              id: doc.id,
              fileName: doc.fileName || 'NO FILENAME',
              fileType: doc.fileType || 'NO FILETYPE',
              fileSize: doc.fileSize || 'NO FILESIZE',
              uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : 'NO DATE',
              originalFilePath: doc.originalFilePath || 'NO PATH',
              status: doc.status || 'NO STATUS'
            });
            
            // Check if file exists
            if (doc.originalFilePath) {
              console.log(`File path: ${doc.originalFilePath}`);
              console.log(`Checking if file exists: fetch from ${getDownloadUrl(doc.id, true)}`);
      } else {
              console.error('Document path is missing!');
      }
    } else {
            console.error('Document is null or undefined after fetch!');
          }
        } catch (err: any) {
          console.error("=== Error fetching document ===", err);
          console.error("Error details:", {
            message: err?.message,
            stack: err?.stack,
          });
          setFetchError(err?.message || "Failed to load document");
        }
      } else {
        console.warn('Cannot load document: User not authenticated or document ID missing', {
          isAuthenticated,
          documentId
        });
      }
    }
    
    loadDocument();
  }, [isAuthenticated, documentId, fetchDocument]);
  
  // Redirect to report page if document is already redacted
  useEffect(() => {
    if (currentDocument && currentDocument.status === 'redacted') {
      router.push(`/documents/${currentDocument.id}/report`);
    }
  }, [currentDocument, router]);

  // Filter templates when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTemplates(redactionTemplates);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = redactionTemplates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) || 
      template.description.toLowerCase().includes(lowercaseQuery) ||
      getRedactionTypes(template).some(type => type.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredTemplates(filtered);
  }, [searchQuery]);

  const handleStartRedaction = () => {
    // Open modal instead of changing the page layout
    setIsTemplateModalOpen(true);
    setSelectedTemplates([]);
    setSearchQuery("");
    setFilteredTemplates(redactionTemplates);
  };
  
  const handleTemplateSelected = (template: RedactionTemplate) => {
    // Toggle selection of a template
    setSelectedTemplates(prev => {
      const isAlreadySelected = prev.some(t => t.id === template.id);
      
      if (isAlreadySelected) {
        // Remove template if already selected
        return prev.filter(t => t.id !== template.id);
      } else {
        // Add template if not selected
        return [...prev, template];
      }
    });
  };
  
  const handleProceedWithTemplate = () => {
    if (selectedTemplates.length === 0) {
      toast({
        title: "No templates selected",
        description: "Please select at least one redaction template to proceed",
        variant: "destructive"
      });
      return;
    }
    
    // Close the modal and start the redaction process with the first selected template
    // For simplicity, we're using the first template as the primary one, but capturing all selections
    setIsTemplateModalOpen(false);
    setSelectedTemplate(selectedTemplates[0]);
    startRedactionProcess(selectedTemplates[0], selectedTemplates);
  };
  
  const startRedactionProcess = async (primaryTemplate: RedactionTemplate, allTemplates: RedactionTemplate[]) => {
    if (!currentDocument || !primaryTemplate) return;
    
    try {
      setIsProcessing(true);
      setRedactionProgress(0);
      
      // Simulate redaction process with more realistic progress updates
      const steps = 20; // Number of progress steps
      for (let i = 0; i <= steps; i++) {
        const progress = Math.floor((i / steps) * 100);
        setRedactionProgress(progress);
        
        // Use requestAnimationFrame to ensure UI updates
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 150); // Smaller timeout for smoother animation
          });
        });
      }
      
      // When complete, show the redaction form
      setIsProcessing(false);
      setIsRedacting(true);
      
    } catch (error) {
      console.error("Error during redaction process:", error);
      setIsProcessing(false);
      toast({
        title: "Redaction failed",
        description: "There was an error processing your document",
        variant: "destructive"
      });
    }
  };
  
  const handleCancelTemplateSelection = () => {
    setIsTemplateModalOpen(false);
    setSelectedTemplates([]);
    setSearchQuery("");
  };
  
  const handleRedactionComplete = async (redactedFile: File, summary: string) => {
    if (!currentDocument) return;
    
    try {
      setIsProcessing(true);
      setRedactionProgress(0);
      
      // Improved progress visualization
      const totalSteps = 10;
      for (let i = 0; i <= totalSteps; i++) {
        const progress = Math.floor((i / totalSteps) * 100);
        setRedactionProgress(progress);
        
        // Use requestAnimationFrame for smoother UI updates
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 100);
          });
        });
      }
      
      // Actually save the redacted document
      await saveRedactedDocument(currentDocument.id, redactedFile, summary);
      
      // Navigate to report page
      router.push(`/documents/${currentDocument.id}/report`);
    } catch (error) {
      console.error("Error saving redacted document:", error);
      setIsProcessing(false);
      toast({
        title: "Save failed",
        description: "Failed to save the redacted document",
        variant: "destructive"
      });
    }
  };

  const handleViewOriginal = async () => {
    try {
      // Get authentication token
      const { token } = await getAuthTokenAndHeaders();
      console.log("Attempting to view document with ID:", documentId);
      
      // Create a form to post to the API endpoint
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/api/documents/${documentId}/download-original`;
      form.target = '_blank'; // Open in a new tab
      
      // Add token field
      const tokenField = document.createElement('input');
      tokenField.type = 'hidden';
      tokenField.name = 'token';
      tokenField.value = token;
      form.appendChild(tokenField);
      
      // In development mode, also send the user ID as a fallback
      if (process.env.NODE_ENV === 'development') {
        const userId = localStorage.getItem('firebase-user-id');
        if (userId) {
          const userIdField = document.createElement('input');
          userIdField.type = 'hidden';
          userIdField.name = 'user_id';
          userIdField.value = userId;
          form.appendChild(userIdField);
          console.log("Adding user_id to form for development mode:", userId);
        }
      }
      
      // Add to document, submit, and remove
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
    } catch (error) {
      console.error("Error viewing original document:", error);
        toast({
        title: "View failed",
        description: "Failed to view the original document. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Fix formatting for file size
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || isNaN(bytes)) return "Unknown size";
    
    if (bytes < 1024) return `${bytes} bytes`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Fix formatting for date
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp || isNaN(timestamp)) return "Unknown date";
    
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Helper to check if a template is selected
  const isTemplateSelected = (templateId: string) => {
    return selectedTemplates.some(template => template.id === templateId);
  };

  if (loading || !currentDocument) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || fetchError) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
            <h2 className="text-red-800 dark:text-red-200 font-medium">Error</h2>
            <p className="text-red-700 dark:text-red-300">{error || fetchError}</p>
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-800 rounded text-sm">
              <p className="font-mono">Document ID: {documentId}</p>
              <p>This error might occur if the document doesn't exist or if you don't have permission to access it.</p>
            </div>
            <button
              onClick={() => router.push('/documents')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go back to documents
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentDocument.fileName}
            </h1>      
          </div>

          <div className="mt-4 md:mt-0 flex space-x-3">
                <button
              onClick={() => router.push('/documents')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
              Back to Documents
                </button>
            
            {currentDocument.status === 'pending' && !isRedacting && !isSelectingTemplate && (
              <button
                onClick={handleStartRedaction}
                className="px-4 py-2 bg-chateau-green-600 text-white rounded-lg hover:bg-chateau-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2"
              >
                Start Redaction
              </button>
            )}
                    </div>
                  </div>

        {/* Template Selection Modal */}
        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-chateau-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Select Redaction Templates
              </DialogTitle>
              <DialogDescription>
                Choose one or more templates to determine what types of information will be redacted.
              </DialogDescription>
            </DialogHeader>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-chateau-green-500 focus:border-chateau-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setSearchQuery("")}
                >
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Templates List */}
            <div className="max-h-80 overflow-y-auto grid gap-4 pb-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  No templates match your search. Try a different term.
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelected(template)}
                    className={`flex items-start p-4 rounded-lg border transition-all hover:shadow-md text-left
                      ${isTemplateSelected(template.id)
                        ? 'border-chateau-green-500 bg-chateau-green-50 dark:bg-chateau-green-900/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-chateau-green-300 dark:hover:border-chateau-green-700'
                      }`}
                  >
                    <div className={`rounded-full p-2 mr-3 
                      ${isTemplateSelected(template.id)
                        ? 'bg-chateau-green-100 text-chateau-green-700 dark:bg-chateau-green-800 dark:text-chateau-green-200' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isTemplateSelected(template.id) ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getRedactionTypes(template).slice(0, 3).map((type, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {type}
                          </span>
                        ))}
                        {getRedactionTypes(template).length > 3 && (
                          <span className="text-xs inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            +{getRedactionTypes(template).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <DialogFooter className="sm:justify-end space-x-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={handleCancelTemplateSelection}
              >
                Cancel
              </button>
              
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium text-white 
                  ${selectedTemplates.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-chateau-green-600 hover:bg-chateau-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2'
                  }`}
                onClick={handleProceedWithTemplate}
                disabled={selectedTemplates.length === 0}
              >
                Proceed with {selectedTemplates.length > 0 ? selectedTemplates.length : ''} Template{selectedTemplates.length !== 1 ? 's' : ''}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-2">Processing Document</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {redactionProgress < 100 
                  ? `Please wait while we process your document (${redactionProgress}%)...` 
                  : "Finalizing redaction..."}
              </p>
              
              <div className="space-y-3">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chateau-green-600 rounded-full transition-all duration-200 ease-in-out"
                    style={{ width: `${redactionProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
                
        {isRedacting ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-chateau-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Redaction Process
            </h2>
            
            {selectedTemplates.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Templates:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplates.map(template => (
                    <div key={template.id} className="p-3 bg-chateau-green-50 dark:bg-chateau-green-900/20 rounded-md border border-chateau-green-200 dark:border-chateau-green-800">
                      <h3 className="text-sm font-medium text-chateau-green-800 dark:text-chateau-green-200 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {template.name}
                      </h3>
                      <p className="text-xs text-chateau-green-700 dark:text-chateau-green-300 mt-1">
                        Will redact: {getRedactionTypes(template).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
                
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload the redacted version of this document and provide a summary of what was redacted.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Redacted File
              </label>
              <input
                type="file"
                onChange={(e) => e.target.files && setRedactedFile(e.target.files[0])}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-chateau-green-500 focus:border-chateau-green-500 sm:text-sm"
              />
                  </div>
                  
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Redaction Summary
              </label>
              <textarea
                rows={6}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe what was redacted from the document..."
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-chateau-green-500 focus:border-chateau-green-500 sm:text-sm"
              />
                  </div>
                  
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsRedacting(false);
                  setSelectedTemplates([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              
              <button
                onClick={() => redactedFile && summary && handleRedactionComplete(redactedFile, summary)}
                disabled={!redactedFile || !summary}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  !redactedFile || !summary
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-chateau-green-600 hover:bg-chateau-green-700'
                }`}
              >
                Complete Redaction
              </button>
                    </div>
                </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Document Preview - 2/3 width on desktop */}
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-chateau-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Document Preview
              </h2>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-700 min-h-[400px] flex items-center justify-center">
                {isRedacting ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative h-32 w-32 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preparing Document</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Setting up the redaction process...
                    </p>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  
                    {currentDocument.originalFilePath ? (
                  <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {currentDocument.fileName || "Document"}
                        </h3>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                          {currentDocument.fileStatus === 'missing' ? (
                            <span className="inline-flex items-center text-amber-600 dark:text-amber-400">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              The file exists in the database but could not be found on disk.
                            </span>
                          ) : currentDocument.fileStatus === 'error' ? (
                            <span className="inline-flex items-center text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4 mr-1" />
                              There was an error accessing this document's file.
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-chateau-green-600 dark:text-chateau-green-400">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Your document has been uploaded and is ready for redaction.
                            </span>
                          )}
                        </p>
                        
                        <div className="flex justify-center space-x-4">
                          {currentDocument.fileStatus !== 'missing' && currentDocument.fileStatus !== 'error' && (
                            <>
                              <button 
                                onClick={handleStartRedaction}
                                className="px-5 py-2.5 bg-chateau-green-600 text-white rounded-lg hover:bg-chateau-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 flex items-center"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Start Redaction
                              </button>
                              
                              <button 
                                onClick={handleViewOriginal}
                                className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Original
                              </button>
                            </>
                          )}
                          
                          {(currentDocument.fileStatus === 'missing' || currentDocument.fileStatus === 'error') && (
                            <button
                              onClick={() => router.push('/documents')}
                              className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Back to Documents
                            </button>
                          )}
                          
                          {process.env.NODE_ENV === 'development' && currentDocument.fileStatus === 'missing' && (
                            <button 
                              onClick={() => window.location.reload()}
                              className="px-5 py-2.5 bg-chateau-green-600 text-white rounded-lg hover:bg-chateau-green-700 flex items-center"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Try to Repair File (Dev)
                            </button>
                          )}
                        </div>
                    </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">File Not Found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                          There might be an issue with this document. The original file could not be located.
                        </p>
                        <button
                          onClick={() => router.push('/documents')}
                          className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center mx-auto"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Documents
                        </button>
                    </div>
                  )}
              </div>
                )}
          </div>
                </div>
                
            {/* Document Information - 1/3 width on desktop */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-chateau-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Document Information
              </h2>
              
              <dl className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {currentDocument.fileName || "Unnamed document"}
                  </dd>
                    </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {currentDocument.fileType || "Unknown type"}
                  </dd>
                  </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {formatFileSize(currentDocument.fileSize)}
                  </dd>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Uploaded At</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {formatDate(currentDocument.uploadedAt)}
                  </dd>
                    </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentDocument.status === 'redacted'
                          ? 'bg-chateau-green-100 text-chateau-green-800 dark:bg-chateau-green-900 dark:text-chateau-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {currentDocument.status === 'redacted' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Redacted
                      </>
                    ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending Redaction
                        </>
                      )}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
            </div>
          )}
      </div>
    </MainLayout>
  );
} 