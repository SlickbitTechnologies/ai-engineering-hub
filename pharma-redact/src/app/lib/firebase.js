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
import { getFirestore, collection, addDoc, getDoc, getDocs, doc, updateDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
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