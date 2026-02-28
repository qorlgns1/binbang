import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { unsubscribeAgodaAccommodation, verifyAgodaUnsubscribeToken } from '@/services/agoda-unsubscribe.service';

// 수신거부 확인 페이지 HTML (GET 요청: 상태 변경 없음)
function confirmationPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>알림 수신거부</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 480px; margin: 60px auto; padding: 0 16px; color: #0f172a; }
    h2 { margin: 0 0 12px; }
    p { margin: 0 0 24px; color: #475569; }
    button { padding: 10px 20px; background: #0f172a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    button:hover { background: #1e293b; }
  </style>
</head>
<body>
  <h2>알림 수신거부</h2>
  <p>이 숙소에 대한 알림을 더 이상 받지 않으시겠습니까?</p>
  <form method="POST">
    <button type="submit">수신거부 확인</button>
  </form>
</body>
</html>`;
}

function errorPage(isExpired: boolean): string {
  const title = isExpired ? '링크가 만료되었습니다' : '유효하지 않은 링크입니다';
  const body = isExpired ? '새로운 알림 이메일을 기다려 주세요.' : '링크를 다시 확인해주세요.';
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${title}</title></head><body><h2>${title}</h2><p>${body}</p></body></html>`;
}

/** GET: 토큰 유효성 검증 후 확인 페이지 반환. 상태 변경 없음. */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '토큰이 필요합니다' } }, { status: 400 });
  }

  try {
    verifyAgodaUnsubscribeToken(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid token';
    return new Response(errorPage(message.includes('expired')), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(confirmationPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/** POST: 수신거부 확인 폼 제출 처리. 실제 opt-out 기록. */
export async function POST(request: NextRequest): Promise<Response> {
  // 폼 제출 시 token은 query string에 포함된다 (form action이 현재 URL을 유지).
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
    return new Response(errorPage(message.includes('expired')), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const { accommodationId, email } = payload;
  await unsubscribeAgodaAccommodation({ accommodationId, email });

  return new Response(
    `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>수신거부 완료</title></head><body><h2>알림이 중단되었습니다</h2><p>더 이상 해당 숙소에 대한 알림을 받지 않습니다.</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
