import React, { useState, useEffect } from 'react';
import { Brain, Search, Filter, ArrowUpDown, Download, AlertTriangle } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import SentimentDistribution from '../components/SentimentDistribution';
import KeyThemes from '../components/KeyThemes';
import { SentimentData, Theme } from '../types/sentiment';
import { sentimentService } from '../services/sentimentService';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

const emptyData: SentimentData = {
  total: 0,
  positive: 0,
  neutral: 0,
  negative: 0,
  breakdown: {
    stronglyPositive: 0,
    somewhatPositive: 0,
    neutral: 0,
    somewhatNegative: 0,
    stronglyNegative: 0
  },
  themes: []
};

const SentimentAnalysis: React.FC = () => {
  const [department, setDepartment] = useState('All Departments');
  const [location, setLocation] = useState('All Locations');
  const [timeRange, setTimeRange] = useState('Last 6 Months');
  const [sentimentData, setSentimentData] = useState<SentimentData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSentimentData();
  }, []);

  const loadSentimentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sentimentService.getSentimentData();
      setSentimentData(data);
    } catch (err) {
      console.error('Error loading sentiment data:', err);
      setError('No sentiment data available. Please upload feedback files to see the analysis.');
      setSentimentData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading sentiment data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Sentiment Analysis</h1>
        <p className="text-gray-600">Detailed breakdown of employee sentiment</p>
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

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>Marketing</option>
            <option>HR</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option>All Locations</option>
            <option>New York</option>
            <option>London</option>
            <option>Singapore</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option>Last 6 Months</option>
            <option>Last 3 Months</option>
            <option>Last Month</option>
            <option>Last Week</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {sentimentData.total > 0 ? (
          <>
            <SentimentDistribution data={sentimentData} />
            <KeyThemes themes={sentimentData.themes} />
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="mb-4">
              <Brain className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No sentiment data available</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please upload feedback files to see the sentiment analysis.
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
        )}
      </div>
    </div>
  );
};

export default SentimentAnalysis;