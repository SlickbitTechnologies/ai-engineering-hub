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
import { getViewableUrl } from "@/utils/localStorage";
import { PDFProcessor } from "@/utils/pdf-processor";

type RedactionCategory = "PERSON" | "EMAIL" | "PHONE" | "ADDRESS" | "DATE_OF_BIRTH" | "FINANCIAL" | "MEDICAL" | "LEGAL" | string;

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;
  
  // Get document and redaction data from Redux store
  const document = useSelector((state: RootState) => 
    state.documents.documents.find(doc => doc.id === documentId)
  );
  
  const redactionReport = useSelector((state: RootState) => 
    state.redaction.reports[documentId]
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
          const url = await getViewableUrl(document.redactedUrl as string);
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
      const url = await getViewableUrl(document.redactedUrl);
      
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
  
  // If document or redaction data is not available, show loading
  if (!document || !redactionReport) {
    return (
      <MainLayout>
        <div className="flex flex-col gap-6 p-4">
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Redaction Report</h2>
              <p className="text-gray-600">Loading redaction details...</p>
            </div>
          </div>
          
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
              <h2 className="text-xl font-medium text-gray-700">Loading redaction report...</h2>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-4">
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Redaction Report</h2>
            <p className="text-gray-600">Review redacted content and provide feedback</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-2">
          {/* Buttons removed */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Redaction Summary Panel */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Redaction Summary</h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Document Name</p>
                  <p className="text-gray-900 font-medium">{document.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">File Type</p>
                  <p className="text-gray-900 font-medium">{document.type.toUpperCase()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Redactions</p>
                  <p className="text-gray-900 font-medium">{redactionReport.totalEntities}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Redactions by Type</p>
                  <div className="space-y-2">
                    {Object.entries(entityCountByCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            category === 'PERSON' ? 'bg-blue-500' :
                            category === 'EMAIL' ? 'bg-green-500' :
                            category === 'PHONE' ? 'bg-yellow-500' :
                            category === 'ADDRESS' ? 'bg-purple-500' :
                            category === 'DATE_OF_BIRTH' ? 'bg-pink-500' :
                            category === 'FINANCIAL' ? 'bg-emerald-500' :
                            category === 'MEDICAL' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></span>
                          <span className="text-sm font-medium text-gray-700">{category}</span>
                        </span>
                        <span className="text-sm text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                {/* Buttons removed */}
                
                <Link
                  href={`/documents/${documentId}`}
                  className="w-full block text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:translate-y-0.5"
                >
                  Back to Document
                </Link>
              </div>
            </div>
          </div>

          {/* Redacted Content Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Redacted Content</h3>
              
              {redactionReport.totalEntities === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No Redactions Needed</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    No sensitive information was found in this document. The document has been marked as analyzed but no content was redacted.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {redactionReport.entityList.map((entity) => (
                    <div 
                      key={entity.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedEntity === entity.id ? 'bg-gray-50 border-l-4 border-primary-500 pl-3' : ''}`}
                      onClick={() => handleItemClick(entity.id)}
                      role="button"
                      tabIndex={0}
                      aria-selected={selectedEntity === entity.id}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleItemClick(entity.id);
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 pr-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{entity.text}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              entity.type === 'PERSON' ? 'bg-blue-100 text-blue-800' :
                              entity.type === 'EMAIL' ? 'bg-green-100 text-green-800' :
                              entity.type === 'PHONE' ? 'bg-yellow-100 text-yellow-800' :
                              entity.type === 'ADDRESS' ? 'bg-purple-100 text-purple-800' :
                              entity.type === 'DATE_OF_BIRTH' ? 'bg-pink-100 text-pink-800' :
                              entity.type === 'FINANCIAL' ? 'bg-emerald-100 text-emerald-800' :
                              entity.type === 'MEDICAL' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entity.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Type: {entity.type}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium text-gray-700">{Math.round(entity.confidence * 100)}%</span>
                          <button 
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
                            aria-label={`View details for ${entity.text}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Page {entity.page + 1} {entity.coordinates && `• Position (${Math.round(entity.coordinates.x)}, ${Math.round(entity.coordinates.y)})`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 bg-white rounded-md shadow-sm border border-gray-200 p-5">
              <textarea
                ref={feedbackRef}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Select a redacted item to provide specific feedback, or enter general feedback here..."
                className="w-full h-24 text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Feedback"
              ></textarea>
              <div className="flex justify-between items-center mt-3">
                <button 
                  onClick={handleClearFeedback}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="Clear feedback"
                  aria-label="Clear feedback"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3.5 14l-7-7m0 7l7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">{feedback.length} characters</div>
                  <button 
                    onClick={handleSubmitFeedback}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    disabled={!feedback.trim()}
                    aria-label="Submit feedback"
                  >
                    <span>Submit</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
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
                  Redacted Document: {document.name}
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