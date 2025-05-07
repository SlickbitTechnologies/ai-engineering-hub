import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShipments } from '../contexts/ShipmentContext';
import { useSettings } from '../contexts/SettingsContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Truck, Thermometer, Calendar, MapPin, AlertTriangle, PackageOpen, Settings, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { shipments, loading, deleteShipment } = useShipments();
  const { minTemperatureThreshold, maxTemperatureThreshold } = useSettings();
  const [search, setSearch] = useState('');
  
  // Determine if we have valid data
  const hasData = Array.isArray(shipments) && shipments.length > 0;
  
  // If still loading, show spinner
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  // Filter shipments based on search
  const filteredShipments = hasData ? shipments.filter(shipment => 
    shipment.number.toLowerCase().includes(search.toLowerCase()) ||
    (shipment.origin?.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (shipment.destination?.city || '').toLowerCase().includes(search.toLowerCase())
  ) : [];
  
  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
      try {
        await deleteShipment(shipmentId);
      } catch (error) {
        console.error('Error deleting shipment:', error);
        alert('Failed to delete shipment. Please try again.');
      }
    }
  };
  
  // Empty state UI
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-10">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
          <PackageOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Shipment Data</h2>
          <p className="text-gray-600 mb-6">
            There are no shipments available. Please upload your shipment data file from the Settings page.
          </p>
          <div className="space-y-3">
            <Link 
              to="/settings"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <Settings className="h-4 w-4 mr-2" />
              Go to Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">Dashboard</h1>
        
        <div className="w-full sm:w-auto">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <input
              type="text"
              className="focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
              placeholder="Search shipments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-cyan-600">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-cyan-100 mr-4">
              <Truck className="h-6 w-6 text-cyan-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Shipments</p>
              <p className="text-2xl font-semibold text-gray-900">{shipments.filter(s => s.status === 'in-transit').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-yellow-100 mr-4">
              <Thermometer className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Temperature Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {shipments.filter(s => 
                  s.currentTemperature < minTemperatureThreshold || 
                  s.currentTemperature > maxTemperatureThreshold
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-100 mr-4">
              <Calendar className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Deliveries Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {shipments.filter(s => {
                  try {
                    const deliveryDate = new Date(s.estimatedDelivery);
                    const today = new Date();
                    return deliveryDate.toDateString() === today.toDateString();
                  } catch (error) {
                    return false;
                  }
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Shipments list */}
      <div className="bg-white shadow-md rounded-md overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Shipments</h3>
          <p className="mt-1 text-sm text-gray-500">Monitor your active shipments and their status</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipment ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETA
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShipments.length > 0 ? (
                filteredShipments.map((shipment) => {
                  try {
                    const hasAlerts = shipment.alerts?.some(alert => !alert.read) || false;
                    const criticalAlerts = shipment.alerts?.filter(alert => alert.type === 'critical' && !alert.read)?.length || 0;
                    const isTemperatureOutOfRange = shipment.currentTemperature < minTemperatureThreshold || 
                                               shipment.currentTemperature > maxTemperatureThreshold;
                    
                    return (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {shipment.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span>
                              {(shipment.origin?.city || 'Unknown').split(',')[0]} → {(shipment.destination?.city || 'Unknown').split(',')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' : 
                            shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                            {shipment.status === 'in-transit' ? 'In Transit' : 
                            shipment.status === 'delivered' ? 'Delivered' : 'Delayed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Thermometer className={`h-4 w-4 mr-1 ${
                              isTemperatureOutOfRange ? 'text-red-500' : 'text-green-500'}`} 
                            />
                            <span className={
                              isTemperatureOutOfRange ? 'text-red-600 font-medium' : ''
                            }>
                              {shipment.currentTemperature}°C
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {criticalAlerts > 0 ? (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                              <span className="font-medium">{criticalAlerts} Critical</span>
                            </div>
                          ) : hasAlerts ? (
                            <div className="flex items-center text-yellow-600">
                              <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
                              <span>Warning</span>
                            </div>
                          ) : (
                            <span className="text-green-600">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(shipment.estimatedDelivery), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link
                            to={`/shipment/${shipment.id}`}
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(shipment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  } catch (error) {
                    console.error("Error rendering shipment row:", error);
                    return null; // Skip rendering this row if there's an error
                  }
                }).filter(Boolean) // Filter out null rows
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No shipments found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;