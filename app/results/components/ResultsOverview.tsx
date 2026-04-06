'use client';

import type { Business } from '../types';

interface ResultsOverviewProps {
  businesses: Business[];
}

function averageScore(businesses: Business[]): number | null {
  const scores = businesses
    .map((b) =>
      typeof b.final_score === 'number'
        ? b.final_score
        : typeof b.breakdown?.web_standards_score === 'number'
          ? b.breakdown.web_standards_score
          : null
    )
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length);
}

function trendPoints(businesses: Business[]): number[] {
  const scores = businesses
    .map((b) =>
      typeof b.final_score === 'number'
        ? b.final_score
        : typeof b.breakdown?.web_standards_score === 'number'
          ? b.breakdown.web_standards_score
          : null
    )
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (scores.length === 0) return [45, 48, 46, 53, 50, 55, 57];

  const buckets = 7;
  const chunk = Math.max(1, Math.ceil(scores.length / buckets));
  const points: number[] = [];
  for (let i = 0; i < scores.length; i += chunk) {
    const slice = scores.slice(i, i + chunk);
    const avg = Math.round(slice.reduce((sum, n) => sum + n, 0) / slice.length);
    points.push(avg);
  }

  while (points.length < buckets) {
    points.push(points[points.length - 1] ?? 50);
  }
  return points.slice(0, buckets);
}

type Point = { x: number; y: number };

function pointCoordinates(points: number[], width: number, height: number): Point[] {
  const max = 100;
  const min = 0;
  const span = Math.max(1, max - min);
  const xStep = width / Math.max(1, points.length - 1);

  return points.map((p, i) => {
    const x = i * xStep;
    const y = height - ((p - min) / span) * height;
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

function areaPath(coords: Point[], chartHeight: number): string {
  if (coords.length === 0) return '';
  const start = coords[0];
  const end = coords[coords.length - 1];
  const line = smoothLinePath(coords);
  return `${line} L ${end.x.toFixed(2)} ${chartHeight} L ${start.x.toFixed(2)} ${chartHeight} Z`;
}

function statusLabel(avg: number | null): string {
  if (avg === null) return 'No score data';
  if (avg >= 81) return 'Strong';
  if (avg >= 61) return 'Healthy';
  if (avg >= 41) return 'Needs work';
  return 'Critical';
}

export default function ResultsOverview({ businesses }: ResultsOverviewProps) {
  if (businesses.length === 0) return null;

  const total = businesses.length;
  const noWebsite = businesses.filter((b) => !b.website).length;
  const withWebsite = total - noWebsite;
  const analyzed = businesses.filter((b) => b.breakdown || typeof b.final_score === 'number').length;
  const avg = averageScore(businesses);
  const points = trendPoints(businesses);
  const chartWidth = 280;
  const chartHeight = 70;
  const coords = pointCoordinates(points, chartWidth, 60);
  const line = smoothLinePath(coords);
  const area = areaPath(coords, chartHeight);
  const last = coords[coords.length - 1] ?? { x: chartWidth, y: 35 };

  const websiteCoverage = Math.round((withWebsite / total) * 100);
  const analyzedRate = Math.round((analyzed / total) * 100);
  const withWebsiteCount = total - noWebsite;

  return (
    <section className="mb-4 rounded-2xl border border-stone-200/90 bg-stone-50/80 p-4 shadow-lg shadow-black/5 sm:p-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-3xl border border-stone-200/90 bg-white p-5 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[2rem] leading-none font-bold tracking-tight text-emerald-950">
              Freshness trend
            </h3>
            {avg !== null && (
              <span className="rounded-2xl bg-primary px-4 py-2 text-[2rem] leading-none font-bold text-emerald-950">
                Avg. {avg}
              </span>
            )}
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-32 w-full" aria-hidden>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(169, 215, 106, 0.35)" />
                <stop offset="100%" stopColor="rgba(169, 215, 106, 0.02)" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1={chartHeight - 1}
              x2={chartWidth}
              y2={chartHeight - 1}
              stroke="rgba(17, 24, 39, 0.12)"
              strokeWidth="1"
            />
            <path d={area} fill="url(#trend-fill)" />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-950"
            />
            <circle cx={last.x} cy={last.y} r="4.5" fill="currentColor" className="text-emerald-950" />
            <circle cx={last.x} cy={last.y} r="7.5" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
          </svg>
          <div className="mt-2 flex justify-between px-1 text-3xl font-medium text-gray-500">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200/90 bg-white p-5 xl:col-span-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-4xl font-bold tracking-tight text-emerald-950">Web standards</h3>
            <span className="rounded-full bg-primary/25 px-4 py-2 text-xl font-semibold text-emerald-950">
              {statusLabel(avg)}
            </span>
          </div>
          <p className="mt-6 text-7xl font-bold tabular-nums leading-none text-emerald-950">
            {avg ?? '—'}
          </p>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-4xl font-medium text-gray-500">Score</p>
            <p className="text-4xl font-medium tabular-nums text-gray-500">100</p>
          </div>
          <div className="mt-4 h-4 rounded-full bg-stone-200 p-0.5">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, avg ?? 0))}%` }}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200/90 bg-white p-5 xl:col-span-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Coverage snapshot</h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">No website</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950">{noWebsite}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">With website</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950">{withWebsiteCount}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Analyzed</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950">{analyzed}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-medium text-gray-700">
              Website coverage: {websiteCoverage}%
            </div>
            <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-medium text-gray-700">
              Analysis rate: {analyzedRate}%
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
