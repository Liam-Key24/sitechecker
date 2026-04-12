'use client';

import { useId, useState } from 'react';
import type { AnalysisStatusFilter, Business, ResultsFiltersState } from '../types';
import { formatLocationDisplay, isBusinessAnalyzed, resolveListingScore } from '../businessUtils';

export type ResultsOverviewFilterPatch =
  | { type: 'reset' }
  | { type: 'hasWebsite'; value: 'all' | 'yes' | 'no' }
  | { type: 'analysisStatus'; value: AnalysisStatusFilter }
  | { type: 'scoreExact'; value: number };

interface ResultsOverviewProps {
  businesses: Business[];
  location: string;
  activeFilters?: ResultsFiltersState;
  onApplyFilter?: (patch: ResultsOverviewFilterPatch) => void;
}

type Point = { x: number; y: number };

interface DialMetricProps {
  label: string;
  value: number | null;
  active?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function trendCoordinates(points: number[], width: number, height: number): Point[] {
  if (points.length === 0) return [];

  const xStep = width / Math.max(1, points.length - 1);
  const topPadding = 8;
  const drawableHeight = Math.max(1, height - topPadding - 8);

  return points.map((value, index) => {
    const x = index * xStep;
    const y = topPadding + (1 - Math.max(0, Math.min(100, value)) / 100) * drawableHeight;
    return { x, y };
  });
}

function smoothLinePath(coords: Point[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const current = coords[i];
    const next = coords[i + 1];
    const cx = ((current.x + next.x) / 2).toFixed(2);
    d += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${cx} ${((current.y + next.y) / 2).toFixed(2)}`;
  }
  const last = coords[coords.length - 1];
  d += ` T ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

function areaPath(coords: Point[], baseline: number): string {
  if (coords.length === 0) return '';
  const start = coords[0];
  const end = coords[coords.length - 1];
  const line = smoothLinePath(coords);
  return `${line} L ${end.x.toFixed(2)} ${baseline} L ${start.x.toFixed(2)} ${baseline} Z`;
}

/** Band edges align with vertical guide lines: [0, mid₀₁, mid₁₂, …, width]. */
function bandBoundaries(coords: Point[], chartWidth: number): number[] {
  const n = coords.length;
  if (n === 0) return [0, chartWidth];
  const b: number[] = [0];
  for (let i = 1; i < n; i += 1) {
    b.push((coords[i - 1].x + coords[i].x) / 2);
  }
  b.push(chartWidth);
  return b;
}

function bandRange(boundaries: number[], index: number): { start: number; width: number } {
  const start = boundaries[index] ?? 0;
  const end = boundaries[index + 1] ?? start;
  return { start, width: Math.max(0, end - start) };
}


function parseExactScoreFilter(filters?: ResultsFiltersState): number | null {
  if (!filters || filters.scoreMin === '' || filters.scoreMax === '') return null;
  const min = Number.parseInt(filters.scoreMin, 10);
  const max = Number.parseInt(filters.scoreMax, 10);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return min === max ? min : null;
}

function countSitesAtScore(businesses: Business[], score: number): number {
  return businesses.filter((b) => resolveListingScore(b) === score).length;
}

function DialMetric({
  label,
  value,
  active = false,
  onClick,
  ariaLabel,
}: DialMetricProps) {
  const normalized = value === null ? 0 : Math.max(0, Math.min(100, value));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeLength = (normalized / 100) * circumference;
  const toneClass = 'stroke-primary';
  const valueLabel = value === null ? '—' : `${Math.round(value)}`;

  const frameClass = `flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
    active
      ? 'border-primary/50 bg-primary/10 shadow-sm'
      : 'border-stone-200 bg-white hover:border-primary/35 hover:bg-primary/5'
  }`;

  const content = (
    <>
      <div className="relative mx-auto h-24 w-24 shrink-0 sm:h-28 sm:w-28 xl:h-32 xl:w-32">
        <svg viewBox="0 0 84 84" className="h-full w-full" aria-hidden>
          <circle cx="42" cy="42" r={radius} className="fill-none stroke-stone-200" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r={radius}
            className={`fill-none ${toneClass}`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${strokeLength} ${circumference}`}
            transform="rotate(-90 42 42)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums leading-none text-emerald-950 xl:text-4xl">{valueLabel}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 xl:text-sm">{label}</p>
    </>
  );

  if (!onClick) {
    return <div className={frameClass}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className={`${frameClass} focus:outline-none focus:ring-2 focus:ring-primary/30`}
    >
      {content}
    </button>
  );
}

export default function ResultsOverview({
  businesses,
  location,
  activeFilters,
  onApplyFilter,
}: ResultsOverviewProps) {
  const chartIdBase = useId().replace(/:/g, '');
  const [bandTooltip, setBandTooltip] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  if (businesses.length === 0) return null;

  const apply = onApplyFilter ?? (() => {});

  const scores = businesses
    .map(resolveListingScore)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  const hasScoreData = scores.length > 0;

  const avgWeb = averageOf(scores);
  const pagespeedValues = businesses
    .map((b) => b.breakdown?.pagespeed_score)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  const avgPs = averageOf(pagespeedValues);

  const total = businesses.length;
  const noWebsite = businesses.filter((b) => !b.website).length;
  const withWebsite = total - noWebsite;
  const analyzed = businesses.filter(isBusinessAnalyzed).length;

  const websitePct = Math.round((withWebsite / total) * 100);
  const analyzedPct = Math.round((analyzed / total) * 100);

  const sortedScores = [...scores].sort((a, b) => a - b);
  const sparklineWidth = 480;
  const sparklineHeight = 220;
  const sparklineBaseline = sparklineHeight - 4;
  const sparklineCoords = trendCoordinates(sortedScores, sparklineWidth, sparklineHeight);
  const sparklinePath = smoothLinePath(sparklineCoords);
  const sparklineArea = areaPath(sparklineCoords, sparklineBaseline);
  const boundaries = bandBoundaries(sparklineCoords, sparklineWidth);
  const locationLabel = formatLocationDisplay(location);

  const f = activeFilters;
  const websiteYesActive = f?.hasWebsite === 'yes';
  const analyzedActive = f?.analysisStatus === 'analyzed';
  const exactScoreFilter = parseExactScoreFilter(f);
  const selectedIndices =
    exactScoreFilter === null
      ? []
      : sortedScores.reduce<number[]>((acc, score, index) => {
          if (score === exactScoreFilter) acc.push(index);
          return acc;
        }, []);
  return (
    <section className="mb-4 rounded-2xl border border-stone-200/90 bg-stone-50/80 p-4 shadow-lg shadow-black/5 sm:p-5">
      <div className="mb-4 flex justify-start">
        <p className="max-w-full truncate text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
          {locationLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
        <article className="flex min-h-0 flex-col rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 xl:col-span-7 xl:h-full">
          <div className="shrink-0">
            <h3 className="text-[1.35rem] font-bold leading-tight tracking-tight text-emerald-950 sm:text-xl">
              Freshness trend
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Sorted-score trend with a lighter overlay. Click a band between the guides to load profiles at that
              score.
            </p>
          </div>

          {hasScoreData ? (
            <>
              <div className="relative mt-4 flex min-h-70 flex-1 flex-col rounded-2xl border border-stone-100 bg-white p-3 shadow-sm sm:min-h-80 xl:min-h-0">
                <svg
                  viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
                  className="h-full min-h-65 w-full flex-1"
                  role="img"
                  aria-label="Freshness trend sorted score line chart; vertical guides mark selection bands"
                >
                  <defs>
                    <linearGradient id={`${chartIdBase}-freshness-trend-fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(169, 215, 106, 0.30)" />
                      <stop offset="100%" stopColor="rgba(169, 215, 106, 0.04)" />
                    </linearGradient>
                    {selectedIndices.map((index) => {
                      const range = bandRange(boundaries, index);
                      return (
                        <clipPath key={`freshness-clip-${index}`} id={`${chartIdBase}-freshness-sel-${index}`}>
                          <rect x={range.start} y="0" width={range.width} height={sparklineHeight} />
                        </clipPath>
                      );
                    })}
                  </defs>
                  <path d={sparklineArea} fill={`url(#${chartIdBase}-freshness-trend-fill)`} />
                  {selectedIndices.map((index) => (
                    <path
                      key={`freshness-selected-area-${index}`}
                      d={sparklineArea}
                      fill="rgba(169, 215, 106, 0.22)"
                      clipPath={`url(#${chartIdBase}-freshness-sel-${index})`}
                    />
                  ))}
                  {boundaries.slice(1, -1).map((bx, i) => (
                    <line
                      key={`freshness-guide-${i}`}
                      x1={bx}
                      y1="0"
                      x2={bx}
                      y2={sparklineBaseline}
                      stroke="rgba(17, 24, 39, 0.09)"
                      strokeWidth="1"
                      strokeDasharray="2 8"
                    />
                  ))}
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke="rgba(169, 215, 106, 0.72)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {selectedIndices.map((index) => (
                    <path
                      key={`freshness-line-sel-${index}`}
                      d={sparklinePath}
                      fill="none"
                      stroke="rgba(169, 215, 106, 0.96)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      clipPath={`url(#${chartIdBase}-freshness-sel-${index})`}
                    />
                  ))}
                  {sortedScores.map((score, index) => {
                    const range = bandRange(boundaries, index);
                    return (
                      <g
                        key={`freshness-band-${index}-${score}`}
                        onClick={() => apply({ type: 'scoreExact', value: score })}
                        onMouseEnter={(e) => {
                          setBandTooltip({
                            index,
                            clientX: e.clientX,
                            clientY: e.clientY,
                          });
                        }}
                        onMouseMove={(e) => {
                          setBandTooltip({
                            index,
                            clientX: e.clientX,
                            clientY: e.clientY,
                          });
                        }}
                        onMouseLeave={() => setBandTooltip(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={range.start}
                          y="0"
                          width={range.width}
                          height={sparklineHeight}
                          fill="transparent"
                        />
                        <title>{`Score ${score}`}</title>
                      </g>
                    );
                  })}
                </svg>
                {bandTooltip !== null && (
                  <div
                    className="pointer-events-none fixed z-100 w-max max-w-[16rem] rounded-xl border border-stone-200/90 bg-white px-3 py-2.5 text-left shadow-lg shadow-black/10"
                    style={{
                      left: (() => {
                        const pad = 14;
                        const approxW = 260;
                        const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
                        return Math.max(8, Math.min(bandTooltip.clientX + pad, vw - approxW - 16));
                      })(),
                      top: bandTooltip.clientY + 14,
                    }}
                    role="tooltip"
                  >
                    {(() => {
                      const score = sortedScores[bandTooltip.index];
                      const n = countSitesAtScore(businesses, score);
                      return (
                        <>
                          <p className="text-md font-semibold text-emerald-950">
                            {n} {n === 1 ? 'site' : 'sites'} 
                          </p>
                          <p className="text-lg font-bold text-emerald-950">{score}/100</p>
                          <p className="mt-1 text-xs font-semibold text-primary">Click to see </p>
                        </>
                      );
                    })()}
                  </div>
                )}
                <div
                  className="mt-2 flex w-full justify-between gap-0.5 text-[10px] font-medium tabular-nums text-gray-500 sm:text-xs"
                  aria-hidden
                >
                </div>
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-gray-500">
              No scores yet. Analyze listings to generate the freshness trend.
            </p>
          )}
        </article>

        <article className="flex min-h-0 flex-col rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 xl:col-span-5 xl:h-full">
          <h3 className="shrink-0 text-lg font-bold tracking-tight text-emerald-950 sm:text-xl">
            Performance snapshot
          </h3>

          <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 grid-rows-4 gap-3 sm:grid-cols-2 sm:grid-rows-2 sm:gap-4">
            <DialMetric label="Web standards" value={avgWeb} />
            <DialMetric label="PageSpeed" value={avgPs} />
            <DialMetric
              label="Website coverage"
              value={websitePct}
              active={websiteYesActive}
              onClick={() => apply({ type: 'hasWebsite', value: 'yes' })}
              ariaLabel="Filter to listings with a website"
            />
            <DialMetric
              label="Analysis completion"
              value={analyzedPct}
              active={analyzedActive}
              onClick={() => apply({ type: 'analysisStatus', value: 'analyzed' })}
              ariaLabel="Filter to analyzed listings"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
