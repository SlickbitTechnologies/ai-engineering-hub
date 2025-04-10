import { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Confirmed',
    value: '0',
    icon: CheckCircleIcon,
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Pending',
    value: '0',
    icon: ClockIcon,
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'Upcoming (1hr)',
    value: '0',
    icon: CalendarIcon,
    bgColor: 'bg-green-50',
  },
];

export default function TodaysStats() {
  const [statsData, setStatsData] = useState(stats);
  console.log(statsData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        
        setStatsData([
          { ...stats[0], value: data.confirmed.toString() },
          { ...stats[1], value: data.pending.toString() },
          { ...stats[2], value: data.upcoming.toString() },
        ]);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold leading-7 text-gray-900">Today's Stats</h3>
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsData.map((stat) => (
          <div
            key={stat.name}
            className={`${stat.bgColor} overflow-hidden rounded-lg px-4 py-5`}
          >
            <dt className="flex items-center gap-2">
              <stat.icon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              <p className="truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : stat.value}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
} 