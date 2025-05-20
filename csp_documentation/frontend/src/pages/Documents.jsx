import React, { useState, useEffect, useRef } from 'react';
import { useTemplates } from '../context/TemplateContext';
import { useLoading } from '../context/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import '../styles/global.css';

const url = 'https://slickbit-ai-csp.onrender.com';
// const url = 'http://localhost:8000';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 }
};

function Documents() {
  const { templates } = useTemplates();
  const { startLoading, stopLoading, updateProgress, progress, loadingMessage, setProgress, elapsedTime } = useLoading();
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [excelPath, setExcelPath] = useState(localStorage.getItem('lastExcelPath') || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [processTime, setProcessTime] = useState({
    start: '',
    end: ''
  });
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [currentDocumentName, setCurrentDocumentName] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [foundDocumentNames, setFoundDocumentNames] = useState([]);
  const [sharepointUrl, setSharepointUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [tokenStats, setTokenStats] = useState(null);
  const [showTokenStats, setShowTokenStats] = useState(false);

  // Load metadata from backend on component mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const response = await fetch(`${url}/metadata`);
        if (response.ok) {
          const data = await response.json();
          if (data.metadata) {
            setDocuments(data.metadata);
          }
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    loadMetadata();
  }, []);

  // Calculate estimated time remaining
  useEffect(() => {
    if (progress > 0 && progress < 100) {
      // Calculate time based on document size and complexity
      const baseProcessingTime = 5 * 60; // 5 minutes base time in seconds
      const processingTime = Math.max(
        baseProcessingTime,
        Math.min(baseProcessingTime * 2, baseProcessingTime + (progress * 3))
      );
      
      const remainingTime = Math.round((processingTime * (100 - progress)) / 100);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      
      // Format time string with leading zeros for better readability
      const timeString = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
      setEstimatedTimeRemaining(timeString);
      
      // Update progress more frequently for smoother animation
      const timer = setInterval(() => {
        if (progress < 100) {
          updateProgress(Math.min(progress + 0.5, 100));
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setEstimatedTimeRemaining('');
    }
  }, [progress, updateProgress]);

  useEffect(() => {
    let timer;
    if (timerActive && !processingComplete) {
      timer = setInterval(() => {
        // setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, processingComplete]);

  // Add useEffect for fetching token statistics
  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        const response = await fetch(`${url}/token-statistics`);
        if (response.ok) {
          const data = await response.json();
          setTokenStats(data.statistics);
        }
      } catch (error) {
        console.error('Error fetching token statistics:', error);
      }
    };

    // Fetch token stats every minute
    fetchTokenStats();
    const interval = setInterval(fetchTokenStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
  };

  // Extract document ID from URL
  const extractDocumentId = (url) => {
    try {
      // Check if URL contains NCT ID pattern
      const nctMatch = url.match(/NCT\d{8}/);
      if (nctMatch) {
        return nctMatch[0]; // Return the NCT ID
      }
      
      // Fallback to URL path extraction
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1].split('.')[0] || 'Unknown ID';
    } catch (e) {
      return 'Unknown ID';
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedTemplateId || !documentUrl) {
      alert('Please select a template and enter a document URL');
      return;
    }

    // Set the start time
    setProcessTime((prev) => ({
      ...prev,
      start: new Date().toISOString().toLocaleString(),
    }));

    setTimerActive(true);
    // setElapsedTime(0);
    setProcessingComplete(false);
    setFoundDocumentNames([]);
    updateProgress(0);

    startLoading('Processing document...');
    setCurrentStage('Initializing document processing...');
    setError(null);

    try {
      setCurrentStage('Sending document for processing...');
      const response = await fetch(`${url}/process-document?document_url=${encodeURIComponent(documentUrl)}&template_id=${encodeURIComponent(selectedTemplateId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Failed to process document';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
      const data = await response.json();
      
      // Set document info from backend response
      if (data.total_documents) setTotalDocuments(data.total_documents);
      if (data.current_document) setCurrentDocumentName(data.current_document);
      if (data.documents && Array.isArray(data.documents)) setFoundDocumentNames(data.documents.map(doc => doc.name));
      
      if (!data || typeof data !== 'object' || !data.metadata) {
        throw new Error('Invalid response format from server');
      }

      setCurrentStage('Processing document data...');

      // Create new document entry
      const newDocument = {
        id: extractDocumentId(documentUrl),
        url: documentUrl,
        templateId: selectedTemplateId,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      };

      // Add to documents list
      setDocuments(prev => [...prev, newDocument]);
      setCurrentDocument(newDocument);

      // Generate/update Excel file
      setCurrentStage('Generating Excel file...');
      try {
        const excelResponse = await fetch(`${url}/generate-excel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metadata: data.metadata,
            document_url: documentUrl,
            template_id: selectedTemplateId
          })
        });

        if (excelResponse.ok) {
          const excelData = await excelResponse.json();
          setExcelPath(`output/extracted_data_${selectedTemplateId}.xlsx`);
          localStorage.setItem('lastExcelPath', `output/extracted_data_${selectedTemplateId}.xlsx`);
          setCurrentStage('Processing complete!');
          updateProgress(100);
          setProcessingComplete(true);
          setTimerActive(false);
          if (data.sharepoint_url) setSharepointUrl(data.sharepoint_url);
        }
      } catch (excelError) {
        console.error('Error generating Excel:', excelError);
      }

    } catch (error) {
      console.error('Error processing document:', error);
      setError(error.message || 'Failed to process document');
      setProcessingComplete(true);
      setTimerActive(false);
    } finally {

      // Set the end time
      setProcessTime((prev) => ({
        ...prev,
        end: new Date().toISOString().toLocaleString(),
      }));

      setTimeout(() => {
        stopLoading();
        setCurrentStage('');
      }, 2000); // Keep the progress bar visible for 2 seconds after completion
    }
  };

  const handleDownloadExcel = () => {
    if (excelPath && selectedTemplateId) {
      window.open(`${url}/download-excel?template_id=${encodeURIComponent(selectedTemplateId)}`, '_blank');
    }
  };

  const handleEditRow = (index) => {
    setIsEditing(true);
    setEditingRow(index);
  };

  const handleSaveEdit = (index, field, value) => {
    const newMetadata = [...metadata];
    newMetadata[index] = {
      ...newMetadata[index],
      [field]: value
    };
    setMetadata(newMetadata);
    localStorage.setItem('lastMetadata', JSON.stringify(newMetadata));
  };

  const handleDeleteRow = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        // Find the document URL and template ID
        const docToDelete = documents.find(doc => doc.id === docId);
        if (!docToDelete) return;

        // Delete from backend
        const response = await fetch(`${url}/metadata/${encodeURIComponent(docToDelete.url)}?template_id=${encodeURIComponent(docToDelete.templateId)}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete document from backend');
        }

        // Remove the document from the local state
        setDocuments(prevDocuments => {
          if (!prevDocuments) return [];
          return prevDocuments.filter(doc => doc.id !== docId);
        });

        // If this was the current document, clear it
        if (currentDocument && currentDocument.id === docId) {
          setCurrentDocument(null);
        }

        // Clear Excel path if no documents left for this template
        const remainingDocsForTemplate = documents.filter(doc => doc.templateId === docToDelete.templateId).length;
        if (remainingDocsForTemplate <= 1) {
          setExcelPath('');
          localStorage.removeItem('lastExcelPath');
        }

        // Show success message
        alert('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('There was an error deleting the document. Please try again.');
      }
    }
  };

  const handleSaveAll = () => {
    setIsEditing(false);
    setEditingRow(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#0098B3]">Documents</h1>
          <p className="text-gray-600">Process documents and extract metadata</p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sharepoint URL</label>
            <input
              type="text"
              value={documentUrl}
              onChange={e => setDocumentUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0098B3] focus:border-[#0098B3]"
              placeholder="https://graph.microsoft.com/v1.0/sites/slickbitai.sharepoint.com,{site_id}/drive/root:/{document_name}"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0098B3] focus:border-[#0098B3] appearance-none"
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Progress UI - Only shown when processing */}
          <AnimatePresence>
            {progress > 0 && progress < 100 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="text-sm text-gray-700 mb-1">Sending document for processing...{progress.toFixed(1)}%</div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-[#0098B3]"
                  />
                </div>
                <div className="text-xs text-gray-500">Processing time: {Math.floor(elapsedTime / 60)}m {String(elapsedTime % 60).padStart(2, '0')}s</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleProcessDocument}
              disabled={progress > 0 || !documentUrl || !selectedTemplateId}
              className="px-4 py-2 rounded-md bg-[#0098B3] text-white font-medium hover:bg-[#007A92] transition-colors"
            >
              {progress > 0 ? 'Processing...' : 'Process Document'}
            </motion.button>
          </div>
        </motion.div>

        {/* Processed Documents - Only shown after successful processing */}
        <AnimatePresence>
          {processingComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900">Processed Documents</h2>

              <a
                href="https://slickbitai.sharepoint.com/sites/regulatory-docs/Shared%20Documents/Forms/AllItems.aspx"
                target="_blank"
                style={{ color: 'blue', textDecoration: 'underline' }}>
                Click here to view the Excel file
              </a>
              
              {/* <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                {documents.length} documents processed
              </motion.div> */}
              
              <div className="flex justify-end space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 rounded-md bg-[#0098B3] text-white font-medium hover:bg-[#007A92] transition-colors flex items-center"
                >
                  {/* <svg className="h-5 w-5 mr-2" fill="red" stroke="red" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
</svg> */}

                  Download Excel
                </motion.button>
              </div>
              
              {sharepointUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full"
                >
                  <a 
                    href={sharepointUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full block text-center px-4 py-2 rounded-md bg-[#0098B3] text-white font-medium hover:bg-[#007A92] transition-colors"
                  >
                    Download Excel from SharePoint
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Statistics Panel */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Token Usage Statistics</h2>
            <button
              onClick={() => setShowTokenStats(!showTokenStats)}
              className="text-[#0098B3] hover:text-[#007A92] transition-colors"
            >
              {showTokenStats ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {tokenStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Tokens</div>
                  <div className="text-2xl font-semibold text-gray-800">{tokenStats.total_tokens.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Documents Processed</div>
                  <div className="text-2xl font-semibold text-gray-800">{tokenStats.documents_processed}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Documents Exceeding Limit</div>
                  <div className="text-2xl font-semibold text-gray-800">{tokenStats.documents_exceeding_limit}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Current Tokens/Minute</div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {tokenStats.tokens_per_minute.length > 0 
                      ? tokenStats.tokens_per_minute[tokenStats.tokens_per_minute.length - 1].tokens.toLocaleString()
                      : '0'}
                  </div>
                </div>
              </div>
              
              {showTokenStats && tokenStats.tokens_per_minute.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Recent Token Usage</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      {tokenStats.tokens_per_minute.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-sm font-medium text-gray-800">
                            {entry.tokens.toLocaleString()} tokens
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Documents; 