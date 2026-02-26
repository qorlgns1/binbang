import { InternalServerError } from '@workspace/shared/errors';

import { AWIN_API_BASE, fetchPublisherId, getAwinToken } from '@/lib/awin';

import { upsertFromProgrammes } from './affiliate-advertiser.service';

// ============================================================================
// Types
// ============================================================================

export interface AwinApiResult {
  ok: boolean;
  status?: number;
  statusText?: string;
  message?: string;
  error?: string;
  hint?: string;
  detail?: string;
  body?: unknown;
}

export interface GenerateLinkInput {
  advertiserId: number;
  destinationUrl?: string;
  clickref?: string;
  shorten?: boolean;
}

export interface ListOffersInput {
  page: number;
  pageSize: number;
  membership: 'joined' | 'notJoined' | 'all';
  type: 'promotion' | 'voucher' | 'all';
  status: 'active' | 'expiringSoon' | 'upcoming';
}

export interface ListProgrammesInput {
  relationship: 'joined' | 'pending' | 'suspended' | 'rejected' | 'notjoined';
  countryCode?: string;
}

export interface ListTransactionsInput {
  startDate: string;
  endDate: string;
  advertiserId?: string;
  status?: 'pending' | 'approved' | 'declined' | 'deleted';
  dateType?: 'transaction' | 'validation' | 'amendment';
  timezone?: string;
  showBasketProducts?: boolean;
}

export interface AdvertiserReportInput {
  startDate: string;
  endDate: string;
  region: string;
  dateType?: 'transaction' | 'validation';
  timezone?: string;
}

export interface ProgrammeDetailsInput {
  advertiserId: number;
  relationship?: 'joined' | 'pending' | 'notjoined';
}

export interface SyncAdvertisersResult {
  message: string;
  created: number;
  updated: number;
}

interface DateChunk {
  startDate: string;
  endDate: string;
}

const MAX_AWIN_TRANSACTION_RANGE_DAYS = 31;
const MAX_AWIN_CALLS_PER_MINUTE = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

// ============================================================================
// Helpers
// ============================================================================

function requireToken(): string {
  const token = getAwinToken();
  if (!token) {
    throw new AwinConfigError('AWIN_API_TOKEN is not set');
  }
  return token;
}

async function requirePublisherId(token: string): Promise<number> {
  const publisherId = await fetchPublisherId(token);
  if (publisherId == null) {
    throw new AwinConfigError('Could not get publisher account.');
  }
  return publisherId;
}

async function callAwinApi(url: URL, options?: { method?: string; body?: unknown }): Promise<AwinApiResult> {
  const token = url.searchParams.get('accessToken') ?? '';
  const method = options?.method ?? 'GET';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    next: { revalidate: 0 },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 500) };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      statusText: res.statusText,
      body: data,
    };
  }

  return {
    ok: true,
    status: res.status,
    body: data,
  };
}

function parseUtcDateOnly(value: string): Date {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText ?? '', 10);
  const month = Number.parseInt(monthText ?? '', 10);
  const day = Number.parseInt(dayText ?? '', 10);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function splitDateRangeIntoChunks(startDate: string, endDate: string): DateChunk[] {
  const start = parseUtcDateOnly(startDate);
  const end = parseUtcDateOnly(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }
  if (start.getTime() > end.getTime()) {
    return [];
  }

  const chunks: DateChunk[] = [];
  let cursor = start;

  while (cursor.getTime() <= end.getTime()) {
    const candidateEnd = addUtcDays(cursor, MAX_AWIN_TRANSACTION_RANGE_DAYS - 1);
    const chunkEnd = candidateEnd.getTime() > end.getTime() ? end : candidateEnd;

    chunks.push({
      startDate: formatUtcDateOnly(cursor),
      endDate: formatUtcDateOnly(chunkEnd),
    });

    cursor = addUtcDays(chunkEnd, 1);
  }

  return chunks;
}

