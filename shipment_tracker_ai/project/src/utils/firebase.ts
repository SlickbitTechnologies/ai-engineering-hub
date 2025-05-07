import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBset5SRilQCBcrYBcJZfVrEOJyQzlfwWg",
  authDomain: "shipment-5b135.firebaseapp.com",
  projectId: "shipment-5b135",
  storageBucket: "shipment-5b135.firebasestorage.app",
  messagingSenderId: "148743895941",
  appId: "1:148743895941:web:7128a541d628c5a897e2ec"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;