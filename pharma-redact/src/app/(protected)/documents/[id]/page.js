'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, Download, AlertCircle,
  FileText, ChevronRight, Eye, AlertTriangle, Trash2
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { getDocumentById, updateDocumentStatus, deleteDocument } from '../../../lib/firebase';
import { useAuth } from '../../../lib/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function DocumentDetail() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id;

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth');
      return;
    }

    if (user && documentId) {
      fetchDocumentDetails();
    }
  }, [user, authLoading, documentId]);

  const fetchDocumentDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const doc = await getDocumentById(documentId);
      
      if (!doc) {
        setError('Document not found');
        setIsLoading(false);
        return;
      }
      
      if (doc.userId !== user.uid) {
        setError('You do not have permission to view this document');
        setIsLoading(false);
        return;
      }
      
      setDocument(doc);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleStatusChange = async (newStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateDocumentStatus(documentId, newStatus);
      setDocument(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating document status:', err);
      setError('Failed to update document status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await deleteDocument(documentId);
      setIsDeleteModalOpen(false);
      router.push('/documents');
    } catch (err) {
      console.error('Error deleting document:', err);
      setDeleteError('Failed to delete document. Please try again.');
      setIsDeleting(false);
    }
  };

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link href="/documents" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Documents
        </Link>
      </motion.div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
        </div>
      ) : error ? (
        <motion.div
          initial={fadeIn.hidden}
          animate={fadeIn.visible}
          className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200"
        >
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">{error}</p>
          <Link
            href="/documents"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700"
          >
            Return to Documents
          </Link>
        </motion.div>
      ) : document ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Document Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-gray-100">
                  <FileText className="h-6 w-6 text-gray-700" />
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {document.fileName || document.filename || 'Unnamed Document'}
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Uploaded on {formatDate(document.createdAt)}</span>
                    <span className="mx-2">•</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        document.status === 'redacted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {document.status === 'redacted' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Redacted
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                {document.downloadUrl && (
                  <a
                    href={document.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </a>
                )}
                
                <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <Dialog.Trigger asChild>
                    <button className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </button>
                  </Dialog.Trigger>
                  
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-20">
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="mt-3">
                          <Dialog.Title className="text-lg font-medium text-gray-900">
                            Delete Document
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Are you sure you want to delete this document? This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {deleteError && (
                        <div className="mt-4 p-3 bg-red-50 text-red-800 text-sm rounded-md">
                          {deleteError}
                        </div>
                      )}
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <Dialog.Close asChild>
                          <button
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={isDeleting}
                          >
                            Cancel
                          </button>
                        </Dialog.Close>
                        <button
                          onClick={handleDeleteDocument}
                          disabled={isDeleting}
                          className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>
          </div>
          
          {/* Document Content */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <Tabs.Trigger
                value="details"
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${
                  activeTab === 'details'
                    ? 'bg-chateau-green-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Document Details
              </Tabs.Trigger>
              <Tabs.Trigger
                value="processing"
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${
                  activeTab === 'processing'
                    ? 'bg-chateau-green-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Processing Status
              </Tabs.Trigger>
              {document.status === 'redacted' && (
                <Tabs.Trigger
                  value="redactions"
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${
                    activeTab === 'redactions'
                      ? 'bg-chateau-green-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Redaction Report
                </Tabs.Trigger>
              )}
            </Tabs.List>
            
            <div className="mt-6">
              <Tabs.Content value="details" className="focus:outline-none">
                <motion.div
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Document Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500">File Name</h3>
                        <p className="mt-1 text-sm text-gray-900">{document.fileName || document.filename || 'N/A'}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Upload Date</h3>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(document.createdAt)}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500">File Type</h3>
                        <p className="mt-1 text-sm text-gray-900">{document.fileType || document.contentType || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              document.status === 'redacted'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {document.status === 'redacted' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Redacted
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {document.lastModified && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">Last Modified</h3>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(document.lastModified)}</p>
                        </div>
                      )}
                      
                      {document.fileSize && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">File Size</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {Math.round(document.fileSize / 1024)} KB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {document.status === 'pending' && (
                    <div className="mt-6 flex items-center justify-end">
                      <button
                        onClick={() => handleStatusChange('redacted')}
                        disabled={isUpdating}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 disabled:opacity-50"
                      >
                        {isUpdating ? 'Updating...' : 'Mark as Redacted'}
                      </button>
                    </div>
                  )}
                </motion.div>
              </Tabs.Content>
              
              <Tabs.Content value="processing" className="focus:outline-none">
                <motion.div
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Processing Status</h2>
                  
                  {document.status === 'redacted' ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Processing Complete</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              This document has been successfully processed and redacted.
                              {document.lastModified && 
                                ` Completed on ${formatDate(document.lastModified)}.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Processing Pending</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                This document is currently in the processing queue.
                                {document.createdAt && 
                                  ` Uploaded on ${formatDate(document.createdAt)}.`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Manual Status Update</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          If you've already processed this document elsewhere, you can manually update its status.
                        </p>
                        
                        <button
                          onClick={() => handleStatusChange('redacted')}
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 disabled:opacity-50"
                        >
                          {isUpdating ? 'Updating...' : 'Mark as Redacted'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </Tabs.Content>
              
              {document.status === 'redacted' && (
                <Tabs.Content value="redactions" className="focus:outline-none">
                  <motion.div
                    initial={slideUp.hidden}
                    animate={slideUp.visible}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Redaction Report</h2>
                    
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Eye className="mx-auto h-8 w-8 text-gray-400" />
                      <h3 className="mt-2 text-base font-medium text-gray-900">View Detailed Report</h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                        Access the complete redaction report with detailed information about what was redacted.
                      </p>
                      <Link
                        href={`/documents/${documentId}/report`}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700"
                      >
                        View Report
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                </Tabs.Content>
              )}
            </div>
          </Tabs.Root>
        </motion.div>
      ) : null}
    </div>
  );
} 