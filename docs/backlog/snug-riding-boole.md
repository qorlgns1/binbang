# Phase 2 구현 계획: 게스트 인증 + 대화 히스토리 + 비용 제어

## Context

현재 apps/travel은 AI 기반 여행 플래너로, 사용자가 즉시 채팅을 시작할 수 있지만 다음 제약이 있습니다:
- **인증 없음**: 세션이 브라우저 새로고침 시 손실됨
- **히스토리 없음**: 이전 대화를 볼 수 없음
- **비용 제어 없음**: 무제한 LLM 토큰 사용 가능

이 Phase 2에서는 **비로그인 사용자도 즉시 사용 가능**하면서, 로그인 시 데이터가 보존되는 하이브리드 접근 방식을 구축합니다. apps/web의 기존 NextAuth 인프라를 재사용하고, 게스트 세션과 로그인 계정 간 매끄러운 전환을 제공합니다.

## 구현 우선순위

### Phase 2-A: 기반 인프라 (1-2일)
1. **P2-1**: 게스트 세션 관리
2. **P2-6**: Sliding Window 컨텍스트 관리
3. **DB 스키마**: messageCount 필드 추가

### Phase 2-B: 인증 연동 (2-3일)
4. **P2-2**: OAuth 인증 연동 (NextAuth)
5. **P2-4**: 세션 병합

### Phase 2-C: 사용자 기능 (2-3일)
6. **P2-3**: 로그인 유도 모달
7. **P2-5**: 대화 히스토리 UI

### Phase 2-D: 비용 제어 (1-2일)
8. **P2-7**: Rate Limiting

---

## 상세 구현 계획

## P2-1: 게스트 세션 관리

**목표**: 브라우저에서 영속적인 게스트 세션 ID 관리

### 1.1 클라이언트 세션 훅 생성

**파일**: `apps/travel/src/hooks/useGuestSession.ts` (신규)

```typescript
// 구현 내용:
// - UUID v4 생성 (crypto.randomUUID())
// - localStorage 저장/복구 (키: 'travel_session_id')
// - 7일 TTL (만료 시 자동 재생성)
// - 서버 컴포넌트에서는 사용 불가 (클라이언트 전용)

export function useGuestSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 복구 또는 신규 생성
    // { sessionId: string, expiresAt: number } 형태로 저장
  }, []);

  return { sessionId };
}
```

### 1.2 ChatPanel에 세션 통합

**파일**: `apps/travel/src/components/chat/ChatPanel.tsx` (수정)

```typescript
// 기존 useChat에 sessionId 전달
const { sessionId } = useGuestSession();

const { messages, sendMessage, ... } = useChat({
  api: '/api/chat',
  body: { sessionId }, // 추가
});
```

### 1.3 게스트 데이터 정리 cron (선택사항)

**파일**: `apps/travel/src/app/api/cron/cleanup-guests/route.ts` (신규)

```typescript
// 7일 이상 된 TravelConversation (userId=null) 삭제
// Vercel Cron 또는 수동 호출
// DELETE cascade로 메시지/엔티티도 자동 삭제
```

**Note**: Vercel Pro 플랜 필요. 초기에는 수동 실행 가능.

---

## P2-2: OAuth 인증 연동

**목표**: apps/web의 NextAuth 설정을 apps/travel에 적용

### 2.1 NextAuth 설정 파일 생성

**파일**: `apps/travel/src/lib/auth.ts` (신규)

**참고**: `/Users/marco/workspace/binbang/apps/web/src/lib/auth.ts`

```typescript
// 동일한 구조 사용:
// - createNextAuthAdapter() (apps/travel/src/services/auth.service.ts에서 import)
// - GoogleProvider, KakaoProvider
// - session callback에서 user.id, roles, planName 확장
// - database 세션 전략
// - signIn callback에서 카카오 토큰 저장
```

