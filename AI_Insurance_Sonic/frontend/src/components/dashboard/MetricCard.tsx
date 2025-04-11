import React from 'react';

export type MetricVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down';
    description?: string;
  };
  icon?: React.ReactNode;
  variant?: MetricVariant;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  icon,
  variant = 'neutral' 
}) => {
  console.log(`Rendering MetricCard: ${title}`);
  
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'success':
        return 'text-green-500';
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  const getTrendClasses = (): string => {
    return trend?.direction === 'up' 
      ? 'text-green-500 bg-green-50' 
      : 'text-red-500 bg-red-50';
  };

  const getTrendIcon = (): string => {
    return trend?.direction === 'up' ? '↑' : '↓';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between">
        <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
        {icon && (
          <div className="h-10 w-10 rounded-full bg-opacity-10 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      
      <div className={`text-3xl font-bold mb-2 ${getVariantClasses()}`}>
        {value}
      </div>
      
      {trend && (
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTrendClasses()}`}>
            {getTrendIcon()} {trend.value}
          </span>
          {trend.description && (
            <span className="text-gray-500 text-xs ml-2">{trend.description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard; 