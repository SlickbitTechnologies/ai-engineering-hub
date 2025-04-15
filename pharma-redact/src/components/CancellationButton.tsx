import React from 'react';
import { FiX } from 'react-icons/fi';

interface CancellationButtonProps {
  isProcessing: boolean;
  onCancel: () => void;
  className?: string;
}

const CancellationButton: React.FC<CancellationButtonProps> = ({
  isProcessing,
  onCancel,
  className = '',
}) => {
  if (!isProcessing) return null;

  return (
    <button
      onClick={onCancel}
      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${className}`}
      aria-label="Cancel processing"
    >
      <FiX className="mr-1.5 -ml-0.5 h-4 w-4" aria-hidden="true" />
      Cancel
    </button>
  );
};

export default CancellationButton; 