# Phase 2: 게스트 인증 + 대화 히스토리 + 비용 제어

Status: IN PROGRESS (updated on 2026-02-18)  
Priority: HIGH  
Depends on: Phase 1  
Working branch: `feature/phase-2-guest-auth-history`

## Goal

로그인 없이도 서비스를 즉시 사용할 수 있는 게스트 세션을 구현하고, 대화를 저장/관리하는 히스토리 기능을 추가한다. LLM 토큰 비용을 제어하는 장치를 함께 구축한다.

## Architecture

```
방문자 → 게스트 세션 (sessionId: UUID, localStorage)
         ↓
       AI 채팅
         ↓
       저장/히스토리 접근 시 → 로그인 유도 모달
         ↓
       OAuth 로그인 (Google/Kakao)
         ↓
       세션 병합 (게스트 대화 → 유저 계정 귀속)
```

## Current Implementation Snapshot

- 인증: NextAuth(google/kakao) + Prisma Adapter 연동 완료
- 세션: `travel_session_id` 기반 게스트 세션(localStorage, httpOnly cookie, 7일 TTL) 적용
- 세션 추출: API 공통 추출 유틸(cookie -> header -> body) 적용
- 병합: 로그인 시 `/api/auth/merge-session`으로 게스트 대화 `userId` 귀속 (다중 sessionId 지원)
- 로그인 대화 저장: 인증 사용자는 대화 생성 시점부터 `userId`로 직접 저장
- 히스토리: 사이드바 목록/상세 로드/삭제/새 대화 시작 구현
- 비용 제어: Sliding Window + in-memory rate limiting + 429 에러 UI 처리
- 프롬프트: 시스템 프롬프트에 이전 대화 요약 슬롯 추가(기본값 NONE)
- 정리 작업: 7일 지난 guest conversation 삭제 cron API 구현

## Tasks

### P2-1: 게스트 세션 관리

- [x] P2-1-T1: sessionId 생성 로직 (UUID v4, 브라우저 cookie/localStorage 저장)
- [x] P2-1-T2: API route에서 sessionId 추출 미들웨어
- [x] P2-1-T3: `TravelConversation.sessionId`로 게스트 대화 저장 (userId=null)
- [x] P2-1-T4: 게스트 세션 만료 정책 (7일 TTL, cron으로 자동 삭제)
- [x] P2-1-T5: 게스트 데이터 정리 cron job 구현

### P2-2: OAuth 인증 연동

**기존 인프라**: `apps/web`에서 NextAuth 사용 중 (Google/Kakao OAuth)

- [x] P2-2-T1: apps/travel에 NextAuth 설정 (기존 `packages/db`의 User 모델 공유)
- [x] P2-2-T2: Google OAuth provider 설정
- [x] P2-2-T3: Kakao OAuth provider 설정
- [x] P2-2-T4: 로그인/로그아웃 API route 구현
- [x] P2-2-T5: 인증 상태 관리 (SessionProvider, useSession)

### P2-3: 로그인 유도 모달

- [x] P2-3-T1: 로그인 유도 모달 UI 컴포넌트 (부드러운 UX, 강제 차단 아님)
- [x] P2-3-T2: 트리거 포인트 정의 및 구현
- [x] P2-3-T3: "나중에" 버튼으로 모달 닫기 (계속 게스트로 사용 가능)
- [x] P2-3-T4: 모달 내 소셜 로그인 버튼 (Google, Kakao)

### P2-4: 세션 병합

- [x] P2-4-T1: 로그인 성공 시 게스트 sessionId → userId 매핑 로직
- [x] P2-4-T2: 여러 기기에서 같은 사용자가 게스트로 사용한 경우 병합 처리
- [x] P2-4-T3: 병합 후 sessionId 쿠키 갱신

### P2-5: 대화 히스토리 UI

