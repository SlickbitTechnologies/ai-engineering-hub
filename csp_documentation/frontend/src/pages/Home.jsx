import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';


function Home() {
  return (
    <div className="page-container">
      <div className="content-container">
        <div className="text-center mb-16">
          <h1 className="page-title">Meta-Doc Automator</h1>
          <p className="page-description">
            Extract metadata from clinical and regulatory documents in SharePoint
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-24">
          <Link to="/documents" className="hover:text-gray-200">
            <button className="button-primary">
              <svg className="small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Connect to SharePoint</span>
            </button>
          </Link>
          
          <Link to="/settings" className="hover:text-gray-200">
            <button className="button-primary">
              Configure Templates
            </button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-8">How It Works</h2>
          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="w-8 h-8 bg-[#0098B3] text-white rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="section-title mb-2">Connect to SharePoint</h3>
                <p className="section-description">Connect to your SharePoint repository to access your documents.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-8 h-8 bg-[#0098B3] text-white rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="section-title mb-2">Select Template</h3>
                <p className="section-description">Choose a template that matches your document type for accurate metadata extraction.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-8 h-8 bg-[#0098B3] text-white rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="section-title mb-2">Classify Documents</h3>
                <p className="section-description">The system will automatically classify and extract metadata from your documents.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-8 h-8 bg-[#0098B3] text-white rounded-full flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="section-title mb-2">Export Data</h3>
                <p className="section-description">Export the structured metadata to CSV or Excel format.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 