**주의사항**:
- `@workspace/db`의 User 모델 공유 (별도 마이그레이션 불필요)
- 환경 변수: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`

### 2.2 NextAuth API 라우트

**파일**: `apps/travel/src/app/api/auth/[...nextauth]/route.ts` (신규)

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 2.3 인증 서비스 레이어

**파일**: `apps/travel/src/services/auth.service.ts` (신규)

**참고**: `/Users/marco/workspace/binbang/apps/web/src/services/auth.service.ts`

```typescript
// apps/web의 함수들을 복사하되, import 경로만 조정:
// - createNextAuthAdapter()
// - getUserWithRolesAndPlan()
// - getSessionAndUserByToken()
// - findAccountUserId()
// - saveKakaoTokens()
```

**Note**: apps/web과 apps/travel이 별도 앱이므로 서비스 코드 중복 허용. 향후 공유 필요 시 `@workspace/shared`로 이동 고려.

### 2.4 타입 정의

**파일**: `apps/travel/src/types/next-auth.d.ts` (신규)

```typescript
// Session, User 인터페이스 확장 (apps/web과 동일)
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      planName: string | null;
    } & DefaultSession['user'];
  }
}
```

### 2.5 SessionProvider 래핑

**파일**: `apps/travel/src/app/layout.tsx` (수정)

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

---

## P2-3: 로그인 유도 모달

**목표**: 특정 기능 접근 시 부드럽게 로그인 유도 (강제 아님)

### 3.1 로그인 모달 컴포넌트

**파일**: `apps/travel/src/components/modals/LoginPromptModal.tsx` (신규)

```typescript
// Props: open, onClose, trigger (예: 'save' | 'history' | 'bookmark')
// UI:
// - 헤더: "로그인하고 대화를 저장하세요"
// - 설명: trigger에 따라 다른 메시지
//   - 'save': "대화 내역을 저장하고 언제든 다시 보려면..."
//   - 'history': "이전 대화를 보려면..."
// - 버튼:
//   - Google 로그인 (signIn('google'))
//   - Kakao 로그인 (signIn('kakao'))
//   - "나중에" (onClose)
// - 스타일: shadcn Dialog 사용
```

### 3.2 트리거 포인트 추가

**파일**: `apps/travel/src/components/chat/ChatPanel.tsx` (수정)

```typescript
// 상단에 "대화 저장" 버튼 추가 (아이콘 버튼)
// 클릭 시:
// - 로그인 상태: 현재 conversationId 저장 (이미 자동 저장됨, UI 피드백만)
// - 비로그인: LoginPromptModal 표시 (trigger='save')

// "히스토리" 사이드바 토글 버튼 추가
// 클릭 시:
// - 로그인 상태: 사이드바 표시
// - 비로그인: LoginPromptModal 표시 (trigger='history')
```

---

## P2-4: 세션 병합

**목표**: 로그인 시 게스트 세션의 대화를 사용자 계정에 귀속

### 4.1 세션 병합 함수

**파일**: `apps/travel/src/services/conversation.service.ts` (수정)

```typescript
/**
 * 게스트 세션의 모든 대화를 사용자 계정으로 병합
 */
export async function mergeGuestSessionToUser(
  sessionId: string,
  userId: string
): Promise<{ mergedCount: number }> {
  const result = await prisma.travelConversation.updateMany({
    where: {
      sessionId,
      userId: null, // 게스트 대화만
    },
    data: {
      userId,
    },
  });

  return { mergedCount: result.count };
}

/**
 * 사용자의 모든 대화 조회 (userId 기준)
 */
export async function getConversationsByUser(userId: string) {
  return prisma.travelConversation.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}
```

### 4.2 로그인 후 병합 처리

**파일**: `apps/travel/src/app/api/auth/merge-session/route.ts` (신규)

```typescript
// POST /api/auth/merge-session
// Body: { sessionId: string }
// 인증 필요 (getServerSession으로 확인)
// mergeGuestSessionToUser 호출
// 응답: { success: true, mergedCount: number }
```

### 4.3 클라이언트 병합 로직

**파일**: `apps/travel/src/hooks/useSessionMerge.ts` (신규)

```typescript
// useSession() 모니터링
// status='authenticated' 전환 시:
// - localStorage의 sessionId 가져오기
// - /api/auth/merge-session 호출
// - 성공 시 토스트 표시 ("대화 X개가 계정에 저장되었습니다")
```

**파일**: `apps/travel/src/components/chat/ChatPanel.tsx` (수정)

```typescript
// useSessionMerge() 호출 추가
```

---

## P2-5: 대화 히스토리 UI

**목표**: 사이드바에서 이전 대화 목록 표시 및 이어가기

### 5.1 대화 목록 API

**파일**: `apps/travel/src/app/api/conversations/route.ts` (신규)

```typescript
// GET /api/conversations
// 인증 확인 (getServerSession)
// getConversationsByUser(userId) 호출
// 응답: { conversations: [...] }

