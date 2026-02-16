# Phase 2: 게스트 인증 + 대화 히스토리 + 비용 제어

Status: NOT STARTED
Priority: HIGH
Depends on: Phase 1

## Goal

로그인 없이도 서비스를 즉시 사용할 수 있는 게스트 세션을 구현하고, 대화를 저장/관리하는 히스토리 기능을 추가한다. LLM 토큰 비용을 제어하는 장치를 함께 구축한다.

## Architecture

```
방문자 → 게스트 세션 (sessionId: UUID, cookie)
         ↓
       AI 채팅 (게스트: 대화 1개, 5턴까지. 초과 시 로그인 유도)
         ↓
       저장/히스토리 접근 시 → 로그인 유도 모달
         ↓
       OAuth 로그인 (Google/Kakao)
         ↓
       세션 병합 (게스트 대화 → 유저 계정 귀속)
```

## Tasks

### P2-1: 게스트 세션 관리

- [ ] P2-1-T1: sessionId 생성 로직 (UUID v4, 앱 진입 시 쿠키 없으면 생성·설정, Cookie만 사용)
- [ ] P2-1-T2: API route에서 sessionId 추출 미들웨어
- [ ] P2-1-T3: `TravelConversation.sessionId`로 게스트 대화 저장 (userId=null)
- [ ] P2-1-T4: 게스트 세션 만료 정책 (7일 TTL, cron으로 자동 삭제)
- [ ] P2-1-T5: 게스트 데이터 정리 cron job 구현 (실행: apps/worker, 기존 repeatable job 패턴 활용)

**현재 DB 스키마 참고**: `TravelConversation` 모델에 이미 `sessionId`와 nullable `userId` 필드 존재

### P2-2: OAuth 인증 연동

**기존 인프라**: `apps/web`에서 NextAuth 사용 중 (Google/Kakao OAuth)

- [ ] P2-2-T1: apps/travel에 NextAuth 설정 (기존 `packages/db`의 User 모델 공유, OAuth 클라이언트는 apps/web과 동일·redirect URI만 travel 도메인 추가)
- [ ] P2-2-T2: Google OAuth provider 설정
- [ ] P2-2-T3: Kakao OAuth provider 설정
- [ ] P2-2-T4: 로그인/로그아웃 API route 구현
- [ ] P2-2-T5: 인증 상태 관리 (SessionProvider, useSession)

### P2-3: 로그인 유도 모달

- [ ] P2-3-T1: 로그인 유도 모달 UI 컴포넌트 (부드러운 UX, 강제 차단 아님)
- [ ] P2-3-T2: 트리거 포인트 정의 및 구현:
  - 대화 저장 버튼 클릭 시
  - 히스토리 사이드바 접근 시
  - 게스트 5턴 초과 시 (채팅 차단 + 로그인 유도)
  - 장소 북마크 시도 시 (추후)
- [ ] P2-3-T3: "나중에" 버튼으로 모달 닫기 (5턴 초과 시에도 표시, 문구는 "더 쓰려면 로그인이 필요해요" 등으로 구분)
- [ ] P2-3-T4: 모달 내 소셜 로그인 버튼 (Google, Kakao)

### P2-4: 세션 병합

- [ ] P2-4-T1: 로그인 성공 시 게스트 sessionId → userId 매핑 로직
  - `TravelConversation` 중 해당 sessionId의 레코드를 userId로 업데이트
- [ ] P2-4-T2: 여러 기기에서 같은 사용자가 게스트로 사용한 경우 병합 처리 (기기 A에서 로그인된 세션을 알 수 있으면 서버에서 "이 sessionId는 이미 userId에 병합됨" 반영, 클라이언트는 로그인 유도 또는 세션 갱신)
- [ ] P2-4-T3: 병합 후 sessionId 쿠키 갱신

**수정할 서비스**: `apps/travel/src/services/conversation.service.ts`

### P2-5: 대화 히스토리 UI

