const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  console.warn('GOOGLE_API_KEY (or legacy GOOGLE_MAPS_API_KEY) is not set');
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  website?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/** Delay before using next_page_token (Google requires a short delay). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchGooglePlaces(
  query: string,
  location?: string,
  radius?: number,
  type?: string,
  maxResults: number = 20
): Promise<GooglePlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  // Build query - if type is provided, use it as a filter, otherwise search for businesses in location
  let searchQuery = query;
  if (type && !query.toLowerCase().includes(type.toLowerCase())) {
    searchQuery = `${type} in ${query}`;
  }

  const baseParams: Record<string, string> = {
    query: searchQuery,
    key: GOOGLE_PLACES_API_KEY,
    ...(location && { location }),
    ...(radius && { radius: radius.toString() }),
  };

  const allResults: GooglePlaceResult[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams(
      nextPageToken ? { pagetoken: nextPageToken, key: GOOGLE_PLACES_API_KEY } : baseParams
    );
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
    console.log('Google Places API page request:', url.replace(GOOGLE_PLACES_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API HTTP error:', response.status, errorText);
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(`Google Places API: Billing not enabled. Please enable billing in Google Cloud Console: ${data.error_message || ''}`);
      }
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }

    if (data.status === 'ZERO_RESULTS' && allResults.length === 0) {
      console.warn('Google Places API returned zero results for query:', query);
      return [];
    }

    const pageResults = data.results || [];
    allResults.push(...pageResults);

    nextPageToken = data.next_page_token;
    if (nextPageToken && allResults.length < maxResults) {
      await delay(2000);
    } else {
      nextPageToken = undefined;
    }
  } while (nextPageToken);

  const capped = allResults.slice(0, maxResults);
  console.log('Google Places API total returned:', capped.length, 'results (requested max', maxResults, ')');
  return capped;
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_PLACES_API_KEY,
    fields: 'place_id,name,website,formatted_address,formatted_phone_number,types,rating,user_ratings_total,geometry',
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    console.error(`Google Places Details API error: ${data.status} - ${data.error_message || ''}`);
    return null;
  }

  return data.result || null;
}

