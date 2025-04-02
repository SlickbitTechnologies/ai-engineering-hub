import { getFirestore } from 'firebase-admin/firestore';

export const getRestaurantData = async (userId) => {
  try {
    const db = getFirestore();
    
    // Get restaurant document from Firestore
    const restaurantDoc = await db.collection('restaurants').doc(userId).get();
    
    if (!restaurantDoc.exists) {
      throw new Error('Restaurant data not found');
    }

    const restaurantData = restaurantDoc.data();
    
    // Check if files exist in the data
    if (!restaurantData.files) {
      throw new Error('Files not found in restaurant data');
    }

    return restaurantData;
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
    throw error;
  }
};

class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 3600000) { // Default TTL: 1 hour in milliseconds
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    this.cache.set(key, item);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Create a singleton instance
const cache = new Cache();
export default cache; 