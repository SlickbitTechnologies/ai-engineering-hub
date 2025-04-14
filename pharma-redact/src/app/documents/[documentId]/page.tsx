"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document, updateDocument, removeDocument } from "@/store/slices/documentSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { PDFProcessor } from '@/utils/pdf-processor';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/firebaseConfig';
import { redactionTemplates } from "@/config/redactionTemplates";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<'success' | 'error' | 'pending'>('pending');

  // Update local state when Redux store changes
  useEffect(() => {
    if (documentFromStore) {
      setDocument(documentFromStore);
    }
  }, [documentFromStore]);

  const handleProcessDocument = async () => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);

      // Get the document from Redux store
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Fetch the PDF file
      const response = await fetch(document.path);
      const pdfBytes = await response.arrayBuffer();

      // Process the PDF with AI-based redaction
      const redactedPdfBytes = await PDFProcessor.processPDF(
        new Uint8Array(pdfBytes),
        redactionTemplates[0] // Using the Pharmaceutical Default template
      );

      // Upload the redacted PDF to Firebase Storage
      const redactedFileName = `redacted_${document.name}`;
      const redactedPath = `documents/${documentId}/${redactedFileName}`;
      
      const storageRef = ref(storage, redactedPath);
      await uploadBytes(storageRef, new Blob([redactedPdfBytes]));
      const redactedUrl = await getDownloadURL(storageRef);

      // Update document status in Redux
      dispatch(updateDocument({
        id: documentId,
        updates: {
          status: 'redacted',
          redactedUrl: redactedUrl
        }
      }));

      setProcessingProgress(100);
      setProcessingStatus('success');
    } catch (error) {
      console.error('Error processing document:', error);
      setProcessingStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!document) return;
    
    try {
      await dispatch(removeDocument({ 
        id: document.id
      }));
      router.push('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
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
                  <a
                    href={document.redactedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 ml-2 rounded-lg border border-chateau-green-600 text-chateau-green-600 font-medium hover:bg-chateau-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                  >
                    View Redacted Document
                  </a>
                  <button
                    onClick={() => {
                      if (document.redactedUrl) {
                        window.open(document.redactedUrl, '_blank');
                      }
                    }}
                    className="px-4 py-2 ml-2 rounded-lg border border-chateau-green-600 text-chateau-green-600 font-medium hover:bg-chateau-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
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
              
              {/* Delete button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg border border-red-600 text-red-600 font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:translate-y-0.5"
              >
                Delete Document
              </button>
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
                      <a
                        href={document.redactedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg border border-chateau-green-600 text-chateau-green-600 font-medium hover:bg-chateau-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 active:translate-y-0.5"
                      >
                        View Redacted Document
                      </a>
                      <button
                        onClick={() => {
                          if (document.redactedUrl) {
                            window.open(document.redactedUrl, '_blank');
                          }
                        }}
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

                  {document.fileUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Storage Location</p>
                      <a 
                        href={document.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-chateau-green-600 hover:underline truncate block"
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Delete Document</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this document? This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 