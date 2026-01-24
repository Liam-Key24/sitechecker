import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyzePageSpeed } from '@/lib/pagespeed';
import { analyzeWebsite } from '@/lib/analyzer';
import { calculateOpportunityScore } from '@/lib/scorer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

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

    if (!business.website) {
      return NextResponse.json({ error: 'Business has no website' }, { status: 400 });
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

    if (recentAnalysis) {
      const breakdown = recentAnalysis.breakdown_json
        ? JSON.parse(recentAnalysis.breakdown_json)
        : null;

      return NextResponse.json({
        final_score: business.final_score,
        breakdown: breakdown || {
          pagespeed_score: recentAnalysis.pagespeed_score,
          foursquare_score: recentAnalysis.foursquare_score,
          final_score: business.final_score,
          weakness_notes: [],
        },
      });
    }

    // Analyze website
    const [pagespeedResult, websiteAnalysis] = await Promise.all([
      analyzePageSpeed(business.website),
      analyzeWebsite(business.website),
    ]);

    // Calculate scores
    const scoreBreakdown = calculateOpportunityScore(
      pagespeedResult,
      websiteAnalysis,
      business.foursquare_rating,
      business.foursquare_popularity
    );

    // Store analysis
    const analysis = await db.analysis.create({
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
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze website' },
      { status: 500 }
    );
  }
}

