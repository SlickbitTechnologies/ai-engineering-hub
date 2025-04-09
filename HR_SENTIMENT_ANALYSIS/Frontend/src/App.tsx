import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import SentimentAnalysis from './pages/SentimentAnalysis';
import TrendInsights from './pages/TrendInsights';
import Recommendations from './pages/Recommendations';
import Settings from './pages/Settings';
import HRRecommendations from './components/HRRecommendations';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <Layout>
                <Upload />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sentiment"
          element={
            <PrivateRoute>
              <Layout>
                <SentimentAnalysis />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/trends"
          element={
            <PrivateRoute>
              <Layout>
                <TrendInsights />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <PrivateRoute>
              <Layout>
                <HRRecommendations />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;