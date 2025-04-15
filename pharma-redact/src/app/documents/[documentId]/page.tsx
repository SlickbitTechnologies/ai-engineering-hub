"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Document, updateDocumentStatus, updateDocumentProperties, removeDocument } from "@/store/slices/documentsSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { PDFProcessor } from '@/utils/pdf-processor';
import { saveRedactedDocument, getDownloadUrl, deleteDocument as deleteServerDocument } from '@/utils/fileServices';
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
  const [redactedFile, setRedactedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  
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

  const handleStartRedaction = () => {
    setIsRedacting(true);
    // Additional redaction initialization logic would go here
  };
  
  const handleRedactionComplete = async (redactedFile: File, summary: string) => {
    if (!currentDocument) return;
    
    try {
      await saveRedactedDocument(currentDocument.id, redactedFile, summary);
      router.push(`/documents/${currentDocument.id}/report`);
    } catch (error) {
      console.error("Error saving redacted document:", error);
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
            
            {currentDocument.status === 'pending' && !isRedacting && (
              <button
                onClick={handleStartRedaction}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Start Redaction
              </button>
                          )}
                        </div>
                      </div>
                      
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">File Name</p>
              <p className="text-gray-900 dark:text-white">
                {currentDocument.fileName || "Unnamed document"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">File Type</p>
              <p className="text-gray-900 dark:text-white">
                {currentDocument.fileType || "Unknown type"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
              <p className="text-gray-900 dark:text-white">
                {formatFileSize(currentDocument.fileSize)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded At</p>
              <p className="text-gray-900 dark:text-white">
                {formatDate(currentDocument.uploadedAt)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-gray-900 dark:text-white">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentDocument.status === 'redacted'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {currentDocument.status === 'redacted' ? 'Redacted' : 'Pending Redaction'}
                </span>
              </p>
            </div>Document Information

          </div>
        </div>

        {isRedacting ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Redaction Process</h2>
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
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
          </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsRedacting(false)}
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
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                Complete Redaction
              </button>
                    </div>
                  </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Preview</h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8">
              {isRedacting ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-32 w-32 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preparing Document</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Setting up the redaction process...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Document Preview</h3>
                  
                  {currentDocument.originalFilePath ? (
                    <div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {currentDocument.fileStatus === 'missing' ? (
                          <span className="text-amber-500">
                            The file for this document exists in the database but could not be found on disk. 
                            It may have been moved or deleted.
                          </span>
                        ) : currentDocument.fileStatus === 'error' ? (
                          <span className="text-red-500">
                            There was an error accessing this document's file.
                          </span>
                        ) : (
                          "Your document has been uploaded and is ready for redaction."
                        )}
                      </p>
                      <div className="flex justify-center space-x-4">
                        {currentDocument.fileStatus !== 'missing' && currentDocument.fileStatus !== 'error' && (
                          <>
                            <button 
                              onClick={handleStartRedaction}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            >
                              Start Redaction
                            </button>
                            
                            <a 
                              href={getDownloadUrl(currentDocument.id, true)} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              View Original
                            </a>
                          </>
                        )}
                        
                        {(currentDocument.fileStatus === 'missing' || currentDocument.fileStatus === 'error') && (
                          <button
                            onClick={() => router.push('/documents')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            Back to Documents
                          </button>
                        )}
                        
                        {process.env.NODE_ENV === 'development' && currentDocument.fileStatus === 'missing' && (
                          <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Try to Repair File (Dev)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        There might be an issue with this document. The original file could not be located.
                      </p>
                      <button
                        onClick={() => router.push('/documents')}
                        className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Back to Documents
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 