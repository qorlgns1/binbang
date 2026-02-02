export const accommodationKeys = {
  all: ['accommodations'] as const,
  lists: () => [...accommodationKeys.all, 'list'] as const,
  details: () => [...accommodationKeys.all, 'detail'] as const,
  detail: (id: string) => [...accommodationKeys.all, 'detail', id] as const,
  logs: (id: string) => [...accommodationKeys.all, 'detail', id, 'logs'] as const,
};

export const logKeys = {
  all: ['logs'] as const,
  recent: () => [...logKeys.all, 'recent'] as const,
};
