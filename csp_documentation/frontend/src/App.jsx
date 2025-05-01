import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import { TemplateProvider } from './context/TemplateContext';
import { LoadingProvider } from './context/LoadingContext';
import './styles/global.css';

function App() {
  return (
    <Router>
      <TemplateProvider>
        <LoadingProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </LoadingProvider>
      </TemplateProvider>
    </Router>
  );
}

export default App; 