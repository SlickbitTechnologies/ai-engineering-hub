"use client";

import React from 'react';
import { RedactionEntity } from '@/types/redaction';
import { EntityCard } from './EntityCard';

interface EntityGridProps {
  entities: RedactionEntity[];
  onNavigateToPage?: (page: number) => void;
  emptyMessage?: string;
}

/**
 * Component to display a grid of redaction entity cards
 */
export function EntityGrid({ entities, onNavigateToPage, emptyMessage = "No entities found" }: EntityGridProps) {
  if (entities.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entities.map(entity => (
        <EntityCard 
          key={entity.id}
          entity={entity}
          onNavigateToPage={onNavigateToPage}
        />
      ))}
    </div>
  );
} 