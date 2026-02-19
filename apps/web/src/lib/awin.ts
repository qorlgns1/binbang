const AWIN_API_BASE = 'https://api.awin.com';

export function getAwinToken(): string | null {
  const token = process.env.AWIN_API_TOKEN?.trim();
  return token || null;
}

type Account = { accountId: number; accountName: string; accountType: string; userRole: string };
type AccountsResponse = { userId?: number; accounts?: Account[] };

/**
 * GET /accounts로 퍼블리셔 계정 ID 조회 (첫 번째 publisher 반환)
 */
export async function fetchPublisherId(token: string): Promise<number | null> {
  const url = new URL(`${AWIN_API_BASE}/accounts`);
  url.searchParams.set('accessToken', token);
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as AccountsResponse;
  const publisher = data.accounts?.find((a) => a.accountType === 'publisher');
  return publisher?.accountId ?? null;
}
