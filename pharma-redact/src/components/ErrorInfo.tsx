import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ErrorInfoProps {
  error: string | null;
  suggestion?: string;
  className?: string;
}

const ErrorInfo: React.FC<ErrorInfoProps> = ({
  error,
  suggestion,
  className = '',
}) => {
  if (!error) return null;

  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            {suggestion && <p className="mt-1 font-medium">{suggestion}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorInfo; 