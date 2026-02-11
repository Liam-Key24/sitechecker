'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Business, ResultsFiltersState } from './types';
import ResultsLoading from './components/ResultsLoading';
import ResultsHeader from './components/ResultsHeader';
import ResultsFilters from './components/ResultsFilters';
import ResultsGrid from './components/ResultsGrid';

const DEFAULT_FILTERS: ResultsFiltersState = {
  scoreMin: '',
  scoreMax: '',
  hasWebsite: 'all',
  checked: 'all',
};

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filters, setFilters] = useState<ResultsFiltersState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [columnCount, setColumnCount] = useState<2 | 4>(2);
  const [sortBy, setSortBy] = useState<'default' | 'score-desc' | 'score-asc' | 'name'>('default');

  const location = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';
  const keywords = searchParams.get('keywords') || '';
  const limit = searchParams.get('limit') || '20';
  const pageSize = Math.max(10, parseInt(limit, 10) || 20);
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
    if (b.final_score === null) return true;
    if (!b.breakdown) return true;
    if (
      b.breakdown.pagespeed === undefined ||
      b.breakdown.website === undefined ||
      b.breakdown.web_standards_score === undefined
    ) {
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
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
        const response = await fetch(url);
        const bodyText = await response.text();

        let data: { businesses?: Business[]; error?: string };
        try {
          data = JSON.parse(bodyText) as { businesses?: Business[]; error?: string };
        } catch {
          const msg =
            response.status >= 500
              ? 'Server error. Please try again later.'
              : 'Something went wrong. Please try again.';
          alert(msg);
          setBusinesses([]);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          console.error('API Error:', data);
          alert(`Error: ${data.error ?? 'Failed to fetch results'}`);
          setBusinesses([]);
          return;
        }

        const fetchedBusinesses: Business[] = Array.isArray(data.businesses)
          ? data.businesses
          : [];
        setBusinesses(fetchedBusinesses);
        setDisplayCount(fetchedBusinesses.length > 0 ? fetchedBusinesses.length : pageSize);

        if (fetchedBusinesses.length === 0) {
          console.warn('No businesses returned from API');
        } else {
          const toAnalyze = fetchedBusinesses.filter((b) => needsAnalysis(b));
          if (toAnalyze.length > 0) {
            console.log(`Auto-analyzing ${toAnalyze.length} businesses missing analysis...`);
            (async () => {
              for (const business of toAnalyze) {
                try {
                  await handleAnalyze(business.id);
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                } catch (error) {
                  console.error(`Error auto-analyzing business ${business.id}:`, error);
                }
              }
            })();
          }
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        alert(
          `Error: ${error instanceof Error ? error.message : 'Failed to fetch results'}`
        );
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchResults();
    }
  }, [location, category, keywords, limit, handleAnalyze, needsAnalysis]);

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
      const params = new URLSearchParams(searchParams.toString());
      params.set('limit', newLimit);
      router.replace(`/results?${params.toString()}`);
    },
    [router, searchParams]
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
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
        />
        {showFilters && (
          <ResultsFilters filters={filters} onChange={setFilters} />
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
              className="rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 text-sm font-medium text-gray-900 transition hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-primary/10"
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
