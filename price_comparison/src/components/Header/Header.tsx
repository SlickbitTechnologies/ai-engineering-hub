import Image from 'next/image';
import { MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="flex justify-between items-center px-6 py-4 border-b bg-white">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
          C
        </div>
        <span className="text-xl font-bold text-gray-800">Cost Compass</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <MapPin size={20} />
        <span>Hyderabad</span>
      </div>
    </header>
  );
};

export default Header; 