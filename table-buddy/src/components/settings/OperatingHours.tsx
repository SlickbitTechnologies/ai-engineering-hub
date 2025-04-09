'use client';

import { ClockIcon } from '@heroicons/react/24/outline';
import { useGetOperatingHoursQuery, useUpdateOperatingHoursMutation } from '@/store/api/settingsApi';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface TimeSlot {
  openingTime: string;
  closingTime: string;
}

interface DaySchedule {
  lunch: TimeSlot;
  dinner: TimeSlot;
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

export default function OperatingHours() {
  const { data: hours = [], isLoading, error } = useGetOperatingHoursQuery();
  const [updateHours, { isLoading: isUpdating }] = useUpdateOperatingHoursMutation();
  const [formData, setFormData] = useState<OperatingHours>({
    monday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
    tuesday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
    wednesday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
    thursday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
    friday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
    saturday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
    sunday: { lunch: { openingTime: '11:30', closingTime: '14:30' }, dinner: { openingTime: '17:00', closingTime: '22:00' } },
  });

  useEffect(() => {
    if (hours.length > 0) {
      const formattedHours = hours.reduce((acc, hour) => {
        acc[hour.day.toLowerCase() as keyof OperatingHours] = {
          lunch: {
            openingTime: hour.lunch_opening_time,
            closingTime: hour.lunch_closing_time,
          },
          dinner: {
            openingTime: hour.dinner_opening_time,
            closingTime: hour.dinner_closing_time,
          },
        };
        return acc;
      }, {} as OperatingHours);
      setFormData(formattedHours);
    }
  }, [hours]);

  const handleTimeChange = (
    day: keyof OperatingHours,
    period: 'lunch' | 'dinner',
    type: 'openingTime' | 'closingTime',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: {
          ...prev[day][period],
          [type]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedHours = Object.entries(formData).map(([day, schedule]) => ({
        day: day.toLowerCase(),
        lunch_opening_time: schedule.lunch.openingTime,
        lunch_closing_time: schedule.lunch.closingTime,
        dinner_opening_time: schedule.dinner.openingTime,
        dinner_closing_time: schedule.dinner.closingTime,
      }));
      await updateHours(formattedHours).unwrap();
      toast.success('Operating hours updated successfully');
    } catch (error) {
      console.error('Error updating operating hours:', error);
      toast.error('Failed to update operating hours');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <ClockIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Operating Hours</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <ClockIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Operating Hours</h2>
        </div>
        <div className="text-red-500">Error loading operating hours. Please try again later.</div>
      </div>
    );
  }

  const TimeInput = ({ 
    label,
    value,
    onChange
  }: { 
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-gray-50 pl-9 pr-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <ClockIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Operating Hours</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Set your restaurant's operating hours. The voice agent will only book reservations during these times.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(Object.keys(formData) as Array<keyof OperatingHours>).map((day) => (
            <div key={day} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <h3 className="text-sm font-medium text-gray-900 mb-4 capitalize">{day}</h3>
              <div className="grid grid-cols-2 gap-8">
                {/* Lunch Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    label="Opening Time"
                    value={formData[day].lunch.openingTime}
                    onChange={(value) => handleTimeChange(day, 'lunch', 'openingTime', value)}
                  />
                  <TimeInput
                    label="Closing Time"
                    value={formData[day].lunch.closingTime}
                    onChange={(value) => handleTimeChange(day, 'lunch', 'closingTime', value)}
                  />
                </div>
                {/* Dinner Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    label="Opening Time"
                    value={formData[day].dinner.openingTime}
                    onChange={(value) => handleTimeChange(day, 'dinner', 'openingTime', value)}
                  />
                  <TimeInput
                    label="Closing Time"
                    value={formData[day].dinner.closingTime}
                    onChange={(value) => handleTimeChange(day, 'dinner', 'closingTime', value)}
                  />
                </div>
              </div>
            </div>
          ))}

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