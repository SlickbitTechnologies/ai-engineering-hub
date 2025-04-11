import React, { useState, useMemo } from 'react';
import { FaSearch, FaFilter, FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';
import { DataTable } from '../components/common';
import { Column } from '../components/common/DataTable';
import { Link } from 'react-router-dom';

interface Call {
  id: number;
  date: string;
  time: string;
  agent: string;
  customer: string;
  duration: string;
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  issues: number | 'None';
  kpiScore: string;
}

const CallsPage: React.FC = () => {
  console.log('Rendering Calls page');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Call>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock data for the calls
  const mockCalls: Call[] = [
    { 
      id: 1, 
      date: '2025-04-09', 
      time: '11:15 AM', 
      agent: 'David Lee', 
      customer: 'Emma Wilson', 
      duration: '12:07', 
      category: 'Policy Renewal', 
      sentiment: 'Neutral', 
      issues: 1, 
      kpiScore: '78%' 
    },
    { 
      id: 2, 
      date: '2025-04-09', 
      time: '10:24 AM', 
      agent: 'Sarah Johnson', 
      customer: 'Michael Smith', 
      duration: '8:32', 
      category: 'Claim Inquiry', 
      sentiment: 'Positive', 
      issues: 'None', 
      kpiScore: '92%' 
    },
    { 
      id: 3, 
      date: '2025-04-08', 
      time: '3:45 PM', 
      agent: 'Jessica Brown', 
      customer: 'Thomas Davis', 
      duration: '5:18', 
      category: 'Billing Issue', 
      sentiment: 'Negative', 
      issues: 2, 
      kpiScore: '65%' 
    },
    { 
      id: 4, 
      date: '2025-04-08', 
      time: '1:30 PM', 
      agent: 'Robert Miller', 
      customer: 'Olivia Garcia', 
      duration: '10:45', 
      category: 'New Policy', 
      sentiment: 'Positive', 
      issues: 'None', 
      kpiScore: '95%' 
    },
    { 
      id: 5, 
      date: '2025-04-07', 
      time: '9:20 AM', 
      agent: 'Sarah Johnson', 
      customer: 'William Johnson', 
      duration: '7:50', 
      category: 'Coverage Question', 
      sentiment: 'Neutral', 
      issues: 'None', 
      kpiScore: '88%' 
    },
    { 
      id: 6, 
      date: '2025-04-07', 
      time: '2:10 PM', 
      agent: 'David Lee', 
      customer: 'Sophia Martinez', 
      duration: '6:25', 
      category: 'Claim Inquiry', 
      sentiment: 'Positive', 
      issues: 'None', 
      kpiScore: '91%' 
    },
    { 
      id: 7, 
      date: '2025-04-06', 
      time: '4:30 PM', 
      agent: 'Robert Miller', 
      customer: 'Ava Brown', 
      duration: '4:15', 
      category: 'Policy Cancellation', 
      sentiment: 'Neutral', 
      issues: 1, 
      kpiScore: '72%' 
    },
    { 
      id: 8, 
      date: '2025-04-06', 
      time: '11:05 AM', 
      agent: 'Jessica Brown', 
      customer: 'James Wilson', 
      duration: '9:40', 
      category: 'Billing Issue', 
      sentiment: 'Negative', 
      issues: 3, 
      kpiScore: '58%' 
    }
  ];

  // Handle sorting
  const handleSort = (column: string) => {
    const colKey = column as keyof Call;
    if (sortColumn === colKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  // Sort the calls based on the current sort column and direction
  const sortedCalls = useMemo(() => {
    return [...mockCalls].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle numeric values
      if (aValue === 'None') return sortDirection === 'asc' ? -1 : 1;
      if (bValue === 'None') return sortDirection === 'asc' ? 1 : -1;
      
      // Convert percentage strings to numbers
      if (typeof aValue === 'string' && aValue.includes('%') && 
          typeof bValue === 'string' && bValue.includes('%')) {
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [mockCalls, sortColumn, sortDirection]);

  // Filter the calls based on the search term
  const filteredCalls = useMemo(() => {
    return sortedCalls.filter(call => {
      const searchLower = searchTerm.toLowerCase();
      return (
        call.agent.toLowerCase().includes(searchLower) ||
        call.customer.toLowerCase().includes(searchLower) ||
        call.category.toLowerCase().includes(searchLower)
      );
    });
  }, [sortedCalls, searchTerm]);

  // Render sentiment badge
  const renderSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Positive</span>;
      case 'Neutral':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Neutral</span>;
      case 'Negative':
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
  const columns: Column[] = useMemo(() => [
    { 
      key: 'date', 
      label: 'Date/Time', 
      sortable: true,
      render: (value, item: Call) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{item.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3')}</div>
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
      render: (_, item: Call) => (
        <Link to={`/calls/${item.id}`} className="font-medium text-[#00aff0] hover:text-[#0099d6]">View</Link>
      )
    }
  ], []);

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
          data={filteredCalls}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyMessage="No calls found matching your search criteria."
        />
      </div>
    </div>
  );
};

export default CallsPage; 