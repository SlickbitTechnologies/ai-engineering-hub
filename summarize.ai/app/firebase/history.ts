import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser } from './auth';

export interface SummaryItem {
    id?: string;
    title: string;
    content: string;
    sourceType: 'web' | 'pdf' | 'audio' | 'text' | 'translation' | 'youtube';
    createdAt: number;
    originalText?: string;
    sourceUrl?: string;
    fileName?: string;
}

// Additional interface for history items from other features
export interface HistoryItem {
    userId: string;
    type: string;
    content: string;
    timestamp: string;
    title: string;
    url?: string;
}

/**
 * Saves a summary to the user's history collection
 */
export const saveSummary = async (summary: SummaryItem): Promise<string | null> => {
    const user = getCurrentUser();
    if (!user) return null;

    try {
        const userSummariesRef = collection(db, 'users', user.uid, 'summaries');
        const docRef = await addDoc(userSummariesRef, {
            ...summary,
            createdAt: summary.createdAt || Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving summary to history:', error);
        return null;
    }
};

/**
 * Add an item to history (simplified method for various features)
 */
export const addToHistory = async (item: HistoryItem): Promise<string | null> => {
    if (!item.userId) return null;

    try {
        const userHistoryRef = collection(db, 'users', item.userId, 'history');
        const docRef = await addDoc(userHistoryRef, {
            ...item,
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding to history:', error);
        return null;
    }
};

/**
 * Get all summaries for the current user
 */
export const getSummaries = async (): Promise<SummaryItem[]> => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const userSummariesRef = collection(db, 'users', user.uid, 'summaries');
        const q = query(userSummariesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const summaries: SummaryItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            summaries.push({
                id: doc.id,
                title: data.title,
                content: data.content,
                sourceType: data.sourceType,
                createdAt: data.createdAt,
                originalText: data.originalText,
                sourceUrl: data.sourceUrl,
                fileName: data.fileName
            });
        });

        return summaries;
    } catch (error) {
        console.error('Error fetching summaries:', error);
        return [];
    }
};

/**
 * Get all history items of a specific type
 */
export const getHistoryByType = async (type: string): Promise<any[]> => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const userHistoryRef = collection(db, 'users', user.uid, 'history');
        const q = query(
            userHistoryRef,
            where('type', '==', type),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const historyItems: any[] = [];
        querySnapshot.forEach((doc) => {
            historyItems.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return historyItems;
    } catch (error) {
        console.error(`Error fetching ${type} history:`, error);
        return [];
    }
};

/**
 * Delete a specific summary
 */
export const deleteSummary = async (summaryId: string): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        await deleteDoc(doc(db, 'users', user.uid, 'summaries', summaryId));
        return true;
    } catch (error) {
        console.error('Error deleting summary:', error);
        return false;
    }
};

/**
 * Delete a history item
 */
export const deleteHistoryItem = async (itemId: string): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        await deleteDoc(doc(db, 'users', user.uid, 'history', itemId));
        return true;
    } catch (error) {
        console.error('Error deleting history item:', error);
        return false;
    }
};

/**
 * Get a specific summary by ID
 */
export const getSummaryById = async (summaryId: string): Promise<SummaryItem | null> => {
    const user = getCurrentUser();
    if (!user) return null;

    try {
        const summaryRef = doc(db, 'users', user.uid, 'summaries', summaryId);
        const summaryDoc = await getDoc(summaryRef);

        if (summaryDoc.exists()) {
            const data = summaryDoc.data();
            return {
                id: summaryDoc.id,
                title: data.title,
                content: data.content,
                sourceType: data.sourceType,
                createdAt: data.createdAt,
                originalText: data.originalText,
                sourceUrl: data.sourceUrl,
                fileName: data.fileName
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching summary:', error);
        return null;
    }
}; 