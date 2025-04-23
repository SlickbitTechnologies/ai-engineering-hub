import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-[#0098B3] text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
          </svg>
          <Link to="/" className="text-xl font-medium">
            Meta-Doc Automator
          </Link>
        </div>
        
        <div className="flex space-x-6">
          <Link to="/" className="hover:text-gray-200">Home</Link>
          <Link to="/documents" className="hover:text-gray-200">Documents</Link>
          <Link to="/settings" className="hover:text-gray-200">Settings</Link>
          {/* <button className="bg-[#006D80] text-white px-4 py-1 rounded-md flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Connect to SharePoint and Classify Documents</span>
          </button> */}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 