import { NextResponse } from 'next/server';

import { recordAgodaClickoutEvent } from '@/services/agoda-clickout.service';

const ALLOWED_REDIRECT_HOSTS = new Set(['www.agoda.com', 'agoda.com', 'secure.agoda.com']);

function isSafeRedirectUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && ALLOWED_REDIRECT_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

// 클릭아웃 redirect: 알림 이메일 → Agoda 예약 페이지
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const accommodationId = searchParams.get('accommodationId');
  const url = searchParams.get('url');

  if (!accommodationId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'accommodationId is required' } },
      { status: 400 },
    );
  }

  // 허용된 도메인인지 검증
  const safeUrl = url && isSafeRedirectUrl(url) ? url : null;

  // 클릭아웃 이벤트 기록 (best-effort, 실패해도 redirect는 진행)
  try {
    await recordAgodaClickoutEvent({ accommodationId, url: safeUrl });
  } catch {
    // 무시 — eventKey 중복 또는 DB 오류 시에도 redirect 진행
  }

  if (safeUrl) {
    return NextResponse.redirect(safeUrl, { status: 302 });
  }

  // url이 없거나 허용되지 않은 도메인이면 Agoda 기본 페이지로
  return NextResponse.redirect('https://www.agoda.com', { status: 302 });
}
