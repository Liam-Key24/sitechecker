const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

if (!FOURSQUARE_API_KEY) {
  console.warn('FOURSQUARE_API_KEY is not set');
}

export interface FoursquarePlace {
  fsq_id: string;
  name: string;
  rating?: number;
  popularity?: number;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
  };
  geocodes?: {
    main?: {
      latitude: number;
      longitude: number;
    };
  };
  categories?: Array<{
    id: number;
    name: string;
  }>;
}

export async function searchFoursquare(
  name: string,
  latitude: number,
  longitude: number,
  location?: string
): Promise<FoursquarePlace | null> {
  if (!FOURSQUARE_API_KEY) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      query: name,
      ll: `${latitude},${longitude}`,
      limit: '5',
    });
    // Ask for the fields we care about, if supported.
    params.set(
      'fields',
      'fsq_id,name,rating,popularity,location,categories,geocodes'
    );

    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?${params.toString()}`,
      {
        headers: {
          Authorization: FOURSQUARE_API_KEY,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Foursquare API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Simple name matching
    const normalizedName = name.toLowerCase().trim();
    const matches = data.results
      .map((p: FoursquarePlace) => ({
        place: p,
        score: calculateMatchScore(normalizedName, p.name.toLowerCase(), location, p.location),
      }))
      .filter((m: { score: number }) => m.score > 0.5)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    return matches.length > 0 ? matches[0].place : null;
  } catch (error) {
    console.error('Foursquare search error:', error);
    return null;
  }
}

export async function getFoursquarePlaceDetails(
  fsqId: string
): Promise<FoursquarePlace | null> {
  if (!FOURSQUARE_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      fields: 'fsq_id,name,rating,popularity,location,categories,geocodes',
    });

    const response = await fetch(
      `https://api.foursquare.com/v3/places/${encodeURIComponent(fsqId)}?${params.toString()}`,
      {
        headers: {
          Authorization: FOURSQUARE_API_KEY,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Foursquare details API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as FoursquarePlace;
  } catch (error) {
    console.error('Foursquare details error:', error);
    return null;
  }
}

function calculateMatchScore(
  searchName: string,
  placeName: string,
  searchLocation: string | undefined,
  placeLocation: { locality?: string } | null | undefined
): number {
  let score = 0;

  // Name similarity
  const searchTokens = searchName.split(/\s+/);
  const placeTokens = placeName.split(/\s+/);
  const commonTokens = searchTokens.filter((t) => placeTokens.includes(t));
  score += (commonTokens.length / Math.max(searchTokens.length, placeTokens.length)) * 0.7;

  // Location similarity
  if (searchLocation && placeLocation?.locality) {
    const searchLocLower = searchLocation.toLowerCase();
    if (searchLocLower.includes(placeLocation.locality.toLowerCase())) {
      score += 0.3;
    }
  }

  return score;
}

