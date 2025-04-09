import React from 'react';
import { ThumbsUp, X } from 'lucide-react';
import { Recommendation } from '../types/recommendations';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onImplement: (id: string) => void;
  onDismiss: (id: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onImplement,
  onDismiss,
}) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High Impact':
        return 'bg-red-100 text-red-800';
      case 'Medium Impact':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low Impact':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = () => {
    if (recommendation.status === 'Implemented') {
      return (
        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
          Implemented
        </span>
      );
    } else if (recommendation.status === 'Dismissed') {
      return (
        <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
          Dismissed
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{recommendation.title}</h3>
        {getStatusBadge()}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {recommendation.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700"
          >
            {tag}
          </span>
        ))}
        <span
          className={`px-3 py-1 text-sm rounded-full ${getImpactColor(
            recommendation.impactLevel
          )}`}
        >
          {recommendation.impactLevel}
        </span>
      </div>

      <p className="text-gray-600 mb-6">{recommendation.description}</p>

      {recommendation.status === 'New' && (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onImplement(recommendation.id)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Implement</span>
          </button>
          <button
            onClick={() => onDismiss(recommendation.id)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <X className="w-4 h-4" />
            <span>Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard; 