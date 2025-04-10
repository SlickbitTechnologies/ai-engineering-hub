"use client";

import { Document } from "@/store/slices/documentsSlice";
import { formatDistanceToNow } from "date-fns";

interface DocumentCardProps {
  document: Document;
  onClick?: () => void;
}

export function DocumentCard({ document, onClick }: DocumentCardProps) {
  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "redacted":
        return "bg-chateau-green-100 text-chateau-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Document["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "redacted":
        return "Redacted";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div 
      onClick={onClick} 
      className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-chateau-green-100">
            {document.type === "pdf" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-chateau-green-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 15v-2h6v2" />
                <path d="M12 15v4" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-chateau-green-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{document.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{document.type.toUpperCase()}</span>
              <span>•</span>
              <span>{formatFileSize(document.size)}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(document.status)}`}>
          {getStatusText(document.status)}
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Source: {document.source.charAt(0).toUpperCase() + document.source.slice(1)}
      </div>
    </div>
  );
} 