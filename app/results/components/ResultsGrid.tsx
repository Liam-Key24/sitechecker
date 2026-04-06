'use client';

import { MagnifyingGlass } from 'phosphor-react';
import ResultCard from '@/components/ResultCard';
import type { Business } from '../types';

interface ResultsGridProps {
  businesses: Business[];
  totalCount: number;
  columnCount: 2 | 4;
  onToggleChecked: (id: string, checked: boolean) => void;
  onAnalyze: (id: string, options?: { force?: boolean }) => Promise<void>;
  resultsLocation?: string | null;
}

export default function ResultsGrid({
  businesses,
  totalCount,
  columnCount,
  onToggleChecked,
  onAnalyze,
  resultsLocation,
}: ResultsGridProps) {
  const useExpandedGrid = columnCount === 4;
  return (
    <>
      <div className="mb-4 inline-flex items-center rounded-full border border-stone-200/90 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
        Showing {businesses.length} of {totalCount} businesses
      </div>
      {businesses.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/90 bg-white px-6 py-12 text-center shadow-lg shadow-black/5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-emerald-950">
            <MagnifyingGlass className="h-6 w-6" weight="duotone" />
          </div>
          <p className="text-base font-semibold text-emerald-950">No businesses match your filters</p>
          <p className="mt-1 text-sm text-gray-600">
            Try widening the score range or changing website/checked filters.
          </p>
        </div>
      ) : useExpandedGrid ? (
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {businesses.map((business) => (
            <div key={business.id}>
              <ResultCard
                business={business}
                onToggleChecked={onToggleChecked}
                onAnalyze={(id) => onAnalyze(id)}
                resultsLocation={resultsLocation}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 grid-rows-[auto] items-start gap-6 md:grid-cols-2">
          {businesses.map((business) => (
            <ResultCard
              key={business.id}
              business={business}
              onToggleChecked={onToggleChecked}
              onAnalyze={(id) => onAnalyze(id)}
              resultsLocation={resultsLocation}
            />
          ))}
        </div>
      )}
    </>
  );
}
