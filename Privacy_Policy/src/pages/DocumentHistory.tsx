import React from 'react';
import DocumentHistory from '../components/documents/DocumentHistory';
import { theme } from '../styles/theme';

export default function DocumentHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.neutral[900] }}>
          Your Document History
        </h1>
        <p style={{ color: theme.colors.neutral[600] }}>
          View and manage your previously analyzed documents. Documents are automatically retained for 1 month.
        </p>
      </div>
      
      <DocumentHistory />
    </div>
  );
} 