'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Upload, X, File, Check, AlertCircle, 
  Clock, CheckCircle, Filter, Search, Plus, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useAuth } from '../../lib/AuthContext';
import { getUserDocuments, uploadFile, addDocument, getCurrentUser, uploadDocument } from '../../../lib/firebase';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const staggeredContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Documents() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadStatus, setLoadStatus] = useState(''); // For showing detailed loading status
  const [activeFilter, setActiveFilter] = useState('all');
  const router = useRouter();

  // Debug logging for auth state
  useEffect(() => {
    console.log('Documents page: Auth State:', { 
      userExists: !!user,
      uid: user?.uid || 'no uid',
      isAuthenticated: !!isAuthenticated,
      authLoading
    });

    // If authentication is complete and there's no user, redirect to login
    if (!authLoading && !user) {
      console.log('Documents page: Not authenticated, redirecting to login page');
      router.push('/auth');
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Set a timeout to exit loading state after a maximum time
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing exit from loading state');
        setIsLoading(false);
        setLoadError('Loading timed out. Please refresh the page to try again.');
      }
    }, 10000); // 10 seconds max loading time

    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  // Function to fetch documents with retry logic
  const fetchUserDocuments = async (userId, retryCount = 0) => {
    if (!userId) return [];
    
    try {
      setLoadStatus('Fetching your documents...');
      console.log(`Fetching documents for user: ${userId} (attempt ${retryCount + 1})`);
      
      const docs = await getUserDocuments(userId);
      console.log('Documents fetched successfully. Document IDs:', docs.map(d => d.id));
      console.log('First document details:', docs.length > 0 ? JSON.stringify(docs[0], null, 2) : 'No documents found');
      
      setLoadStatus('');
      setLoadError('');
      return docs;
    } catch (error) {
      console.error('Error fetching documents:', error);
      
      // If we've retried less than 2 times, try again
      if (retryCount < 2) {
        setLoadStatus(`Retrying... (attempt ${retryCount + 2})`);
        return await new Promise(resolve => {
          setTimeout(() => {
            resolve(fetchUserDocuments(userId, retryCount + 1));
          }, 1500); // Wait 1.5s between retries
        });
      }
      
      // If we've retried enough times, show error
      setLoadError('Failed to load documents. Please refresh to try again.');
      setLoadStatus('');
      return [];
    }
  };

  // Fetch user's documents
  useEffect(() => {
    async function loadDocuments() {
      if (user) {
        try {
          const docs = await fetchUserDocuments(user.uid);
          console.log(`Setting ${docs.length} documents to state`);
          setDocuments(docs);
        } finally {
          console.log('Setting isLoading to false');
          setIsLoading(false);
        }
      } else {
        console.log('No user available, skipping document fetch');
      }
    }

    if (user) {
      loadDocuments();
    } else if (!authLoading) {
      // If we're not loading auth and there's no user, we should not be in loading state
      console.log('No user and not loading auth, setting isLoading to false');
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Filter and search documents
  const filteredDocuments = documents.filter(doc => {
    // Filter by status
    const statusMatch = 
      activeFilter === 'all' || 
      (activeFilter === 'redacted' && doc.status === 'redacted') ||
      (activeFilter === 'pending' && doc.status === 'pending');
    
    // Handle inconsistent field naming (some docs use fileName, others use filename)
    const docName = doc.fileName || doc.filename || '';
    
    // Search by filename
    const searchMatch = docName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const result = statusMatch && (searchQuery === '' || searchMatch);
    
    // Debug any filtered-out documents
    if (!result && searchQuery === '' && activeFilter === 'all') {
      console.log('Document filtered out abnormally:', doc.id, {
        hasFileName: !!doc.fileName,
        hasFilename: !!doc.filename,
        status: doc.status,
      });
    }
    
    return result;
  });

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setUploadError('');
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      console.log('Upload aborted - No file selected');
      setUploadError('Please select a file first');
      return;
    }
    
    if (!user || !user.uid) {
      console.log('Upload aborted - No authenticated user found');
      setUploadError('You must be logged in to upload documents. Please refresh the page and try again.');
      return;
    }
    
    console.log('Starting upload process for file:', selectedFile.name, 'User:', user.uid);
    setUploadState('uploading');
    setUploadProgress(0);
    
    try {
      // Use the uploadDocument function from firebase.js
      const result = await uploadDocument(selectedFile, user.uid, (progress) => {
        setUploadProgress(progress);
      });
      
      console.log('Upload complete:', result);
      setUploadState('success');
      
      // Add the new document to the state
      setDocuments(prev => [result, ...prev]);
      
      // Reset file selection
      setSelectedFile(null);
      
      // Close modal after a delay
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadState('idle');
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadState('error');
      setUploadError(error.message || 'Upload failed. Please try again.');
    }
  };

  // Reset upload state when modal closes
  const handleModalClose = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setUploadError('');
  };

  if (authLoading) {
    console.log('Documents page: Auth is still loading, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-chateau-green-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Authenticating...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
      </div>
    );
  }

  if (!authLoading && !user) {
    console.log('Documents page: No authenticated user, redirecting to login');
    router.push('/auth');
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-chateau-green-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  if (isLoading) {
    console.log('Documents page: Documents are still loading, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-chateau-green-600 mb-4"></div>
        <p className="text-gray-600 text-lg">{loadStatus || 'Loading documents...'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {loadError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{loadError}</p>
              <button 
                onClick={() => {
                  setIsLoading(true);
                  setLoadError('');
                  if (user) {
                    fetchUserDocuments(user.uid)
                      .then(docs => {
                        setDocuments(docs);
                        setIsLoading(false);
                      })
                      .catch(() => {
                        setIsLoading(false);
                      });
                  } else {
                    setIsLoading(false);
                    setLoadError('You are not logged in. Please refresh the page to log in again.');
                  }
                }}
                className="text-sm text-red-800 font-medium underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {loadStatus && !isLoading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          <p className="text-sm">{loadStatus}</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-2">Manage and process your documents for redaction</p>
      </motion.div>
      
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Tabs.Root 
            defaultValue="all" 
            onValueChange={setActiveFilter} 
            className="flex space-x-1 bg-gray-100 p-1 rounded-lg"
          >
            <Tabs.List className="flex">
              <Tabs.Trigger
                value="all"
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All
              </Tabs.Trigger>
              <Tabs.Trigger
                value="redacted"
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'redacted'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Redacted
              </Tabs.Trigger>
              <Tabs.Trigger
                value="pending"
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'pending'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pending
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
          
          <div className="relative flex items-center">
            <Search className="h-5 w-5 text-gray-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-chateau-green-500 focus:border-chateau-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Dialog.Root open={isUploadModalOpen} onOpenChange={(open) => {
          // If trying to open the modal, verify authentication first
          if (open) {
            if (!user) {
              console.log('User not authenticated when opening modal');
              setLoadError('You are not logged in. Please refresh the page to log in again.');
              return; // Don't open the modal
            }
          }
          
          setIsUploadModalOpen(open);
          if (!open) handleModalClose();
        }}>
          <Dialog.Trigger asChild>
            <button className="bg-chateau-green-600 hover:bg-chateau-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </button>
          </Dialog.Trigger>
          
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-20">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Upload Document
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              
              <AnimatePresence mode="wait">
                {uploadState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-6"
                  >
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Upload Successful!</h3>
                    <p className="text-gray-500 text-center">
                      Your document has been uploaded and is ready for processing.
                    </p>
                  </motion.div>
                ) : uploadState === 'uploading' ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6"
                  >
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-chateau-green-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                      <File className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {selectedFile?.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedFile?.size ? `${Math.round(selectedFile.size / 1024)} KB` : ''}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {uploadError && (
                      <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{uploadError}</h3>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg px-6 py-8 text-center">
                        {selectedFile ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                            <File className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 break-all">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {Math.round(selectedFile.size / 1024)} KB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4 flex flex-col justify-center text-sm">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md font-medium text-chateau-green-600 hover:text-chateau-green-500"
                              >
                                <span>Select a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={handleFileChange}
                                  accept=".pdf,.doc,.docx"
                                />
                              </label>
                              <p className="text-gray-500">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              PDF, DOC, DOCX up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Dialog.Close asChild>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                          </button>
                        </Dialog.Close>
                        <button
                          onClick={handleUpload}
                          disabled={!selectedFile}
                          className="px-4 py-2 bg-chateau-green-600 text-white rounded-lg text-sm font-medium hover:bg-chateau-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      
      {/* Document Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <motion.div
          variants={staggeredContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              variants={slideUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/documents/${doc.id}`} className="block">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-md bg-gray-100">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {doc.fileName || doc.filename || 'Unnamed Document'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'redacted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {doc.status === 'redacted' ? (
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
                <div className="bg-gray-50 px-5 py-3 text-right">
                  <span className="text-xs font-medium text-chateau-green-600 hover:text-chateau-green-500">
                    View details →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={fadeIn.hidden}
          animate={fadeIn.visible}
          className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200"
        >
          <File className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? `No results found for "${searchQuery}". Try a different search term.`
              : `You haven't uploaded any documents yet. Click "Upload Document" to get started.`}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                if (!user) {
                  console.log('User not authenticated, showing error');
                  setLoadError('You are not logged in. Please refresh the page to log in again.');
                  return;
                }
                setIsUploadModalOpen(true);
              }}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload your first document
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
} 