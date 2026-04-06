import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  SECURITY_LIMITS,
  checkRateLimit,
  buildRateLimitHeaders,
  getClientIp,
} from '@/lib/security';

const StatusBodySchema = z.object({
  businessId: z.string().trim().min(1).max(SECURITY_LIMITS.STATUS.MAX_BUSINESS_ID_CHARS),
  checked: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(
    `api:status:${ip}`,
    SECURITY_LIMITS.STATUS.RATE_LIMIT_MAX,
    SECURITY_LIMITS.STATUS.RATE_LIMIT_WINDOW_MS
  );
  const rateHeaders = buildRateLimitHeaders(rate);
  const respond = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: rateHeaders });

  if (!rate.allowed) {
    return respond({ error: 'Too many status update requests. Please slow down.' }, 429);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return respond({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = StatusBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return respond({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }

  const { businessId, checked } = parsed.data;

  try {
    const business = await db.business.update({
      where: { id: businessId },
      data: { checked },
    });

    return respond({ success: true, checked: business.checked });
  } catch (error: unknown) {
    console.error('Status update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update status';
    return respond({ error: message }, 500);
  }
}

