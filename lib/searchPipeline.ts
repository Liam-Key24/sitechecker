import { searchGooglePlaces, getPlaceDetails } from '@/lib/google';
import { db } from '@/lib/db';
import { SECURITY_LIMITS } from '@/lib/security';
import { isUpstreamBudgetExceededError } from '@/lib/spendGuard';
import { calculateOpportunityScore } from '@/lib/scorer';
import type { AnalysisBreakdown, PageSpeedResult, WebsiteAnalysis } from '@/lib/contracts';

/** Row shape returned from GET /api/search (matches results `Business` minus client-only fields). */
export type SearchApiBusiness = {
  id: string;
  place_id: string;
  name: string;
  website: string | null;
  address: string | null;
  phone: string | null;
  categories: string[];
  google_rating: number | null;
  google_review_count: number | null;
  final_score: number | null;
  checked: boolean;
  breakdown: unknown;
};

export type SearchPipelineInput = {
  location: string;
  category: string;
  keywords: string;
  limit: number;
};

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY);
}

const PLACE_DETAILS_CONCURRENCY = 4;
const PLACE_DETAILS_MAX_ATTEMPTS = 3;
const MOCK_SEARCH_ENABLED = parseBooleanEnv('MOCK_SEARCH_ENABLED', false);
const TRANSIENT_NETWORK_CODES = new Set([
  'UND_ERR_SOCKET',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
]);
type SearchSource = 'google' | 'mock';
const searchResponseCache = new Map<
  string,
  { expiresAt: number; source: SearchSource; businesses: SearchApiBusiness[] }
>();
const inFlightSearches = new Map<string, Promise<SearchPipelineResult>>();
let cacheCleanupTick = 0;

type MockProfile = 'no_website' | 'weak' | 'average' | 'strong';

type MockBusinessSeed = {
  slug: string;
  name: string;
  categories: string[];
  website: string | null;
  rating: number | null;
  reviews: number | null;
  profile: MockProfile;
};

const MOCK_BUSINESS_SEEDS: MockBusinessSeed[] = [
  {
    slug: 'oak-lane-dental',
    name: 'Oak Lane Dental Studio',
    categories: ['Dentist', 'Dental Clinic'],
    website: 'https://example.com/oak-lane-dental',
    rating: 4.1,
    reviews: 87,
    profile: 'weak',
  },
  {
    slug: 'riverside-plumbing',
    name: 'Riverside Plumbing & Heating',
    categories: ['Plumber', 'Heating Contractor'],
    website: 'https://example.com/riverside-plumbing',
    rating: 4.6,
    reviews: 112,
    profile: 'average',
  },
  {
    slug: 'northway-locksmiths',
    name: 'Northway Locksmiths',
    categories: ['Locksmith'],
    website: null,
    rating: 4.2,
    reviews: 39,
    profile: 'no_website',
  },
  {
    slug: 'cedar-legal',
    name: 'Cedar Legal Services',
    categories: ['Solicitor', 'Legal Services'],
    website: 'https://example.com/cedar-legal',
    rating: 4.8,
    reviews: 54,
    profile: 'strong',
  },
  {
    slug: 'harbour-auto',
    name: 'Harbour Auto Care',
    categories: ['Auto Repair', 'MOT Centre'],
    website: 'https://example.com/harbour-auto',
    rating: 4.3,
    reviews: 91,
    profile: 'average',
  },
  {
    slug: 'thistle-cleaning',
    name: 'Thistle Cleaning Co.',
    categories: ['Cleaning Service', 'Home Services'],
    website: null,
    rating: 4.0,
    reviews: 26,
    profile: 'no_website',
  },
  {
    slug: 'elm-physio',
    name: 'Elm Street Physio',
    categories: ['Physiotherapist', 'Sports Clinic'],
    website: 'https://example.com/elm-physio',
    rating: 4.7,
    reviews: 64,
    profile: 'strong',
  },
  {
    slug: 'bridge-accounting',
    name: 'Bridge Accounting Partners',
    categories: ['Accountant', 'Tax Services'],
    website: 'https://example.com/bridge-accounting',
    rating: 4.4,
    reviews: 47,
    profile: 'weak',
  },
  {
    slug: 'sunrise-kitchen',
    name: 'Sunrise Kitchen Fitters',
    categories: ['Kitchen Remodeler', 'Carpenter'],
    website: 'https://example.com/sunrise-kitchen',
    rating: 4.5,
    reviews: 73,
    profile: 'average',
  },
  {
    slug: 'pine-tree-electric',
    name: 'Pine Tree Electrical',
    categories: ['Electrician'],
    website: null,
    rating: 4.1,
    reviews: 33,
    profile: 'no_website',
  },
  {
    slug: 'crown-barbers',
    name: 'Crown Barbers',
    categories: ['Barber Shop'],
    website: 'https://example.com/crown-barbers',
    rating: 4.9,
    reviews: 138,
    profile: 'strong',
  },
  {
    slug: 'westgate-fencing',
    name: 'Westgate Fencing & Decking',
    categories: ['Fence Contractor', 'Deck Builder'],
    website: 'https://example.com/westgate-fencing',
    rating: 3.9,
    reviews: 22,
    profile: 'weak',
  },
];

