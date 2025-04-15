import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { ResponsivePie } from '@nivo/pie';
import { theme } from '../styles/theme';
import { analyze } from '../services/documentService';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalysisResult {
  overallScore: number;
  gdprScore: number;
  ccpaScore: number;
  dpdpaScore: number;
  complianceBreakdown: {
    compliant: number;
    needsAttention: number;
    highRisk: number;
  };
  gaps: Array<{
    title: string;
    regulation: string;
    riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  }>;
  insights: Array<{
    title: string;
    regulation: string;
    article: string;
    description: string;
    riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  }>;
  lastAnalyzed: string;
}

interface AnalyzedFileHistory {
  id: string;
  fileName: string;
  analysisDate: string;
  result: AnalysisResult;
}

// Add chart configuration constants
const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          size: 12
        }
      }
    }
  }
};

const CHART_COLORS = {
  green: {
    main: ['rgb(34, 197, 94)', 'rgb(22, 163, 74)', 'rgb(21, 128, 61)'],
    background: 'rgba(34, 197, 94, 0.1)'
  },
  yellow: {
    main: ['rgb(234, 179, 8)', 'rgb(202, 138, 4)', 'rgb(161, 98, 7)'],
    background: 'rgba(234, 179, 8, 0.1)'
  },
  red: {
    main: ['rgb(239, 68, 68)', 'rgb(220, 38, 38)', 'rgb(185, 28, 28)'],
    background: 'rgba(239, 68, 68, 0.1)'
  }
};

