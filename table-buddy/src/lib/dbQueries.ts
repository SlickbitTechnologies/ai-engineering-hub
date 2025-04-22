import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  OperatingHours, 
  RestaurantSettings, 
  Table, 
  Reservation, 
  CallLog 
} from './interfaces';
import { TableSettings } from '@/store/api/settingsApi';

const defaultHours = [
  { day: 'monday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
  { day: 'tuesday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
  { day: 'wednesday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
  { day: 'thursday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
  { day: 'friday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
  { day: 'saturday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
  { day: 'sunday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' }
];

export async function initializeOperatingHours() {
  try {
    const hoursRef = collection(db, 'operating_hours');
    const snapshot = await getDocs(hoursRef);
    
    // Only initialize if collection is empty
    if (snapshot.empty) {
      console.log('Initializing default operating hours...');
      for (const hours of defaultHours) {
        await addDoc(hoursRef, {
          ...hours,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        });
      }
      console.log('Default operating hours initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing operating hours:', error);
    throw error;
  }
}

export async function getCalls() {
  try {
    const callLogsRef = collection(db, 'call_logs');
    const q = query(callLogsRef, orderBy('call_date', 'desc'), orderBy('call_time', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const calls = await Promise.all(querySnapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
      const callData = { id: docSnapshot.id, ...docSnapshot.data() } as CallLog;
      if (callData.reservation_id) {
        const reservationDoc = await getDoc(doc(db, 'reservations', callData.reservation_id));
        const reservationData = reservationDoc.data() as Reservation;
        return {
          ...callData,
          customer_name: reservationData?.customer_name,
          party_size: reservationData?.party_size,
          reservation_status: reservationData?.status
        };
      }
      return callData;
    }));
    
    return calls;
  } catch (error) {
    console.error('Error fetching calls:', error);
    throw error;
  }
}

export async function getOperatingHours() {
  try {
    const hoursRef = collection(db, 'operating_hours');
    const querySnapshot = await getDocs(hoursRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OperatingHours[];
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    throw error;
  }
}

export async function updateOperatingHours(item: Omit<OperatingHours, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const hoursRef = collection(db, 'operating_hours');
    const q = query(hoursRef, where('day', '==', item.day));
    const querySnapshot = await getDocs(q);
    
    const now = Timestamp.now();
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'operating_hours', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        ...item,
        updated_at: now
      });
    } else {
      await addDoc(hoursRef, {
        ...item,
        created_at: now,
        updated_at: now
      });
    }
    return true;
  } catch (error) {
    console.error('Error updating operating hours:', error);
    throw error;
  }
}

export async function getReservationById(id: string) {
  try {
    const reservationDoc = await getDoc(doc(db, 'reservations', id));
    if (!reservationDoc.exists()) return null;
    
    const reservationData = { id: reservationDoc.id, ...reservationDoc.data() } as Reservation;
    const tableDoc = await getDoc(doc(db, 'tables', reservationData.table_id));
    const tableData = tableDoc.data();
    
    return {
      ...reservationData,
      table_name: tableData?.name,
      table_section: tableData?.section
    };
  } catch (error) {
    console.error('Error fetching reservation:', error);
    throw error;
  }
}

export async function getTableById(id: string) {
  try {
    const tableDoc = await getDoc(doc(db, 'tables', id));
    if (!tableDoc.exists()) return null;
    return { id: tableDoc.id, ...tableDoc.data() } as Table;
  } catch (error) {
    console.error('Error fetching table:', error);
    throw error;
  }
}

export async function findExistingReservation(table_id: string, date: string, time: string, id: string) {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('table_id', '==', table_id),
      where('date', '==', date),
      where('time', '==', time),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    const reservations = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Reservation)
      .filter(res => res.id !== id);
    
    return reservations[0] || null;
  } catch (error) {
    console.error('Error fetching reservation:', error);
    throw error;
  }
}

export async function updateReservation(
  id: string,
  data: Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at'>>
) {
  try {
    const docRef = doc(db, 'reservations', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
    return { id };
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
}

export async function deleteReservation(id: string) {
  try {
    await deleteDoc(doc(db, 'reservations', id));
    return true;
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
}

export async function getReservationCountByDate(year: string, month: string) {
  try {
    const reservationsRef = collection(db, 'reservations');
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    const q = query(
      reservationsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    const reservations = querySnapshot.docs.map(doc => ({
      date: doc.data().date,
      status: doc.data().status
    }));

    // Group by date
    const groupedReservations = reservations.reduce((acc, res) => {
      if (!acc[res.date]) {
        acc[res.date] = { count: 0, statuses: [] };
      }
      acc[res.date].count++;
      acc[res.date].statuses.push(res.status);
      return acc;
    }, {} as Record<string, { count: number; statuses: string[] }>);

    return Object.entries(groupedReservations).map(([date, data]) => ({
      date,
      count: data.count,
      statuses: data.statuses.join(',')
    }));
  } catch (error) {
    console.error('Error fetching reservation count by date:', error);
    throw error;
  }
}

export async function getRecentReservations() {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(reservationsRef, orderBy('created_at', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customerName: data.customer_name,
        phoneNumber: data.customer_phone,
        date: data.date,
        time: data.time,
        guests: data.party_size,
        status: data.status,
        created: data.created_at
      };
    });
  } catch (error) {
    console.error('Error fetching recent reservations:', error);
    throw error;
  }
}

export async function getReservationsByFilter(date: string | null, status: string | null) {
  try {
    const reservationsRef = collection(db, 'reservations');
    let q = query(reservationsRef);
    
    if (date) {
      q = query(q, where('date', '==', date));
    }
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const reservations = await Promise.all(querySnapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
      const reservationData = { id: docSnapshot.id, ...docSnapshot.data() } as Reservation;
      const tableDoc = await getDoc(doc(db, 'tables', reservationData.table_id));
      const tableData = tableDoc.data() as Table | undefined;
      
      return {
        ...reservationData,
        table_name: tableData?.name,
        table_section: tableData?.section
      };
    }));
    
    return reservations;
  } catch (error) {
    console.error('Error fetching reservations by filter:', error);
    throw error;
  }
}

export async function getReservations(table_id: string, date: string, time: string) {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('table_id', '==', table_id),
      where('date', '==', date),
      where('time', '==', time),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reservation[];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

export async function createReservation(data: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  try {
    const reservationsRef = collection(db, 'reservations');
    const now = Timestamp.now();
    const docRef = await addDoc(reservationsRef, {
      ...data,
      status: 'pending',
      created_at: now,
      updated_at: now
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

export async function getReservationCountByDateAndStatus(date: string, status: string) {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('date', '==', date),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching reservation count:', error);
    throw error;
  }
}

export async function getUpcomingReservations(today: string) {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourLaterTime = oneHourLater.toTimeString().slice(0, 5);

    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('date', '==', today),
      where('status', '==', 'confirmed'),
      where('time', '>=', currentTime),
      where('time', '<=', oneHourLaterTime)
    );
    
    const querySnapshot = await getDocs(q);
    return { count: querySnapshot.size };
  } catch (error) {
    console.error('Error fetching upcoming reservations:', error);
    throw error;
  }
}

export async function updateTable(id: string, data: Partial<Omit<Table, 'id' | 'created_at' | 'updated_at'>>) {
  try {
    const docRef = doc(db, 'tables', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
    return { id };
  } catch (error) {
    console.error('Error updating table:', error);
    throw error;
  }
}

export async function deleteTable(id: string) {
  try {
    await deleteDoc(doc(db, 'tables', id));
    return { id };
  } catch (error) {
    console.error('Error deleting table:', error);
    throw error;
  }
}

export async function getReservationsByTableId(table_id: string) {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(reservationsRef, where('table_id', '==', table_id));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reservation[];
  } catch (error) {
    console.error('Error fetching reservations by table id:', error);
    throw error;
  }
}

export async function getReservedTables() {
  try {
    const tablesRef = collection(db, 'tables');
    const querySnapshot = await getDocs(tablesRef);
    
    const tables = await Promise.all(querySnapshot.docs.map(async (tableDoc) => {
      const tableData = { id: tableDoc.id, ...tableDoc.data() } as Table;
      
      // Get today's reservations for this table
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('table_id', '==', tableDoc.id),
        where('date', '==', new Date().toISOString().split('T')[0]),
        where('status', '!=', 'cancelled')
      );
      
      const reservationSnapshot = await getDocs(q);
      const reservation = reservationSnapshot.docs[0]?.data() as Reservation | undefined;
      
      return {
        id: tableData.id,
        tableName: tableData.name,
        capacity: `${tableData.capacity} guests`,
        section: tableData.section,
        attributes: tableData.attributes,
        customerName: reservation?.customer_name,
        time: reservation?.time,
        guests: reservation ? `${reservation.party_size} guests` : undefined,
        status: reservation?.status
      };
    }));
    
    return tables;
  } catch (error) {
    console.error('Error fetching reserved tables:', error);
    throw error;
  }
}

export async function getTables() {
  try {
    const tablesRef = collection(db, 'tables');
    const querySnapshot = await getDocs(tablesRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Table[];
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}

export async function createTable(data: Omit<Table, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const tablesRef = collection(db, 'tables');
    const now = Timestamp.now();
    const docRef = await addDoc(tablesRef, {
      ...data,
      created_at: now,
      updated_at: now
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

export async function getRestaurantSettings() {
  try {
    const settingsRef = collection(db, 'restaurant_settings');
    const querySnapshot = await getDocs(settingsRef);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as RestaurantSettings;
  } catch (error) {
    console.error('Error fetching restaurant settings:', error);
    throw error;
  }
}

export async function updateRestaurantSettings(data: Omit<RestaurantSettings, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const settingsRef = collection(db, 'restaurant_settings');
    const querySnapshot = await getDocs(settingsRef);
    const now = Timestamp.now();

    if (!querySnapshot.empty) {
      const docRef = doc(db, 'restaurant_settings', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        ...data,
        updated_at: now
      });
      return { id: docRef.id };
    }

    const docRef = await addDoc(settingsRef, {
      ...data,
      created_at: now,
      updated_at: now
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error updating restaurant settings:', error);
    throw error;
  }
}

export async function getTableSettings() {
  try {
    const settingsRef = collection(db, 'table_settings');
    const querySnapshot = await getDocs(settingsRef);
    if (querySnapshot.empty) return null;

    return querySnapshot.docs[0].data() as TableSettings;
  } catch (error) {
    console.error('Error fetching table settings:', error);
    throw error;
  }
}

export async function updateTableSettings(data: Omit<TableSettings, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const settingsRef = collection(db, 'table_settings');
    const querySnapshot = await getDocs(settingsRef);
    const now = Timestamp.now();

    if (!querySnapshot.empty) {
      const docRef = doc(db, 'table_settings', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        ...data,
        updated_at: now
      });
      return { id: docRef.id };
    }

    const docRef = await addDoc(settingsRef, {
      ...data,
      created_at: now,
      updated_at: now
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error updating table settings:', error);
    throw error;
  }
}


