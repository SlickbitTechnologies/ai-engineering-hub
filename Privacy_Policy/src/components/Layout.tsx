import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Settings, LayoutDashboard, ShieldCheck } from 'lucide-react';
import UserProfile from './auth/UserProfile';
import Logo from './ui/Logo';
import Icon from './ui/Icon';
import { theme } from '../styles/theme';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShieldCheck, label: 'Compliance', path: '/compliance' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: theme.colors.background.secondary }}>
      {/* Sidebar */}
      <aside className="fixed left-0 h-full w-64 shadow-md z-10" style={{ backgroundColor: theme.colors.background.primary }}>
        <div className="p-6">
          <div className="mb-8">
            <Logo size="lg" />
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50'
                      : 'hover:bg-neutral-50'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? theme.colors.primary[50] : 'transparent',
                    color: isActive ? theme.colors.primary[600] : theme.colors.neutral[600]
                  }}
                >
                  <Icon 
                    icon={item.icon} 
                    variant={isActive ? 'primary' : 'neutral'} 
                    size="sm"
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="fixed top-0 right-0 left-64 shadow-sm z-10" style={{ backgroundColor: theme.colors.background.primary }}>
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.neutral[800] }}>
                {menuItems.find((item) => item.path === location.pathname)?.label || 'Upload Policy'}
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
        <div className="pt-24 min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  );
}