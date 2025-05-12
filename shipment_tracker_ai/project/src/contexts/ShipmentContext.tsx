import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, doc, getDoc, getDocs, where, updateDoc, CollectionReference, DocumentData, onSnapshot, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../utils/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';

// Firebase collection name
const SHIPMENTS_COLLECTION = 'shipments';

// Near the top of the file, add a debug logger
const DEBUG_FIREBASE = true;

const logFirebaseOperation = (operation: string, start = true, error?: any) => {
  if (!DEBUG_FIREBASE) return;
  
  const status = start ? 'STARTING' : error ? 'ERROR' : 'COMPLETED';
  console.log(`[Firebase ${status}] ${operation}`, error || '');
};

export interface Temperature {
  timestamp: string;
  value: number;
}

export interface JourneyPoint {
  location: string;
  timestamp: string;
  temperature: number;
  status: 'completed' | 'current' | 'upcoming';
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  location?: string;
  read: boolean;
}

export interface TemperatureAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  location?: string;
  read: boolean;
  temperature: number;
  threshold: {
    min: number;
    max: number;
  };
}

export interface Shipment {
  id: string;
  number: string;
  status: 'in-transit' | 'delivered' | 'delayed';
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  designation:string;
  senderContactName:string;
  organization:string;
  phoneNumber:string;
  email:string;
  departureTime: string;
  estimatedDelivery: string;
  carrier: string;
  currentTemperature: number;
  temperatureHistory: Temperature[];
  journey: JourneyPoint[];
  alerts: Alert[];
  contents: string;
  billOfLading: string;
  userId?: string; // Store the user ID for each shipment
}

// Define ShipmentFile interface
export interface ShipmentFile {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  userId: string;
}

export interface ShipmentContextType {
  shipments: Shipment[];
  loading: boolean;
  updateShipments: (shipments: Shipment[]) => Promise<boolean>;
  clearAllShipments: () => Promise<boolean>;
  uploadShipmentFile: (file: File) => Promise<{ downloadUrl: string }>;
  getShipment: (id: string) => Shipment | undefined;
  markAlertAsRead: (shipmentId: string, alertId: string) => Promise<void>;
  deleteShipment: (shipmentId: string) => Promise<void>;
  updateShipment: (shipment: Shipment) => Promise<void>;
  checkTemperatureThresholds: (shipment: Shipment, minThreshold: number, maxThreshold: number) => Promise<void>;
}

const defaultContext: ShipmentContextType = {
  shipments: [],
  loading: false,
  getShipment: () => undefined,
  markAlertAsRead: async () => {},
  updateShipments: async () => false,
  clearAllShipments: async () => false,
  uploadShipmentFile: async () => ({ downloadUrl: '' }),
  deleteShipment: async () => {},
  updateShipment: async () => {},
  checkTemperatureThresholds: async () => {}
};

const ShipmentContext = createContext<ShipmentContextType>(defaultContext);

