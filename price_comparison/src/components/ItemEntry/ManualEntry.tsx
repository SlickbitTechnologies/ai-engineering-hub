'use client';

import { useState } from 'react';

interface ManualEntryProps {
  onAddItem: (item: {
    name: string;
    sku?: string;
    quantity: number;
    unit: string;
  }) => void;
}

const ManualEntry = ({ onAddItem }: ManualEntryProps) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: '1',
    unit: 'each'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (!formData.quantity || Number(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAddItem({
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        quantity: Number(formData.quantity),
        unit: formData.unit
      });

      // Reset form
      setFormData({
        name: '',
        sku: '',
        quantity: '1',
        unit: 'each'
      });
      setErrors({});
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="text-gray-700 text-sm font-medium">OR ADD ITEMS MANUALLY</div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Item Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md text-gray-800 placeholder:text-gray-500 ${
              errors.name ? 'border-red-500' : ''
            }`}
            placeholder="Enter item name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            SKU (Optional)
          </label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-gray-800 placeholder:text-gray-500"
            placeholder="Enter SKU"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Quantity<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-gray-800 placeholder:text-gray-500 ${
                errors.quantity ? 'border-red-500' : ''
              }`}
              placeholder="1"
              min="1"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Unit<span className="text-red-500">*</span>
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-gray-800 bg-white"
            >
              <option value="each">each</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 text-center border rounded-md text-gray-800 hover:bg-gray-50 font-medium cursor-pointer"
        >
          Add Item
        </button>
      </div>
    </form>
  );
};

export default ManualEntry; 