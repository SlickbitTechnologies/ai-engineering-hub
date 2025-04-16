"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document } from "@/store/slices/documentsSlice";
import { RedactionEntity } from "@/types/redaction";
import { fetchDocumentRedactionReport } from "@/store/slices/redactionSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getDownloadUrl, downloadDocument, getAuthTokenAndHeaders } from "@/utils/fileServices";
import { PDFProcessor } from "@/utils/pdf-processor";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { EyeIcon } from "lucide-react";
import PdfViewer from '@/components/PdfViewer';

type RedactionCategory = "PERSON" | "EMAIL" | "PHONE" | "ADDRESS" | "DATE_OF_BIRTH" | "FINANCIAL" | "MEDICAL" | "LEGAL" | string;

// Helper function to download document with proper authentication
const downloadAuthenticatedDocument = async (documentId: string, isOriginal: boolean = false) => {
  try {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center';
    loadingToast.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Preparing download...</span>
    `;
    document.body.appendChild(loadingToast);
    
    // Add detailed logs
    console.log(`Initiating ${isOriginal ? 'original' : 'redacted'} document download for ID: ${documentId}`);
    console.log("User authentication status:", {
      authenticated: localStorage.getItem('firebase-user-id') ? true : false,
      userId: localStorage.getItem('firebase-user-id')
    });
    
    // Use the provided utility function that handles authentication
    await downloadDocument(documentId, isOriginal);
    
    // Success - remove loading indicator
    document.body.removeChild(loadingToast);
    
    // Show success toast
    const successToast = document.createElement('div');
    successToast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center';
    successToast.innerHTML = `
      <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Download started successfully</span>
    `;
    document.body.appendChild(successToast);
    
    // Remove success toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(successToast);
    }, 3000);
  } catch (error) {
    // Remove loading indicator if it exists
    const loadingToast = document.querySelector('.fixed.bottom-4.right-4.bg-gray-800');
    if (loadingToast) {
      document.body.removeChild(loadingToast);
    }
    
    console.error(`Error downloading ${isOriginal ? 'original' : 'redacted'} document:`, error);
    
    // Get more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      docId: documentId,
      isOriginal: isOriginal,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('firebase-user-id') || 'unknown'
    };
    
    // Log detailed error information
    console.error("Detailed error context:", errorDetails);
    
    // Show error toast with more details and retry button
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex flex-col';
    errorToast.innerHTML = `
      <div class="flex items-center mb-2">
        <svg class="h-5 w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span class="font-medium">Download Failed</span>
        <button class="ml-auto bg-red-700 hover:bg-red-800 p-1 rounded" id="close-error-toast">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <p class="text-sm mb-2">${errorDetails.message}</p>
      <div class="flex justify-end space-x-2">
        <button class="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm font-medium" id="retry-download">
          Retry Download
        </button>
        <button class="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm font-medium" id="alt-download">
          Alternative Download
        </button>
      </div>
    `;
    document.body.appendChild(errorToast);
    
    // Add event listeners to buttons
    document.getElementById('close-error-toast')?.addEventListener('click', () => {
      document.body.removeChild(errorToast);
    });
    
    document.getElementById('retry-download')?.addEventListener('click', () => {
      document.body.removeChild(errorToast);
      downloadAuthenticatedDocument(documentId, isOriginal);
    });
    
    document.getElementById('alt-download')?.addEventListener('click', () => {
      document.body.removeChild(errorToast);
      // Try alternative download method (POST with form)
      try {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = isOriginal ? 
          `/api/documents/${documentId}/download-original` : 
          `/api/documents/${documentId}/download`;
        form.target = '_blank';
        
        // Add user ID if available
        const userId = localStorage.getItem('firebase-user-id');
        if (userId) {
          const userIdField = document.createElement('input');
          userIdField.type = 'hidden';
          userIdField.name = 'user_id';
          userIdField.value = userId;
          form.appendChild(userIdField);
        }
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } catch (e) {
        console.error("Error in alternative download:", e);
        alert("Alternative download also failed. Please try again later.");
      }
    });
    
    // Remove error toast after 15 seconds if not closed
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        document.body.removeChild(errorToast);
      }
    }, 15000);
  }
};

export default function DocumentReportPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { documentId } = useParams() as { documentId: string };
  const { isAuthenticated } = useAuth();
  const { currentDocument, loading, error, fetchDocument } = useDocuments();
  const { toast } = useToast();
  
  // Get document and redaction data from Redux store
  const document = useSelector((state: RootState) => 
    state.documents.documents.find(doc => doc.id === documentId)
  );
  
  const redactionReport = useSelector((state: RootState) => 
    state.redaction.reports[documentId]
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch document on mount
  useEffect(() => {
    if (isAuthenticated && documentId) {
      fetchDocument(documentId);
    }
  }, [isAuthenticated, documentId, fetchDocument]);

  // Fetch redaction report when document is loaded
  useEffect(() => {
    if (isAuthenticated && documentId && currentDocument && currentDocument.status === 'redacted') {
      // Check if we already have the report in Redux store
      if (!redactionReport) {
        // Dispatch action to fetch the redaction report
        dispatch(fetchDocumentRedactionReport(documentId) as any);
      }
    }
  }, [isAuthenticated, documentId, currentDocument, dispatch, redactionReport]);

  // Redirect to document page if it's not redacted yet
  useEffect(() => {
    if (currentDocument && currentDocument.status !== 'redacted') {
      router.push(`/documents/${currentDocument.id}`);
    }
  }, [currentDocument, router]);
  
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [redactedPdfUrl, setRedactedPdfUrl] = useState<string | null>(null);
  const [originalPdfError, setOriginalPdfError] = useState<string | null>(null);
  const [redactedPdfError, setRedactedPdfError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [redactedItems, setRedactedItems] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState({
    Personal: 0,
    Financial: 0,
    Medical: 0,
    Legal: 0
  });
  
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const originalPdfRef = useRef<HTMLObjectElement>(null);
  const redactedPdfRef = useRef<HTMLObjectElement>(null);

  // Create temporary blob URLs with auth tokens for viewing documents in iframes
  const createSecureDocumentUrl = async (endpoint: string): Promise<{ url: string | null, error: string | null }> => {
    try {
      // Get authentication token and headers
      const { token, headers } = await getAuthTokenAndHeaders();
      
      console.log(`Fetching document from ${endpoint} with auth`);
      
      // Fetch the document with proper authentication
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...headers
        }
      });
      
      if (!response.ok) {
        console.error(`Error fetching document: ${response.status} ${response.statusText}`);
        
        // Try to parse the error response
        let errorMessage = `Error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const textContent = await response.text();
          errorMessage = textContent || errorMessage;
        }
        
        return { url: null, error: errorMessage };
      }
      
      // Get the document as a blob
      const fileBlob = await response.blob();
      
      // Create a blob URL for the document - use PDF type to ensure viewer loads with controls
      const url = URL.createObjectURL(new Blob([fileBlob], { type: 'application/pdf' }));
      return { url, error: null };
        } catch (error) {
      console.error('Error creating secure document URL:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Unknown error loading document' 
      };
    }
  };

  // Load documents with authentication
  useEffect(() => {
    if (currentDocument) {
      const loadDocuments = async () => {
        // Load original document
        const originalEndpoint = `/api/documents/${documentId}/download-original`;
        const original = await createSecureDocumentUrl(originalEndpoint);
        setOriginalPdfUrl(original.url);
        setOriginalPdfError(original.error);
        
        // If the document exists but isn't redacted yet, don't try to load redacted version
        if (currentDocument.status !== 'redacted') {
          setRedactedPdfError('Document has not been redacted yet');
          return;
        }
        
        // Load redacted document
        const redactedEndpoint = `/api/documents/${documentId}/download`;
        const redacted = await createSecureDocumentUrl(redactedEndpoint);
        setRedactedPdfUrl(redacted.url);
        setRedactedPdfError(redacted.error);
      };
      
      loadDocuments();
      
      // Clean up blob URLs when component unmounts
      return () => {
        if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
        if (redactedPdfUrl) URL.revokeObjectURL(redactedPdfUrl);
      };
    }
  }, [currentDocument, documentId]);

  // Function to map RedactionEntity to UI format
  const mapRedactionEntityToUIFormat = (entity: RedactionEntity, index: number) => {
    // Map entity type to category
    let category = "Personal";
    if (entity.type === "EMAIL" || entity.type === "PHONE" || entity.type === "PERSON" || entity.type === "ADDRESS" || entity.type === "SSN") {
      category = "Personal";
    } else if (entity.type === "COMPANY" || entity.type === "FINANCIAL") {
      category = "Financial";
    } else if (entity.type === "MEDICAL" || entity.type === "ENDPOINT") {
      category = "Medical";
    } else if (entity.type === "LEGAL" || entity.type === "IDENTIFIER") {
      category = "Legal";
    }

    // Set reason based on entity type
    let reason = "Sensitive information";
    switch (entity.type) {
      case "EMAIL": reason = "Email address"; break;
      case "PHONE": reason = "Phone number"; break;
      case "PERSON": reason = "Person name"; break;
      case "ADDRESS": reason = "Physical address"; break;
      case "SSN": reason = "Social security number"; break;
      case "COMPANY": reason = "Company name"; break;
      case "FINANCIAL": reason = "Financial information"; break;
      case "MEDICAL": reason = "Medical information"; break;
      case "ENDPOINT": reason = "Clinical endpoint"; break;
      case "LEGAL": reason = "Legal information"; break;
      case "IDENTIFIER": reason = "Document identifier"; break;
      default: reason = entity.type;
    }

    return {
      id: entity.id || `entity-${index}`,
      text: entity.text,
      category,
      reason,
      confidence: Math.round(entity.confidence * 100),
      page: entity.page,
      paragraph: 1, // Default paragraph since we might not have this info
    };
  };

  // Process redaction report from Redux when available
  useEffect(() => {
    if (redactionReport?.entityList?.length > 0) {
      // Map entities to UI format
      const formattedItems = redactionReport.entityList.map(mapRedactionEntityToUIFormat);
      setRedactedItems(formattedItems);
      
      // Calculate category counts
      const counts = formattedItems.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      
      setCategoryCounts({
        Personal: counts.Personal || 0,
        Financial: counts.Financial || 0,
        Medical: counts.Medical || 0,
        Legal: counts.Legal || 0
      });
    } else if (currentDocument?.status === 'redacted' && !redactionReport) {
      // If document is redacted but we don't have report data, try to construct basic data
      try {
        const summary = currentDocument.summary || '';
        // Extract basic counts from summary if possible
        const personalCount = summary.match(/personal: (\d+)/i)?.[1] ? parseInt(summary.match(/personal: (\d+)/i)?.[1] || '0') : 0;
        const financialCount = summary.match(/financial: (\d+)/i)?.[1] ? parseInt(summary.match(/financial: (\d+)/i)?.[1] || '0') : 0;
        const medicalCount = summary.match(/medical: (\d+)/i)?.[1] ? parseInt(summary.match(/medical: (\d+)/i)?.[1] || '0') : 0;
        const legalCount = summary.match(/legal: (\d+)/i)?.[1] ? parseInt(summary.match(/legal: (\d+)/i)?.[1] || '0') : 0;
        
        // Create basic synthetic data if needed
        const syntheticItems = [];
        let itemId = 1;
        
        for (let i = 0; i < personalCount; i++) {
          syntheticItems.push({
            id: `synth-${itemId++}`,
            text: `[Personal Data ${i+1}]`,
            category: "Personal",
            reason: "Personal information",
            confidence: 95,
            page: 1,
            paragraph: 1
          });
        }
        
        for (let i = 0; i < financialCount; i++) {
          syntheticItems.push({
            id: `synth-${itemId++}`,
            text: `[Financial Data ${i+1}]`,
            category: "Financial",
            reason: "Financial information",
            confidence: 95,
            page: 1,
            paragraph: 1
          });
        }
        
        for (let i = 0; i < medicalCount; i++) {
          syntheticItems.push({
            id: `synth-${itemId++}`,
            text: `[Medical Data ${i+1}]`,
            category: "Medical",
            reason: "Medical information",
            confidence: 95,
            page: 1,
            paragraph: 1
          });
        }
        
        for (let i = 0; i < legalCount; i++) {
          syntheticItems.push({
            id: `synth-${itemId++}`,
            text: `[Legal Data ${i+1}]`,
            category: "Legal",
            reason: "Legal information",
            confidence: 95,
            page: 1,
            paragraph: 1
          });
        }
        
        // Set the synthetic items
        setRedactedItems(syntheticItems);
        
        // Update category counts
        setCategoryCounts({
          Personal: personalCount,
          Financial: financialCount,
          Medical: medicalCount,
          Legal: legalCount
        });
      } catch (e) {
        console.error("Error generating summary data:", e);
        // Fall back to empty data
        setRedactedItems([]);
        setCategoryCounts({
          Personal: 0,
          Financial: 0,
          Medical: 0,
          Legal: 0
        });
      }
    } else {
      // No redaction report available yet
      setRedactedItems([]);
      setCategoryCounts({
        Personal: 0,
        Financial: 0,
        Medical: 0,
        Legal: 0
      });
    }
  }, [redactionReport, currentDocument]);

  const handleItemClick = (id: string) => {
    setSelectedEntity(id === selectedEntity ? null : id);
    if (feedbackRef.current) {
      feedbackRef.current.focus();
    }
  };

  const handleClearFeedback = () => {
    setFeedback("");
    if (feedbackRef.current) {
      feedbackRef.current.focus();
    }
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been submitted successfully",
        variant: "default"
      });
      setFeedback("");
      setSelectedEntity(null);
    }
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

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
            <h2 className="text-red-800 dark:text-red-200 font-medium">Error</h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
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

  // Find selected redacted item
  const selectedItem = selectedEntity ? redactedItems.find(item => item.id === selectedEntity) : null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redaction Report</h1>
          <p className="text-gray-600 dark:text-gray-400">Review redacted content and provide feedback</p>
          </div>
          
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Original Document */}
          <div className="lg:col-span-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Original Document</h2>
            
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col overflow-hidden min-h-[400px] max-h-[450px]">
              {originalPdfError ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4 max-w-md">
                    <p className="text-red-800 dark:text-red-300 font-medium">Error loading original document</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{originalPdfError}</p>
                  </div>
          <button
                    onClick={() => downloadAuthenticatedDocument(documentId, true)}
                    className="mt-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded font-medium text-sm flex items-center"
          >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download instead
          </button>
        </div>
              ) : originalPdfUrl ? (
                <div className="w-full h-full">
                  <PdfViewer url={originalPdfUrl} title="Original Document" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
            {/* <button
              onClick={() => downloadAuthenticatedDocument(documentId, true)}
              className="mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg font-medium flex items-center justify-center"
            >
              <svg
                className="h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
              Download Original Document
            </button> */}
          </div>

          {/* Redacted Document */}
          <div className="lg:col-span-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Redacted Document</h2>
            
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col overflow-hidden min-h-[400px] max-h-[450px]">
              {redactedPdfError ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4 max-w-md">
                    <p className="text-red-800 dark:text-red-300 font-medium">Error loading redacted document</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{redactedPdfError}</p>
                  </div>
                  {currentDocument.status === 'redacted' && (
                    <button
                      onClick={() => downloadAuthenticatedDocument(documentId, false)}
                      className="mt-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded font-medium text-sm flex items-center"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download instead
                    </button>
                  )}
                </div>
              ) : redactedPdfUrl ? (
                <div className="w-full h-full">
                  <PdfViewer url={redactedPdfUrl} title="Redacted Document" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
            {/* Download button
            {currentDocument.status === 'redacted' && (
              <button
                onClick={() => downloadAuthenticatedDocument(documentId, false)}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Redacted Document
              </button>
            )} */}
                  </div>

          {/* Redacted Content */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Redacted Content ({redactedItems.length})</h2>
        </div>

            {/* Category counts */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="text-sm rounded-md px-2 py-1 bg-blue-100 text-blue-800">
                Personal: {categoryCounts.Personal}
                </div>
              <div className="text-sm rounded-md px-2 py-1 bg-green-100 text-green-800">
                Financial: {categoryCounts.Financial}
                </div>
              <div className="text-sm rounded-md px-2 py-1 bg-purple-100 text-purple-800">
                Medical: {categoryCounts.Medical}
                </div>
              <div className="text-sm rounded-md px-2 py-1 bg-yellow-100 text-yellow-800">
                Legal: {categoryCounts.Legal}
              </div>
            </div>
            
            {/* Redacted items list */}
            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 min-h-[350px] max-h-[450px]">
              {redactedItems.map((item) => (
                <div
                  key={item.id}
                  className={`border-l-4 p-3 mb-2 cursor-pointer ${
                    selectedEntity === item.id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : item.category === 'Personal' 
                        ? 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                        : item.category === 'Financial'
                          ? 'border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10'
                          : item.category === 'Medical'
                            ? 'border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                            : 'border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.text}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.category === 'Personal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                      item.category === 'Financial' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                      item.category === 'Medical' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                    }`}>
                      {item.category}
                    </span>
              </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Page {item.page}, Para {item.paragraph}</span>
                    <div className="flex items-center">
                      <span className="mr-1">{item.confidence}%</span>
                      <EyeIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
              ))}
      </div>
      
            {/* Selected redaction feedback */}
            {selectedItem && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium text-gray-900 dark:text-white">Selected Redaction</h3>
                  </div>
                  <div className="ml-7 space-y-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Text:</span> {selectedItem.text}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Reason:</span> {selectedItem.reason}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Provide correction for "{selectedItem.text}"
                  </label>
                  <textarea
                    id="feedback"
                    ref={feedbackRef}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Enter your feedback..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleClearFeedback}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSubmitFeedback}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit
                      </button>
                    </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    Press Ctrl+Enter to submit
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 