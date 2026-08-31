import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { handleServiceError, validationErrorResponse } from '@/lib/handleServiceError';
import { getClientIp } from '@/lib/rateLimit';
import { issueEmailOtp } from '@/services/email-otp.service';

const requestSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다').max(255),
  locale: z.string().max(10).optional(),
});

/**
 * 인증코드 발송.
 *
 * 계정 존재 여부를 응답으로 구분할 수 없게 항상 같은 성공 응답을 준다(이메일 열거 방지).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const result = await issueEmailOtp({
      email: parsed.data.email,
      locale: parsed.data.locale,
      ip: getClientIp(request),
    });

    if (result.status === 'rate_limited') {
      return NextResponse.json(
        { message: '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요' },
        { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
      );
    }

    return NextResponse.json({ message: '인증코드를 보냈습니다' });
  } catch (error) {
    return handleServiceError(error, 'Email OTP issue error');
  }
}
