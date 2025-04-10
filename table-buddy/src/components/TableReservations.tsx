import { useState, useEffect } from 'react';

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

interface TableReservationsProps {
  reservations: TableReservation[];
}

export default function TableReservations() {
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tables/reserved');
        if (!response.ok) {
          throw new Error('Failed to fetch table reservations');
        }
        const data = await response.json();
        setReservations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching table reservations:', err);
        setError('Failed to load table reservations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
    // Refresh every minute
    const interval = setInterval(fetchReservations, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-700 ring-green-600/20';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 ring-yellow-600/20';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 ring-red-600/20';
      default:
        return 'bg-gray-100 text-gray-700 ring-gray-600/20';
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[10px] p-6 shadow-sm ring-1 ring-gray-300 mt-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Table Reservations</h2>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left">
              <th scope="col" className="py-3.5 pl-4 pr-3 text-sm font-medium text-gray-500">
                Table
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-medium text-gray-500">
                Capacity
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-medium text-gray-500">
                Section
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-medium text-gray-500">
                Reservations
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No tables found
                </td>
              </tr>
            ) : (
              reservations.map((table) => (
                <tr key={table.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3">
                    <div className="font-medium text-gray-900">{table.tableName}</div>
                    {table.attributes.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {table.attributes.map((attr) => (
                          <span
                            key={attr}
                            className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                          >
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {table.capacity}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {table.section}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    {table.reservation ? (
                      <div>
                        <div className="font-medium text-gray-900">{table.reservation.customerName}</div>
                        <div className="text-sm text-gray-500">{table.reservation.time}</div>
                        <div className="text-sm text-gray-500">{table.reservation.guests}</div>
                        <span className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(table.reservation.status)}`}>
                          {table.reservation.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No reservations</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 