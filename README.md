# Website Opportunity Scanner

An internal Next.js web application that finds local businesses with no website or low-value websites for outreach opportunities.

## Features

- **Business Search**: Search for local businesses by location, category, and keywords using Google Places API
- **Multi-Source Enrichment**: Automatically enriches results with Foursquare data
- **Website Analysis**: Analyzes websites using Google PageSpeed Insights and HTML parsing
- **Opportunity Scoring**: Calculates a 0-100 opportunity score using median of PageSpeed and Foursquare scores
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
   - `GOOGLE_MAPS_API_KEY` - Google Places API (required)
   - `PAGESPEED_API_KEY` - Google PageSpeed Insights API (optional, for website analysis)
   - `FOURSQUARE_API_KEY` - Foursquare Places API (optional, for enrichment)

3. **Set up the database**:
   ```bash
   npx prisma migrate dev
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Search for businesses**: Enter a location (city or postcode), optionally add a category and keywords, then click "Search Businesses"
2. **View results**: Results are displayed as cards showing business information, ratings, and opportunity scores
3. **Analyze websites**: Click "Analyze Website" on individual businesses or "Analyze All" to analyze all businesses with websites
4. **Filter results**: Use the filters to narrow down by score range, website presence, and checked status
5. **Track outreach**: Mark businesses as checked/unchecked to track your outreach progress
6. **Export data**: Click "Export CSV" to download filtered results for outreach campaigns

## Scoring System

The opportunity score (0-100) is calculated as the **median** of available component scores:

- **PageSpeed Score**: Website performance from Google PageSpeed Insights
- **Foursquare Authority Score**: Based on Foursquare rating and popularity

**Score Interpretation**:
- 0–30: Actively hurting the business
- 31–60: Website exists but weak
- 61–80: Adequate but underperforming
- 81–100: Strong presence, low priority

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **APIs**: Google Places, PageSpeed Insights, Foursquare Places

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
  foursquare.ts  # Foursquare API client
  pagespeed.ts   # PageSpeed Insights client
  analyzer.ts    # HTML analysis utilities
  scorer.ts      # Scoring logic
  db.ts          # Prisma client
```

## License

Private internal tool - not for public distribution.
# sitechecker
