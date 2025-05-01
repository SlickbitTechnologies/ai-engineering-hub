import React, { useState, useEffect } from 'react';
import { useTemplates } from '../context/TemplateContext';
import '../styles/global.css';

const url = 'http://localhost:8000';

function Documents() {
  const { templates } = useTemplates();
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [excelPath, setExcelPath] = useState(localStorage.getItem('lastExcelPath') || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [progress, setProgress] = useState(0);

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

  const handleCancelProcessing = () => {
    if (window.confirm('Are you sure you want to cancel processing?')) {
      setIsProcessing(false);
      setProgress(0);
      setError('Processing cancelled by user');
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedTemplateId || !documentUrl) {
      alert('Please select a template and enter a document URL');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await fetch(`${url}/process-document?document_url=${encodeURIComponent(documentUrl)}&template_id=${encodeURIComponent(selectedTemplateId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Failed to process document';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      setProgress(95);

      const data = await response.json();
      
      if (!data || typeof data !== 'object' || !data.metadata) {
        throw new Error('Invalid response format from server');
      }

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

      setProgress(98);

      // Generate/update Excel file
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
        }
      } catch (excelError) {
        console.error('Error generating Excel:', excelError);
      }

      setProgress(100);

    } catch (error) {
      console.error('Error processing document:', error);
      setError(error.message || 'Failed to process document');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadExcel = () => {
    if (excelPath && selectedTemplateId) {
      window.open(`${url}/download-excel?template_id=${encodeURIComponent(selectedTemplateId)}`, '_blank');
    }
  };
  <a
  href={`${url}/download-excel?template_id=${encodeURIComponent(selectedTemplateId)}`}
  target="_blank"
  rel="noopener noreferrer"
>
  Download Excel
</a>


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

  return (
    <div className="page-container">
      <div className="bg-pattern">
        <div className="bg-pattern-inner"></div>
      </div>

      <div className="content-container">
        <div className="mb-4">
          <h1 className="page-title">Documents</h1>
          <p className="page-description">Process documents and extract metadata</p>
        </div>

        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Sharepoint URL
              </label>
              <input
                type="text"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="form-input"
                placeholder="Enter The sharepoint document URL"
              />
            </div>

            <div>
              <label className="form-label">
                Select Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                className="form-input"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
             

            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <a href="sharepoint_url"></a>
              <button
                onClick={handleProcessDocument}
                disabled={isProcessing || !documentUrl || !selectedTemplateId}
                className="button-primary"
              >
                {isProcessing ? 'Processing...' : 'Process Document'}
              </button>
            </div>

            {isProcessing && (
              <div className="mt-2 text-sm text-blue-600">
                This document processing may take some time. Please wait or come back later.
              </div>
            )}
           
          </div>
          {/* <div><a  target="_blank"   href="https://slickbitai.sharepoint.com/sites/regulatory-docs/Shared%20Documents/Forms/AllItems.aspx">click here to view the excel file</a></div> */}
        </div>

        {documents.length > 0 && (
          <div className="mt-8">
            <h2 className="section-title mb-4">Processed Documents</h2>
            <a
              href="https://slickbitai.sharepoint.com/sites/regulatory-docs/Shared%20Documents/Forms/AllItems.aspx"
              target="_blank"
              style={{ color: 'blue', textDecoration: 'underline' }}>
              Click here to view the Excel file
            </a>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900"> documents processed </h3>
                      <p className="text-xs text-gray-500">Processed on: {new Date(doc.timestamp).toLocaleString()}</p>
                    </div>
                    {/* <button
                      onClick={() => handleDeleteRow(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button> */}
                  </div>
                  {/* Document metadata display */}
                </div>
              ))}
            </div>
            
            {/* Add Download Excel Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDownloadExcel}
                className="button-primary"
                disabled={!excelPath}
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Download Excel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents; 