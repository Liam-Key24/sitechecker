'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ResultCard from '@/components/ResultCard';
import type { AnalysisBreakdown } from '@/lib/contracts';

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

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filters, setFilters] = useState({
    scoreMin: '',
    scoreMax: '',
    hasWebsite: 'all',
    checked: 'all',
  });

  const location = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';
  const keywords = searchParams.get('keywords') || '';
  const limit = searchParams.get('limit') || '20';

  const handleAnalyze = useCallback(async (id: string, options?: { force?: boolean }) => {
    try {
      const agentLog = async (payload: Record<string, unknown>) => {
        try {
          await fetch('/api/agent-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // ignore
        }
      };

      // #region agent log (A)
      await agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'app/results/results-client.tsx:handleAnalyze:entry',message:'handleAnalyze entry',data:{idLen:id?.length ?? null,force:options?.force ?? null,origin:typeof window!=='undefined'?window.location.origin:null,path:typeof window!=='undefined'?window.location.pathname:null,online:typeof navigator!=='undefined'?navigator.onLine:null},timestamp:Date.now()});
      // #endregion

      const startedAt = Date.now();
      // #region agent log (A)
      await agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'app/results/results-client.tsx:handleAnalyze:beforeFetch',message:'fetch /api/analyse about to start',data:{url:'/api/analyse',bodyBytes:JSON.stringify({businessId:id,force:options?.force}).length},timestamp:Date.now()});
      // #endregion

      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: id, force: options?.force }),
      });

      // #region agent log (B)
      await agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'app/results/results-client.tsx:handleAnalyze:afterFetch',message:'fetch /api/analyse resolved',data:{ok:response.ok,status:response.status,ms:Date.now()-startedAt},timestamp:Date.now()});
      // #endregion

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
      const agentLog = async (payload: Record<string, unknown>) => {
        try {
          await fetch('/api/agent-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // ignore
        }
      };

      // #region agent log (C)
      await agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'app/results/results-client.tsx:handleAnalyze:catch',message:'fetch /api/analyse threw',data:{errName:error instanceof Error?error.name:typeof error,errMsg:error instanceof Error?error.message:String(error),online:typeof navigator!=='undefined'?navigator.onLine:null,visibility:typeof document!=='undefined'?document.visibilityState:null},timestamp:Date.now()});
      // #endregion
      console.error('Error analyzing website:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Failed to analyze website'}`
      );
    }
  }, []);

  const needsAnalysis = useCallback((b: Business) => {
    if (b.final_score === null) return true;
    if (!b.breakdown) return true;
    // If this is an older breakdown without richer fields, refresh it.
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

        let data: { businesses?: unknown[]; error?: string };
        try {
          data = JSON.parse(bodyText);
        } catch {
          // Server returned non-JSON (e.g. HTML error page)
          const msg = response.status >= 500
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

        const fetchedBusinesses = data.businesses || [];
        setBusinesses(fetchedBusinesses);

        if (!fetchedBusinesses || fetchedBusinesses.length === 0) {
          console.warn('No businesses returned from API');
        } else {
          // Auto-analyze any businesses missing a complete analysis (run after state is set)
          const toAnalyze = fetchedBusinesses.filter((b: Business) => needsAnalysis(b));
          if (toAnalyze.length > 0) {
            console.log(
              `Auto-analyzing ${toAnalyze.length} businesses missing analysis...`
            );

            // Analyze in sequence with delay to avoid rate limiting
            (async () => {
              for (const business of toAnalyze) {
                try {
                  await handleAnalyze(business.id);
                  // Small delay between analyses
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                } catch (error) {
                  console.error(
                    `Error auto-analyzing business ${business.id}:`,
                    error
                  );
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

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true);
    const toAnalyze = businesses;

    for (const business of toAnalyze) {
      await handleAnalyze(business.id, { force: true });
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setAnalyzingAll(false);
  };

  const getFilteredBusinesses = () => {
    return businesses.filter((b) => {
      if (filters.hasWebsite === 'yes' && !b.website) return false;
      if (filters.hasWebsite === 'no' && b.website) return false;
      if (filters.checked === 'checked' && !b.checked) return false;
      if (filters.checked === 'unchecked' && b.checked) return false;
      if (
        filters.scoreMin &&
        (b.final_score === null || b.final_score < parseInt(filters.scoreMin))
      )
        return false;
      if (
        filters.scoreMax &&
        (b.final_score === null || b.final_score > parseInt(filters.scoreMax))
      )
        return false;
      return true;
    });
  };

  const handleExportCSV = () => {
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
  };

  const filteredBusinesses = getFilteredBusinesses();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 font-medium mb-2"
            >
              ← Back to Search
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Results for: {location}
            </h1>
            <p className="text-gray-600 mt-1">Found {businesses.length} businesses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzingAll ? 'Reloading...' : 'Reload Analysis (All)'}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:brightness-95 transition"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score Min
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.scoreMin}
                onChange={(e) =>
                  setFilters({ ...filters, scoreMin: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score Max
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.scoreMax}
                onChange={(e) =>
                  setFilters({ ...filters, scoreMax: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Has Website
              </label>
              <select
                value={filters.hasWebsite}
                onChange={(e) =>
                  setFilters({ ...filters, hasWebsite: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Checked Status
              </label>
              <select
                value={filters.checked}
                onChange={(e) => setFilters({ ...filters, checked: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All</option>
                <option value="checked">Checked</option>
                <option value="unchecked">Unchecked</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredBusinesses.length} of {businesses.length} businesses
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredBusinesses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No businesses match your filters.
            </div>
          ) : (
            filteredBusinesses.map((business) => (
              <ResultCard
                key={business.id}
                business={business}
                onToggleChecked={handleToggleChecked}
                onAnalyze={handleAnalyze}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

