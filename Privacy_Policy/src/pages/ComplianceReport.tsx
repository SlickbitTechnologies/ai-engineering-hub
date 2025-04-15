import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { AlertTriangle, Download, FileText, Search, Star, Trash2, BarChart, AlertCircle, FileDown } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { usePolicy } from '../contexts/PolicyContext';
import { useDocuments } from '../contexts/DocumentContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { theme } from '../styles/theme';
import Icon from '../components/ui/Icon';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ComplianceReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { documents: policyDocuments, toggleStar, isLoading: policyLoading, error: policyError, refreshPolicies } = usePolicy();
  const { documents, isLoading, error, removeDocument, refreshDocuments } = useDocuments();
  const navigate = useNavigate();

  // Add effect to refresh data when component mounts
  useEffect(() => {
    refreshPolicies();
    refreshDocuments();
  }, []);

  const filteredPolicyDocuments = policyDocuments 
    ? policyDocuments.filter(doc => 
        doc.name && doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-green-100 text-green-800';
      case 'Needs Attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'High Risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (document: typeof policyDocuments[0]) => {
    if (!document.analysisResult) return;

    const data = {
      'Document Name': document.name,
      'Upload Date': document.uploadDate,
      'Last Analyzed': document.lastAnalyzed,
      'Overall Score': document.score,
      'Status': document.status,
      'GDPR Score': document.analysisResult.gdprScore,
      'CCPA Score': document.analysisResult.ccpaScore,
      'DPDPA Score': document.analysisResult.dpdpaScore,
      'Compliance Breakdown': {
        'Compliant': document.analysisResult.complianceBreakdown.compliant,
        'Needs Attention': document.analysisResult.complianceBreakdown.needsAttention,
        'High Risk': document.analysisResult.complianceBreakdown.highRisk
      },
      'Gaps': document.analysisResult.gaps.map(gap => ({
        'Title': gap.title,
        'Regulation': gap.regulation,
        'Risk Level': gap.riskLevel
      })),
      'Insights': document.analysisResult.insights.map(insight => ({
        'Title': insight.title,
        'Regulation': insight.regulation,
        'Article': insight.article,
        'Description': insight.description,
        'Risk Level': insight.riskLevel
      }))
    };

    const worksheet = XLSX.utils.json_to_sheet([data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis Results');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${document.name}-analysis.xlsx`);
  };

  // Export all compliance data to Excel
  const handleExportAll = () => {
    // First collect policy documents data
    const policyData = policyDocuments.map(doc => ({
      'Document Type': 'Policy Document',
      'Name': doc.name,
      'Upload Date': doc.uploadDate,
      'Last Analyzed': doc.lastAnalyzed,
      'Overall Score': doc.score,
      'Status': doc.status,
      'Starred': doc.starred ? 'Yes' : 'No'
    }));
    
    // Then collect analyzed documents data
    const analyzedData = documents.map(doc => ({
      'Document Type': 'Analyzed Document',
      'Name': doc.title,
      'Upload Date': formatDate(doc.createdAt),
      'Size': `${doc.content.length} chars`,
      'Overall Score': doc.overallScore,
      'GDPR Score': doc.gdprScore,
      'CCPA Score': doc.ccpaScore,
      'DPDPA Score': doc.dpdpaScore
    }));
    
    // Combine all data
    const allData = [...policyData, ...analyzedData];
    
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet with all documents
    const summarySheet = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'All Documents');
    
    // Policy documents sheet
    if (policyDocuments.length > 0) {
      const policySheet = XLSX.utils.json_to_sheet(policyData);
      XLSX.utils.book_append_sheet(workbook, policySheet, 'Policy Documents');
    }
    
    // Analyzed documents sheet
    if (documents.length > 0) {
      const analyzedSheet = XLSX.utils.json_to_sheet(analyzedData);
      XLSX.utils.book_append_sheet(workbook, analyzedSheet, 'Analyzed Documents');
    }
    
    // Write to Excel file and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `compliance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const handleToggleStar = async (docId: string) => {
    await toggleStar(docId);
  };

  // Render the document history section
  const renderDocumentHistory = () => {
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

    if (!documents || documents.length === 0) {
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
              {documents && documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icon icon={FileText} variant="primary" size="sm" className="mr-2" />
                      <span className="text-sm font-medium" style={{ color: theme.colors.neutral[800] }}>{doc.title || 'Untitled'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm" style={{ color: theme.colors.neutral[600] }}>
                      {formatDate(doc.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm" style={{ color: theme.colors.neutral[600] }}>
                      {doc.content ? `${doc.content.length} chars` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-1" style={{ backgroundColor: theme.colors.neutral[200] }}>
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.round(doc.overallScore || 0)}%`,
                          backgroundColor: getScoreColor(doc.overallScore || 0)
                        }}
                      ></div>
                    </div>
                    <span className="text-xs" style={{ color: theme.colors.neutral[600] }}>
                      {Math.round(doc.overallScore || 0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => doc.id && handleViewAnalysis(doc.id)}
                        className="p-2 rounded-md hover:bg-neutral-100"
                        style={{ color: theme.colors.primary[500] }}
                        title="View analysis"
                        disabled={!doc.id}
                      >
                        <Icon icon={BarChart} variant="primary" size="sm" />
                      </button>
                      <button
                        onClick={() => doc.id && handleDelete(doc.id)}
                        className="p-2 rounded-md hover:bg-neutral-100"
                        style={{ color: theme.colors.error }}
                        title="Delete analysis"
                        disabled={!doc.id}
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
    );
  };

  // Render policy documents
  const renderPolicyDocuments = () => {
    if (policyLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: theme.colors.primary[500] }}></div>
        </div>
      );
    }

    if (policyError) {
      return (
        <div 
          className="flex items-center gap-2 p-4 rounded-md"
          style={{ backgroundColor: theme.colors.neutral[100], color: theme.colors.error }}
        >
          <Icon icon={AlertCircle} variant="error" size="sm" />
          <span>Error loading policy documents: {policyError}</span>
        </div>
      );
    }

    if (filteredPolicyDocuments.length === 0) {
      return (
        <div 
          className="text-center p-8 rounded-lg"
          style={{ backgroundColor: theme.colors.neutral[50], color: theme.colors.neutral[500] }}
        >
          <Icon icon={FileText} variant="neutral" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.neutral[700] }}>No Policies Found</h3>
          <p>No policy documents match your search criteria.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y" style={{ borderColor: theme.colors.neutral[200] }}>
          <thead style={{ backgroundColor: theme.colors.neutral[50] }}>
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                style={{ color: theme.colors.neutral[500] }}
              >
                Document
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                style={{ color: theme.colors.neutral[500] }}
              >
                Upload Date
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                style={{ color: theme.colors.neutral[500] }}
              >
                Last Analyzed
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                style={{ color: theme.colors.neutral[500] }}
              >
                Score
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium tracking-wider"
                style={{ color: theme.colors.neutral[500] }}
              >
                Status
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
            {filteredPolicyDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>{doc.name || 'Unnamed Document'}</span>
                    <button
                      onClick={() => doc.id && handleToggleStar(doc.id)}
                      className="ml-2"
                      disabled={!doc.id}
                    >
                      <Star
                        size={18}
                        fill={doc.starred ? theme.colors.warning : 'none'}
                        stroke={doc.starred ? theme.colors.warning : theme.colors.neutral[400]}
                      />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{doc.uploadDate || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">{doc.lastAnalyzed || 'N/A'}</td>
                <td className="px-6 py-4">{doc.score || 0}%</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-sm ${getStatusColor(doc.status || '')}`}>
                    {doc.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded hover:bg-neutral-100"
                      title="Download Analysis"
                      disabled={!doc.id}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Compliance Report</h1>
          <p className="text-gray-600">View and manage your compliance reports</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-2/3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      </div>

      {/* Policy documents section */}
      <div className="bg-white rounded-lg border mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Policy Documents</h2>
          {renderPolicyDocuments()}
        </div>
      </div>

      {/* Document History section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.neutral[800] }}>
          Analysis History
        </h2>
        <p className="mb-6" style={{ color: theme.colors.neutral[600] }}>
          Showing your analyzed documents from the past month.
        </p>
        
        {renderDocumentHistory()}
      </div>
    </div>
  );
}