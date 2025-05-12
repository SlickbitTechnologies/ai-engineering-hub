export interface Shipment {
  id: string;
  number: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed';
  currentLocation: string;
  estimatedDelivery: string;
  recipientName: string;
  recipientPhone: string;
  currentTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  temperatureHistory: {
    timestamp: string;
    temperature: number;
  }[];
  alerts: Alert[];
  lastUpdated: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
} 