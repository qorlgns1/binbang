# Phase 5: 모델 추상화 + 고도화

Status: NOT STARTED
Priority: LOW
Depends on: Phase 4

## Goal

LLM 모델을 추상화하여 다양한 모델로 교체 가능한 구조를 만들고, 대화 요약 압축으로 장기 대화 비용을 최적화한다. 사용자 분석 기반 데이터 수집 및 성능 최적화를 수행한다.

## Tasks

### P5-1: LLM 모델 추상화

**현재 파일**: `apps/travel/src/lib/ai/model.ts`

현재 구조:
```typescript
import { google } from '@ai-sdk/google';
export const geminiFlashLite: LanguageModel = google('gemini-2.5-flash-lite');
```

목표 구조:
```typescript
// apps/travel/src/lib/ai/providers.ts
import type { LanguageModel } from 'ai';

type ModelTier = 'lite' | 'standard' | 'pro';

interface ModelConfig {
  provider: string;
  modelId: string;
  tier: ModelTier;
  costPerInputToken: number;
  costPerOutputToken: number;
}

function getModel(tier: ModelTier): LanguageModel { ... }
function selectTierByComplexity(message: string, turnCount: number): ModelTier { ... }
```

- [ ] P5-1-T1: ModelProvider 인터페이스/타입 정의
- [ ] P5-1-T2: Gemini provider 구현 (Flash-Lite, Flash, Pro)
- [ ] P5-1-T3: OpenAI provider 구현 (GPT-4o-mini, GPT-4o) - 선택적
- [ ] P5-1-T4: Claude provider 구현 (Haiku, Sonnet) - 선택적
- [ ] P5-1-T5: 환경 변수로 기본 모델 설정 가능하게 (`LLM_DEFAULT_PROVIDER`, `LLM_DEFAULT_MODEL`)
- [ ] P5-1-T6: 복잡도 기반 자동 모델 선택 로직
  - 간단한 질문 (인사, 단순 추천) → Flash-Lite
  - 복잡한 질문 (다중 도시 비교, 상세 분석) → Flash/Pro
  - 판단 기준: 메시지 길이, 도구 호출 필요 여부, 대화 컨텍스트

### P5-2: 대화 요약 압축

- [ ] P5-2-T1: 대화 요약 생성 로직 구현
  - 트리거: 10턴마다 (또는 sliding window 초과 시)
  - 이전 대화를 LLM으로 요약 (2-3문장)
  - 요약을 시스템 프롬프트에 "이전 대화 요약" 슬롯으로 삽입
- [ ] P5-2-T2: 요약 저장 모델 추가

```prisma
model TravelConversation {
  // 기존 필드 유지
  summary       String?  @db.Text  // 최신 대화 요약
  summarizedAt  DateTime?           // 마지막 요약 시점
}
```

- [ ] P5-2-T3: 요약 생성 시 사용할 모델 선택 (저비용 모델 사용: Flash-Lite)
- [ ] P5-2-T4: 요약 + sliding window 조합 로직
  - 컨텍스트 = 시스템 프롬프트 + 요약 + 최근 10턴
  - 25K+ tokens → ~4K tokens 수준으로 감소
- [ ] P5-2-T5: 요약 품질 테스트 및 프롬프트 튜닝

### P5-3: 사용자 분석/트래킹

- [ ] P5-3-T1: 주요 이벤트 트래킹 정의
  - 대화 시작, 대화 턴 수, 도구 호출 횟수
  - 장소 카드 클릭, 지도 마커 클릭
  - 제휴 링크 클릭 (Phase 3에서 기본 구현)
  - 로그인 전환율 (게스트 → 로그인)
  - 언어별/국가별 사용량
- [ ] P5-3-T2: 분석 데이터 저장 모델

```prisma
model TravelAnalyticsEvent {
  id        String   @id @default(cuid())
  sessionId String
  userId    String?
  event     String   // "chat_start", "tool_call", "card_click", "affiliate_click"
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([event])
  @@index([createdAt])
  @@index([sessionId])
}
```

- [ ] P5-3-T3: 이벤트 수집 API (`POST /api/analytics/event`)
- [ ] P5-3-T4: 관리자 대시보드 - 기본 통계 (일별 대화 수, DAU, 인기 여행지)
- [ ] P5-3-T5: Google Analytics 커스텀 이벤트 연동 (Phase 4에서 GA 설치 후)

### P5-4: 성능 최적화

- [ ] P5-4-T1: 번들 사이즈 분석 (@next/bundle-analyzer)
- [ ] P5-4-T2: 코드 스플리팅 최적화
  - 지도 컴포넌트 lazy loading
  - 카드 컴포넌트 lazy loading
- [ ] P5-4-T3: 이미지 최적화 (next/image 설정 고도화, WebP/AVIF)
- [ ] P5-4-T4: Core Web Vitals 최적화
  - LCP: 히어로 이미지 프리로드
  - CLS: 레이아웃 안정화 (스켈레톤 크기 고정)
  - INP: 이벤트 핸들러 최적화
- [ ] P5-4-T5: Edge Runtime 검토 (API route를 Edge에서 실행 가능한지)
- [ ] P5-4-T6: CDN 캐싱 전략 (정적 자산, ISR 페이지)

### P5-5: 안정성 강화

- [ ] P5-5-T1: E2E 테스트 (Playwright)
  - 채팅 플로우 (메시지 전송 → AI 응답 → 카드 표시 → 마커 표시)
  - 로그인 플로우 (게스트 → 로그인 → 세션 병합)
  - 모바일 플로우
- [ ] P5-5-T2: API 통합 테스트
  - `/api/chat` 스트리밍 응답 테스트
  - `/api/conversations` CRUD 테스트
- [ ] P5-5-T3: 모니터링 강화
  - LLM 호출 성공/실패율 로깅
  - 도구 호출 응답 시간 로깅
  - 비정상 토큰 사용량 알림

## Acceptance Criteria

- [ ] 모델 교체 시 코드 변경 최소화 (환경 변수 수정으로 가능)
- [ ] 30턴 이상 대화 시 요약 압축이 자동 적용
- [ ] 요약 적용 전/후 토큰 사용량 50% 이상 절감
- [ ] Lighthouse 성능 점수 90+ (데스크톱), 80+ (모바일)
- [ ] 주요 사용 흐름에 대한 E2E 테스트 커버리지

## Technical Notes

- AI SDK v6의 provider 패턴이 이미 모델 교체에 적합한 구조
- 대화 요약은 비동기로 처리 (사용자 응답에 영향 없도록)
- 분석 이벤트는 batch로 수집하여 DB 부하 최소화
- E2E 테스트: Playwright (monorepo에 이미 설치되어 있을 가능성 높음)
