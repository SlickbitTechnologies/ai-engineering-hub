import React, { useState } from 'react';
import { FaSearch, FaFilter, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { DataTable } from '../components/common';
import { Column } from '../components/common/DataTable';
import { Link } from 'react-router-dom';
import { callsApi } from '../redux/callsApi';
import FilterDrawer, { FilterValues } from '../components/filters/FilterDrawer';

const ITEMS_PER_PAGE = 10;

interface DateFilter {
  startDate: Date | null;
  endDate: Date | null;
}

const CallsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    categories: [],
    sentiments: [],
    kpiScore: { min: 0, max: 100 }
  });
  console.log("activeFilters", activeFilters);
  // Get the date parameters only when both dates are set
  const dateParams = dateFilter.startDate && dateFilter.endDate
    ? {
        startDate: dateFilter.startDate.toISOString().split('T')[0],
        endDate: dateFilter.endDate.toISOString().split('T')[0]
      }
    : {};

  const { data: callsData, isLoading, error } = callsApi.useGetCallsQuery({
    page,
    limit: ITEMS_PER_PAGE,
    search: searchTerm,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    ...dateParams,
    categories: activeFilters.categories,
    sentiments: activeFilters.sentiments,
    kpiScore: `${activeFilters.kpiScore.min}-${activeFilters.kpiScore.max}`
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

  // Function to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to check if a date is within the selected range
  const isDateInRange = (dateStr: string): boolean => {
    if (!dateFilter.startDate || !dateFilter.endDate) return true;
    
    const date = new Date(dateStr);
    return date >= dateFilter.startDate && date <= dateFilter.endDate;
  };

  // Function to clear date filter
  const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null
    });
    setShowDateFilter(false);
  };

  // Function to apply date filter
  const applyDateFilter = (start: Date, end: Date) => {
    setDateFilter({
      startDate: start,
      endDate: end
    });
    setShowDateFilter(false);
  };

  // Filter the calls based on date range
  const filteredCalls = callsData?.calls.filter(call => isDateInRange(call.date)) || [];

  const handleStartDateChange = (date: Date | null) => {
    setDateFilter(prev => ({ 
      ...prev, 
      startDate: date,
      endDate: date && prev.endDate && date > prev.endDate ? null : prev.endDate
    }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setDateFilter(prev => ({ ...prev, endDate: date }));
  };

  const handleApplyFilters = (filters: FilterValues) => {
    setActiveFilters(filters);
    // Apply filters to your data here
    console.log('Applied filters:', filters);
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading calls</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
              <button onClick={() => setIsFilterDrawerOpen(true)} className="px-4 py-2 flex items-center bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
                <FaFilter className="mr-2" />
                Filters
                {(activeFilters.categories.length > 0 || 
              activeFilters.sentiments.length > 0 || 
              activeFilters.kpiScore.min > 0 || 
              activeFilters.kpiScore.max < 100) && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#00aff0] text-white rounded-full">
                Active
              </span>
            )}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`px-4 py-2 flex items-center bg-white border rounded hover:bg-gray-50 ${
                    dateFilter.startDate 
                      ? 'text-[#00aff0] border-[#00aff0]' 
                      : 'text-gray-700 border-gray-300'
                  }`}
                >
                  <FaCalendarAlt className="mr-2" />
                  {dateFilter.startDate 
                    ? `${formatDate(dateFilter.startDate)} - ${dateFilter.endDate ? formatDate(dateFilter.endDate) : 'Present'}`
                    : 'Date Range'}
                  {dateFilter.startDate && (
                    <FaTimes 
                      className="ml-2 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateFilter();
                      }}
                    />
                  )}
                </button>

                {showDateFilter && (
                  <div className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg z-50 border border-gray-200 min-w-[340px]">
                    <div className="flex flex-col gap-4">
                      <div className="text-gray-900">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <DatePicker
                          selected={dateFilter.startDate}
                          onChange={handleStartDateChange}
                          selectsStart
                          startDate={dateFilter.startDate}
                          endDate={dateFilter.endDate}
                          maxDate={new Date()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00aff0] text-gray-900"
                          dateFormat="MMM d, yyyy"
                          placeholderText="Select start date"
                          isClearable
                          showPopperArrow={false}
                          popperClassName="date-picker-popper"
                          customInput={
                            <input
                              style={{ width: '100%', color: 'inherit' }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00aff0] text-gray-900"
                            />
                          }
                        />
                      </div>
                      <div className="text-gray-900">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <DatePicker
                          selected={dateFilter.endDate}
                          onChange={handleEndDateChange}
                          selectsEnd
                          startDate={dateFilter.startDate}
                          endDate={dateFilter.endDate}
                          minDate={dateFilter.startDate || undefined}
                          maxDate={new Date()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00aff0] text-gray-900"
                          dateFormat="MMM d, yyyy"
                          placeholderText="Select end date"
                          isClearable
                          showPopperArrow={false}
                          popperClassName="date-picker-popper"
                          customInput={
                            <input
                              style={{ width: '100%', color: 'inherit' }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00aff0] text-gray-900"
                            />
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={clearDateFilter}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          if (dateFilter.startDate && dateFilter.endDate) {
                            applyDateFilter(dateFilter.startDate, dateFilter.endDate);
                          }
                          setShowDateFilter(false);
                        }}
                        disabled={!dateFilter.startDate || !dateFilter.endDate}
                        className={`px-3 py-1.5 text-sm text-white rounded ${
                          dateFilter.startDate && dateFilter.endDate
                            ? 'bg-[#00aff0] hover:bg-[#0099d6]'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
          pagination={{
            currentPage: page,
            totalPages: Math.ceil((callsData?.total || 0) / ITEMS_PER_PAGE),
            onPageChange: setPage
          }}
        />
      </div>

      

      <FilterDrawer 
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default CallsPage; 