// DELETE /api/conversations/:id (query param)
// 인증 확인 + 소유권 확인
// prisma.travelConversation.delete()
// 응답: { success: true }
```

### 5.2 대화 상세 API

**파일**: `apps/travel/src/app/api/conversations/[id]/route.ts` (신규)

```typescript
// GET /api/conversations/:id
// 인증 확인 + 소유권 확인
// getConversation(id) 호출 (기존 함수)
// 응답: { conversation: { messages, entities } }
```

### 5.3 히스토리 사이드바 컴포넌트

**파일**: `apps/travel/src/components/history/HistorySidebar.tsx` (신규)

```typescript
// Props: open, onClose, onSelectConversation
// UI:
// - 헤더: "대화 히스토리" + 닫기 버튼
// - 검색 입력 (title 필터, 클라이언트 사이드)
// - 대화 목록:
//   - 제목 (title)
//   - 날짜 (상대 시간, date-fns 사용)
//   - 메시지 개수 (_count.messages)
//   - 삭제 버튼 (확인 다이얼로그)
// - "새 대화 시작" 버튼
// - useSWR로 /api/conversations 조회
```

### 5.4 대화 로드 로직

**파일**: `apps/travel/src/components/chat/ChatPanel.tsx` (수정)

```typescript
// onSelectConversation(conversationId) 콜백:
// 1. /api/conversations/:id 호출
// 2. messages를 UIMessage[] 형태로 변환
// 3. useChat의 setMessages() 호출
// 4. entities를 MapPanel에 전달
// 5. 사이드바 닫기
```

---

## P2-6: Sliding Window 컨텍스트 관리

**목표**: 긴 대화에서 최근 N턴만 LLM에 전달하여 토큰 비용 절감

### 6.1 메시지 슬라이싱 유틸

**파일**: `apps/travel/src/lib/ai/contextWindow.ts` (신규)

```typescript
import type { CoreMessage } from 'ai';

/**
 * 최근 N턴(user+assistant 쌍)만 반환
 * 시스템 프롬프트는 유지
 */
export function applyContextWindow(
  messages: CoreMessage[],
  maxTurns: number = 10
): CoreMessage[] {
  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // 최근 maxTurns*2개 메시지만 (user+assistant 각 1개씩)
  const recentMessages = conversationMessages.slice(-(maxTurns * 2));

  return [...systemMessages, ...recentMessages];
}
```

### 6.2 채팅 API에 적용

**파일**: `apps/travel/src/app/api/chat/route.ts` (수정)

```typescript
// 기존 코드:
const modelMessages = await convertToModelMessages(messages);

// 변경:
const rawModelMessages = await convertToModelMessages(messages);
const windowSize = parseInt(process.env.CONTEXT_WINDOW_SIZE ?? '10', 10);
const modelMessages = applyContextWindow(rawModelMessages, windowSize);
```

### 6.3 환경 변수

**파일**: `.env.example` (수정)

```bash
# AI 컨텍스트 윈도우 크기 (턴 단위, 기본 10)
CONTEXT_WINDOW_SIZE=10
```

---

## P2-7: Rate Limiting

**목표**: 게스트/로그인 사용자별 사용 제한 적용

### 7.1 Rate Limiter 서비스

**파일**: `apps/travel/src/services/rate-limit.service.ts` (신규)

```typescript
// In-memory Map 기반 (초기 구현)
// { key: string, count: number, resetAt: Date }
//
// checkRateLimit(key: string, limits: { daily: number, perConversation: number }):
//   - key: sessionId 또는 userId
//   - daily: 일일 대화 생성 한도
//   - perConversation: 대화당 메시지 한도
//   - 반환: { allowed: boolean, reason?: string }
//
// incrementCount(key: string, conversationId: string):
//   - 카운터 증가
//
// resetDaily():
//   - 자정에 호출 (cron 또는 체크 로직)

