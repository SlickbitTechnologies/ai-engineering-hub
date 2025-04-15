import React from 'react';
import { useDocuments } from '../../contexts/DocumentContext';
import { AnalyzedDocument } from '../../services/documentService';
import { FileText, Trash2, AlertCircle, BarChart } from 'lucide-react';
import Icon from '../ui/Icon';
import { theme } from '../../styles/theme';

export default function DocumentHistory() {
  const { documents, isLoading, error, removeDocument } = useDocuments();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document analysis?')) {
      await removeDocument(documentId);
    }
  };

  const handleViewAnalysis = (docId: string) => {
    // In a real implementation, this would navigate to a detailed view
    alert(`Viewing detailed analysis for document ${docId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: theme.colors.primary[500] }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center gap-2 p-4 rounded-md"
        style={{ backgroundColor: theme.colors.neutral[100], color: theme.colors.error }}
      >
        <Icon icon={AlertCircle} variant="error" size="sm" />
        <span>Error loading documents: {error}</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div 
        className="text-center p-8 rounded-lg"
        style={{ backgroundColor: theme.colors.neutral[50], color: theme.colors.neutral[500] }}
      >
        <Icon icon={FileText} variant="neutral" size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.neutral[700] }}>No Documents Found</h3>
        <p>You haven't analyzed any documents in the past month. Upload a privacy policy to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.neutral[800] }}>
        Analysis History
      </h2>
      <p className="mb-6" style={{ color: theme.colors.neutral[600] }}>
        Showing your analyzed documents from the past month.
      </p>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: theme.colors.neutral[200] }}>
            <thead style={{ backgroundColor: theme.colors.neutral[50] }}>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                  style={{ color: theme.colors.neutral[500] }}
                >
                  Document Name
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                  style={{ color: theme.colors.neutral[500] }}
                >
                  Date Analyzed
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                  style={{ color: theme.colors.neutral[500] }}
                >
                  Size
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                  style={{ color: theme.colors.neutral[500] }}
                >
                  Compliance Score
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium tracking-wider"
                  style={{ color: theme.colors.neutral[500] }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: theme.colors.neutral[200] }}>
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icon icon={FileText} variant="primary" size="sm" className="mr-2" />
                      <span className="text-sm font-medium" style={{ color: theme.colors.neutral[800] }}>{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm" style={{ color: theme.colors.neutral[600] }}>
                      {formatDate(doc.uploadDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm" style={{ color: theme.colors.neutral[600] }}>
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-1" style={{ backgroundColor: theme.colors.neutral[200] }}>
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.round(doc.analysisResults.overallScore)}%`,
                          backgroundColor: getScoreColor(doc.analysisResults.overallScore)
                        }}
                      ></div>
                    </div>
                    <span className="text-xs" style={{ color: theme.colors.neutral[600] }}>
                      {Math.round(doc.analysisResults.overallScore)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => doc.id && handleViewAnalysis(doc.id)}
                        className="p-2 rounded-md hover:bg-neutral-100"
                        style={{ color: theme.colors.primary[500] }}
                        title="View analysis"
                      >
                        <Icon icon={BarChart} variant="primary" size="sm" />
                      </button>
                      <button
                        onClick={() => doc.id && handleDelete(doc.id)}
                        className="p-2 rounded-md hover:bg-neutral-100"
                        style={{ color: theme.colors.error }}
                        title="Delete analysis"
                      >
                        <Icon icon={Trash2} variant="error" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const getScoreColor = (score: number) => {
  if (score >= 80) return theme.colors.success;
  if (score >= 60) return theme.colors.warning;
  return theme.colors.error;
}; 