import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyzePageSpeed } from '@/lib/pagespeed';
import { analyzeWebsite } from '@/lib/analyzer';
import { calculateOpportunityScore } from '@/lib/scorer';
import { getFoursquarePlaceDetails, searchFoursquare } from '@/lib/foursquare';
import type { AnalysisBreakdown, WebsiteAnalysis } from '@/lib/contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAnalysisBreakdown(value: unknown): value is AnalysisBreakdown {
  if (!isRecord(value)) return false;
  // minimal shape check; richer fields are optional
  return (
    'pagespeed_score' in value &&
    'foursquare_score' in value &&
    'final_score' in value &&
    'weakness_notes' in value
  );
}

function getGoogleLatLng(raw: unknown): { lat: number; lng: number } | null {
  if (!isRecord(raw)) return null;
  const geometry = raw.geometry;
  if (!isRecord(geometry)) return null;
  const location = geometry.location;
  if (!isRecord(location)) return null;
  const lat = location.lat;
  const lng = location.lng;
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const businessId =
      isRecord(body) && typeof body.businessId === 'string' ? body.businessId : undefined;
    const force = isRecord(body) && typeof body.force === 'boolean' ? body.force : undefined;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // Fetch business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if we have a recent analysis (within 7 days)
    const recentAnalysis = await db.analysis.findFirst({
      where: {
        businessId: business.id,
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (recentAnalysis && !force) {
      const breakdownUnknown: unknown = recentAnalysis.breakdown_json
        ? JSON.parse(recentAnalysis.breakdown_json)
        : null;
      const breakdown = isAnalysisBreakdown(breakdownUnknown) ? breakdownUnknown : null;

      // If this is an older breakdown without richer fields, refresh once.
      const looksLegacy =
        !breakdown ||
        breakdown.pagespeed === undefined ||
        breakdown.website === undefined ||
        breakdown.web_standards_score === undefined;

      if (!looksLegacy) {
        // If Business.final_score was never backfilled, use the breakdown/analysis value.
        const finalFromBreakdown =
          breakdown && typeof breakdown.final_score === 'number'
            ? breakdown.final_score
            : null;

        if (business.final_score === null && finalFromBreakdown !== null) {
          await db.business.update({
            where: { id: business.id },
            data: { final_score: finalFromBreakdown },
          });
        }

        return NextResponse.json({
          final_score: business.final_score ?? finalFromBreakdown,
          breakdown: breakdown || {
            pagespeed_score: recentAnalysis.pagespeed_score,
            foursquare_score: recentAnalysis.foursquare_score,
            final_score: business.final_score ?? finalFromBreakdown,
            weakness_notes: [],
          },
        });
      }

      // fall through to re-analyze
    }

    // Refresh Foursquare authority during analysis (if possible)
    let foursquareRating = business.foursquare_rating;
    let foursquarePopularity = business.foursquare_popularity;
    let foursquareFsqId: string | undefined;
    let foursquareMatchConfidence: number | null = business.foursquare_match_confidence ?? null;

    try {
      const googleSnapshot = await db.sourceSnapshot.findFirst({
        where: { businessId: business.id, provider: 'google' },
        orderBy: { created_at: 'desc' },
      });

      if (googleSnapshot?.raw_data) {
        const googleRaw: unknown = JSON.parse(googleSnapshot.raw_data);
        const ll = getGoogleLatLng(googleRaw);

        if (ll) {
          const match = await searchFoursquare(
            business.name,
            ll.lat,
            ll.lng,
            business.address ?? undefined
          );

          if (match?.fsq_id) {
            foursquareFsqId = match.fsq_id;
            // Basic token overlap similarity (0-1) for a rough confidence.
            const n1 = business.name.toLowerCase().split(/\s+/);
            const n2 = match.name.toLowerCase().split(/\s+/);
            const common = n1.filter((t: string) => n2.includes(t));
            foursquareMatchConfidence = common.length / Math.max(n1.length, n2.length);

            const details = await getFoursquarePlaceDetails(match.fsq_id);
            const payload = details ?? match;

            const newRating =
              typeof payload.rating === 'number' ? payload.rating : foursquareRating;
            const newPopularity =
              typeof payload.popularity === 'number' ? payload.popularity : foursquarePopularity;

            foursquareRating = newRating ?? null;
            foursquarePopularity = newPopularity ?? null;

            await db.business.update({
              where: { id: business.id },
              data: {
                foursquare_rating: foursquareRating,
                foursquare_popularity: foursquarePopularity,
                foursquare_match_confidence: foursquareMatchConfidence,
              },
            });

            await db.sourceSnapshot.deleteMany({
              where: { businessId: business.id, provider: 'foursquare' },
            });
            await db.sourceSnapshot.create({
              data: {
                businessId: business.id,
                provider: 'foursquare',
                raw_data: JSON.stringify(payload),
              },
            });
          }
        }
      }
    } catch (e) {
      console.error('Foursquare refresh error:', e);
    }

    // Analyze website (if present); otherwise run "presence" analysis only.
    const websiteAnalysis: WebsiteAnalysis = business.website
      ? await analyzeWebsite(business.website)
      : {
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

    const pagespeedResult = business.website ? await analyzePageSpeed(business.website) : null;

    // Calculate scores
    const scoreBreakdown = calculateOpportunityScore(
      pagespeedResult,
      websiteAnalysis,
      foursquareRating,
      foursquarePopularity,
      { fsq_id: foursquareFsqId, match_confidence: foursquareMatchConfidence }
    );

    // Store analysis
    await db.analysis.create({
      data: {
        businessId: business.id,
        pagespeed_score: scoreBreakdown.pagespeed_score,
        yelp_score: null,
        foursquare_score: scoreBreakdown.foursquare_score,
        breakdown_json: JSON.stringify(scoreBreakdown),
      },
    });

    // Update business final score
    await db.business.update({
      where: { id: business.id },
      data: {
        final_score: scoreBreakdown.final_score,
      },
    });

    return NextResponse.json({
      final_score: scoreBreakdown.final_score,
      breakdown: scoreBreakdown,
    });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze website';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

