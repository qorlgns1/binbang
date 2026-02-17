'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'travel_session_id';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

interface StoredSession {
  sessionId: string;
  expiresAt: number;
}

/**
 * 게스트 사용자를 위한 영속적인 세션 ID 관리
 * - localStorage에 UUID 저장
 * - 7일 TTL (만료 시 자동 재생성)
 */
export function useGuestSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    const storedData = localStorage.getItem(SESSION_KEY);

    let session: StoredSession | null = null;

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as StoredSession;
        if (parsed.expiresAt > now) {
          // 유효한 세션
          session = parsed;
        }
      } catch {
        // 파싱 실패 시 무시하고 새로 생성
      }
    }

    if (!session) {
      // 새 세션 생성
      const newSessionId = crypto.randomUUID();
      session = {
        sessionId: newSessionId,
        expiresAt: now + SESSION_TTL_MS,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    setSessionId(session.sessionId);
  }, []);

  return { sessionId };
}
