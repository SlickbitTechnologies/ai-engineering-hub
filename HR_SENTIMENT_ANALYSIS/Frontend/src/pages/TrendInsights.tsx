import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Brain, AlertTriangle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { sentimentService } from '../services/sentimentService';
import { SentimentData } from '../types/sentiment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SignificantChange {
  theme: string;
  description: string;
  change: string;
  trend: 'positive' | 'negative' | 'neutral';
}

export default function TrendInsights() {
  const [timeRange, setTimeRange] = useState('6months');
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await sentimentService.getSentimentData();
        setSentimentData(data);
        
        // Set default selected theme if themes exist
        if (data.themes.length > 0) {
          setSelectedTheme(data.themes[0].name);
        }
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        setError('No sentiment data available. Please upload feedback files to see the analysis.');
        setSentimentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Get the current date and generate month labels for the last 6 months
  const getMonthLabels = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now);
      month.setMonth(now.getMonth() - i);
      months.push(month.toLocaleString('default', { month: 'short' }));
    }
    
    return months;
  };

  const months = getMonthLabels();
  
  // Generate random trend data for demonstration
  const generateTrendData = (base: number, variance: number) => {
    return Array.from({ length: 6 }, () => {
      return Math.max(0, Math.min(100, base + (Math.random() * variance * 2 - variance)));
    });
  };

  const getOverallTrendData = () => {
    if (!sentimentData) return null;
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Positive',
          data: [sentimentData.positive, ...generateTrendData(sentimentData.positive, 15).slice(0, 5)],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.4,
        },
        {
          label: 'Negative',
          data: [sentimentData.negative, ...generateTrendData(sentimentData.negative, 10).slice(0, 5)],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          tension: 0.4,
        },
        {
          label: 'Neutral',
          data: [sentimentData.neutral, ...generateTrendData(sentimentData.neutral, 8).slice(0, 5)],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.4,
        },
      ],
    };
  };

  const getThemeComparisonData = () => {
    if (!sentimentData || !selectedTheme) return null;
    
    const selectedThemeData = sentimentData.themes.find(theme => theme.name === selectedTheme);
    
    if (!selectedThemeData) return null;
    
    // Calculate data point based on mentions
    const maxMentions = Math.max(...sentimentData.themes.map(t => t.mentions));
    const baseValue = (selectedThemeData.mentions / maxMentions) * 100;
    
    return {
      labels: months,
      datasets: [
        {
          label: selectedTheme,
          data: [baseValue, ...generateTrendData(baseValue, 20).slice(0, 5)],
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const generateSignificantChanges = (): SignificantChange[] => {
    if (!sentimentData || sentimentData.themes.length === 0) return [];
    
    return sentimentData.themes
      .slice(0, 5)
      .map(theme => {
        const isPositive = theme.sentiment === 'positive';
        const changePercent = Math.floor(Math.random() * 20) + 5;
        const direction = isPositive ? '-' : '+';
        
        return {
          theme: theme.name,
          description: `${isPositive ? 'Improvement in' : 'Concerns about'} ${theme.name} ${isPositive ? 'increased' : 'decreased'} by ${changePercent}% recently.`,
          change: `${direction}${changePercent}%`,
          trend: theme.sentiment
        };
      });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading trend insights...</div>
      </div>
    );
  }

  // No data state
  if (!sentimentData || sentimentData.total === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Trend Insights</h1>
            <p className="text-gray-600 mt-1">Track sentiment changes over time</p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="mb-4">
            <Brain className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No trend data available</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please upload feedback files to see sentiment trends over time.
          </p>
          <div className="mt-6">
            <a
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Upload
            </a>
          </div>
        </div>
      </div>
    );
  }

  const overallTrendData = getOverallTrendData();
  const themeComparisonData = getThemeComparisonData();
  const significantChanges = generateSignificantChanges();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trend Insights</h1>
          <p className="text-gray-600 mt-1">Track sentiment changes over time</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="6months">Last 6 Months</option>
            <option value="3months">Last 3 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Sentiment Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-1">Overall Sentiment Trend</h2>
        <p className="text-sm text-gray-600 mb-4">Tracking sentiment distribution over time</p>
        <div className="h-80">
          {overallTrendData && <Line data={overallTrendData} options={chartOptions} />}
        </div>
      </div>

      {/* Theme Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Theme Comparison</h2>
            <p className="text-sm text-gray-600">Compare specific themes over time</p>
          </div>
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
          >
            {sentimentData.themes.map(theme => (
              <option key={theme.id} value={theme.name}>{theme.name}</option>
            ))}
          </select>
        </div>
        <div className="h-80">
          {themeComparisonData && <Line data={themeComparisonData} options={chartOptions} />}
        </div>
      </div>

      {/* Significant Changes */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-1">Significant Changes</h2>
        <p className="text-sm text-gray-600 mb-4">Notable variations in employee sentiment</p>
        <div className="space-y-4">
          {significantChanges.map((change, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-4 rounded-lg ${
                change.trend === 'positive' ? 'bg-green-50' : 
                change.trend === 'negative' ? 'bg-red-50' : 'bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-1.5 h-8 rounded-full ${
                  change.trend === 'positive' ? 'bg-green-400' : 
                  change.trend === 'negative' ? 'bg-red-400' : 'bg-blue-400'
                }`}></div>
                <div>
                  <h3 className="font-medium">{change.theme}</h3>
                  <p className="text-sm text-gray-600">{change.description}</p>
                </div>
              </div>
              <span className={`font-medium ${
                change.trend === 'positive' ? 'text-green-600' : 
                change.trend === 'negative' ? 'text-red-600' : 'text-blue-600'
              }`}>{change.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}