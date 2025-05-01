import { Download } from 'lucide-react';
import { useCsvExport, CsvComparisonItem } from '@/hooks/useCsvExport';

interface ComparisonHeaderProps {
  itemCount: number;
  platformCount: number;
  onExport?: () => void;
  items: CsvComparisonItem[];
}

export default function ComparisonHeader({ itemCount, platformCount, onExport, items }: ComparisonHeaderProps) {
  const { exportComparisonToCsv } = useCsvExport();

  const handleExport = () => {
    exportComparisonToCsv(items);
    // if (onExport) onExport();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Comparison Summary</h2>
        <p className="text-gray-500 text-sm">
          {itemCount} items compared across {platformCount} platforms
        </p>
      </div>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-50 rounded-md border cursor-pointer font-medium"
      >
        <Download size={18} />
        Export CSV
      </button>
    </div>
  );
} 