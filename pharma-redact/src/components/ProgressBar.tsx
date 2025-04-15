import React from 'react';

interface ProgressBarProps {
  progress: number;
  status?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status, 
  className = '' 
}) => {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`w-full ${className}`}>
      <div className="relative pt-1">
        {status && (
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold inline-block text-primary-600">
                {status}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-primary-600">
                {safeProgress.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
          <div 
            style={{ width: `${safeProgress}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-300"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar; 