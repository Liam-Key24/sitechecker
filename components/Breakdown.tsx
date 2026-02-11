'use client';

import { useState } from 'react';
import { Monitor, DeviceMobile, Globe, CaretDown, CaretUp } from 'phosphor-react';
import type { AnalysisBreakdown } from '@/lib/contracts';

const SEGMENTS = 10;

function ScoreCard({
  icon: Icon,
  title,
  score,
  subtext,
}: {
  icon: React.ElementType;
  title: string;
  score: number;
  subtext?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const filled = Math.round((clamped / 100) * SEGMENTS);
  return (
    <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" weight="duotone" />
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{clamped}</p>
      {subtext && (
        <p className="mt-0.5 text-xs text-gray-500">{subtext}</p>
      )}
      <div className="mt-3 flex gap-0.5" aria-hidden>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-colors ${
              i < filled ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

interface BreakdownProps {
  data: AnalysisBreakdown;
  initialOpen?: boolean;
}

export default function Breakdown({ data, initialOpen = false }: BreakdownProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const weaknessNotes = data.weakness_notes ?? [];
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

  if (!hasAnyScore && !hasWeaknesses && noWebsite) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
      >
        {isOpen ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
        {isOpen ? 'Hide' : 'Show'} score breakdown
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-3 space-y-4">
            {(hasDesktop || hasMobile || hasWebStandards) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hasDesktop && (
                  <ScoreCard
                    icon={Monitor}
                    title="Web desktop"
                    score={desktopScore!}
                    subtext="Performance score"
                  />
                )}
                {hasMobile && (
                  <ScoreCard
                    icon={DeviceMobile}
                    title="Mobile"
                    score={mobileScore!}
                    subtext="Performance score"
                  />
                )}
                {hasWebStandards && (
                  <ScoreCard
                    icon={Globe}
                    title="Web standards"
                    score={data.web_standards_score as number}
                    subtext="On-page checks"
                  />
                )}
              </div>
            )}

            {hasWeaknesses && (
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 p-4">
                <p className="text-sm font-medium text-gray-700">Weaknesses</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {weaknessNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {noWebsite && !hasAnyScore && (
              <p className="text-sm text-gray-500">No website — scores not available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
