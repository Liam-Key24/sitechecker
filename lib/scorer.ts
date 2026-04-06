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
  const lighthouseAvg = pagespeed
    ? average([pagespeed.performance, pagespeed.accessibility, pagespeed.bestPractices, pagespeed.seo])
    : null;

  const checksScore = calculateWebsiteChecksScore(website);

  if (website.weaknessNotes.includes('No website found')) return null;

  if (lighthouseAvg === null) return checksScore;
  return Math.round(lighthouseAvg * 0.75 + checksScore * 0.25);
}

/** Blend PageSpeed performance with on-page web standards (0–100 each). */
export function calculateFinalScore(
  pagespeedScore: number | null,
  webStandardsScore: number | null
): number | null {
  const scores = [pagespeedScore, webStandardsScore].filter(
    (s): s is number => typeof s === 'number' && Number.isFinite(s)
  );
  if (scores.length === 0) return null;
  if (scores.length === 1) return Math.round(scores[0]);
  return Math.round((scores[0] + scores[1]) / 2);
}

export function calculateOpportunityScore(
  pagespeedResult: PageSpeedResult | null,
  websiteAnalysis: WebsiteAnalysis
): AnalysisBreakdown {
  const weaknessNotes: string[] = [...websiteAnalysis.weaknessNotes];

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

  const lcp = pagespeedResult?.coreWebVitals?.lcp;
  const cls = pagespeedResult?.coreWebVitals?.cls;
  const inp = pagespeedResult?.coreWebVitals?.inp;
  if (typeof lcp === 'number' && lcp > 4000) weaknessNotes.push(`Poor LCP: ${Math.round(lcp)}ms`);
  if (typeof cls === 'number' && cls > 0.25) weaknessNotes.push(`High CLS: ${cls}`);
  if (typeof inp === 'number' && inp > 500) weaknessNotes.push(`Poor INP: ${Math.round(inp)}ms`);

  const webStandardsScore = calculateWebStandardsScore(pagespeedResult, websiteAnalysis);
  const finalScore = calculateFinalScore(pagespeedScore, webStandardsScore);

  return {
    pagespeed_score: pagespeedScore,
    final_score: finalScore,
    web_standards_score: webStandardsScore,
    weakness_notes: weaknessNotes,
    pagespeed: pagespeedResult,
    website: websiteAnalysis,
  };
}
