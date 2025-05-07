import React from 'react';
import { Link } from 'react-router-dom';
import { Thermometer, Truck, Bell } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="pb-12">
      {/* Hero section */}
      <div className="bg-cyan-50 rounded-xl p-8 mb-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-cyan-900 text-center mb-4 tracking-tight">
            Cold Chain Monitoring Solutions
          </h1>
          <p className="text-xl text-center text-cyan-700 mb-8">
            Track temperature-sensitive shipments in real time, ensuring product integrity
            throughout the supply chain
          </p>
          
          <div className="flex justify-center">
            <Link 
              to="/dashboard" 
              className="btn btn-primary px-6 py-3 text-base"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 sm:px-6">
        <div className="bg-white rounded-lg shadow-md p-6 transform transition-transform duration-300 hover:translate-y-[-4px]">
          <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <Thermometer className="h-6 w-6 text-cyan-700" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Temperature Monitoring</h3>
          <p className="text-gray-600">
            Real-time temperature tracking with configurable alert thresholds
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 transform transition-transform duration-300 hover:translate-y-[-4px]">
          <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-6 w-6 text-cyan-700" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Shipment Tracking</h3>
          <p className="text-gray-600">
            Location updates throughout the entire transport chain
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 transform transition-transform duration-300 hover:translate-y-[-4px]">
          <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-cyan-700" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Automatic Alerts</h3>
          <p className="text-gray-600">
            Instant notifications of critical temperature deviations
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;