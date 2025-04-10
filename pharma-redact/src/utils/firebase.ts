import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';

// Firebase configuration from environment variables
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
const storage = getStorage(app);
const db = getFirestore(app);

// Upload file to Firebase Storage
export const uploadFileToStorage = async (file: File, path: string = 'documents'): Promise<string> => {
    try {
        const storageRef = ref(storage, `${path}/${file.name}-${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // You can use this to track upload progress if needed
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error('Error uploading file:', error);
                    reject(error);
                },
                async () => {
                    // Handle successful uploads
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error('Error in uploadFileToStorage:', error);
        throw error;
    }
};

// Add document metadata to Firestore
export const addDocumentToFirestore = async (documentData: any): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'documents'), documentData);
        return docRef.id;
    } catch (error) {
        console.error('Error adding document to Firestore:', error);
        throw error;
    }
};

// Get all documents from Firestore
export const getDocumentsFromFirestore = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'documents'));
        const documents: any[] = [];

        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        return documents;
    } catch (error) {
        console.error('Error getting documents from Firestore:', error);
        throw error;
    }
};

// Delete document from Firebase Storage and Firestore
export const deleteDocument = async (fileUrl: string, firestoreId: string) => {
    try {
        // Delete from Storage
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);

        // Delete from Firestore
        await deleteDoc(doc(db, 'documents', firestoreId));

        return true;
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

export { storage, db }; 