'use client';

import { useEffect, useState } from 'react';
import { useItems } from '@/store/ItemsContext';
import Header from '@/components/Header/Header';
import ComparisonHeader from '@/components/Comparison/ComparisonHeader';
import PlatformComparison from '@/components/Comparison/PlatformComparison';
import ComparisonTable from '@/components/Comparison/ComparisonTable';
import PriceComparisonChart from '@/components/Comparison/PriceComparisonChart';
import { useRouter } from 'next/navigation';
import { CsvComparisonItem } from '@/hooks/useCsvExport';

interface ComparisonData {
  walmart: {
    totalCost: number;
    unavailableItems: number;
  };
  target: {
    totalCost: number;
    difference: number;
    unavailableItems: number;
  };
  items: Array<{
    item: string;
    quantity: string;
    walmartPrice: number;
    targetPrice: number;
    walmartTotal: number;
    targetTotal: number;
    priceDifference: number;
    walmartIsCheaper: boolean;
  }>;
}

export default function ComparisonPage() {
  const router = useRouter();
  const { items } = useItems();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        console.log('Sending items for comparison:', items);
        const response = await fetch('/api/compare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(items.map(item => {
            // Parse the quantity string back into its components
            
            return {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              sku: item.sku,
            };
          })),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch comparison data');
        }

        const data = await response.json();
        console.log('Received comparison data:', data);
        setComparisonData(data);
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError('Failed to load comparison data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (items.length > 0) {
      fetchComparison();
    } else {
      setError('No items to compare. Please add items first.');
      setLoading(false);
    }
  }, [items]);

  const handleExport = () => {
    // Implement CSV export functionality
    console.log('Exporting CSV...');
  };

  const handleStartNew = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Fetching comparison data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleStartNew}
              className="px-6 py-3 bg-cyan-500 text-white rounded-md font-medium hover:bg-cyan-600 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!comparisonData) {
    return null;
  }

  // Cast items to CsvComparisonItem for type safety
  const csvItems: CsvComparisonItem[] = comparisonData.items.map(item => ({ ...item }));

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
          Price Comparison Results
        </h1>
        <p className="text-gray-600 text-center mb-8">
          See which platform offers the best value
        </p>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <ComparisonHeader
            itemCount={comparisonData.items.length}
            platformCount={2}
            items={csvItems}
          />

          <PlatformComparison
            walmart={comparisonData.walmart}
            target={comparisonData.target}
          />

          <PriceComparisonChart items={comparisonData.items} />

          <ComparisonTable
            items={comparisonData.items}
            totalWalmart={comparisonData.walmart.totalCost}
            totalTarget={comparisonData.target.totalCost}
            totalDifference={comparisonData.target.difference}
          />

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleStartNew}
              className="px-6 py-3 bg-cyan-500 text-white rounded-md font-medium hover:bg-cyan-600 cursor-pointer"
            >
              Start New Comparison
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 