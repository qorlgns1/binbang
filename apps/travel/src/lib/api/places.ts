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

export async function searchGooglePlaces(params: SearchPlacesParams): Promise<{
  places: PlaceResult[];
  query: string;
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { places: [], query: params.query };
  }

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
      return { places: [], query: params.query };
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
          ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`
          : undefined,
        placeId: place.id,
      }));

    return { places, query: params.query };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Google Places API request timed out');
    }
    return { places: [], query: params.query };
  } finally {
    clearTimeout(timeoutId);
  }
}
