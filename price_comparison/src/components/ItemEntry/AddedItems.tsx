import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  sku?: string;
}

interface AddedItemsProps {
  items: Item[];
  onRemoveItem: (id: string) => void;
}

const AddedItems = ({ items, onRemoveItem }: AddedItemsProps) => {
  const router = useRouter();

  const handleContinue = () => {
    if (items.length > 0) {
      router.push('/comparison');
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-medium mb-2 text-gray-500">Added Items ({items.length})</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
          >
            <div>
              <div className="font-medium text-gray-800">{item.name}</div>
              <div className="text-sm text-gray-600 text-gray-500">
                {item.quantity} &nbsp;&nbsp;
                {item.sku && (
                <span className="text-xs text-gray-500">SKU: {item.sku}</span>
              )}
                </div>
              
            </div>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <button 
        onClick={handleContinue}
        disabled={items.length === 0}
        className={`w-full mt-4 py-3 rounded-md font-medium cursor-pointer ${
          items.length > 0 
            ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue with {items.length} items
      </button>
    </div>
  );
};

export default AddedItems; 