import React, { useState, useRef, useEffect } from 'react';
import { FaDownload, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';

interface CallDetailHeaderProps {
  date: string;
  onBack: () => void;
  audioFileId?: string;
  callData?: {
    agent: string;
    customer: string;
    duration: string;
    category: string;
    sentiment: string;
    kpiScore: string;
    transcript: Array<{ time: string; speaker: "Agent" | "Customer"; text: string; }>;
    kpiMetrics: Record<string, number>;
    sentimentAnalysis: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

const CallDetailHeader: React.FC<CallDetailHeaderProps> = ({ 
  date, 
  onBack, 
  audioFileId,
  callData 
}) => {
  const kpiChartRef = useRef<HTMLCanvasElement>(null);
  const sentimentChartRef = useRef<HTMLCanvasElement>(null);
  const kpiChartInstance = useRef<Chart | null>(null);
  const sentimentChartInstance = useRef<Chart | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (kpiChartInstance.current) {
        kpiChartInstance.current.destroy();
      }
      if (sentimentChartInstance.current) {
        sentimentChartInstance.current.destroy();
      }
    };
  }, []);

  // Create or update charts when callData changes
  useEffect(() => {
    if (!callData || !kpiChartRef.current || !sentimentChartRef.current) return;

    // Destroy existing charts
    if (kpiChartInstance.current) {
      kpiChartInstance.current.destroy();
    }
    if (sentimentChartInstance.current) {
      sentimentChartInstance.current.destroy();
    }

    // Create KPI Metrics Chart
    const kpiCtx = kpiChartRef.current.getContext('2d');
    if (kpiCtx) {
      kpiChartInstance.current = new Chart(kpiCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(callData.kpiMetrics),
          datasets: [{
            label: 'KPI Metrics',
            data: Object.values(callData.kpiMetrics),
            backgroundColor: '#00aff0',
            borderColor: '#0099d6',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }

    // Create Sentiment Analysis Chart
    const sentimentCtx = sentimentChartRef.current.getContext('2d');
    if (sentimentCtx) {
      sentimentChartInstance.current = new Chart(sentimentCtx, {
        type: 'doughnut',
        data: {
          labels: ['Positive', 'Negative', 'Neutral'],
          datasets: [{
            data: [
              callData.sentimentAnalysis.positive,
              callData.sentimentAnalysis.negative,
              callData.sentimentAnalysis.neutral
            ],
            backgroundColor: ['#4CAF50', '#f44336', '#9e9e9e']
          }]
        }
      });
    }
  }, [callData]);

  const handleDownload = async () => {
    if (!audioFileId) return;
    
    try {
      setIsDownloading(true);
      const response = await fetch(`http://localhost:4000/api/v1/analyze/files/${audioFileId}/download`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting audio URL:', error);
      alert('Failed to access audio file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const exportToPDF = async () => {
    if (!callData) return;
    
    try {
      setIsExporting(true);
      
      // Create the report content
      const reportContent = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .section {
                margin-bottom: 30px;
              }
              .metrics {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }
              .metric-card {
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
              }
              .transcript-entry {
                margin-bottom: 20px;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 8px;
              }
              .agent { color: #00aff0; }
              .customer { color: #666; }
              .time { color: #999; font-size: 0.9em; }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
              }
              .kpi-item {
                padding: 15px;
                background: #f5f5f5;
                border-radius: 8px;
                text-align: center;
              }
              .sentiment-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 30px;
              }
              .sentiment-item {
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                color: white;
              }
              .positive { background: #4CAF50; }
              .negative { background: #f44336; }
              .neutral { background: #9e9e9e; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Call Report</h1>
              <p>${date}</p>
            </div>

            <div class="section">
              <h2>Call Information</h2>
              <div class="metrics">
                <div class="metric-card">
                  <strong>Agent:</strong> ${callData.agent}<br>
                  <strong>Customer:</strong> ${callData.customer}<br>
                  <strong>Duration:</strong> ${callData.duration}
                </div>
                <div class="metric-card">
                  <strong>Category:</strong> ${callData.category}<br>
                  <strong>Overall KPI Score:</strong> ${callData.kpiScore}<br>
                  <strong>Sentiment:</strong> ${callData.sentiment}
                </div>
              </div>
            </div>

            <div class="section">
              <h2>KPI Metrics</h2>
              <div class="kpi-grid">
                ${Object.entries(callData.kpiMetrics)
                  .map(([key, value]) => `
                    <div class="kpi-item">
                      <h3>${key}</h3>
                      <div style="font-size: 1.5em; font-weight: bold;">${value}%</div>
                    </div>
                  `).join('')}
              </div>
            </div>

            <div class="section">
              <h2>Sentiment Analysis</h2>
              <div class="sentiment-grid">
                <div class="sentiment-item positive">
                  <h3>Positive</h3>
                  <div style="font-size: 1.5em;">${callData.sentimentAnalysis.positive}%</div>
                </div>
                <div class="sentiment-item negative">
                  <h3>Negative</h3>
                  <div style="font-size: 1.5em;">${callData.sentimentAnalysis.negative}%</div>
                </div>
                <div class="sentiment-item neutral">
                  <h3>Neutral</h3>
                  <div style="font-size: 1.5em;">${callData.sentimentAnalysis.neutral}%</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Call Transcript</h2>
              ${callData.transcript.map(entry => `
                <div class="transcript-entry">
                  <span class="time">[${entry.time}]</span>
                  <strong class="${entry.speaker.toLowerCase()}">${entry.speaker}:</strong>
                  <p>${entry.text}</p>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;

      // Create a new window and write the content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        
        // Wait for content to load
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToExcel = () => {
    if (!callData) return;
    
    try {
      setIsExporting(true);
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Basic Information Sheet
      const basicInfo = [
        ['Call Report'],
        ['Date', date],
        ['Agent', callData.agent],
        ['Customer', callData.customer],
        ['Duration', callData.duration],
        ['Category', callData.category],
        [],
        ['Performance Metrics'],
        ['Sentiment', callData.sentiment],
        ['KPI Score', callData.kpiScore],
        [],
        ['KPI Metrics'],
        ...Object.entries(callData.kpiMetrics).map(([key, value]) => [key, `${value}%`])
      ];
      
      const wsBasic = XLSX.utils.aoa_to_sheet(basicInfo);
      XLSX.utils.book_append_sheet(wb, wsBasic, 'Call Information');
      
      // Transcript Sheet
      const wsTranscript = XLSX.utils.aoa_to_sheet([
        ['Call Transcript'],
        [''],
        [callData.transcript.map(t => t.text).join('\n')]
      ]);
      XLSX.utils.book_append_sheet(wb, wsTranscript, 'Transcript');
      
      // Save the file
      XLSX.writeFile(wb, `call-report-${date.replace(/[^0-9a-zA-Z]/g, '-')}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  return (
    <div className="rounded-lg">
      <div className="p-4">
        <button 
          onClick={onBack}
          className="flex items-center text-[#00aff0] font-medium text-sm hover:text-[#0099d6]"
        >
          ← Back to Calls
        </button>

        {/* Hidden canvases for chart generation */}
        <canvas ref={kpiChartRef} style={{ display: 'none' }} width="400" height="200" />
        <canvas ref={sentimentChartRef} style={{ display: 'none' }} width="400" height="400" />

        <div className="flex justify-end space-x-2 mt-2">
          <button 
            onClick={handleDownload}
            disabled={!audioFileId || isDownloading}
            className={`flex items-center gap-2 px-4 py-2 text-[#00aff0] border border-[#00aff0] rounded-md ${
              audioFileId && !isDownloading ? 'hover:bg-[#f0f9ff] cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <FaDownload /> {isDownloading ? 'Opening...' : 'Download Audio'}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!callData || isExporting}
              className={`flex items-center gap-2 px-4 py-2 text-[#00aff0] border border-[#00aff0] rounded-md ${
                callData && !isExporting ? 'hover:bg-[#f0f9ff] cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <FaFileExport /> {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
            
            {showExportMenu && !isExporting && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Export as Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDetailHeader; 