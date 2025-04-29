import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ComparisonItem {
  item: string;
  quantity: string;
  walmartPrice: number;
  targetPrice: number;
  walmartTotal: number;
  targetTotal: number;
  priceDifference: number;
  walmartIsCheaper: boolean;
}

interface ComparisonTableProps {
  items: ComparisonItem[];
  totalWalmart: number;
  totalTarget: number;
  totalDifference: number;
}

const ComparisonTable = ({ items, totalWalmart, totalTarget, totalDifference }: ComparisonTableProps) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Side-by-Side Price Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Item</th>
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Quantity</th>
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Walmart Price</th>
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Target Price</th>
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Walmart Total</th>
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Target Total</th>
              <th className="text-left py-2 px-4 font-semibold text-gray-800">Price Difference</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-3 px-4 text-gray-800 font-medium">{item.item}</td>
                <td className="py-3 px-4 text-gray-700">{item.quantity}</td>
                <td className="py-3 px-4">
                  <span className="text-gray-800">${item.walmartPrice.toFixed(2)}</span>
                  {item.walmartIsCheaper && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-medium">Best</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-800">${item.targetPrice.toFixed(2)}</span>
                  {!item.walmartIsCheaper && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-medium">Best</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-800">${item.walmartTotal.toFixed(2)}</td>
                <td className="py-3 px-4 text-gray-800">${item.targetTotal.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {item.walmartIsCheaper ? (
                      <ArrowDownRight className="text-red-600" size={16} />
                    ) : (
                      <ArrowUpRight className="text-green-600" size={16} />
                    )}
                    <span className={item.walmartIsCheaper ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      ${Math.abs(item.priceDifference).toFixed(2)} ({Math.abs((item.priceDifference / item.walmartTotal) * 100).toFixed(1)}%)
                    </span>
                    <span className="text-gray-700 text-sm ml-1">
                      {item.walmartIsCheaper ? 'Walmart is cheaper' : 'Target is cheaper'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-medium">
              <td className="py-3 px-4 text-gray-800">TOTAL</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4 text-gray-800">${totalWalmart.toFixed(2)}</td>
              <td className="py-3 px-4 text-gray-800">${totalTarget.toFixed(2)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  {totalDifference > 0 ? (
                    <ArrowDownRight className="text-green-600" size={16} />
                  ) : (
                    <ArrowUpRight className="text-red-600" size={16} />
                  )}
                  <span className={totalDifference > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    ${Math.abs(totalDifference).toFixed(2)}
                  </span>
                  <span className="text-gray-700 text-sm ml-1 font-medium">
                    {totalDifference > 0 ? 'Walmart is cheaper overall' : 'Target is cheaper overall'}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable; 