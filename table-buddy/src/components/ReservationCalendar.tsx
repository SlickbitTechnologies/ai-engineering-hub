import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useState, useEffect } from 'react';

interface CalendarReservation {
  date: string;
  count: number;
  statuses: string;
}

export default function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDayOfMonth = new Date(year, month, daysInMonth).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => 0);
  const nextMonthDays = Array.from({ length: 6 - lastDayOfMonth }, (_, i) => 0);

  const allDays = [...prevMonthDays, ...days, ...nextMonthDays];

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/reservations/calendar?year=${year}&month=${month + 1}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch calendar reservations');
        }
        const data = await response.json();
        setReservations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching calendar reservations:', err);
        setError('Failed to load calendar reservations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getReservationCount = (day: number): number => {
    if (day === 0) return 0;
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const reservation = reservations.find(r => r.date === date);
    return reservation?.count ?? 0;
  };

  const getReservationStatus = (day: number) => {
    if (day === 0) return '';
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const reservation = reservations.find(r => r.date === date);
    if (!reservation || !reservation.statuses) return '';
    
    const statuses = reservation.statuses.split(',');
    if (statuses.includes('confirmed')) return 'bg-green-100';
    if (statuses.includes('pending')) return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  return (
    <div>
      <h3 className="text-base font-semibold leading-7 text-gray-900">Reservation Calendar</h3>
      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-300">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-400" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>
          <div className="mt-2 grid grid-cols-7 text-sm">
            {allDays.map((day, index) => (
              <div
                key={index}
                className={`relative py-1.5 ${
                  day === 0 ? 'text-gray-300' : 'text-gray-900'
                }`}
              >
                <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${getReservationStatus(day)}`}>
                  {day !== 0 && day}
                </div>
                {getReservationCount(day) > 0 && (
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
                    {getReservationCount(day)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 