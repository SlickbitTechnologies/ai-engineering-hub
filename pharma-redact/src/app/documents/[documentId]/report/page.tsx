"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Document } from "@/store/slices/documentsSlice";
import { RedactionEntity } from "@/types/redaction";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getDownloadUrl, downloadDocument, getAuthTokenAndHeaders } from "@/utils/fileServices";
import { PDFProcessor } from "@/utils/pdf-processor";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { EyeIcon } from "lucide-react";

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

// Dummy data for redacted content items
const dummyRedactedItems = [
  { id: "1", text: "Robert Johnson", category: "Personal", reason: "Patient name", confidence: 99, page: 1, paragraph: 2 },
  { id: "2", text: "HealthPlus Insurance", category: "Financial", reason: "Insurance provider", confidence: 95, page: 1, paragraph: 3 },
  { id: "3", text: "05/12/1975", category: "Personal", reason: "Date of birth", confidence: 98, page: 1, paragraph: 2 },
  { id: "4", text: "123 Main Street", category: "Personal", reason: "Home address", confidence: 97, page: 1, paragraph: 3 },
  { id: "5", text: "Cityville, State 12345", category: "Personal", reason: "Home address", confidence: 96, page: 1, paragraph: 3 },
  { id: "6", text: "(555) 123-4567", category: "Personal", reason: "Phone number", confidence: 99, page: 1, paragraph: 3 },
  { id: "7", text: "robert.j@example.com", category: "Personal", reason: "Email address", confidence: 98, page: 1, paragraph: 3 },
  { id: "8", text: "Dr. Jane Smith", category: "Personal", reason: "Doctor name", confidence: 97, page: 1, paragraph: 1 },
  { id: "9", text: "John Doe", category: "Personal", reason: "Staff name", confidence: 95, page: 1, paragraph: 1 },
  { id: "10", text: "987-65-4321", category: "Personal", reason: "Patient ID", confidence: 99, page: 1, paragraph: 1 },
  { id: "11", text: "$1,245.00", category: "Financial", reason: "Payment amount", confidence: 98, page: 2, paragraph: 1 },
  { id: "12", text: "Policy #H-54321", category: "Financial", reason: "Insurance policy", confidence: 97, page: 2, paragraph: 1 },
];

export default function DocumentReportPage() {
  const router = useRouter();
  const { documentId } = useParams() as { documentId: string };
  const { isAuthenticated } = useAuth();
  const { currentDocument, loading, error, fetchDocument } = useDocuments();
  const { toast } = useToast();

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

  // Redirect to document page if it's not redacted yet
  useEffect(() => {
    if (currentDocument && currentDocument.status !== 'redacted') {
      router.push(`/documents/${currentDocument.id}`);
    }
  }, [currentDocument, router]);
  
  // Get document and redaction data from Redux store
  const document = useSelector((state: RootState) => 
    state.documents.documents.find(doc => doc.id === documentId)
  );
  
  const redactionReport = useSelector((state: RootState) => 
    state.redaction.reports[documentId]
  );
  
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [redactedPdfUrl, setRedactedPdfUrl] = useState<string | null>(null);
  const [originalPdfError, setOriginalPdfError] = useState<string | null>(null);
  const [redactedPdfError, setRedactedPdfError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [redactedItems, setRedactedItems] = useState(dummyRedactedItems);
  const [categoryCounts, setCategoryCounts] = useState({
    Personal: 9,
    Financial: 3,
    Medical: 0,
    Legal: 0
  });
  
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const originalPdfRef = useRef<HTMLIFrameElement>(null);
  const redactedPdfRef = useRef<HTMLIFrameElement>(null);

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
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        
        return { url: null, error: errorMessage };
      }
      
      // Get the document as a blob
      const blob = await response.blob();
      
      // Create a blob URL for the document
      const url = URL.createObjectURL(blob);
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

  // Calculate category counts from redacted items (in a real app, this would come from redactionReport)
  useEffect(() => {
    if (redactedItems.length > 0) {
      const counts = redactedItems.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      
      setCategoryCounts({
        Personal: counts.Personal || 0,
        Financial: counts.Financial || 0,
        Medical: counts.Medical || 0,
        Legal: counts.Legal || 0
      });
    }
  }, [redactedItems]);

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
          <div className="lg:col-span-5 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Original Document</h2>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col overflow-hidden min-h-[600px]">
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
                <iframe
                  ref={originalPdfRef}
                  src={originalPdfUrl}
                  className="w-full h-full"
                  title="Original Document"
                />
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
          <div className="lg:col-span-5 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Redacted Document</h2>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col overflow-hidden min-h-[600px]">
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
                <iframe
                  ref={redactedPdfRef}
                  src={redactedPdfUrl}
                  className="w-full h-full"
                  title="Redacted Document"
                />
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
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
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
            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 min-h-[500px] max-h-[600px]">
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