- [x] P2-5-T1: 사이드바 대화 목록 UI (제목, 날짜, 미리보기)
- [x] P2-5-T2: 대화 이어가기 기능 (기존 대화 로드 → 채팅 패널에 표시)
- [x] P2-5-T3: 대화 제목 자동 생성 (첫 메시지 기반, 또는 LLM 요약)
- [x] P2-5-T4: 대화 검색 기능 (제목/내용 풀텍스트 검색)
- [x] P2-5-T5: 대화 삭제 기능
- [x] P2-5-T6: 새 대화 시작 버튼
- [x] P2-5-T7: 대화 목록 API endpoints 구현

### P2-6: Sliding Window 컨텍스트 관리

- [x] P2-6-T1: 최근 N턴만 LLM 컨텍스트에 포함하는 로직 구현 (기본값: 10턴)
- [x] P2-6-T2: `apps/travel/src/app/api/chat/route.ts` 수정 - 메시지 슬라이싱
- [x] P2-6-T3: 시스템 프롬프트에 "이전 대화 요약" 슬롯 추가 (Phase 5에서 활용)
- [x] P2-6-T4: 컨텍스트 윈도우 크기 환경 변수로 설정 가능하게

### P2-7: 사용 제한 (Rate Limiting)

- [x] P2-7-T1: 게스트 사용 제한 정책 정의  
  게스트: 하루 1대화, 대화당 5턴 / 로그인: 하루 20대화, 대화당 50턴
- [x] P2-7-T2: Rate limiter 구현 (in-memory)
- [x] P2-7-T3: 제한 초과 시 안내 메시지 UI
- [x] P2-7-T4: 제한 카운터 리셋 로직 (일일 리셋)

## DB Schema Changes

완료:

```prisma
model TravelConversation {
  messageCount Int @default(0) // 턴 수 추적
}
```

## Acceptance Criteria

- [x] 비로그인 사용자가 즉시 AI 채팅 가능
- [x] 로그인 후 게스트 때 나눈 대화가 계정에 보존
- [x] 사이드바에서 이전 대화 목록 확인 및 이어가기 가능
- [ ] 대화 검색, 삭제, 제목 수정 동작  
  검색/삭제/제목 수정 API 완료, 제목 수정 UI는 미완료
- [x] 10턴 이상 대화해도 LLM 비용이 선형 증가하지 않음 (sliding window, 기본 10턴)
- [x] 게스트 사용 제한이 정상 동작 (in-memory 기준, 게스트 1대화/5턴)
- [ ] 7일 이상 된 게스트 데이터 자동 삭제 확인  
  cleanup API 구현 완료, 운영 cron 스케줄/실운영 검증 필요

## Known Gaps

- 대화 제목 수정 UI 미구현

## Implemented Files (핵심)

- `apps/travel/src/hooks/useGuestSession.ts`
- `apps/travel/src/hooks/useSessionMerge.ts`
- `apps/travel/src/lib/auth.ts`
- `apps/travel/src/lib/session.ts`
- `apps/travel/src/lib/sessionServer.ts`
- `apps/travel/src/services/auth.service.ts`
- `apps/travel/src/services/conversation.service.ts`
- `apps/travel/src/services/rate-limit.service.ts`
- `apps/travel/src/app/api/auth/[...nextauth]/route.ts`
- `apps/travel/src/app/api/auth/merge-session/route.ts`
- `apps/travel/src/app/api/chat/route.ts`
- `apps/travel/src/app/api/session/route.ts`
- `apps/travel/src/app/api/conversations/route.ts`
- `apps/travel/src/app/api/conversations/[id]/route.ts`
- `apps/travel/src/app/api/cron/cleanup-guests/route.ts`
- `apps/travel/src/components/history/HistorySidebar.tsx`
- `apps/travel/src/components/modals/LoginPromptModal.tsx`
- `apps/travel/src/components/chat/ChatPanel.tsx`
- `packages/db/prisma/schema.prisma`