- [ ] P2-5-T1: 사이드바 대화 목록 UI (제목, 날짜, 미리보기)
- [ ] P2-5-T2: 대화 이어가기 기능 (기존 대화 로드 → 채팅 패널에 표시)
- [ ] P2-5-T3: 대화 제목 자동 생성 (별도 LLM 호출 없이, 채팅 응답과 같은 호출에서 제목/요약 받기 — 시스템 프롬프트 규칙 또는 구조화 출력; 파싱 실패 시 첫 메시지 slice fallback)
- [ ] P2-5-T4: 대화 검색 기능 (제목/내용 풀텍스트 검색)
- [ ] P2-5-T5: 대화 삭제 기능
- [ ] P2-5-T6: 새 대화 시작 버튼
- [ ] P2-5-T7: 대화 목록 API endpoints 구현
  - `GET /api/conversations` - 목록 조회
  - `GET /api/conversations/:id` - 상세 조회
  - `DELETE /api/conversations/:id` - 삭제
  - `PATCH /api/conversations/:id` - 제목 수정

**기존 서비스 활용**: `getConversationsBySession()`, `getConversation()` 함수가 이미 구현됨

### P2-6: Sliding Window 컨텍스트 관리

- [ ] P2-6-T1: 최근 N턴만 LLM 컨텍스트에 포함하는 로직 구현 (기본값: 10턴. 1턴 = 유저 메시지 1개 + AI 응답 1개)
- [ ] P2-6-T2: `apps/travel/src/app/api/chat/route.ts` 수정 - 메시지 슬라이싱
- [ ] P2-6-T3: 시스템 프롬프트에 "이전 대화 요약" 슬롯 추가 (Phase 5에서 활용)
- [ ] P2-6-T4: 컨텍스트 윈도우 크기 환경 변수로 설정 가능하게
- [ ] P2-6-T5: 턴당 출력 토큰 상한 설정 (환경 변수, 기본값 1024 또는 2048). 비용·응답 길이 제어용

### P2-7: 사용 제한 (Rate Limiting)

- [ ] P2-7-T1: 게스트 사용 제한 정책 정의
  - 게스트: 대화 1개만 가능, 그 대화 안에서 5턴까지 (1턴 = 유저 1메시지 + AI 1응답). 5턴 초과 시 로그인 유도
  - 로그인 사용자: 하루 20대화, 대화당 50턴 (또는 제한 완화)
- [ ] P2-7-T2: Rate limiter 구현 (Redis 기반 또는 in-memory)
- [ ] P2-7-T3: 제한 초과 시 안내 메시지 UI
- [ ] P2-7-T4: 제한 카운터 리셋 로직 (일일 리셋, UTC 자정 기준)

## DB Schema Changes

기존 스키마로 대부분 커버 가능. 추가 필요한 필드:

```prisma
model TravelConversation {
  // 기존 필드 유지
  messageCount  Int      @default(0)  // 턴 수 추적 (rate limiting)
}
```

## Acceptance Criteria

- [ ] 비로그인 사용자가 즉시 AI 채팅 가능
- [ ] 로그인 후 게스트 때 나눈 대화가 계정에 보존
- [ ] 사이드바에서 이전 대화 목록 확인 및 이어가기 가능
- [ ] 대화 검색, 삭제, 제목 수정 동작
- [ ] 10턴 이상 대화해도 LLM 비용이 선형 증가하지 않음 (sliding window, 기본 10턴)
- [ ] 게스트 사용 제한이 정상 동작 (대화 1개, 5턴까지. 5턴 초과 시 로그인 유도)
- [ ] 7일 이상 된 게스트 데이터 자동 삭제 확인
- [ ] 유저 질문 원문이 DB에 저장됨 (TravelMessage, role=user, content=원문)

## Technical Notes

- NextAuth: 기존 `apps/web` 설정 참고, 동일한 `packages/db` User 모델 공유. OAuth 클라이언트는 web과 동일 사용
- 게스트 세션: sessionId는 Cookie만 사용, 앱 진입 시(레이아웃/페이지 로드) 쿠키 없으면 생성. 7일 미접속 게스트 데이터 정리는 apps/worker에서 주기 실행
- Cookie: `httpOnly`, `secure`, `sameSite: lax`, `maxAge: 7 days`
- 게스트 제한: 대화 1개만 가능, 5턴까지. 5턴 초과 또는 새 대화 시도 시 로그인 유도
- Rate limiting: 초기에는 in-memory (Map), 스케일링 시 Redis
- 대화 자동 제목: 첫 사용자 메시지에서 slice(0, 100) (이미 구현됨)
- 출력 토큰: 턴당 상한 설정 (환경 변수, 기본 1024~2048). 비용·응답 길이 제어용