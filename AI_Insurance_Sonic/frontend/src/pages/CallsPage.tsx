import React, { useState } from 'react';
import { FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import { DataTable } from '../components/common';
import { Column } from '../components/common/DataTable';
import { Link } from 'react-router-dom';
import { callsApi } from '../redux/callsApi';

const ITEMS_PER_PAGE = 10;

const CallsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: callsData, isLoading, error } = callsApi.useGetCallsQuery({
    page,
    limit: ITEMS_PER_PAGE,
    search: searchTerm,
    sortBy: sortColumn,
    sortOrder: sortDirection
  });

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sentiment badge
  const renderSentimentBadge = (sentiment: string) => {
    console.log(sentiment);
    switch (sentiment) {
      case 'positive':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Positive</span>;
      case 'neutral':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Neutral</span>;
      case 'negative':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Negative</span>;
      default:
        return sentiment;
    }
  };

  // Render KPI score
  const renderKpiScore = (score: string) => {
    const scoreNumber = parseInt(score);
    let bgColor = '';
    
    if (scoreNumber >= 90) {
      bgColor = 'bg-green-500';
    } else if (scoreNumber >= 75) {
      bgColor = 'bg-[#00aff0]';
    } else {
      bgColor = 'bg-red-500';
    }
    
    return (
      <span className={`px-2 py-1 ${bgColor} text-white rounded-full text-xs font-medium`}>
        {score}
      </span>
    );
  };

  // Render issues
  const renderIssues = (issues: any) => {
    if (issues === 'None') {
      return <span className="text-gray-500">None</span>;
    }
    
    return (
      <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
        {issues}
      </span>
    );
  };

  // Define table columns
  const columns: Column[] = [
    { 
      key: 'date', 
      label: 'Date/Time', 
      sortable: true,
      render: (value, item: any) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{item.date}</div>
          <div className="text-sm text-gray-500">{item.time}</div>
        </div>
      )
    },
    { 
      key: 'agent', 
      label: 'Agent', 
      sortable: true 
    },
    { 
      key: 'customer', 
      label: 'Customer', 
      sortable: true 
    },
    { 
      key: 'duration', 
      label: 'Duration', 
      sortable: true 
    },
    { 
      key: 'category', 
      label: 'Category', 
      sortable: true 
    },
    { 
      key: 'sentiment', 
      label: 'Sentiment', 
      sortable: true,
      render: renderSentimentBadge
    },
    { 
      key: 'issues', 
      label: 'Issues', 
      sortable: true,
      align: 'center',
      render: renderIssues
    },
    { 
      key: 'kpiScore', 
      label: 'KPI Score', 
      sortable: true,
      align: 'center',
      render: renderKpiScore
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, item: any) => (
        <Link to={`/calls/${item.id}`} className="font-medium text-[#00aff0] hover:text-[#0099d6]">View</Link>
      )
    }
  ];

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading calls</div>;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Call Library</h2>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow max-w-xl">
              <input
                type="text"
                placeholder="Search by customer, agent or category..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FaSearch />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="px-4 py-2 flex items-center bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
                <FaFilter className="mr-2" />
                Filters
              </button>
              <button className="px-4 py-2 flex items-center bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
                <FaCalendarAlt className="mr-2" />
                Date
              </button>
            </div>
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={callsData?.calls || []}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyMessage="No calls found matching your search criteria."
          pagination={{
            currentPage: page,
            totalPages: Math.ceil((callsData?.total || 0) / ITEMS_PER_PAGE),
            onPageChange: setPage
          }}
        />
      </div>
    </div>
  );
};

export default CallsPage; 