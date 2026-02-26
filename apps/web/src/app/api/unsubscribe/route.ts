import { NextResponse } from 'next/server';

import { unsubscribeAgodaAccommodation, verifyAgodaUnsubscribeToken } from '@/services/agoda-unsubscribe.service';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '토큰이 필요합니다' } }, { status: 400 });
  }

  let payload: { accommodationId: string; email: string };

  try {
    payload = verifyAgodaUnsubscribeToken(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid token';
    const isExpired = message.includes('expired');

    return new Response(
      `<!DOCTYPE html><html><body><h2>${isExpired ? '링크가 만료되었습니다' : '유효하지 않은 링크입니다'}</h2><p>${isExpired ? '새로운 알림 이메일을 기다려 주세요.' : '링크를 다시 확인해주세요.'}</p></body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const { accommodationId, email } = payload;
  await unsubscribeAgodaAccommodation({ accommodationId, email });

  return new Response(
    `<!DOCTYPE html><html><body><h2>알림이 중단되었습니다</h2><p>더 이상 해당 숙소에 대한 알림을 받지 않습니다.</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
