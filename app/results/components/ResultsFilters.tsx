'use client';

import type { ResultsFiltersState } from '../types';

interface ResultsFiltersProps {
  filters: ResultsFiltersState;
  onChange: (filters: ResultsFiltersState) => void;
}

export default function ResultsFilters({ filters, onChange }: ResultsFiltersProps) {
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 font-semibold text-gray-900">Filters</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="filter-score-min" className="mb-1 block text-sm font-medium text-gray-700">
            Score Min
          </label>
          <input
            id="filter-score-min"
            type="number"
            min={0}
            max={100}
            value={filters.scoreMin}
            onChange={(e) => onChange({ ...filters, scoreMin: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="0"
            aria-label="Minimum score"
          />
        </div>
        <div>
          <label htmlFor="filter-score-max" className="mb-1 block text-sm font-medium text-gray-700">
            Score Max
          </label>
          <input
            id="filter-score-max"
            type="number"
            min={0}
            max={100}
            value={filters.scoreMax}
            onChange={(e) => onChange({ ...filters, scoreMax: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="100"
            aria-label="Maximum score"
          />
        </div>
        <div>
          <label htmlFor="filter-has-website" className="mb-1 block text-sm font-medium text-gray-700">
            Has Website
          </label>
          <select
            id="filter-has-website"
            value={filters.hasWebsite}
            onChange={(e) => onChange({ ...filters, hasWebsite: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            aria-label="Filter by has website"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-checked" className="mb-1 block text-sm font-medium text-gray-700">
            Checked Status
          </label>
          <select
            id="filter-checked"
            value={filters.checked}
            onChange={(e) => onChange({ ...filters, checked: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            aria-label="Filter by checked status"
          >
            <option value="all">All</option>
            <option value="checked">Checked</option>
            <option value="unchecked">Unchecked</option>
          </select>
        </div>
      </div>
    </div>
  );
}