const MOCK_STREET_NAMES = [
  'High Street',
  'Market Road',
  'Kingston Avenue',
  'Willow Lane',
  'Station Road',
  'Church Street',
  'Victoria Close',
  'Manor Way',
  'Bridge Street',
  'Mill Lane',
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return fallback;
}

function slugForId(input: string, fallback: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || fallback;
}

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseBreakdownJson(raw: string | null): AnalysisBreakdown | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AnalysisBreakdown;
    return parsed;
  } catch {
    return null;
  }
}

function parseCategoriesJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === 'string');
  } catch {
    return [];
  }
}

function mockWebsiteAnalysis(profile: MockProfile): WebsiteAnalysis {
  if (profile === 'no_website') {
    return {
      hasHttps: false,
      hasTitle: false,
      hasMetaDescription: false,
      hasH1: false,
      hasSchema: false,
      hasLocalBusinessSchema: false,
      hasViewportMeta: false,
      hasCanonical: false,
      hasLangAttribute: false,
      hasFavicon: false,
      hasOpenGraph: false,
      hasTwitterCard: false,
      hasCTA: false,
      hasContactForm: false,
      hasReviews: false,
      weaknessNotes: ['No website found'],
    };
  }

  if (profile === 'strong') {
    return {
      hasHttps: true,
      hasTitle: true,
      hasMetaDescription: true,
      hasH1: true,
      hasSchema: true,
      hasLocalBusinessSchema: true,
      hasViewportMeta: true,
      hasCanonical: true,
      hasLangAttribute: true,
      hasFavicon: true,
      hasOpenGraph: true,
      hasTwitterCard: true,
      hasCTA: true,
      hasContactForm: true,
      hasReviews: true,
      weaknessNotes: ['Could add more location-specific landing pages'],
    };
  }

  if (profile === 'average') {
    return {
      hasHttps: true,
      hasTitle: true,
      hasMetaDescription: true,
      hasH1: true,
      hasSchema: true,
      hasLocalBusinessSchema: false,
      hasViewportMeta: true,
      hasCanonical: true,
      hasLangAttribute: true,
      hasFavicon: true,
      hasOpenGraph: true,
      hasTwitterCard: false,
      hasCTA: true,
      hasContactForm: true,
      hasReviews: false,
      weaknessNotes: ['No LocalBusiness schema markup found', 'No reviews or testimonials found on site'],
    };
  }

  return {
    hasHttps: true,
    hasTitle: true,
    hasMetaDescription: false,
    hasH1: true,
    hasSchema: false,
    hasLocalBusinessSchema: false,
    hasViewportMeta: false,
    hasCanonical: false,
    hasLangAttribute: false,
    hasFavicon: false,
    hasOpenGraph: false,
    hasTwitterCard: false,
    hasCTA: false,
    hasContactForm: false,
    hasReviews: false,
    weaknessNotes: [
      'Missing viewport meta tag (mobile)',
      'Missing canonical link',
      'No schema markup found',
      'No clear call-to-action or contact form found',
    ],
  };
}

function mockPageSpeed(profile: MockProfile): PageSpeedResult | null {
  if (profile === 'no_website') return null;
  if (profile === 'strong') {
    return {
      performance: 88,
      accessibility: 94,
      bestPractices: 91,
      seo: 93,
      mobileFriendly: true,
      desktopPerformance: 95,
      coreWebVitals: {
        lcp: 1700,
        cls: 0.05,
        inp: 120,
      },
    };
  }
  if (profile === 'average') {
    return {
      performance: 67,
      accessibility: 82,
      bestPractices: 78,
      seo: 81,
      mobileFriendly: true,
      desktopPerformance: 75,
      coreWebVitals: {
        lcp: 2600,
        cls: 0.13,
        inp: 220,
      },
    };
  }
  return {
    performance: 41,
    accessibility: 66,
    bestPractices: 59,
    seo: 62,
    mobileFriendly: false,
    desktopPerformance: 49,
    coreWebVitals: {
      lcp: 4600,
      cls: 0.32,
      inp: 620,
    },
  };
}

