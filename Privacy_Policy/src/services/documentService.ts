import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  Timestamp,
  orderBy,
  limit,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User } from 'firebase/auth';
import { analyzePrivacyPolicyWithGemini } from './geminiService';

export interface AnalyzedDocument {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  overallScore: number;
  gdprScore: number;
  ccpaScore: number;
  dpdpaScore: number;
  readabilityScore: number;
  comprehensivenessScore: number;
  transparencyScore: number;
  accuracyScore: number;
  complianceBreakdown?: {
    compliant: number;
    needsAttention: number;
    highRisk: number;
  };
  gaps?: Array<{
    title: string;
    regulation: string;
    riskLevel: string;
  }>;
  insights?: Array<{
    title: string;
    regulation: string;
    article: string;
    description: string;
    riskLevel: string;
  }>;
  lastAnalyzed?: Date;
  analysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

// Store document analysis in Firebase (without storing the document itself)
export const storeDocument = async (
  file: File,
  user: User,
  analysisResults: {
    overallScore: number;
    gdprScore: number;
    ccpaScore: number;
    dpdpaScore: number;
    complianceBreakdown?: {
      compliant: number;
      needsAttention: number;
      highRisk: number;
    };
    gaps?: Array<{
      title: string;
      regulation: string;
      riskLevel: string;
    }>;
    insights?: Array<{
      title: string;
      regulation: string;
      article: string;
      description: string;
      riskLevel: string;
    }>;
  }
): Promise<AnalyzedDocument | null> => {
  try {
    // Create document metadata in Firestore
    const docData: AnalyzedDocument = {
      id: '', // Will be set after document creation
      title: file.name, // Using filename as initial title
      content: '', // Content will be set separately
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      overallScore: 0,
      gdprScore: 0,
      ccpaScore: 0,
      dpdpaScore: 0,
      readabilityScore: 0,
      comprehensivenessScore: 0,
      transparencyScore: 0,
      accuracyScore: 0,
      analysis: {
        summary: '',
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    };
    
    const docRef = await addDoc(collection(db, 'analyzedDocuments'), docData);
    return { ...docData, id: docRef.id };
  } catch (error) {
    console.error('Error storing document analysis:', error);
    return null;
  }
};

// Get all user documents, not just from the past month
export const getUserDocuments = async (userId: string): Promise<AnalyzedDocument[]> => {
  try {
    // Simple query that doesn't require a composite index - just filter by userId
    const q = query(
      collection(db, 'analyzedDocuments'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const documents: AnalyzedDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AnalyzedDocument;
      // Convert Firestore Timestamp to Date
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : data.createdAt;
      const updatedAt = data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : data.updatedAt;
        
      documents.push({
        ...data,
        createdAt,
        updatedAt,
        id: doc.id
      });
    });
    
    // Sort the documents client-side instead of using orderBy in the query
    documents.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
    });
    
    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    return [];
  }
};

// Delete a document from Firestore
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    // Delete from Firestore
    const documentRef = doc(db, 'analyzedDocuments', documentId);
    await deleteDoc(documentRef);
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

export async function analyze(documentId: string, regulationsToCheck: { gdpr: boolean; ccpa: boolean; dpdpa: boolean }) {
  try {
    const doc = await getDocument(documentId);
    if (!doc) {
      throw new Error('Document not found');
    }

    const analysisResult = await analyzePrivacyPolicyWithGemini(doc.content, regulationsToCheck);
    
    // Update the document with analysis results
    await updateDocument(documentId, {
      ...doc,
      overallScore: analysisResult.overallScore,
      gdprScore: analysisResult.gdprScore,
      ccpaScore: analysisResult.ccpaScore,
      dpdpaScore: analysisResult.dpdpaScore,
      complianceBreakdown: analysisResult.complianceBreakdown,
      gaps: analysisResult.gaps,
      insights: analysisResult.insights,
      lastAnalyzed: new Date()
    });

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing document:', error);
    throw error;
  }
}

export async function getDocument(documentId: string): Promise<AnalyzedDocument | null> {
  try {
    const docRef = doc(db, 'analyzedDocuments', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AnalyzedDocument;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

export async function updateDocument(documentId: string, data: Partial<AnalyzedDocument>): Promise<void> {
  try {
    const docRef = doc(db, 'analyzedDocuments', documentId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
} 