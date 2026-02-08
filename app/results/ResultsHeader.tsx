'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Buildings,
  ListBullets,
  Columns,
  Funnel,
  CaretDown,
  SortAscending,
  ArrowLeft,
} from 'phosphor-react';

export type SortOption = 'default' | 'score-desc' | 'score-asc' | 'name';

interface ResultsHeaderProps {
  location: string;
  totalCount: number;
  analyzingAll: boolean;
  showFilters: boolean;
  columnCount: 2 | 4;
  sortBy: SortOption;
  onBack: () => void;
  onReloadAll: () => void;
  onExportCSV: () => void;
  onToggleFilters: () => void;
  onColumnCountChange: (n: 2 | 4) => void;
  onSortChange: (s: SortOption) => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Default',
  'score-desc': 'Score (high → low)',
  'score-asc': 'Score (low → high)',
  name: 'Name A–Z',
};

export default function ResultsHeader({
  location,
  totalCount,
  analyzingAll,
  showFilters,
  columnCount,
  sortBy,
  onBack,
  onReloadAll,
  onExportCSV,
  onToggleFilters,
  onColumnCountChange,
  onSortChange,
}: ResultsHeaderProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        viewRef.current && !viewRef.current.contains(e.target as Node) &&
        sortRef.current && !sortRef.current.contains(e.target as Node)
      ) {
        setViewOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Buildings className="h-5 w-5" weight="duotone" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Results: {location}
            </h1>
            <p className="text-xs text-gray-500">{totalCount} businesses</p>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200" aria-hidden />

        <div className="flex flex-wrap items-center gap-1">
          <div className="relative" ref={viewRef}>
            <button
              type="button"
              onClick={() => { setViewOpen((o) => !o); setSortOpen(false); }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/20">
                <ListBullets className="h-3.5 w-3.5 text-primary" weight="bold" />
              </span>
              Default
              <CaretDown className="h-4 w-4 text-gray-400" />
            </button>
            {viewOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-primary/10"
                  onClick={() => setViewOpen(false)}
                >
                  Default
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onColumnCountChange(columnCount === 2 ? 4 : 2)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            title={columnCount === 2 ? 'Switch to 4 columns' : 'Switch to 2 columns'}
          >
            <Columns className="h-4 w-4 text-primary" weight="duotone" />
            Column
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              {columnCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleFilters}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              showFilters
                ? 'border-primary/40 bg-primary/10 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-primary/10 hover:border-primary/30'
            }`}
            title={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <Funnel className="h-4 w-4" weight="duotone" />
            Filter
          </button>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => { setSortOpen((o) => !o); setViewOpen(false); }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <SortAscending className="h-4 w-4 text-gray-500" weight="duotone" />
              Sort
              <CaretDown className="h-4 w-4 text-gray-400" />
            </button>
            {sortOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {(['default', 'score-desc', 'score-asc', 'name'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 ${
                      sortBy === opt ? 'bg-primary/10 font-medium text-gray-900' : 'text-gray-700'
                    }`}
                    onClick={() => { onSortChange(opt); setSortOpen(false); }}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReloadAll}
          disabled={analyzingAll}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-gray-900 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzingAll ? 'Reloading...' : 'Reload All'}
        </button>
        <button
          type="button"
          onClick={onExportCSV}
          className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
