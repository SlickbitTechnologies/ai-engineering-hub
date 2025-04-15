"use client";

import React from 'react';
import { RedactionEntity } from '@/types/redaction';

interface EntityCardProps {
  entity: RedactionEntity;
  onNavigateToPage?: (page: number) => void;
}

/**
 * Component to display a redaction entity in a card format
 */
export function EntityCard({ entity, onNavigateToPage }: EntityCardProps) {
  // Format confidence as percentage
  const confidencePercentage = Math.round(entity.confidence * 100);
  
  // Get appropriate color based on entity type
  const getTypeColor = () => {
    const type = entity.type.toUpperCase();
    
    if (type.includes('PERSON') || type.includes('NAME') || type.includes('EMAIL') || type.includes('PHONE')) {
      return 'bg-blue-100 text-blue-800';
    }
    
    if (type.includes('FINANCIAL') || type.includes('ACCOUNT') || type.includes('CARD') || type.includes('SSN')) {
      return 'bg-green-100 text-green-800';
    }
    
    if (type.includes('MEDICAL') || type.includes('HEALTH') || type.includes('DIAGNOSIS')) {
      return 'bg-red-100 text-red-800';
    }
    
    if (type.includes('DATE') || type.includes('TIME') || type.includes('YEAR')) {
      return 'bg-purple-100 text-purple-800';
    }
    
    if (type.includes('ADDRESS') || type.includes('LOCATION')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    return 'bg-gray-100 text-gray-800';
  };
  
  // Get appropriate color based on confidence level
  const getConfidenceColor = () => {
    if (confidencePercentage >= 90) return 'bg-green-100 text-green-800';
    if (confidencePercentage >= 75) return 'bg-blue-100 text-blue-800';
    if (confidencePercentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex flex-col gap-3">
        {/* Header with type and confidence */}
        <div className="flex justify-between items-start">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
            {entity.type}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor()}`}>
            {confidencePercentage}% Confidence
          </span>
        </div>
        
        {/* Redacted text */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Redacted Text:</p>
          <div className="p-2 bg-gray-50 rounded border border-gray-200">
            <p className="font-medium text-gray-900 break-words">{entity.text}</p>
          </div>
        </div>
        
        {/* Page information with navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600">Page {entity.page + 1}</span>
          </div>
          
          {onNavigateToPage && (
            <button
              onClick={() => onNavigateToPage(entity.page)}
              className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              View on page
              <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Context if available */}
        {entity.context && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Context:</p>
            <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-200">
              "...{entity.context}..."
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 