import express from 'express';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../middleware/auth.mjs';
import dotenv from 'dotenv';
import { 
  getRestaurantSettings, 
  saveRestaurantSettings, 
  updateRestaurantSettings 
} from '../controllers/restaurantController.mjs';

// Load environment variables
dotenv.config();

const router = express.Router();

// Apply authentication middleware to all restaurant routes
router.use(verifyToken);

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

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

// Initialize Firebase Storage with the correct bucket URL
const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

// Handle multiple file uploads
const uploadFields = [
  { name: 'history', maxCount: 1 },
  { name: 'faqs', maxCount: 1 },
  { name: 'menu', maxCount: 1 },
  { name: 'reviews', maxCount: 1 },
];

// Routes
router.get('/settings/:userId', getRestaurantSettings);
router.post('/settings', upload.fields(uploadFields), saveRestaurantSettings);
router.put('/settings/:userId', updateRestaurantSettings);

export default router; 