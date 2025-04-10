'use client';

import { TableCellsIcon } from '@heroicons/react/24/outline';
import { useGetTableSettingsQuery, useUpdateTableSettingsMutation } from '@/store/api/settingsApi';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface TableSettings {
  turnaroundTime: number;
}

export default function TableSettings() {
  const { data: settings, isLoading, error } = useGetTableSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateTableSettingsMutation();
  const [formData, setFormData] = useState<TableSettings>({
    turnaroundTime: 30
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        turnaroundTime: settings.turnaround_time
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        turnaround_time: formData.turnaroundTime
      }).unwrap();
      toast.success('Table settings updated successfully');
    } catch (error) {
      console.error('Error updating table settings:', error);
      toast.error('Failed to update table settings');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <TableCellsIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Table Settings</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <TableCellsIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Table Settings</h2>
        </div>
        <div className="text-red-500">Error loading table settings. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <TableCellsIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Table Settings</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Configure your table settings to optimize reservation management.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="turnaroundTime" className="block text-sm font-medium text-gray-700 mb-1">
              Table Turnaround Time (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                id="turnaroundTime"
                min="15"
                max="120"
                step="15"
                value={formData.turnaroundTime}
                onChange={(e) => setFormData(prev => ({ ...prev, turnaroundTime: parseInt(e.target.value) }))}
                className="block w-full rounded-md border border-gray-300 bg-gray-50 pl-9 pr-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
              />
              <TableCellsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              The time needed to clean and prepare a table for the next reservation.
            </p>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0F172A] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 