// 제한 정책:
const GUEST_LIMITS = { daily: 5, perConversation: 20 };
const USER_LIMITS = { daily: 20, perConversation: 50 };
```

**Note**: 프로덕션에서는 Redis 사용 권장 (분산 환경 지원).

### 7.2 DB 스키마 변경

**파일**: `packages/db/prisma/schema.prisma` (수정)

```prisma
model TravelConversation {
  // ... 기존 필드 유지
  messageCount  Int      @default(0)  // 대화당 메시지 수 추적
}
```

**마이그레이션**:
```bash
cd packages/db
pnpm exec prisma migrate dev --name add_message_count_to_travel_conversation
```

### 7.3 메시지 저장 시 카운터 업데이트

**파일**: `apps/travel/src/services/conversation.service.ts` (수정)

```typescript
export async function saveConversationMessages(params: SaveMessageParams) {
  // ... 기존 로직

  // 트랜잭션 내부에 추가:
  await tx.travelConversation.update({
    where: { id: conversationId },
    data: {
      messageCount: { increment: 2 }, // user + assistant
    },
  });
}
```

### 7.4 채팅 API에 Rate Limit 적용

**파일**: `apps/travel/src/app/api/chat/route.ts` (수정)

```typescript
import { getServerSession } from 'next-auth';
import { checkRateLimit, incrementCount } from '@/services/rate-limit.service';

export async function POST(req: Request) {
  // ... 기존 파싱 로직

  const session = await getServerSession(authOptions);
  const rateLimitKey = session?.user?.id ?? sessionId;
  const limits = session?.user ? USER_LIMITS : GUEST_LIMITS;

  const rateCheck = await checkRateLimit(rateLimitKey, limits);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', reason: rateCheck.reason }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ... 기존 streamText 로직

  onFinish: async ({ text, toolCalls, toolResults }) => {
    await saveConversationMessages(...);
    await incrementCount(rateLimitKey, conversationId);
  },
}
```

### 7.5 Rate Limit UI 피드백

**파일**: `apps/travel/src/components/chat/ChatPanel.tsx` (수정)

```typescript
// error 상태가 429일 때:
// - 에러 메시지 파싱 (reason 표시)
// - "로그인하여 더 많은 대화를 시작하세요" 버튼 (게스트인 경우)
// - 일일 리셋 시간 안내
```

---

## 의존성 추가

**파일**: `apps/travel/package.json`

```json
{
  "dependencies": {
    "next-auth": "^4.24.7",  // 기존 apps/web과 동일 버전
    "date-fns": "^3.0.0",    // 상대 시간 표시
    "swr": "^2.2.5"          // 대화 목록 캐싱
  }
}
```

---

## Critical Files 요약

### 수정 파일:
- `apps/travel/src/app/api/chat/route.ts` - sessionId 통합, rate limiting, context window
- `apps/travel/src/components/chat/ChatPanel.tsx` - 세션 훅, 로그인 모달, 히스토리 사이드바
- `apps/travel/src/services/conversation.service.ts` - 세션 병합, messageCount 업데이트
- `packages/db/prisma/schema.prisma` - TravelConversation.messageCount 추가
- `apps/travel/src/app/layout.tsx` - SessionProvider 추가
- `.env.example` - NextAuth + CONTEXT_WINDOW_SIZE 환경 변수

### 신규 파일:
- `apps/travel/src/hooks/useGuestSession.ts` - 게스트 세션 관리
- `apps/travel/src/hooks/useSessionMerge.ts` - 로그인 시 병합
- `apps/travel/src/lib/auth.ts` - NextAuth 설정
- `apps/travel/src/services/auth.service.ts` - 인증 서비스 레이어
- `apps/travel/src/services/rate-limit.service.ts` - Rate limiter
- `apps/travel/src/lib/ai/contextWindow.ts` - Sliding window 로직
- `apps/travel/src/components/modals/LoginPromptModal.tsx` - 로그인 유도 모달
- `apps/travel/src/components/history/HistorySidebar.tsx` - 히스토리 사이드바
- `apps/travel/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API
- `apps/travel/src/app/api/auth/merge-session/route.ts` - 세션 병합 API
- `apps/travel/src/app/api/conversations/route.ts` - 대화 목록 API
- `apps/travel/src/app/api/conversations/[id]/route.ts` - 대화 상세 API
- `apps/travel/src/types/next-auth.d.ts` - NextAuth 타입 확장

