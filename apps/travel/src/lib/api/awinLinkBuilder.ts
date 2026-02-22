const AWIN_API_BASE = 'https://api.awin.com';

// 모듈 레벨 캐시: publisher ID 조회 결과 재사용 (재배포 전까지 유효)
let cachedPublisherId: number | null | undefined;

async function resolvePublisherId(token: string): Promise<number | null> {
  if (cachedPublisherId !== undefined) return cachedPublisherId;

  // AWIN_PUBLISHER_ID 환경변수 우선 사용
  const envId = process.env.AWIN_PUBLISHER_ID?.trim();
  if (envId) {
    if (/^\d+$/.test(envId)) {
      cachedPublisherId = Number(envId);
      return cachedPublisherId;
    }
    // 형식이 잘못된 경우에는 캐시하지 않고 /accounts 조회로 진행
  }

  // 없으면 /accounts API로 동적 조회
  try {
    const res = await fetch(`${AWIN_API_BASE}/accounts`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 429) {
        // 일시적 오류(5xx, Rate Limit)는 캐시하지 않음 - 다음 요청에서 재시도 가능
        return null;
      }
      cachedPublisherId = null;
      return null;
    }
    const data = (await res.json()) as { accounts?: Array<{ accountId: number; accountType: string }> };
    const publisher = data.accounts?.find((a) => a.accountType === 'publisher');
    cachedPublisherId = publisher?.accountId ?? null;
    return cachedPublisherId;
  } catch {
    // 네트워크 오류는 캐시하지 않음 - 다음 요청에서 재시도 가능
    return null;
  }
}

export interface GenerateLinkInput {
  advertiserId: number;
  /** 광고주 사이트 내 특정 목적지 URL. 없으면 광고주 홈으로 링크됨 */
  destinationUrl?: string;
  /** Awin 트랜잭션 조회 시 식별자로 돌아오는 커스텀 파라미터 */
  clickref?: string;
  shorten?: boolean;
}

export interface GenerateLinkResult {
  url: string;
  shortUrl?: string;
}

/**
 * Awin Link Builder API로 추적 링크 생성.
 * AWIN_API_TOKEN 미설정 또는 API 실패 시 null 반환 (fail-open).
 */
export async function generateAffiliateLink(input: GenerateLinkInput): Promise<GenerateLinkResult | null> {
  const token = process.env.AWIN_API_TOKEN?.trim();
  if (!token) return null;

  const publisherId = await resolvePublisherId(token);
  if (!publisherId) return null;

  const body: Record<string, unknown> = { advertiserId: input.advertiserId };
  if (input.destinationUrl) body.destinationUrl = input.destinationUrl;
  if (input.clickref) body.parameters = { clickref: input.clickref };
  if (input.shorten) body.shorten = true;

  try {
    const res = await fetch(`${AWIN_API_BASE}/publishers/${publisherId}/linkbuilder/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { url?: string; shortUrl?: string };
    if (!data.url) return null;

    return { url: data.url, shortUrl: data.shortUrl };
  } catch {
    return null;
  }
}
