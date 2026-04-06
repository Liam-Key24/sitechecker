# Setup Requirements for Website Opportunity Scanner

## What You Need to Provide

The scoring system is **already fully implemented** in the code. You just need to provide API keys to make it work.

### Required API Keys

#### 1. **Google API Key** (Required for Search + Website Scoring)
- **Purpose**: Analyzes website performance and generates the PageSpeed score (0-100)
- **How to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project or select an existing one
  3. Enable:
     - "Places API" (for business search)
     - "PageSpeed Insights API" (for website scoring)
  4. Go to "Credentials" → "Create Credentials" → "API Key"
  5. Copy the API key
- **Add to `.env.local`**:
  ```
  GOOGLE_API_KEY=your_api_key_here
  ```
- **Note**: PageSpeed has a free tier (25,000 requests per day). For production use, you may need to enable billing.

## How the Scoring Works

The **final score (0–100)** averages the signals that are available:

1. **PageSpeed mobile performance (0–100)** — from PageSpeed Insights (`GOOGLE_API_KEY`)
2. **Web standards score (0–100)** — on-page HTML checks, blended with Lighthouse category scores when PageSpeed data exists

If only one of those is available, that value is used as the final score. If neither is available (e.g. no website), the final score is `null`.

### Score Interpretation:

- **0–30**: Actively hurting the business
- **31–60**: Website exists but weak
- **61–80**: Adequate but underperforming
- **81–100**: Strong presence, low priority

## What Happens Without API Keys?

- **Without `GOOGLE_API_KEY` (or `GOOGLE_MAPS_API_KEY`)**:
  - **Search** (`/api/search`) returns **503** with a clear error — Places is not configured (unless `MOCK_SEARCH_ENABLED=true`).
  - **Analysis** cannot run PageSpeed; scores that depend on it will be missing or weaker.

## UI Demo Mode (no paid API calls)

If you want to keep working on UI without paid usage:

```env
MOCK_SEARCH_ENABLED=true
```

This serves realistic mock businesses from the API and stores them in SQLite so the full results/contact flow still works.
Set it back to `false` before production deployment.

## Quick Setup Checklist

1. ✅ Create `.env.local` file in the project root
2. ✅ Add `GOOGLE_API_KEY` (required for search + analysis)
3. ✅ Restart your development server (`npm run dev`)

## Example `.env.local` File

```env
# Required for search + analysis
GOOGLE_API_KEY=AIzaSy...
```

## Testing Your Setup

After adding the API keys:

1. Search for a business (e.g., "dentist in Leeds")
2. Click "Analyze Website" on a result card (auto-analysis is disabled by default)
3. Check the score badge - you should see a number between 0-100
4. Click "Show Score Breakdown" to see PageSpeed and web standards detail

If scores are still `null`:
- Check your browser console for API errors
- Verify API keys are correct in `.env.local`
- Make sure billing is enabled for Google APIs
- Check API quotas/limits haven't been exceeded

## Security tuning (recommended)

The API now includes built-in abuse controls (rate limits, validation, network timeouts/retries, and safe URL checks).

- Adjust limits centrally in `lib/security.ts`
- Search input length caps live in `lib/searchLimits.ts`
- Spend controls are configurable via env vars (per-minute + daily caps for Places and PageSpeed)
- Set `GOOGLE_PLACES_DETAILS_ENABLED=false` for an emergency low-cost mode (fewer fields, much cheaper search)
- Set `MOCK_SEARCH_ENABLED=true` to run a DB-backed mock dataset for UI work while billing is paused
- Re-analysis cooldown is configurable with `ANALYSE_MIN_REANALYZE_INTERVAL_MS`
- For production-grade DDoS protection, also put the app behind a CDN/WAF and consider distributed rate limiting (Redis/upstream gateway)








## Two-tier payment model (Sitecheck)

### What we’re monetizing
This app has two real cost centers (external API calls):

- **Search** (`/api/search`)
  - Calls Google Places Text Search + (per result) Place Details
  - One search can become **1 + N** Google requests depending on limit/results
- **Analysis** (`/api/analyse`)
  - Calls PageSpeed + HTML analysis
  - Cached: returns a recent analysis within 7 days unless `force` is true

**Recommendation:** sell **analysis credits** (and optionally smaller “search credits”), because that aligns with cost and is easy to explain.

---

### Recommended 2-tier model: Free (credits) + Pro (subscription w/credits)
This gives predictable cost control (credits) and predictable revenue (subscription).

#### Free tier
- Includes **X analysis credits** (example: 20 total)
- Optionally include **Y searches/day** (example: 5/day) or **Z searches total** (example: 10 total)
- Limit batch actions:
  - Disable “Analyze all” or cap to small batches (e.g. 5 at a time)
- Optional feature limits:
  - CSV export capped (e.g. max 50 rows) or disabled on free

#### Pro tier (subscription)
- Monthly subscription includes **larger monthly credit allowance** (example: 1,000 analyses/month)
- Higher limits:
  - Unlimited searches (or a high cap)
  - Larger batch analyze + concurrency
  - Full CSV export
- Optional: credit rollover (e.g. 1 month rollover) to reduce churn

#### Optional: top-ups / overage
- Let Pro users buy extra credit packs (e.g. $10 for 500 credits), or hard-stop and prompt to upgrade.

---

### Credit charging rules (important)
Only deduct credits when we actually do paid work.

#### `/api/analyse`
- **Do NOT charge** if the API returns a cached analysis (within 7 days) and `force` is false
- **Do charge** if:
  - No recent cached analysis exists, or
  - User requested refresh (`force: true`)

#### `/api/search`
Because 1 search can trigger many requests, consider charging:
- **Per business imported/returned** (simplest cost alignment), OR
- **Per search** but tightly cap results, OR
- Free searches but charge only for analyses (simplest UX)

---

### Implementation plan (high level)
We’ll need **auth**, **billing**, and **enforcement**.

#### 1) Auth
Add user accounts so credits/subscriptions attach to a person/org.
Options: NextAuth, Clerk, Supabase Auth, etc.

#### 2) Billing
Use Stripe:
- Checkout for Pro subscription
- Billing portal for manage/cancel
- Webhooks to update subscription state and grant monthly credits

#### 3) Prisma data model additions (suggested)
Add tables like:
- `User`
- `Subscription`
  - stripeCustomerId, status, priceId, currentPeriodEnd
- `CreditBalance`
  - userId, balance
- `UsageEvent` (audit log)
  - userId, type: SEARCH|ANALYZE, quantity, createdAt, businessId?

#### 4) Enforcement points
Gate in:
- `app/api/search/route.ts`
- `app/api/analyse/route.ts`

Flow:
1. Identify user
2. Check subscription status / credit balance
3. Deduct credits **atomically** (Prisma transaction) *before* calling external APIs
4. If insufficient credits, return a clear upgrade response (e.g. 402/403 + message)

---

### Starter pricing (adjust after observing real usage)
Pick numbers that cover external API costs + margin.

Example:
- **Free**: 20 analysis credits + 5 searches/day
- **Pro**: $29/mo includes 1,000 analysis credits + unlimited searches + batch analyze + CSV export
- **Top-up** (optional): $10 for 500 credits

---

### Decision that affects everything
Are we building:
1) **Hosted SaaS (we pay for API keys/usage)** → credits are strongly recommended
2) **Bring-your-own-keys (customers supply keys)** → simpler subscription (fewer credit worries) can work better

We should decide this before implementing billing.
