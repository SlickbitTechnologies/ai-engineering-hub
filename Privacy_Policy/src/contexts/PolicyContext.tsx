import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface Document {
  id?: string;
  name: string;
  uploadDate: string;
  lastAnalyzed: string;
  score: number;
  status: 'Compliant' | 'Needs Attention' | 'High Risk';
  starred?: boolean;
  content?: string;
  userId?: string;
  analysisResult?: {
    overallScore: number;
    gdprScore: number;
    ccpaScore: number;
    dpdpaScore: number;
    complianceBreakdown: {
      compliant: number;
      needsAttention: number;
      highRisk: number;
    };
    gaps: Array<{
      title: string;
      regulation: string;
      riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
    }>;
    insights: Array<{
      title: string;
      regulation: string;
      article: string;
      description: string;
      riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
    }>;
  };
}

interface PolicyContextType {
  documents: Document[];
  addDocument: (document: Document) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshPolicies: () => Promise<void>;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export function PolicyProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const refreshPolicies = async () => {
    if (!currentUser) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const policyQuery = query(
        collection(db, 'policies'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(policyQuery);
      const policyDocs: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Document;
        policyDocs.push({
          ...data,
          id: doc.id
        });
      });
      
      setDocuments(policyDocs);
    } catch (err) {
      console.error('Error loading policies:', err);
      setError('Failed to load policy documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Load policies when user changes
  useEffect(() => {
    refreshPolicies();
  }, [currentUser]);

  const addDocument = async (document: Document) => {
    if (!currentUser) {
      setError('You must be logged in to add documents');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const docWithUser = {
        ...document,
        userId: currentUser.uid
      };
      
      const docRef = await addDoc(collection(db, 'policies'), docWithUser);
      
      setDocuments(prev => [...prev, { ...docWithUser, id: docRef.id }]);
    } catch (err) {
      console.error('Error adding document:', err);
      setError('Failed to add document');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    if (!currentUser) {
      setError('You must be logged in to update documents');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, 'policies', id);
      await updateDoc(docRef, updates);
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        )
      );
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStar = async (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (!document) return;
    
    const newStarredStatus = !document.starred;
    
    await updateDocument(id, { starred: newStarredStatus });
  };

  return (
    <PolicyContext.Provider value={{ 
      documents, 
      addDocument, 
      updateDocument, 
      toggleStar, 
      isLoading, 
      error,
      refreshPolicies
    }}>
      {children}
    </PolicyContext.Provider>
  );
}

export function usePolicy() {
  const context = useContext(PolicyContext);
  if (context === undefined) {
    throw new Error('usePolicy must be used within a PolicyProvider');
  }
  return context;
} 