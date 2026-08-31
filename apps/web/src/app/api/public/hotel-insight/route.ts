import { NextResponse } from 'next/server';

import { z } from 'zod';

import { handleServiceError, validationErrorResponse } from '@/lib/handleServiceError';
import { getPublicPropertyInsight, parsePublicPlatformSegment } from '@/services/public-availability.service';

const querySchema = z.object({
  platform: z.string().default('agoda'),
  platformId: z.string().regex(/^\d+$/, '유효한 호텔 ID가 아닙니다'),
});

/**
 * 홈 화면의 "가치 확인" 단계용 공개 관측 요약.
 *
 * 인증이 필요 없다. 등록 이력이 없는 숙소는 `insight: null`을 돌려주며,
 * 호출부는 이를 "아직 관측 이력 없음"으로 표시한다.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      platform: searchParams.get('platform') ?? undefined,
      platformId: searchParams.get('platformId') ?? '',
    });

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const platform = parsePublicPlatformSegment(parsed.data.platform);
    if (!platform) {
      return validationErrorResponse([{ code: 'custom', path: ['platform'], message: '지원하지 않는 플랫폼입니다' }]);
    }

    const insight = await getPublicPropertyInsight({ platform, platformId: parsed.data.platformId });
    return NextResponse.json({ insight });
  } catch (error) {
    return handleServiceError(error, 'Public hotel insight error');
  }
}
