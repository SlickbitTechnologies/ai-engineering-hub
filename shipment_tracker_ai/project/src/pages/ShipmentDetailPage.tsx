import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShipments } from '../contexts/ShipmentContext';
import { useSettings } from '../contexts/SettingsContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Thermometer, MapPin, Truck, Calendar, Clock, FileText } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getShipment, markAlertAsRead, loading, updateShipment, checkTemperatureThresholds } = useShipments();
  const { minTemperatureThreshold, maxTemperatureThreshold } = useSettings();
  const shipment = getShipment(id || '');
  const [activeTab, setActiveTab] = useState('info');
  const [userTimeZone, setUserTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || import.meta.env.VITE_DEFAULT_TIMEZONE
  );
  
  // Check thresholds whenever temperature history changes
  useEffect(() => {
    if (shipment) {
      const minTemp = Number(import.meta.env.VITE_MIN_TEMPERATURE_THRESHOLD) || minTemperatureThreshold;
      const maxTemp = Number(import.meta.env.VITE_MAX_TEMPERATURE_THRESHOLD) || maxTemperatureThreshold;
      checkTemperatureThresholds(shipment, minTemp, maxTemp);
    }
  }, [shipment, minTemperatureThreshold, maxTemperatureThreshold, checkTemperatureThresholds]);

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
      {/* Shipment header */}
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Link to="/dashboard" className="text-cyan-600 hover:text-cyan-800 mr-2">
              &larr; Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-cyan-700 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Shipment {shipment.number}</h1>
          </div>
          <div className="flex items-center mt-2 text-gray-500">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2
              ${shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' : 
              shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'}`}>
              {shipment.status === 'in-transit' ? 'In Transit' : 
              shipment.status === 'delivered' ? 'Delivered' : 'Delayed'}
            </span>
            <span>Carrier: {shipment.carrier}</span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <Thermometer className={`h-5 w-5 mr-2 ${
              shipment.currentTemperature > maxTemp || shipment.currentTemperature < minTemp 
                ? 'text-red-500' : 'text-cyan-500'}`} 
            />
            <div>
              <p className="text-sm text-gray-500">Current Temperature</p>
              <p className={`text-xl font-semibold ${
                shipment.currentTemperature > maxTemp || shipment.currentTemperature < minTemp 
                  ? 'text-red-600' : 'text-gray-900'}`}>
                {shipment.currentTemperature}°C
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Shipment details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Main info */}
        <div className="space-y-6">
          {/* Route info */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Origin</p>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-5 w-5 text-gray-400 mr-1" /> 
                      <p className="text-gray-900">{shipment.origin.city}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Departure Time</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-5 w-5 text-gray-400 mr-1" />
                      <p className="text-gray-900">{formatDateTime(shipment.departureTime, 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center mt-1 ml-6">
                      <Clock className="h-5 w-5 text-gray-400 mr-1" />
                      <p className="text-gray-900">{formatDateTime(shipment.departureTime, 'h:mm a')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-5 w-5 text-gray-400 mr-1" /> 
                      <p className="text-gray-900">{shipment.destination.city}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Estimated Delivery</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-5 w-5 text-gray-400 mr-1" />
                      <p className="text-gray-900">{formatDateTime(shipment.estimatedDelivery, 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center mt-1 ml-6">
                      <Clock className="h-5 w-5 text-gray-400 mr-1" />
                      <p className="text-gray-900">{formatDateTime(shipment.estimatedDelivery, 'h:mm a')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional info tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
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
                    activeTab === 'documents'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('documents')}
                >
                  Documents
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
              
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium">Bill of Lading</p>
                        <p className="text-sm text-gray-500">{shipment.billOfLading}.pdf</p>
                      </div>
                    </div>
                    <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium">
                      Download
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium">Commercial Invoice</p>
                        <p className="text-sm text-gray-500">INV-{shipment.number}.pdf</p>
                      </div>
                    </div>
                    <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium">
                      Download
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium">Temperature Log</p>
                        <p className="text-sm text-gray-500">TEMP-{shipment.number}.csv</p>
                      </div>
                    </div>
                    <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium">
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Temperature charts and journey */}
        <div className="space-y-6">
          {/* Temperature chart */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Temperature History</h3>
              <p className="mt-1 text-sm text-gray-500">Safe temperature range: {minTemp}°C - {maxTemp}°C</p>
            </div>
            <div className="p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
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
                    label={{ 
                      value: `Min (${minTemp}°C)`, 
                      position: 'insideBottomRight',
                      fill: '#ef4444'
                    }} 
                  />
                  <ReferenceLine 
                    y={maxTemp} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: `Max (${maxTemp}°C)`, 
                      position: 'insideTopRight',
                      fill: '#ef4444'
                    }} 
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0e7490"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#0891b2', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Journey tracking */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Journey Map</h3>
                <p className="mt-1 text-sm text-gray-500">Track shipment route progress</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {shipment.journey.map((point, idx) => (
                    <li key={idx}>
                      <div className="relative pb-8">
                        {idx !== shipment.journey.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                                point.status === 'completed'
                                  ? 'bg-green-500'
                                  : point.status === 'current'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300'
                              }`}
                            >
                              {point.status === 'completed' ? (
                                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : point.status === 'current' ? (
                                <span className="h-2.5 w-2.5 bg-white rounded-full animate-pulse" />
                              ) : (
                                <span className="h-2 w-2 bg-gray-500 rounded-full" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{point.location}</p>
                              {point.status !== 'upcoming' && (
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                  <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                                  <p>{formatDateTime(point.timestamp, 'MMM d, h:mm a')}</p>
                                </div>
                              )}
                              {point.status !== 'upcoming' && point.temperature > 0 && (
                                <div className="mt-1 flex items-center text-sm">
                                  <Thermometer className={`mr-1.5 h-4 w-4 ${
                                    point.temperature > maxTemp || point.temperature < minTemp 
                                      ? 'text-red-500' : 'text-gray-400'}`} 
                                  />
                                  <p className={
                                    point.temperature > maxTemp || point.temperature < minTemp 
                                      ? 'text-red-600' : 'text-gray-500'
                                  }>
                                    {point.temperature}°C
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-right whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alerts section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Alerts & Notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            {shipment.alerts.filter(a => !a.read).length} unread alerts
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {shipment.alerts.length > 0 ? (
            shipment.alerts.map(alert => (
              <div key={alert.id} className={`p-6 ${!alert.read ? 'bg-gray-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-600' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {alert.type.toLowerCase() === 'critical' && (
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {alert.type.toLowerCase() === 'warning' && (
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {alert.type.toLowerCase() === 'info' && (
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className={`text-sm font-medium ${
                          alert.type === 'critical' ? 'text-red-800' :
                          alert.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {alert.type === 'critical' ? 'Critical' :
                           alert.type === 'warning' ? 'Warning' : 'Info'}
                        </h3>
                        <p className="ml-2 text-sm text-gray-500">
                          {formatDateTime(alert.timestamp, 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-900">{alert.message}</p>
                        {alert.location && (
                          <p className="mt-1 text-sm text-gray-500">Location: {alert.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={() => markAlertAsRead(shipment.id, alert.id)}
                      className="ml-6 bg-white rounded-md text-sm font-medium text-cyan-600 hover:text-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                      Mark as read
                    </button>
                  )}
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
  );
};

export default ShipmentDetailPage;