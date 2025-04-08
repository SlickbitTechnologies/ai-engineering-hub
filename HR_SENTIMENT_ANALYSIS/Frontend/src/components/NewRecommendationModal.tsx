import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ImpactLevel } from '../types/recommendations';

interface NewRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recommendation: {
    title: string;
    description: string;
    department: string[];
    impactLevel: ImpactLevel;
    tags: string[];
  }) => void;
}

const NewRecommendationModal: React.FC<NewRecommendationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<string[]>([]);
  const [impactLevel, setImpactLevel] = useState<ImpactLevel>('Medium Impact');
  const [impactArea, setImpactArea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create tags from impact area
    const tags = [impactArea];
    
    // Add department to tags
    department.forEach(dept => {
      if (!tags.includes(dept)) {
        tags.push(dept);
      }
    });
    
    onSubmit({
      title,
      description,
      department,
      impactLevel,
      tags,
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setDepartment([]);
    setImpactLevel('Medium Impact');
    setImpactArea('');
    
    // Close modal
    onClose();
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDept = e.target.value;
    if (selectedDept === 'All Departments') return;
    
    if (department.includes(selectedDept)) {
      setDepartment(department.filter(d => d !== selectedDept));
    } else {
      setDepartment([...department, selectedDept]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Recommendation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter recommendation heading"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter recommendation description"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              onChange={handleDepartmentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All Departments">Select Department</option>
              <option value="IT">IT</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
            </select>
            {department.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {department.map((dept) => (
                  <span
                    key={dept}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                  >
                    {dept}
                    <button
                      type="button"
                      onClick={() => setDepartment(department.filter(d => d !== dept))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impact Area
            </label>
            <input
              type="text"
              value={impactArea}
              onChange={(e) => setImpactArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Work-life Balance, Career Growth"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impact Level
            </label>
            <select
              value={impactLevel}
              onChange={(e) => setImpactLevel(e.target.value as ImpactLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="High Impact">High Impact</option>
              <option value="Medium Impact">Medium Impact</option>
              <option value="Low Impact">Low Impact</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Recommendation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRecommendationModal; 