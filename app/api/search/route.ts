import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MAX_SEARCH_LIMIT, MIN_SEARCH_LIMIT } from '@/lib/searchLimits';
import { runSearchPipeline } from '@/lib/searchPipeline';
import {
  SECURITY_LIMITS,
  checkRateLimit,
  buildRateLimitHeaders,
  getClientIp,
} from '@/lib/security';

export const runtime = 'nodejs';

const SearchQuerySchema = z.object({
  location: z.string().trim().min(2).max(SECURITY_LIMITS.SEARCH.MAX_LOCATION_CHARS),
  category: z.string().trim().max(SECURITY_LIMITS.SEARCH.MAX_CATEGORY_CHARS).default(''),
  keywords: z.string().trim().max(SECURITY_LIMITS.SEARCH.MAX_KEYWORDS_CHARS).default(''),
  limit: z.coerce.number().int().min(MIN_SEARCH_LIMIT).max(MAX_SEARCH_LIMIT).default(20),
});

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(
    `api:search:${ip}`,
    SECURITY_LIMITS.SEARCH.RATE_LIMIT_MAX,
    SECURITY_LIMITS.SEARCH.RATE_LIMIT_WINDOW_MS
  );
  const rateHeaders = buildRateLimitHeaders(rate);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many search requests. Please slow down.' },
      { status: 429, headers: rateHeaders }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = SearchQuerySchema.safeParse({
    location: searchParams.get('location') ?? '',
    category: searchParams.get('category') ?? '',
    keywords: searchParams.get('keywords') ?? '',
    limit: searchParams.get('limit') ?? '20',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid search parameters', details: parsed.error.flatten() },
      { status: 400, headers: rateHeaders }
    );
  }
  const { location, category, keywords, limit } = parsed.data;

  const result = await runSearchPipeline({
    location,
    category,
    keywords,
    limit,
  });

  if (!result.ok) {
    const headers = result.retryAfterSec
      ? { ...rateHeaders, 'Retry-After': String(result.retryAfterSec) }
      : rateHeaders;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status, headers }
    );
  }

  return NextResponse.json(
    { businesses: result.businesses, mock: result.source === 'mock' },
    {
      headers: {
        ...rateHeaders,
        'Cache-Control': 'no-store',
      },
    }
  );
}
