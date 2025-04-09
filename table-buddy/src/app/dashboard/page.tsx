'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/layout/PageContainer';
import { CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import TodaysStats from '@/components/TodaysStats';
import RecentReservations from '@/components/RecentReservations';
import ReservationCalendar from '@/components/ReservationCalendar';
import VapiCallSimulator from '@/components/call-simulator/VapiCallSimulator';
import TableReservations from '@/components/TableReservations';



interface TableReservation {
  id: number;
  tableName: string;
  attributes: string[];
  capacity: string;
  section: string;
  reservation?: {
    customerName: string;
    time: string;
    guests: string;
    status: 'Confirmed' | 'Pending' | 'Cancelled';
  };
}

// Mock data

const mockTableReservations: TableReservation[] = [
  {
    id: 1,
    tableName: 'Table 1',
    attributes: ['Romantic'],
    capacity: '2 guests',
    section: 'Window',
    reservation: {
      customerName: 'krishna',
      time: '19:00 - 20:30',
      guests: '2 guests',
      status: 'Confirmed',
    },
  },
  {
    id: 2,
    tableName: 'Table 2',
    attributes: ['Romantic'],
    capacity: '2 guests',
    section: 'Window',
  },
  {
    id: 3,
    tableName: 'Table 3',
    attributes: [],
    capacity: '4 guests',
    section: 'Main',
  },
  {
    id: 4,
    tableName: 'Table 4',
    attributes: [],
    capacity: '4 guests',
    section: 'Main',
  },
  {
    id: 5,
    tableName: 'Table 5',
    attributes: ['Family-friendly'],
    capacity: '6 guests',
    section: 'Main',
  },
  {
    id: 6,
    tableName: 'Table 6',
    attributes: ['Private', 'Birthday'],
    capacity: '8 guests',
    section: 'Private',
  },
  {
    id: 7,
    tableName: 'Table 7',
    attributes: ['High-top'],
    capacity: '2 guests',
    section: 'Bar',
  },
];

export default function DashboardPage() {
  
  const [tableReservations] = useState<TableReservation[]>(mockTableReservations);


  return (
    <DashboardLayout>
      <PageContainer
        title="Overview"
        description="Welcome to your restaurant management dashboard"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <TodaysStats />
              <RecentReservations />
            </div>
            <div className="space-y-6">
              <ReservationCalendar />
              <VapiCallSimulator assistantId="your-assistant-id" />
            </div>
          </div>
          <TableReservations />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
} 