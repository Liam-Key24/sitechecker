'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Business, ResultsFiltersState } from './types';
import ResultsLoading from './components/ResultsLoading';
import ResultsOverview from './components/ResultsOverview';
import ResultsHeader from './components/ResultsHeader';
import ResultsGrid from './components/ResultsGrid';
import { clampSearchLimitFromString, MAX_AUTO_ANALYZE_ON_LOAD } from '@/lib/searchLimits';

const DEFAULT_FILTERS: ResultsFiltersState = {
  scoreMin: '',
  scoreMax: '',
  hasWebsite: 'all',
  checked: 'all',
};

export type ResultsClientProps = {
  location: string;
  category: string;
  keywords: string;
  /** Normalized limit string (e.g. "20") from the URL */
  limit: string;
};

export default function ResultsClient({
  location,
  category,
  keywords,
  limit,
}: ResultsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(() => Boolean(location));
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [filters, setFilters] = useState<ResultsFiltersState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [columnCount, setColumnCount] = useState<2 | 4>(2);
  const [sortBy, setSortBy] = useState<'default' | 'score-desc' | 'score-asc' | 'name'>('default');

  const pageSize = clampSearchLimitFromString(limit, 20);
  const [displayCount, setDisplayCount] = useState(pageSize);

  const handleAnalyze = useCallback(async (id: string, options?: { force?: boolean }) => {
    try {
      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: id, force: options?.force }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data && typeof data === 'object' && 'error' in data
            ? String((data as { error?: unknown }).error)
            : 'Failed to analyze';
        alert(`Error: ${message}`);
        return;
      }

      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                final_score: data?.final_score ?? b.final_score,
                breakdown: data?.breakdown ?? b.breakdown,
              }
            : b
        )
      );
    } catch (error) {
      console.error('Error analyzing website:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Failed to analyze website'}`
      );
    }
  }, []);

  const needsAnalysis = useCallback((b: Business) => {
    if (!b.breakdown) return b.final_score === null;
    const d = b.breakdown;
    if (typeof d.final_score === 'number') return false;
    if (d.pagespeed_score != null && d.web_standards_score != null) return false;
    if (
      d.pagespeed !== undefined &&
      d.website !== undefined &&
      d.web_standards_score !== undefined
    ) {
      return false;
    }
    return true;
  }, []);

  const handleAnalyzeRef = useRef(handleAnalyze);
  handleAnalyzeRef.current = handleAnalyze;
  const needsAnalysisRef = useRef(needsAnalysis);
  needsAnalysisRef.current = needsAnalysis;
  /** Bumps on each search effect run so aborted/outdated fetches do not leave loading stuck or overwrite newer data. */
  const searchFetchGenRef = useRef(0);

  // Clear loading before paint when there is nothing to fetch (avoids a loading flash on /results).
  useLayoutEffect(() => {
    if (!location) {
      setLoading(false);
      setBusinesses([]);
      setUsingMockData(false);
    }
  }, [location]);

  useEffect(() => {
    if (!location) {
      return;
    }

    const ac = new AbortController();
    const gen = ++searchFetchGenRef.current;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          location,
          limit,
          ...(category && { category }),
          ...(keywords && { keywords }),
        });
        const url = `/api/search?${params.toString()}`;
        const response = await fetch(url, { signal: ac.signal });
        const bodyText = await response.text();

        let data: { businesses?: Business[]; error?: string; code?: string; mock?: boolean };
        try {
          data = JSON.parse(bodyText) as {
            businesses?: Business[];
            error?: string;
            code?: string;
            mock?: boolean;
          };
        } catch {
          if (gen !== searchFetchGenRef.current) return;
          const msg =
            response.status >= 500
              ? 'Server error. Please try again later.'
              : 'Something went wrong. Please try again.';
          alert(msg);
          setBusinesses([]);
          setUsingMockData(false);
          return;
        }

        if (!response.ok) {
          if (gen !== searchFetchGenRef.current) return;
          console.error('API Error:', data);
          const code =
            data && typeof data === 'object' && 'code' in data
              ? String((data as { code?: unknown }).code)
              : '';
          const detail = data?.error ?? 'Failed to fetch results';
          if (response.status === 503 && code === 'MISSING_GOOGLE_KEY') {
            alert(
              `Search is not configured: ${detail}\n\nAdd GOOGLE_API_KEY (Places + billing enabled) to .env.local and restart the dev server.`
            );
          } else if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            if (code === 'UPSTREAM_BUDGET_EXCEEDED') {
              alert(
                `Safety cap reached for external API spend. ${retryAfter ? `Please retry in about ${retryAfter}s.` : 'Please wait a moment and try again.'}`
              );
            } else {
              alert(
                `Too many requests right now. ${retryAfter ? `Please retry in about ${retryAfter}s.` : 'Please wait a moment and try again.'}`
              );
            }
          } else {
            alert(`Error: ${detail}`);
          }
          setBusinesses([]);
          setUsingMockData(false);
          return;
        }

        if (gen !== searchFetchGenRef.current) return;

        const fetchedBusinesses: Business[] = Array.isArray(data.businesses)
          ? data.businesses
          : [];
        setBusinesses(fetchedBusinesses);
        setUsingMockData(Boolean(data.mock));
        const initialVisible = clampSearchLimitFromString(limit, 20);
        setDisplayCount(
          fetchedBusinesses.length > 0 ? fetchedBusinesses.length : initialVisible
        );

        if (fetchedBusinesses.length === 0) {
          console.warn('No businesses returned from API');
        } else {
          const na = needsAnalysisRef.current;
          const needsList = fetchedBusinesses.filter((b) => na(b));
          const toAnalyze = needsList.slice(0, MAX_AUTO_ANALYZE_ON_LOAD);
          if (toAnalyze.length > 0) {
            const skipped = needsList.length - toAnalyze.length;
            console.log(
              `Auto-analyzing ${toAnalyze.length} business(es)${skipped > 0 ? ` (${skipped} more skipped; use Analyze on a card or Analyze all)` : ''}...`
            );
            const runAnalyze = handleAnalyzeRef.current;
            (async () => {
              for (const business of toAnalyze) {
                if (ac.signal.aborted) break;
                try {
                  await runAnalyze(business.id);
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                } catch (error) {
                  console.error(`Error auto-analyzing business ${business.id}:`, error);
                }
              }
            })();
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (gen !== searchFetchGenRef.current) return;
        console.error('Error fetching results:', error);
        alert(
          `Error: ${error instanceof Error ? error.message : 'Failed to fetch results'}`
        );
        setBusinesses([]);
        setUsingMockData(false);
      } finally {
        if (gen === searchFetchGenRef.current) setLoading(false);
      }
    };

    fetchResults();
    return () => ac.abort();
  }, [location, category, keywords, limit]);

  const handleToggleChecked = useCallback(async (id: string, checked: boolean) => {
    try {
      const response = await fetch('/api/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: id, checked }),
      });
      if (response.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, checked } : b))
        );
      }
    } catch (error) {
      console.error('Error updating checked status:', error);
    }
  }, []);

  const handleAnalyzeAll = useCallback(async () => {
    setAnalyzingAll(true);
    for (const business of businesses) {
      await handleAnalyze(business.id, { force: true });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setAnalyzingAll(false);
  }, [businesses, handleAnalyze]);

  const getFilteredBusinesses = useCallback(() => {
    return businesses.filter((b) => {
      if (filters.hasWebsite === 'yes' && !b.website) return false;
      if (filters.hasWebsite === 'no' && b.website) return false;
      if (filters.checked === 'checked' && !b.checked) return false;
      if (filters.checked === 'unchecked' && b.checked) return false;
      if (
        filters.scoreMin &&
        (b.final_score === null || b.final_score < parseInt(filters.scoreMin, 10))
      )
        return false;
      if (
        filters.scoreMax &&
        (b.final_score === null || b.final_score > parseInt(filters.scoreMax, 10))
      )
        return false;
      return true;
    });
  }, [businesses, filters]);

  const handleLimitChange = useCallback(
    (newLimit: string) => {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (category) params.set('category', category);
      if (keywords) params.set('keywords', keywords);
      params.set('limit', String(clampSearchLimitFromString(newLimit, 20)));
      router.replace(`/results?${params.toString()}`);
    },
    [router, location, category, keywords]
  );

  const handleExportCSV = useCallback(() => {
    const filtered = getFilteredBusinesses();
    const headers = [
      'Name',
      'Website',
      'Address',
      'Phone',
      'Category',
      'Score',
      'Weakness Notes',
    ];
    const rows = filtered.map((b) => [
      b.name,
      b.website || 'No website',
      b.address || '',
      b.phone || '',
      b.categories.join(', '),
      b.final_score !== null ? b.final_score.toString() : 'Not analyzed',
      b.breakdown?.weakness_notes?.join('; ') || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getFilteredBusinesses]);

  const filteredBusinesses = useMemo(() => {
    const list = getFilteredBusinesses();
    if (sortBy === 'default') return list;
    const sorted = [...list];
    if (sortBy === 'score-desc') {
      sorted.sort((a, b) => (b.final_score ?? -1) - (a.final_score ?? -1));
    } else if (sortBy === 'score-asc') {
      sorted.sort((a, b) => (a.final_score ?? -1) - (b.final_score ?? -1));
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [getFilteredBusinesses, sortBy]);

  const visibleBusinesses = useMemo(
    () => filteredBusinesses.slice(0, displayCount),
    [filteredBusinesses, displayCount]
  );
  const hasMore = displayCount < filteredBusinesses.length;
  const remaining = filteredBusinesses.length - displayCount;

  useEffect(() => {
    setDisplayCount(1000);
  }, [filters, sortBy]);

  if (loading) {
    return <ResultsLoading />;
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-[55vh] w-[min(112rem,calc(100%-1.5rem))] flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-emerald-950">No search location</h1>
          <p className="mt-3 max-w-md text-gray-600">
            Add a place to search from the search page, or open a results link that includes a{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">location</code> query
            parameter.
          </p>
          <button
            type="button"
            onClick={() => router.push('/search')}
            className="mt-8 rounded-full bg-primary px-8 py-3 font-semibold text-emerald-950 shadow-sm transition hover:brightness-95"
          >
            Go to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[min(112rem,calc(100%-1.5rem))] px-3 py-8 sm:px-5 md:py-10">
        <ResultsOverview businesses={businesses} />
        <ResultsHeader
          location={location}
          totalCount={businesses.length}
          limit={limit}
          analyzingAll={analyzingAll}
          showFilters={showFilters}
          columnCount={columnCount}
          sortBy={sortBy}
          onBack={() => router.push('/')}
          onReloadAll={handleAnalyzeAll}
          onExportCSV={handleExportCSV}
          onLimitChange={handleLimitChange}
          onToggleFilters={() => setShowFilters((v) => !v)}
          onColumnCountChange={setColumnCount}
          onSortChange={setSortBy}
          filters={filters}
          onFiltersChange={setFilters}
        />
        {usingMockData && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <span className="font-semibold">Mock mode:</span> results are sample businesses for UI
            preview only.
          </div>
        )}
        <ResultsGrid
          businesses={visibleBusinesses}
          totalCount={filteredBusinesses.length}
          columnCount={columnCount}
          onToggleChecked={handleToggleChecked}
          onAnalyze={handleAnalyze}
          resultsLocation={location || null}
        />
        {filteredBusinesses.length > 0 && (
          <div className="mt-10 flex flex-col items-center gap-2 pb-8">
            <button
              type="button"
              onClick={() => hasMore && setDisplayCount((n) => n + pageSize)}
              disabled={!hasMore}
              aria-label={hasMore ? `Show more results (${Math.min(remaining, pageSize)} more)` : 'Showing all results'}
              className="rounded-full border border-primary/35 bg-primary/10 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-primary/10"
            >
              {hasMore ? (
                <>
                  Show more results
                  <span className="ml-2 text-primary">
                    (+{Math.min(remaining, pageSize)})
                  </span>
                </>
              ) : (
                <>Showing all {filteredBusinesses.length} results</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
