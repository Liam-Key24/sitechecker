'use client';

import { useState } from 'react';

interface BreakdownData {
  pagespeed_score: number | null;
  foursquare_score: number | null;
  final_score: number | null;
  weakness_notes?: string[];
}

interface BreakdownProps {
  data: BreakdownData;
}

export default function Breakdown({ data }: BreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data.pagespeed_score && !data.foursquare_score) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {isOpen ? 'Hide' : 'Show'} Score Breakdown
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">PageSpeed:</span>
              <span className="ml-2 font-medium">
                {data.pagespeed_score !== null ? `${data.pagespeed_score}/100` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Foursquare:</span>
              <span className="ml-2 font-medium">
                {data.foursquare_score !== null ? `${data.foursquare_score}/100` : 'N/A'}
              </span>
            </div>
          </div>

          {data.final_score !== null && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Final Score (Median):</span>
              <span className="ml-2 font-semibold text-lg">{data.final_score}/100</span>
            </div>
          )}

          {data.weakness_notes && data.weakness_notes.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Weaknesses:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {data.weakness_notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

