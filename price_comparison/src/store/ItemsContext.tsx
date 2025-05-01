'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  sku?: string;
}

interface ItemsContextType {
  items: Item[];
  addItem: (item: Omit<Item, 'id'>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = (item: Omit<Item, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearItems = () => {
    setItems([]);
  };

  return (
    <ItemsContext.Provider value={{ items, addItem, removeItem, clearItems }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (context === undefined) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
} 