'use client';

import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PDFProcessor } from '@/utils/pdf-processor';
import { redactionTemplates, RedactionTemplate } from '@/config/redactionTemplates';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addDocument } from '@/store/slices/documentSlice';

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
  
  const dispatch = useDispatch();
  
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
      const result = await PDFProcessor.processPDF(fileUint8Array, selectedTemplate);
      console.log("PDF processing complete, got result of size:", result.redactedPdf.length, "bytes");
      
      // Verify the data is valid
      if (!result.redactedPdf || result.redactedPdf.length === 0) {
        throw new Error("Processed PDF is empty");
      }
      
      // Update Redux store with the processed document
      if (file) {
        dispatch(addDocument({
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          type: 'pdf',
          path: URL.createObjectURL(file),
          size: file.size,
          uploadedAt: new Date().toISOString(),
          status: 'redacted',
          source: 'local',
          entitiesFound: result.entities.length,
        }));
        
        // Set the processed PDF bytes
        setRedactedPdfBytes(result.redactedPdf);
        
        // Show the preview automatically
        setShowPreview(true);
      }
      
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      alert(`Error processing PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownload = () => {
    if (redactedPdfBytes) {
      try {
        PDFProcessor.downloadRedactedPDF(redactedPdfBytes, `redacted-${file?.name || 'document.pdf'}`);
      } catch (error) {
        console.error("Error downloading PDF:", error);
      }
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
  
  const downloadRedactedPDF = () => {
    if (redactedPdfBytes) {
      PDFProcessor.downloadRedactedPDF(
        redactedPdfBytes, 
        `redacted-${file?.name || 'document.pdf'}`
      );
    }
  };
  
  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Redact Document</h1>
          <p className="text-gray-600 mt-1">Upload a PDF document to redact sensitive information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column (upload & actions) */}
          <div className="md:col-span-1 space-y-6">
            {/* Upload Panel */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-900">Upload Document</h2>
              </div>
              
              <div className="p-5">
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 mb-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragOver 
                      ? 'border-primary-400 bg-primary-50' 
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  
                  {file ? (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-primary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                      Redaction Template
                    </label>
                    <select
                      id="template"
                      value={selectedTemplate.id}
                      onChange={handleTemplateChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-primary-500 focus:border-primary-500"
                    >
                      {redactionTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleProcessPDF}
                    disabled={!file || isProcessing}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                      !file || isProcessing
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>Process Document</>
                    )}
                  </button>
                  
                  {redactedPdfBytes && (
                    <button
                      onClick={handleDownload}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                        redactedPdfBytes && !isProcessing
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Redacted PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Template Info Panel (if applicable) */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Template Details</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                </div>
                
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">Redacts the following:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.categories.map((category, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {category.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Processing Status (if processing) */}
            {isProcessing && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Processing Status</h2>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{formatStageName(processingStage)}</span>
                      <span className="text-sm font-medium text-gray-700">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-2.5 rounded-full bg-primary-600 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {processingStage === 'detecting' && processingStats.page && processingStats.totalPages && (
                    <div className="text-sm text-gray-600">
                      Scanning page {processingStats.page} of {processingStats.totalPages}
                    </div>
                  )}
                  
                  {processingStage === 'redacting' && processingStats.entitiesFound && (
                    <div className="text-sm text-gray-600">
                      Redacting {processingStats.entitiesFound} sensitive items
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Redacted Document Status (if available) */}
            {redactedPdfBytes && !isProcessing && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <div className="flex items-center mb-4">
                  <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-lg font-medium text-gray-900">Redaction Complete</h2>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">The document has been successfully redacted. You can now download the redacted document or view it in the preview panel.</p>
                  </div>
                  
                  {processingStats.entitiesFound && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Sensitive items redacted:</span>
                      <span className="font-medium text-gray-800">{processingStats.entitiesFound}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={togglePreview}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                    >
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        {showPreview 
                          ? <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          : <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        }
                      </svg>
                    </button>
                    
                    <Link href="/documents" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                      View All Documents
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column (preview) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Document Preview</h2>
                {redactedPdfUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadRedactedPDF}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {!file && !redactedPdfBytes && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Document Selected</h3>
                    <p className="text-gray-500 max-w-md">Upload a PDF document to see the preview here. You will be able to view both the original and redacted versions.</p>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
                    <svg className="animate-spin h-10 w-10 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Processing Document</h3>
                      <p className="text-gray-600">{formatStageName(processingStage)}</p>
                    </div>
                    <div className="w-2/3 max-w-md bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full bg-primary-600 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {showPreview && redactedPdfUrl && (
                  <>
                    {/* Main iframe preview */}
                    <iframe
                      ref={previewIframeRef}
                      src={redactedPdfUrl}
                      className="w-full h-full"
                      onError={handlePreviewError}
                      title="Redacted PDF Preview"
                    ></iframe>
                    
                    {/* Fallback object tag */}
                    <object
                      ref={objectPreviewRef}
                      data=""
                      type="application/pdf"
                      className="w-full h-full absolute top-0 left-0 opacity-0"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Preview Not Available</h3>
                        <p className="text-gray-500 max-w-md">Your browser couldn't display the PDF preview. Please download the file to view it.</p>
                        <button
                          onClick={downloadRedactedPDF}
                          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                          Download PDF
                        </button>
                      </div>
                    </object>
                  </>
                )}
                
                {file && !showPreview && !isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to Process</h3>
                    <p className="text-gray-500 max-w-md">Click the "Process Document" button to start redacting sensitive information from your document.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 