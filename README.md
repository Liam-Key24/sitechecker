# Website Opportunity Scanner

An internal Next.js web application that finds local businesses with no website or low-value websites for outreach opportunities.

## Features

- **Business Search**: Search for local businesses by location, category, and keywords using Google Places API
- **Website Analysis**: Analyzes websites using Google PageSpeed Insights and HTML parsing
- **Opportunity Scoring**: 0–100 score from PageSpeed performance and on-page web standards checks
- **Review Tracking**: Mark businesses as checked/unchecked for outreach tracking
- **CSV Export**: Export filtered results for outreach campaigns

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.local.example` to `.env.local` and fill in your API keys:
   ```bash
   cp .env.local.example .env.local
   ```

  Required API keys:
  - `GOOGLE_API_KEY` — Google APIs key used for **Places** (search) and **PageSpeed Insights** (analysis). Enable both APIs and billing where required.
    - Backwards compatible: `GOOGLE_MAPS_API_KEY` still works for the same key value.
  - For UI/demo mode without paid API calls, set `MOCK_SEARCH_ENABLED=true` in `.env.local` (set it back to `false` before production deploy).

3. **Set up the database**:
   ```bash
   npx prisma migrate dev
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security & Abuse Controls

- **Rate limiting** is applied on heavy API routes (`/api/search`, `/api/analyse`, `/api/status`, `/api/business/[id]`) by client IP.
- **Strict input validation** is enforced with schema checks (length + type constraints) before expensive work runs.
- **Search dedupe/cache**: identical searches are shared in-flight and short-lived cached responses reduce repeated upstream API load.
- **Network resilience**: upstream fetches use timeout + retry policy for transient failures.
- **Safe website analysis**: analysis blocks local/internal/non-standard-host URLs to reduce SSRF-style risk.
- **Spend guards for paid upstreams**: hard per-window caps now gate Places text search/details and PageSpeed calls, even if a client loop occurs.
- **Place Details kill switch**: turn `GOOGLE_PLACES_DETAILS_ENABLED=false` to avoid per-result detail charges during incident response.
- **Re-analysis cooldown**: `/api/analyse` returns cached results during a minimum cooldown window (including forced runs unless explicitly bypassed by env).
- **Auto-analyze is opt-in**: automatic post-search analysis defaults to `0` and must be explicitly enabled.

Tune these parameters in `lib/security.ts` (rate limits, cache TTL/size, and network retry/timeout).

Cost guard env knobs (optional):

- `UPSTREAM_SPEND_GUARDS_ENABLED=true|false`
- `UPSTREAM_SPEND_GUARD_WINDOW_MS=60000`
- `GOOGLE_PLACES_TEXTSEARCH_MAX_PER_WINDOW=12`
- `GOOGLE_PLACES_DETAILS_MAX_PER_WINDOW=80`
- `GOOGLE_PAGESPEED_MAX_PER_WINDOW=40`
- `GOOGLE_PLACES_TEXTSEARCH_MAX_PER_DAY=300`
- `GOOGLE_PLACES_DETAILS_MAX_PER_DAY=2000`
- `GOOGLE_PAGESPEED_MAX_PER_DAY=1000`
- `GOOGLE_PLACES_DETAILS_ENABLED=true|false`
- `ANALYSE_MIN_REANALYZE_INTERVAL_MS=86400000`
- `ANALYSE_RECENT_ANALYSIS_TTL_MS=604800000`
- `ANALYSE_ALLOW_FORCE_BYPASS_COOLDOWN=false`
- `NEXT_PUBLIC_AUTO_ANALYZE_ON_LOAD=0`
- `MOCK_SEARCH_ENABLED=true|false`

## Usage

1. **Search for businesses**: Enter a location (city or postcode), optionally add a category and keywords, then click "Search Businesses"
2. **View results**: Results are displayed as cards showing business information, ratings, and opportunity scores
3. **Analyze websites**: Click "Analyze Website" on individual businesses or "Analyze All" to analyze all businesses with websites
4. **Filter results**: Use the filters to narrow down by score range, website presence, and checked status
5. **Track outreach**: Mark businesses as checked/unchecked to track your outreach progress
6. **Export data**: Click "Export CSV" to download filtered results for outreach campaigns

## Scoring System

The opportunity score (0–100) blends:

- **PageSpeed (mobile) performance** from PageSpeed Insights
- **Web standards score** from on-page HTML checks (and Lighthouse category averages when available)

**Score Interpretation**:
- 0–30: Actively hurting the business
- 31–60: Website exists but weak
- 61–80: Adequate but underperforming
- 81–100: Strong presence, low priority

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **APIs**: Google Places, PageSpeed Insights

## Project Structure

```
/app
  /api
    /search      # Business search endpoint
    /analyse     # Website analysis endpoint
    /status      # Checked status update endpoint
  /page.tsx      # Search page
  /results       # Results page
/components
  SearchForm.tsx
  ResultCard.tsx
  ScoreBadge.tsx
  Breakdown.tsx
/lib
  google.ts      # Google Places API client
  searchPipeline.ts # Search orchestration (Places → DB → API shape)
  pagespeed.ts   # PageSpeed Insights client
  analyzer.ts    # HTML analysis utilities
  scorer.ts      # Scoring logic
  db.ts          # Prisma client
```

## License

Private internal tool - not for public distribution.
# sitechecker
# sitehecker
