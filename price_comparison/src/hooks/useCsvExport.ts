import { useCallback } from 'react';

export interface CsvComparisonItem {
  item: string;
  quantity: string;
  walmartPrice: number;
  targetPrice: number;
  walmartTotal: number;
  targetTotal: number;
  priceDifference: number;
  walmartIsCheaper: boolean;
}

export function useCsvExport() {
  const exportComparisonToCsv = useCallback((items: CsvComparisonItem[]) => {
    console.log("Exporting CSV...",items);
    if (!items || items.length === 0) return;

    const headers = [
      'Item',
      'Quantity',
      'Walmart Price',
      'Target Price',
      'Walmart Total',
      'Target Total',
      'Price Difference',
      'Cheaper Platform'
    ];

    const rows = items.map(item => [
      item.item,
      item.quantity,
      item.walmartPrice.toFixed(2),
      item.targetPrice.toFixed(2),
      item.walmartTotal.toFixed(2),
      item.targetTotal.toFixed(2),
      item.priceDifference.toFixed(2),
      item.walmartIsCheaper ? 'Walmart' : 'Target'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_comparison.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return { exportComparisonToCsv };
} 