'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Template Enrichment Component
 * 
 * Adds a UI element to enrich templates when a redaction error is detected
 */
export default function TemplateEnrichment({ templateIds = [], onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  
  const handleEnrichTemplate = async (templateId) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError('');
    setResults(null);
    
    try {
      // Add devBypass=true for development mode
      const isDev = process.env.NODE_ENV === 'development';
      const devParam = isDev ? '&devBypass=true' : '';
      
      // Call our API endpoint to enrich the template
      const response = await fetch(`/api/enrich-templates?template=${templateId}${devParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to enrich template');
      }
      
      setResults(data);
      
      // If successful, notify parent component
      if (data.success && onComplete) {
        onComplete(templateId);
      }
    } catch (err) {
      console.error('Error enriching template:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleEnrichAllTemplates = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError('');
    setResults(null);
    
    try {
      // Add devBypass=true for development mode
      const isDev = process.env.NODE_ENV === 'development';
      const devParam = isDev ? '&devBypass=true' : '';
      
      // Call our API endpoint to enrich all user templates
      const response = await fetch(`/api/enrich-templates?all=true${devParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to enrich templates');
      }
      
      setResults(data);
      
      // If successful, notify parent component
      if (data.success && onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error enriching templates:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Don't render anything if no template IDs provided
  if (!templateIds.length) return null;
  
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Template Metadata Issue Detected
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              Your template rules are missing required version or checksum metadata. 
              This can be fixed automatically by enriching your templates.
            </p>
            {templateIds.length === 1 ? (
              <p className="mt-2">
                <button
                  className="px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-md text-amber-800 text-sm font-medium hover:bg-amber-200 disabled:opacity-50"
                  onClick={() => handleEnrichTemplate(templateIds[0])}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Fix Selected Template'}
                </button>
              </p>
            ) : (
              <p className="mt-2">
                <button
                  className="px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-md text-amber-800 text-sm font-medium hover:bg-amber-200 disabled:opacity-50 mr-2"
                  onClick={() => handleEnrichTemplate(templateIds[0])}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Fix Template (${templateIds[0].substring(0, 8)}...)`}
                </button>
                <button
                  className="px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-md text-amber-800 text-sm font-medium hover:bg-amber-200 disabled:opacity-50"
                  onClick={handleEnrichAllTemplates}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Fix All My Templates'}
                </button>
              </p>
            )}
          </div>
          
          {/* Show errors */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}
          
          {/* Show results */}
          {results && results.success && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              {results.updatedCount > 0 ? (
                <span>Template updated with {results.updatedCount} rule checksums added</span>
              ) : (
                <span>All rules already have proper metadata</span>
              )}
            </div>
          )}
          
          {/* Show batch results */}
          {results && results.success && results.totalTemplates && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Templates updated successfully</span>
              </div>
              <ul className="mt-1 text-xs pl-5 list-disc">
                <li>Total templates: {results.totalTemplates}</li>
                <li>Templates updated: {results.updatedTemplates}</li>
                <li>Rules updated: {results.updatedRules}</li>
                {results.errors.length > 0 && (
                  <li className="text-amber-800">Errors: {results.errors.length}</li>
                )}
              </ul>
              {results.updatedTemplates > 0 && (
                <p className="mt-1">
                  <button
                    className="text-green-700 text-xs underline"
                    onClick={() => window.location.reload()}
                  >
                    Reload page to apply changes
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 