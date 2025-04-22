import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, collection, addDoc, getDoc, getDocs, doc, updateDoc, serverTimestamp, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication helpers
export const registerUser = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// Firestore helpers
export const addDocument = async (collectionName, data) => {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  return updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getUserDocuments = async (userId) => {
  try {
    console.log(`[app/lib/firebase.js] Fetching documents for user: ${userId}`);
    // Use a simple query without orderBy to avoid index issues
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[app/lib/firebase.js] Retrieved ${docs.length} documents`);
    
    // Sort manually in memory
    docs.sort((a, b) => {
      // Handle missing createdAt values
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      // Handle different timestamp formats
      const aTime = a.createdAt.seconds ? a.createdAt.seconds : a.createdAt.getTime() / 1000;
      const bTime = b.createdAt.seconds ? b.createdAt.seconds : b.createdAt.getTime() / 1000;
      return bTime - aTime; // descending order
    });
    
    return docs;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error fetching documents:', error);
    throw error;
  }
};

/**
 * Retrieves a document by its ID
 * @param {string} documentId - The ID of the document to retrieve
 * @returns {Promise<Object|null>} The document data or null if not found
 */
export const getDocumentById = async (documentId) => {
  try {
    console.log(`[app/lib/firebase.js] Fetching document with ID: ${documentId}`);
    
    if (!documentId) {
      console.error('[app/lib/firebase.js] No document ID provided');
      return null;
    }
    
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const documentData = {
        id: docSnap.id,
        ...docSnap.data()
      };
      console.log('[app/lib/firebase.js] Document found');
      return documentData;
    } else {
      console.log('[app/lib/firebase.js] Document not found');
      return null;
    }
  } catch (error) {
    console.error('[app/lib/firebase.js] Error fetching document:', error);
    throw error;
  }
};

// Redaction Rules helpers
export const getUserRedactionRules = async (userId) => {
  try {
    console.log(`[app/lib/firebase.js] Fetching redaction rules for user: ${userId}`);
    const q = query(
      collection(db, 'redaction_rules'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const rules = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[app/lib/firebase.js] Retrieved ${rules.length} redaction rules`);
    
    // Sort by createdAt (newest first)
    rules.sort((a, b) => {
      // Handle missing createdAt values
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      // Handle different timestamp formats
      const aTime = a.createdAt.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
      const bTime = b.createdAt.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
      return bTime - aTime; // descending order
    });
    
    return rules;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error fetching redaction rules:', error);
    throw error;
  }
};

export const createRedactionRule = async (ruleData) => {
  try {
    console.log('[app/lib/firebase.js] Creating new redaction rule');
    return await addDoc(collection(db, 'redaction_rules'), {
      ...ruleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[app/lib/firebase.js] Error creating redaction rule:', error);
    throw error;
  }
};

export const updateRedactionRule = async (ruleId, ruleData) => {
  try {
    console.log(`[app/lib/firebase.js] Updating redaction rule: ${ruleId}`);
    const ruleRef = doc(db, 'redaction_rules', ruleId);
    await updateDoc(ruleRef, {
      ...ruleData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error updating redaction rule:', error);
    throw error;
  }
};

export const deleteRedactionRule = async (ruleId) => {
  try {
    console.log(`[app/lib/firebase.js] Deleting redaction rule: ${ruleId}`);
    const ruleRef = doc(db, 'redaction_rules', ruleId);
    await deleteDoc(ruleRef);
    return true;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error deleting redaction rule:', error);
    throw error;
  }
};

// Templates helpers
export const getUserTemplates = async (userId) => {
  try {
    console.log(`[app/lib/firebase.js] Fetching templates for user: ${userId}`);
    const q = query(
      collection(db, 'templates'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[app/lib/firebase.js] Retrieved ${templates.length} templates`);
    
    // Sort by updatedAt or createdAt (newest first)
    templates.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt;
      const bDate = b.updatedAt || b.createdAt;
      
      // Handle missing date values
      if (!aDate) return 1;
      if (!bDate) return -1;
      
      // Handle different timestamp formats
      const aTime = aDate.seconds ? aDate.seconds : new Date(aDate).getTime() / 1000;
      const bTime = bDate.seconds ? bDate.seconds : new Date(bDate).getTime() / 1000;
      
      return bTime - aTime; // descending order
    });
    
    return templates;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error fetching templates:', error);
    throw error;
  }
};

export const createTemplate = async (userId, templateData) => {
  try {
    console.log('[app/lib/firebase.js] Creating new template');
    return await addDoc(collection(db, 'templates'), {
      ...templateData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[app/lib/firebase.js] Error creating template:', error);
    throw error;
  }
};

export const updateTemplate = async (templateId, templateData) => {
  try {
    console.log(`[app/lib/firebase.js] Updating template: ${templateId}`);
    const templateRef = doc(db, 'templates', templateId);
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error updating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    console.log(`[app/lib/firebase.js] Deleting template: ${templateId}`);
    const templateRef = doc(db, 'templates', templateId);
    await deleteDoc(templateRef);
    return true;
  } catch (error) {
    console.error('[app/lib/firebase.js] Error deleting template:', error);
    throw error;
  }
};

// Storage helpers
export const uploadFile = async (userId, file) => {
  const storageRef = ref(storage, `documents/${userId}/${file.name}-${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    path: snapshot.ref.fullPath,
    url: downloadURL,
  };
};

export const deleteFile = async (filePath) => {
  const fileRef = ref(storage, filePath);
  return deleteObject(fileRef);
};

export { auth, db, storage, googleProvider }; 