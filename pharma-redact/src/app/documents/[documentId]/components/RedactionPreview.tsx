"use client";

import { useState, useEffect } from "react";
import { RedactionPreview as IRedactionPreview, PDFProcessor } from "@/utils/pdf-processor";
import { RedactionTemplate } from "@/types/redaction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, Loader2 } from "lucide-react";

interface RedactionPreviewProps {
  documentId: string;
  documentFile: Uint8Array;
  template: RedactionTemplate;
  onContinue: () => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

export function RedactionPreview({
  documentId,
  documentFile,
  template,
  onContinue,
  onCancel,
  onError
}: RedactionPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<IRedactionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Generate preview when component mounts
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Call the PDFProcessor to generate a preview
        const preview = await PDFProcessor.generatePreview(documentFile, template);
        setPreviewData(preview);
      } catch (err: any) {
        console.error("Error generating preview:", err);
        setError(err.message || "Failed to generate preview");
        onError(err.message || "Failed to generate preview");
      } finally {
        setIsLoading(false);
      }
    };
    
    generatePreview();
  }, [documentFile, template, documentId, onError]);
  
  // Group entities by type
  const entitiesByType: Record<string, number> = {};
  if (previewData?.previewEntities) {
    previewData.previewEntities.forEach(entity => {
      entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
    });
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Analyzing document...</h3>
        <p className="text-gray-600 text-sm mt-2">
          We're scanning sample pages to estimate redactions
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-lg font-medium text-red-700 mb-2">Preview Generation Failed</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onContinue}>
            Continue Anyway
          </Button>
        </div>
      </div>
    );
  }
  
  if (!previewData) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">No preview data available</p>
        <div className="flex justify-center gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onContinue}>
            Continue Anyway
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <EyeIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-1">Redaction Preview</h3>
            <p className="text-blue-700">
              We analyzed {previewData.samplePages.length} {previewData.samplePages.length === 1 ? 'page' : 'pages'} of your {previewData.pageCount}-page document to estimate what will be redacted.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estimated Redactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary-600 mb-2">
              ~{previewData.totalEntitiesEstimate}
            </div>
            <p className="text-gray-600">estimated sensitive items will be redacted</p>
            
            {previewData.totalEntitiesEstimate === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 text-sm">
                  No sensitive information was detected in the sample pages. 
                  The document may be already redacted or contain no sensitive information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Types of Information</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(entitiesByType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(entitiesByType)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <Badge variant="outline" className="capitalize">
                        {type.toLowerCase().replace('_', ' ')}
                      </Badge>
                      <span className="text-gray-700 font-medium">{count} found</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No entities detected in sample pages</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {previewData.previewEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Redactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Text
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.previewEntities.map((entity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entity.text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge variant="secondary" className="capitalize">
                          {entity.type.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entity.page + 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onContinue}>
          Continue with Processing
        </Button>
      </div>
    </div>
  );
} 