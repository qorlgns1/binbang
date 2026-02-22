import { generateCacheKey, getCachedOrFetch } from '@/services/cache.service';
import { isAbortError, withAbortTimeout } from '@/lib/withTimeout';

export interface SearchPlacesParams {
  query: string;
  location?: string;
  type?: string;
}

export interface PlaceResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: string;
  types: string[];
  photoUrl?: string;
  placeId: string;
}

const FETCH_TIMEOUT_MS = 10000;
const PLACES_CACHE_FRESH_TTL = 86400; // 24 hours
const PLACES_CACHE_STALE_TTL = 86400; // stale-if-error window
const PLACES_TTL_JITTER_RATIO = 0.1;

export async function searchGooglePlaces(params: SearchPlacesParams): Promise<{
  places: PlaceResult[];
  query: string;
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { places: [], query: params.query };
  }

  const cacheKey = generateCacheKey('places', params);
  try {
    return await getCachedOrFetch({
      key: cacheKey,
      logLabel: 'places',
      freshTtlSeconds: PLACES_CACHE_FRESH_TTL,
      staleTtlSeconds: PLACES_CACHE_STALE_TTL,
      jitterRatio: PLACES_TTL_JITTER_RATIO,
      fetcher: async () => fetchPlacesFromApi(params, apiKey),
    });
  } catch (error) {
    console.error('Google Places API fetch failed:', error);
    return { places: [], query: params.query };
  }
}

async function fetchPlacesFromApi(
  params: SearchPlacesParams,
  apiKey: string,
): Promise<{ places: PlaceResult[]; query: string }> {
  const searchQuery = params.location ? `${params.query} in ${params.location}` : params.query;

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const body = {
    textQuery: searchQuery,
    maxResultCount: 5,
    languageCode: 'en',
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask':
      'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos,places.id',
  };

  try {
    const response = await withAbortTimeout(FETCH_TIMEOUT_MS, (signal) =>
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      }),
    );

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Google Places API error (${response.status}): ${responseText}`);
    }

    const data = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        rating?: number;
        userRatingCount?: number;
        priceLevel?: string;
        types?: string[];
        photos?: Array<{ name: string }>;
      }>;
    };

    const places: PlaceResult[] = (data.places ?? [])
      .filter(
        (place): place is typeof place & { location: { latitude: number; longitude: number } } =>
          place.location?.latitude != null && place.location?.longitude != null,
      )
      .map((place) => ({
        name: place.displayName?.text ?? 'Unknown',
        address: place.formattedAddress ?? '',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        priceLevel: place.priceLevel,
        types: place.types ?? [],
        photoUrl: place.photos?.[0]
          ? `/api/place-photo?photoName=${encodeURIComponent(place.photos[0].name)}&maxHeightPx=400&maxWidthPx=600`
          : undefined,
        placeId: place.id,
      }));

    const result = { places, query: params.query };
    return result;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error('Google Places API request timed out');
    }
    throw error;
  }
}
