import React, { useState, useRef, useEffect } from 'react';
import { FaCheck, FaChevronDown } from 'react-icons/fa';

interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedOption: string;
  onSelect: (optionId: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedOption,
  onSelect,
  placeholder = 'Select an option',
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  console.log('Rendering Dropdown component');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the selected option label
  const getSelectedLabel = () => {
    const option = options.find(opt => opt.id === selectedOption);
    return option ? option.label : placeholder;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      
      <div
        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getSelectedLabel()}</span>
        <FaChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.id}
              className={`p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                option.id === selectedOption ? 'bg-[#3fa9f5] text-white hover:text-gray-500' : 'text-gray-900'
              }`}
              onClick={() => {
                onSelect(option.id);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.id === selectedOption && <FaCheck className="text-white" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown; 