function buildMockBreakdown(profile: MockProfile): AnalysisBreakdown {
  return calculateOpportunityScore(mockPageSpeed(profile), mockWebsiteAnalysis(profile));
}

type BuiltMockBusiness = {
  placeId: string;
  name: string;
  website: string | null;
  address: string;
  phone: string;
  categories: string[];
  rating: number | null;
  reviewCount: number | null;
  breakdown: AnalysisBreakdown;
};

function buildMockBusinessRows(input: SearchPipelineInput): BuiltMockBusiness[] {
  const locationLabel = input.location.trim();
  const locationSlug = slugForId(locationLabel, 'location');
  const categoryRaw = input.category.trim();
  const categoryLabel = categoryRaw ? titleCase(categoryRaw) : '';
  const categorySlug = slugForId(categoryRaw || 'all', 'all');
  const count = Math.max(1, input.limit);

  const rows: BuiltMockBusiness[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = MOCK_BUSINESS_SEEDS[i % MOCK_BUSINESS_SEEDS.length];
    const cycle = Math.floor(i / MOCK_BUSINESS_SEEDS.length);
    const sequence = i + 1;
    const street = MOCK_STREET_NAMES[i % MOCK_STREET_NAMES.length];
    const address = `${90 + sequence} ${street}, ${locationLabel}`;
    const phoneTail = String(310_000 + sequence * 17).padStart(6, '0');

    const categories = categoryLabel
      ? [categoryLabel, ...seed.categories.filter((c) => c.toLowerCase() !== categoryLabel.toLowerCase())]
      : seed.categories;

    const breakdown = buildMockBreakdown(seed.profile);
    const suffix = cycle > 0 ? ` ${cycle + 1}` : '';
    const placeId = `mock:${locationSlug}:${categorySlug}:${seed.slug}:${cycle}`;

    rows.push({
      placeId,
      name: `${seed.name}${suffix}`,
      website: seed.website,
      address,
      phone: `+44 20 ${phoneTail}`,
      categories,
      rating: seed.rating,
      reviewCount: seed.reviews,
      breakdown,
    });
  }

  return rows;
}

async function runMockSearchPipeline(input: SearchPipelineInput): Promise<SearchPipelineSuccess> {
  const rows = buildMockBusinessRows(input);
  const businesses: SearchApiBusiness[] = [];

  for (const row of rows) {
    const business = await db.business.upsert({
      where: { place_id: row.placeId },
      update: {
        name: row.name,
        website: row.website,
        address: row.address,
        phone: row.phone,
        categories: JSON.stringify(row.categories),
        google_rating: row.rating,
        google_review_count: row.reviewCount,
        final_score: row.breakdown.final_score,
        last_scanned: new Date(),
      },
      create: {
        place_id: row.placeId,
        name: row.name,
        website: row.website,
        address: row.address,
        phone: row.phone,
        categories: JSON.stringify(row.categories),
        google_rating: row.rating,
        google_review_count: row.reviewCount,
        final_score: row.breakdown.final_score,
        checked: false,
      },
    });

    const latestAnalysis = await db.analysis.findFirst({
      where: { businessId: business.id },
      orderBy: { created_at: 'desc' },
    });

    let breakdown = parseBreakdownJson(latestAnalysis?.breakdown_json ?? null);
    if (!breakdown) {
      breakdown = row.breakdown;
      await db.analysis.create({
        data: {
          businessId: business.id,
          pagespeed_score: breakdown.pagespeed_score,
          yelp_score: null,
          breakdown_json: JSON.stringify(breakdown),
        },
      });
    }

    businesses.push({
      id: business.id,
      place_id: business.place_id,
      name: business.name,
      website: business.website,
      address: business.address,
      phone: business.phone,
      categories: parseCategoriesJson(business.categories),
      google_rating: business.google_rating,
      google_review_count: business.google_review_count,
      final_score: business.final_score,
      checked: business.checked,
      breakdown,
    });
  }

  return { ok: true, source: 'mock', businesses };
}

function extractErrorCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  if ('code' in err && typeof err.code === 'string') return err.code;
  if ('cause' in err) return extractErrorCode(err.cause);
  return null;
}

