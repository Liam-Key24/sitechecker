import { PageSpeedResult } from './pagespeed';
import { WebsiteAnalysis } from './analyzer';

export interface ScoreBreakdown {
  pagespeed_score: number | null;
  foursquare_score: number | null;
  final_score: number | null;
  weakness_notes: string[];
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
  foursquarePopularity: number | null
): ScoreBreakdown {
  const weaknessNotes: string[] = [...websiteAnalysis.weaknessNotes];

  // PageSpeed score
  const pagespeedScore = pagespeedResult?.performance ?? null;
  if (pagespeedScore !== null && pagespeedScore < 50) {
    weaknessNotes.push(`Low PageSpeed score: ${pagespeedScore}/100`);
  }
  if (!pagespeedResult?.mobileFriendly) {
    weaknessNotes.push('Not mobile-friendly');
  }

  // Foursquare score
  const foursquareScore = calculateFoursquareScore(foursquareRating, foursquarePopularity);
  if (foursquareScore === null) {
    weaknessNotes.push('No Foursquare presence');
  } else if (foursquareScore < 50) {
    weaknessNotes.push(`Low Foursquare authority: ${foursquareScore}/100`);
  }

  // Final score (median of available scores)
  const finalScore = calculateFinalScore(pagespeedScore, foursquareScore);

  return {
    pagespeed_score: pagespeedScore,
    foursquare_score: foursquareScore,
    final_score: finalScore,
    weakness_notes: weaknessNotes,
  };
}

