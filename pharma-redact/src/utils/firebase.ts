import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

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
const auth = getAuth(app);

// Configure persistence to remember users between sessions
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Firebase auth persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('Error setting auth persistence:', error);
    });

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
// Enable account selection even when already logged in
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

console.log("Firebase initialized with config:", {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + "...",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
});

// Workaround for CORS issues - use this for development only
const developmentCorsWorkaround = process.env.NODE_ENV === 'development';

// Upload file to Firebase Storage
export const uploadFileToStorage = async (file: File, path: string = 'documents'): Promise<string> => {
    try {
        console.log(`Starting upload for file: ${file.name} to path: ${path}`);

        // Create a unique file name to avoid collisions
        const timestamp = Date.now();
        const uniqueFileName = `${path}/${file.name.replace(/\s+/g, '_')}-${timestamp}`;
        const storageRef = ref(storage, uniqueFileName);

        console.log(`Created storage reference: ${uniqueFileName}`);

        // Start the upload with custom fetch implementation
        const metadata = {
            contentType: file.type,
            customMetadata: {
                'uploaded-from': window.location.origin,
                'upload-time': new Date().toISOString()
            }
        };

        // Retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError: any = null;

        while (retryCount < maxRetries) {
            try {
                const uploadTask = uploadBytesResumable(storageRef, file, metadata);

                return await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            // Track upload progress
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log('Upload is ' + progress + '% done');
                        },
                        (error) => {
                            // Handle unsuccessful uploads
                            console.error('Error uploading file (attempt ' + (retryCount + 1) + '):', error);
                            console.error('Error details:', error.code, error.message, error.serverResponse);
                            reject(error);
                        },
                        async () => {
                            try {
                                // Handle successful uploads
                                console.log('Upload completed successfully');
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                console.log('File available at', downloadURL);
                                resolve(downloadURL);
                            } catch (error) {
                                console.error('Error getting download URL:', error);
                                reject(error);
                            }
                        }
                    );
                });
            } catch (error) {
                console.error(`Upload attempt ${retryCount + 1} failed:`, error);
                lastError = error;
                retryCount++;

                if (retryCount < maxRetries) {
                    // Wait with exponential backoff
                    const delayMs = Math.pow(2, retryCount) * 1000;
                    console.log(`Retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }

        // If we've exhausted all retries
        throw lastError || new Error('Upload failed after multiple attempts');
    } catch (error) {
        console.error('Error in uploadFileToStorage:', error);
        throw error;
    }
};

// Add document metadata to Firestore
export const addDocumentToFirestore = async (documentData: any): Promise<string> => {
    try {
        console.log('Adding document to Firestore:', documentData);
        const docRef = await addDoc(collection(db, 'documents'), documentData);
        console.log('Document added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding document to Firestore:', error);
        throw error;
    }
};

// Get all documents from Firestore
export const getDocumentsFromFirestore = async () => {
    try {
        console.log('Fetching documents from Firestore');
        const querySnapshot = await getDocs(collection(db, 'documents'));
        const documents: any[] = [];

        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Found ${documents.length} documents`);
        return documents;
    } catch (error) {
        console.error('Error getting documents from Firestore:', error);
        throw error;
    }
};

// Delete document from Firebase Storage and Firestore
export const deleteDocument = async (fileUrl: string, firestoreId: string) => {
    try {
        console.log(`Deleting document: ${firestoreId}, file URL: ${fileUrl}`);

        // Delete from Storage if URL exists
        if (fileUrl) {
            try {
                // Extract storage path from URL
                const url = new URL(fileUrl);
                const pathWithToken = url.pathname.split('/o/')[1];
                if (pathWithToken) {
                    const storagePath = decodeURIComponent(pathWithToken.split('?')[0]);
                    console.log(`Deleting file from storage path: ${storagePath}`);
                    const fileRef = ref(storage, storagePath);
                    await deleteObject(fileRef);
                    console.log('File deleted from storage');
                }
            } catch (storageError) {
                console.error('Error deleting from storage:', storageError);
                // Continue to delete from Firestore even if storage deletion fails
            }
        }

        // Delete from Firestore
        await deleteDoc(doc(db, 'documents', firestoreId));
        console.log('Document deleted from Firestore');

        return true;
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

export { app, storage, db, auth, googleProvider }; 