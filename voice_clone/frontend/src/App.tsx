import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VoiceRecordingPage, DocumentUploadPage } from './pages';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<VoiceRecordingPage />} />
            <Route path="/upload-document" element={<DocumentUploadPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
