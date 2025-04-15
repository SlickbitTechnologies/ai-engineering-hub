import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserDocuments, 
  storeDocument, 
  deleteDocument, 
  AnalyzedDocument 
} from '../services/documentService';

interface DocumentContextType {
  documents: AnalyzedDocument[];
  isLoading: boolean;
  error: string | null;
  storeAnalyzedDocument: (file: File, analysisResults: any) => Promise<AnalyzedDocument | null>;
  removeDocument: (documentId: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider = ({ children }: DocumentProviderProps) => {
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const refreshDocuments = async () => {
    if (!currentUser) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const docs = await getUserDocuments(currentUser.uid);
      setDocuments(docs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document analysis history';
      console.error('Error refreshing documents:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents when user changes or component mounts
  useEffect(() => {
    if (currentUser) {
      refreshDocuments();
    }
  }, [currentUser]);

  const storeAnalyzedDocument = async (file: File, analysisResults: any) => {
    if (!currentUser) {
      setError('You must be logged in to store analysis results');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Store only analysis results and file metadata (not the actual file)
      const result = await storeDocument(file, currentUser, analysisResults);
      if (result) {
        // Add the new analysis to the state
        setDocuments(prev => [result, ...prev]);
      }
      return result;
    } catch (err) {
      setError('Failed to store analysis results');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = async (documentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await deleteDocument(documentId);
      if (success) {
        // Remove the document from state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
      return success;
    } catch (err) {
      setError('Failed to delete analysis');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    documents,
    isLoading,
    error,
    storeAnalyzedDocument,
    removeDocument,
    refreshDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}; 