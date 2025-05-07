import { Shipment } from '../contexts/ShipmentContext';

// Mock data for demonstration
export const mockShipments: Shipment[] = [
  {
    id: "1",
    number: "SH-23856",
    status: "in-transit",
    origin: {
      city: "Boston, MA",
      country: "USA"
    },
    destination: {
      city: "New York, NY",
      country: "USA"
    },
    departureTime: "2025-05-01T10:00:00Z",
    estimatedDelivery: "2025-05-06T15:00:00Z",
    carrier: "FrostFreight Logistics",
    currentTemperature: 5.2,
    temperatureHistory: [
      { timestamp: "2025-05-01T10:30:00Z", value: 4.5 },
      { timestamp: "2025-05-01T11:30:00Z", value: 4.8 },
      { timestamp: "2025-05-01T12:30:00Z", value: 5.2 },
      { timestamp: "2025-05-01T13:30:00Z", value: 5.1 },
      { timestamp: "2025-05-01T14:30:00Z", value: 5.3 }
    ],
    journey: [
      { location: "Boston, MA", timestamp: "2025-05-01T10:00:00Z", temperature: 4.5, status: "completed" },
      { location: "Providence, RI", timestamp: "2025-05-01T12:00:00Z", temperature: 4.8, status: "completed" },
      { location: "New Haven, CT", timestamp: "2025-05-01T14:00:00Z", temperature: 5.2, status: "current" },
      { location: "New York, NY", timestamp: "2025-05-06T15:00:00Z", temperature: 0, status: "upcoming" }
    ],
    alerts: [
      {
        id: "alert-1",
        type: "info",
        message: "Shipment has departed from Boston",
        timestamp: "2025-05-01T10:00:00Z",
        location: "Boston, MA",
        read: true
      }
    ],
    contents: "Vaccine Delivery",
    billOfLading: "BOL-985632"
  },
  {
    id: "2",
    number: "SH-24921",
    status: "in-transit",
    origin: {
      city: "Chicago, IL",
      country: "USA"
    },
    destination: {
      city: "Milwaukee, WI",
      country: "USA"
    },
    departureTime: "2025-05-03T08:00:00Z",
    estimatedDelivery: "2025-05-05T14:00:00Z",
    carrier: "PolarExpress Shipping",
    currentTemperature: 3.8,
    temperatureHistory: [
      { timestamp: "2025-05-03T08:30:00Z", value: 4.0 },
      { timestamp: "2025-05-03T09:30:00Z", value: 3.8 },
      { timestamp: "2025-05-03T10:30:00Z", value: 3.9 },
      { timestamp: "2025-05-03T11:30:00Z", value: 3.7 },
      { timestamp: "2025-05-03T12:30:00Z", value: 3.8 }
    ],
    journey: [
      { location: "Chicago, IL", timestamp: "2025-05-03T08:00:00Z", temperature: 4.0, status: "completed" },
      { location: "Kenosha, WI", timestamp: "2025-05-03T12:00:00Z", temperature: 3.8, status: "current" },
      { location: "Milwaukee, WI", timestamp: "2025-05-05T14:00:00Z", temperature: 0, status: "upcoming" }
    ],
    alerts: [],
    contents: "Blood Samples Delivery",
    billOfLading: "BOL-654198"
  },
  {
    id: "3",
    number: "SH-25632",
    status: "delivered",
    origin: {
      city: "Los Angeles, CA",
      country: "USA"
    },
    destination: {
      city: "San Francisco, CA",
      country: "USA"
    },
    departureTime: "2025-04-28T15:00:00Z",
    estimatedDelivery: "2025-04-29T10:00:00Z",
    carrier: "MedExpress Transport",
    currentTemperature: 4.0,
    temperatureHistory: [
      { timestamp: "2025-04-28T15:30:00Z", value: 4.2 },
      { timestamp: "2025-04-28T16:30:00Z", value: 4.0 },
      { timestamp: "2025-04-28T17:30:00Z", value: 4.1 },
      { timestamp: "2025-04-28T18:30:00Z", value: 3.9 },
      { timestamp: "2025-04-28T19:30:00Z", value: 4.0 }
    ],
    journey: [
      { location: "Los Angeles, CA", timestamp: "2025-04-28T15:00:00Z", temperature: 4.2, status: "completed" },
      { location: "Bakersfield, CA", timestamp: "2025-04-28T18:00:00Z", temperature: 4.0, status: "completed" },
      { location: "San Francisco, CA", timestamp: "2025-04-29T09:45:00Z", temperature: 4.0, status: "completed" }
    ],
    alerts: [
      {
        id: "alert-1",
        type: "info",
        message: "Shipment has departed from Los Angeles",
        timestamp: "2025-04-28T15:00:00Z",
        location: "Los Angeles, CA",
        read: true
      },
      {
        id: "alert-2",
        type: "info",
        message: "Shipment has been delivered successfully",
        timestamp: "2025-04-29T09:45:00Z",
        location: "San Francisco, CA",
        read: false
      }
    ],
    contents: "Organ Transport",
    billOfLading: "BOL-789456"
  }
];