function isTransientNetworkError(err: unknown): boolean {
  const code = extractErrorCode(err);
  if (code && TRANSIENT_NETWORK_CODES.has(code)) return true;
  const message =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('other side closed') ||
    message.includes('socket')
  );
}

async function getPlaceDetailsWithRetry(
  placeId: string
): Promise<Awaited<ReturnType<typeof getPlaceDetails>>> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= PLACE_DETAILS_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await getPlaceDetails(placeId);
    } catch (err) {
      lastError = err;
      if (!isTransientNetworkError(err) || attempt === PLACE_DETAILS_MAX_ATTEMPTS) {
        throw err;
      }
      await delay(250 * attempt);
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const out: R[] = new Array(items.length);
  let cursor = 0;

  const run = async () => {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) return;
      out[idx] = await worker(items[idx]);
    }
  };

  await Promise.all(Array.from({ length: safeConcurrency }, () => run()));
  return out;
}

function buildTextQuery(input: SearchPipelineInput): string {
  const { location, category, keywords } = input;
  if (!category && !keywords) {
    return `businesses in ${location}`;
  }
  let q = location;
  if (category) q = `${category} ${q}`;
  if (keywords) q = `${keywords} ${q}`;
  return q;
}

function normalizeForKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function cacheKeyFor(input: SearchPipelineInput): string {
  return [
    normalizeForKey(input.location),
    normalizeForKey(input.category),
    normalizeForKey(input.keywords),
    String(input.limit),
  ].join('|');
}

function cloneBusinesses(list: SearchApiBusiness[]): SearchApiBusiness[] {
  return list.map((b) => ({
    ...b,
    categories: [...b.categories],
  }));
}

function maybeCleanupSearchCache(now: number): void {
  cacheCleanupTick += 1;
  if (cacheCleanupTick % 100 !== 0) return;

  for (const [key, entry] of searchResponseCache.entries()) {
    if (entry.expiresAt <= now) searchResponseCache.delete(key);
  }

  const maxEntries = SECURITY_LIMITS.SEARCH.CACHE_MAX_ENTRIES;
  if (searchResponseCache.size <= maxEntries) return;
  let toDrop = searchResponseCache.size - maxEntries;
  for (const key of searchResponseCache.keys()) {
    searchResponseCache.delete(key);
    toDrop -= 1;
    if (toDrop <= 0) break;
  }
}

