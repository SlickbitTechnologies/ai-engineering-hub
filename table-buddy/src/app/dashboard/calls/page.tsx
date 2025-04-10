'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/layout/PageContainer';
import { MagnifyingGlassIcon, PhoneIcon, ClockIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface CallLog {
  id: string;
  phoneNumber: string;
  date: string;
  time: string;
  duration: string;
  reservation?: {
    datetime: string;
  };
  transcription: string;
}

const mockCalls: CallLog[] = [
  {
    id: '1',
    phoneNumber: '(555) 777-8888',
    date: 'Jul 14, 2023',
    time: '8:02 PM',
    duration: '5:20',
    reservation: {
      datetime: '2025-04-04 at 17:30',
    },
    transcription: 'Customer called to cancel their reservation for ...',
  },
  {
    id: '2',
    phoneNumber: '(555) 222-3333',
    date: 'Jul 14, 2023',
    time: '4:45 PM',
    duration: '3:00',
    reservation: {
      datetime: '2025-04-04 at 13:30',
    },
    transcription: 'Customer made a reservation for 4 people.',
  },
  {
    id: '3',
    phoneNumber: '(555) 111-2222',
    date: 'Jul 14, 2023',
    time: '3:53 PM',
    duration: '4:05',
    reservation: {
      datetime: '2025-04-04 at 11:30',
    },
    transcription: 'Customer called to make a reservation for their ...',
  },
];

export default function CallLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [calls] = useState<CallLog[]>(mockCalls);

  return (
    <DashboardLayout>
      <PageContainer
        title="Call Logs"
        description="Review all incoming calls handled by the voice agent"
      >
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:pl-6">
                  Phone Number
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date & Time
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Duration
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Reservation
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Transcription
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{call.phoneNumber}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <div className="text-sm text-gray-900">{call.date}</div>
                    <div className="text-sm text-gray-500">{call.time}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {call.duration}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    {call.reservation && (
                      <div className="flex items-center text-sm text-blue-600">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {call.reservation.datetime}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-start text-sm text-gray-500">
                      <DocumentTextIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{call.transcription}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
} 