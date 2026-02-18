'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { parseSessionId, TRAVEL_SESSION_STORAGE_KEY, TRAVEL_SESSION_TTL_MS } from '@/lib/session';

/**
 * 로그인 시 게스트 세션을 자동으로 병합하는 훅
 */
export function useSessionMerge() {
  const { status } = useSession();
  const hasMergedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || hasMergedRef.current) return;

    const mergeSession = async () => {
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
      }
    };

    void mergeSession();
  }, [status]);
}
