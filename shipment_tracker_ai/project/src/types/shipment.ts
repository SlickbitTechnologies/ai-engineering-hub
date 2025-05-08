export interface Shipment {
  id: string;
  recipientPhone: string;
  currentTemperature: number;
  temperatureThresholds: {
    min: number;
    max: number;
  };
  status: string;
  location: string;
  timestamp: string;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'temperature' | 'location' | 'other';
  message: string;
  timestamp: string;
  isRead: boolean;
} 