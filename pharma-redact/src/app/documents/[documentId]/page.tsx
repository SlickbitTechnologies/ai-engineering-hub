"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document, updateDocumentStatus } from "@/store/slices/documentsSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const documentId = params.documentId as string;
  
  // In a real implementation, we would fetch the document from the API or Redux store
  // For now, we'll use mock data
  const [document, setDocument] = useState<Document>({
    id: documentId,
    name: `Clinical_Study_Report_${Math.floor(Math.random() * 100)}.pdf`,
    type: 'pdf',
    path: `/documents/sample-${documentId}.pdf`,
    size: 2456789,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    source: 'upload',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProcessDocument = () => {
    setIsProcessing(true);
    dispatch(updateDocumentStatus({ id: documentId, status: 'processing' }));
    
    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          dispatch(updateDocumentStatus({ id: documentId, status: 'redacted' }));
          setDocument(prev => ({ ...prev, status: 'redacted' }));
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
                  onClick={handleProcessDocument}
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
                      onClick={handleProcessDocument}
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
    </MainLayout>
  );
} 