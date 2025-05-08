import { Shipment } from '../contexts/ShipmentContext';
import * as XLSX from 'xlsx';

// Convert shipments to CSV format for export
export const shipmentsToCSV = (shipments: Shipment[]): string => {
  // Define CSV headers - use lowercase with underscores to match the field names we expect when importing
  const headers = [
    'id',
    'number',
    'status',
    'origin',
    'origin_country',
    'destination',
    'destination_country',
    'departure_time',
    'estimated_delivery',
    'carrier',
    'current_temperature',
    'contents',
    'bill_of_lading'
  ];
  
  // Create CSV content
  let csv = headers.join(',') + '\n';
  
  // If we have shipments, add their data
  if (shipments.length > 0) {
    shipments.forEach(shipment => {
      const row = [
        shipment.id,
        shipment.number,
        shipment.status,
        shipment.origin.city,
        shipment.origin.country,
        shipment.destination.city,
        shipment.destination.country,
        shipment.departureTime,
        shipment.estimatedDelivery,
        shipment.carrier,
        shipment.currentTemperature.toString(),
        shipment.contents,
        shipment.billOfLading
      ];
      
      // Ensure strings with commas are quoted
      const formattedRow = row.map(cell => {
        if (typeof cell === 'string' && cell.includes(',')) {
          return `"${cell}"`;
        }
        return cell;
      });
      
      csv += formattedRow.join(',') + '\n';
    });
  } else {
    // Add a sample row template with empty values
    const templateRow = [
      'SH001',                         // id
      'SH-12345',                      // number
      'in-transit',                    // status (can be: in-transit, delivered, delayed)
      'New York, NY',                  // origin city
      'USA',                           // origin country
      'Los Angeles, CA',               // destination city
      'USA',                           // destination country
      '2023-05-01T08:00:00.000Z',      // departure time (ISO format)
      '2023-05-04T16:00:00.000Z',      // estimated delivery (ISO format)
      'ColdChain Express',             // carrier
      '5.2',                           // current temperature
      'Vaccine Shipment',              // contents
      'BOL-123456'                     // bill of lading
    ];
    
    csv += templateRow.join(',') + '\n';
    
    // Add a comment row explaining how to use the template
    csv += '# Replace the above example row with your actual data. You can add as many rows as needed.\n';
    csv += '# For multiple temperature readings, create a separate Excel sheet with columns: shipment_id, timestamp, value\n';
  }
  
  return csv;
};

// Generate Excel template with multiple sheets
export const generateExcelTemplate = (): XLSX.WorkBook => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Shipment Details
  const shipmentHeaders = [
    'Shipment Number',
    'Bill of Lading Number',
    'Carrier',
    'Origin',
    'Destination',
    'Start Time',
    'Expected Delivery',
    'Contents',
    'Sender Contact Name',
    'Designation',
    'Organization',
    'Phone Number',
    'Email'
  ];

  const shipmentData = [
    [
      'SH-12345',                    // Shipment Number
      'BOL-123456',                  // Bill of Lading Number
      'ColdChain Express',           // Carrier
      'New York, NY',                // Origin
      'Los Angeles, CA',             // Destination
      '2024-03-20T08:00:00.000Z',   // Start Time
      '2024-03-23T16:00:00.000Z',   // Expected Delivery
      'Vaccine Shipment',            // Contents
      'John Doe',                    // Sender Contact Name
      'Logistics Manager',           // Designation
      'Pharma Corp',                 // Organization
      '+1234567890',                 // Phone Number
      'john.doe@pharmacorp.com'      // Email
    ]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([shipmentHeaders, ...shipmentData]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Shipment Details');

  // Sheet 2: Temperature Readings
  const tempHeaders = [
    'Timestamp',
    'Location',
    'Temperature (°C)',
    'Temperature (°F)',
    'Status'
  ];

  const tempData = [
    [
      '2024-03-20T08:00:00.000Z',   // Timestamp
      'New York Warehouse',          // Location
      '5.2',                        // Temperature (°C)
      '41.36',                      // Temperature (°F)
      'completed'                   // Status
    ],
    [
      '2024-03-20T14:00:00.000Z',   // Timestamp
      'Chicago Hub',                // Location
      '5.5',                        // Temperature (°C)
      '41.9',                       // Temperature (°F)
      'completed'                   // Status
    ]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet([tempHeaders, ...tempData]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Temperature Readings');

  return wb;
};

// Download sample data as Excel
export const downloadSampleExcel = (): void => {
  // Generate the Excel workbook
  const wb = generateExcelTemplate();
  
  // Convert workbook to binary string
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to blob
  const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
  
  // Create download link and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'shipment_template.xlsx');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to convert string to ArrayBuffer
function s2ab(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
} 