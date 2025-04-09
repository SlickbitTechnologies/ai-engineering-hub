import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, FileText, X, AlertTriangle, Check, RefreshCw, Trash2, BarChart, Loader2 } from 'lucide-react';
import { sentimentService } from '../services/sentimentService';
import { UploadedFile } from '../types/upload';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await sentimentService.getUploads();
      setUploadedFiles(files || []);
    } catch (err) {
      console.error('Error loading uploaded files:', err);
      setError('Failed to load previously uploaded files.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      console.log('Starting file upload...');
      const result = await sentimentService.uploadFiles(formData);
      console.log('Upload completed successfully:', result);
      
      setSuccess(`Files uploaded successfully! ${files.length} file(s) have been uploaded. Please click the "Analyze" button to process the data.`);
      setFiles([]);
      
      // Add newly uploaded files to the list and refresh
      await loadUploadedFiles();
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(`Failed to upload files: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      setError(null);
      await sentimentService.deleteUpload(id);
      await loadUploadedFiles(); // Refresh the file list
      setSuccess('File deleted successfully.');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
    }
  };

  const handleAnalyzeFile = async (id: string) => {
    try {
      setError(null);
      setAnalyzing(id);
      
      console.log(`Analyzing file with ID: ${id}`);
      const result = await sentimentService.analyzeUpload(id);
      console.log('Analysis result:', result);
      
      setSuccess('File analyzed successfully. View results in Dashboard and Sentiment Analysis sections.');
      
      // Refresh the file list to update status
      await loadUploadedFiles();
    } catch (err: any) {
      console.error('Error analyzing file:', err);
      setError(`Failed to analyze file: ${err.message || 'Unknown error'}`);
    } finally {
      setAnalyzing(null);
    }
  };

  const handleAnalyzeAll = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      console.log('Analyzing all files');
      const result = await sentimentService.analyzeAllUploads();
      console.log('Analysis all result:', result);
      
      setSuccess('All files are being analyzed. View results in Dashboard and Sentiment Analysis sections.');
      
      // Refresh the file list
      await loadUploadedFiles();
    } catch (err: any) {
      console.error('Error analyzing files:', err);
      setError(`Failed to analyze files: ${err.message || 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload</h1>
        <p className="text-gray-600 mt-1">Upload your feedback files for analysis</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">
            Drag and drop your files here, or{" "}
            <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
              browse
              <input
                type="file"
                className="hidden"
                multiple
                accept=".csv,.xlsx,.json"
                onChange={handleFileInput}
              />
            </label>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Supported formats: CSV, XLSX, JSON
          </p>
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Selected Files</h3>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  uploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {uploading ? 
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </div> : 'Upload Files'}
              </button>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
            <div className="flex items-center space-x-3">
              <button 
                onClick={loadUploadedFiles}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              
              {uploadedFiles.length > 0 && (
                <button
                  onClick={handleAnalyzeAll}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <BarChart className="w-4 h-4" />
                  <span>Analyze All Files</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">Loading uploaded files...</p>
            </div>
          ) : uploadedFiles.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <p className="text-gray-500">No files have been uploaded yet.</p>
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entries
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{file.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{file.entries} entries</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.upload_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {file.analyzed ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Analyzed
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Not Analyzed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          {!file.analyzed && (
                            <button
                              onClick={() => handleAnalyzeFile(file.id)}
                              disabled={analyzing === file.id}
                              className={`flex items-center space-x-1 px-3 py-1 rounded ${
                                analyzing === file.id 
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                              title="Analyze File"
                            >
                              {analyzing === file.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Analyzing</span>
                                </>
                              ) : (
                                <>
                                  <BarChart className="w-4 h-4" />
                                  <span>Analyze</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}