import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { FaCloudUploadAlt, FaCheckCircle, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Define the batch interface
interface Batch {
  id: number;
  name: string;
  uploadDate: string;
  fileCount: number;
  processed: number;
  status: 'completed' | 'processing' | 'failed';
}

// BatchStatus component
const BatchStatus: React.FC = () => {
  // Mock batch data
  const batches: Batch[] = [
    {
      id: 1,
      name: 'March Claims Calls',
      uploadDate: '2025-03-15',
      fileCount: 124,
      processed: 124,
      status: 'completed'
    },
    {
      id: 2,
      name: 'Customer Service Q1',
      uploadDate: '2025-04-01',
      fileCount: 240,
      processed: 163,
      status: 'processing'
    },
    {
      id: 3,
      name: 'Sales Team Calls',
      uploadDate: '2025-04-05',
      fileCount: 78,
      processed: 25,
      status: 'processing'
    },
    {
      id: 4,
      name: 'Agent Training Calls',
      uploadDate: '2025-03-28',
      fileCount: 56,
      processed: 25,
      status: 'failed'
    }
  ];

  // Render status indicator badge
  const renderStatusBadge = (status: 'completed' | 'processing' | 'failed') => {
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
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FaExclamationCircle className="mr-1" /> Failed
          </span>
        );
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (processed: number, total: number) => {
    return Math.round((processed / total) * 100);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Batch Processing Status</h2>
      
      <div className="space-y-4">
        {batches.map((batch) => (
          <div key={batch.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{batch.name}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded on {batch.uploadDate} • {batch.fileCount} files
                </p>
              </div>
              <div>{renderStatusBadge(batch.status)}</div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Processing progress</span>
                <span className="text-sm font-medium text-gray-700">
                  {batch.processed} of {batch.fileCount} files ({getProgressPercentage(batch.processed, batch.fileCount)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#00aff0] h-2.5 rounded-full" 
                  style={{ width: `${getProgressPercentage(batch.processed, batch.fileCount)}%` }}
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
  };

  const handleUpload = () => {
    console.log('Uploading files:', files);
    console.log('Batch name:', batchName);
    // In a real app, you would upload the files to a server here
    alert(`Uploading ${files.length} files with batch name: ${batchName}`);
  };

  const tabCategories = ['Upload Files', 'Batch Status'];

  return (
    <div>
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
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                    placeholder="Enter a name for this batch"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
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
                  <label className="px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300">
                    Select Files
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".mp3,.wav,.m4a"
                      onChange={handleFileSelect}
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
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                  <button 
                    className={`px-4 py-2 bg-[#00aff0] text-white rounded hover:bg-[#0099d6] ${(!files.length || !batchName) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleUpload}
                    disabled={!files.length || !batchName}
                  >
                    Upload and Process
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