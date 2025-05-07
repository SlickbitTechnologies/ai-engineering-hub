import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Settings, X, Thermometer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile, onClose }) => {
  const { currentUser } = useAuth();
  
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Sidebar header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center">
          <Thermometer className="h-6 w-6 text-cyan-700" />
          <span className="ml-2 text-lg font-medium text-gray-800">Cold Chain Monitor</span>
        </div>
        {mobile && (
          <button onClick={onClose} className="h-10 w-10 rounded-full flex items-center justify-center">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex-1 px-3 space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Navigation
          </h3>
          
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive 
                  ? 'bg-cyan-50 text-cyan-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Home className="mr-3 h-5 w-5 text-gray-500" />
            Home
          </NavLink>
          
          {currentUser && (
            <>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-cyan-50 text-cyan-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <LayoutDashboard className="mr-3 h-5 w-5 text-gray-500" />
                Dashboard
              </NavLink>
              
              <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-cyan-50 text-cyan-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Settings className="mr-3 h-5 w-5 text-gray-500" />
                Settings
              </NavLink>
            </>
          )}
        </div>
      </div>
      
      {currentUser && (
        <div className="flex-shrink-0 px-3 py-4 border-t border-gray-200">
          <div className="flex items-center px-2">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-cyan-700 flex items-center justify-center text-white">
                {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 truncate">
                {currentUser.displayName || currentUser.email}
              </p>
              <p className="text-xs font-medium text-gray-500 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;