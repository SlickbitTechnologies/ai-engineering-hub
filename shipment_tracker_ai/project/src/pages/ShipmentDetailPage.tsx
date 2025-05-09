import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShipments, Shipment } from '../contexts/ShipmentContext';
import { useSettings } from '../contexts/SettingsContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Thermometer, MapPin, Truck, Calendar, Clock, FileText, MessageSquare, User, Building, Phone, Mail } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import NotificationCenter from '../components/NotificationCenter';

// Define our extended Shipment type that includes contacts
type ExtendedShipment = Shipment & {
  contacts?: {
    name?: string;
    role?: string;
    organization?: string;
    phone?: string;
    email?: string;
  };
};

const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getShipment, markAlertAsRead, loading, checkTemperatureThresholds } = useShipments();
  const { minTemperatureThreshold, maxTemperatureThreshold } = useSettings();
  const shipment = getShipment(id || '') as ExtendedShipment | undefined;
  const [activeTab, setActiveTab] = useState('info');
  const [userTimeZone, setUserTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || import.meta.env.VITE_DEFAULT_TIMEZONE
  );
  console.log(shipment, 'shipmentshipmentshipment')
  const [processedJourney, setProcessedJourney] = useState<any[]>([]);
  console.log('ShipmentDetailPage',shipment);
 // Dependency: re-run when shipment data changes

  // Check thresholds whenever temperature history changes
  useEffect(() => {
    if (shipment) {
      const minTemp = Number(import.meta.env.VITE_MIN_TEMPERATURE_THRESHOLD) || minTemperatureThreshold;
      const maxTemp = Number(import.meta.env.VITE_MAX_TEMPERATURE_THRESHOLD) || maxTemperatureThreshold;
      checkTemperatureThresholds(shipment, minTemp, maxTemp);
    }
  }, [shipment?.temperatureHistory, minTemperatureThreshold, maxTemperatureThreshold, checkTemperatureThresholds]);

  const formatDateTime = (date: Date | string, formatStr: string) => {
    return formatInTimeZone(new Date(date), userTimeZone, formatStr);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (!shipment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipment Not Found</h2>
        <p className="text-gray-600 mb-6">The shipment you're looking for doesn't exist or you don't have access to it.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  const formattedChartData = shipment.temperatureHistory.map(point => ({
    time: formatDateTime(point.timestamp, 'h:mm a'),
    fullTime: formatDateTime(point.timestamp, 'MMM d, h:mm a'),
    value: point.value
  }));
  
  const minTemp = minTemperatureThreshold;
  const maxTemp = maxTemperatureThreshold;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-cyan-800">Cold Chain Monitor</h1>
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-gray-400 hover:text-gray-500">
            <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">2</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="p-2 bg-cyan-600 text-white rounded-md flex items-center">
            <MessageSquare className="h-5 w-5 mr-1" />
            <span>Notifications</span>
          </button>
        </div>
      </div>
      
      {/* Main dashboard panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shipment panel */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <Truck className="h-5 w-5 text-cyan-700 mr-2" />
              <h2 className="text-lg font-medium text-cyan-800">Shipment {shipment.number}</h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              In Transit
            </span>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Origin</p>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-5 w-5 text-gray-400 mr-1" /> 
                    <p className="text-gray-900">{shipment.origin.city}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-5 w-5 text-gray-400 mr-1" /> 
                    <p className="text-gray-900">{shipment.destination.city}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Departed</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-5 w-5 text-gray-400 mr-1" />
                    <p className="text-gray-900">{formatDateTime(shipment.departureTime, 'MMM d, yyyy')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Expected Delivery</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-5 w-5 text-gray-400 mr-1" />
                    <p className="text-gray-900">{formatDateTime(shipment.estimatedDelivery, 'MMM d, yyyy')} - {formatDateTime(shipment.estimatedDelivery, 'h:mm a')}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Carrier</p>
                <div className="flex items-center mt-1">
                  <Truck className="h-5 w-5 text-gray-400 mr-1" /> 
                  <p className="text-gray-900">{shipment.carrier}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Current Temperature</p>
                <div className="flex items-center mt-1">
                  <Thermometer className={`h-5 w-5 mr-2 ${
                    shipment.currentTemperature > maxTemp || shipment.currentTemperature < minTemp 
                      ? 'text-red-500' : 'text-cyan-500'}`} 
                  />
                  <p className={`font-semibold ${
                    shipment.currentTemperature > maxTemp || shipment.currentTemperature < minTemp 
                      ? 'text-red-600' : 'text-gray-900'}`}>
                    {shipment.currentTemperature}°C
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Temperature History panel */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-cyan-700 mr-2" />
              <h2 className="text-lg font-medium text-cyan-800">Temperature History</h2>
            </div>
            {shipment.temperatureHistory.some(t => t.value > maxTemp || t.value < minTemp) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                1 deviation
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedChartData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    domain={[
                      Math.min(Math.floor(Math.min(...shipment.temperatureHistory.map(t => t.value)) - 1), minTemp - 1),
                      Math.max(Math.ceil(Math.max(...shipment.temperatureHistory.map(t => t.value)) + 1), maxTemp + 1)
                    ]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px' }}
                    formatter={(value: number) => [`${value}°C`, 'Temperature']}
                    labelFormatter={(label) => {
                      const dataPoint = formattedChartData.find(d => d.time === label);
                      return dataPoint ? dataPoint.fullTime : label;
                    }}
                  />
                  <ReferenceLine 
                    y={minTemp} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                  />
                  <ReferenceLine 
                    y={maxTemp} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0e7490"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5, stroke: '#0891b2', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <div className="flex items-center mr-3">
                <span className="inline-block w-3 h-1 bg-red-500 mr-1"></span>
                <span>Min/Max Safe Temp: {minTemp}°C - {maxTemp}°C</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Journey Map panel */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-50 px-4 py-3">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-cyan-700 mr-2" />
              <h2 className="text-lg font-medium text-cyan-800">Journey Map</h2>
            </div>
          </div>
          <div className="p-4 h-[330px] overflow-y-auto">
            <ul className="-mt-1">
              {shipment.journey.map((point, idx) => (
                <li key={idx} className="mb-3">
                  <div className="relative pl-6">
                    {idx !== processedJourney.length - 1 && (
                      <div className="absolute top-4 left-3 h-full w-0.5 bg-gray-200"></div>
                    )}
                    <div className="flex items-start">
                      <div className="absolute left-0 top-1">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          point.status === 'completed'
                            ? 'bg-green-500'
                            : point.status === 'current'
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}>
                          {point.status === 'completed' ? (
                            <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : point.status === 'current' ? (
                            <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                          ) : (
                            <span className="h-1.5 w-1.5 bg-gray-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{point.location}</p>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            point.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : point.status === 'current'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {point.status === 'completed' ? 'Completed' : 
                            point.status === 'current' ? 'Current' : 'Upcoming'}
                          </span>
                        </div>
                        {point.status !== 'upcoming' && (
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <p className="text-xs text-gray-500">{formatDateTime(point.timestamp, 'MMM d, h:mm a')}</p>
                            {point.temperature != null && (
                              <>
                                <Thermometer className={`ml-2 h-3 w-3 ${
                                  (point.temperature > maxTemp || point.temperature < minTemp)
                                    ? 'text-red-500' : 'text-gray-400'}`} 
                                />
                                <p className={`text-xs ${
                                  (point.temperature > maxTemp || point.temperature < minTemp)
                                    ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  {point.temperature}°C
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Details and alerts panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipment Details panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-blue-50 px-4 py-3">
            <h2 className="text-lg font-medium text-cyan-800">Shipment Details</h2>
            <p className="text-sm text-cyan-600">Complete information about shipment #{shipment.number}</p>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'info'
                    ? 'border-b-2 border-cyan-500 text-cyan-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Shipment Info
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'contacts'
                    ? 'border-b-2 border-cyan-500 text-cyan-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('contacts')}
              >
                Contact Info
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Shipment Number</p>
                  <p className="text-gray-900 mt-1">{shipment.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bill of Lading</p>
                  <p className="text-gray-900 mt-1">{shipment.billOfLading}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Carrier</p>
                  <p className="text-gray-900 mt-1">{shipment.carrier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contents</p>
                  <p className="text-gray-900 mt-1">{shipment.contents}</p>
                </div>
              </div>
            )}
            
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                    <User className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{shipment.contacts?.name || 'Dr. Sarah Chen'}</h3>
                    <p className="text-sm text-gray-500">{shipment.contacts?.role || 'Supply Chain Manager'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                    <Building className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organization</p>
                    <p className="text-gray-900">{shipment.contacts?.organization || 'PharmaHealth Solutions Inc.'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                    <Phone className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-gray-900">{shipment.contacts?.phone || '+1 (206) 555-0178'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                    <Mail className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{shipment.contacts?.email || 'NA'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Alerts panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-blue-50 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-cyan-700 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-medium text-cyan-800">Alerts & Notifications</h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {shipment.alerts.filter(a => !a.read).length} New
            </span>
          </div>
          <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {shipment.alerts.length > 0 ? (
              shipment.alerts.map(alert => (
                <div key={alert.id} className={`p-4 ${!alert.read ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-600' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {alert.type === 'critical' && (
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {alert.type === 'warning' && (
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {alert.type === 'info' && (
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className={`text-sm font-medium ${
                            alert.type === 'critical' ? 'text-red-800' :
                            alert.type === 'warning' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {alert.type === 'critical' ? 'Critical' :
                            alert.type === 'warning' ? 'Warning' : 'Info'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(alert.timestamp, 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {!alert.read && (
                          <button
                            onClick={() => markAlertAsRead(shipment.id, alert.id)}
                            className="text-xs font-medium text-cyan-600 hover:text-cyan-500"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{alert.message}</p>
                      {alert.location && (
                        <p className="mt-1 text-xs text-gray-500">Location: {alert.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No alerts for this shipment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailPage;