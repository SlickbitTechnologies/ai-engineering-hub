import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#EF4444',
  text
}) => {
  return (
    <div className={`spinner-wrapper ${size}`}>
      <div className="spinner-container">
        <div className="spinner" style={{ borderTopColor: color }}></div>
      </div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );
};

export default LoadingSpinner; 