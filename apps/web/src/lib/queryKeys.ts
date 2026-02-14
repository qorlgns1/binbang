export const accommodationKeys = {
  all: ['accommodations'] as const,
  lists: (): readonly ['accommodations', 'list'] => [...accommodationKeys.all, 'list'] as const,
  details: (): readonly ['accommodations', 'detail'] => [...accommodationKeys.all, 'detail'] as const,
  detail: (id: string): readonly ['accommodations', 'detail', string] =>
    [...accommodationKeys.all, 'detail', id] as const,
  logs: (id: string): readonly ['accommodations', 'detail', string, 'logs'] =>
    [...accommodationKeys.all, 'detail', id, 'logs'] as const,
  prices: (
    id: string,
    filters?: Record<string, string>,
  ): readonly ['accommodations', 'detail', string, 'prices', Record<string, string>] =>
    [...accommodationKeys.all, 'detail', id, 'prices', filters ?? {}] as const,
};

export const logKeys = {
  all: ['logs'] as const,
  recent: (): readonly ['logs', 'recent'] => [...logKeys.all, 'recent'] as const,
};

export const adminKeys = {
  all: ['admin'] as const,
  monitoring: (): readonly ['admin', 'monitoring'] => [...adminKeys.all, 'monitoring'] as const,
  summary: (): readonly ['admin', 'monitoring', 'summary'] => [...adminKeys.monitoring(), 'summary'] as const,
  logs: (filters?: Record<string, string>): readonly ['admin', 'monitoring', 'logs', Record<string, string>] =>
    [...adminKeys.monitoring(), 'logs', filters ?? {}] as const,
  users: (filters?: Record<string, string>): readonly ['admin', 'users', Record<string, string>] =>
    [...adminKeys.all, 'users', filters ?? {}] as const,
  userDetail: (id: string): readonly ['admin', 'users', string] => [...adminKeys.all, 'users', id] as const,
  userActivity: (
    id: string,
    filters?: Record<string, string>,
  ): readonly ['admin', 'users', string, 'activity', Record<string, string>] =>
    [...adminKeys.all, 'users', id, 'activity', filters ?? {}] as const,
  plans: (): readonly ['admin', 'plans'] => [...adminKeys.all, 'plans'] as const,
  auditLogs: (filters?: Record<string, string>): readonly ['admin', 'auditLogs', Record<string, string>] =>
    [...adminKeys.all, 'auditLogs', filters ?? {}] as const,
  settings: (): readonly ['admin', 'settings'] => [...adminKeys.all, 'settings'] as const,
  settingsHistory: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'settings', 'history', Record<string, string>] =>
    [...adminKeys.settings(), 'history', filters ?? {}] as const,
  throughput: (): readonly ['admin', 'throughput'] => [...adminKeys.all, 'throughput'] as const,
  throughputSummary: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'throughput', 'summary', Record<string, string>] =>
    [...adminKeys.throughput(), 'summary', filters ?? {}] as const,
  throughputHistory: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'throughput', 'history', Record<string, string>] =>
    [...adminKeys.throughput(), 'history', filters ?? {}] as const,
  throughputComparison: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'throughput', 'compare', Record<string, string>] =>
    [...adminKeys.throughput(), 'compare', filters ?? {}] as const,
  funnel: (): readonly ['admin', 'funnel'] => [...adminKeys.all, 'funnel'] as const,
  funnelSnapshot: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'funnel', 'snapshot', Record<string, string>] =>
    [...adminKeys.funnel(), 'snapshot', filters ?? {}] as const,
  funnelClicksSnapshot: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'funnel', 'clicks', Record<string, string>] =>
    [...adminKeys.funnel(), 'clicks', filters ?? {}] as const,
  workerQueue: (filters?: Record<string, string>): readonly ['admin', 'worker', 'queue', Record<string, string>] =>
    [...adminKeys.all, 'worker', 'queue', filters ?? {}] as const,
  // Platform Selectors
  selectors: (): readonly ['admin', 'selectors'] => [...adminKeys.all, 'selectors'] as const,
  selectorList: (filters?: Record<string, string>): readonly ['admin', 'selectors', 'list', Record<string, string>] =>
    [...adminKeys.selectors(), 'list', filters ?? {}] as const,
  patterns: (): readonly ['admin', 'patterns'] => [...adminKeys.all, 'patterns'] as const,
  patternList: (filters?: Record<string, string>): readonly ['admin', 'patterns', 'list', Record<string, string>] =>
    [...adminKeys.patterns(), 'list', filters ?? {}] as const,
  selectorHistory: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'selectors', 'history', Record<string, string>] =>
    [...adminKeys.selectors(), 'history', filters ?? {}] as const,
  selectorTestResult: (
    input?: { url: string; checkIn: string; checkOut: string; adults: number } | null,
  ): readonly [
    'admin',
    'selectors',
    'testResult',
    { url: string; checkIn: string; checkOut: string; adults: number } | Record<string, never>,
  ] => [...adminKeys.selectors(), 'testResult', input ?? {}] as const,
  testableAttributes: (): readonly ['admin', 'selectors', 'testableAttributes'] =>
    [...adminKeys.selectors(), 'testableAttributes'] as const,
  // Submissions
  submissions: (filters?: Record<string, string>): readonly ['admin', 'submissions', Record<string, string>] =>
    [...adminKeys.all, 'submissions', filters ?? {}] as const,
  submissionDetail: (id: string): readonly ['admin', 'submissions', string] =>
    [...adminKeys.all, 'submissions', id] as const,
  // Intake form question mappings
  formQuestionMappings: (): readonly ['admin', 'formQuestionMappings'] =>
    [...adminKeys.all, 'formQuestionMappings'] as const,
  formQuestionMappingList: (
    filters?: Record<string, string>,
  ): readonly ['admin', 'formQuestionMappings', 'list', Record<string, string>] =>
    [...adminKeys.formQuestionMappings(), 'list', filters ?? {}] as const,
  // Cases
  cases: (filters?: Record<string, string>): readonly ['admin', 'cases', Record<string, string>] =>
    [...adminKeys.all, 'cases', filters ?? {}] as const,
  caseDetail: (id: string): readonly ['admin', 'cases', string] => [...adminKeys.all, 'cases', id] as const,
};

export const heartbeatKeys = {
  all: ['heartbeat'] as const,
  status: (): readonly ['heartbeat', 'status'] => [...heartbeatKeys.all, 'status'] as const,
  history: (): readonly ['heartbeat', 'history'] => [...heartbeatKeys.all, 'history'] as const,
};

export const planKeys = {
  all: ['plans'] as const,
  list: (): readonly ['plans', 'list'] => [...planKeys.all, 'list'] as const,
};

export const userKeys = {
  all: ['user'] as const,
  quota: (): readonly ['user', 'quota'] => [...userKeys.all, 'quota'] as const,
  subscription: (): readonly ['user', 'subscription'] => [...userKeys.all, 'subscription'] as const,
  tutorial: (): readonly ['user', 'tutorial'] => [...userKeys.all, 'tutorial'] as const,
};
