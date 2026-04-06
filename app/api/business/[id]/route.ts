import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from '@/lib/security';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

const ParamsSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rate = checkRateLimit(`api:business:${getClientIp(request)}`, 120, 60_000);
  const rateHeaders = buildRateLimitHeaders(rate);
  const respond = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: rateHeaders });
  if (!rate.allowed) {
    return respond({ error: 'Too many business detail requests. Please slow down.' }, 429);
  }

  try {
    const parsed = ParamsSchema.safeParse(await params);
    if (!parsed.success) {
      return respond({ error: 'Invalid business ID', details: parsed.error.flatten() }, 400);
    }
    const { id } = parsed.data;

    const business = await db.business.findUnique({
      where: { id },
      include: {
        analyses: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!business) {
      return respond({ error: 'Business not found' }, 404);
    }

    let breakdown: unknown = null;
    if (business.analyses.length > 0) {
      const analysis = business.analyses[0];
      if (analysis.breakdown_json) {
        breakdown = JSON.parse(analysis.breakdown_json);
      } else {
        breakdown = {
          pagespeed_score: analysis.pagespeed_score,
          final_score: business.final_score,
          weakness_notes: [],
        };
      }
    }

    return respond({
      id: business.id,
      place_id: business.place_id,
      name: business.name,
      website: business.website,
      address: business.address,
      phone: business.phone,
      categories: JSON.parse(business.categories || '[]'),
      google_rating: business.google_rating,
      google_review_count: business.google_review_count,
      final_score: business.final_score,
      checked: business.checked,
      breakdown,
    });
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    console.error('Business fetch error:', error);
    return respond({ error: message }, 500);
  }
}