---

## 검증 계획

### 1. 게스트 세션 (P2-1)
- [ ] 브라우저 새로고침 시 sessionId 유지 확인
- [ ] localStorage 확인 (`travel_session_id`)
- [ ] 7일 후 세션 만료 테스트 (수동으로 expiresAt 조작)

### 2. OAuth 인증 (P2-2)
- [ ] Google 로그인 성공
- [ ] Kakao 로그인 성공
- [ ] 로그인 후 세션에 user.id, roles, planName 포함 확인
- [ ] 로그아웃 동작 확인

### 3. 로그인 모달 (P2-3)
- [ ] 게스트 상태에서 "대화 저장" 클릭 시 모달 표시
- [ ] "히스토리" 클릭 시 모달 표시
- [ ] "나중에" 버튼으로 닫기
- [ ] 모달에서 로그인 성공 시 자동 닫힘

### 4. 세션 병합 (P2-4)
- [ ] 게스트로 대화 2개 생성
- [ ] 로그인 후 자동 병합 확인 (DB에서 userId 업데이트 확인)
- [ ] 토스트 메시지 표시 확인
- [ ] 히스토리에서 병합된 대화 표시

### 5. 대화 히스토리 (P2-5)
- [ ] 히스토리 사이드바 표시
- [ ] 대화 목록 렌더링 (제목, 날짜, 메시지 수)
- [ ] 대화 선택 시 채팅 패널에 메시지 로드
- [ ] 대화 삭제 (확인 다이얼로그)
- [ ] 검색 기능 (제목 필터)
- [ ] "새 대화 시작" 버튼

### 6. Sliding Window (P2-6)
- [ ] 10턴 이상 대화 생성
- [ ] Network 탭에서 /api/chat 요청 확인 (messages 길이 제한)
- [ ] AI 응답이 최근 컨텍스트만 참조하는지 확인

### 7. Rate Limiting (P2-7)
- [ ] 게스트로 6번째 대화 생성 시 429 에러
- [ ] 로그인 후 한도 증가 확인 (21번째 대화 생성 시 429)
- [ ] 대화당 21번째 메시지 전송 시 429 에러
- [ ] 에러 UI 피드백 확인
- [ ] 일일 리셋 확인 (다음 날 00:00 후)

### 8. 전체 통합
- [ ] `pnpm ci:check` 통과
- [ ] TypeScript 에러 없음
- [ ] ESLint 경고 없음
- [ ] Prisma 스키마 유효성 검사
- [ ] 프로덕션 빌드 성공 (`pnpm build`)

---

## 주의사항

1. **RULES.md 준수**:
   - DB 접근은 `services/**`만
   - Route Handlers는 prisma 직접 호출 금지
   - 서비스 파일은 `kebab-case.service.ts`
   - 모든 변경 후 `pnpm ci:check` 필수

2. **기존 User 모델 재사용**:
   - apps/web과 동일한 User/Account/Session 테이블 사용
   - 별도 마이그레이션 불필요

3. **Rate Limiter 초기 구현**:
   - In-memory Map 사용 (단일 인스턴스)
   - 서버 재시작 시 카운터 초기화됨
   - 프로덕션에서는 Redis 권장

4. **환경 변수**:
   - `.env.local`에 NextAuth 변수 추가 필요
   - Google/Kakao OAuth 앱 설정 필요 (기존 apps/web과 공유 또는 별도 생성)

5. **세션 병합 타이밍**:
   - 로그인 즉시 자동 병합 (useSessionMerge 훅)
   - 동일 sessionId의 대화가 여러 기기에 있을 경우 모두 병합

6. **게스트 데이터 보존**:
   - 7일 TTL은 클라이언트 localStorage 기준
   - DB의 게스트 대화(userId=null)는 cron으로 정리 (선택사항)
