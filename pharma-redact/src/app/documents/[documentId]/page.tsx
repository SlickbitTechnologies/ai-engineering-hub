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

export default function DocumentPage({ params }: { params: { documentId: string } }) {
  const router = useRouter();
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
              Document: {currentDocument.fileName}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Status: <span className="font-medium">{currentDocument.status === 'pending' ? 'Pending Redaction' : 'Redacted'}</span>
            </p>
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
            </div>
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
            {/* Document preview would go here */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 flex items-center justify-center">
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
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Document Preview</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click "Start Redaction" to begin the redaction process.
                </p>
                </div>
            </div>
            </div>
          )}
      </div>
    </MainLayout>
  );
} 