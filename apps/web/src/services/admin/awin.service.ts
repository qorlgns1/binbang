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

  const url = new URL(`${AWIN_API_BASE}/publisher/${publisherId}/promotions`);
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

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/transactions/`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('startDate', `${input.startDate}T00:00:00`);
  url.searchParams.set('endDate', `${input.endDate}T23:59:59`);
  if (input.advertiserId) url.searchParams.set('advertiserId', input.advertiserId);
  if (input.status) url.searchParams.set('status', input.status);
  if (input.dateType) url.searchParams.set('dateType', input.dateType);
  if (input.timezone) url.searchParams.set('timezone', input.timezone);
  if (input.showBasketProducts) url.searchParams.set('showBasketProducts', 'true');

  const result = await callAwinApi(url);
  if (result.ok) result.message = 'Transactions retrieved.';
  return result;
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
    throw new Error(
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
