import React from 'react';
import { FaDownload, FaFileExport } from 'react-icons/fa';

interface CallDetailHeaderProps {
  date: string;
  onBack: () => void;
}

const CallDetailHeader: React.FC<CallDetailHeaderProps> = ({ date, onBack }) => {
  console.log('Rendering CallDetailHeader component');
  
  return (
    <div className="rounded-lg ">
     

      <div className="p-4">
        <button 
          onClick={onBack}
          className="flex items-center text-[#00aff0] font-medium text-sm hover:text-[#0099d6]"
        >
          ← Back to Calls
        </button>

        <div className="flex justify-end space-x-2 mt-2">
          <button className="flex items-center gap-2 px-4 py-2 text-[#00aff0] border border-[#00aff0] rounded-md hover:bg-[#f0f9ff]">
            <FaDownload /> Download Audio
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-[#00aff0] border border-[#00aff0] rounded-md hover:bg-[#f0f9ff]">
            <FaFileExport /> Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallDetailHeader; 