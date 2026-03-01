/** 각 스케줄러 ID → 내부 API 경로 매핑 */
const TRIGGERABLE_SCHEDULERS: Readonly<Record<string, string>> = {
  'binbang-poll-due-scheduler': '/api/internal/accommodations/poll-due',
  'binbang-dispatch-scheduler': '/api/internal/accommodations/notifications/dispatch',
  'binbang-snapshot-cleanup-scheduler': '/api/internal/snapshots/cleanup',
};

/** 즉시 트리거 가능한 스케줄러 ID 집합 — 서비스와 라우트에서 공유 */
export const TRIGGERABLE_SCHEDULER_IDS: ReadonlySet<string> = new Set(Object.keys(TRIGGERABLE_SCHEDULERS));

function resolveBaseUrl(): string | null {
  return process.env.WEB_INTERNAL_URL?.replace(/\/$/, '') ?? process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? null;
}

function resolveInternalToken(): string | null {
  return process.env.BINBANG_INTERNAL_API_TOKEN?.trim() ?? null;
}

export async function triggerScheduler(schedulerId: string): Promise<{ ok: boolean; message: string }> {
  const path = TRIGGERABLE_SCHEDULERS[schedulerId];
  if (!path) {
    return { ok: false, message: `Scheduler '${schedulerId}' 는 트리거 불가능합니다.` };
  }

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return { ok: false, message: 'WEB_INTERNAL_URL / NEXTAUTH_URL 이 설정되지 않았습니다.' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = resolveInternalToken();
  if (token) {
    headers['x-binbang-internal-token'] = token;
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    return { ok: true, message: `${schedulerId} → ${path} 트리거 완료` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