function extractTransactions(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.filter((item): item is Record<string, unknown> => typeof item === 'object' && item != null);
  }

  if (body && typeof body === 'object') {
    const boxed = body as { transactions?: unknown; data?: unknown };
    const candidate = Array.isArray(boxed.transactions)
      ? boxed.transactions
      : Array.isArray(boxed.data)
        ? boxed.data
        : [];
    return candidate.filter((item): item is Record<string, unknown> => typeof item === 'object' && item != null);
  }

  return [];
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function enforceAwinRateLimit(callTimestamps: number[]): Promise<void> {
  const now = Date.now();
  while (callTimestamps.length > 0 && now - callTimestamps[0] >= MS_PER_MINUTE) {
    callTimestamps.shift();
  }

  if (callTimestamps.length < MAX_AWIN_CALLS_PER_MINUTE) {
    return;
  }

  const oldest = callTimestamps[0] ?? now;
  const waitMs = Math.max(0, MS_PER_MINUTE - (now - oldest) + 50);
  if (waitMs > 0) {
    await sleep(waitMs);
  }

  const resumedAt = Date.now();
  while (callTimestamps.length > 0 && resumedAt - callTimestamps[0] >= MS_PER_MINUTE) {
    callTimestamps.shift();
  }
}

async function callAwinTransactionsChunk(
  token: string,
  publisherId: number,
  input: ListTransactionsInput,
): Promise<AwinApiResult> {
  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/transactions/`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('startDate', `${input.startDate}T00:00:00`);
  url.searchParams.set('endDate', `${input.endDate}T23:59:59`);
  if (input.advertiserId) url.searchParams.set('advertiserId', input.advertiserId);
  if (input.status) url.searchParams.set('status', input.status);
  if (input.dateType) url.searchParams.set('dateType', input.dateType);
  if (input.timezone) url.searchParams.set('timezone', input.timezone);
  if (input.showBasketProducts) url.searchParams.set('showBasketProducts', 'true');

  return callAwinApi(url);
}

// ============================================================================
// Error class
// ============================================================================

export class AwinConfigError extends Error {
  constructor(
    message: string,
    public hint?: string,
  ) {
    super(message);
    this.name = 'AwinConfigError';
  }
}

// ============================================================================
// Service Functions
// ============================================================================

export async function testAwinConnection(): Promise<AwinApiResult> {
  const token = requireToken();
  const url = new URL(`${AWIN_API_BASE}/accounts`);
  url.searchParams.set('accessToken', token);
  const result = await callAwinApi(url);

  if (!result.ok && result.status === 401) {
    result.hint = 'Token may be invalid or revoked. Regenerate at https://ui.awin.com/awin-api';
  }
  if (result.ok) {
    result.message = 'Awin API token is valid. Accounts list retrieved.';
  }
  return result;
}

export async function generateAwinLink(input: GenerateLinkInput): Promise<AwinApiResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);

  const apiBody: Record<string, unknown> = { advertiserId: input.advertiserId };
  if (input.destinationUrl) apiBody.destinationUrl = input.destinationUrl;
  if (input.clickref) apiBody.parameters = { clickref: input.clickref };
  if (input.shorten === true) apiBody.shorten = true;

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/linkbuilder/generate`);
  url.searchParams.set('accessToken', token);

  const result = await callAwinApi(url, { method: 'POST', body: apiBody });
  if (result.ok) result.message = 'Link generated.';
  return result;
}

export async function listAwinOffers(input: ListOffersInput): Promise<AwinApiResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);

  const apiBody = {
    filters: { membership: input.membership, type: input.type, status: input.status },
    pagination: { page: input.page, pageSize: input.pageSize },
  };

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/promotions`);
  url.searchParams.set('accessToken', token);

  const result = await callAwinApi(url, { method: 'POST', body: apiBody });
  if (result.ok) result.message = 'Offers retrieved.';
  return result;
}

export async function listAwinProgrammes(input: ListProgrammesInput): Promise<AwinApiResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmes`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('relationship', input.relationship);
  if (input.countryCode) url.searchParams.set('countryCode', input.countryCode);

  const result = await callAwinApi(url);
  if (result.ok) result.message = `Programmes (relationship=${input.relationship}) retrieved.`;
  return result;
}