export const useShipments = () => useContext(ShipmentContext);

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Get the Firebase collection reference
  const getShipmentsRef = useCallback((): CollectionReference<DocumentData> | null => {
    try {
      return collection(db, SHIPMENTS_COLLECTION);
    } catch (error) {
      console.error("Error getting Firestore collection:", error);
      return null;
    }
  }, []);

  // Load shipments from Firebase
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void | undefined;
    
    const fetchShipments = async () => {
      try {
        logFirebaseOperation('fetchShipments');
        setLoading(true);
        
        // Get reference to shipments collection
        const shipmentsRef = await getShipmentsRef();
        
        if (!isMounted) return;
        
        // Add null check before using shipmentsRef
        if (!shipmentsRef) {
          console.error('[ShipmentContext] Failed to get shipments collection reference');
          logFirebaseOperation('fetchShipments - null shipmentsRef', false, new Error('Null shipmentsRef'));
          setShipments([]);
    setLoading(false);
          return;
        }
        
        // Set up the listener with proper type annotations
        unsubscribe = onSnapshot(
          shipmentsRef,
          (snapshot: DocumentData) => {
            if (!isMounted) return;
            
            try {
              // Process snapshot data
              const shipmentData = snapshot.docs.map((doc: DocumentData) => ({
                ...doc.data(),
                id: doc.id
              })) as Shipment[];
              console.log("Shipment data:", shipmentData);
              setShipments(shipmentData);
              setLoading(false);
              logFirebaseOperation('fetchShipments', false);
            } catch (error: any) {
              console.error('[ShipmentContext] Error processing shipment data:', error);
              logFirebaseOperation('fetchShipments data processing', false, error);
              setLoading(false);
            }
          },
          (error: Error) => {
            if (!isMounted) return;
            console.error('[ShipmentContext] Error fetching shipments:', error);
            logFirebaseOperation('fetchShipments snapshot listener', false, error);
            setLoading(false);
          }
        );
      } catch (error: any) {
        if (!isMounted) return;
        console.error('[ShipmentContext] Failed to set up shipment listener:', error);
        logFirebaseOperation('fetchShipments setup', false, error);
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchShipments();
    } else {
      setShipments([]);
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
      if (unsubscribe) {
        logFirebaseOperation('unsubscribing from shipments');
        unsubscribe();
      }
    };
  }, [currentUser, getShipmentsRef]);

  // Near the top after imports, add this code to track unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[CRITICAL] Unhandled Promise Rejection:', event.reason);
      console.error('Promise Rejection Stack:', event.reason?.stack);
      // Prevent the default handling (which would typically be a console warning)
      event.preventDefault();
    };

    // Add the event listener
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Clean up
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Also add a helper function for safe Firebase operations
  const safeFirebaseOperation = async <T,>(
    operation: () => Promise<T>,
    errorFallback: T,
    operationName: string
  ): Promise<T> => {
    try {
      logFirebaseOperation(operationName);
      const result = await operation();
      logFirebaseOperation(operationName, false);
      return result;
    } catch (error: any) {
      console.error(`[ShipmentContext] Error in ${operationName}:`, error);
      logFirebaseOperation(operationName, false, error);
      return errorFallback;
    }
  };

  // Replace the clearAllShipments function with a more direct approach
  const clearAllShipments = useCallback(async () => {
    console.log("Starting clearAllShipments operation");
    
    try {
      if (!currentUser?.uid) {
        console.error("Cannot clear shipments: No user logged in");
        return false;
      }
      
      // Get reference to shipments collection
      const shipmentsRef = getShipmentsRef();
      if (!shipmentsRef) {
        console.error("Failed to get shipments collection reference");
        return false;
      }
      
      // Query for shipments belonging to this user
      console.log(`Querying for shipments belonging to user: ${currentUser.uid}`);
      const q = query(shipmentsRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} shipments to delete`);
      
      if (querySnapshot.empty) {
        console.log("No shipments found to delete");
        return true;
      }
      
      // Use a batch operation for better atomicity
      const batch = writeBatch(db);
      let count = 0;
      
      // Add delete operations to batch
      querySnapshot.forEach((docSnapshot) => {
        console.log(`Adding delete operation for document: ${docSnapshot.id}`);
        const docRef = doc(db, SHIPMENTS_COLLECTION, docSnapshot.id);
        batch.delete(docRef);
        count++;
      });
      
      // Commit the batch
      console.log(`Committing batch with ${count} delete operations`);
      await batch.commit();
      console.log("Batch commit completed successfully");
      
      // Update local state to reflect empty shipments
      console.log("Updating local state to empty array");
      setShipments([]);
      
      return true;
    } catch (error) {
      console.error("Error clearing shipments:", error);
      return false;
    }
  }, [currentUser, getShipmentsRef]);

  const getShipment = useCallback((id: string) => {
    return shipments.find(shipment => shipment.id === id);
  }, [shipments]);

  const markAlertAsRead = async (shipmentId: string, alertId: string): Promise<void> => {
    try {
      const shipmentRef = doc(db, 'shipments', shipmentId);
      const shipment = getShipment(shipmentId);
      
      if (shipment) {
        const updatedAlerts = shipment.alerts.map(alert => 
          alert.id === alertId ? { ...alert, read: true } : alert
        );
        
        await updateDoc(shipmentRef, { alerts: updatedAlerts });
        
        // Update local state
        setShipments(prevShipments => 
          prevShipments.map(s => 
            s.id === shipmentId 
              ? { ...s, alerts: updatedAlerts }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  };
  
  const updateShipments = useCallback(async (newShipments: any[]) => {
    logFirebaseOperation('updateShipments');
    try {
      if (!currentUser?.uid) {
        throw new Error('User must be logged in to update shipments');
      }
      
      // Get reference to shipments collection
      const shipmentsRef = await getShipmentsRef();
      
      // Add null check for shipmentsRef
      if (!shipmentsRef) {
        throw new Error('Failed to get shipments collection reference');
      }
      
      console.log(`Processing ${newShipments.length} shipments from uploaded file`);
      
      // Process shipments data
      const processedShipments = newShipments.map((shipment, index) => {
        logFirebaseOperation(`processing shipment ${index}`);
        console.log(`Original shipment data:`, JSON.stringify(shipment, null, 2));
        
        // Ensure the shipment has an ID
        const id = shipment.id || `import-${Date.now()}-${index}`;
        
        // Create temperature history if missing
        const temperatureHistory = shipment.temperatureHistory || [
          { timestamp: new Date().toISOString(), value: parseFloat(shipment.currentTemperature || 5) }
        ];
        
        // Create journey points if missing
        console.log(`Creating journey points for shipment ${shipment.departureTime} to ${shipment.estimatedDelivery}`);
        const currentTimestamp = new Date().getTime();
        
        let journey = shipment.journey || temperatureHistory.map((temp: any)=>{
          const timestamp = new Date(temp.timestamp).getTime();
          return {
            location:temp.location,
            timestamp:timestamp,
            temperature:temp.value,
            status:currentTimestamp < timestamp ? 'upcoming' : 'completed'
          }
        });
        const uniqueLocations:any[] = [];
        for(const point of journey){
          const index = uniqueLocations.findIndex((location:any)=>location.location === point.location);
          if(index === -1){
            uniqueLocations.push(point);
          }else{
            uniqueLocations[index] = point;
          }
        }
        journey = uniqueLocations
          
        // Normalize origin and destination to match expected structure
        const origin = typeof shipment.origin === 'string' 
          ? { city: shipment.origin, country: 'Unknown' } 
          : shipment.origin || { city: 'Unknown', country: 'Unknown' };
          
        const destination = typeof shipment.destination === 'string'
          ? { city: shipment.destination, country: 'Unknown' }
          : shipment.destination || { city: 'Unknown', country: 'Unknown' };
        
        // Combine original data with our processed/normalized data
        const processedShipment: Shipment = {
          ...shipment,
          id,
          number: shipment.number || `SH-${Math.floor(10000 + Math.random() * 90000)}`,
          status: ((shipment.status || 'in-transit') as string).toLowerCase() as 'in-transit' | 'delivered' | 'delayed',
          origin,
          destination,
          departureTime: shipment.departureTime || new Date().toISOString(),
          estimatedDelivery: shipment.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          carrier: shipment.carrier || 'Unknown Carrier',
          currentTemperature: parseFloat(shipment.currentTemperature?.toString() || '5'),
          temperatureHistory,
          journey,
          alerts: shipment.alerts || [],
          contents: shipment.contents || 'Unknown Contents',
          billOfLading: shipment.billOfLading || `BOL-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: currentUser.uid,
          ...shipment.sourceFile ? { sourceFile: shipment.sourceFile } : {}
        };
        
        console.log(`Processed shipment:`, JSON.stringify(processedShipment, null, 2));
        return processedShipment;
      });
      
      // Save to Firebase with batch write for atomicity
      const batch = writeBatch(db);
      
      // Add each shipment to the batch
      const shipmentDocs: Shipment[] = [];
      
      processedShipments.forEach(shipment => {
        // Create a new document reference
        const docRef = doc(shipmentsRef);
        // Store the new document's ID in the shipment object
        const shipmentWithId = { ...shipment, id: docRef.id };
        // Add the document to the batch
        batch.set(docRef, shipmentWithId);
        // Save for updating UI
        shipmentDocs.push(shipmentWithId);
      });
      
      // Commit the batch
      logFirebaseOperation('committing batch write');
      await batch.commit();
      logFirebaseOperation('batch write completed');
      
      // Update the local state with the new shipments
      setShipments(prev => [...shipmentDocs]);
      
      console.log(`Added ${processedShipments.length} shipments from imported file`);
      return true;
    } catch (error: any) {
      console.error('[ShipmentContext] Error updating shipments:', error);
      logFirebaseOperation('updateShipments', false, error);
      return false;
    }
  }, [currentUser, getShipmentsRef]);

  // Modify uploadShipmentFile to also use our safe operation pattern
  const uploadShipmentFile = useCallback(async (file: File): Promise<{ downloadUrl: string }> => {
    return safeFirebaseOperation(
      async () => {
        if (!currentUser?.uid) {
          throw new Error('User must be logged in to upload files');
        }
        
        // Create a reference to the file in Firebase Storage with user-specific path
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = `shipment-files/${currentUser.uid}/${fileName}`;
        const storageRef = ref(storage, filePath);
        
        // Upload the file to Firebase Storage with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Return a promise that resolves with the download URL
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Track progress if needed
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload progress: ${progress}%`);
            },
            (error) => {
              // Handle upload errors
              console.error('Error uploading file:', error);
              reject(error);
            },
            async () => {
              // Upload completed successfully, get download URL
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File uploaded successfully:', downloadUrl);
                resolve({ downloadUrl });
              } catch (urlError) {
                console.error('Error getting download URL:', urlError);
                reject(urlError);
              }
            }
          );
        });
      },
      { downloadUrl: '' },
      'uploadShipmentFile'
    );
  }, [currentUser]);

  const deleteShipment = async (shipmentId: string) => {
    try {
      const shipmentRef = doc(db, 'shipments', shipmentId);
      await deleteDoc(shipmentRef);
      
      // Update local state
      setShipments(prevShipments => prevShipments.filter(s => s.id !== shipmentId));
    } catch (error) {
      console.error('Error deleting shipment:', error);
      throw error;
    }
  };

  const updateShipment = async (shipment: Shipment) => {
    try {
      const shipmentRef = doc(db, 'shipments', shipment.id);
      const shipmentData = {
        ...shipment,
        id: undefined // Remove id from the data to be stored
      };
      await updateDoc(shipmentRef, shipmentData);
      
      // Update local state
      setShipments(prevShipments => 
        prevShipments.map(s => s.id === shipment.id ? shipment : s)
      );
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
  };

  const createTemperatureAlert = (
    temperature: number,
    minThreshold: number,
    maxThreshold: number,
    location: string
  ): TemperatureAlert => {
    const isAboveMax = temperature > maxThreshold;
    const isBelowMin = temperature < minThreshold;
    
    return {
      id: `alert-${Date.now()}`,
      type: 'critical',
      message: `Temperature ${isAboveMax ? 'exceeds maximum' : 'below minimum'} threshold: ${temperature}°C (Safe range: ${minThreshold}°C - ${maxThreshold}°C)`,
      timestamp: new Date().toISOString(),
      location,
      read: false,
      temperature,
      threshold: {
        min: minThreshold,
        max: maxThreshold
      }
    };
  };

  const checkTemperatureThresholds = useCallback(async (shipment: Shipment, minThreshold: number, maxThreshold: number) => {
    if (!shipment.temperatureHistory?.length) return;

    const latestReading = shipment.temperatureHistory[shipment.temperatureHistory.length - 1];
    const temperature = latestReading.value;
    const location = shipment.origin?.city || 'Unknown';

    // Check if temperature is out of range
    if (temperature > maxThreshold || temperature < minThreshold) {
      // Check for existing unread alerts within the last hour
      const existingAlert = shipment.alerts?.find(
        a => a.type === 'critical' && 
        a.message.includes('Temperature') &&
        !a.read &&
        new Date(a.timestamp).getTime() > Date.now() - 1000 * 60 * 60 // Within last hour
      );

      if (!existingAlert) {
        const newAlert = createTemperatureAlert(temperature, minThreshold, maxThreshold, location);
        
        const updatedShipment = {
          ...shipment,
          alerts: [...(shipment.alerts || []), newAlert]
        };

        await updateShipment(updatedShipment);
      }
    }
  }, []);

  const value = {
    shipments,
    loading,
    getShipment,
    markAlertAsRead,
    updateShipments,
    clearAllShipments,
    uploadShipmentFile,
    deleteShipment,
    updateShipment,
    checkTemperatureThresholds
  };

  return (
    <ShipmentContext.Provider value={value}>
      {children}
    </ShipmentContext.Provider>
  );
};