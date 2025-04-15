import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Cloud, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Copy, Download, FileDown, FileText as FileIcon, Sparkles } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { usePolicy } from '../contexts/PolicyContext';
import { useDocuments } from '../contexts/DocumentContext';
import { privacyRules, analyzeTextAgainstRules, calculateComplianceScore } from '../rules/privacyRules';
import { analyzePrivacyPolicyWithGemini } from '../services/geminiService';
import { theme } from '../styles/theme';
import { ResponsivePie } from '@nivo/pie';

ChartJS.register(
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

// Analysis steps
enum AnalysisStep {
  Idle = 0,
  Preprocessing = 10,
  AIAnalysis = 30,
  RuleAnalysis = 50,
  ScoreCalculation = 70,
  StoringDocument = 85,
  Complete = 100
}

// Add chart configuration constants
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

export default function PolicyUpload() {
  const navigate = useNavigate();
  const { addDocument } = usePolicy();
  const { storeAnalyzedDocument } = useDocuments();
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
  const [filteredGaps, setFilteredGaps] = useState<AnalysisResult['gaps']>([]);
  const [filteredInsights, setFilteredInsights] = useState<AnalysisResult['insights']>([]);
  const [storingDocument, setStoringDocument] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisStep>(AnalysisStep.Idle);
  const [showResults, setShowResults] = useState(false);
  const [useGemini, setUseGemini] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileType = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileType)) {
        alert('Please upload a valid file type (PDF, DOC, DOCX, TXT)');
        return;
      }
      
      setSelectedFile(file);
      setAnalysisResult(null);
      setShowResults(false);
      setAnalysisProgress(AnalysisStep.Idle);
      setAnalysisError(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const analyzeContentWithRules = async (content: string): Promise<AnalysisResult> => {
    setAnalysisProgress(AnalysisStep.RuleAnalysis);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get actual rule matches from the content
    const ruleMatches = analyzeTextAgainstRules(content, privacyRules);
    
    setAnalysisProgress(AnalysisStep.ScoreCalculation);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate actual scores based on rule matches
    const result = calculateComplianceScore(ruleMatches);
    
    // Validate compliance breakdown values
    if (result.complianceBreakdown) {
      const total = result.complianceBreakdown.compliant + 
                   result.complianceBreakdown.needsAttention + 
                   result.complianceBreakdown.highRisk;
                   
      // Normalize values if they don't add up to 100%
      if (Math.abs(total - 100) > 0.01) {
        const normalizer = 100 / total;
        result.complianceBreakdown = {
          compliant: result.complianceBreakdown.compliant * normalizer,
          needsAttention: result.complianceBreakdown.needsAttention * normalizer,
          highRisk: result.complianceBreakdown.highRisk * normalizer
        };
      }
    }
    
    return {
      ...result,
      lastAnalyzed: new Date().toISOString()
    };
  };

  const analyzeContentWithGemini = async (content: string): Promise<AnalysisResult> => {
    setAnalysisProgress(AnalysisStep.AIAnalysis);
    
    try {
      // Get actual analysis results from Gemini AI
      const result = await analyzePrivacyPolicyWithGemini(content, selectedRegulations);
      
      // Validate compliance breakdown values
      if (result.complianceBreakdown) {
        const total = result.complianceBreakdown.compliant + 
                     result.complianceBreakdown.needsAttention + 
                     result.complianceBreakdown.highRisk;
                     
        // Normalize values if they don't add up to 100%
        if (Math.abs(total - 100) > 0.01) {
          const normalizer = 100 / total;
          result.complianceBreakdown = {
            compliant: result.complianceBreakdown.compliant * normalizer,
            needsAttention: result.complianceBreakdown.needsAttention * normalizer,
            highRisk: result.complianceBreakdown.highRisk * normalizer
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      setAnalysisError('Error analyzing with Gemini AI. Falling back to rule-based analysis.');
      
      // Fallback to rule-based analysis
      return await analyzeContentWithRules(content);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileContent) return;

    setIsAnalyzing(true);
    setShowResults(false);
    setAnalysisError(null);
    setAnalysisProgress(AnalysisStep.Preprocessing);
    
    try {
      // Preprocessing step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Choose analysis method based on user preference
      let result: AnalysisResult;
      if (useGemini) {
        result = await analyzeContentWithGemini(fileContent);
      } else {
        result = await analyzeContentWithRules(fileContent);
      }

      setAnalysisResult(result);
      
      // Add the document to the policy context
      addDocument({
        name: selectedFile.name,
        uploadDate: new Date().toLocaleDateString(),
        lastAnalyzed: result.lastAnalyzed,
        score: result.overallScore,
        status: result.overallScore >= 80 ? 'Compliant' : 
                result.overallScore >= 60 ? 'Needs Attention' : 'High Risk',
        content: fileContent,
        analysisResult: result
      });

      // Store only the analysis results in Firebase (without the document content)
      setAnalysisProgress(AnalysisStep.StoringDocument);
      setStoringDocument(true);
      try {
        await storeAnalyzedDocument(selectedFile, {
          overallScore: result.overallScore,
          gdprScore: result.gdprScore,
          ccpaScore: result.ccpaScore,
          dpdpaScore: result.dpdpaScore,
          complianceBreakdown: result.complianceBreakdown,
          gaps: result.gaps,
          insights: result.insights
        });
      } catch (storageError) {
        console.error('Error storing analysis results in Firebase:', storageError);
      } finally {
        setStoringDocument(false);
      }

      // Set final data and show results
      setFilteredGaps(result.gaps);
      setFilteredInsights(result.insights);
      setAnalysisProgress(AnalysisStep.Complete);
      
      // Small delay before showing results for smooth transition
      setTimeout(() => {
        setShowResults(true);
      }, 500);
      
    } catch (error) {
      console.error('Error analyzing file:', error);
      setAnalysisError('Failed to analyze the document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get analysis step description
  const getAnalysisStepDescription = (step: AnalysisStep): string => {
    switch (step) {
      case AnalysisStep.Preprocessing:
        return 'Preprocessing document...';
      case AnalysisStep.AIAnalysis:
        return 'Analyzing with Gemini AI...';
      case AnalysisStep.RuleAnalysis:
        return 'Analyzing against privacy rules...';
      case AnalysisStep.ScoreCalculation:
        return 'Calculating compliance scores...';
      case AnalysisStep.StoringDocument:
        return 'Storing document securely...';
      case AnalysisStep.Complete:
        return 'Analysis complete!';
      default:
        return 'Preparing analysis...';
    }
  };

  const handleExport = () => {
    if (!analysisResult) return;

    const data = {
      'Overall Score': analysisResult.overallScore,
      'GDPR Score': analysisResult.gdprScore,
      'CCPA Score': analysisResult.ccpaScore,
      'DPDPA Score': analysisResult.dpdpaScore,
      'Compliance Breakdown': {
        'Compliant': analysisResult.complianceBreakdown.compliant,
        'Needs Attention': analysisResult.complianceBreakdown.needsAttention,
        'High Risk': analysisResult.complianceBreakdown.highRisk
      },
      'Gaps': analysisResult.gaps.map(gap => ({
        'Title': gap.title,
        'Regulation': gap.regulation,
        'Risk Level': gap.riskLevel
      })),
      'Insights': analysisResult.insights.map(insight => ({
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
    saveAs(blob, 'privacy-policy-analysis.xlsx');
  };

  const handleFilter = (tab: string) => {
    setActiveTab(tab);
    if (!analysisResult) return;

    switch (tab) {
      case 'gdpr':
        setFilteredGaps(analysisResult.gaps.filter(gap => gap.regulation === 'GDPR'));
        setFilteredInsights(analysisResult.insights.filter(insight => insight.regulation === 'GDPR'));
        break;
      case 'ccpa':
        setFilteredGaps(analysisResult.gaps.filter(gap => gap.regulation === 'CCPA'));
        setFilteredInsights(analysisResult.insights.filter(insight => insight.regulation === 'CCPA'));
        break;
      case 'dpdpa':
        setFilteredGaps(analysisResult.gaps.filter(gap => gap.regulation === 'DPDPA'));
        setFilteredInsights(analysisResult.insights.filter(insight => insight.regulation === 'DPDPA'));
        break;
      default:
        setFilteredGaps(analysisResult.gaps);
        setFilteredInsights(analysisResult.insights);
    }
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

  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Compliance Score',
        data: [],
        backgroundColor: [],
      },
    ],
  };

  const handleRegulationChange = (regulation: string) => {
    setSelectedRegulations(prev => ({
      ...prev,
      [regulation]: !prev[regulation as keyof typeof prev]
    }));
  };

  const formatPercentage = (value: number): string | number => {
    // Format to 2 decimal places
    const formatted = Number(value.toFixed(2));
    // If it's a whole number, show as integer, otherwise show with 2 decimal places
    return Number.isInteger(formatted) ? formatted : formatted.toFixed(2);
  };

  const getComplianceChartData = (analysisResult: AnalysisResult) => {
    // Use the exact same values for the chart as shown in the labels without adjusting to 100%
    const compliant = Number(analysisResult.complianceBreakdown.compliant.toFixed(2));
    const needsAttention = Number(analysisResult.complianceBreakdown.needsAttention.toFixed(2));
    const highRisk = Number(analysisResult.complianceBreakdown.highRisk.toFixed(2));
    
    // Ensure all three categories are always shown in the chart with their actual values
    const data = [
      {
        id: 'Compliant',
        label: 'Compliant',
        value: compliant,
        color: CHART_COLORS.green.main[0]
      },
      {
        id: 'Needs Attention',
        label: 'Needs Attention',
        value: needsAttention,
        color: CHART_COLORS.yellow.main[0]
      },
      {
        id: 'High Risk',
        label: 'High Risk',
        value: highRisk,
        color: CHART_COLORS.red.main[0]
      }
    ];
    
    return data;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4" style={{ backgroundColor: theme.colors.background.secondary }}>
      <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: theme.colors.background.primary }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.neutral[700] }}>
              Upload Policy Document
            </label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: theme.colors.neutral[200] }}>
              <Upload className="mx-auto h-12 w-12" style={{ color: theme.colors.neutral[400] }} />
              <p className="mt-4 text-sm" style={{ color: theme.colors.neutral[600] }}>
                Drag and drop your policy file here, or{" "}
                <label className="cursor-pointer" style={{ color: theme.colors.primary[500] }}>
                  browse
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={isAnalyzing}
                  />
                </label>
              </p>
              <p className="mt-2 text-xs" style={{ color: theme.colors.neutral[500] }}>
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
              {selectedFile && (
                <p className="mt-2 text-sm" style={{ color: theme.colors.neutral[700] }}>
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
                <span>DPDPA (Digital Personal Data Protection Act)</span>
              </label>
            </div>
          </div>

          {/* Analysis Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.neutral[700] }}>
              Analysis Method
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useGemini}
                  onChange={() => setUseGemini(true)}
                  className="form-radio text-primary-500"
                />
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" style={{ color: theme.colors.primary[500] }} />
                  <span>Gemini AI Analysis</span>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useGemini}
                  onChange={() => setUseGemini(false)}
                  className="form-radio text-primary-500"
                />
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" style={{ color: theme.colors.secondary[500] }} />
                  <span>Rule-based Analysis</span>
                </div>
              </label>
            </div>
            <p className="mt-1 text-xs" style={{ color: theme.colors.neutral[500] }}>
              {useGemini 
                ? 'Gemini AI provides more comprehensive analysis using artificial intelligence.'
                : 'Rule-based analysis uses predefined rules to check compliance.'}
            </p>
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
                ? 'cursor-not-allowed'
                : 'hover:bg-primary-600 text-white'
            }`}
            style={{ 
              backgroundColor: !selectedFile || isAnalyzing ? theme.colors.neutral[400] : theme.colors.primary[500],
              color: 'white' 
            }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
          </button>
        </form>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="mt-6 p-6 border rounded-lg" style={{ backgroundColor: theme.colors.background.tertiary, borderColor: theme.colors.neutral[200] }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.neutral[800] }}>
              Analysis in Progress
            </h3>
            <div className="mb-2 flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.neutral[600] }}>
                {getAnalysisStepDescription(analysisProgress)}
              </span>
              <span className="text-sm font-medium" style={{ color: theme.colors.primary[600] }}>
                {analysisProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
              <div 
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${analysisProgress}%`,
                  backgroundColor: theme.colors.primary[500]
                }}
              ></div>
            </div>
            <p className="text-xs" style={{ color: theme.colors.neutral[500] }}>
              Please wait while we analyze your document. This may take a few moments depending on the document size.
            </p>
          </div>
        )}

        {/* Error Display */}
        {analysisError && (
          <div className="mt-6 p-4 rounded-lg border" style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: theme.colors.error,
            color: theme.colors.error
          }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{analysisError}</p>
            </div>
          </div>
        )}

        {/* Analysis Complete But Not Yet Shown */}
        {analysisResult && !showResults && analysisProgress === AnalysisStep.Complete && (
          <div className="mt-6 text-center p-6">
            <CheckCircle2 
              className="mx-auto mb-2 animate-pulse" 
              size={48} 
              style={{ color: theme.colors.success }}
            />
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.neutral[800] }}>
              Analysis Complete
            </h3>
            <p className="text-sm" style={{ color: theme.colors.neutral[600] }}>
              Preparing your results...
            </p>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && showResults && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compliance Risk Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Compliance Risk Score</h3>
              <div className="text-4xl font-bold text-green-500 mb-2">
                {analysisResult.overallScore}%
              </div>
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <span>Compliant</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your policy meets most compliance requirements
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>GDPR</span>
                    <span>{analysisResult.gdprScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ width: `${analysisResult.gdprScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CCPA</span>
                    <span>{analysisResult.ccpaScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ width: `${analysisResult.ccpaScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>DPDPA</span>
                    <span>{analysisResult.dpdpaScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ width: `${analysisResult.dpdpaScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mt-4">
                Last analyzed: {analysisResult.lastAnalyzed}
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
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.green.main[0] }}></div>
                    <span className="text-sm font-medium">Compliant</span>
                  </div>
                  <span className="text-sm font-medium ml-4">{formatPercentage(analysisResult.complianceBreakdown.compliant)}%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.yellow.main[0] }}></div>
                    <span className="text-sm font-medium">Needs Attention</span>
                  </div>
                  <span className="text-sm font-medium ml-4">{formatPercentage(analysisResult.complianceBreakdown.needsAttention)}%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.red.main[0] }}></div>
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
                {filteredGaps.map((gap, index) => (
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
                    onClick={() => handleFilter('all')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      activeTab === 'all'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilter('gdpr')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      activeTab === 'gdpr'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    GDPR
                  </button>
                  <button
                    onClick={() => handleFilter('ccpa')}
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
                {filteredInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{insight.title}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskBadgeColor(insight.riskLevel)}`}>
                          {insight.riskLevel}
                        </span>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
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
                      <button className="flex-1 py-2 px-4 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50">
                        Copy Text
                      </button>
                      <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Apply Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Report */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Compliance Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate detailed reports of your compliance status
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50">
                  <FileDown className="w-5 h-5 text-red-600" />
                  <span className="text-sm">Export as PDF</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50">
                  <FileDown className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Export as CSV</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Executive Summary</span>
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Report Preview</h4>
                  <button className="p-2 hover:bg-gray-200 rounded-full">
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-600">Analysis Date:</div>
                    <div>{analysisResult.lastAnalyzed}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Overall Compliance Score:</div>
                    <div>{analysisResult.overallScore}% - Compliant</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Frameworks Analyzed:</div>
                    <div>GDPR, CCPA</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Critical Issues:</div>
                    <div>2 high-risk issues identified</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Recommendations:</div>
                    <div>Update Right to Erasure clause, add Opt-Out Rights section</div>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Generate Full Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}