// Add the AnalysisStep enum
enum AnalysisStep {
  Idle = 0,
  Preprocessing = 10,
  AIAnalysis = 30,
  RuleAnalysis = 50,
  ScoreCalculation = 70,
  StoringDocument = 85,
  Complete = 100
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedRegulations, setSelectedRegulations] = useState({
    gdpr: true,
    ccpa: false,
    dpdpa: false
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [fileContent, setFileContent] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisStep>(AnalysisStep.Idle);
  const [showResults, setShowResults] = useState(false);
  const [useGemini, setUseGemini] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [fileHistory, setFileHistory] = useState<AnalyzedFileHistory[]>([]);

  // Load file history when component mounts
  useEffect(() => {
    const loadFileHistory = () => {
      try {
        const savedHistory = localStorage.getItem('fileHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setFileHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error loading file history:', error);
        // If there's an error, initialize with empty array
        setFileHistory([]);
      }
    };

    loadFileHistory();
  }, []);

  // Save file history whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('fileHistory', JSON.stringify(fileHistory));
    } catch (error) {
      console.error('Error saving file history:', error);
    }
  }, [fileHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileType = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileType)) {
        alert('Please upload a valid file type (PDF, DOC, DOCX, TXT)');
        return;
      }
      
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const handleRegulationChange = (regulation: string) => {
    setSelectedRegulations(prev => ({
      ...prev,
      [regulation]: !prev[regulation as keyof typeof prev]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileContent) return;

    setIsAnalyzing(true);
    setShowResults(false);
    setAnalysisError(null);
    setAnalysisProgress(AnalysisStep.Preprocessing);
    
    try {
      // Create a temporary document ID for analysis
      const tempDocId = `temp-${Date.now()}`;
      
      // Choose analysis method based on user preference
      let result: AnalysisResult;
      if (useGemini) {
        result = await analyze(tempDocId, selectedRegulations);
      } else {
        result = await analyzeContentWithRules(fileContent);
      }

      // Create new history entry
      const newFileHistory: AnalyzedFileHistory = {
        id: tempDocId,
        fileName: selectedFile.name,
        analysisDate: new Date().toISOString(),
        result: result
      };
      
      // Update state and localStorage
      setFileHistory(prev => {
        const updatedHistory = [newFileHistory, ...prev];
        localStorage.setItem('fileHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

      setAnalysisResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing file:', error);
      setAnalysisError('Failed to analyze the document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to analyze document and return results
  const analyzeDocument = async (file: File, regulations: any): Promise<AnalysisResult> => {
    // Read file content
    const content = await file.text();
    
    // Perform actual analysis based on content and selected regulations
    // This should be replaced with your actual analysis logic
    const result = await analyze(content, regulations);
    
    return {
      overallScore: result.overallScore,
      gdprScore: result.gdprScore,
      ccpaScore: result.ccpaScore,
      dpdpaScore: result.dpdpaScore,
      complianceBreakdown: result.complianceBreakdown,
      gaps: result.gaps,
      insights: result.insights,
      lastAnalyzed: new Date().toISOString()
    };
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low Risk': return 'text-green-600';
      case 'Medium Risk': return 'text-yellow-600';
      case 'High Risk': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low Risk': return 'bg-green-100 text-green-800';
      case 'Medium Risk': return 'bg-yellow-100 text-yellow-800';
      case 'High Risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercentage = (value: number): string | number => {
    // Format to 2 decimal places
    const formatted = Number(value.toFixed(2));
    // If it's a whole number, show as integer, otherwise show with 2 decimal places
    return Number.isInteger(formatted) ? formatted : formatted.toFixed(2);
  };

  const getComplianceChartData = (analysisResult: AnalysisResult) => {
    const compliant = Number(analysisResult.complianceBreakdown.compliant.toFixed(2));
    const needsAttention = Number(analysisResult.complianceBreakdown.needsAttention.toFixed(2));
    const highRisk = Number(analysisResult.complianceBreakdown.highRisk.toFixed(2));
    
    const data = [
      {
        id: 'Compliant',
        label: 'Compliant',
        value: compliant,
        color: theme.colors.success
      },
      {
        id: 'Needs Attention',
        label: 'Needs Attention',
        value: needsAttention,
        color: theme.colors.warning
      },
      {
        id: 'High Risk',
        label: 'High Risk',
        value: highRisk,
        color: theme.colors.error
      }
    ];
    
    return data;
  };

  const getFrameworkScoresData = (analysisResult: AnalysisResult) => ({
    labels: ['GDPR', 'CCPA', 'DPDPA'],
    datasets: [{
        label: 'Compliance Score',
      data: [
        formatPercentage(analysisResult.gdprScore),
        formatPercentage(analysisResult.ccpaScore),
        formatPercentage(analysisResult.dpdpaScore)
      ],
        backgroundColor: [
        theme.colors.primary[500],
        theme.colors.secondary[500],
        theme.colors.error
      ],
      borderColor: [
        theme.colors.primary[600],
        theme.colors.secondary[600],
        theme.colors.error
      ],
      borderWidth: 3,
      borderRadius: 6,
      hoverBackgroundColor: [
        theme.colors.primary[700],
        theme.colors.secondary[700],
        theme.colors.error
      ],
      hoverBorderColor: [
        theme.colors.primary[600],
        theme.colors.secondary[600],
        theme.colors.error
      ],
      hoverBorderWidth: 4
    }]
  });

  const barChartOptions = {
    ...CHART_OPTIONS,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true,
          borderDash: [],
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(tickValue: number | string) {
            return tickValue + '%';
          },
          font: {
            size: 12
          },
          padding: 8
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: true,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          },
          padding: 8
        }
      }
    },
    plugins: {
      ...CHART_OPTIONS.plugins,
      legend: {
        display: false
      }
    }
  } as const;

  // Add the analyzeContentWithRules function
  const analyzeContentWithRules = async (content: string): Promise<AnalysisResult> => {
    setAnalysisProgress(AnalysisStep.RuleAnalysis);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple rule-based analysis (placeholder)
    return {
      overallScore: 75,
      gdprScore: 80,
      ccpaScore: 70,
      dpdpaScore: 75,
      complianceBreakdown: {
        compliant: 75,
        needsAttention: 15,
        highRisk: 10
      },
      gaps: [],
      insights: [],
      lastAnalyzed: new Date().toISOString()
    };
  };

  // Update delete functionality to properly remove from history
  const handleDeleteFile = (fileId: string) => {
    setFileHistory(prev => {
      const updatedHistory = prev.filter(file => file.id !== fileId);
      localStorage.setItem('fileHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  // Update the renderFileHistory component to show history immediately
  const renderFileHistory = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">File History</h3>
        <p className="text-sm text-gray-600 mb-4">
          Previously analyzed documents
        </p>

        <div className="space-y-4">
          <div className="border rounded-lg divide-y">
            {fileHistory.length > 0 ? (
              fileHistory.map((file) => (
                <div key={file.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{file.fileName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(file.analysisDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{formatPercentage(file.result.complianceBreakdown.compliant)}% Compliant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>{formatPercentage(file.result.complianceBreakdown.needsAttention)}% Needs Attention</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{formatPercentage(file.result.complianceBreakdown.highRisk)}% High Risk</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => {
                        setAnalysisResult(file.result);
                        setShowResults(true);
                      }}
                    >
                      View Details
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No documents analyzed yet</p>
                <p className="text-sm mt-1">Upload a document to start analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Compliance Dashboard</h2>
            <p className="text-sm text-gray-600">Monitor and improve your regulatory compliance</p>
          </div>
        </div>
        
        <div className="w-full mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Policy Document
            </label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-600">
                Drag and drop your policy file here, or{" "}
                <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </label>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-700">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
              <option value="it">Italian</option>
            </select>
          </div>

          {/* Compliance Standards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Compliance Standards
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRegulations.gdpr}
                  onChange={() => handleRegulationChange('gdpr')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>GDPR (General Data Protection Regulation)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRegulations.ccpa}
                  onChange={() => handleRegulationChange('ccpa')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>CCPA (California Consumer Privacy Act)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRegulations.dpdpa}
                  onChange={() => handleRegulationChange('dpdpa')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>DPDPA (Digital Personal Data Protection Act - India)</span>
              </label>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-600">
                The analysis results are AI-generated suggestions and should be reviewed by legal experts.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || isAnalyzing}
            className={`w-full py-3 rounded-lg transition-colors ${
              !selectedFile || isAnalyzing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
          </button>
        </form>

        {/* Always show file history */}
        {renderFileHistory()}

        {/* Show analysis results only when available */}
        {analysisResult && showResults && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Framework Scores */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Framework Scores</h3>
              <div className="h-64">
                <Bar 
                  data={getFrameworkScoresData(analysisResult)} 
                  options={barChartOptions}
                />
              </div>
            </div>

            {/* Compliance Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Compliance Breakdown</h3>
              <p className="text-sm text-gray-600 mb-4">
                Distribution of compliance status across policy clauses
              </p>
              <div className="h-[280px] w-full">
                <ResponsivePie
                  data={getComplianceChartData(analysisResult)}
                  margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ datum: 'data.color' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLabels={false}
                  valueFormat={(value) => `${formatPercentage(value)}%`}
                  sortByValue={false}
                  fit={true}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  isInteractive={true}
                  animate={true}
                  motionConfig="gentle"
                  tooltip={(point) => {
                    const formattedValue = formatPercentage(point.datum.value);
                    return (
                      <div className="bg-white p-2 shadow-md rounded border text-gray-800">
                        <strong>{point.datum.id}:</strong> {formattedValue}%
                      </div>
                    );
                  }}
                />
                </div>
                
              <div className="flex flex-col gap-3 mt-6">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary[500] }}></div>
                    <span className="text-sm font-medium">Compliant</span>
                  </div>
                  <span className="text-sm font-medium ml-4">{formatPercentage(analysisResult.complianceBreakdown.compliant)}%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary[500] }}></div>
                    <span className="text-sm font-medium">Needs Attention</span>
                  </div>
                  <span className="text-sm font-medium ml-4">{formatPercentage(analysisResult.complianceBreakdown.needsAttention)}%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.error }}></div>
                    <span className="text-sm font-medium">High Risk</span>
                  </div>
                  <span className="text-sm font-medium ml-4">{formatPercentage(analysisResult.complianceBreakdown.highRisk)}%</span>
                </div>
              </div>
            </div>

            {/* Compliance Gaps */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Compliance Gaps</h3>
              <p className="text-sm text-gray-600 mb-4">
                Identified issues that need to be addressed
              </p>
              
              <div className="space-y-4">
                {analysisResult.gaps.map((gap, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {gap.riskLevel === 'High Risk' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">{gap.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{gap.regulation}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskBadgeColor(gap.riskLevel)}`}>
                          {gap.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Insights */}
            <div className="col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Actionable Insights</h3>
              <p className="text-sm text-gray-600 mb-4">
                Fix compliance issues with suggested text
              </p>

              <div className="border-b mb-4">
                <nav className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      activeTab === 'all'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('gdpr')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      activeTab === 'gdpr'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    GDPR
                  </button>
                  <button
                    onClick={() => setActiveTab('ccpa')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      activeTab === 'ccpa'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    CCPA
                  </button>
                </nav>
              </div>

              <div className="space-y-4">
                {analysisResult.insights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{insight.title}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskBadgeColor(insight.riskLevel)}`}>
                          {insight.riskLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>{insight.regulation}</span>
                      <span>•</span>
                      <span>{insight.article}</span>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">
                      {insight.description}
                    </p>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Apply Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}