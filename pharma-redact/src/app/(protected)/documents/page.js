'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, Upload, Plus, X, Filter, Search, 
  CheckCircle, Clock, Calendar, MoreHorizontal,
  ArrowUpDown, ChevronDown, Trash, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../lib/AuthContext';
import { getUserDocuments, uploadFile, addDocument } from '../../../lib/firebase';
import * as Dialog from '@radix-ui/react-dialog';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 500,
      duration: 0.3
    } 
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 } 
  }
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Fetch documents
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    async function fetchDocuments() {
      if (user) {
        try {
          const docs = await getUserDocuments(user.uid);
          setDocuments(docs);
        } catch (error) {
          console.error('Error fetching documents:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Filter and sort documents
  const filteredDocuments = documents.filter(doc => {
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    if (searchTerm && !doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.fileName.localeCompare(b.fileName)
        : b.fileName.localeCompare(a.fileName);
    }
    return 0;
  });

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadingFiles(files.map(file => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      progress: 0
    })));
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadingFiles.length) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      
      // Upload each file
      for (const fileInfo of uploadingFiles) {
        const fileData = await uploadFile(user.uid, fileInfo.file);
        
        // Add document to Firestore
        await addDocument('documents', {
          userId: user.uid,
          fileName: fileInfo.name,
          type: fileInfo.type,
          size: fileInfo.size,
          status: 'pending',
          file: fileData,
        });
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset and fetch updated documents
      setTimeout(() => {
        setIsUploading(false);
        setUploadingFiles([]);
        setIsUploadModalOpen(false);
        
        // Refresh documents
        const fetchUpdatedDocs = async () => {
          const updatedDocs = await getUserDocuments(user.uid);
          setDocuments(updatedDocs);
        };
        fetchUpdatedDocs();
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Empty state
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage and redact your sensitive documents</p>
        </div>
        
        <motion.button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-chateau-green-600 text-white rounded-md shadow-sm hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Document
        </motion.button>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center"
      >
        <div className="relative flex-1 min-w-0 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-chateau-green-500 focus:border-chateau-green-500 sm:text-sm"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <button 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
              onClick={() => toggleSort('date')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Date
              <ArrowUpDown className={`h-4 w-4 ml-2 ${sortBy === 'date' ? 'text-chateau-green-600' : 'text-gray-400'}`} />
            </button>
          </div>
          
          <div className="relative">
            <button 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
              onClick={() => toggleSort('name')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Name
              <ArrowUpDown className={`h-4 w-4 ml-2 ${sortBy === 'name' ? 'text-chateau-green-600' : 'text-gray-400'}`} />
            </button>
          </div>
          
          <div className="relative">
            <button 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Status
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-10 hidden">
              <div className="py-1">
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filterStatus === 'all' ? 'text-chateau-green-600 bg-chateau-green-50' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All Documents
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filterStatus === 'pending' ? 'text-chateau-green-600 bg-chateau-green-50' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setFilterStatus('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filterStatus === 'redacted' ? 'text-chateau-green-600 bg-chateau-green-50' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setFilterStatus('redacted')}
                >
                  Redacted
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Document Grid */}
      {filteredDocuments.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {filteredDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              variants={slideUp}
              whileHover={{ y: -5 }}
            >
              <Link href={`/documents/${doc.id}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {doc.fileName}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                    <div>
                      {doc.status === 'redacted' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Redacted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(doc.createdAt)}
                    </div>
                    
                    <div className="relative inline-block text-left">
                      <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow rounded-lg p-8 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-full">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all'
                ? "No documents match your search or filter criteria. Try changing your search terms or filters."
                : "You haven't uploaded any documents yet. Get started by clicking the Upload Document button above."}
            </p>
            {(searchTerm || filterStatus !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-chateau-green-700 bg-chateau-green-100 hover:bg-chateau-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
              >
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Upload Modal */}
      <Dialog.Root open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div 
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Upload Document
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-400 hover:text-gray-500">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                {!isUploading ? (
                  <>
                    {uploadingFiles.length === 0 ? (
                      <div className="flex justify-center items-center p-6 border-2 border-dashed border-gray-300 rounded-md">
                        <div className="space-y-1 text-center">
                          <FileText className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-chateau-green-600 hover:text-chateau-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-chateau-green-500">
                              <span>Upload a file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF, DOCX, DOC up to 10MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-gray-700">Selected Files</div>
                        {uploadingFiles.map((file, index) => (
                          <div key={index} className="flex items-start p-3 border border-gray-200 rounded-md">
                            <FileText className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <button 
                              className="ml-2 text-gray-400 hover:text-gray-500"
                              onClick={() => {
                                const newFiles = [...uploadingFiles];
                                newFiles.splice(index, 1);
                                setUploadingFiles(newFiles);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="pt-2">
                          <label htmlFor="more-files" className="relative cursor-pointer rounded-md font-medium text-chateau-green-600 hover:text-chateau-green-500 focus-within:outline-none">
                            <span>Add more files</span>
                            <input 
                              id="more-files" 
                              name="more-files" 
                              type="file" 
                              className="sr-only"
                              onChange={(e) => {
                                const newFiles = Array.from(e.target.files);
                                setUploadingFiles([
                                  ...uploadingFiles,
                                  ...newFiles.map(file => ({
                                    file,
                                    name: file.name,
                                    type: file.type,
                                    size: file.size,
                                    progress: 0
                                  }))
                                ]);
                              }}
                              accept=".pdf,.doc,.docx,.txt"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Uploading...</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-chateau-green-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-500">
                      {uploadProgress}% complete
                    </p>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-end space-x-3">
                {!isUploading && (
                  <Dialog.Close asChild>
                    <button 
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                )}
                <button 
                  onClick={handleUpload}
                  disabled={uploadingFiles.length === 0 || isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
} 