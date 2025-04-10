"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document, updateDocumentStatus } from "@/store/slices/documentsSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { RedactionTemplate } from "@/store/slices/redactionSlice";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const documentId = params.documentId as string;
  
  // Get document from Redux store
  const { documents } = useSelector((state: RootState) => state.documents as {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
  });
  
  // Get templates from Redux store
  const { templates } = useSelector((state: RootState) => state.redaction as {
    templates: RedactionTemplate[];
  });
  
  // Find the document with matching ID
  const documentFromStore = documents.find(doc => doc.id === documentId);
  
  // Use document from store or redirect if not found
  useEffect(() => {
    if (!documentFromStore && !isLoading && documents.length > 0) {
      router.push('/documents');
    }
  }, [documentFromStore, documents, router]);
  
  const [document, setDocument] = useState<Document | undefined>(documentFromStore);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Template selection state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Update local state when Redux store changes
  useEffect(() => {
    if (documentFromStore) {
      setDocument(documentFromStore);
    }
  }, [documentFromStore]);
  
  // Initialize with default template
  useEffect(() => {
    if (templates.length > 0) {
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else {
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [templates]);

  const handleProcessClick = () => {
    setIsTemplateModalOpen(true);
  };
  
  const handleProcessDocument = () => {
    if (!document) return;
    
    setIsTemplateModalOpen(false);
    setIsProcessing(true);
    dispatch(updateDocumentStatus({ id: documentId, status: 'processing' }));
    
    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          dispatch(updateDocumentStatus({ id: documentId, status: 'redacted' }));
          return 100;
        }
        return prev + 10;
      });
    }, 500);
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
                className="animate-spin h-12 w-12 text-chateau-green-600 mx-auto mb-4" 
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
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500"
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
            <div className="flex flex-col sm:flex-row gap-3">
              {document.status === 'redacted' ? (
                <>
                  <Link
                    href={`/documents/${documentId}/report`}
                    className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                  >
                    View Redaction Report
                  </Link>
                  <button
                    className="px-4 py-2 rounded-lg border border-chateau-green-600 text-chateau-green-600 font-medium hover:bg-chateau-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                  >
                    Download Redacted Document
                  </button>
                </>
              ) : (
                <button
                  onClick={handleProcessClick}
                  disabled={isProcessing || document.status === 'processing'}
                  className={`px-4 py-2 rounded-lg shadow-sm ${
                    isProcessing || document.status === 'processing'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-chateau-green-600 text-white hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5'
                  } font-medium transition-all`}
                >
                  {isProcessing || document.status === 'processing' ? 'Processing...' : 'Process Document'}
                </button>
              )}
            </div>
          </div>

          {/* Document Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h2>
                
                {isProcessing || document.status === 'processing' ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                      <div 
                        className="bg-chateau-green-600 h-4 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                    <p className="text-gray-600">Processing document... {progress}%</p>
                  </div>
                ) : document.status === 'redacted' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                    <div className="w-24 h-24 bg-chateau-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-chateau-green-600">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Document Successfully Redacted</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                      This document has been processed and redacted. You can now view the redaction report or download the redacted document.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link
                        href={`/documents/${documentId}/report`}
                        className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                      >
                        View Redaction Report
                      </Link>
                      <button
                        className="px-4 py-2 rounded-lg border border-chateau-green-600 text-chateau-green-600 font-medium hover:bg-chateau-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                      >
                        Download Redacted Document
                      </button>
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
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                      This document is ready to be processed. Click the "Process Document" button to start redacting sensitive information.
                    </p>
                    <button
                      onClick={handleProcessClick}
                      className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                    >
                      Process Document
                    </button>
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
                        document.status === 'redacted' ? 'bg-chateau-green-500' :
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
                </div>

                {document.status === 'redacted' && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Redaction Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Personal Information</p>
                        <p className="text-sm font-medium text-gray-900">9 items</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Financial Details</p>
                        <p className="text-sm font-medium text-gray-900">2 items</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Medical Records</p>
                        <p className="text-sm font-medium text-gray-900">0 items</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Legal Information</p>
                        <p className="text-sm font-medium text-gray-900">0 items</p>
                      </div>
                      
                      <div className="flex justify-between items-center font-medium pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-900">Total Redactions</p>
                        <p className="text-sm text-chateau-green-600">11 items</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Template Selection Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Redaction Template</h2>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Choose a redaction template to apply to your document. Each template contains a set of redaction rules that will be used to identify sensitive information.
            </p>
            
            <div className="space-y-4 max-h-60 overflow-y-auto mb-6">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <div 
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplateId === template.id 
                        ? 'border-chateau-green-500 bg-chateau-green-50 dark:bg-chateau-green-900/20' 
                        : 'border-gray-200 hover:border-chateau-green-300 hover:bg-chateau-green-50/50 dark:border-gray-700 dark:hover:border-chateau-green-700'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                          {template.name}
                          {template.isDefault && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-chateau-green-100 text-chateau-green-800 dark:bg-chateau-green-900/30 dark:text-chateau-green-300">
                              Default
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedTemplateId === template.id 
                            ? 'border-chateau-green-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedTemplateId === template.id && (
                            <div className="w-3 h-3 rounded-full bg-chateau-green-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {template.ruleIds.length} {template.ruleIds.length === 1 ? 'rule' : 'rules'} included
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No templates available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Please create a template in the Redaction Rules section first.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessDocument}
                disabled={!selectedTemplateId || templates.length === 0}
                className={`px-4 py-2 rounded-md text-white ${
                  !selectedTemplateId || templates.length === 0
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-chateau-green-600 hover:bg-chateau-green-700'
                }`}
              >
                Process Document
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 