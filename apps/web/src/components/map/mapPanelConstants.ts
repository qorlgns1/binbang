export const CLUSTER_THRESHOLD = 12;

export const MAP_LOAD_TIMEOUT_MS = 15000;

export const DEFAULT_CENTER = { lat: 20, lng: 100 };
export const DEFAULT_ZOOM = 3;

export const TYPE_COLORS: Record<string, { background: string; glyph: string }> = {
  place: { background: '#2563eb', glyph: '#ffffff' },
  restaurant: { background: '#f97316', glyph: '#ffffff' },
  accommodation: { background: '#8b5cf6', glyph: '#ffffff' },
  attraction: { background: '#10b981', glyph: '#ffffff' },
};

export const TYPE_LABELS: Record<string, string> = {
  place: '장소',
  restaurant: '음식점',
  accommodation: '숙소',
  attraction: '관광지',
};
