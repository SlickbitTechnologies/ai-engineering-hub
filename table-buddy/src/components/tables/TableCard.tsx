'use client';

import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TableCardProps {
  id: number;
  name: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  attributes: string[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TableCard({
  id,
  name,
  section,
  capacity,
  status,
  attributes,
  onEdit,
  onDelete
}: TableCardProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'occupied':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'reserved':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  return (
    <div className="relative rounded-lg bg-white shadow-sm ring-1 ring-gray-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            {name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {section}
          </p>
        </div>
        <span 
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyles(status)}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 flex-1">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500">Capacity</h4>
          <p className="mt-1 text-sm text-gray-900">{capacity} guests</p>
        </div>

        <div className="min-h-[80px]">
          <h4 className="text-sm font-medium text-gray-500">Attributes</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {attributes.length > 0 ? (
              attributes.map((attribute) => (
                <span
                  key={attribute}
                  className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                >
                  {attribute}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No attributes</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex gap-3">
          <button 
            onClick={() => onEdit(id)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 text-gray-400" />
            Edit
          </button>
          <button 
            onClick={() => onDelete(id)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 