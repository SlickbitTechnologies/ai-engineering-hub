'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Upload, 
  CheckCircle, AlertCircle, File
} from 'lucide-react';
import Link from 'next/link';
import { uploadDocument } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

export default function UploadDocument() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Reset states
    setUploadError('');
    
    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a PDF or Word document.');
      return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploadState('uploading');
    setUploadProgress(0);
    setUploadError('');
    
    try {
      await uploadDocument(
        selectedFile,
        user.uid,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      setUploadState('success');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload document. Please try again.');
      setUploadState('error');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadState('idle');
    setUploadError('');
  };

  if (authLoading) {
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
      
      <motion.div
        initial={fadeIn.hidden}
        animate={fadeIn.visible}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-chateau-green-100">
              <Upload className="h-5 w-5 text-chateau-green-700" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">
              Upload New Document
            </h1>
          </div>
        </div>
        
        <div className="p-6">
          {uploadState === 'success' ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Complete</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your document has been uploaded successfully and is ready for processing.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Upload Another
                </button>
                <Link
                  href="/documents"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700"
                >
                  Go to Documents
                </Link>
              </div>
            </div>
          ) : (
            <>
              {uploadError && (
                <div className="mb-6 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{uploadError}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Upload Area */}
                <div 
                  className={`border-2 ${isDragging ? 'border-chateau-green-400 bg-chateau-green-50' : 'border-dashed border-gray-300'} rounded-lg px-6 py-10 text-center`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploadState === 'uploading' ? (
                    <div className="space-y-4">
                      <FileText className="mx-auto h-12 w-12 text-chateau-green-400" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Uploading...</h3>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{selectedFile.name}</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-chateau-green-600 h-2.5 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-md">
                        <div className="flex items-start">
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
                      </div>
                      <div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
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
                        <p className="mt-1 text-gray-500">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Instructions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <ul className="text-xs text-gray-500 space-y-1 list-disc pl-5">
                    <li>All uploaded documents will be scanned for sensitive information</li>
                    <li>Processing time varies based on document size and complexity</li>
                    <li>You will be notified when processing is complete</li>
                    <li>Your documents are securely stored and processed</li>
                  </ul>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Link
                    href="/documents"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadState === 'uploading'}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadState === 'uploading' ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
} 