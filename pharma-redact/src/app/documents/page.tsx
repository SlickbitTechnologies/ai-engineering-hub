"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MainLayout } from "@/components/layout/main-layout";
import { DocumentCard } from "@/components/ui/document-card";
import { RootState } from "@/store";
import { Document, addDocument, selectDocument } from "@/store/slices/documentsSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DocumentsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { documents, isLoading } = useSelector((state: RootState) => state.documents as {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
    selectedDocumentId: string | null;
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSource, setUploadSource] = useState<'upload' | 'dms' | 'sharepoint' | 'sample'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  
  // Open upload modal if query param is present
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setIsUploadModalOpen(true);
    }
  }, [searchParams]);
  
  // Filter documents based on status parameter
  const filteredDocuments = statusFilter
    ? documents.filter(doc => doc.status === statusFilter)
    : documents;

  const handleDocumentClick = (documentId: string) => {
    dispatch(selectDocument(documentId));
    router.push(`/documents/${documentId}`);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array for easier manipulation
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
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
      setSelectedFiles(filesArray);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add each file as a document
    selectedFiles.forEach(file => {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      const isValidType = fileType === 'pdf' || fileType === 'docx';
      
      const newDoc = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: file.name,
        type: (isValidType ? fileType : 'pdf') as 'pdf' | 'docx',
        path: `/documents/uploads/${file.name}`,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
        source: uploadSource,
      };
      
      dispatch(addDocument(newDoc));
    });
    
    // Clean up
    clearInterval(interval);
    setUploadProgress(100);
    
    // Wait a bit to show 100% before closing
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploadModalOpen(false);
    }, 500);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      simulateUpload();
    } else if (uploadSource !== 'upload') {
      // For non-upload sources, create a placeholder document
      const newDoc = {
        id: Date.now().toString(),
        name: `Document_${Math.floor(Math.random() * 1000)}_${uploadSource}.pdf`,
        type: 'pdf' as const,
        path: `/documents/sample-${Date.now()}.pdf`,
        size: Math.floor(Math.random() * 1000000) + 100000,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
        source: uploadSource,
      };
      
      dispatch(addDocument(newDoc));
      setIsUploadModalOpen(false);
    }
  };

  const handleGenerateSample = () => {
    const sampleDoc = {
      id: Date.now().toString(),
      name: `Clinical_Study_Report_${Math.floor(Math.random() * 100)}.docx`,
      type: 'docx' as const,
      path: `/documents/sample-${Date.now()}.docx`,
      size: Math.floor(Math.random() * 2000000) + 500000,
      uploadedAt: new Date().toISOString(),
      status: 'pending' as const,
      source: 'sample' as const,
    };
    
    dispatch(addDocument(sampleDoc));
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'redacted':
        return 'bg-chateau-green-100 text-chateau-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-red-600">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    } else if (extension === 'docx' || extension === 'doc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-blue-600">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-600">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              Manage your documents for redaction
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 transition-colors shadow-sm"
            >
              Upload Document
            </button>
            <button
              onClick={handleGenerateSample}
              className="px-4 py-2 rounded-lg border border-chateau-green-600 text-chateau-green-600 font-medium hover:bg-chateau-green-50 transition-colors"
            >
              Generate Sample
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
            <Link 
              href="/documents" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${!statusFilter ? 'bg-chateau-green-50 text-chateau-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              All Documents
            </Link>
            <Link 
              href="/documents?status=pending" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Pending
            </Link>
            <Link 
              href="/documents?status=processing" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'processing' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Processing
            </Link>
            <Link 
              href="/documents?status=redacted" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'redacted' ? 'bg-chateau-green-50 text-chateau-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Redacted
            </Link>
            <Link 
              href="/documents?status=error" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'error' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Error
            </Link>
          </div>

          {/* Document List - Scrollable Section */}
          <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 -mr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <p>Loading documents...</p>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc: Document) => (
                  <Link 
                    key={doc.id} 
                    href={`/documents/${doc.id}`}
                    className="block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="mr-3 p-2 bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-600">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 line-clamp-1">{doc.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <span>{doc.type.toUpperCase()}</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.size)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusBadgeClass(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">Source: {doc.source}</span>
                        <span className="text-gray-500">{new Date(doc.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-500">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents found</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md">
                    {statusFilter ? `No ${statusFilter} documents available.` : 'Upload a document or generate a sample to get started.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="px-4 py-2 bg-chateau-green-600 text-white rounded-lg hover:bg-chateau-green-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2"
                    >
                      Upload Document
                    </button>
                    <button
                      onClick={handleGenerateSample}
                      className="px-4 py-2 border border-chateau-green-600 text-chateau-green-600 rounded-lg hover:bg-chateau-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2"
                    >
                      Generate Sample
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal (simplified) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Document</h2>
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFiles([]);
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isUploading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Source
                </label>
                <select
                  value={uploadSource}
                  onChange={(e) => setUploadSource(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                  disabled={isUploading}
                >
                  <option value="upload">Local Upload</option>
                  <option value="dms">Document Management System</option>
                  <option value="sharepoint">SharePoint</option>
                </select>
              </div>

              {uploadSource === 'upload' && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".pdf,.docx,.doc"
                    multiple
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  
                  {selectedFiles.length === 0 ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-400 mx-auto mb-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drag and drop your files here, or click to browse
                      </p>
                      <button 
                        className="mt-2 text-chateau-green-600 text-sm hover:underline"
                        onClick={handleBrowseClick}
                        disabled={isUploading}
                      >
                        Browse Files
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-40 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border-b last:border-0">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(file.name)}
                              <div>
                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeFile(index)}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={isUploading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add more button */}
                      <div className="bg-gray-50 p-3 text-center">
                        <button 
                          className="text-sm text-chateau-green-600 hover:text-chateau-green-700 font-medium" 
                          onClick={handleBrowseClick}
                          disabled={isUploading}
                        >
                          Add More Files
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload progress */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-chateau-green-600 transition-all duration-300 ease-in-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}% complete</p>
                    </div>
                  )}
                </>
              )}

              {uploadSource === 'dms' && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Connect to your Document Management System to browse files.
                  </p>
                  <button 
                    className="text-chateau-green-600 text-sm hover:underline"
                    disabled={isUploading}
                  >
                    Connect to DMS
                  </button>
                </div>
              )}

              {uploadSource === 'sharepoint' && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Connect to SharePoint to access your documents.
                  </p>
                  <button 
                    className="text-chateau-green-600 text-sm hover:underline"
                    disabled={isUploading}
                  >
                    Connect to SharePoint
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFiles([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-chateau-green-600 text-white rounded-lg hover:bg-chateau-green-700 disabled:opacity-50 flex items-center"
                  disabled={uploadSource === 'upload' && selectedFiles.length === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 