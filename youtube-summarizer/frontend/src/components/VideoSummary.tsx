import React, { useState, useEffect } from 'react';
import { VideoSummary as VideoSummaryType } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './VideoSummary.css';

interface VideoSummaryProps {
  summary: VideoSummaryType;
  onClose: () => void;
}

const VideoSummary: React.FC<VideoSummaryProps> = ({ summary, onClose }) => {
  // Remove loading state since we want to show the summary immediately
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the summary with a slight delay for a smoother transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={`summary-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="summary-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{summary.title}</h2>
        
        <div className="summary-section">
          <h3>Summary</h3>
          <p>{summary.summary}</p>
        </div>
        
        <div className="summary-section">
          <h3>Key Points</h3>
          <ul>
            {summary.key_points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
        
        <div className="summary-section">
          <h3>Action Items</h3>
          <ul>
            {summary.action_items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        
        <div className="summary-section">
          <h3>Takeaways</h3>
          <ul>
            {summary.takeaways && summary.takeaways.map((takeaway, index) => (
              <li key={index}>{takeaway}</li>
            ))}
          </ul>
        </div>
        
        <div className="summary-section">
          <h3>Actionable Insights</h3>
          <ul>
            {summary.actionable_insights && summary.actionable_insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
        
        <div className="summary-actions">
          <button className="back-button" onClick={onClose}>
            Back to Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSummary; 