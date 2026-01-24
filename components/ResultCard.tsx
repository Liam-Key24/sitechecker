'use client';

import { useState } from 'react';
import ScoreBadge from './ScoreBadge';
import Breakdown from './Breakdown';

interface Business {
  id: string;
  place_id: string;
  name: string;
  website: string | null;
  address: string | null;
  phone: string | null;
  categories: string[];
  google_rating: number | null;
  google_review_count: number | null;
  foursquare_rating: number | null;
  final_score: number | null;
  checked: boolean;
  breakdown?: {
    pagespeed_score: number | null;
    foursquare_score: number | null;
    final_score: number | null;
    weakness_notes?: string[];
  };
}

interface ResultCardProps {
  business: Business;
  onToggleChecked: (id: string, checked: boolean) => void;
  onAnalyze: (id: string) => Promise<void>;
}

export default function ResultCard({ business, onToggleChecked, onAnalyze }: ResultCardProps) {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!business.website) return;
    setAnalyzing(true);
    try {
      await onAnalyze(business.id);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${business.checked ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + (business.address ? ` ${business.address}` : ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {business.name}
            </a>
          </h3>
          {!business.website && (
            <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
              NO WEBSITE - HIGH PRIORITY
            </span>
          )}
        </div>
        <button
          onClick={() => onToggleChecked(business.id, !business.checked)}
          className={`ml-4 px-3 py-1 rounded text-sm font-medium transition-colors ${
            business.checked
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {business.checked ? '✓ Checked' : 'Mark Checked'}
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {business.address && (
          <p>
            <span className="font-medium">Address:</span> {business.address}
          </p>
        )}
        {business.phone && (
          <p>
            <span className="font-medium">Phone:</span> {business.phone}
          </p>
        )}
        {business.categories.length > 0 && (
          <p>
            <span className="font-medium">Categories:</span>{' '}
            <span className="inline-flex flex-wrap gap-1 mt-1">
              {business.categories.map((cat, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {cat}
                </span>
              ))}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {business.google_rating !== null && (
          <div>
            <span className="font-medium text-gray-700">Google:</span>{' '}
            <span className="text-gray-600">
              ⭐ {business.google_rating.toFixed(1)} ({business.google_review_count || 0} reviews)
            </span>
          </div>
        )}
        {business.foursquare_rating !== null && (
          <div>
            <span className="font-medium text-gray-700">Foursquare:</span>{' '}
            <span className="text-gray-600">⭐ {business.foursquare_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex-1">
          <ScoreBadge score={business.final_score} size="md" />
          {business.breakdown && <Breakdown data={business.breakdown} />}
        </div>
        <div className="flex gap-2 ml-4">
          {business.website && (
            <>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Visit Site
              </a>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Website'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

