import { type AffiliateAdvertiserCategory, getDataSource, AffiliateAdvertiser } from '@workspace/db';

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
  const ds = await getDataSource();
  const row = await ds.getRepository(AffiliateAdvertiser).findOne({
    where: { category },
    select: { advertiserId: true, name: true },
    order: { updatedAt: 'DESC' },
  });
  if (!row) return null;
  return { advertiserId: row.advertiserId, name: row.name };
}
