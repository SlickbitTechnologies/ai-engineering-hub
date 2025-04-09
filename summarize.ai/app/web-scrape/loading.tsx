export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 w-1/2 h-8 bg-gray-200 rounded animate-pulse"></div>
      
      <div className="mb-12">
        <div className="w-full h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="w-1/3 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="h-64 w-full bg-gray-100 rounded-md flex items-center justify-center animate-pulse">
        <svg 
          className="w-12 h-12 text-gray-300" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  );
} 