'use client';

import { useEffect, useState } from 'react';

import {
  createSessionId,
  parseSessionId,
  type StoredTravelSession,
  TRAVEL_SESSION_STORAGE_KEY,
  TRAVEL_SESSION_TTL_MS,
} from '@/lib/session';

/**
 * 게스트 사용자를 위한 영속적인 세션 ID 관리
 * - localStorage에 UUID 저장
 * - 7일 TTL (만료 시 자동 재생성)
 * - 서버 httpOnly cookie와 동기화
 */
export function useGuestSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    const storedData = localStorage.getItem(TRAVEL_SESSION_STORAGE_KEY);

    let session: StoredTravelSession | null = null;
    let shouldPersistSession = false;

    if (storedData) {
      const legacySessionId = parseSessionId(storedData);
      if (legacySessionId) {
        session = {
          sessionId: legacySessionId,
          expiresAt: now + TRAVEL_SESSION_TTL_MS,
        };
        shouldPersistSession = true;
      } else {
        try {
          const parsed = JSON.parse(storedData) as Partial<StoredTravelSession>;
          const parsedSessionId = parseSessionId(parsed.sessionId);

          if (parsedSessionId && typeof parsed.expiresAt === 'number' && parsed.expiresAt > now) {
            // 유효한 세션
            session = {
              sessionId: parsedSessionId,
              expiresAt: parsed.expiresAt,
            };
          } else if (parsedSessionId && typeof parsed.expiresAt !== 'number') {
            // expiresAt이 없던 구버전 포맷은 TTL을 재부여한다.
            session = {
              sessionId: parsedSessionId,
              expiresAt: now + TRAVEL_SESSION_TTL_MS,
            };
            shouldPersistSession = true;
          }
        } catch {
          // 파싱 실패 시 무시하고 새로 생성
        }
      }
    }

    if (!session) {
      // 새 세션 생성
      const newSessionId = createSessionId();
      session = {
        sessionId: newSessionId,
        expiresAt: now + TRAVEL_SESSION_TTL_MS,
      };
      shouldPersistSession = true;
    }

    if (shouldPersistSession) {
      localStorage.setItem(TRAVEL_SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    setSessionId(session.sessionId);

    // 서버에서 httpOnly cookie를 유지해 API가 body 없이도 sessionId를 인식하도록 동기화
    void fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId }),
    }).catch((error) => {
      console.error('Failed to sync session cookie:', error);
    });
  }, []);

  return { sessionId };
}
