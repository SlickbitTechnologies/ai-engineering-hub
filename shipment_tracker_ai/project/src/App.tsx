import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ShipmentDetailPage from './pages/ShipmentDetailPage';

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    console.log('Auth state:', { currentUser, loading });
    const timer = setTimeout(() => {
      console.log('Setting app ready');
      setAppReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentUser, loading]);

  console.log('Render state:', { loading, appReady, currentUser });

  if (loading || !appReady) {
    console.log('Showing loading spinner');
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      {!currentUser ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="shipment/:id" element={<ShipmentDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
};

export default App;