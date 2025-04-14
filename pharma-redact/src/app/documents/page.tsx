"use client";

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addDocument, 
  selectDocument, 
  Document,
  fetchDocuments,
  removeDocument
} from '@/store/slices/documentsSlice';
import { RootState } from '@/store';
import { MainLayout } from '@/components/layout/main-layout';
import { uploadFileToLocalStorage, addDocumentToLocalStorage, deleteDocument as deleteLocalDocument } from '@/utils/localStorage';

type UploadSource = 'local' | 'dms' | 'sharepoint';

export default function DocumentsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { documents, isLoading } = useSelector((state: RootState) => state.documents);
  
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'redacted'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSource, setUploadSource] = useState<UploadSource>('local');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Fetch documents from Firebase on component mount
  useEffect(() => {
    dispatch(fetchDocuments() as any);
  }, [dispatch]);

  const filteredDocuments = documents.filter(doc => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return doc.status === 'pending';
    if (activeTab === 'redacted') return doc.status === 'redacted';
    return true;
  });

  const handleTabChange = (tab: 'all' | 'pending' | 'redacted') => {
    setActiveTab(tab);
  };

  const handleDocumentClick = (documentId: string) => {
    dispatch(selectDocument(documentId));
    router.push(`/documents/${documentId}`);
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Upload file to local storage instead of Firebase
        const fileUrl = await uploadFileToLocalStorage(file);
        
        // Calculate progress
        const currentProgress = Math.round(((i + 1) / selectedFiles.length) * 100);
        setUploadProgress(currentProgress);
        
        // Create document object
        const newDocument: Omit<Document, 'id' | 'firestoreId'> = {
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          path: `/documents/${file.name}`,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          status: 'pending',
          source: uploadSource,
          fileUrl
        };
        
        // Add document to Redux and local storage
        dispatch(addDocument(newDocument) as any);
      }
      
      // Reset state after successful upload
      setSelectedFiles([]);
      setIsUploadModalOpen(false);
      setIsUploading(false);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      // Delete document from local storage instead of Firebase
      if (doc.fileUrl) {
        await deleteLocalDocument(doc.fileUrl, doc.id);
      }
      
      // Remove from Redux store
      await dispatch(removeDocument({ 
        id: doc.id
      }) as any);
      
      setShowDeleteConfirm(null);
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

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and process your documents</p>
          </div>
          <button
            onClick={handleUploadClick}
            className="mt-4 md:mt-0 px-4 py-2 bg-chateau-green-600 text-white rounded-lg hover:bg-chateau-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2"
          >
            Upload Document
          </button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            <button
              className={`py-2 px-4 ${
                activeTab === 'all'
                  ? 'text-chateau-green-600 border-b-2 border-chateau-green-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('all')}
            >
              All Documents
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === 'pending'
                  ? 'text-chateau-green-600 border-b-2 border-chateau-green-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('pending')}
            >
              Pending
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === 'redacted'
                  ? 'text-chateau-green-600 border-b-2 border-chateau-green-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('redacted')}
            >
              Redacted
            </button>
          </div>
        </div>

        <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 -mr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                ></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'all'
                  ? 'Get started by uploading a document.'
                  : activeTab === 'pending'
                  ? 'No pending documents found.'
                  : 'No redacted documents found.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleUploadClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Upload Document
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                  <div 
                    className="p-4 cursor-pointer" 
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${
                          doc.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {doc.type === 'pdf' ? (
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2H4v-1h16v1h-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{doc.name}</h3>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              doc.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : doc.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : doc.status === 'redacted'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{formatFileSize(doc.size)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-300 capitalize">{doc.source}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(doc.id);
                      }}
                      className="text-gray-400 hover:text-red-500 focus:outline-none"
                      aria-label="Delete document"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Delete confirmation dialog */}
                  {showDeleteConfirm === doc.id && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 flex flex-col justify-center items-center p-4 z-10 rounded-lg shadow-lg">
                      <svg className="h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Delete Document?</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                        Are you sure you want to delete this document? This action cannot be undone.
                      </p>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Document</h2>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Source</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md ${
                      uploadSource === 'local'
                        ? 'bg-chateau-green-600 text-white'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setUploadSource('local')}
                  >
                    Local Upload
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md ${
                      uploadSource === 'dms'
                        ? 'bg-chateau-green-600 text-white'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setUploadSource('dms')}
                  >
                    From DMS
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md ${
                      uploadSource === 'sharepoint'
                        ? 'bg-chateau-green-600 text-white'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setUploadSource('sharepoint')}
                  >
                    SharePoint
                  </button>
                </div>
              </div>

              {uploadSource === 'local' && (
                <>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center ${
                      selectedFiles.length > 0 ? 'border-chateau-green-300 bg-chateau-green-50' : 'border-gray-300 hover:border-chateau-green-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.docx"
                      multiple
                    />
                    {selectedFiles.length === 0 ? (
                      <>
                        <svg 
                          className="mx-auto h-12 w-12 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <button 
                            type="button" 
                            onClick={handleFileSelect}
                            className="text-chateau-green-600 hover:text-chateau-green-500 font-medium"
                          >
                            Click to upload
                          </button> or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          PDF or DOCX (max. 20MB)
                        </p>
                      </>
                    ) : (
                      <div className="text-center">
                        <svg 
                          className="mx-auto h-12 w-12 text-chateau-green-500" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-chateau-green-600">
                          {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                        </p>
                        <button 
                          type="button" 
                          onClick={handleFileSelect}
                          className="mt-1 text-xs text-chateau-green-600 hover:text-chateau-green-500 font-medium underline"
                        >
                          Add more files
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="border rounded-lg mb-6 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected Files
                      </div>
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="px-4 py-3 flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div 
                                className={`flex-shrink-0 h-8 w-8 rounded flex items-center justify-center ${
                                  file.name.endsWith('.pdf') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                {file.name.endsWith('.pdf') ? (
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2H4v-1h16v1h-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-gray-900 dark:text-white font-medium truncate max-w-xs">{file.name}</p>
                                <p className="text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeFile(index)}
                              className="text-gray-400 hover:text-red-500 focus:outline-none"
                              aria-label="Remove file"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {(uploadSource === 'dms' || uploadSource === 'sharepoint') && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {uploadSource === 'dms' 
                          ? 'DMS integration is currently in development. Please use local upload for now.' 
                          : 'SharePoint integration is currently in development. Please use local upload for now.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-chateau-green-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading || uploadSource !== 'local'}
                  className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 ${
                    selectedFiles.length === 0 || isUploading || uploadSource !== 'local'
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-chateau-green-600 hover:bg-chateau-green-700'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 