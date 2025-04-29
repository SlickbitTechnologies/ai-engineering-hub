interface PlatformComparisonProps {
  walmart: {
    totalCost: number;
    unavailableItems: number;
  };
  target: {
    totalCost: number;
    difference: number;
    unavailableItems: number;
  };
}

const PlatformComparison = ({ walmart, target }: PlatformComparisonProps) => {
  const walmartIsBest = walmart.totalCost < target.totalCost;
  const targetIsBest = target.totalCost < walmart.totalCost;
  const difference = Math.abs(target.totalCost - walmart.totalCost);
  console.log("Walmart total cost:", walmart.totalCost);
  console.log("Target total cost:", target.totalCost);
  console.log("Difference:", difference);

  return (
    <div className="flex gap-4">
    <div className={`flex-1 p-6 border rounded-lg  ${walmartIsBest ? 'bg-green-50' : ''}`}>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">Walmart</h3>
          {walmartIsBest && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md font-medium">Best Value</span>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Total Cost:</span>
            <span className="font-semibold text-gray-800">${walmart.totalCost.toFixed(2)}</span>
          </div>
          {!walmartIsBest && (
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Difference:</span>
              <span className={`font-semibold ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                +{difference.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Unavailable Items:</span>
            <span className="font-semibold text-gray-800">{walmart.unavailableItems}</span>
          </div>
        </div>
      </div>

      <div className={`flex-1 p-6 border rounded-lg ${targetIsBest ? 'bg-green-50' : ''}`}>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">Target</h3>
          {targetIsBest && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md font-medium">Best Value</span>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Total Cost:</span>
            <span className="font-semibold text-gray-800">${target.totalCost.toFixed(2)}</span>
          </div>
          {!targetIsBest && (
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Difference:</span>
              <span className={`font-semibold ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                +{difference.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Unavailable Items:</span>
            <span className="font-semibold text-gray-800">{target.unavailableItems}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformComparison; 