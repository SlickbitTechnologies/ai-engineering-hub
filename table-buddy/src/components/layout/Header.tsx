import { BellIcon } from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <div className="flex h-16 flex-shrink-0 bg-white border-b border-gray-200">
      <div className="flex flex-1 justify-between px-6">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Bella Cucina Management
          </h1>
        </div>
        <div className="ml-4 flex items-center space-x-4">
          <button
            type="button"
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
} 