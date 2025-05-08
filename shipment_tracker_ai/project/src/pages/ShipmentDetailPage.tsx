import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShipments, Shipment } from '../contexts/ShipmentContext';
import { useSettings } from '../contexts/SettingsContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Thermometer, MapPin, Truck, Calendar, Clock, FileText, User, Building, Phone, Mail } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
  const [processedJourney, setProcessedJourney] = useState<any[]>([]);
  
  useEffect(() => {
    if (shipment && shipment.journey && shipment.journey.length > 0) {
      const now = new Date();
      let currentFound = false;

      const sortedJourney = [...shipment.journey]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(point => {
          const pointTimestamp = new Date(point.timestamp);
          let status: 'completed' | 'current' | 'upcoming' = 'upcoming'; // Default to upcoming

          if (pointTimestamp < now) {
            status = 'completed';
          } else if (!currentFound) {
            status = 'current';
            currentFound = true;
          } else {
            status = 'upcoming';
          }
          return { ...point, timestamp: pointTimestamp, status };
        });

      // If all points are in the past, the last one is current (last known location/event)
      // Or, if no future point was found to be current, the last point is current.
      if (!currentFound && sortedJourney.length > 0) {
        const lastPointIndex = sortedJourney.length - 1;
        // Only mark as current if it was previously completed, to avoid overriding a legitimate future upcoming
        if (sortedJourney[lastPointIndex].status === 'completed') {
             sortedJourney[lastPointIndex].status = 'current';
             // Ensure no other point is current
             for(let i=0; i < lastPointIndex; i++) {
                 if(sortedJourney[i].status === 'current') sortedJourney[i].status = 'completed';
             }
        }
      } else if (currentFound) {
        // If a current point was found (i.e. the first future point),
        // ensure all prior points are marked completed if their timestamp is indeed past.
        // This handles cases where sorting might be tricky or timestamps are very close.
        let currentPointIndex = -1;
        for(let i=0; i < sortedJourney.length; i++){
            if(sortedJourney[i].status === 'current'){
                currentPointIndex = i;
                break;
            }
        }
        if(currentPointIndex > 0){
            for(let i=0; i < currentPointIndex; i++){
                if(new Date(sortedJourney[i].timestamp) < now){
                    sortedJourney[i].status = 'completed';
                }
            }
        }
      }

      setProcessedJourney(sortedJourney);
    } else if (shipment && (!shipment.journey || shipment.journey.length === 0)) {
      setProcessedJourney([]); // Handle case with no journey data
    }
  }, [shipment]); // Dependency: re-run when shipment data changes

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
      {/* Updated Shipment header */}
      <div className="bg-cyan-50 p-6 rounded-lg">
        <div className="flex items-center mb-2">
          <Link to="/dashboard" className="text-cyan-600 hover:text-cyan-800 mr-2">
            &larr; Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-cyan-800">Shipment Details</h1>
        <p className="text-sm text-cyan-600 mt-1">Complete information about shipment #{shipment.number}</p>
        
        <div className="flex items-center mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2
            ${shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' : 
            shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'}`}>
            {shipment.status === 'in-transit' ? 'In Transit' : 
            shipment.status === 'delivered' ? 'Delivered' : 'Delayed'}
          </span>
          <span className="text-cyan-700">Carrier: {shipment.carrier}</span>
        </div>
      </div>
      
      {/* Current Temperature panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
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
      
      {/* Content tabs */}
      <div className="bg-white rounded-lg shadow">
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
            <div className="space-y-6">
              {/* Route info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
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
              
              {/* Shipment details */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Details</h3>
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
              </div>
              
              {/* Temperature chart */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Temperature History</h3>
                <p className="mb-4 text-sm text-gray-500">Safe temperature range: {minTemp}°C - {maxTemp}°C</p>
                
                <div className="h-72">
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
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Journey Map</h3>
                <p className="mt-1 text-sm text-gray-500">Track shipment route progress</p>
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
                  <h3 className="text-base font-medium text-gray-900">{shipment.contacts?.name || 'NA'}</h3>
                  <p className="text-sm text-gray-500">{shipment.contacts?.role || 'NA'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                  <Building className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="text-gray-900">{shipment.contacts?.organization || 'NA'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                  <Phone className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-gray-900">{shipment.contacts?.phone || 'NA'}</p>
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