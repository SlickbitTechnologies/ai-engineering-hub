import React from 'react';

interface PdfViewerProps {
  url: string;
  title: string;
}

/**
 * A reusable PDF viewer component that renders PDFs with toolbar
 * This component tries multiple approaches to ensure the PDF toolbar displays properly:
 * 1. First with an object tag with parameters
 * 2. Falls back to an iframe with sandbox permissions if needed
 */
const PdfViewer: React.FC<PdfViewerProps> = ({ url, title }) => {
  if (!url) return null;
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Primary method using object tag */}
      <object
        data={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
        type="application/pdf"
        className="w-full h-full"
        title={title}
        aria-label={title}
      >
        {/* Fallback for browsers that don't support object properly */}
        <iframe
          src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          className="w-full h-full border-0"
          title={title}
          aria-label={title}
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
        
        {/* Final fallback if neither works */}
        <p className="p-4 text-center">
          Your browser does not support embedded PDFs.{' '}
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Download the PDF
          </a> instead.
        </p>
      </object>
    </div>
  );
};

export default PdfViewer; 