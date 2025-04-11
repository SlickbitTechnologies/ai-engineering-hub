import React from 'react';
import { useLocation } from 'react-router-dom';
import { FaSearch, FaBell, FaUser } from 'react-icons/fa';

interface HeaderProps {
  title?: string;
  date?: string;
}

const Header: React.FC<HeaderProps> = ({ title, date }) => {
  console.log('Rendering Header component');
  
  const location = useLocation();
  
  // Determine title based on the current route if not explicitly provided
  const getTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/analyze':
        return 'Analyze';
      case '/calls':
        return 'Calls';
      case '/configuration':
        return 'Configuration';
      default:
        return 'Dashboard';
    }
  };
  
  // Get current date if not provided
  const currentDate = date || new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm border-b">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{getTitle()}</h1>
        <p className="text-gray-500 text-sm">{currentDate}</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-transparent w-64"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <FaSearch />
          </div>
        </div>
        
        <div className="relative cursor-pointer">
          <FaBell className="text-xl text-gray-600 hover:text-gray-900" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">1</span>
          </div>
        </div>
        
        <div className="h-8 w-8 bg-[#00aff0] bg-opacity-20 rounded-full cursor-pointer flex items-center justify-center text-[#00aff0] hover:bg-opacity-30">
          <FaUser size={14} />
        </div>
      </div>
    </div>
  );
};

export default Header; 