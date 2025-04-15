"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Document } from "@/store/slices/documentsSlice";
import { RedactionEntity } from "@/types/redaction";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getDownloadUrl } from "@/utils/fileServices";
import { PDFProcessor } from "@/utils/pdf-processor";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/context/AuthContext";

type RedactionCategory = "PERSON" | "EMAIL" | "PHONE" | "ADDRESS" | "DATE_OF_BIRTH" | "FINANCIAL" | "MEDICAL" | "LEGAL" | string;

export default function DocumentReportPage({ params }: { params: { documentId: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { currentDocument, loading, error, fetchDocument } = useDocuments();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch document on mount
  useEffect(() => {
    if (isAuthenticated && params.documentId) {
      fetchDocument(params.documentId);
    }
  }, [isAuthenticated, params.documentId, fetchDocument]);

  // Redirect to document page if it's not redacted yet
  useEffect(() => {
    if (currentDocument && currentDocument.status !== 'redacted') {
      router.push(`/documents/${currentDocument.id}`);
    }
  }, [currentDocument, router]);
  
  // Get document and redaction data from Redux store
  const document = useSelector((state: RootState) => 
    state.documents.documents.find(doc => doc.id === params.documentId)
  );
  
  const redactionReport = useSelector((state: RootState) => 
    state.redaction.reports[params.documentId]
  );
  
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const pdfObjectRef = useRef<HTMLObjectElement>(null);

  // Get the document URL for viewing
  useEffect(() => {
    if (document?.redactedUrl) {
      const loadUrl = async () => {
        try {
          const url = await getDownloadUrl(document.redactedUrl as string);
          setPdfUrl(url);
        } catch (error) {
          console.error('Error getting viewable URL:', error);
        }
      };
      
      loadUrl();
    }
  }, [document]);

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
      // In a real implementation, we would submit the feedback
      alert("Feedback submitted successfully!");
      setFeedback("");
      setSelectedEntity(null);
    }
  };
  
  const handleViewRedactedPdf = () => {
    setShowPdfModal(true);
  };
  
  const handleDownloadRedactedPdf = async () => {
    if (!document?.redactedUrl) return;
    
    try {
      const url = await getDownloadUrl(document.redactedUrl);
      
      // Use the PDFProcessor's download method for better handling
      const response = await fetch(url);
      const pdfData = await response.arrayBuffer();
      
      PDFProcessor.downloadRedactedPDF(
        new Uint8Array(pdfData),
        `redacted-${document.name || 'document.pdf'}`
      );
    } catch (error) {
      console.error('Error downloading redacted PDF:', error);
    }
  };
  
  const handleClosePdfModal = () => {
    setShowPdfModal(false);
  };
  
  const reloadPdfViewer = () => {
    if (pdfViewerRef.current && pdfUrl) {
      pdfViewerRef.current.src = pdfUrl;
    }
    if (pdfObjectRef.current && pdfUrl) {
      pdfObjectRef.current.data = pdfUrl;
    }
  };

  // Calculate statistics from real data
  const getEntityCountByCategory = () => {
    if (!redactionReport) return {};
    
    return redactionReport.entitiesByType;
  };
  
  // Create the categories map for display
  const entityCountByCategory = getEntityCountByCategory();
  
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

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Redaction Report: {currentDocument.fileName}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Status: <span className="font-medium text-green-600 dark:text-green-400">Redacted</span>
            </p>
          </div>
          
          <button
            onClick={() => router.push('/documents')}
            className="mt-4 md:mt-0 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Back to Documents
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Redaction Summary</h2>
              
              <div className="prose dark:prose-invert max-w-none">
                {currentDocument.summary ? (
                  <div dangerouslySetInnerHTML={{ __html: currentDocument.summary }} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No summary available.</p>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Preview</h2>
              
              {/* This would typically be a PDF preview component */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-16 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Document preview would be shown here.
                  </p>
                  
                  <div className="mt-4">
                    <a
                      href={`/api/documents/${currentDocument.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
                    </a>
                  </div>
                </div>
              </div>
            </div>
        </div>

          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Name</p>
                  <p className="text-gray-900 dark:text-white">{currentDocument.fileName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Type</p>
                  <p className="text-gray-900 dark:text-white">{currentDocument.fileType}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
                  <p className="text-gray-900 dark:text-white">
                    {(currentDocument.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded At</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(currentDocument.uploadedAt).toLocaleString()}
                  </p>
                      </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(currentDocument.updatedAt).toLocaleString()}
                  </p>
                  </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-gray-900 dark:text-white">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Redacted
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
              
              <div className="space-y-3">
                <a
                  href={`/api/documents/${currentDocument.id}/download-original`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-center transition-colors"
                >
                  Download Original
                </a>
                
                <a
                  href={`/api/documents/${currentDocument.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-center transition-colors"
                >
                  Download Redacted
                </a>
                
                          <button 
                  onClick={() => window.print()}
                  className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-center transition-colors"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Viewer Modal with Animation */}
      <AnimatePresence>
        {showPdfModal && pdfUrl && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-5xl h-[calc(100vh-64px)] flex flex-col overflow-hidden"
            >
              {/* PDF Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Redacted Document: {document?.name || currentDocument.fileName}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={reloadPdfViewer}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Reload PDF"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={handleClosePdfModal}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close PDF viewer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* PDF Viewer Content */}
              <div className="flex-1 relative overflow-hidden">
                {/* Method 1: iframe */}
                <iframe
                  ref={pdfViewerRef}
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Redacted PDF Viewer"
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={() => console.log("PDF iframe loaded")}
                />
                
                {/* Method 2: object tag (fallback) */}
                <object
                  ref={pdfObjectRef}
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full absolute top-0 left-0 opacity-0"
                  aria-label="PDF Document"
                >
                  {/* Method 3: Fallback message with download button */}
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-center p-8">
                      <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">PDF Preview Unavailable</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md">Your browser doesn't support inline PDF preview. Please download the file to view it.</p>
                      <button
                        onClick={handleDownloadRedactedPdf}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </div>
                </object>
              </div>
              
              {/* PDF Modal Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {redactionReport.totalEntities} items redacted
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadRedactedPdf}
                    className="px-4 py-2 rounded-lg border border-primary-600 text-primary-600 font-medium hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={handleClosePdfModal}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
} 