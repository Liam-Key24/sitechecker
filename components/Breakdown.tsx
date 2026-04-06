'use client';

import { useState } from 'react';
import { Monitor, DeviceMobile, Globe, CaretDown, CaretUp } from 'phosphor-react';
import type { AnalysisBreakdown } from '@/lib/contracts';

function ScoreCard({
  icon: Icon,
  title,
  score,
  badgeLabel,
  badgeClassName,
}: {
  icon: React.ElementType;
  title: string;
  score: number;
  badgeLabel?: string;
  badgeClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-emerald-950">
          <Icon className="h-4.5 w-4.5" weight="duotone" />
        </div>
        <span className="text-sm font-semibold text-emerald-950">{title}</span>
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums leading-none text-emerald-950">
        {clamped}
        <span className="ml-1 text-xl font-semibold text-gray-500">/100</span>
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-600">
          <p className="text-sm text-gray-500">Score</p>
        </div>
        {badgeLabel && (
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClassName ?? ''}`}
          >
            {badgeLabel}
          </span>
        )}
      </div>
    </div>
  );
}

interface BreakdownProps {
  data: AnalysisBreakdown;
  initialOpen?: boolean;
  showToggle?: boolean;
}

function scoreStrengthLabel(score: number): string {
  if (score >= 81) return 'Strong';
  if (score >= 61) return 'Healthy';
  if (score >= 41) return 'Needs work';
  return 'Critical';
}

function scoreStrengthClass(score: number): string {
  if (score >= 81) return 'bg-primary/35 text-emerald-950';
  if (score >= 61) return 'bg-primary/25 text-emerald-950';
  if (score >= 41) return 'bg-amber-100 text-amber-900';
  return 'bg-red-100 text-red-800';
}

type IssueBucket = 'performance' | 'seo' | 'ux' | 'content' | 'other';

function classifyIssue(note: string): IssueBucket {
  const n = note.toLowerCase();
  if (
    n.includes('pagespeed') ||
    n.includes('lcp') ||
    n.includes('cls') ||
    n.includes('inp') ||
    n.includes('performance') ||
    n.includes('mobile-friendly')
  ) {
    return 'performance';
  }
  if (
    n.includes('schema') ||
    n.includes('canonical') ||
    n.includes('meta') ||
    n.includes('title') ||
    n.includes('h1') ||
    n.includes('seo')
  ) {
    return 'seo';
  }
  if (n.includes('cta') || n.includes('contact form') || n.includes('viewport')) {
    return 'ux';
  }
  if (n.includes('review') || n.includes('testimonial') || n.includes('twitter') || n.includes('open graph')) {
    return 'content';
  }
  return 'other';
}

function getSeverity(note: string): 'high' | 'medium' | 'low' {
  const n = note.toLowerCase();
  if (
    n.includes('no website') ||
    n.includes('poor lcp') ||
    n.includes('high cls') ||
    n.includes('poor inp') ||
    n.includes('low pagespeed') ||
    n.includes('not mobile-friendly')
  ) {
    return 'high';
  }
  if (
    n.includes('missing viewport') ||
    n.includes('missing canonical') ||
    n.includes('no schema') ||
    n.includes('no clear call-to-action') ||
    n.includes('no meta description') ||
    n.includes('no h1')
  ) {
    return 'medium';
  }
  return 'low';
}

export default function Breakdown({
  data,
  initialOpen = false,
  showToggle = true,
}: BreakdownProps) {
  const [isOpen, setIsOpen] = useState(showToggle ? initialOpen : true);
  const weaknessNotes = (data.weakness_notes ?? []).filter(
    (n) => typeof n === 'string' && !/foursquare/i.test(n)
  );
  const noWebsite = weaknessNotes.includes('No website found');

  const desktopScore =
    data.pagespeed?.desktopPerformance !== undefined &&
    typeof data.pagespeed.desktopPerformance === 'number'
      ? data.pagespeed.desktopPerformance
      : null;
  const mobileScore =
    data.pagespeed?.performance !== undefined && typeof data.pagespeed.performance === 'number'
      ? data.pagespeed.performance
      : data.pagespeed_score !== null
        ? data.pagespeed_score
        : null;

  const hasDesktop = desktopScore !== null;
  const hasMobile = mobileScore !== null;
  const hasWebStandards =
    typeof data.web_standards_score === 'number' && data.web_standards_score !== null;
  const hasWeaknesses = weaknessNotes.length > 0;
  const hasAnyScore = hasDesktop || hasMobile || hasWebStandards;
  const issueCountsByBucket = weaknessNotes.reduce<Record<IssueBucket, number>>(
    (acc, note) => {
      acc[classifyIssue(note)] += 1;
      return acc;
    },
    { performance: 0, seo: 0, ux: 0, content: 0, other: 0 }
  );
  const severityCounts = weaknessNotes.reduce(
    (acc, note) => {
      acc[getSeverity(note)] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
  const topBuckets = (Object.entries(issueCountsByBucket) as Array<[IssueBucket, number]>)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const bucketLabel: Record<IssueBucket, string> = {
    performance: 'Performance',
    seo: 'SEO',
    ux: 'UX',
    content: 'Content',
    other: 'Other',
  };

  if (!hasAnyScore && !hasWeaknesses && noWebsite) {
    return null;
  }

  return (
    <div>
      {showToggle && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {isOpen ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
          {isOpen ? 'Hide breakdown' : 'Show breakdown'}
        </button>
      )}

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-3 space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 sm:p-5">
            {(hasDesktop || hasMobile || hasWebStandards) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {hasDesktop && (
                  <ScoreCard
                    icon={Monitor}
                    title="Web desktop"
                    score={desktopScore}
                    badgeLabel={scoreStrengthLabel(desktopScore)}
                    badgeClassName={scoreStrengthClass(desktopScore)}
                  />
                )}
                {hasMobile && (
                  <ScoreCard
                    icon={DeviceMobile}
                    title="Mobile"
                    score={mobileScore}
                    badgeLabel={scoreStrengthLabel(mobileScore)}
                    badgeClassName={scoreStrengthClass(mobileScore)}
                  />
                )}
                {hasWebStandards && (
                  <ScoreCard
                    icon={Globe}
                    title="Web standards"
                    score={data.web_standards_score as number}
                    badgeLabel={scoreStrengthLabel(data.web_standards_score as number)}
                    badgeClassName={scoreStrengthClass(data.web_standards_score as number)}
                  />
                )}
              </div>
            )}

            {hasWeaknesses && (
              <div className="rounded-xl border border-stone-200/90 bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-emerald-950">Issue breakdown</p>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {weaknessNotes.length} total
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">High severity</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-red-700">{severityCounts.high}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Medium severity</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-amber-700">{severityCounts.medium}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Low severity</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-700">{severityCounts.low}</p>
                  </div>
                </div>

                {topBuckets.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {topBuckets.map(([bucket, count]) => (
                      <span
                        key={bucket}
                        className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {bucketLabel[bucket]}: {count}
                      </span>
                    ))}
                  </div>
                )}

                {weaknessNotes.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {weaknessNotes.map((note, idx) => (
                      <div
                        key={`${idx}-${note}`}
                        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {noWebsite && !hasAnyScore && (
              <p className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-gray-600">
                No website, so performance scores are not available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
