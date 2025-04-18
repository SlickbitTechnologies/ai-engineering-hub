'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { File, Download, ArrowLeft, FileText, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../../lib/AuthContext';
import { getDocument } from '../../../../lib/firebase';

export default function DocumentReport({ params }) {
  const documentId = params.id;
  const { user, isAuthenticated, loading } = useAuth();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Mock templates - in a real app, these would be fetched from Firestore
  const templates = [
    { id: 'template1', name: 'HIPAA Compliance', description: 'Redacts PHI including names, addresses, emails, and medical record numbers' },
    { id: 'template2', name: 'GDPR Standard', description: 'Redacts personal identifiable information as per GDPR guidelines' },
    { id: 'template3', name: 'Internal Communications', description: 'Redacts employee IDs, internal codes and proprietary information' },
  ];

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    async function fetchDocument() {
      if (!documentId || !user) return;
      
      try {
        const doc = await getDocument('documents', documentId);
        
        if (!doc) {
          setError('Document not found');
          return;
        }
        
        if (doc.userId !== user.uid) {
          setError('You do not have permission to view this document');
          return;
        }
        
        if (doc.status !== 'redacted') {
          // Redirect to document page if not redacted
          router.push(`/documents/${documentId}`);
          return;
        }
        
        setDocument(doc);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document report');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchDocument();
    }
  }, [documentId, user, router]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Custom Template';
  };

  const getTotalRedactions = () => {
    if (!document?.redactedItems) return 0;
    return document.redactedItems.reduce((sum, item) => sum + item.count, 0);
  };

  const getConfidenceLevel = () => {
    const total = getTotalRedactions();
    if (total > 20) return 'High';
    if (total > 10) return 'Medium';
    return 'Moderate';
  };

  const getConfidenceColor = () => {
    const level = getConfidenceLevel();
    if (level === 'High') return 'text-green-600';
    if (level === 'Medium') return 'text-yellow-600';
    return 'text-orange-500';
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <Link href="/documents" className="font-medium underline hover:text-red-600">
                    Return to documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with navigation */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <Link href={`/documents/${documentId}`} className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                Redaction Report
              </h1>
            </div>
            <p className="mt-1 text-gray-500">
              {document?.filename}
            </p>
          </div>
          <div className="mt-5 flex md:mt-0 md:ml-4">
            <button className="btn-secondary mr-2 inline-flex items-center">
              <Download className="mr-1 h-5 w-5" />
              Download Report
            </button>
            <button className="btn-primary inline-flex items-center">
              <FileText className="mr-1 h-5 w-5" />
              Download Redacted Document
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Redactions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-chateau-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Redactions
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {getTotalRedactions()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Template Used */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-chateau-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Template Used
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {getTemplateName(document?.templateId)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Processed Date */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <File className="h-6 w-6 text-chateau-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Processed Date
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {formatDate(document?.redactedAt)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-chateau-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Confidence Level
                    </dt>
                    <dd>
                      <div className={`text-lg font-medium ${getConfidenceColor()}`}>
                        {getConfidenceLevel()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redacted Content Summary */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Redaction Summary
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Breakdown of redacted elements by type
            </p>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {document?.redactedItems?.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {Math.round((item.count / getTotalRedactions()) * 100)}%
                    </td>
                  </tr>
                ))}
                {!document?.redactedItems?.length && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No redacted items found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <th scope="row" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <td className="px-6 py-3 text-right text-xs font-medium text-gray-900">
                    {getTotalRedactions()}
                  </td>
                  <td className="px-6 py-3 text-right text-xs font-medium text-gray-900">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Document Information */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Document Information
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Filename</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{document?.filename}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {document?.type === 'application/pdf' ? 'PDF Document' : 'DOCX Document'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Size</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {document?.size ? `${Math.round(document.size / 1024)} KB` : 'Unknown'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(document?.createdAt)}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Processed Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(document?.redactedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Compliance Notes */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Compliance Notes
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="prose prose-sm max-w-none text-gray-500">
              <p>
                This document has been redacted according to the {getTemplateName(document?.templateId)} template. 
                The redaction process identified and removed {getTotalRedactions()} instances of sensitive information.
              </p>
              
              <p className="mt-4">
                <span className="font-medium text-gray-700">Compliance Statement:</span> This document has been processed 
                using automated redaction technology. While our system strives for maximum accuracy, we recommend a manual 
                review for highly sensitive documents to ensure all confidential information has been properly redacted.
              </p>
              
              <div className="mt-4 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Compliance Notice</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        The redacted document is intended for the specific use case defined in the template settings.
                        Different compliance regimes may have different requirements for redaction. Always consult with your
                        compliance officer before distributing redacted documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 