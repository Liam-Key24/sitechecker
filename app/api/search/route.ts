import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location');
    const category = searchParams.get('category') || '';
    const keywords = searchParams.get('keywords') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Dynamic import so route module loads even if these fail at runtime
    const { searchGooglePlaces, getPlaceDetails } = await import('@/lib/google');
    const { searchFoursquare } = await import('@/lib/foursquare');
    const { db } = await import('@/lib/db');

    let query = location;
    if (!category && !keywords) {
      query = `businesses in ${location}`;
    } else {
      if (category) query = `${category} ${query}`;
      if (keywords) query = `${keywords} ${query}`;
    }

    console.log('Searching Google Places with query:', query, 'limit:', limit);
    const places = await searchGooglePlaces(
      query,
      undefined,
      undefined,
      category || undefined,
      limit
    );
    console.log('Google Places returned:', places.length, 'results');

    if (places.length === 0) {
      return NextResponse.json({ businesses: [] });
    }

    const limitedPlaces = places.slice(0, limit);
    console.log('Processing', limitedPlaces.length, 'places');

    const businesses = await Promise.all(
      limitedPlaces.map(async (place) => {
        try {
          const details = await getPlaceDetails(place.place_id);
          const placeData = details || place;

          const business = await db.business.upsert({
            where: { place_id: placeData.place_id },
            update: {
              name: placeData.name,
              website: placeData.website || null,
              address: placeData.formatted_address || null,
              phone: placeData.formatted_phone_number || null,
              categories: JSON.stringify(placeData.types || []),
              google_rating: placeData.rating || null,
              google_review_count: placeData.user_ratings_total || null,
              last_scanned: new Date(),
            },
            create: {
              place_id: placeData.place_id,
              name: placeData.name,
              website: placeData.website || null,
              address: placeData.formatted_address || null,
              phone: placeData.formatted_phone_number || null,
              categories: JSON.stringify(placeData.types || []),
              google_rating: placeData.rating || null,
              google_review_count: placeData.user_ratings_total || null,
              checked: false,
            },
          });

          await db.sourceSnapshot.deleteMany({
            where: { businessId: business.id, provider: 'google' },
          });
          await db.sourceSnapshot.create({
            data: {
              businessId: business.id,
              provider: 'google',
              raw_data: JSON.stringify(placeData),
            },
          });

          let foursquareMatch = null;
          const lat = placeData.geometry?.location?.lat;
          const lng = placeData.geometry?.location?.lng;
          if (lat != null && lng != null) {
            try {
              foursquareMatch = await searchFoursquare(
                placeData.name,
                lat,
                lng,
                placeData.formatted_address || location
              );
              if (foursquareMatch) {
                const nameSimilarity = calculateNameSimilarity(placeData.name, foursquareMatch.name);
                await db.business.update({
                  where: { id: business.id },
                  data: {
                    foursquare_rating: foursquareMatch.rating ?? null,
                    foursquare_popularity: foursquareMatch.popularity ?? null,
                    foursquare_match_confidence: nameSimilarity,
                  },
                });
                await db.sourceSnapshot.deleteMany({
                  where: { businessId: business.id, provider: 'foursquare' },
                });
                await db.sourceSnapshot.create({
                  data: {
                    businessId: business.id,
                    provider: 'foursquare',
                    raw_data: JSON.stringify(foursquareMatch),
                  },
                });
              }
            } catch (err) {
              console.error('Foursquare enrichment error:', err);
            }
          }

          const updatedBusiness = await db.business.findUnique({
            where: { id: business.id },
            include: {
              analyses: { orderBy: { created_at: 'desc' }, take: 1 },
            },
          });

          if (!updatedBusiness) return null;

          let breakdown: unknown = null;
          if (updatedBusiness.analyses.length > 0) {
            const analysis = updatedBusiness.analyses[0];
            if (analysis.breakdown_json) {
              breakdown = JSON.parse(analysis.breakdown_json);
            } else {
              breakdown = {
                pagespeed_score: analysis.pagespeed_score,
                foursquare_score: analysis.foursquare_score,
                final_score: updatedBusiness.final_score,
                weakness_notes: [],
              };
            }
          }

          return {
            id: updatedBusiness.id,
            place_id: updatedBusiness.place_id,
            name: updatedBusiness.name,
            website: updatedBusiness.website,
            address: updatedBusiness.address,
            phone: updatedBusiness.phone,
            categories: JSON.parse(updatedBusiness.categories || '[]'),
            google_rating: updatedBusiness.google_rating,
            google_review_count: updatedBusiness.google_review_count,
            foursquare_rating: updatedBusiness.foursquare_rating,
            final_score: updatedBusiness.final_score,
            checked: updatedBusiness.checked,
            breakdown,
          };
        } catch (placeError: unknown) {
          console.error(`Error processing place ${place.place_id}:`, placeError);
          return null;
        }
      })
    );

    const validBusinesses = businesses.filter((b): b is NonNullable<typeof b> => b !== null);
    console.log('Successfully processed', validBusinesses.length, 'out of', limitedPlaces.length, 'places');

    return NextResponse.json({ businesses: validBusinesses });
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    console.error('Search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const tokens1 = name1.toLowerCase().split(/\s+/);
  const tokens2 = name2.toLowerCase().split(/\s+/);
  const commonTokens = tokens1.filter((t) => tokens2.includes(t));
  return tokens1.length === 0 && tokens2.length === 0 ? 1 : commonTokens.length / Math.max(tokens1.length, tokens2.length, 1);
}
