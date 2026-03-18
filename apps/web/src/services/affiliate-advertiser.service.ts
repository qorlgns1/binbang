import { type AffiliateAdvertiserCategory, prisma } from '@workspace/db';

export interface AffiliateAdvertiserInfo {
  advertiserId: number;
  name: string;
}

/**
 * DB에서 카테고리 기준 첫 번째 광고주 조회.
 * Admin의 AffiliateAdvertiser 테이블을 직접 읽음.
 * updatedAt DESC 기준 가장 최근에 관리된 광고주를 우선 반환.
 */
export async function getFirstAdvertiserByCategory(
  category: AffiliateAdvertiserCategory,
): Promise<AffiliateAdvertiserInfo | null> {
  const row = await prisma.affiliateAdvertiser.findFirst({
    where: { category },
    select: { advertiserId: true, name: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (!row) return null;
  return { advertiserId: row.advertiserId, name: row.name };
}
