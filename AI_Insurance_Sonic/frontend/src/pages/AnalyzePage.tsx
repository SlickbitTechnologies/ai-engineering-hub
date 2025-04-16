import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FaCloudUploadAlt, FaCheckCircle, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useCreateBatchMutation, useGetBatchesQuery, useUploadFilesMutation, Batch } from '../redux/analyzeApi';
import { parseApiError } from '../services/errorHandler';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit';
import { toast, Toaster } from 'react-hot-toast';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// BatchStatus component
const BatchStatus: React.FC = () => {
  console.log('Rendering BatchStatus component');
  
  // Get batches from API
  const { data: batches, isLoading, error } = useGetBatchesQuery();

  // Render status indicator badge
  const renderStatusBadge = (status: 'pending' | 'processing' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-[#00aff0]">
            <FaSpinner className="mr-1 animate-spin" /> Processing
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FaSpinner className="mr-1" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FaExclamationCircle className="mr-1" /> Failed
          </span>
        );
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (batch: Batch) => {
    if (batch.total_audio_files === 0) {
      return 0;
    }
    return Math.round((batch.completed_files / batch.total_audio_files) * 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Batch Processing Status</h2>
        <div className="flex justify-center">
          <FaSpinner className="animate-spin text-[#00aff0] text-4xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const apiError = parseApiError(error as FetchBaseQueryError | SerializedError);
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Batch Processing Status</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <h3 className="text-lg font-semibold mb-2">Error Loading Batches</h3>
          <p>{apiError.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!batches || batches.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Batch Processing Status</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-500">No batches found. Upload some files to get started.</p>
        </div>
      </div>
    );
  }
  console.log(batches);
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Batch Processing Status</h2>
      
      <div className="space-y-4">
        {batches.map((batch) => (
          <div key={batch.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{batch.description}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded on {new Date(batch.createdAt).toLocaleDateString()} • {batch.total_audio_files} files
                </p>
              </div>
              <div>{renderStatusBadge(batch.status)}</div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Processing progress</span>
                <span className="text-sm font-medium text-gray-700">
                  {batch.completed_files} of {batch.total_audio_files} files ({getProgressPercentage(batch)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#00aff0] h-2.5 rounded-full" 
                  style={{ width: `${getProgressPercentage(batch)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                View Details
              </button>
              {batch.status === 'completed' && (
                <button className="px-4 py-2 text-sm font-medium text-white bg-[#00aff0] border border-transparent rounded-md hover:bg-[#0099d6]">
                  Generate Report
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyzePage: React.FC = () => {
  console.log('Rendering Analyze page');
  
  const [batchName, setBatchName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Redux API hooks
  const [createBatch, { isLoading: isCreatingBatch }] = useCreateBatchMutation();
  const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();



  // Set isUploading based on API loading states
  useEffect(() => {
    setIsUploading(isCreatingBatch || isUploadingFiles);
  }, [isCreatingBatch, isUploadingFiles]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp4'
      );
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp4'
      );
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    }
  };

  const handleClear = () => {
    setFiles([]);
    setBatchName('');
    setUploadError(null);
  };

  const handleUpload = async () => {
    console.log('Uploading files:', files);
    console.log('Batch name:', batchName);
    
    if (!files.length || !batchName) {
      setUploadError('Please provide a batch name and select at least one file.');
      return;
    }
    
    setUploadError(null);
    setIsUploading(true);
    
    try {
      // Step 1: Create a new batch
      const batch = await createBatch({ name: batchName }).unwrap();
      console.log('Batch created:', batch);
      
      // Step 2: Upload files to the batch
      const formData = new FormData();
      // Append each file with the same key name 'files'
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      console.log('Sending form data:', formData);
      
      const uploadedFiles = await uploadFiles({ batchId: batch.id, files: formData }).unwrap();
      console.log('Files uploaded:', uploadedFiles);
      
      // Clear the form
      handleClear();
      
      // Success message
      toast.success(`Successfully uploaded ${uploadedFiles.length} files to batch "${batchName}"`);
    } catch (err) {
      console.error('Error uploading files:', err);
      const apiError = parseApiError(err as FetchBaseQueryError | SerializedError);
      setUploadError(`Failed to upload files: ${apiError.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const tabCategories = ['Upload Files', 'Batch Status'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      {/* Debug API Connection */}
    
      
      <div className="mb-6">
        <Tab.Group>
          <Tab.List className="flex space-x-8 border-b border-gray-200">
            {tabCategories.map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'py-4 px-1 text-sm font-medium outline-none',
                    'border-b-2 focus:outline-none',
                    selected
                      ? 'border-[#00aff0] text-[#00aff0]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            <Tab.Panel>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Upload Audio Files</h2>
                
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                    {uploadError}
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] text-black"
                    placeholder="Enter a name for this batch"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4 flex flex-col items-center justify-center"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <FaCloudUploadAlt className="text-gray-400 text-5xl mb-3" />
                  <p className="text-lg font-medium mb-1">Drag audio files here or click to browse</p>
                  <p className="text-sm text-gray-500 mb-4">Supports .mp3, .wav and .m4a files up to 500MB each</p>
                  <label className={`px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    Select Files
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Files: {files.length}</p>
                    <ul className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                      {files.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0">
                          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleClear}
                    disabled={isUploading}
                  >
                    Clear
                  </button>
                  <button 
                    className={`px-4 py-2 bg-[#00aff0] text-white rounded hover:bg-[#0099d6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                    onClick={handleUpload}
                    disabled={isUploading || !files.length || !batchName}
                  >
                    {isUploading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Upload and Process'
                    )}
                  </button>
                </div>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <BatchStatus />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AnalyzePage; 