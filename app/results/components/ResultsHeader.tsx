'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowsClockwise,
  Buildings,
  CaretDown,
  Columns,
  DownloadSimple,
  Funnel,
  SortAscending,
} from 'phosphor-react';
import type { ResultsFiltersState } from '../types';
import ResultsFilters from './ResultsFilters';

export type SortOption = 'default' | 'score-desc' | 'score-asc' | 'name';

const LIMIT_OPTIONS = ['10', '20', '50', '100'] as const;

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
  filters: ResultsFiltersState;
  onFiltersChange: (filters: ResultsFiltersState) => void;
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
  filters,
  onFiltersChange,
}: ResultsHeaderProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [showLimitOpen, setShowLimitOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const showLimitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
      if (showLimitRef.current && !showLimitRef.current.contains(target)) setShowLimitOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="mb-6 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-lg shadow-black/5 sm:p-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to search"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <div className="shrink-0 rounded-xl border border-stone-200/80 bg-stone-50/90 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/25 text-emerald-950">
              <Buildings className="h-4 w-4" weight="duotone" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-emerald-950 sm:text-lg">
                Results: {location}
              </h1>
              <p className="text-xs text-gray-600">{totalCount} businesses found</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={showFilters}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            showFilters
              ? 'border-primary/40 bg-primary/15 text-emerald-950'
              : 'border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:bg-primary/10'
          }`}
        >
          <Funnel className="h-4 w-4" weight="duotone" aria-hidden />
          {showFilters ? 'Hide filters' : 'Show filters'}
        </button>

        <button
          type="button"
          onClick={() => onColumnCountChange(columnCount === 2 ? 4 : 2)}
          aria-label={columnCount === 2 ? 'Switch to 4 columns' : 'Switch to 2 columns'}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Columns className="h-4 w-4 text-emerald-900" weight="duotone" />
          Columns
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/25 px-1 text-xs font-semibold text-emerald-950">
            {columnCount}
          </span>
        </button>

        <div className="relative" ref={showLimitRef}>
          <button
            type="button"
            onClick={() => {
              setShowLimitOpen((o) => !o);
              setSortOpen(false);
            }}
            aria-expanded={showLimitOpen}
            aria-haspopup="listbox"
            aria-label={`Show ${limit} results per page; change limit`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Show {limit}
            <CaretDown className="h-4 w-4 text-gray-400" />
          </button>
          {showLimitOpen && (
            <div
              role="listbox"
              aria-label="Results per page"
              className="absolute left-0 top-full z-10 mt-1.5 min-w-32 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={limit === opt}
                  className={`w-full px-3 py-2 text-left text-sm transition hover:bg-primary/10 ${
                    limit === opt ? 'bg-primary/10 font-medium text-emerald-950' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    onLimitChange(opt);
                    setShowLimitOpen(false);
                  }}
                >
                  {opt} results
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => {
              setSortOpen((o) => !o);
              setShowLimitOpen(false);
            }}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
            aria-label={`Sort by ${SORT_LABELS[sortBy]}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <SortAscending className="h-4 w-4 text-gray-500" weight="duotone" aria-hidden />
            {SORT_LABELS[sortBy]}
            <CaretDown className="h-4 w-4 text-gray-400" />
          </button>
          {sortOpen && (
            <div className="absolute left-0 top-full z-10 mt-1.5 min-w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
              {(['default', 'score-desc', 'score-asc', 'name'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition hover:bg-primary/10 ${
                    sortBy === opt ? 'bg-primary/10 font-medium text-emerald-950' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    onSortChange(opt);
                    setSortOpen(false);
                  }}
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onReloadAll}
            disabled={analyzingAll}
            aria-busy={analyzingAll}
            aria-label={analyzingAll ? 'Reloading all analyses' : 'Reload all analyses'}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowsClockwise className={`h-4 w-4 ${analyzingAll ? 'animate-spin' : ''}`} />
            {analyzingAll ? 'Reloading…' : 'Reload all'}
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            aria-label="Export results to CSV"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <DownloadSimple className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{ gridTemplateRows: showFilters ? '1fr' : '0fr', opacity: showFilters ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 border-t border-stone-200/80 pt-4">
            <ResultsFilters filters={filters} onChange={onFiltersChange} embedded />
          </div>
        </div>
      </div>
    </div>
  );
}
