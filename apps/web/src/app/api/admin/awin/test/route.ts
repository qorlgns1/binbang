import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';

const AWIN_API_BASE = 'https://api.awin.com';

/**
 * Awin API 토큰 검증: GET /accounts
 * - Bearer 토큰으로 인증 (Authorization header)
 * - 성공 시 연결된 퍼블리셔/광고주 계정 목록 반환
 * @see https://developer.awin.com/apidocs/returns-information-about-accounts-for-a-given-user
 * @see https://developer.awin.com/apidocs/api-authentication
 */
export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.AWIN_API_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'AWIN_API_TOKEN is not set',
        hint: 'Set AWIN_API_TOKEN in .env or .env.local (Bearer token from https://ui.awin.com/awin-api)',
      },
      { status: 400 },
    );
  }

  try {
    const trimmedToken = token.trim();
    const url = new URL(`${AWIN_API_BASE}/accounts`);
    url.searchParams.set('accessToken', trimmedToken);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${trimmedToken}`,
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
        {
          ok: false,
          status: res.status,
          statusText: res.statusText,
          body: data,
          hint:
            res.status === 401
              ? 'Token may be invalid or revoked. Regenerate at https://ui.awin.com/awin-api'
              : undefined,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      body: data,
      message: 'Awin API token is valid. Accounts list retrieved.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Request failed',
        detail: message,
      },
      { status: 200 },
    );
  }
}
