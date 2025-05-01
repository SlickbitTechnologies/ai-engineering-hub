'use client';

import Header from '@/components/Header/Header';
import QuickEntry from '@/components/ItemEntry/QuickEntry';
import ManualEntry from '@/components/ItemEntry/ManualEntry';
import AddedItems from '@/components/ItemEntry/AddedItems';
import { useItems } from '@/store/ItemsContext';
import { ParsedItem } from '@/utils/parseItems';

export default function Home() {
  const { items, addItem, removeItem } = useItems();
  console.log(items);
  const handleQuickAdd = (items: ParsedItem[]) => {
    console.log('Quick adding items:', items);
    items.forEach(addItem);
  };

  const handleManualAdd = (item: {
    name: string;
    sku?: string;
    quantity: number;
    unit: string;
  }) => {
    addItem(item);
  };

  return (
  
    
      <div className="max-w-6xl mx-auto px-1 py-8 ">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
          Enter Your Purchase Order Items
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Compare prices between Hyperpure and Best Price
        </p>
        
        <div className="bg-white rounded-lg p-6  border shadow-sm grid grid-cols-2 lg:grid-cols-[1fr,400px] gap-6 flex ">
          <div className=" border p-3">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Purchase Order Items</h2>
            <p className="text-gray-600 mb-6">
              Enter your items to compare prices between Best Price and Hyperpure
            </p>
            
            <QuickEntry onAddItems={handleQuickAdd} />
            <ManualEntry onAddItem={handleManualAdd} />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border h-fit lg:sticky lg:top-4">
            <AddedItems items={items} onRemoveItem={removeItem} />
          </div>
        </div>
      </div>
      
     
  
  );
}
