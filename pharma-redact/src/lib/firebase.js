// Firebase configuration and utility functions
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration - using fake values if env vars aren't defined
// to prevent initialization errors
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDOCAbC123dEf456GhI789jKl012-MnO",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pharma-redact.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pharma-redact",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pharma-redact.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:a1b2c3d4e5f6a7b8c9d0e1"
};

// Make sure Firebase is properly initialized before exporting
let app;
let auth;
let db;
let initialized = false;

try {
  // Only initialize once
  if (!initialized) {
    console.log('Initializing Firebase with config:', {
      apiKeyDefined: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomainDefined: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectIdDefined: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    initialized = true;
    console.log("Firebase initialized successfully");
    
    // Print the current auth state
    auth.onAuthStateChanged((user) => {
      console.log("Initial Firebase Auth State:", user ? `User: ${user.uid}` : "No User");
    });
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 * @returns {Promise<Object>} - A promise that resolves with the user's credentials
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Create a new user with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - A promise that resolves with the user's credentials
 */
export const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - A promise that resolves with the user's credentials
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>} - A promise that resolves when the user is signed out
 */
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Get a user's documents
 * @param {string} userId - The user's ID
 * @param {string} status - Optional status filter ('redacted' or 'pending')
 * @returns {Promise<Array>} - A promise that resolves with an array of document objects
 */
export async function getUserDocuments(userId, status = null) {
  try {
    if (!userId) {
      console.log("No user ID provided to getUserDocuments");
      return [];
    }
    
    console.log(`Fetching documents for user: ${userId}, status filter: ${status || 'none'}`);
    
    try {
      // First try the most basic query possible - no ordering, just filter by userId
      const simpleQuery = query(
        collection(db, 'documents'),
        where('userId', '==', userId)
      );
      
      console.log("Executing simple query without ordering");
      const querySnapshot = await getDocs(simpleQuery);
      const docs = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      console.log(`Retrieved ${docs.length} documents with simple query`);
      
      // Sort manually in memory
      docs.sort((a, b) => {
        // Handle missing createdAt values
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });
      
      // Apply status filter in memory if needed
      if (status) {
        const filteredDocs = docs.filter(doc => doc.status === status);
        console.log(`Filtered to ${filteredDocs.length} documents with status: ${status}`);
        return filteredDocs;
      }
      
      return docs;
    } catch (error) {
      console.error('Error executing simple query:', error);
      
      // Last resort - return empty array with a better error message
      console.error(`Failed to fetch documents for user ${userId}. Please try again later.`);
      return [];
    }
  } catch (error) {
    console.error(`Error in getUserDocuments for user ${userId}:`, error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Upload a document
 * @param {File} file - The file to upload
 * @param {string} userId - The user's ID
 * @param {Function} progressCallback - Callback function for upload progress
 * @returns {Promise<Object>} - A promise that resolves with the uploaded document data
 */
export const uploadDocument = async (file, userId, progressCallback = null) => {
  try {
    if (!file || !userId) {
      throw new Error('File and userId are required');
    }

    // Initialize storage if not already done
    const storage = getStorage(app);
    
    // Create a storage reference
    const storageRef = ref(storage, `documents/${userId}/${Date.now()}_${file.name}`);
    
    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate and report progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% complete`);
          
          if (progressCallback && typeof progressCallback === 'function') {
            progressCallback(progress);
          }
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Add document record to Firestore
            const docRef = await addDoc(collection(db, 'documents'), {
              userId,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              status: 'pending',
              url: downloadURL,
              filePath: storageRef.fullPath,      // Add storage path
              downloadUrl: downloadURL,           // Add download URL
              contentType: file.type,             // Add content type
              createdAt: new Date()
            });
            
            // Return document data
            resolve({
              id: docRef.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              status: 'pending',
              url: downloadURL,
              filePath: storageRef.fullPath,      // Include in returned object
              downloadUrl: downloadURL,           // Include in returned object
              contentType: file.type,             // Include in returned object
              createdAt: new Date()
            });
          } catch (error) {
            console.error('Error saving document record:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

/**
 * Get document statistics for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - A promise that resolves with document statistics
 */
export const getDocumentStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Query for all documents for this user
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    // Initialize statistics
    const stats = {
      total: 0,
      redacted: 0,
      pending: 0
    };
    
    // Count documents by status
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;
      
      if (data.status === 'redacted') {
        stats.redacted++;
      } else if (data.status === 'pending') {
        stats.pending++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error getting document statistics:", error);
    // Return default stats object in case of error
    return {
      total: 0,
      redacted: 0,
      pending: 0
    };
  }
};

/**
 * Get a specific document by ID
 * @param {string} documentId - The document ID
 * @returns {Promise<Object|null>} - A promise that resolves with the document data or null if not found
 */
export const getDocumentById = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error('documentId is required');
    }

    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    } else {
      console.log(`Document with ID ${documentId} not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Update a document's status
 * @param {string} documentId - The document ID
 * @param {string} status - The new status ('redacted' or 'pending')
 * @returns {Promise<Object>} - A promise that resolves with the updated document data
 */
export const updateDocumentStatus = async (documentId, status) => {
  try {
    if (!documentId) {
      throw new Error('documentId is required');
    }
    
    if (status !== 'redacted' && status !== 'pending') {
      throw new Error('Status must be either "redacted" or "pending"');
    }

    const docRef = doc(db, 'documents', documentId);
    await setDoc(docRef, { 
      status,
      updatedAt: new Date()
    }, { merge: true });
    
    // Get updated document
    return getDocumentById(documentId);
  } catch (error) {
    console.error(`Error updating document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} documentId - The document ID
 * @param {string} userId - The user ID (for security verification)
 * @returns {Promise<boolean>} - A promise that resolves with true if deletion was successful
 */
export const deleteDocument = async (documentId, userId) => {
  try {
    if (!documentId || !userId) {
      throw new Error('documentId and userId are required');
    }

    // First get the document to check ownership and get the storage URL
    const document = await getDocumentById(documentId);
    
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Security check - verify this document belongs to the user
    if (document.userId !== userId) {
      throw new Error('You do not have permission to delete this document');
    }

    // Delete from Firestore
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
    
    // Delete from Storage if URL exists
    if (document.url) {
      try {
        const storage = getStorage(app);
        const fileRef = ref(storage, document.url);
        await deleteObject(fileRef);
        console.log(`Deleted file from storage: ${document.url}`);
      } catch (storageError) {
        // Log but don't fail if storage deletion fails
        console.error('Error deleting from storage:', storageError);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Get the current authenticated user
 * @returns {Object|null} - The current user or null if not authenticated
 */
export const getCurrentUser = () => {
  if (!auth) {
    console.error("Auth is not initialized");
    return null;
  }
  return auth.currentUser;
};

// Export Firebase instances for direct access if needed
export { auth, db };