'use client';

import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PDFProcessor } from '@/utils/pdf-processor';
import { redactionTemplates, RedactionTemplate } from '@/config/redactionTemplates';

export default function RedactPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(redactionTemplates[0]);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [processingStats, setProcessingStats] = useState<{
    page?: number;
    totalPages?: number;
    entitiesFound?: number;
  }>({});
  const [redactedPdfBytes, setRedactedPdfBytes] = useState<Uint8Array | null>(null);
  const [redactedPdfUrl, setRedactedPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const objectPreviewRef = useRef<HTMLObjectElement>(null);
  
  // Create object URL when redacted PDF is available
  useEffect(() => {
    if (redactedPdfBytes) {
      try {
        console.log("Creating blob URL from redacted PDF bytes, size:", redactedPdfBytes.length);
        const blob = new Blob([redactedPdfBytes], { type: 'application/pdf' });
        console.log("Created blob:", blob.size, "bytes");
        
        const url = URL.createObjectURL(blob);
        console.log("PDF URL created successfully:", url);
        setRedactedPdfUrl(url);
        
        // Clean up URL on component unmount
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error("Error creating PDF blob URL:", error);
        alert("Error creating PDF preview. Please try downloading the PDF instead.");
      }
    }
  }, [redactedPdfBytes]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        // Reset any previous redaction results
        setRedactedPdfBytes(null);
        setRedactedPdfUrl(null);
        setShowPreview(false);
      } else {
        alert('Please select a PDF file');
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        // Reset any previous redaction results
        setRedactedPdfBytes(null);
        setRedactedPdfUrl(null);
        setShowPreview(false);
      } else {
        alert('Please drop a PDF file');
      }
    }
  };
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const template = redactionTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };
  
  const handleProcessPDF = async () => {
    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStage('');
      setProgress(0);
      setRedactedPdfBytes(null);
      setRedactedPdfUrl(null);
      setShowPreview(false);
      
      // Setup progress callback
      PDFProcessor.setProgressCallback((progress) => {
        console.log(`Processing progress: ${progress.stage} - ${progress.progress}%`);
        setProcessingStage(progress.stage);
        setProgress(progress.progress);
        
        // Update additional stats if available
        if (progress.page !== undefined) {
          setProcessingStats(prev => ({ ...prev, page: progress.page, totalPages: progress.totalPages }));
        }
        if (progress.entitiesFound !== undefined) {
          setProcessingStats(prev => ({ ...prev, entitiesFound: progress.entitiesFound }));
        }
      });

      // Read the PDF file as ArrayBuffer
      console.log("Reading PDF file:", file.name, file.size, "bytes");
      const fileArrayBuffer = await file.arrayBuffer();
      const fileUint8Array = new Uint8Array(fileArrayBuffer);
      
      // Process the PDF
      console.log("Starting PDF processing with template:", selectedTemplate.name);
      const redactedPdfData = await PDFProcessor.processPDF(fileUint8Array, selectedTemplate);
      console.log("PDF processing complete, got result of size:", redactedPdfData.length, "bytes");
      
      // Verify the data is valid
      if (!redactedPdfData || redactedPdfData.length === 0) {
        throw new Error("Processed PDF is empty");
      }
      
      // Set the redacted PDF bytes
      setRedactedPdfBytes(redactedPdfData);
      
      // Show the preview automatically
      setShowPreview(true);
      
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      alert(`Error processing PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownload = () => {
    if (redactedPdfBytes && file) {
      const filename = `redacted-${file.name}`;
      PDFProcessor.downloadRedactedPDF(redactedPdfBytes, filename);
    }
  };
  
  const handlePreviewError = () => {
    console.log("Preview iframe error, trying alternative display method");
    if (objectPreviewRef.current && redactedPdfUrl) {
      // Try to use the object tag as fallback
      objectPreviewRef.current.data = redactedPdfUrl;
    }
  };
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
    
    // If opening preview and either preview ref exists, reload it to ensure content is fresh
    if (!showPreview && redactedPdfUrl) {
      setTimeout(() => {
        if (previewIframeRef.current) {
          console.log("Reloading iframe preview");
          previewIframeRef.current.src = redactedPdfUrl;
        }
        if (objectPreviewRef.current) {
          console.log("Updating object preview");
          objectPreviewRef.current.data = redactedPdfUrl;
        }
      }, 200);
    }
  };
  
  const formatStageName = (stage: string) => {
    switch (stage) {
      case 'extracting':
        return 'Extracting Text';
      case 'detecting':
        return 'Detecting Sensitive Information';
      case 'mapping':
        return 'Mapping Coordinates';
      case 'redacting':
        return 'Applying Redactions';
      case 'complete':
        return 'Complete';
      default:
        return 'Processing';
    }
  };

  // Add a function to download the redacted PDF
  const downloadRedactedPDF = () => {
    if (!redactedPdfBytes) {
      alert('No redacted PDF available to download');
      return;
    }
    
    try {
      console.log("Downloading redacted PDF...");
      PDFProcessor.downloadRedactedPDF(
        redactedPdfBytes, 
        `redacted-${file?.name || 'document.pdf'}`
      );
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      alert(`Failed to download: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">AI-Powered Document Redaction</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">1. Upload Document</h2>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : file 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div>
                  <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    className="mt-4 text-sm text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setRedactedPdfBytes(null);
                      setRedactedPdfUrl(null);
                      setShowPreview(false);
                    }}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">Drag & drop your PDF here</p>
                  <p className="text-sm text-gray-500 mt-1">Or click to browse</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Select Redaction Template</h2>
            
            <div className="mb-4">
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                Redaction Template
              </label>
              <select
                id="template"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedTemplate.id}
                onChange={handleTemplateChange}
              >
                {redactionTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-600">{selectedTemplate.description}</p>
            </div>
            
            <div className="mt-4 bg-gray-100 rounded-lg p-4">
              <h3 className="text-md font-medium mb-2">Template Rules:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Content to Redact:</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    {selectedTemplate.categories.map(category => (
                      <li key={category.type} className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {category.type}
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedTemplate.categories.some(cat => cat.contexts && cat.contexts.length > 0) && (
                  <div>
                    <h4 className="text-sm font-medium">Included Contexts:</h4>
                    <ul className="mt-1 text-sm text-gray-600 space-y-1">
                      {Array.from(new Set(
                        selectedTemplate.categories
                          .flatMap(cat => cat.contexts || [])
                      )).map((context: string) => (
                        <li key={context} className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {context}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">3. Process Document</h2>
            
            <button
              className={`w-full py-3 px-4 rounded-md text-white font-medium 
                ${file && !isProcessing && !redactedPdfBytes ? 'bg-blue-600 hover:bg-blue-700' : 
                  isProcessing ? 'bg-blue-400 cursor-not-allowed' : 
                  redactedPdfBytes ? 'bg-green-600 hover:bg-green-700' : 
                  'bg-gray-400 cursor-not-allowed'}`}
              disabled={!file || isProcessing || !!redactedPdfBytes}
              onClick={handleProcessPDF}
            >
              {isProcessing 
                ? 'Processing...' 
                : redactedPdfBytes 
                  ? 'Processing Complete' 
                  : 'Process Document'}
            </button>
            
            {isProcessing && (
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">
                    {formatStageName(processingStage)} ({progress}%)
                  </p>
                  {processingStage === 'detecting' && processingStats.page && processingStats.totalPages && (
                    <p className="text-sm text-gray-500">
                      Page {processingStats.page} of {processingStats.totalPages}
                    </p>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {processingStage === 'redacting' && processingStats.entitiesFound && (
                  <p className="mt-2 text-sm text-gray-600">
                    Redacting {processingStats.entitiesFound} sensitive items
                  </p>
                )}
              </div>
            )}
          </div>
          
          {redactedPdfBytes && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">4. Redacted Document</h2>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Redaction Complete</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your document has been successfully redacted. All sensitive information has been obscured.
                    </p>
                    {processingStats.entitiesFound && (
                      <p className="text-sm text-green-700 mt-1">
                        <strong>{processingStats.entitiesFound}</strong> sensitive items were redacted from this document.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadRedactedPDF}
                  disabled={!redactedPdfBytes || isProcessing}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                    redactedPdfBytes && !isProcessing
                      ? 'bg-chateau-green-600 text-white hover:bg-chateau-green-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Redacted PDF
                </button>
                
                <button
                  className="flex-1 py-3 px-4 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md font-medium flex items-center justify-center"
                  onClick={togglePreview}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {showPreview ? 'Hide Preview' : 'View Redacted PDF'}
                </button>
              </div>
              
              {/* PDF Preview Section */}
              {showPreview && redactedPdfUrl && (
                <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Redacted Document Preview</h3>
                    <div className="flex items-center">
                      <button 
                        onClick={() => {
                          if (previewIframeRef.current) {
                            console.log("Manual reload of iframe");
                            previewIframeRef.current.src = redactedPdfUrl;
                          }
                          if (objectPreviewRef.current) {
                            console.log("Manual reload of object preview");
                            objectPreviewRef.current.data = redactedPdfUrl;
                          }
                        }}
                        className="mr-3 text-gray-500 hover:text-gray-700"
                        title="Reload preview"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Close preview"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* PDF preview with both iframe and object tag for compatibility */}
                  <div className="relative">
                    {/* Method 1: iframe (hidden on some browsers) */}
                    <iframe
                      ref={previewIframeRef}
                      src={redactedPdfUrl}
                      className="w-full h-[600px]"
                      title="Redacted PDF Preview"
                      sandbox="allow-scripts allow-same-origin"
                      onLoad={() => console.log("PDF iframe loaded")}
                      onError={() => handlePreviewError()}
                    />
                    
                    {/* Method 2: object tag (works in most browsers) */}
                    <object
                      ref={objectPreviewRef}
                      data={redactedPdfUrl}
                      type="application/pdf"
                      className="w-full h-[600px] absolute top-0 left-0 z-10"
                      aria-label="PDF Document"
                    >
                      {/* Method 3: Fallback message with download button */}
                      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100">
                        <div className="text-center p-8">
                          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-700 mb-2">PDF Preview Unavailable</p>
                          <p className="text-sm text-gray-600 mb-4 max-w-md">Your browser doesn't support inline PDF preview. Please download the file to view it.</p>
                          <button
                            onClick={downloadRedactedPDF}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </object>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <h3 className="text-md font-medium text-indigo-800 mb-2">Privacy Note</h3>
            <p className="text-sm text-indigo-700">
              All processing is performed locally in your browser. Your document is not uploaded to any server,
              except for the text analysis which is processed securely by Google Gemini AI.
              The original document and the redacted version never leave your device.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 