'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, FileText, Shield, Search } from 'lucide-react';
import Link from 'next/link';
import { getDocumentById } from '../../../../lib/firebase';
import { useAuth } from '../../../../lib/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Sample redaction data (in a real app, this would come from a database)
const sampleRedactions = [
  { id: 1, type: 'PII', content: '***********', position: 'Page 1, Paragraph 2', confidence: 0.98 },
  { id: 2, type: 'Address', content: '*** **** *****, ** *****', position: 'Page 1, Paragraph 3', confidence: 0.95 },
  { id: 3, type: 'Phone Number', content: '(***) ***-****', position: 'Page 2, Paragraph 1', confidence: 0.99 },
  { id: 4, type: 'Email', content: '********@*****.com', position: 'Page 2, Paragraph 4', confidence: 0.97 },
  { id: 5, type: 'SSN', content: '***-**-****', position: 'Page 3, Paragraph 2', confidence: 0.99 },
  { id: 6, type: 'Date of Birth', content: '**/**/****', position: 'Page 3, Paragraph 3', confidence: 0.96 },
  { id: 7, type: 'Name', content: '***** *****', position: 'Page 4, Paragraph 1', confidence: 0.94 },
  { id: 8, type: 'Bank Account', content: '********', position: 'Page 5, Paragraph 2', confidence: 0.97 }
];

export default function RedactionReport() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id;

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [redactions, setRedactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth');
      return;
    }

    if (user && documentId) {
      fetchDocumentDetails();
      // In a real app, you would fetch real redaction data here
      setRedactions(sampleRedactions);
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
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const filteredRedactions = searchQuery
    ? redactions.filter(
        (redaction) => 
          redaction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          redaction.position.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : redactions;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
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
          className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200"
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
          className="space-y-6"
        >
          {/* Report Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Shield className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Redaction Report
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {document.fileName || document.filename || 'Unnamed Document'} • Processed on {formatDate(document.lastModified || document.createdAt)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Report Content */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Redaction Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold text-gray-900">{redactions.length}</span>
                  <p className="text-sm text-gray-500 mt-1">Total Redactions</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {redactions.filter(r => r.confidence > 0.95).length}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">High Confidence</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Object.keys(redactions.reduce((acc, r) => {
                      acc[r.type] = true;
                      return acc;
                    }, {})).length}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">Types of Redactions</p>
                </div>
              </div>
            </div>
            
            {/* Redaction List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Detailed Redactions</h2>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search redactions..."
                    className="pl-10 py-2 pr-4 block w-full rounded-md border border-gray-300 text-sm focus:ring-chateau-green-500 focus:border-chateau-green-500"
                  />
                </div>
              </div>
              
              {filteredRedactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Redacted Content
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRedactions.map((redaction) => (
                        <tr key={redaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {redaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {redaction.content}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {redaction.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className={`inline-block h-2 w-16 rounded-full ${
                                  redaction.confidence > 0.95
                                    ? 'bg-green-500'
                                    : redaction.confidence > 0.85
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                              ></span>
                              <span className="ml-2 text-sm text-gray-500">
                                {Math.round(redaction.confidence * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No redactions match your search criteria. Try a different search term.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
} 