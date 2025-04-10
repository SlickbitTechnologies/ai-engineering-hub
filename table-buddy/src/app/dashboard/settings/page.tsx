'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RestaurantDetails from '@/components/settings/RestaurantDetails';
import OperatingHours from '@/components/settings/OperatingHours';
import TableSettings from '@/components/settings/TableSettings';

interface TimeSlot {
  openingTime: string;
  closingTime: string;
}

interface DaySchedule {
  lunch: TimeSlot;
  dinner: TimeSlot;
}

interface RestaurantSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface TableSettings {
  turnaroundTime: number;
}

const defaultOperatingHours: OperatingHours = {
  monday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  },
  tuesday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  },
  wednesday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  },
  thursday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  },
  friday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  },
  saturday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  },
  sunday: {
    lunch: { openingTime: '11:30', closingTime: '14:30' },
    dinner: { openingTime: '17:00', closingTime: '22:00' }
  }
};

const defaultSettings: RestaurantSettings = {
  name: 'Bella Cucina',
  phone: '(555) 123-4567',
  email: 'info@bellacucina.com',
  address: '123 Main Street, Foodville, CA 94123',
};

const defaultTableSettings: TableSettings = {
  turnaroundTime: 90
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(defaultOperatingHours);
  const [tableSettings, setTableSettings] = useState<TableSettings>(defaultTableSettings);
  const [activeTab, setActiveTab] = useState('Table Settings');

  const tabs = [
    { name: 'Restaurant Details', current: activeTab === 'Restaurant Details' },
    { name: 'Operating Hours', current: activeTab === 'Operating Hours' },
    { name: 'Table Settings', current: activeTab === 'Table Settings' },
    { name: 'Voice Agent', current: activeTab === 'Voice Agent' },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure your restaurant and voice agent settings
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`${
                    tab.current
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'Restaurant Details' && (
            <RestaurantDetails />
          )}

          {activeTab === 'Operating Hours' && (
            <OperatingHours />
          )}

          {activeTab === 'Table Settings' && (
            <TableSettings />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 