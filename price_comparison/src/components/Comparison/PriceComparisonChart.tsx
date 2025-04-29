'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import React from 'react';

interface PriceComparisonChartProps {
  items: {
    item: string;
    walmartPrice: number;
    targetPrice: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
        <div style={{ color: 'black', fontWeight: 600, marginBottom: 6 }}>{label}</div>
        {payload.map((entry, idx) => (
          <div key={idx} style={{ color: entry.color, fontWeight: 500 }}>
            {entry.name}: ${entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PriceComparisonChart = ({ items }: PriceComparisonChartProps) => {
  // Prepare data for recharts
  const data = items.map(i => ({
    name: i.item,
    Walmart: i.walmartPrice,
    Target: i.targetPrice,
  }));

  return (
    <div className="w-full h-72 my-8">
      <h3 className="text-lg font-semibold text-center mb-4">Price Comparison Chart</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }} barCategoryGap={20} barSize={100}>
          <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Legend />
          <Bar dataKey="Walmart" fill="#0053e2" name="Walmart" radius={[10, 10, 0, 0]} />
          <Bar dataKey="Target" fill="#cc0000" name="Target" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceComparisonChart; 