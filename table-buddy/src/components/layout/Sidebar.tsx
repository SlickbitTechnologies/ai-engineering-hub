import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PhoneIcon,
  CalendarIcon,
  TableCellsIcon,
  PhoneArrowUpRightIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Call Simulator', href: '/dashboard/call-simulator', icon: PhoneArrowUpRightIcon },
  { name: 'Reservations', href: '/dashboard/reservations', icon: CalendarIcon },
  { name: 'Tables', href: '/dashboard/tables', icon: TableCellsIcon },
  { name: 'Call Logs', href: '/dashboard/calls', icon: ClipboardDocumentListIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-gray-200  flex-col justify-center items-baseline">
        <h1 className="text-xl font-bold text-gray-900">Bella Cucina</h1>
        <span className="text-sm text-gray-500 ml-2">Reservation System</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">Restaurant Voice Agent v1.0</div>
      </div>
    </div>
  );
} 