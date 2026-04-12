'use client';

import type { ResultsFiltersState } from '../types';

interface ResultsFiltersProps {
  filters: ResultsFiltersState;
  onChange: (filters: ResultsFiltersState) => void;
  embedded?: boolean;
}

const DEFAULT_FILTERS: ResultsFiltersState = {
  scoreMin: '',
  scoreMax: '',
  hasWebsite: 'all',
  checked: 'all',
  analysisStatus: 'all',
};

export default function ResultsFilters({
  filters,
  onChange,
  embedded = false,
}: ResultsFiltersProps) {
  const hasActiveFilters =
    filters.scoreMin !== DEFAULT_FILTERS.scoreMin ||
    filters.scoreMax !== DEFAULT_FILTERS.scoreMax ||
    filters.hasWebsite !== DEFAULT_FILTERS.hasWebsite ||
    filters.checked !== DEFAULT_FILTERS.checked ||
    filters.analysisStatus !== DEFAULT_FILTERS.analysisStatus;

  return (
    <div
      className={`rounded-2xl border border-stone-200/90 bg-white p-4 shadow-lg shadow-black/5 sm:p-5 ${
        embedded ? '' : 'mb-6'
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-950/85">
          Refine results
        </h2>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          disabled={!hasActiveFilters}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div>
          <label htmlFor="filter-score-min" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
            Score Min
          </label>
          <input
            id="filter-score-min"
            type="number"
            min={0}
            max={100}
            value={filters.scoreMin}
            onChange={(e) => onChange({ ...filters, scoreMin: e.target.value })}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="0"
            aria-label="Minimum score"
          />
        </div>
        <div>
          <label htmlFor="filter-score-max" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
            Score Max
          </label>
          <input
            id="filter-score-max"
            type="number"
            min={0}
            max={100}
            value={filters.scoreMax}
            onChange={(e) => onChange({ ...filters, scoreMax: e.target.value })}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="100"
            aria-label="Maximum score"
          />
        </div>
        <div>
          <label htmlFor="filter-has-website" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
            Has Website
          </label>
          <select
            id="filter-has-website"
            value={filters.hasWebsite}
            onChange={(e) => onChange({ ...filters, hasWebsite: e.target.value })}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Filter by has website"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-checked" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
            Checked Status
          </label>
          <select
            id="filter-checked"
            value={filters.checked}
            onChange={(e) => onChange({ ...filters, checked: e.target.value })}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Filter by checked status"
          >
            <option value="all">All</option>
            <option value="checked">Checked</option>
            <option value="unchecked">Unchecked</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-analysis" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
            Analysis
          </label>
          <select
            id="filter-analysis"
            value={filters.analysisStatus}
            onChange={(e) =>
              onChange({
                ...filters,
                analysisStatus: e.target.value as ResultsFiltersState['analysisStatus'],
              })
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Filter by analysis status"
          >
            <option value="all">All</option>
            <option value="analyzed">Analyzed</option>
            <option value="pending">Not analyzed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
