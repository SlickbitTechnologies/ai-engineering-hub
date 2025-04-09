import React, { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import NewRecommendationModal from './NewRecommendationModal';
import { Recommendation, RecommendationStatus, ImpactLevel } from '../types/recommendations';

const HRRecommendations: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [selectedImpact, setSelectedImpact] = useState<string>('All Impact Levels');
  const [activeTab, setActiveTab] = useState<RecommendationStatus>('New');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleImplement = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/recommendations/${id}/implement`, {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error('Failed to implement recommendation');
      }
      setRecommendations(recommendations.map(rec => 
        rec.id === id ? { ...rec, status: 'Implemented' as RecommendationStatus } : rec
      ));
    } catch (error) {
      console.error('Error implementing recommendation:', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/recommendations/${id}/dismiss`, {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error('Failed to dismiss recommendation');
      }
      setRecommendations(recommendations.map(rec => 
        rec.id === id ? { ...rec, status: 'Dismissed' as RecommendationStatus } : rec
      ));
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const handleNewRecommendation = () => {
    setIsModalOpen(true);
  };

  const handleCreateRecommendation = async (newRecommendation: {
    title: string;
    description: string;
    department: string[];
    impactLevel: ImpactLevel;
    tags: string[];
  }) => {
    try {
      const response = await fetch('http://localhost:8000/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecommendation),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create recommendation');
      }
      
      const createdRecommendation = await response.json();
      setRecommendations([createdRecommendation, ...recommendations]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating recommendation:', error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const departmentMatch = selectedDepartment === 'All Departments' || rec.department.includes(selectedDepartment);
    const impactMatch = selectedImpact === 'All Impact Levels' || rec.impactLevel === selectedImpact;
    const statusMatch = rec.status === activeTab;
    return departmentMatch && impactMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">HR Recommendations</h1>
          <p className="text-gray-600">AI-generated suggestions based on sentiment analysis</p>
        </div>
        <button 
          onClick={handleNewRecommendation}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Recommendation</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by:</span>
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 border rounded-md text-sm"
        >
          <option>All Departments</option>
          <option>IT</option>
          <option>Engineering</option>
          <option>Sales</option>
          <option>Design</option>
        </select>
        <select
          value={selectedImpact}
          onChange={(e) => setSelectedImpact(e.target.value)}
          className="px-4 py-2 border rounded-md text-sm"
        >
          <option>All Impact Levels</option>
          <option>High Impact</option>
          <option>Medium Impact</option>
          <option>Low Impact</option>
        </select>
      </div>

      <div className="flex space-x-6 border-b mb-6">
        <button
          onClick={() => setActiveTab('New')}
          className={`pb-4 px-2 text-sm font-medium relative ${
            activeTab === 'New'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500'
          }`}
        >
          New Recommendations
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            {recommendations.filter(r => r.status === 'New').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Implemented')}
          className={`pb-4 px-2 text-sm font-medium relative ${
            activeTab === 'Implemented'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500'
          }`}
        >
          Implemented
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            {recommendations.filter(r => r.status === 'Implemented').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Dismissed')}
          className={`pb-4 px-2 text-sm font-medium relative ${
            activeTab === 'Dismissed'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500'
          }`}
        >
          Dismissed
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            {recommendations.filter(r => r.status === 'Dismissed').length}
          </span>
        </button>
      </div>

      <div className="grid gap-6">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No recommendations found for the selected filters.</p>
          </div>
        ) : (
          filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onImplement={handleImplement}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      <NewRecommendationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRecommendation}
      />
    </div>
  );
};

export default HRRecommendations; 