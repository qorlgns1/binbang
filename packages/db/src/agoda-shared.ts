export const AGODA_SHARED_SCHEMA_ENV_KEY = 'ORACLE_AGODA_SHARED_SCHEMA';
export const DEFAULT_AGODA_SHARED_SCHEMA = 'BINBANG_SHARED';

export const AGODA_HOTELS_TABLE = 'agoda_hotels';
export const AGODA_HOTELS_SEARCH_TABLE = 'agoda_hotels_search';

function readOptionalEnv(key: string): string | null {
  const trimmed = process.env[key]?.trim();
  return trimmed ? trimmed : null;
}

export function getAgodaSharedSchema(): string {
  return readOptionalEnv(AGODA_SHARED_SCHEMA_ENV_KEY) ?? DEFAULT_AGODA_SHARED_SCHEMA;
}

export function quoteOracleIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new Error('Oracle identifier cannot be blank.');
  }
  return `"${trimmed.replace(/"/g, '""')}"`;
}

export function qualifyOracleTable(schema: string, table: string): string {
  return `${quoteOracleIdentifier(schema)}.${quoteOracleIdentifier(table)}`;
}

export function getQualifiedAgodaHotelsTable(): string {
  return qualifyOracleTable(getAgodaSharedSchema(), AGODA_HOTELS_TABLE);
}

export function getQualifiedAgodaHotelsSearchTable(): string {
  return qualifyOracleTable(getAgodaSharedSchema(), AGODA_HOTELS_SEARCH_TABLE);
}
