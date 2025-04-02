import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

// Get restaurant settings
export const getRestaurantSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the restaurant document reference
    const restaurantRef = doc(db, 'restaurants', userId);
    
    // Check if restaurant exists
    const restaurantDoc = await getDoc(restaurantRef);
    if (!restaurantDoc.exists()) {
      return res.status(404).json({ 
        error: 'Restaurant not found' 
      });
    }

    const restaurantData = restaurantDoc.data();
    
    res.status(200).json(restaurantData);

  } catch (error) {
    console.error('Error getting restaurant settings:', error);
    res.status(500).json({ 
      error: 'Failed to get restaurant settings',
      details: error.message 
    });
  }
};

// Upload file to Firebase Storage
const uploadFileToStorage = async (file, userId, restaurantName, fieldName) => {
  const fileId = uuidv4();
  const sanitizedRestaurantName = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileRef = ref(storage, `restaurants/${userId}/${sanitizedRestaurantName}/${fieldName}.pdf`);
  
  try {
    console.log(`Attempting to upload file to path: ${fileRef.fullPath}`);
    await uploadBytes(fileRef, file.buffer);
    const downloadUrl = await getDownloadURL(fileRef);
    console.log(`Successfully uploaded ${fieldName} file for ${restaurantName}`);
    return downloadUrl;
  } catch (uploadError) {
    console.error(`Error uploading ${fieldName} file:`, uploadError);
    console.error('File details:', {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
    throw uploadError;
  }
};

// Save restaurant settings with file uploads
export const saveRestaurantSettings = async (req, res) => {
  try {
    const { restaurantName, language } = req.body;
    const files = req.files;
    const userId = req.user.id;

    if (!restaurantName || !language) {
      return res.status(400).json({ 
        error: 'Restaurant name and language are required' 
      });
    }

    // Get existing restaurant data if it exists
    const restaurantRef = doc(db, 'restaurants', userId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    // Initialize fileUrls with existing files if they exist
    const fileUrls = restaurantDoc.exists() 
      ? { ...restaurantDoc.data().files } 
      : {};

    // Upload new files to Firebase Storage and get URLs
    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray[0]) {
        const file = fileArray[0];
        try {
          const downloadUrl = await uploadFileToStorage(file, userId, restaurantName, fieldName);
          fileUrls[fieldName] = downloadUrl;
          console.log(`Updated ${fieldName} file URL for ${restaurantName}`);
        } catch (uploadError) {
          console.error(`Error uploading ${fieldName} file:`, uploadError);
          throw uploadError;
        }
      }
    }

    // Prepare restaurant data
    const restaurantData = {
      name: restaurantName,
      language,
      files: fileUrls,
      userId,
      updatedAt: new Date().toISOString(),
      // Only add createdAt if it's a new document
      ...(!restaurantDoc.exists() && {
        createdAt: new Date().toISOString(),
      })
    };

    try {
      console.log('Restaurant data:', restaurantData);
      await setDoc(restaurantRef, restaurantData, { merge: true });
      console.log(`Successfully saved restaurant data for ${restaurantName}`);
    } catch (firestoreError) {
      console.error(`Error saving to Firestore:`, firestoreError);
      throw firestoreError;
    }

    res.status(200).json({
      message: 'Restaurant settings saved successfully',
      data: restaurantData,
    });

  } catch (error) {
    console.error('Error saving restaurant settings:', error);
    res.status(500).json({ 
      error: 'Failed to save restaurant settings',
      details: error.message 
    });
  }
};

// Update or create restaurant settings
export const updateRestaurantSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { restaurantName, language } = req.body;

    if (!restaurantName || !language) {
      return res.status(400).json({ 
        error: 'Restaurant name and language are required' 
      });
    }

    // Get the restaurant document reference
    const restaurantRef = doc(db, 'restaurants', userId);
    
    // Check if restaurant exists
    const restaurantDoc = await getDoc(restaurantRef);
    
    // Prepare the data to save
    const restaurantData = {
      name: restaurantName,
      language,
      updatedAt: new Date().toISOString(),
      // If document doesn't exist, add these fields
      ...(!restaurantDoc.exists() && {
        userId,
        createdAt: new Date().toISOString(),
        files: {}
      })
    };

    // Use setDoc with merge option to update or create
    await setDoc(restaurantRef, restaurantData, { merge: true });

    // Get the updated/created document
    const updatedDoc = await getDoc(restaurantRef);

    res.status(200).json({
      message: restaurantDoc.exists() 
        ? 'Restaurant settings updated successfully'
        : 'Restaurant settings created successfully',
      data: updatedDoc.data(),
    });

  } catch (error) {
    console.error('Error updating/creating restaurant settings:', error);
    res.status(500).json({ 
      error: 'Failed to update/create restaurant settings',
      details: error.message 
    });
  }
}; 