import type { AnalysisBreakdown, PageSpeedResult, WebsiteAnalysis } from '@/lib/contracts';

function average(values: Array<number | undefined>): number | null {
  const present = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

function calculateWebsiteChecksScore(website: WebsiteAnalysis): number {
  const checks: Array<boolean | undefined> = [
    website.hasHttps,
    website.hasTitle,
    website.hasMetaDescription,
    website.hasH1,
    website.hasSchema,
    website.hasLocalBusinessSchema,
    website.hasViewportMeta,
    website.hasCanonical,
    website.hasLangAttribute,
    website.hasFavicon,
    website.hasOpenGraph,
    website.hasTwitterCard,
    website.hasCTA,
    website.hasContactForm,
    website.hasReviews,
  ];
  const definedChecks = checks.filter((c): c is boolean => typeof c === 'boolean');
  if (definedChecks.length === 0) return 0;
  const passed = definedChecks.filter(Boolean).length;
  return Math.round((passed / definedChecks.length) * 100);
}

function calculateWebStandardsScore(
  pagespeed: PageSpeedResult | null,
  website: WebsiteAnalysis
): number | null {
  // Lighthouse-style base (0-100) when available.
  const lighthouseAvg = pagespeed
    ? average([pagespeed.performance, pagespeed.accessibility, pagespeed.bestPractices, pagespeed.seo])
    : null;

  // Our HTML standards checklist (0-100).
  const checksScore = calculateWebsiteChecksScore(website);

  // If there is no website, don’t fabricate a score.
  if (website.weaknessNotes.includes('No website found')) return null;

  // Blend: Lighthouse tends to be the best proxy for “modern standards” when present.
  if (lighthouseAvg === null) return checksScore;
  return Math.round(lighthouseAvg * 0.75 + checksScore * 0.25);
}

export function calculateFoursquareScore(
  rating: number | null,
  popularity: number | null
): number | null {
  if (rating === null && popularity === null) {
    return null;
  }

  let score = 0;

  // Rating contribution (0-10 scale -> 0-100 scale)
  if (rating !== null) {
    score += (rating / 10) * 70;
  }

  // Popularity contribution (normalized, assuming max popularity ~100)
  if (popularity !== null) {
    score += Math.min(30, (popularity / 100) * 30);
  }

  return Math.round(Math.min(100, score));
}

export function calculateFinalScore(
  pagespeedScore: number | null,
  foursquareScore: number | null
): number | null {
  const scores = [pagespeedScore, foursquareScore].filter(
    (s): s is number => s !== null
  );

  if (scores.length === 0) {
    return null;
  }

  // Calculate median
  scores.sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  const median =
    scores.length % 2 === 0
      ? (scores[mid - 1] + scores[mid]) / 2
      : scores[mid];

  return Math.round(median);
}

export function calculateOpportunityScore(
  pagespeedResult: PageSpeedResult | null,
  websiteAnalysis: WebsiteAnalysis,
  foursquareRating: number | null,
  foursquarePopularity: number | null,
  foursquareMeta?: { fsq_id?: string; match_confidence?: number | null }
): AnalysisBreakdown {
  const weaknessNotes: string[] = [...websiteAnalysis.weaknessNotes];

  // PageSpeed score
  const pagespeedScore = pagespeedResult?.performance ?? null;
  const noWebsite = websiteAnalysis.weaknessNotes.includes('No website found');
  if (pagespeedResult) {
    if (pagespeedScore !== null && pagespeedScore < 50) {
      weaknessNotes.push(`Low PageSpeed score: ${pagespeedScore}/100`);
    }
    if (!pagespeedResult.mobileFriendly) {
      weaknessNotes.push('Not mobile-friendly');
    }
    if (
      pagespeedResult.desktopPerformance !== undefined &&
      pagespeedResult.desktopPerformance < 50
    ) {
      weaknessNotes.push(`Low desktop PageSpeed: ${pagespeedResult.desktopPerformance}/100`);
    }
  } else if (!noWebsite) {
    weaknessNotes.push('PageSpeed unavailable (check GOOGLE_API_KEY or API quota)');
  }

  // Core Web Vitals (rough thresholds)
  const lcp = pagespeedResult?.coreWebVitals?.lcp; // ms
  const cls = pagespeedResult?.coreWebVitals?.cls; // unitless
  const inp = pagespeedResult?.coreWebVitals?.inp; // ms (field data)
  if (typeof lcp === 'number' && lcp > 4000) weaknessNotes.push(`Poor LCP: ${Math.round(lcp)}ms`);
  if (typeof cls === 'number' && cls > 0.25) weaknessNotes.push(`High CLS: ${cls}`);
  if (typeof inp === 'number' && inp > 500) weaknessNotes.push(`Poor INP: ${Math.round(inp)}ms`);

  // Foursquare score
  const foursquareScore = calculateFoursquareScore(foursquareRating, foursquarePopularity);
  if (foursquareScore === null) {
    weaknessNotes.push('No Foursquare presence');
  } else if (foursquareScore < 50) {
    weaknessNotes.push(`Low Foursquare authority: ${foursquareScore}/100`);
  }
  if (
    typeof foursquareMeta?.match_confidence === 'number' &&
    foursquareMeta.match_confidence < 0.5
  ) {
    weaknessNotes.push('Low confidence Foursquare match');
  }

  // Final score (median of available scores)
  const finalScore = calculateFinalScore(pagespeedScore, foursquareScore);
  const webStandardsScore = calculateWebStandardsScore(pagespeedResult, websiteAnalysis);

  return {
    pagespeed_score: pagespeedScore,
    foursquare_score: foursquareScore,
    final_score: finalScore,
    web_standards_score: webStandardsScore,
    weakness_notes: weaknessNotes,
    pagespeed: pagespeedResult,
    website: websiteAnalysis,
    foursquare: {
      fsq_id: foursquareMeta?.fsq_id,
      rating: foursquareRating,
      popularity: foursquarePopularity,
      match_confidence: foursquareMeta?.match_confidence ?? null,
    },
  };
}

