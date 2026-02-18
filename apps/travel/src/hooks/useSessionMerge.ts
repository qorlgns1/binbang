'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { parseSessionId, TRAVEL_SESSION_STORAGE_KEY, TRAVEL_SESSION_TTL_MS } from '@/lib/session';

export type MergeStatus = 'idle' | 'pending' | 'done';

/**
 * 로그인 시 게스트 세션을 자동으로 병합하는 훅
 *
 * mergeStatus를 반환해 소비자가 merge 완료 시점에 후속 작업을 동기화할 수 있게 한다.
 * - 'idle'   : 아직 인증되지 않아 merge가 시작되지 않은 상태
 * - 'pending': merge API 요청 진행 중
 * - 'done'   : merge 완료 (성공·no-op·오류 모두 포함 — "시도가 끝난" 상태)
 */
export function useSessionMerge(): { mergeStatus: MergeStatus } {
  const { status } = useSession();
  const hasMergedRef = useRef(false);
  const [mergeStatus, setMergeStatus] = useState<MergeStatus>('idle');

  useEffect(() => {
    if (status !== 'authenticated' || hasMergedRef.current) return;

    const mergeSession = async () => {
      setMergeStatus('pending');

      try {
        const storedData = localStorage.getItem(TRAVEL_SESSION_STORAGE_KEY);
        let sessionId: string | null = null;
        if (storedData) {
          const legacySessionId = parseSessionId(storedData);
          if (legacySessionId) {
            sessionId = legacySessionId;
          } else {
            try {
              const parsed = JSON.parse(storedData) as { sessionId?: string };
              sessionId = parseSessionId(parsed.sessionId);
            } catch {
              // ignore malformed localStorage payload and fallback to cookie-based merge
            }
          }
        }

        const response = await fetch('/api/auth/merge-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionId ? { sessionId } : {}),
        });

        if (!response.ok) {
          const responseText = await response.text();
          if (response.status === 400 && responseText.includes('sessionId or sessionIds is required')) {
            hasMergedRef.current = true;
            return;
          }
          console.error('Failed to merge session:', responseText);
          hasMergedRef.current = true;
          return;
        }

        const result = (await response.json()) as {
          success: boolean;
          mergedCount: number;
          refreshedSessionId?: string;
        };

        const refreshedSessionId = parseSessionId(result.refreshedSessionId);
        if (refreshedSessionId) {
          localStorage.setItem(
            TRAVEL_SESSION_STORAGE_KEY,
            JSON.stringify({
              sessionId: refreshedSessionId,
              expiresAt: Date.now() + TRAVEL_SESSION_TTL_MS,
            }),
          );
        }

        if (result.success && result.mergedCount > 0) {
          toast.success(`대화 ${result.mergedCount}개가 계정에 저장되었습니다.`);
        }

        hasMergedRef.current = true;
      } catch (error) {
        console.error('Session merge error:', error);
        hasMergedRef.current = true;
      } finally {
        setMergeStatus('done');
      }
    };

    void mergeSession();
  }, [status]);

  return { mergeStatus };
}
