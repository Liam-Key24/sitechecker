'use client';

import type { ResultsFiltersState } from './types';

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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Score Min
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.scoreMin}
            onChange={(e) => onChange({ ...filters, scoreMin: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Score Max
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.scoreMax}
            onChange={(e) => onChange({ ...filters, scoreMax: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Has Website
          </label>
          <select
            value={filters.hasWebsite}
            onChange={(e) => onChange({ ...filters, hasWebsite: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Checked Status
          </label>
          <select
            value={filters.checked}
            onChange={(e) => onChange({ ...filters, checked: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
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
