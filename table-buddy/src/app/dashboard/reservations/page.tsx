'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/layout/PageContainer';
import NewReservationModal from '@/components/reservations/NewReservationModal';
import { MagnifyingGlassIcon, CalendarIcon, TableCellsIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useGetReservationsQuery, useUpdateReservationMutation } from '@/store/api/reservationsApi';
import { format } from 'date-fns';
import Dropdown from '@/components/ui/Dropdown';
import { toast } from 'react-hot-toast';

interface Reservation {
  id: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  occasion: string;
  special_requests: string;
  status: string;
  table_id: number;
  table_name: string;
  table_section: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
];

export default function ReservationsPage() {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);

  const { data: reservations = [], isLoading, error } = useGetReservationsQuery();
  const [updateReservation] = useUpdateReservationMutation();

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.customer_phone.includes(searchQuery);
    
    const matchesDate = selectedDate === '' || 
      reservation.date === selectedDate;
    
    const matchesStatus = selectedStatus === 'All Statuses' || 
      reservation.status === selectedStatus.toLowerCase();

    return matchesSearch && matchesDate && matchesStatus;
  });

  const handleStatusChange = async (reservationId: number, newStatus: string) => {
    try {
      await updateReservation({ id: reservationId, status: newStatus });
      toast.success('Reservation status updated successfully');
    } catch (error) {
      toast.error('Failed to update reservation status');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer title="Reservations" description="Manage all restaurant reservations">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading reservations...</div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageContainer title="Reservations" description="Manage all restaurant reservations">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error loading reservations. Please try again later.</div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer
        title="Reservations"
        description="Manage all restaurant reservations"
      >
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsNewReservationModalOpen(true)}
            className="rounded-md bg-[#0F172A] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            New Reservation
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-2xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Cancelled</option>
                <option>Completed</option>
              </select>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center rounded-md bg-white p-1 ring-1 ring-inset ring-gray-300">
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded ${
                  view === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <ListBulletIcon className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded ${
                  view === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <Squares2X2Icon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-300">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{reservation.customer_name}</div>
                    <div className="text-gray-500 text-xs">{reservation.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(`${reservation.date}T${reservation.time}`), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{reservation.table_name} {reservation.table_id}</div>
                    <div className="text-gray-500 text-xs">{reservation.table_section}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.party_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.occasion || reservation.special_requests || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Dropdown
                      options={statusOptions}
                      value={reservation.status}
                      onChange={(value) => handleStatusChange(reservation.id, value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <NewReservationModal
          isOpen={isNewReservationModalOpen}
          onClose={() => setIsNewReservationModalOpen(false)}
        />
      </PageContainer>
    </DashboardLayout>
  );
} 