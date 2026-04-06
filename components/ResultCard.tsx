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
  if (!business.website) {
    return {
      label: 'No website',
      className: 'border border-red-200 bg-red-50 text-red-800',
    };
  }
  if (business.breakdown && business.final_score !== null) {
    return {
      label: 'Analyzed',
      className: 'border border-primary/30 bg-primary/20 text-emerald-950',
    };
  }
  return {
    label: 'Not analyzed',
    className: 'border border-stone-200 bg-stone-100 text-gray-700',
  };
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
      className={`relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-lg shadow-black/5 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${
        business.checked ? 'ring-2 ring-primary/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
          {business.checked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-emerald-950">
              <CheckCircle className="h-3.5 w-3.5" weight="fill" aria-hidden />
              Checked
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleChecked(business.id, !business.checked)}
          aria-label={business.checked ? 'Mark as unchecked' : 'Mark as checked'}
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
            business.checked
              ? 'border-primary/35 bg-primary/15 text-emerald-950'
              : 'border-stone-200 bg-white text-gray-600 hover:border-primary/30 hover:bg-primary/10'
          }`}
        >
          {business.checked ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" aria-hidden />
              Done
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Mark
            </span>
          )}
        </button>
      </div>

      <h3 className="mt-4 text-xl font-bold tracking-tight text-emerald-950">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + (business.address ? ` ${business.address}` : ''))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-950 underline-offset-2 hover:text-primary hover:underline"
        >
          {business.name}
        </a>
      </h3>

      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600">
        {business.address || business.categories.slice(0, 2).join(', ') || 'No address'}
      </p>

      {business.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {business.categories.slice(0, 3).map((category) => (
            <span
              key={`${business.id}-${category}`}
              className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-gray-700">
        <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
          <ScoreBadge
            score={business.final_score}
            size="sm"
            noWebsite={!business.website}
            analyzed={Boolean(business.breakdown)}
          />
        </span>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium">
          <Globe className="h-4 w-4 text-gray-400" weight="duotone" />
          {business.website ? 'Has website' : 'No website'}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium">
          <Star className="h-4 w-4 text-gray-400" weight="duotone" />
          {business.google_rating !== null ? (
            <>
              {business.google_rating.toFixed(1)} ({business.google_review_count ?? 0})
            </>
          ) : (
            'No rating'
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-stone-200/80 bg-stone-50/80 p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
          <span>Analytics snapshot</span>
          <span className="tabular-nums text-gray-700">
            {score !== null ? `${Math.round(progress)}/100` : '—'}
          </span>
        </div>
        <p className="mb-2 text-xs text-gray-500">
          Quick read of this business profile quality.
        </p>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              progress <= 30 ? 'bg-red-500' : progress <= 60 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-4">
        <div>
          {business.breakdown ? (
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <ListChecks className="h-4 w-4" />
              {showBreakdown ? 'Hide breakdown' : 'See breakdown'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runAnalyze(onAnalyze, business.id, setAnalyzing)}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ListChecks className="h-4 w-4" />
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          )}
        </div>
        <Link
          href={contactPageHref}
          className="inline-flex items-center justify-center rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-950 focus:ring-offset-2"
        >
          Contact
        </Link>
      </div>

      {showBreakdown && business.breakdown && (
        <div className="mt-4">
          <Breakdown data={business.breakdown} showToggle={false} />
        </div>
      )}
    </div>
  );
}
