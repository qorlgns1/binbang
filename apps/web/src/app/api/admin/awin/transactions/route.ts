import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['pending', 'approved', 'declined', 'deleted'] as const;
const DATE_TYPES = ['transaction', 'validation', 'amendment'] as const;

/**
 * Awin Transactions API: 퍼블리셔 트랜잭션(전환) 목록 조회 (최대 31일 구간)
 * GET /publishers/{publisherId}/transactions/
 * @see https://developer.awin.com/apidocs/returns-a-list-of-transactions-for-a-given-publisher
 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = getAwinToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'AWIN_API_TOKEN is not set' },
      { status: 400 },
    );
  }

  const publisherId = await fetchPublisherId(token);
  if (publisherId == null) {
    return NextResponse.json(
      { ok: false, error: 'Could not get publisher account.' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return NextResponse.json(
      { ok: false, error: 'startDate and endDate required (yyyy-MM-dd). Max 31 days range.' },
      { status: 400 },
    );
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (days < 0 || days > 31) {
    return NextResponse.json(
      { ok: false, error: 'Date range must be 0–31 days.' },
      { status: 400 },
    );
  }

  const advertiserId = searchParams.get('advertiserId')?.trim();
  const statusParam = searchParams.get('status');
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : undefined;
  const dateTypeParam = searchParams.get('dateType');
  const dateType = DATE_TYPES.includes(dateTypeParam as (typeof DATE_TYPES)[number])
    ? (dateTypeParam as (typeof DATE_TYPES)[number])
    : undefined;
  const timezone = searchParams.get('timezone')?.trim();
  const showBasketProducts = searchParams.get('showBasketProducts') === 'true';

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/transactions/`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('startDate', `${startDate}T00:00:00`);
  url.searchParams.set('endDate', `${endDate}T23:59:59`);
  if (advertiserId) url.searchParams.set('advertiserId', advertiserId);
  if (status) url.searchParams.set('status', status);
  if (dateType) url.searchParams.set('dateType', dateType);
  if (timezone) url.searchParams.set('timezone', timezone);
  if (showBasketProducts) url.searchParams.set('showBasketProducts', 'true');

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
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
      return NextResponse.json(
        { ok: false, status: res.status, statusText: res.statusText, body: data },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      body: data,
      message: 'Transactions retrieved.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: 'Request failed', detail: message },
      { status: 200 },
    );
  }
}
