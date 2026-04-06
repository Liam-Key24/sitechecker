import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { analyzePageSpeed } from '@/lib/pagespeed';
import { analyzeWebsite } from '@/lib/analyzer';
import { calculateOpportunityScore } from '@/lib/scorer';
import type { AnalysisBreakdown, WebsiteAnalysis } from '@/lib/contracts';
import {
  SECURITY_LIMITS,
  checkRateLimit,
  buildRateLimitHeaders,
  getClientIp,
  validateExternalWebsiteUrl,
} from '@/lib/security';
import { isUpstreamBudgetExceededError } from '@/lib/spendGuard';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAnalysisBreakdown(value: unknown): value is AnalysisBreakdown {
  if (!isRecord(value)) return false;
  return (
    'pagespeed_score' in value &&
    'final_score' in value &&
    'weakness_notes' in value &&
    Array.isArray(value.weakness_notes)
  );
}

const AnalyseBodySchema = z.object({
  businessId: z.string().trim().min(1).max(SECURITY_LIMITS.ANALYSE.MAX_BUSINESS_ID_CHARS),
  force: z.boolean().optional().default(false),
});

const inFlightAnalyses = new Set<string>();

function buildEmptyWebsiteAnalysis(reason: string): WebsiteAnalysis {
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
    weaknessNotes: [reason],
  };
}

function parseStoredBreakdown(raw: string | null): AnalysisBreakdown | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAnalysisBreakdown(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function looksLegacyBreakdown(breakdown: AnalysisBreakdown | null): boolean {
  return (
    !breakdown ||
    breakdown.pagespeed === undefined ||
    breakdown.website === undefined ||
    breakdown.web_standards_score === undefined
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(
    `api:analyse:${ip}`,
    SECURITY_LIMITS.ANALYSE.RATE_LIMIT_MAX,
    SECURITY_LIMITS.ANALYSE.RATE_LIMIT_WINDOW_MS
  );
  const rateHeaders = buildRateLimitHeaders(rate);
  const respond = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: rateHeaders });

  if (!rate.allowed) {
    return respond({ error: 'Too many analysis requests. Please slow down.' }, 429);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return respond({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = AnalyseBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return respond({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }

  const { businessId, force } = parsed.data;

  if (inFlightAnalyses.has(businessId)) {
    return respond(
      { error: 'Analysis already in progress for this business. Please retry shortly.' },
      429
    );
  }
  inFlightAnalyses.add(businessId);

  try {
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return respond({ error: 'Business not found' }, 404);
    }

    const latestAnalysis = await db.analysis.findFirst({
      where: {
        businessId: business.id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const isMockBusiness = business.place_id.startsWith('mock:');
    if (isMockBusiness) {
      const mockBreakdown = parseStoredBreakdown(latestAnalysis?.breakdown_json ?? null);
      return respond({
        final_score: business.final_score ?? mockBreakdown?.final_score ?? null,
        breakdown: mockBreakdown,
        cached: true,
        mock: true,
      });
    }

    if (latestAnalysis) {
      const breakdown = parseStoredBreakdown(latestAnalysis.breakdown_json);
      const isLegacy = looksLegacyBreakdown(breakdown);

      if (!isLegacy) {
        const finalFromBreakdown =
          breakdown && typeof breakdown.final_score === 'number' ? breakdown.final_score : null;

        if (business.final_score === null && finalFromBreakdown !== null) {
          await db.business.update({
            where: { id: business.id },
            data: { final_score: finalFromBreakdown },
          });
        }

        const cachedPayload = {
          final_score: business.final_score ?? finalFromBreakdown,
          breakdown,
        };

        const now = Date.now();
        const ageMs = now - latestAnalysis.created_at.getTime();
        const withinRecentTtl = ageMs <= SECURITY_LIMITS.ANALYSE.RECENT_ANALYSIS_TTL_MS;
        const withinCooldown = ageMs <= SECURITY_LIMITS.ANALYSE.MIN_REANALYZE_INTERVAL_MS;

        if (
          withinCooldown &&
          (!force || !SECURITY_LIMITS.ANALYSE.ALLOW_FORCE_BYPASS_COOLDOWN)
        ) {
          return respond({
            ...cachedPayload,
            cached: true,
            cooldown_active: true,
          });
        }

        if (withinRecentTtl && !force) {
          return respond({
            ...cachedPayload,
            cached: true,
          });
        }
      }
    }

    let analysisUrl: string | null = null;
    if (business.website) {
      const urlCheck = validateExternalWebsiteUrl(business.website);
      if (urlCheck.ok) analysisUrl = urlCheck.normalizedUrl;
    }

    const websiteAnalysis: WebsiteAnalysis = analysisUrl
      ? await analyzeWebsite(analysisUrl)
      : buildEmptyWebsiteAnalysis(
          business.website ? 'Website URL blocked by security policy' : 'No website found'
        );

    const pagespeedResult = analysisUrl ? await analyzePageSpeed(analysisUrl) : null;

    const scoreBreakdown = calculateOpportunityScore(pagespeedResult, websiteAnalysis);

    await db.analysis.create({
      data: {
        businessId: business.id,
        pagespeed_score: scoreBreakdown.pagespeed_score,
        yelp_score: null,
        breakdown_json: JSON.stringify(scoreBreakdown),
      },
    });

    await db.business.update({
      where: { id: business.id },
      data: {
        final_score: scoreBreakdown.final_score,
      },
    });

    return respond({
      final_score: scoreBreakdown.final_score,
      breakdown: scoreBreakdown,
    });
  } catch (error: unknown) {
    if (isUpstreamBudgetExceededError(error)) {
      return NextResponse.json(
        { error: error.message, code: 'UPSTREAM_BUDGET_EXCEEDED' },
        {
          status: 429,
          headers: {
            ...rateHeaders,
            'Retry-After': String(error.retryAfterSec),
          },
        }
      );
    }
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze website';
    return respond({ error: message }, 500);
  } finally {
    inFlightAnalyses.delete(businessId);
  }
}
