'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/layout/PageContainer';
import CallDetailsModal from '@/components/CallDetailsModel';
import { MagnifyingGlassIcon, PhoneIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface CallLog {
  id: string;
  callId: string;
  phoneNumber: string;
  date: string;
  time: string;
  duration: string;
  transcription: string;
  reservation: {
    datetime: string;
    customerName: string;
    partySize: number;
    status: string;
  };
}

export default function CallLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    const fetchCallLogs = async () => {
      try {
        const response = await fetch('/api/calls');
        if (!response.ok) {
          throw new Error('Failed to fetch call logs');
        }
        const data = await response.json();
        setCalls(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCallLogs();
  }, []);

  const filteredCalls = calls.filter(call => 
    call.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer
          title="Call Logs"
          description="Review all incoming calls handled by the voice agent"
        >
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageContainer
          title="Call Logs"
          description="Review all incoming calls handled by the voice agent"
        >
          <div className="text-red-500 text-center p-4">
            {error}
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCall(call)}>
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
                      <div className="flex flex-col text-sm">
                        <div className="text-blue-600">
                          <CalendarIcon className="h-4 w-4 inline-block mr-1" />
                          {call.reservation.datetime}
                        </div>
                       
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageContainer>
      {selectedCall && (
        <CallDetailsModal
          isOpen={!!selectedCall}
          onClose={() => setSelectedCall(null)}
          callDetails={{
            ...selectedCall,
             // Placeholder transcription
          }}
        />
      )}
    </DashboardLayout>
  );
} 