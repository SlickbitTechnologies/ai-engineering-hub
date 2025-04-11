import React from 'react';
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = 'No data found.'
}) => {
  console.log('Rendering DataTable component');

  const renderSortIndicator = (column: string) => {
    if (!sortColumn || column !== sortColumn) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <FaSortUp className="ml-1 text-gray-600" /> 
      : <FaSortDown className="ml-1 text-gray-600" />;
  };

  const getColumnAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                scope="col" 
                className={`px-6 py-3 ${getColumnAlignment(column.align)} text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''}`}
                onClick={() => column.sortable && onSort && onSort(column.key)}
              >
                <div className="flex items-center">
                  {column.label} {column.sortable && renderSortIndicator(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td 
                    key={`${index}-${column.key}`}
                    className={`px-6 py-4 whitespace-nowrap ${getColumnAlignment(column.align)}`}
                  >
                    {column.render 
                      ? column.render(item[column.key], item)
                      : <div className="text-sm text-gray-900">{item[column.key]}</div>
                    }
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable; 