export async function listAwinTransactions(input: ListTransactionsInput): Promise<AwinApiResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);
  const chunks = splitDateRangeIntoChunks(input.startDate, input.endDate);

  if (chunks.length === 0) {
    return {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      message: 'Invalid date range',
      error: 'startDate must be <= endDate and both must be valid yyyy-MM-dd',
    };
  }

  if (chunks.length === 1) {
    const result = await callAwinTransactionsChunk(token, publisherId, input);
    if (result.ok) result.message = 'Transactions retrieved.';
    return result;
  }

  const callTimestamps: number[] = [];
  const mergedTransactions: Record<string, unknown>[] = [];
  const chunkSummaries: Array<{ index: number; startDate: string; endDate: string; count: number }> = [];

  for (const [index, chunk] of chunks.entries()) {
    await enforceAwinRateLimit(callTimestamps);
    callTimestamps.push(Date.now());

    const chunkResult = await callAwinTransactionsChunk(token, publisherId, {
      ...input,
      startDate: chunk.startDate,
      endDate: chunk.endDate,
    });

    if (!chunkResult.ok) {
      return {
        ...chunkResult,
        message: `Transactions chunk failed (${chunk.startDate}~${chunk.endDate})`,
        detail: `chunk ${index + 1}/${chunks.length}`,
        body: {
          chunk: {
            index: index + 1,
            startDate: chunk.startDate,
            endDate: chunk.endDate,
          },
          partialChunks: chunkSummaries,
          upstream: chunkResult.body,
        },
      };
    }

    const transactions = extractTransactions(chunkResult.body);
    mergedTransactions.push(...transactions);
    chunkSummaries.push({
      index: index + 1,
      startDate: chunk.startDate,
      endDate: chunk.endDate,
      count: transactions.length,
    });
  }

  return {
    ok: true,
    status: 200,
    message: `Transactions retrieved across ${chunks.length} chunks (<=${MAX_AWIN_CALLS_PER_MINUTE} calls/min).`,
    body: {
      transactions: mergedTransactions,
      chunkCount: chunks.length,
      chunkSizeDays: MAX_AWIN_TRANSACTION_RANGE_DAYS,
      chunks: chunkSummaries,
    },
  };
}

export async function getAwinAdvertiserReport(input: AdvertiserReportInput): Promise<AwinApiResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/reports/advertiser`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('startDate', input.startDate);
  url.searchParams.set('endDate', input.endDate);
  url.searchParams.set('region', input.region);
  if (input.dateType) url.searchParams.set('dateType', input.dateType);
  if (input.timezone) url.searchParams.set('timezone', input.timezone);

  const result = await callAwinApi(url);
  if (result.ok) result.message = 'Advertiser report retrieved.';
  return result;
}

export async function getAwinProgrammeDetails(input: ProgrammeDetailsInput): Promise<AwinApiResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmedetails`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('advertiserId', String(input.advertiserId));
  url.searchParams.set('relationship', input.relationship ?? 'joined');

  const result = await callAwinApi(url);
  if (result.ok) result.message = 'Programme details retrieved.';
  return result;
}

export async function syncAwinAdvertisers(): Promise<SyncAdvertisersResult> {
  const token = requireToken();
  const publisherId = await requirePublisherId(token);

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmes`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('relationship', 'joined');

  const result = await callAwinApi(url);
  if (!result.ok) {
    throw new InternalServerError(
      `Awin programmes fetch failed: ${result.status} ${(result.body as { raw?: string })?.raw ?? ''}`.slice(0, 300),
    );
  }

  const data = result.body as { programmes?: Array<{ id: number; name?: string }> };
  const programmes = (data.programmes ?? data) as Array<{
    id?: number;
    advertiserId?: number;
    name?: string;
  }>;

  const list = Array.isArray(programmes)
    ? programmes
        .map((p) => ({
          advertiserId: p.advertiserId ?? p.id ?? 0,
          name: p.name ?? String(p.advertiserId ?? p.id ?? ''),
        }))
        .filter((p) => Number.isInteger(p.advertiserId) && p.advertiserId > 0)
    : [];

  if (list.length === 0) {
    return { message: 'No programmes returned', created: 0, updated: 0 };
  }

  const { created, updated } = await upsertFromProgrammes({ programmes: list });
  return { message: 'Sync complete', created, updated };
}
