import React, { useState } from 'react';
import Select from 'react-select';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
}

export interface FilterValues {
  categories: string[];
  sentiments: string[];
  kpiScore: {
    min: number;
    max: number;
  };
}

const categoryOptions = [
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'service', label: 'Service' }
];

const sentimentOptions = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' }
];

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderColor: state.isFocused ? '#00aff0' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 1px #00aff0' : 'none',
    '&:hover': {
      borderColor: '#00aff0'
    }
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#00aff0' : state.isFocused ? '#e5e7eb' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:hover': {
      backgroundColor: state.isSelected ? '#00aff0' : '#e5e7eb'
    }
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: '#e5e7eb'
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: '#374151'
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: '#374151',
    '&:hover': {
      backgroundColor: '#d1d5db',
      color: '#374151'
    }
  })
};

const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, onApplyFilters }) => {
  const [filters, setFilters] = useState<FilterValues>({
    categories: [],
    sentiments: [],
    kpiScore: { min: 0, max: 100 }
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <Select
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter(option => filters.categories.includes(option.value))}
                onChange={(selected) => setFilters({
                  ...filters,
                  categories: selected ? selected.map(option => option.value) : []
                })}
                styles={customSelectStyles}
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>

            {/* Sentiments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sentiments
              </label>
              <Select
                isMulti
                options={sentimentOptions}
                value={sentimentOptions.filter(option => filters.sentiments.includes(option.value))}
                onChange={(selected) => setFilters({
                  ...filters,
                  sentiments: selected ? selected.map(option => option.value) : []
                })}
                styles={customSelectStyles}
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>

            {/* KPI Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KPI Score Range: {filters.kpiScore.min}%
              </label>
              <div className="space-y-2">
                <style>
                  {`
                    .range-slider {
                      height: 8px;
                      background: linear-gradient(to right, #00aff0 0%, #00aff0 ${filters.kpiScore.min}%, #e5e7eb ${filters.kpiScore.min}%, #e5e7eb 100%);
                      border-radius: 8px;
                      outline: none;
                      transition: background 450ms ease-in;
                      -webkit-appearance: none;
                    }
                    
                    .range-slider::-webkit-slider-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: white;
                      box-shadow: 0 0 4px rgba(0,0,0,0.2);
                      cursor: pointer;
                      -webkit-appearance: none;
                      border: 3px solid #00aff0;
                    }
                    
                    .range-slider::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: white;
                      box-shadow: 0 0 4px rgba(0,0,0,0.2);
                      cursor: pointer;
                      border: 3px solid #00aff0;
                    }
                  `}
                </style>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.kpiScore.min}
                  onChange={(e) => setFilters({
                    ...filters,
                    kpiScore: { ...filters.kpiScore, min: Number(e.target.value) }
                  })}
                  className="range-slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#00aff0] rounded-md hover:bg-[#009ed7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00aff0]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer; 