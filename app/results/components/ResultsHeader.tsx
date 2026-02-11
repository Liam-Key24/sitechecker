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

const LIMIT_OPTIONS = ['20', '50', '100', '200'] as const;

interface ResultsHeaderProps {
  location: string;
  totalCount: number;
  limit: string;
  analyzingAll: boolean;
  showFilters: boolean;
  columnCount: 2 | 4;
  sortBy: SortOption;
  onBack: () => void;
  onReloadAll: () => void;
  onExportCSV: () => void;
  onLimitChange: (limit: string) => void;
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
  limit,
  analyzingAll,
  showFilters,
  columnCount,
  sortBy,
  onBack,
  onReloadAll,
  onExportCSV,
  onLimitChange,
  onToggleFilters,
  onColumnCountChange,
  onSortChange,
}: ResultsHeaderProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [showLimitOpen, setShowLimitOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const showLimitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (viewRef.current && !viewRef.current.contains(target)) setViewOpen(false);
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
      if (showLimitRef.current && !showLimitRef.current.contains(target)) setShowLimitOpen(false);
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
          aria-label="Back to search"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
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
              aria-expanded={viewOpen}
              aria-haspopup="listbox"
              aria-label="View options"
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
            aria-label={columnCount === 2 ? 'Switch to 4 columns' : 'Switch to 2 columns'}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            aria-expanded={showFilters}
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              showFilters
                ? 'border-primary/40 bg-primary/10 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-primary/10 hover:border-primary/30'
            }`}
          >
            <Funnel className="h-4 w-4" weight="duotone" aria-hidden />
            Filter
          </button>

          <div className="relative" ref={showLimitRef}>
            <button
              type="button"
              onClick={() => { setShowLimitOpen((o) => !o); setSortOpen(false); setViewOpen(false); }}
              aria-expanded={showLimitOpen}
              aria-haspopup="listbox"
              aria-label={`Show ${limit} results per page; change limit`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              Show
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {limit}
              </span>
              <CaretDown className="h-4 w-4 text-gray-400" />
            </button>
            {showLimitOpen && (
              <div
                role="listbox"
                aria-label="Results per page"
                className="absolute left-0 top-full z-10 mt-1 min-w-[100px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={limit === opt}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 ${
                      limit === opt ? 'bg-primary/10 font-medium text-gray-900' : 'text-gray-700'
                    }`}
                    onClick={() => { onLimitChange(opt); setShowLimitOpen(false); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => { setSortOpen((o) => !o); setViewOpen(false); }}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              aria-label={`Sort by ${SORT_LABELS[sortBy]}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <SortAscending className="h-4 w-4 text-gray-500" weight="duotone" aria-hidden />
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
          aria-busy={analyzingAll}
          aria-label={analyzingAll ? 'Reloading all analyses' : 'Reload all analyses'}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-gray-900 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzingAll ? 'Reloading...' : 'Reload All'}
        </button>
        <button
          type="button"
          onClick={onExportCSV}
          aria-label="Export results to CSV"
          className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
