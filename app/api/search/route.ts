import { NextRequest, NextResponse } from 'next/server';
import { searchGooglePlaces, getPlaceDetails } from '@/lib/google';
import { searchFoursquare } from '@/lib/foursquare';
import { db } from '@/lib/db';

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

    // Build search query
    // If user only provides a place name (e.g. "London"), Google Text Search often returns
    // the place itself instead of actual businesses. Default to "businesses in <location>"
    // when no filters are provided.
    let query = location;
    if (!category && !keywords) {
      query = `businesses in ${location}`;
    } else {
      if (category) {
        query = `${category} ${query}`;
      }
      if (keywords) {
        query = `${keywords} ${query}`;
      }
    }

    // Search Google Places
    console.log('Searching Google Places with query:', query);
    const places = await searchGooglePlaces(query, undefined, undefined, category || undefined);
    console.log('Google Places returned:', places.length, 'results');

    if (places.length === 0) {
      console.warn('No places found for query:', query);
      return NextResponse.json({ businesses: [] });
    }

    // Limit results
    const limitedPlaces = places.slice(0, limit);
    console.log('Processing', limitedPlaces.length, 'places');

    // Get details for each place and upsert to database
    const businesses = await Promise.all(
      limitedPlaces.map(async (place) => {
        try {
          const details = await getPlaceDetails(place.place_id);
          const placeData = details || place;

          // Upsert business
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

          // Store source snapshot (delete old and create new for simplicity)
          await db.sourceSnapshot.deleteMany({
            where: {
              businessId: business.id,
              provider: 'google',
            },
          });
          await db.sourceSnapshot.create({
            data: {
              businessId: business.id,
              provider: 'google',
              raw_data: JSON.stringify(placeData),
            },
          });

        // Enrich with Foursquare
        let foursquareMatch = null;
        const lat = placeData.geometry?.location?.lat;
        const lng = placeData.geometry?.location?.lng;

        if (lat && lng) {
          // Search Foursquare
          try {
            foursquareMatch = await searchFoursquare(
              placeData.name,
              lat,
              lng,
              placeData.formatted_address || location
            );

            if (foursquareMatch) {
              const nameSimilarity = calculateNameSimilarity(placeData.name, foursquareMatch.name);
              const matchConfidence = nameSimilarity;

              await db.business.update({
                where: { id: business.id },
                data: {
                  foursquare_rating: foursquareMatch.rating || null,
                  foursquare_popularity: foursquareMatch.popularity || null,
                  foursquare_match_confidence: matchConfidence,
                },
              });

              // Store Foursquare snapshot
              await db.sourceSnapshot.deleteMany({
                where: {
                  businessId: business.id,
                  provider: 'foursquare',
                },
              });
              await db.sourceSnapshot.create({
                data: {
                  businessId: business.id,
                  provider: 'foursquare',
                  raw_data: JSON.stringify(foursquareMatch),
                },
              });
            }
          } catch (error) {
            console.error('Foursquare enrichment error:', error);
          }
        }

        // Fetch updated business with latest analysis
        const updatedBusiness = await db.business.findUnique({
          where: { id: business.id },
          include: {
            analyses: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        });

          // Parse breakdown from analysis if available
          let breakdown = null;
          if (updatedBusiness!.analyses.length > 0) {
            const analysis = updatedBusiness!.analyses[0];
            if (analysis.breakdown_json) {
              breakdown = JSON.parse(analysis.breakdown_json);
            } else {
              breakdown = {
                pagespeed_score: analysis.pagespeed_score,
                foursquare_score: analysis.foursquare_score,
                final_score: updatedBusiness!.final_score,
                weakness_notes: [],
              };
            }
          }

          return {
            id: updatedBusiness!.id,
            place_id: updatedBusiness!.place_id,
            name: updatedBusiness!.name,
            website: updatedBusiness!.website,
            address: updatedBusiness!.address,
            phone: updatedBusiness!.phone,
            categories: JSON.parse(updatedBusiness!.categories || '[]'),
            google_rating: updatedBusiness!.google_rating,
            google_review_count: updatedBusiness!.google_review_count,
            foursquare_rating: updatedBusiness!.foursquare_rating,
            final_score: updatedBusiness!.final_score,
            checked: updatedBusiness!.checked,
            breakdown,
          };
        } catch (placeError: unknown) {
          console.error(`Error processing place ${place.place_id}:`, placeError);
          if (placeError instanceof Error) {
            console.error('Place error stack:', placeError.stack);
          }
          // Return null for failed places, we'll filter them out
          return null;
        }
      })
    );

    // Filter out null results from failed place processing
    const validBusinesses = businesses.filter((b): b is NonNullable<typeof b> => b !== null);
    console.log('Successfully processed', validBusinesses.length, 'out of', limitedPlaces.length, 'places');

    return NextResponse.json({ businesses: validBusinesses });
  } catch (error: unknown) {
    console.error('Search error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    const message = error instanceof Error ? error.message : 'Failed to search businesses';
    return NextResponse.json(
      { 
        error: message,
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const tokens1 = name1.toLowerCase().split(/\s+/);
  const tokens2 = name2.toLowerCase().split(/\s+/);
  const commonTokens = tokens1.filter((t) => tokens2.includes(t));
  return commonTokens.length / Math.max(tokens1.length, tokens2.length);
}

