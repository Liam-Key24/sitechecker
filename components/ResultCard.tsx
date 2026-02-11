'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ListChecks, Globe, Star, Check, CheckCircle } from 'phosphor-react';
import ScoreBadge from './ScoreBadge';
import Breakdown from './Breakdown';
import type { AnalysisBreakdown } from '@/lib/contracts';

async function runAnalyze(
  onAnalyze: (id: string) => Promise<void>,
  id: string,
  setAnalyzing: (v: boolean) => void
) {
  setAnalyzing(true);
  try {
    await onAnalyze(id);
  } finally {
    setAnalyzing(false);
  }
}

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
  breakdown?: AnalysisBreakdown | null;
}

interface ResultCardProps {
  business: Business;
  onToggleChecked: (id: string, checked: boolean) => void;
  onAnalyze: (id: string) => Promise<void>;
  /** Pass from results page so Contact page can link back with same search */
  resultsLocation?: string | null;
}

function statusTag(business: Business) {
  if (!business.website) return { label: 'No website', className: 'bg-red-100 text-red-800' };
  if (business.breakdown && business.final_score !== null) return { label: 'Analyzed', className: 'bg-primary/20 text-gray-900' };
  return { label: 'Not analyzed', className: 'bg-gray-100 text-gray-700' };
}

export default function ResultCard({ business, onToggleChecked, onAnalyze, resultsLocation }: ResultCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const status = statusTag(business);
  const score = business.final_score ?? business.breakdown?.web_standards_score ?? null;
  const progress = score !== null ? Math.min(100, Math.max(0, score)) : 0;

  const contactPageHref = `/results/contact?businessId=${encodeURIComponent(business.id)}${resultsLocation ? `&location=${encodeURIComponent(resultsLocation)}` : ''}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5 transition-shadow hover:shadow-xl ${
        business.checked ? 'ring-2 ring-primary/40' : ''
      }`}
    >
      {/* Status tag */}
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
        {status.label}
      </span>

      {/* Title */}
      <h3 className="mt-3 text-xl font-bold tracking-tight text-gray-900">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + (business.address ? ` ${business.address}` : ''))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-900 hover:text-primary hover:underline"
        >
          {business.name}
        </a>
      </h3>

      {/* Description */}
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600">
        {business.address || business.categories.slice(0, 2).join(', ') || 'No address'}
      </p>

      {/* Metrics row */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <ScoreBadge
            score={business.final_score}
            size="sm"
            noWebsite={!business.website}
            analyzed={Boolean(business.breakdown)}
          />
        </span>
        <div className="flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-gray-400" />
          {business.website ? 'Has website' : 'No website'}
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 text-gray-400" />
          {business.google_rating !== null ? (
            <>
              {business.google_rating.toFixed(1)} ({business.google_review_count ?? 0})
            </>
          ) : (
            "No rating"
          )}
        </div>
        
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex align-middle items-center justify-between gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="tabular-nums text-gray-600">
            {score !== null ? `${Math.round(progress)}%` : '—'}
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              progress <= 30 ? 'bg-red-500' : progress <= 60 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom row: See breakdown (left) + Contact (right) */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div>
          {business.breakdown ? (
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1 -mx-2 -my-1"
            >
              <ListChecks className="h-4 w-4" />
              {showBreakdown ? 'Hide breakdown' : 'See breakdown'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runAnalyze(onAnalyze, business.id, setAnalyzing)}
              disabled={analyzing}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1 -mx-2 -my-1 disabled:opacity-50"
            >
              <ListChecks className="h-4 w-4" />
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          )}
        </div>
        <Link
          href={contactPageHref}
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          Contact
        </Link>
      </div>

      {/* Mark checked (small, top-right) */}
      <button
        type="button"
        onClick={() => onToggleChecked(business.id, !business.checked)}
        aria-label={business.checked ? 'Mark as unchecked' : 'Mark as checked'}
        className={`absolute top-4 right-4 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
          business.checked
            ? 'bg-primary/20 text-gray-900'
            : ' text-gray-600 hover:bg-gray-200'
        }`}
      >
        {business.checked ? <CheckCircle className="h-4 w-4 text-gray-400" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
      </button>

      {/* Expandable breakdown */}
      {showBreakdown && business.breakdown && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <Breakdown data={business.breakdown} initialOpen />
        </div>
      )}
    </div>
  );
}
