'use client';

import { Settings } from 'lucide-react';

export default function Templates() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Redaction Settings</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Settings className="h-16 w-16 text-chateau-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Redaction Templates</h2>
        <p className="text-gray-600 text-center max-w-md">
          This is a placeholder page for redaction settings and templates.
        </p>
      </div>
    </div>
  );
} 