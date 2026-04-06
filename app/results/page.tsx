import ResultsClient from '@/app/results/results-client';
import { clampSearchLimitFromString } from '@/lib/searchLimits';

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstString(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams> | RawSearchParams;
}) {
  const sp = await Promise.resolve(searchParams);
  const location = firstString(sp.location);
  const category = firstString(sp.category);
  const keywords = firstString(sp.keywords);
  const limit = String(clampSearchLimitFromString(firstString(sp.limit), 20));

  const queryKey = `${location}|${category}|${keywords}|${limit}`;

  return (
    <div className="pt-28">
      <ResultsClient
        key={queryKey}
        location={location}
        category={category}
        keywords={keywords}
        limit={limit}
      />
    </div>
  );
}
