import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaChartBar, FaCog, FaBars, FaTimes } from 'react-icons/fa';
import { LuFileAudio } from "react-icons/lu";

interface SidebarProps {
  logoSrc?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ logoSrc }) => {
  console.log('Rendering Sidebar component');
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    console.log('Toggling sidebar, collapsed:', !collapsed);
  };
  
  const menuItems = [
    { id: 1, name: 'Dashboard', icon: <FaHome size={18} />, path: '/' },
    { id: 2, name: 'Analyze', icon: <FaChartBar size={18} />, path: '/analyze' },
    { id: 3, name: 'Calls', icon: <LuFileAudio size={18} />, path: '/calls' },
    { id: 4, name: 'Configuration', icon: <FaCog size={18} />, path: '/configuration' },
  ];

  // Collapsed sidebar
  if (collapsed) {
    return (
      <div className="w-16 min-h-screen bg-white shadow-sm flex flex-col transition-all duration-300">
        <div className="p-4 flex justify-center items-center">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
            <FaBars size={20} />
          </button>
        </div>
        
        <nav className="mt-8 flex-1">
          <ul className="flex flex-col items-center">
            {menuItems.map((item) => (
              <li key={item.id} className="mb-6">
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center justify-center h-10 w-10 rounded-md transition-colors duration-200 ${
                      isActive 
                        ? 'bg-blue-50 text-[#00aff0]' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                  title={item.name}
                >
                  {item.icon}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto p-4 flex justify-center border-t">
          <div className="h-8 w-8 bg-[#00aff0] bg-opacity-20 rounded-full text-[#00aff0] flex items-center justify-center">
            I
          </div>
        </div>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <div className="w-56 min-h-screen bg-white shadow-sm flex flex-col transition-all duration-300">
      <div className="p-4 flex items-center border-b">
        {logoSrc ? (
          <img src={logoSrc} alt="Sonic Logo" className="h-8 w-8 mr-2" />
        ) : (
          <div className="h-8 w-8 bg-[#00aff0] rounded text-white flex items-center justify-center mr-2">
            <LuFileAudio size={20} color="#ffffff" />
          </div>
        )}
        <span className="text-xl font-bold text-[#00aff0]">Sonic</span>
        <button onClick={toggleSidebar} className="ml-auto text-gray-500 hover:text-gray-700">
          <FaTimes size={18} />
        </button>
      </div>
      
      <nav className="mt-4 flex-1">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="mb-1 px-2">
              <NavLink 
                to={item.path}
                className={({ isActive }) => 
                  `px-4 py-3 flex items-center rounded-md transition-colors duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-[#00aff0]' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto p-4 border-t w-full">
        <div className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
          <div className="h-8 w-8  bg-opacity-20 rounded-full text-[#00aff0] flex items-center justify-center mr-2">
            <LuFileAudio size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Insurance Sonic</p>
            <p className="text-xs text-gray-500">AI Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 