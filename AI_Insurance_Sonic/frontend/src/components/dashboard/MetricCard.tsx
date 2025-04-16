import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
    description: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'danger';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon}) => {

  const getTrendClasses = () => {
    if (!trend) return '';
    return trend.direction === 'up' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div>{icon}</div>}
      </div>
      <div className={`text-3xl font-bold mb-2 text-gray-900`}>
        {value}
      </div>
      {trend && (
        <div className="flex items-center">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getTrendClasses()}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </div>
          <span className="ml-2 text-sm text-gray-500">{trend.description}</span>
        </div>
      )}
    </div>
  );
}

export default MetricCard; 