async function persistPlaceAndShapeRow(
  place: Awaited<ReturnType<typeof searchGooglePlaces>>[number]
): Promise<SearchApiBusiness | null> {
  try {
    let placeData = place;
    try {
      const details = await getPlaceDetailsWithRetry(place.place_id);
      placeData = details || place;
    } catch (detailsError: unknown) {
      console.warn(
        `Place details failed for ${place.place_id}; continuing with text search payload.`,
        detailsError
      );
    }

    const business = await db.business.upsert({
      where: { place_id: placeData.place_id },
      update: {
        name: placeData.name,
        website: placeData.website || null,
        address: placeData.formatted_address || null,
        phone: placeData.formatted_phone_number || null,
        categories: JSON.stringify(placeData.types || []),
        google_rating: placeData.rating || null,
        google_review_count: placeData.user_ratings_total || null,
        last_scanned: new Date(),
      },
      create: {
        place_id: placeData.place_id,
        name: placeData.name,
        website: placeData.website || null,
        address: placeData.formatted_address || null,
        phone: placeData.formatted_phone_number || null,
        categories: JSON.stringify(placeData.types || []),
        google_rating: placeData.rating || null,
        google_review_count: placeData.user_ratings_total || null,
        checked: false,
      },
    });

    await db.sourceSnapshot.deleteMany({
      where: { businessId: business.id, provider: 'google' },
    });
    await db.sourceSnapshot.create({
      data: {
        businessId: business.id,
        provider: 'google',
        raw_data: JSON.stringify(placeData),
      },
    });

    const updatedBusiness = await db.business.findUnique({
      where: { id: business.id },
      include: {
        analyses: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!updatedBusiness) return null;

    let breakdown: unknown = null;
    if (updatedBusiness.analyses.length > 0) {
      const analysis = updatedBusiness.analyses[0];
      if (analysis.breakdown_json) {
        breakdown = JSON.parse(analysis.breakdown_json);
      } else {
        breakdown = {
          pagespeed_score: analysis.pagespeed_score,
          final_score: updatedBusiness.final_score,
          weakness_notes: [],
        };
      }
    }

    return {
      id: updatedBusiness.id,
      place_id: updatedBusiness.place_id,
      name: updatedBusiness.name,
      website: updatedBusiness.website,
      address: updatedBusiness.address,
      phone: updatedBusiness.phone,
      categories: JSON.parse(updatedBusiness.categories || '[]'),
      google_rating: updatedBusiness.google_rating,
      google_review_count: updatedBusiness.google_review_count,
      final_score: updatedBusiness.final_score,
      checked: updatedBusiness.checked,
      breakdown,
    };
  } catch (placeError: unknown) {
    console.error(`Error processing place ${place.place_id}:`, placeError);
    return null;
  }
}

export type SearchPipelineSuccess = {
  ok: true;
  source: SearchSource;
  businesses: SearchApiBusiness[];
};
export type SearchPipelineFailure = {
  ok: false;
  status: number;
  error: string;
  code?: 'MISSING_GOOGLE_KEY' | 'GOOGLE_PLACES_ERROR' | 'UPSTREAM_BUDGET_EXCEEDED';
  retryAfterSec?: number;
};

export type SearchPipelineResult = SearchPipelineSuccess | SearchPipelineFailure;

/**
 * Google Places text search → place details → SQLite upsert → return card-ready rows.
 */
export async function runSearchPipeline(input: SearchPipelineInput): Promise<SearchPipelineResult> {
  if (!MOCK_SEARCH_ENABLED && !isGooglePlacesConfigured()) {
    return {
      ok: false,
      status: 503,
      error:
        'Google Maps / Places is not configured. Add GOOGLE_API_KEY (or GOOGLE_MAPS_API_KEY) to your environment and enable Places API + billing.',
      code: 'MISSING_GOOGLE_KEY',
    };
  }

  const now = Date.now();
  const key = cacheKeyFor(input);
  maybeCleanupSearchCache(now);

  const cached = searchResponseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return { ok: true, source: cached.source, businesses: cloneBusinesses(cached.businesses) };
  }

  const existingInFlight = inFlightSearches.get(key);
  if (existingInFlight) {
    const shared = await existingInFlight;
    if (shared.ok) {
      return { ok: true, source: shared.source, businesses: cloneBusinesses(shared.businesses) };
    }
    return shared;
  }

  const work = (async (): Promise<SearchPipelineResult> => {
  if (MOCK_SEARCH_ENABLED) {
    const mock = await runMockSearchPipeline(input);
    const value = cloneBusinesses(mock.businesses);
    searchResponseCache.set(key, {
      expiresAt: Date.now() + SECURITY_LIMITS.SEARCH.CACHE_TTL_MS,
      source: 'mock',
      businesses: value,
    });
    return { ok: true, source: 'mock', businesses: cloneBusinesses(value) };
  }

  const query = buildTextQuery(input);
  const { limit, category } = input;

  let places: Awaited<ReturnType<typeof searchGooglePlaces>>;
  try {
    places = await searchGooglePlaces(
      query,
      undefined,
      undefined,
      category || undefined,
      limit
    );
  } catch (e: unknown) {
    if (isUpstreamBudgetExceededError(e)) {
      return {
        ok: false,
        status: 429,
        error: e.message,
        code: 'UPSTREAM_BUDGET_EXCEEDED',
        retryAfterSec: e.retryAfterSec,
      };
    }
    const message = e instanceof Error ? e.message : 'Google Places search failed';
    console.error('Search pipeline Google error:', e);
    return {
      ok: false,
      status: 500,
      error: message,
      code: 'GOOGLE_PLACES_ERROR',
    };
  }

  if (places.length === 0) {
    return { ok: true, source: 'google', businesses: [] };
  }

  const limitedPlaces = places.slice(0, limit);
  const rows = await mapWithConcurrency(
    limitedPlaces,
    PLACE_DETAILS_CONCURRENCY,
    persistPlaceAndShapeRow
  );

  const businesses = rows.filter((b): b is SearchApiBusiness => b !== null);
  const value = cloneBusinesses(businesses);
  searchResponseCache.set(key, {
    expiresAt: Date.now() + SECURITY_LIMITS.SEARCH.CACHE_TTL_MS,
    source: 'google',
    businesses: value,
  });
  return { ok: true, source: 'google', businesses: cloneBusinesses(value) };
  })();

  inFlightSearches.set(key, work);
  try {
    return await work;
  } finally {
    inFlightSearches.delete(key);
  }
}
