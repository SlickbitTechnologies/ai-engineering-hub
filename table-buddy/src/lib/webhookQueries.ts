import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp,
  getDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { Table, Reservation, OperatingHours, TableSettings, CallLog } from './interfaces';

export async function getTablesByCapacity(no_of_people: number): Promise<Table[]> {
    try {
        const tablesRef = collection(db, 'tables');
        const q = query(
            tablesRef,
            where('status', '==', 'available'),
            where('capacity', '>=', no_of_people)
        );
        console.log("Querying tables by capacity:",no_of_people);
        const querySnapshot = await getDocs(q);
        const tables =  querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
        })) as Table[];
        console.log("Tables found:",tables);
        return tables;
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
}

export async function getReservationsByDateAndTime(date: string, time: string, turnaroundTime: number): Promise<Reservation[]> {
    try {
        const reservationsRef = collection(db, 'reservations');
        const timeNum = parseInt(time);
        const q = query(
            reservationsRef,
            where('date', '==', date),
            where('status', '==', 'confirmed'),
            where('time', '>=', timeNum - turnaroundTime),
            where('time', '<=', timeNum + turnaroundTime)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
        })) as Reservation[];
    } catch (error) {
        console.error('Error fetching reservations:', error);
        throw error;
    }
}

export async function getOperatingHoursByDay(day: string): Promise<OperatingHours | null> {
    try {
        const operatingHoursRef = collection(db, 'operating_hours');
        const q = query(operatingHoursRef, where('day', '==', day));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return null;
        const document: QueryDocumentSnapshot<DocumentData> = querySnapshot.docs[0];
        return { id: document.id, ...document.data() } as OperatingHours;
    } catch (error) {
        console.error('Error fetching operating hours:', error);
        throw error;
    }
}

export async function getTurnaroundTime(): Promise<TableSettings | null> {
    try {
        const settingsDoc = doc(db, 'table_settings', 'default');
        const docSnap = await getDoc(settingsDoc);
        
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as TableSettings;
    } catch (error) {
        console.error('Error fetching turnaround time:', error);
        throw error;
    }
}

interface CreateReservationInput {
    name: string;
    phone: string;
    date: string;
    time: string;
    no_of_people: number;
    table_id: string;
    status?: string;
    occasion?: string;
    special_requests?: string;
}

export async function createReservationInWebhook(input: CreateReservationInput): Promise<{ id: string }> {
    try {
        const reservationsRef = collection(db, 'reservations');
        const now = Timestamp.now();
        
        const docRef = await addDoc(reservationsRef, {
            customer_name: input.name,
            customer_phone: input.phone,
            date: input.date,
            time: input.time,
            party_size: input.no_of_people,
            table_id: input.table_id,
            status: input.status || 'confirmed',
            occasion: input.occasion || null,
            special_requests: input.special_requests || null,
            created_at: now,
            updated_at: now
        });
        
        return { id: docRef.id };
    } catch (error) {
        console.error('Error creating reservation:', error);
        throw error;
    }
}

export async function createCallLog(input: Omit<CallLog, 'id' | 'created_at'>): Promise<{ id: string }> {
    try {
        const callLogsRef = collection(db, 'call_logs');
        const docRef = await addDoc(callLogsRef, {
            ...input,
            created_at: Timestamp.now()
        });
        console.log("Call log created successfully. Returning result.");
        return { id: docRef.id };
    } catch (error) {
        console.error('Error creating call log:', error);
        throw error;
    }
}

export async function getNextDayOperatingHours(day: string): Promise<OperatingHours | null> {
    try {
        const operatingHoursRef = collection(db, 'operating_hours');
        const q = query(operatingHoursRef, where('day', '==', day));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return null;
        const document: QueryDocumentSnapshot<DocumentData> = querySnapshot.docs[0];
        return { id: document.id, ...document.data() } as OperatingHours;
    } catch (error) {
        console.error('Error fetching operating hours:', error);
        throw error;
    }
}
