'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, AlertCircle, Eye, CheckCircle, XCircle, 
  Send, Search, Filter, Download, Info, FileText, FileType
} from 'lucide-react';
import Link from 'next/link';
import { getDocumentById, updateRedaction } from '../../../../../app/lib/firebase';
import { getRedactionReport } from '../../../../../app/lib/redactionEngine';
import { useAuth } from '../../../../../app/lib/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

export default function RedactionReport() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id;

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for actual redaction data
  const [report, setReport] = useState(null);
  const [redactedItems, setRedactedItems] = useState([]);
  
  const [selectedRedaction, setSelectedRedaction] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth');
      return;
    }

    if (user && documentId) {
      fetchDocumentDetails();
    }
  }, [user, authLoading, documentId]);

  const fetchDocumentDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const doc = await getDocumentById(documentId);
      
      if (!doc) {
        setError('Document not found');
        setIsLoading(false);
        return;
      }
      
      if (doc.userId !== user.uid) {
        setError('You do not have permission to view this document');
        setIsLoading(false);
        return;
      }
      
      if (doc.status !== 'redacted') {
        setError('This document has not been redacted yet');
        setIsLoading(false);
        return;
      }
      
      setDocument(doc);
      
      // Fetch the actual redaction report
      try {
        const reportData = await getRedactionReport(documentId);
        
        if (reportData) {
          setReport(reportData);
          
          // For redacted items, convert the format if needed
          if (reportData.redactedEntities && reportData.redactedEntities.length > 0) {
            const formattedItems = reportData.redactedEntities.map((entity, index) => {
              // Map to our display format
              return {
                id: entity.id || `entity-${index}`,
                entity: entity.entity || entity.text || '[Unknown]',
                type: entity.type || 'UNKNOWN',
                category: getCategoryFromType(entity.type),
                location: entity.page ? `Page ${entity.page}` : 
                          entity.paragraph ? `Paragraph ${entity.paragraph}` : 'Unknown location',
                confidence: entity.confidence || 0.95,
                confirmed: true,
                redactionMethod: entity.redactionMethod || (entity.confidence ? 'AI' : 'Rule-based')
              };
            });
            
            setRedactedItems(formattedItems);
          } else {
            setRedactedItems([]);
          }
        } else {
          console.warn('No redaction report found');
          setRedactedItems([]);
        }
      } catch (reportError) {
        console.error('Error fetching redaction report:', reportError);
        setError('Failed to load redaction report. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to escape special characters in a string for use in RegExp
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Map entity types to categories
  const getCategoryFromType = (type) => {
    if (!type) return 'Unknown';
    
    type = type.toUpperCase();
    
    if (['PERSON', 'NAME', 'PATIENT_ID', 'SSN', 'DATE', 'DOB'].includes(type)) {
      return 'Personal';
    } else if (['ORGANIZATION', 'BANK', 'CREDIT_CARD', 'ACCOUNT', 'PAYMENT'].includes(type)) {
      return 'Financial';
    } else if (['CONDITION', 'MEDICATION', 'DIAGNOSIS', 'TREATMENT', 'DOCTOR', 'PHI'].includes(type)) {
      return 'Medical';
    } else if (['ADDRESS', 'PHONE', 'EMAIL', 'IP', 'URL'].includes(type)) {
      return 'Contact';
    } else if (['LICENSE', 'REGISTRATION', 'CASE_NUMBER', 'RECORD_ID'].includes(type)) {
      return 'Legal';
    }
    
    return 'Other';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleRedactionSelect = (redaction) => {
    setSelectedRedaction(redaction);
    setFeedbackText('');
  };

  const handleRedactionToggle = (id, newState) => {
    setRedactedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, confirmed: newState } : item
      )
    );
    
    if (selectedRedaction?.id === id) {
      setSelectedRedaction(prev => ({ ...prev, confirmed: newState }));
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRedaction || !feedbackText.trim()) return;
    
    setIsSaving(true);
    
    try {
      // Update the redaction in the database
      await updateRedaction(documentId, selectedRedaction.id, {
        confirmed: selectedRedaction.confirmed,
        feedback: feedbackText
      });
      
      // Update the local state
      setRedactedItems(items => 
        items.map(item => 
          item.id === selectedRedaction.id 
            ? { ...item, feedback: feedbackText } 
            : item
        )
      );
      
      setFeedbackText('');
      setIsSaving(false);
    } catch (err) {
      console.error('Error updating redaction:', err);
      setIsSaving(false);
    }
  };

  const getFileIcon = () => {
    const fileType = document?.fileType || document?.contentType || '';
    const fileName = document?.fileName || document?.filename || '';
    
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else {
      return <FileType className="h-8 w-8 text-gray-500" />;
    }
  };

  const filteredRedactions = redactedItems.filter(item => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      item.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesFilter = activeFilter === 'All' || 
      item.category === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filterOptions = ['All', ...new Set(redactedItems.map(item => item.category).filter(Boolean))];
  
  const getRedactionCount = category => {
    if (category === 'All') return redactedItems.length;
    return redactedItems.filter(item => item.category === category).length;
  };

  if (authLoading || (!user && authLoading)) {
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
    <div className="max-w-full mx-auto px-4 py-10">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6 mx-4"
      >
        <Link href={`/documents/${documentId}`} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Document
        </Link>
      </motion.div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
        </div>
      ) : error ? (
        <motion.div
          initial={fadeIn.hidden}
          animate={fadeIn.visible}
          className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200 mx-4"
        >
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">{error}</p>
          <Link
            href={`/documents/${documentId}`}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700"
          >
            Return to Document
          </Link>
        </motion.div>
      ) : document ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 mx-4"
        >
          {/* Report Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="p-3 rounded-lg bg-chateau-green-100">
                  <Eye className="h-6 w-6 text-chateau-green-700" />
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    Redaction Report: {document.fileName || 'Document'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {redactedItems.length} items redacted • {formatDate(report?.timestamp || document.lastUpdated)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {document.redactedUrl && (
                  <a
                    href={document.redactedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    download={`${document.fileName?.replace(/\.[^/.]+$/, '')}_redacted.${document.fileType || 'pdf'}`}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Redacted
                  </a>
                )}
                {document.downloadUrl && (
                  <a
                    href={document.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    download={document.fileName}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Original
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content - Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Original Document Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  Original Document
                  {document.downloadUrl && (
                    <a
                      href={document.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Download className="h-3 w-3 inline" />
                    </a>
                  )}
                </h2>
              </div>
              <div className="p-0 flex-grow overflow-hidden" style={{ height: '70vh' }}>
                {document.downloadUrl ? (
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.downloadUrl)}&embedded=true`}
                    className="w-full h-full border-0"
                    title="Original Document Preview"
                  ></iframe>
                ) : (
                  <div className="text-center p-6 h-full flex flex-col justify-center items-center">
                    <div className="p-3 rounded-lg bg-gray-100">
                      {getFileIcon()}
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Preview Not Available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Original document URL is missing.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Redacted Document Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  Redacted Document
                  {document.redactedUrl && (
                    <a
                      href={document.redactedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Download className="h-3 w-3 inline" />
                    </a>
                  )}
                </h2>
              </div>
              <div className="p-0 flex-grow overflow-hidden" style={{ height: '70vh' }}>
                {document.redactedUrl ? (
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.redactedUrl)}&embedded=true`}
                    className="w-full h-full border-0"
                    title="Redacted Document Preview"
                  ></iframe>
                ) : (
                  <div className="text-center p-6 h-full flex flex-col justify-center items-center">
                    <div className="p-3 rounded-lg bg-gray-100">
                      {getFileIcon()}
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Preview Not Available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Redacted document URL is missing.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Redacted Content Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Redacted Content ({redactedItems.length})</h2>
              </div>
              
              {/* Filter and Search */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search redacted content..."
                      className="pl-10 py-2 pr-4 block w-full rounded-md border border-gray-300 text-sm focus:ring-chateau-green-500 focus:border-chateau-green-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={activeFilter}
                      onChange={e => setActiveFilter(e.target.value)}
                      className="pl-10 py-2 pr-8 block w-full rounded-md border border-gray-300 text-sm focus:ring-chateau-green-500 focus:border-chateau-green-500"
                    >
                      {filterOptions.map(option => (
                        <option key={option} value={option}>
                          {option} ({getRedactionCount(option)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Category Tabs */}
              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
                <div className="flex space-x-2">
                  {filterOptions.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveFilter(category)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        activeFilter === category
                          ? 'bg-chateau-green-100 text-chateau-green-800 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category} ({getRedactionCount(category)})
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Redacted Items List */}
              <div className="flex-grow overflow-auto" style={{ maxHeight: '30vh' }}>
                {filteredRedactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {redactedItems.length === 0 
                      ? "No redaction data available" 
                      : "No redacted items match your filter criteria"}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredRedactions.map(item => (
                      <div 
                        key={item.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedRedaction?.id === item.id 
                            ? 'bg-chateau-green-50 border-l-4 border-chateau-green-500' 
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                        onClick={() => handleRedactionSelect(item)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900 mr-2">
                                {item.entity}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                item.category === 'Personal' ? 'bg-blue-100 text-blue-800' :
                                item.category === 'Financial' ? 'bg-green-100 text-green-800' :
                                item.category === 'Medical' ? 'bg-purple-100 text-purple-800' :
                                item.category === 'Contact' ? 'bg-orange-100 text-orange-800' :
                                item.category === 'Legal' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                              <span>{item.location}</span>
                              <span title={`Confidence: ${(item.confidence * 100).toFixed(0)}%`} className={`px-1.5 py-0.5 rounded-full ${
                                item.redactionMethod === 'AI' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                              }`}>
                                {item.redactionMethod || 'Rule'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedactionToggle(item.id, true);
                              }}
                              className={`p-1 rounded-md mr-1 ${
                                item.confirmed 
                                  ? 'text-chateau-green-600 bg-chateau-green-50'
                                  : 'text-gray-400 hover:text-chateau-green-600 hover:bg-chateau-green-50'
                              }`}
                              title="Approve redaction"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedactionToggle(item.id, false);
                              }}
                              className={`p-1 rounded-md ${
                                !item.confirmed 
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Flag as incorrect"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className={`mt-1 text-xs ${
                          item.confirmed 
                            ? 'text-chateau-green-600'
                            : 'text-red-600'
                        }`}>
                          {item.confirmed ? 'Approved' : 'Flagged'}
                          {item.feedback && <span className="ml-1">- {item.feedback}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected Redaction Details */}
              {selectedRedaction && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center mb-2">
                    <Info className="h-5 w-5 text-chateau-green-600 mr-2" />
                    <h3 className="text-sm font-medium text-gray-900">Selected Redaction</h3>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-gray-200 mb-3">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedRedaction.entity}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Text: <span className="text-gray-700">{selectedRedaction.entity}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Reason: <span className="text-gray-700">
                            {selectedRedaction.type.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Method: <span className="text-gray-700">
                            {selectedRedaction.redactionMethod || 'Rule-based'}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center ${
                        selectedRedaction.confirmed 
                          ? 'text-chateau-green-600' 
                          : 'text-red-600'
                      }`}>
                        {selectedRedaction.confirmed 
                          ? <CheckCircle className="h-5 w-5 mr-1" /> 
                          : <XCircle className="h-5 w-5 mr-1" />
                        }
                        <span className="text-xs font-medium">
                          {selectedRedaction.confirmed ? 'Approved' : 'Flagged for review'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <textarea 
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder={`Provide feedback for "${selectedRedaction.entity}"...`}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-chateau-green-500 focus:border-chateau-green-500"
                      rows={2}
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {feedbackText.length} characters
                      </div>
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={!feedbackText.trim() || isSaving}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-1.5 border-2 border-white border-t-transparent rounded-full" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1.5" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
} 