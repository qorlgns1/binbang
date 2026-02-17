'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const SESSION_KEY = 'travel_session_id';

/**
 * 로그인 시 게스트 세션을 자동으로 병합하는 훅
 */
export function useSessionMerge() {
  const { status } = useSession();
  const hasMergedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || hasMergedRef.current) return;

    const mergeSession = async () => {
      const storedData = localStorage.getItem(SESSION_KEY);
      if (!storedData) return;

      try {
        const parsed = JSON.parse(storedData) as { sessionId: string; expiresAt: number };
        const { sessionId } = parsed;

        if (!sessionId) return;

        const response = await fetch('/api/auth/merge-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          console.error('Failed to merge session:', await response.text());
          return;
        }

        const result = (await response.json()) as { success: boolean; mergedCount: number };

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
