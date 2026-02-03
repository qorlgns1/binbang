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

export const adminKeys = {
  all: ['admin'] as const,
  monitoring: () => [...adminKeys.all, 'monitoring'] as const,
  summary: () => [...adminKeys.monitoring(), 'summary'] as const,
  logs: (filters?: Record<string, string>) => [...adminKeys.monitoring(), 'logs', filters ?? {}] as const,
  users: (filters?: Record<string, string>) => [...adminKeys.all, 'users', filters ?? {}] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  settingsHistory: (filters?: Record<string, string>) => [...adminKeys.settings(), 'history', filters ?? {}] as const,
};
