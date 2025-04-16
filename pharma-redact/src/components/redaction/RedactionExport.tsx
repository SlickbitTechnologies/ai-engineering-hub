"use client";

import React, { useState } from 'react';
import { RedactionEntity } from '@/types/redaction';

interface RedactionExportProps {
  entities: RedactionEntity[];
  documentName?: string;
}

/**
 * Component for exporting redaction entities to different formats
 */
export function RedactionExport({ entities, documentName = 'document' }: RedactionExportProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  
  // Convert entities to CSV format
  const generateCSV = () => {
    const headers = ['ID', 'Text', 'Type', 'Confidence', 'Page', 'X', 'Y', 'Width', 'Height', 'Context'];
    
    const rows = entities.map(entity => [
      entity.id,
      `"${entity.text.replace(/"/g, '""')}"`, // Escape quotes in CSV
      entity.type,
      entity.confidence.toFixed(2),
      (entity.page + 1).toString(),
      entity.coordinates.x.toFixed(2),
      entity.coordinates.y.toFixed(2),
      entity.coordinates.width.toFixed(2),
      entity.coordinates.height.toFixed(2),
      entity.context ? `"${entity.context.replace(/"/g, '""')}"` : ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };
  
  // Convert entities to JSON format
  const generateJSON = () => {
    // Create a simplified version of entities for export
    const exportData = entities.map(entity => ({
      id: entity.id,
      text: entity.text,
      type: entity.type,
      confidence: entity.confidence,
      page: entity.page + 1, // Make page 1-indexed for export
      coordinates: {
        x: entity.coordinates.x,
        y: entity.coordinates.y,
        width: entity.coordinates.width,
        height: entity.coordinates.height
      },
      context: entity.context || null
    }));
    
    return JSON.stringify(exportData, null, 2);
  };
  
  // Handle export button click
  const handleExport = () => {
    let data: string;
    let mimeType: string;
    let fileExtension: string;
    
    if (exportFormat === 'csv') {
      data = generateCSV();
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      data = generateJSON();
      mimeType = 'application/json';
      fileExtension = 'json';
    }
    
    // Create a sanitized filename
    const sanitizedDocName = documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `redaction_report_${sanitizedDocName}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    
    // Create and trigger download
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-white rounded-md shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Export Redactions</h3>
      
      {entities.length === 0 ? (
        <p className="text-gray-500">No entities to export.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Export {entities.length} redacted items to analyze or share with your team.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button 
                className={`px-3 py-2 text-sm ${exportFormat === 'csv' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-white text-gray-600'}`}
                onClick={() => setExportFormat('csv')}
              >
                CSV Format
              </button>
              <button 
                className={`px-3 py-2 text-sm ${exportFormat === 'json' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-white text-gray-600'}`}
                onClick={() => setExportFormat('json')}
              >
                JSON Format
              </button>
            </div>
            
            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as {exportFormat.toUpperCase()}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 