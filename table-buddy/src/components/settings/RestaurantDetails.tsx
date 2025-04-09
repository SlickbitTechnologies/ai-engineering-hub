'use client';

import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useGetRestaurantSettingsQuery, useUpdateRestaurantSettingsMutation } from '@/store/api/restaurantApi';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function RestaurantDetails() {
  const { data: settings, isLoading, error } = useGetRestaurantSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateRestaurantSettingsMutation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData).unwrap();
      toast.success('Restaurant settings updated successfully');
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      toast.error('Failed to update restaurant settings');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Restaurant Information</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Restaurant Information</h2>
        </div>
        <div className="text-red-500">Error loading restaurant settings. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Restaurant Information</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Basic information about your restaurant that the voice agent will use.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 text-black"
              required
            />
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