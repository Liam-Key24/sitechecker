'use client';

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
  const isMasonry = columnCount === 4;
  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        Showing {businesses.length} of {totalCount} businesses
      </div>
      {businesses.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">
          No businesses match your filters.
        </div>
      ) : isMasonry ? (
        <div
          className="columns-1 gap-6 md:columns-4"
          style={{ columnGap: '1.5rem' }}
        >
          {businesses.map((business) => (
            <div
              key={business.id}
              className="break-inside-avoid mb-6"
            >
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
