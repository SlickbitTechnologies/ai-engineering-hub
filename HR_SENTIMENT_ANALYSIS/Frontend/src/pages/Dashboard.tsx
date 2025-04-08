import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import SentimentDistribution from '../components/SentimentDistribution';
import SentimentTrends from '../components/SentimentTrends';
import { sentimentService } from '../services/sentimentService';
import { SentimentData } from '../types/sentiment';

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

const tabs = ['Overview', 'Departments', 'Locations'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [sentimentData, setSentimentData] = useState<SentimentData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await sentimentService.getSentimentData();
        setSentimentData(data);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        setError('No sentiment data available. Please upload feedback files to see the analysis.');
        setSentimentData(emptyData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Overall Sentiment',
      value: sentimentData.total > 0 ? `${sentimentData.positive.toFixed(1)}% Positive` : 'No data',
      subtitle: `${sentimentData.total.toLocaleString()} responses analyzed`,
      icon: TrendingUp,
    },
    {
      title: 'Responses Analyzed',
      value: sentimentData.total.toLocaleString(),
      subtitle: 'From uploaded feedback',
      icon: Users,
    },
    {
      title: 'Critical Issues',
      value: sentimentData.themes.filter(t => t.sentiment === 'negative').length.toString(),
      subtitle: 'Negative themes identified',
      icon: AlertTriangle,
    },
  ];

  const keyThemes = sentimentData.themes
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5)
    .map(theme => ({
      name: theme.name,
      mentions: theme.mentions,
      sentiment: theme.sentiment
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">An overview of employee sentiment analysis</p>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.subtitle}</p>
              </div>
              <stat.icon className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!loading && sentimentData.total > 0 && (
          <>
            <SentimentDistribution data={sentimentData} />
            <SentimentTrends data={sentimentData} />
          </>
        )}
      </div>

      {/* Bottom Grid */}
      {sentimentData.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Themes */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Key Themes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Top mentioned themes from employee feedback
            </p>
            <div className="space-y-4">
              {keyThemes.map((theme) => (
                <div key={theme.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${
                      theme.sentiment === 'positive' ? 'bg-green-400' : 
                      theme.sentiment === 'negative' ? 'bg-red-400' : 'bg-blue-400'
                    }`}></div>
                    <span>{theme.name}</span>
                  </div>
                  <span className="text-gray-600">{theme.mentions} mentions</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Analysis Summary</h2>
            <p className="text-sm text-gray-600 mb-4">
              Sentiment breakdown overview
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                <div>
                  <p className="text-sm font-medium">Positive Sentiment</p>
                  <p className="text-xs text-gray-500">{sentimentData.positive.toFixed(1)}% of responses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-400"></div>
                <div>
                  <p className="text-sm font-medium">Neutral Sentiment</p>
                  <p className="text-xs text-gray-500">{sentimentData.neutral.toFixed(1)}% of responses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-400"></div>
                <div>
                  <p className="text-sm font-medium">Negative Sentiment</p>
                  <p className="text-xs text-gray-500">{sentimentData.negative.toFixed(1)}% of responses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}