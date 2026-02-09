import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { id },
      include: {
        analyses: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let breakdown: unknown = null;
    if (business.analyses.length > 0) {
      const analysis = business.analyses[0];
      if (analysis.breakdown_json) {
        breakdown = JSON.parse(analysis.breakdown_json);
      } else {
        breakdown = {
          pagespeed_score: analysis.pagespeed_score,
          foursquare_score: analysis.foursquare_score,
          final_score: business.final_score,
          weakness_notes: [],
        };
      }
    }

    return NextResponse.json({
      id: business.id,
      place_id: business.place_id,
      name: business.name,
      website: business.website,
      address: business.address,
      phone: business.phone,
      categories: JSON.parse(business.categories || '[]'),
      google_rating: business.google_rating,
      google_review_count: business.google_review_count,
      foursquare_rating: business.foursquare_rating,
      final_score: business.final_score,
      checked: business.checked,
      breakdown,
    });
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    console.error('Business fetch error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
