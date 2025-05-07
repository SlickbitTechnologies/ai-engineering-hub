import { Shipment } from '../contexts/ShipmentContext';

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

// Download sample data as CSV
export const downloadSampleCSV = (): void => {
  // Create an empty sample CSV template
  const csv = shipmentsToCSV([]);
  
  // Create a blob and download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'shipment_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 