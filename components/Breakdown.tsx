'use client';

import { useState } from 'react';
import type { AnalysisBreakdown } from '@/lib/contracts';

interface BreakdownProps {
  data: AnalysisBreakdown;
  initialOpen?: boolean;
}

export default function Breakdown({ data, initialOpen = false }: BreakdownProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const weaknessNotes = data.weakness_notes ?? [];
  const noWebsite = weaknessNotes.includes('No website found');

  const hasAnyData =
    data.pagespeed_score !== null ||
    data.foursquare_score !== null ||
    Boolean(data.pagespeed) ||
    Boolean(data.website) ||
    Boolean(data.foursquare);

  if (!hasAnyData) {
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
          {typeof data.web_standards_score === 'number' && (
            <div className="pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">Website Standards</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {Math.round(data.web_standards_score)}/100
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={
                    data.web_standards_score <= 30
                      ? 'h-full bg-red-500'
                      : data.web_standards_score <= 60
                        ? 'h-full bg-yellow-500'
                        : data.web_standards_score <= 80
                          ? 'h-full bg-blue-500'
                          : 'h-full bg-primary'
                  }
                  style={{ width: `${Math.min(100, Math.max(0, data.web_standards_score))}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Based on Lighthouse categories (when available) + on-page standards checks.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">PageSpeed (mobile perf):</span>
              <span className="ml-2 font-medium">
                {data.pagespeed_score !== null
                  ? `${data.pagespeed_score}/100`
                  : noWebsite
                    ? 'No website'
                    : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Foursquare authority:</span>
              <span className="ml-2 font-medium">
                {data.foursquare_score !== null ? `${data.foursquare_score}/100` : 'N/A'}
              </span>
            </div>
          </div>

          {data.pagespeed ? (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">PageSpeed details</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>Mobile perf: {data.pagespeed.performance}/100</div>
                <div>
                  Desktop perf:{' '}
                  {data.pagespeed.desktopPerformance !== undefined
                    ? `${data.pagespeed.desktopPerformance}/100`
                    : 'N/A'}
                </div>
                <div>
                  Accessibility:{' '}
                  {data.pagespeed.accessibility !== undefined
                    ? `${data.pagespeed.accessibility}/100`
                    : 'N/A'}
                </div>
                <div>
                  SEO:{' '}
                  {data.pagespeed.seo !== undefined ? `${data.pagespeed.seo}/100` : 'N/A'}
                </div>
                <div>
                  Best practices:{' '}
                  {data.pagespeed.bestPractices !== undefined
                    ? `${data.pagespeed.bestPractices}/100`
                    : 'N/A'}
                </div>
                <div>Mobile-friendly: {data.pagespeed.mobileFriendly ? 'Yes' : 'No'}</div>
                <div>
                  LCP:{' '}
                  {data.pagespeed.coreWebVitals?.lcp !== undefined
                    ? `${Math.round(data.pagespeed.coreWebVitals.lcp)}ms`
                    : 'N/A'}
                </div>
                <div>
                  CLS:{' '}
                  {data.pagespeed.coreWebVitals?.cls !== undefined
                    ? data.pagespeed.coreWebVitals.cls
                    : 'N/A'}
                </div>
                <div>
                  INP:{' '}
                  {data.pagespeed.coreWebVitals?.inp !== undefined
                    ? `${Math.round(data.pagespeed.coreWebVitals.inp)}ms`
                    : 'N/A'}
                </div>
              </div>
            </div>
          ) : !noWebsite && data.website ? (
            <div className="pt-2 border-t border-gray-200 text-sm text-gray-700">
              PageSpeed data is unavailable. Usually this means `GOOGLE_API_KEY` isn’t set, the
              key has no access to the PageSpeed API, or you hit quota.
            </div>
          ) : null}

          {data.website && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Website checks</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>HTTPS: {data.website.hasHttps ? 'Yes' : 'No'}</div>
                <div>Title: {data.website.hasTitle ? 'Yes' : 'No'}</div>
                <div>Meta description: {data.website.hasMetaDescription ? 'Yes' : 'No'}</div>
                <div>H1: {data.website.hasH1 ? 'Yes' : 'No'}</div>
                <div>Schema: {data.website.hasSchema ? 'Yes' : 'No'}</div>
                <div>
                  LocalBusiness schema: {data.website.hasLocalBusinessSchema ? 'Yes' : 'No'}
                </div>
                <div>CTA text: {data.website.hasCTA ? 'Yes' : 'No'}</div>
                <div>Contact option: {data.website.hasContactForm ? 'Yes' : 'No'}</div>
                <div>Reviews/testimonials: {data.website.hasReviews ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {data.foursquare && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Foursquare details</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  Rating:{' '}
                  {typeof data.foursquare.rating === 'number'
                    ? `${data.foursquare.rating.toFixed(1)}/10`
                    : 'N/A'}
                </div>
                <div>
                  Popularity:{' '}
                  {typeof data.foursquare.popularity === 'number'
                    ? data.foursquare.popularity
                    : 'N/A'}
                </div>
                <div>
                  Match confidence:{' '}
                  {typeof data.foursquare.match_confidence === 'number'
                    ? data.foursquare.match_confidence.toFixed(2)
                    : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {data.final_score !== null && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Final Score (Median):</span>
              <span className="ml-2 font-semibold text-lg">{data.final_score}/100</span>
            </div>
          )}

          {weaknessNotes.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Weaknesses:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {weaknessNotes.map((note, idx) => (
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

