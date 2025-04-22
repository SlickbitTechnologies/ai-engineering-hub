export interface RestaurantSettings {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface OperatingHours {
  id: string;
  day: string;
  lunch_opening_time: string;
  lunch_closing_time: string;
  dinner_opening_time: string;
  dinner_closing_time: string;
  created_at: string;
  updated_at: string;
}

export interface TableSettings {
  id: string;
  turnaround_time: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  name: string;
  section: string;
  capacity: number;
  attributes?: string;
  status: 'available' | 'occupied' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  table_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  party_size: number;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  occasion?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  call_id: string;
  reservation_id?: string;
  customer_phone: string;
  call_date: string;
  call_time: string;
  call_duration: number;
  reservation_date: string;
  reservation_time: string;
  created_at: string;
}

export interface CallLogWithReservation extends CallLog {
  customer_name: string;
  party_size: number;
  reservation_status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
} 