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

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
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

  const places: PlaceResult[] = (data.places ?? []).map((place) => ({
    name: place.displayName?.text ?? 'Unknown',
    address: place.formattedAddress ?? '',
    latitude: place.location?.latitude ?? 0,
    longitude: place.location?.longitude ?? 0,
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
}
