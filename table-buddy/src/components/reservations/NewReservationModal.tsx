'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Dropdown from '@/components/ui/Dropdown';
import { useCreateReservationMutation } from '@/store/api/reservationsApi';
import { useGetTablesQuery } from '@/store/api/tablesApi';
import { toast } from 'react-hot-toast';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ReservationFormData {
  customerName: string;
  phoneNumber: string;
  email?: string;
  numberOfGuests: number;
  tableId: number;
  date: string;
  time: string;
  occasion?: string;
  specialRequests?: string;
}

const tableOptions = [
  { id: 1, name: 'Table 1' },
  { id: 2, name: 'Table 2' },
  { id: 3, name: 'Table 3' },
  { id: 4, name: 'Table 4' },
  { id: 5, name: 'Table 5' },
  { id: 6, name: 'Table 6' },
];

const validateForm = (data: ReservationFormData): string | null => {
  if (!data.customerName.trim()) {
    return 'Customer name is required';
  }
  if (!data.phoneNumber.trim()) {
    return 'Phone number is required';
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return 'Invalid email format';
  }
  if (data.numberOfGuests < 1) {
    return 'Number of guests must be at least 1';
  }
  if (data.tableId === -1) {
    return 'Please select a table';
  }
  if (!data.date) {
    return 'Date is required';
  }
  if (!data.time) {
    return 'Time is required';
  }

  // Validate date is not in the past
  const selectedDateTime = new Date(`${data.date}T${data.time}`);
  if (selectedDateTime < new Date()) {
    return 'Cannot make reservation for past date/time';
  }

  return null;
};

export default function NewReservationModal({ isOpen, onClose }: NewReservationModalProps) {
  

  const [createReservation, { isLoading }] = useCreateReservationMutation();
  const { data: tables = [], isLoading: isLoadingTables } = useGetTablesQuery();
  const [formData, setFormData] = useState<ReservationFormData>({
    customerName: '',
    phoneNumber: '',
    email: '',
    numberOfGuests: 2,
    tableId: -1,
    date: '',
    time: '',
    occasion: '',
    specialRequests: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Set default time to current time rounded to nearest 30 minutes
      const hours = today.getHours();
      const minutes = today.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 30) * 30;
      const adjustedHours = hours + Math.floor(roundedMinutes / 60);
      const finalMinutes = roundedMinutes % 60;
      const formattedTime = `${String(adjustedHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

      setFormData(prev => ({
        ...prev,
        date: formattedDate,
        time: formattedTime,
      }));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await createReservation(formData).unwrap();
      toast.success('Reservation created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Failed to create reservation');
    }
  };

  const inputClassName = "mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      New Reservation
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-500">
                      Add a new reservation to the system.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className={inputClassName}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className={inputClassName}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={inputClassName}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700">
                            Number of Guests
                          </label>
                          <input
                            type="number"
                            id="numberOfGuests"
                            min="1"
                            value={formData.numberOfGuests}
                            onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                            className={inputClassName}
                            required
                          />
                        </div>

                        <div>
                          <Dropdown
                            label="Table"
                            value={formData.tableId.toString()}
                            onChange={(value) => setFormData({ ...formData, tableId: parseInt(value) })}
                            options={tables.map(table => ({
                              value: table.id.toString(),
                              label: `${table.name} (${table.capacity} seats)`
                            }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className={inputClassName}
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                            Time
                          </label>
                          <input
                            type="time"
                            id="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className={inputClassName}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="occasion" className="block text-sm font-medium text-gray-700">
                          Occasion (Optional)
                        </label>
                        <input
                          type="text"
                          id="occasion"
                          value={formData.occasion}
                          onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                          className={inputClassName}
                        />
                      </div>

                      <div>
                        <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          id="specialRequests"
                          rows={3}
                          value={formData.specialRequests}
                          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                          className={inputClassName}
                        />
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="rounded-md bg-[#0F172A] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Creating...' : 'Add Reservation'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 