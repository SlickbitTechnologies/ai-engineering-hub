import React, { useState, useEffect, useRef } from 'react';
import { Upload, Bell, Phone, Thermometer, Download, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useShipments } from '../contexts/ShipmentContext';
import { downloadSampleExcel } from '../utils/sampleDataGenerator';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function excelDateToJSDate(serial: number): string {
  // Excel's epoch starts at 1900-01-01
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400; // seconds
  const date_info = new Date(utc_value * 1000);
  
  // Add fractional day as time
  const fractional_day = serial - Math.floor(serial);
  const total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  const minutes = Math.floor(total_seconds / 60) % 60;
  const hours = Math.floor(total_seconds / 3600);
  
  // Set the time components
  date_info.setHours(hours, minutes, seconds, 0);
  
  // Convert to IST (UTC+5:30)
  const istDate = new Date(date_info.getTime() + (5.5 * 60 * 60 * 1000));
  
  return istDate.toISOString();
}

const SettingsPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use settings context
  const { minTemperatureThreshold, maxTemperatureThreshold, updateTemperatureThresholds, updatePhoneNumber } = useSettings();
  const { 
    updateShipments, 
    clearAllShipments, 
    uploadShipmentFile } = useShipments();
  
  // Initialize state as empty strings to show empty input fields with placeholders
  const [minThreshold, setMinThreshold] = useState<string>('');
  const [maxThreshold, setMaxThreshold] = useState<string>('');
  
  // State for validation error messages
  const [minThresholdError, setMinThresholdError] = useState<string>('');
  const [maxThresholdError, setMaxThresholdError] = useState<string>('');
  
  // Update local state only once when the component mounts, but don't overwrite user changes
  useEffect(() => {
    // Only set values from context if they're not null and we haven't set values yet
    if (minTemperatureThreshold !== null && minThreshold === '') {
      setMinThreshold(minTemperatureThreshold.toString());
    }
    if (maxTemperatureThreshold !== null && maxThreshold === '') {
      setMaxThreshold(maxTemperatureThreshold.toString());
    }
  }, [minTemperatureThreshold, maxTemperatureThreshold]);
  
  // Handle validation on change
  const handleMinThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinThreshold(value);
    
    if (value.trim() !== '' && maxThreshold.trim() !== '') {
      const minVal = parseFloat(value);
      const maxVal = parseFloat(maxThreshold);
      
      if (minVal >= maxVal) {
        setMinThresholdError('Min temperature must be lower than max');
      } else {
        setMinThresholdError('');
        setMaxThresholdError('');
      }
    } else {
      setMinThresholdError('');
    }
  };
  
  const handleMaxThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxThreshold(value);
    
    if (value.trim() !== '' && minThreshold.trim() !== '') {
      const minVal = parseFloat(minThreshold);
      const maxVal = parseFloat(value);
      
      if (minVal >= maxVal) {
        setMaxThresholdError('Max temperature must be higher than min');
      } else {
        setMinThresholdError('');
        setMaxThresholdError('');
      }
    } else {
      setMaxThresholdError('');
    }
  };
  
  // Update check for threshold save button
  const isThresholdButtonEnabled = 
    minThreshold.trim() !== '' && 
    maxThreshold.trim() !== '' && 
    !minThresholdError && 
    !maxThresholdError;
  
  // Check if phone save button should be enabled
  const isPhoneButtonEnabled = phoneNumber !== '';
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(false);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Basic validation - check file size (max 5MB) and type
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("File size exceeds 5MB limit");
        return;
      }
      
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['csv', 'xlsx', 'xls'];
      
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        setUploadError("Invalid file type. Please upload CSV or Excel files");
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;
    
    // Check if temperature thresholds and phone number are set
    if (!phoneNumber) {
      alert('Please set your phone number in the Notification Settings section before uploading files.');
      return;
    }
    
    if (minTemperatureThreshold === null || maxTemperatureThreshold === null) {
      alert('Please set both minimum and maximum temperature thresholds in the Notification Settings section before uploading files.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setIsProcessing(true);
      
      let parsedData: any[] = [];
      
      try {
        // Process the file based on its type
        if (file.name.endsWith('.csv')) {
          const fileText = await file.text();
          parsedData = await new Promise<any[]>((resolve, reject) => {
            Papa.parse(fileText, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (header) => {
                // Convert headers to standardized format
                return header.trim().toLowerCase().replace(/\s+/g, '_');
              },
              complete: (results: Papa.ParseResult<any>) => {
                console.log('CSV Headers:', results.meta.fields);
                console.log('First row sample:', results.data[0]);
                console.log('Total rows:', results.data.length);
                
                // Map fields to match expected Shipment fields if needed
                const mappedData = results.data.map((row: any) => {
                  // Print row to see what we're working with
                  console.log('Processing row:', row);
                  
                  // Create standardized object with all potential field variations
                  return {
                    id: row.id || row.shipment_id || row.tracking_id || `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    number: row.number || row.shipment_number || row.tracking_number || row.id || row.shipment_id,
                    status: row.status || row.shipment_status || 'in-transit',
                    
                    // Handle origin fields
                    origin: {
                      city: row.origin || row.origin_city || row.source || row.from_city || row.departure_city || 'Unknown',
                      country: row.origin_country || row.from_country || row.source_country || 'Unknown'
                    },
                    
                    // Handle destination fields
                    destination: {
                      city: row.destination || row.destination_city || row.dest || row.to_city || row.arrival_city || 'Unknown',
                      country: row.destination_country || row.to_country || row.dest_country || 'Unknown'
                    },
                    
                    departureTime: row.departure_time || row.departure_date || row.ship_date || new Date().toISOString(),
                    estimatedDelivery: row.estimated_delivery || row.eta || row.arrival_date || row.delivery_date || 
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    
                    carrier: row.carrier || row.shipping_company || row.logistics_provider || 'Unknown Carrier',
                    
                    // Handle temperature data
                    currentTemperature: parseFloat(row.current_temperature || row.temperature || row.temp || '5'),
                    
                    // Other fields
                    contents: row.contents || row.cargo || row.items || row.shipment_contents || 'Unknown Contents',
                    billOfLading: row.bill_of_lading || row.bol || row.tracking_document || `BOL-${Math.floor(100000 + Math.random() * 900000)}`
                  };
                });
                
                resolve(mappedData);
              },
              error: (error: Error) => {
                reject(error);
              }
            });
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Excel parsing implementation using xlsx library
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          
          // Get sheet names
          const sheetNames = workbook.SheetNames;
          console.log('Excel sheets found:', sheetNames);
          
          // First sheet is expected to contain shipment data
          if (sheetNames.length > 0) {
            // --- NEW LOGIC: Parse first sheet as key-value pairs ---
            const firstSheet = workbook.Sheets[sheetNames[0]];
            const rows: [any, any][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as [any, any][]; // Array of arrays
            const shipmentDetails: any = {};
            rows.forEach(([key, value]: [any, any]) => {
              if (key && value !== undefined) {
                const normalizedKey = key.toString().trim().toLowerCase().replace(":","").replace(/[^a-z0-9]+/g, '_');
                // If the key is a date/time field, convert number to string
                if (["start_time", "expected_delivery", "departure_time", "arrival_time", "timestamp"].includes(normalizedKey)) {
                  if (typeof value === 'number') {
                    shipmentDetails[normalizedKey] = excelDateToJSDate(value);
                  } else {
                    shipmentDetails[normalizedKey] = value ? value.toString() : "";
                  }
                } else {
                  shipmentDetails[normalizedKey] = value;
                }
                console.log("Normalized key:", normalizedKey, value, key);
              }
            });

            // Build the shipment object
            const shipment = {
              id: shipmentDetails.shipment_number || 'SH-' + Date.now(),
              number: shipmentDetails.shipment_number,
              billOfLading: shipmentDetails.bill_of_lading_number,
              carrier: shipmentDetails.carrier,
              origin: shipmentDetails.origin,
              destination: shipmentDetails.destination,
              departureTime: shipmentDetails.start_time,
              estimatedDelivery: shipmentDetails.expected_delivery,
              contents: shipmentDetails.contents,
              senderContactName: shipmentDetails.sender_contact_name,
              designation: shipmentDetails.designation,
              organization: shipmentDetails.organization,
              phoneNumber: shipmentDetails.phone_number,
              email: shipmentDetails.email,
              temperatureHistory: [] as any[],
              alerts: [] as any[],
              currentTemperature: undefined as number | undefined,
            };

            // --- Parse second sheet for temperature readings ---
            if (sheetNames.length > 1) {
              const secondSheet = workbook.Sheets[sheetNames[1]];
              const tempRows = XLSX.utils.sheet_to_json(secondSheet, { defval: '' }) as Record<string, any>[];
              const alerts: any[] = [];
              const minTemperatureThreshold = parseFloat(minThreshold);
              const maxTemperatureThreshold = parseFloat(maxThreshold);
              let i =0;
              let lastStaus:number = 0
              console.log("Temp rows:", tempRows);
              const temperatureHistory = tempRows
                .map((row: Record<string, any>) => {
                  const timestamp = typeof row['Timestamp'] === 'number'
                    ? excelDateToJSDate(row['Timestamp'])
                    : (row['Timestamp'] ? row['Timestamp'].toString() : '');
                  
                  // Compare current time with timestamp to determine status
                  const currentTime = new Date();
                  const readingTime = new Date(timestamp);
                  const status = currentTime < readingTime ? 'upcoming' : 'completed';
                  const temp_in_celsius = parseFloat(row['Temperature (¬∞C)'] || row['Temperature (°C)'] || row['Temperature (C)'] || '0');
                  console.log("Temp in celsius:", temp_in_celsius,minTemperatureThreshold,maxTemperatureThreshold);
                  console.log("isMin:",temp_in_celsius < minTemperatureThreshold);
                  console.log("isMax:",temp_in_celsius > maxTemperatureThreshold);
                  if(temp_in_celsius < minTemperatureThreshold) {
                    alerts.push({
                      id: `alert-${Date.now()}${i++}`, 
                      shipmentId: shipment.id,
                      timestamp: timestamp,
                      temperature: temp_in_celsius,
                      status: status,
                      type:"critical",
                      location: row['Location'],
                      message: `Temperature below minimum threshold: ${temp_in_celsius}°C`
                    });
                    lastStaus = 1;
                  }
                  else if(temp_in_celsius > maxTemperatureThreshold){
                    lastStaus = 1;
                    alerts.push({
                      id: `alert-${Date.now()}${i++}`,
                      shipmentId: shipment.id,
                      timestamp: timestamp,
                      temperature: temp_in_celsius,
                      status: status,
                      type:"critical",
                      location: row['Location'],
                      message: `Temperature above maximum threshold: ${temp_in_celsius}°C`
                    });
                  }
                  else if(lastStaus === 1){
                    alerts.push({
                      id: `alert-${Date.now()}${i++}`,
                      shipmentId: shipment.id,
                      timestamp: timestamp,
                      temperature: temp_in_celsius,
                      status: status,
                      type:"info",
                      location: row['Location'],
                      message: `Temperature back to normal: ${temp_in_celsius}°C`
                    });
                    lastStaus = 0;
                  }
                  return {
                    timestamp: timestamp,
                    location: row['Location'],
                    value: parseFloat(row['Temperature (¬∞C)'] || row['Temperature (°C)'] || row['Temperature (C)'] || '0'),
                    valueF: parseFloat(row['Temperature (F)'] || '0'),
                    status: status
                  };
                });
              console.log("Temperature history:", temperatureHistory);
              shipment.temperatureHistory = temperatureHistory;
              shipment.alerts = alerts;
              if (temperatureHistory.length > 0) {
                shipment.currentTemperature = temperatureHistory[temperatureHistory.length - 1].value;
              }
            }

            // Only one shipment in parsedData
            parsedData = [shipment];
          }
        }
      } catch (parseError) {
        console.error("Error parsing file:", parseError);
        setUploadError("Failed to parse file: " + (parseError instanceof Error ? parseError.message : "Unknown error"));
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 5;
        });
      }, 100);
      
      try {
        // Upload to Firebase Storage
        const result = await uploadShipmentFile(file);
        
        // Set progress to 100%
        setUploadProgress(100);
        clearInterval(progressInterval);
        
        // First, clear all existing shipments
        console.log("Clearing existing shipments...");
        const clearResult = await clearAllShipments();
        console.log("Clear result:", clearResult);
        
        // Then, update with just the new shipments from the file
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`Uploading ${parsedData.length} parsed shipments`);
          
          const updateResult = await updateShipments(
            parsedData.map(item => ({ ...item, sourceFile: result.downloadUrl }))
          );
          
          console.log("Update result:", updateResult);
          
          if (updateResult) {
            setUploadSuccess(true);
            alert(`Successfully imported ${parsedData.length} shipments from ${file.name}.`);
          } else {
            setUploadError("Failed to update shipments in the database");
          }
        } else {
          setUploadError("The file contained no valid shipment data");
        }
        
      } catch (error) {
        console.error("Upload error:", error);
        setUploadError("Failed to upload file: " + (error instanceof Error ? error.message : "Unknown error"));
      } finally {
        clearInterval(progressInterval);
        setIsUploading(false);
        setIsProcessing(false);
    setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
    } catch (error) {
      setUploadError("Upload failed: " + (error instanceof Error ? error.message : "Unknown error"));
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  const handleDownloadSample = () => {
    downloadSampleExcel();
  };
  
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        setIsProcessing(true);
        console.log("User confirmed clearing all data");
        
        const result = await clearAllShipments();
        console.log("Clear all shipments result:", result);
        
        if (result) {
          alert('All shipment data has been cleared successfully.');
        } else {
          alert('Failed to clear shipment data. Please try again or contact support.');
        }
      } catch (error) {
        console.error("Error in handleClearData:", error);
        alert('An error occurred while clearing data: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim() !== '') {
      updatePhoneNumber(phoneNumber);
      alert('Phone number updated successfully');
    }
  };
  
  const handleThresholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse the threshold values, checking for valid numbers
    const minValue = minThreshold.trim() !== '' ? parseFloat(minThreshold) : null;
    const maxValue = maxThreshold.trim() !== '' ? parseFloat(maxThreshold) : null;
    
    // Validate the values
    if (minValue !== null && maxValue !== null && minValue >= maxValue) {
      alert('Minimum temperature must be lower than maximum temperature.');
      return;
    }
    
    // Update the temperature thresholds
    updateTemperatureThresholds(minValue, maxValue);
    alert('Temperature thresholds updated successfully');
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      {/* Data Import */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Upload className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Upload shipment logs and manage application data
          </p>
        </div>
        <div className="p-6">
          <div className="mb-8">
            <h4 className="text-base font-medium text-gray-900 mb-3">Data Upload</h4>
            <div className="bg-blue-50 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Please set your phone number and temperature thresholds below before uploading files for proper temperature monitoring and alerts.
              </p>
            </div>
            <form onSubmit={handleUpload}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Shipment File
                </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                    <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          accept=".csv,.xlsx,.xls"
                        />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      CSV or Excel up to 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              {uploadError && (
                <div className="mt-4 text-sm text-red-600">
                  Error: {uploadError}
            </div>
              )}
              
              {file && !isUploading && !uploadSuccess && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Selected file:</p>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  {file.name}
                </div>
              </div>
            )}
              
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                    <span className="text-sm font-medium text-gray-700">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{ width: `${uploadProgress}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-cyan-500"
                    ></div>
                  </div>
                </div>
              )}
              
              {uploadSuccess && (
                <div className="mt-4 text-sm text-green-600">
                  File uploaded successfully! Data is now available on the dashboard.
                </div>
              )}
              
            <div className="mt-5">
              <button
                type="submit"
                disabled={!file || isUploading || uploadSuccess || !phoneNumber || minTemperatureThreshold === null || maxTemperatureThreshold === null}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  file && !isUploading && !uploadSuccess && phoneNumber && minTemperatureThreshold !== null && maxTemperatureThreshold !== null
                    ? 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
              {(!phoneNumber || minTemperatureThreshold === null || maxTemperatureThreshold === null) && file && (
                <p className="text-xs text-red-500 mt-2">
                  Please set {!phoneNumber ? 'phone number' : ''} 
                  {!phoneNumber && (minTemperatureThreshold === null || maxTemperatureThreshold === null) ? ' and ' : ''}
                  {minTemperatureThreshold === null || maxTemperatureThreshold === null ? 'temperature thresholds' : ''} 
                  in the Notification Settings section below.
                </p>
              )}
            </div>
            </form>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-base font-medium text-gray-900 mb-3">Data Operations</h4>
            <p className="text-sm text-gray-500 mb-4">
              Manage your application data with these actions.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleDownloadSample}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Excel Template
              </button>
              
              <button
                onClick={handleClearData}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">
                <strong>Note:</strong> Download the Excel template to see the expected data format for your files. 
                The template includes two sheets: "Shipment Details" for basic shipment information and "Temperature Readings" for temperature history.
                Clear all data will remove all shipments from the system.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification Settings with Phone Number and Temperature Thresholds */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Configure your contact information and temperature thresholds for notifications
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone-number"
                className="focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="+1 (555) 987-6543"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isPhoneButtonEnabled}
            >
              Save Phone Number
            </button>
          </form>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <Thermometer className="h-4 w-4 text-gray-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900">Temperature Alert Thresholds</h4>
            </div>
            <p className="text-sm text-gray-500 mb-4">Set the minimum and maximum temperature values that will trigger alerts.</p>
            <form onSubmit={handleThresholdSubmit} className="space-y-3">
              <div className="mt-4">
                <label htmlFor="min-threshold" className="block text-sm font-medium text-gray-700">
                  Minimum Temperature Threshold (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="min-threshold"
                  className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md ${minThresholdError ? 'border-red-300' : ''}`}
                  placeholder="00"
                  value={minThreshold}
                  onChange={handleMinThresholdChange}
                />
                {minThresholdError && (
                  <p className="mt-1 text-sm text-red-600">{minThresholdError}</p>
                )}
              </div>
              <div className="mt-4">
                <label htmlFor="max-threshold" className="block text-sm font-medium text-gray-700">
                  Maximum Temperature Threshold (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="max-threshold"
                  className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md ${maxThresholdError ? 'border-red-300' : ''}`}
                  placeholder="00"
                  value={maxThreshold}
                  onChange={handleMaxThresholdChange}
                />
                {maxThresholdError && (
                  <p className="mt-1 text-sm text-red-600">{maxThresholdError}</p>
                )}
              </div>
              <button
                type="submit"
                className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
                  !isThresholdButtonEnabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isThresholdButtonEnabled}
              >
                Save Temperature Thresholds
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;