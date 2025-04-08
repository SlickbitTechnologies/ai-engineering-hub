import React, { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight, Target, Clock, AlertTriangle, Brain } from 'lucide-react';
import { sentimentService } from '../services/sentimentService';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  timeframe: string;
  department: string;
  priority: string;
}

export default function Recommendations() {
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/api/recommendations');
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        const data = await response.json();
        
        // Transform data to match our interface
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          impact: item.impactLevel === 'High Impact' ? 'High' : 
                 item.impactLevel === 'Medium Impact' ? 'Medium' : 'Low',
          timeframe: item.tags.includes('Short-term') ? 'Short-term' : 'Medium-term',
          department: item.department.join(', '),
          priority: item.impactLevel === 'High Impact' ? 'high' : 
                   item.impactLevel === 'Medium Impact' ? 'medium' : 'low'
        }));
        
        setRecommendations(formattedData);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError('No recommendations available. Please upload feedback files to generate recommendations.');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecommendations = recommendations.filter(
    rec => selectedPriority === 'all' || rec.priority === selectedPriority
  );
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading recommendations...</div>
      </div>
    );
  }
  
  // No data state
  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">HR Recommendations</h1>
          <Lightbulb className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="mb-4">
            <Brain className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No recommendations available</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please upload feedback files to generate HR recommendations based on sentiment analysis.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">HR Recommendations</h1>
          <Lightbulb className="w-6 h-6 text-blue-600" />
        </div>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
          <h2 className="text-lg font-semibold text-red-900">High Priority</h2>
          <p className="text-sm text-red-700 mt-1">
            {recommendations.filter(r => r.priority === 'high').length} items require immediate attention
          </p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <Clock className="w-8 h-8 text-yellow-600 mb-2" />
          <h2 className="text-lg font-semibold text-yellow-900">Medium Priority</h2>
          <p className="text-sm text-yellow-700 mt-1">
            {recommendations.filter(r => r.priority === 'medium').length} items to address soon
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <Target className="w-8 h-8 text-green-600 mb-2" />
          <h2 className="text-lg font-semibold text-green-900">Low Priority</h2>
          <p className="text-sm text-green-700 mt-1">
            {recommendations.filter(r => r.priority === 'low').length} items for future consideration
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRecommendations.map((rec) => (
          <div key={rec.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{rec.title}</h3>
                <p className="text-gray-600">{rec.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(rec.priority)}`}>
                {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Impact: {rec.impact}</span>
                <span>•</span>
                <span>Timeframe: {rec.timeframe}</span>
                <span>•</span>
                <span>{rec.department}</span>
              </div>
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}