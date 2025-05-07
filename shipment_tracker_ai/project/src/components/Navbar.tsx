import React, { useState } from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useShipments } from '../contexts/ShipmentContext';
import NotificationCenter from './NotificationCenter';
import Logo from '../assets/slickbitLogo.png';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const { shipments } = useShipments();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Count unread alerts across all shipments
  const unreadAlerts = shipments.reduce((count, shipment) => {
    return count + shipment.alerts.filter(alert => !alert.read).length;
  }, 0);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 flex">
      <button
        type="button"
        className="px-4 md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6 text-gray-500" />
      </button>
      
      <div className="flex-1 flex justify-between px-4 md:px-0 items-center">
        <div className="flex-1 flex items-center ml-2 md:ml-6">
          <h1 className="text-xl font-semibold text-gray-800">Cold Chain Monitor</h1>
        </div>

        <div>
          <img src={Logo} alt="Logo" height={50} width={100} />
        </div>
        
        {currentUser && (
          <div className="ml-4 flex items-center md:ml-6">
            {/* Notifications */}
            <div className="relative ml-3">
              <button
                className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <span className="sr-only">View notifications</span>
                <div className="relative">
                  <Bell className="h-6 w-6 text-gray-500" />
                  {unreadAlerts > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500">
                      <span className="sr-only">{unreadAlerts} unread notifications</span>
                    </span>
                  )}
                </div>
              </button>
              
              <NotificationCenter 
                isOpen={notificationsOpen} 
                onClose={() => setNotificationsOpen(false)} 
              />
            </div>
            
            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600"
                  id="user-menu-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-cyan-700 flex items-center justify-center text-white">
                    {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                  </div>
                </button>
              </div>

              <div
                className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transition transform ${
                  dropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                }`}
              >
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                >
                  <LogOut className="mr-2 h-4 w-4 text-gray-400" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;