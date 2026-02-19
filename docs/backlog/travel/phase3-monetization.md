# Phase 3: 수익화 + 데이터 캐싱

Status: READY FOR IMPLEMENTATION (DECISIONS FINALIZED)
Priority: MEDIUM
Depends on: Phase 2

## Goal

Awin 제휴 네트워크를 기반으로 **멀티 광고주·멀티 카테고리** 수익화를 구현한다.
Admin에서 Awin 가입 광고주를 동기화하고 카테고리를 지정하면, travel 앱이 해당 카테고리 광고주를 자동 선택해 Awin Link Builder로 추적 링크를 생성·노출한다.
Agoda 직접 API는 Stage B 이후 숙소 데이터 고도화(실시간 가격/가용성)를 위한 선택적 보강 경로다.
외부 API 호출 비용 절감을 위한 캐싱 전략을 병행 구축한다.

## 핵심 아키텍처

```text
Admin: Awin 프로그램 동기화
  └─ AffiliateAdvertiser 테이블 (advertiserId, name, category, notes, source)

Travel AI Tool (searchAccommodation / searchEsim / ...)
  └─ 1. category로 AffiliateAdvertiser 조회
  └─ 2. Awin Link Builder API → 추적 링크 생성
  └─ 3. 카드 렌더링 (실링크 or "준비중" 상태)
  └─ 4. AffiliateEvent 트래킹 기록
```

**링크 활성 조건**: DB에 해당 카테고리 광고주가 1개 이상 존재하면 즉시 활성화.
없으면 "준비중" UI 상태로 fallback.

## Decision Snapshot (2026-02-19, Updated)

### 수익화 전략

- **1차 수익화 인프라**: Awin 네트워크 (Link Builder + 카테고리별 광고주 선택)
- **카테고리**: accommodation / flight / esim / car_rental / travel_package / other
- **광고주 선택 규칙**: 카테고리 내 첫 번째 활성 광고주 사용 (향후 가중치/우선순위 확장 가능)
- **링크 생성**: Awin Link Builder API (`/publishers/{publisherId}/linkbuilder/generate`)
- **`clickref` 구성**: `{conversationId}:{hotelId or productId}` 형식으로 트래킹 연계
- **Agoda 직접 API**: Stage B 이후 숙소 실시간 가격 고도화에만 사용 (Awin과 병행)

### CTA 정책

- **DB에 카테고리 광고주 존재 시**: CTA 활성 + Awin 추적 링크 연결
- **DB에 카테고리 광고주 없을 시**: CTA 비활성 + "제휴 링크 준비중" 안내 문구 노출
- **CTA 시도 UX (비활성 시)**: 클릭 시 토스트 + 짧은 안내 모달 노출
- **투명성**: 카드에 "광고/제휴" 라벨 기본 노출

### 트래킹 정책

- **Stage A 트래킹 기준**: 카드 노출(`impression`) + CTA 클릭(`outbound_click` or `cta_attempt`) 모두 기록
- **provider 필드**: `awin:{advertiserId}` (광고주 확정 시) / `awin_pending:{category}` (광고주 없을 시)
- **Stage A `cta_attempt` reasonCode**: `no_advertiser_for_category` (카테고리 광고주 미등록 시)
- **impression 중복 정책**: 사용자 로컬 타임존 기준 동일 `conversationId + productId` 조합 하루 1회만 기록
- **타임스탬프 정책**: 이벤트 저장 시각(`occurredAt`)은 UTC로 고정 저장
- **타임존 소스 우선순위**: 프로필 타임존 우선, 미설정 시 브라우저 타임존 fallback
- **타임존 fallback 정책**: `userTimezone` 미수집 시 dedupe/집계 기준을 UTC day로 적용
- **표시 정책**: 관리자/사용자 화면 시간은 브라우저 로컬 타임존으로 변환 표시

### 대시보드

- **집계 주기**: 5분 단위 집계 캐시(near-real-time)
- **캐시 무효화**: Stage A는 TTL 만료 기반만 사용 (이벤트 즉시 무효화 없음)

### 캐싱

- **캐시 저장소**: Redis 단일 + 백엔드 SWR(`stale-while-revalidate`) 적용
- **React Query**: 도입하지 않음
- **환율 워밍업**: 인기 통화쌍(USD/KRW, USD/JPY, USD/EUR)만 선적용

### 숙소 데이터 소스

- **Stage A**: `searchPlaces` 호텔 타입 결과를 임시 재사용 (메타데이터용)
- **Stage B**: Agoda 직접 API 연결 시 실시간 가격/가용성으로 교체

### 컴플라이언스

- 제휴 고지 문구 필수 ("예약/구매 시 제휴 수수료를 받을 수 있음")
- 비제휴 대안 결과 병기 (기본 2개)
- 비제휴 대안 선정: rating DESC, reviewCount DESC; 부족분은 원본 순서 보충

### Stage B (Agoda 직접 API 수령 후)

- 계정 기본 토글 + 대화별 오버라이드 설정 활성화
- 대화 설정 저장소: `ConversationPreference` 별도 테이블
- 대화 소유자만 오버라이드 변경 가능
- 오버라이드 변경 감사 로그: 기본 이력(`who/when/from/to/conversationId`) 저장
- 감사 로그 보관: 1년, DB cron 일 1회 hard delete
- 정리 배치 실패: 즉시 3회 재시도(지수 백오프) 후 운영 알림
- 알림 스팸 방지: 동일 원인 실패는 24시간 1회 + 복구 시 1회
- 복구 알림 필드: `jobName`, `failedAt`, `recoveredAt`, `retryCount`, `lastErrorCode`
- 운영 알림 채널: Telegram `critical` / `warning` 분리
- Telegram 포맷: Markdown 템플릿
- Telegram 발송 범위:
  - critical: `최종 실패`, `복구`, `cron 미실행`
  - warning: `redis_write_failed`
- `cron 미실행` 알림 임계값: 90분 (마지막 `run_started` 기준)
- `run_started` 저장: Redis + DB 동시 저장

## Decision Freeze (2026-02-19)

본 문서의 주요 정책 의사결정은 완료되었고, 추가 질의 없이 구현 단계로 진행한다.

## Rollout Scope

### Stage A (지금 바로 진행)

**Awin 기반 제휴 링크 생성**
- [x] 카테고리별 광고주 조회 서비스 구현 (`getFirstAdvertiserByCategory(category)`)
- [x] Awin Link Builder 클라이언트 구현 (travel 앱용 → `apps/travel/src/lib/api/awinLinkBuilder.ts`)
  - `clickref` = `{conversationId}:{productId}` 형식
  - `shorten` 옵션 선택적 지원
- [x] 광고주 없는 카테고리에 대한 "준비중" fallback 처리

**AI Tools (travel)**
- [x] `searchAccommodation` 도구 추가 (`apps/travel/src/lib/ai/tools.ts`)
  - Stage A: `searchPlaces` 호텔 타입 shim + Awin Link Builder 연동
  - 광고주 없으면 `awin_pending:accommodation` provider로 기록
- [x] `searchEsim` 도구 추가 (esim 카테고리 광고주 연동)
- [x] 시스템 프롬프트에 카테고리별 도구 사용 규칙 추가 (숙소→`searchAccommodation`, eSIM→`searchEsim`)

**UI 컴포넌트**
- [x] `AccommodationCard` 컴포넌트 생성 (평점, 이미지, "예약하기" CTA)
  - CTA 활성/비활성 이분 처리 (광고주 유무 기준)
  - 가격 필드: Stage A 비노출 + "가격은 제휴 연동 후 제공" 문구
  - "광고/제휴" 라벨 기본 표시
- [x] CTA 비활성 시 토스트 + 안내 모달 노출
- [x] 제휴 고지 문구 + 비제휴 대안 카드 2개 동시 노출
- [x] 비제휴 대안 랭킹 규칙 구현 (rating DESC, reviewCount DESC)
- [x] 비제휴 대안 fallback 규칙 구현 (데이터 없는 항목 후순위, 부족분 원본 순서)
- [x] `searchPlaces` 호텔 타입 결과를 `AccommodationCard` 데이터로 매핑

**트래킹**
- [ ] 트래킹 DB/API 구축 (`impression`, `outbound_click`, `cta_attempt` 이벤트)
  - provider 필드: `awin:{advertiserId}` 또는 `awin_pending:{category}`
  - reasonCode: 비활성 시 `no_advertiser_for_category`
- [ ] 이벤트에 `userTimezone` 저장 (프로필 IANA 우선, 미설정 시 브라우저)
- [ ] `impression` dedupe (`conversationId + productId + local_day`, 하루 1회)

**캐싱**
- [ ] Places/Weather/Exchange 캐시 핵심 구축 (Redis + SWR + stale-if-error)
- [ ] 환율 인기 통화쌍 워밍업 (USD/KRW, USD/JPY, USD/EUR)

### Stage B (Agoda 직접 API 수령 후 진행)

- [ ] Agoda API 클라이언트 연결 (`apps/travel/src/lib/api/agoda.ts`)
- [ ] `searchAccommodation`에서 Agoda provider로 전환 (실시간 가격/가용성)
- [ ] 가격/통화 실데이터 노출
- [ ] 제휴 링크 설정 반영 (계정 기본 토글 + 대화별 오버라이드)
- [ ] `ConversationPreference` 테이블에 대화별 설정 영구 저장
- [ ] 대화 소유자만 오버라이드 변경 가능하도록 권한 체크
- [ ] 오버라이드 변경 감사 로그 저장
- [ ] 관리자 대시보드에 전환율/수익 리포트 연결

## Revenue Model

```text
사용자 질문 (숙소/eSIM/항공/렌터카 등)
  ↓
AI Tool (카테고리 감지 → searchAccommodation / searchEsim / ...)
  ↓
AffiliateAdvertiser DB에서 카테고리 광고주 조회
  ↓
Awin Link Builder → 추적 링크 생성
  ↓
카드/CTA에 링크 노출 → 사용자 클릭 → 광고주 사이트에서 구매/예약
  ↓
Awin 트랜잭션 API로 전환 확인 → 레퍼럴 수수료 수익
```

**카테고리별 수익화 경로**

| 카테고리 | AI 도구 | Stage A 광고주 소스 | Stage B 고도화 |
|---|---|---|---|
| accommodation | `searchAccommodation` | Awin 가입 숙소 광고주 | Agoda 직접 API (가격/가용성) |
| esim | `searchEsim` | Awin 가입 eSIM 광고주 | — |
| flight | `searchFlight` | Awin 가입 항공 광고주 | — |
| car_rental | `searchCarRental` | Awin 가입 렌터카 광고주 | — |
| travel_package | `searchTravelPackage` | Awin 가입 패키지 광고주 | — |

### 가입 광고주 관리 (Admin → Awin)

**흐름:**
1. Admin → 가입 광고주 관리 → "Awin에서 가져오기" → Awin Programmes(joined) 목록 DB 동기화
2. 각 광고주에 카테고리(숙소/항공/eSIM 등)와 메모 지정 후 저장
3. Travel 앱: 요청 카테고리 판단 → DB에서 `category`로 광고주 조회 → Awin Link Builder로 추적 링크 생성 → 카드/CTA에 노출

**기존 구현 (완료):**
- `AffiliateAdvertiser` DB 모델 (`advertiserId`, `name`, `category`, `notes`, `source`)
- Admin API: `GET/PATCH /api/admin/awin/advertisers`, `POST /api/admin/awin/advertisers/sync`
- Admin UI: `/admin/affiliate-advertisers`, `/admin/awin` (Link Builder/Offers/Transactions/Reports 테스트 포함)

**travel 연동 (이번 Phase 구현):**
- 카테고리별 광고주 조회 서비스
- Awin Link Builder 클라이언트 (travel 앱용)
- AI 도구에서 위 두 서비스 호출

## Tasks

### P3-1: Awin 기반 제휴 링크 연동

- [x] P3-1-T0: 카테고리별 광고주 조회 서비스 구현
  - `apps/travel/src/services/affiliate-advertiser.service.ts`
  - `getFirstAdvertiserByCategory(category: AffiliateAdvertiserCategory)`
  - shared DB 직접 조회 (prisma)
- [x] P3-1-T1: Awin Link Builder travel 클라이언트 구현
  - `apps/travel/src/lib/api/awinLinkBuilder.ts`
  - `generateAffiliateLink({ advertiserId, destinationUrl, clickref, shorten? })`
  - `clickref` = `{conversationId}:{productId}`
  - 실패 시 `null` 반환 (fallback → "준비중" 상태)
- [x] P3-1-T2: `searchAccommodation` AI 도구 추가 (`apps/travel/src/lib/ai/tools.ts`)
  - Stage A: `searchPlaces` 호텔 타입 shim → Awin Link Builder 연동
  - 광고주 없으면 `{ provider: 'awin_pending:accommodation', ctaEnabled: false }` 반환
- [x] P3-1-T3: `searchEsim` AI 도구 추가 (esim 카테고리 광고주 연동)
- [x] P3-1-T4: 시스템 프롬프트에 카테고리별 도구 사용 규칙 추가
- [x] P3-1-T5: `AccommodationCard` 컴포넌트 생성
  - props: `{ accommodation, ctaEnabled }`
  - CTA 활성 시: 실링크 연결 + "예약하기" 버튼
  - CTA 비활성 시: 비활성 버튼 + 클릭 시 토스트 + 안내 모달
  - 가격 필드: Stage A 비노출 + "가격은 제휴 연동 후 제공" 문구
  - "광고/제휴" 라벨 기본 표시
- [x] P3-1-T5-A: Stage A UI 정책 반영 (가격 비노출 + 준비중 문구 + 토스트/안내 모달)
- [ ] P3-1-T5-B: Stage B UI 정책 반영 (Agoda 가격/통화 실데이터 노출)
- [x] P3-1-T6: Stage A 임시 숙소 소스 구현 (`searchPlaces` 호텔 타입 결과 재사용)
- [x] P3-1-T7: 비제휴 대안 2개 병기 구현 (rating DESC, reviewCount DESC, fallback: 원본 순서)

### P3-2: 레퍼럴 트래킹

- [ ] P3-2-T1: 제휴 이벤트 트래킹 DB 모델 추가

```prisma
model AffiliateEvent {
  id             String   @id @default(cuid())
  conversationId String?
  userId         String?
  userTimezone   String?  // 예: "Asia/Seoul", "America/Los_Angeles"
  provider       String   // "awin:{advertiserId}" | "awin_pending:{category}" | "agoda_direct"
  eventType      String   // "impression" | "cta_attempt" | "outbound_click"
  reasonCode     String?  // "no_advertiser_for_category" | null
  idempotencyKey String?  @unique // impression:{conversationId}:{productId}:{local_or_utc_yyyy-mm-dd}
  productId      String   // hotelId, esimPlanId 등 카테고리별 상품 ID
  productName    String   // 상품명
  category       String   // "accommodation" | "esim" | "flight" | ...
  isCtaEnabled   Boolean  @default(false)
  occurredAt     DateTime @default(now())

  @@index([provider, eventType])
  @@index([eventType, reasonCode])
  @@index([category, eventType])
  @@index([occurredAt])
}
```

- [ ] P3-2-T2: 이벤트 트래킹 API endpoint (`POST /api/affiliate/event`)
- [ ] P3-2-T3: Stage A 퍼널 지표 정의 (impression → outbound_click 비율, 카테고리별)
- [ ] P3-2-T4: 관리자 대시보드 - 노출/시도/클릭 기본 통계 (5분 집계 캐시, 카테고리별 필터)
- [ ] P3-2-T5: Awin Transactions API 연동으로 전환/수익 확인
- [ ] P3-2-T6: `cta_attempt` 발생 시 `reasonCode=no_advertiser_for_category` 저장 검증
- [ ] P3-2-T7: `impression` dedupe 구현 (사용자 로컬 day 기준 `conversationId + productId + local_day`)
- [ ] P3-2-T8: `userTimezone` 파이프라인 검증 (프로필 → 브라우저 fallback → API → DB 저장)
- [ ] P3-2-T9: `userTimezone` 미수집 fallback 검증 (UTC day 기준 dedupe/집계)
- [ ] P3-2-T10: 대시보드 시간 표시 로직 검증 (저장 UTC, 렌더링 브라우저 로컬)
- [ ] P3-2-T11: 타임존 source 우선순위 검증 (프로필 값이 있으면 브라우저 값보다 우선)
- [ ] P3-2-T12: 대시보드 집계 캐시 TTL 검증 (300초, 만료 후 재집계)
- [ ] P3-2-T13: Stage A 캐시 무효화 정책 검증 (TTL 만료 기반만, 이벤트 즉시 무효화 없음)

### P3-3: 자연스러운 제휴 링크 삽입

- [ ] P3-3-T1: AI 응답에서 카테고리별 추천 시 Awin 추적 링크가 자연스럽게 표시되도록 프롬프트 조정
- [ ] P3-3-T2: 제휴 고지 문구 표시 (카드/CTA 인접, "예약/구매 시 제휴 수수료를 받을 수 있음")
- [ ] P3-3-T3: 제휴 링크 설정 옵션 구현 (Stage B)
  - 계정 기본 토글 (`affiliate_links_enabled`)
  - 대화별 오버라이드 (`conversation_affiliate_override`)
- [ ] P3-3-T3-A: 대화 설정 저장소 분리 (`ConversationPreference` 테이블)
  - `conversationId` (unique)
  - `affiliateOverride` (`inherit` | `enabled` | `disabled`)
  - `updatedAt`
- [ ] P3-3-T4: 제휴 링크 없는 일반 검색 결과도 함께 표시 (기본 2개 병기)
- [ ] P3-3-T5: 비제휴 대안 정렬 기준 고정 (rating DESC, reviewCount DESC)
- [ ] P3-3-T6: 비제휴 대안 fallback 규칙 적용 (rating/reviewCount 누락 시 원본 순서 보충)
- [ ] P3-3-T7: Stage A `cta_attempt` UX 표준화 (토스트 + 짧은 안내 모달)
- [ ] P3-3-T8: 설정 우선순위 규칙 고정 (대화별 오버라이드 > 계정 기본값)
- [ ] P3-3-T9: 대화별 오버라이드 영속성 검증 (명시 변경 전까지 유지)
- [ ] P3-3-T10: `ConversationPreference` 조회/업서트 경로 검증 (읽기/쓰기/초기값 `inherit`)
- [ ] P3-3-T11: 오버라이드 변경 권한 검증 (대화 owner 허용, 비소유자 403)
- [ ] P3-3-T12: 오버라이드 변경 감사 로그 저장 검증 (`actorUserId`, `changedAt`, `fromValue`, `toValue`, `conversationId`)
- [ ] P3-3-T13: 감사 로그 보관 정책 적용 (365일 초과 데이터 대상 DB cron 일 1회 hard delete)
- [ ] P3-3-T14: 정리 배치 검증 (cron 실행 성공/삭제 건수 로깅)
- [ ] P3-3-T15: 정리 배치 실패 재시도 구현 (최대 3회, exponential backoff)
- [ ] P3-3-T16: 3회 재시도 실패 시 운영 알림 연동 (Telegram Bot API, `critical/warning` 라우팅)
- [ ] P3-3-T17: 알림 dedupe 구현 (동일 failure cause 24시간 1회)
- [ ] P3-3-T18: 복구 알림 구현 (실패 상태 해소 시 1회 발송, 필드: `jobName/failedAt/recoveredAt/retryCount/lastErrorCode`)
- [ ] P3-3-T19: 복구 알림 payload 스키마 검증 (필수 필드 누락 시 전송 차단 + 로그)
- [ ] P3-3-T20: Telegram 알림 Markdown 템플릿 구현 (실패/복구 공통 스타일)
- [ ] P3-3-T21: Markdown 특수문자 이스케이프 처리 검증 (알림 렌더링 깨짐 방지)
- [ ] P3-3-T22: Telegram 발송 범위 제한 구현 (critical/warning 라우팅)
- [ ] P3-3-T23: cron 미실행 감지 구현 (마지막 `run_started` 기준으로 `AFFILIATE_AUDIT_PURGE_CRON_MISS_THRESHOLD_MINUTES` 초과 시 알림)
- [ ] P3-3-T24: `run_started` 타임스탬프 Redis + DB 동시 기록(dual write)
- [ ] P3-3-T25: `cron_missed` 판단 조회 우선순위 구현 (Redis 우선, 미스 시 DB fallback)
- [ ] P3-3-T26: `run_started` 저장 성공 조건 구현 (DB 성공 기준, Redis 실패 시 `warning` + Telegram 운영 알림)
- [ ] P3-3-T27: 알림 심각도 매핑 검증 (`redis_write_failed=warning`)
- [ ] P3-3-T28: Telegram 채널/스레드 라우팅 검증 (`critical` vs `warning`)

### P3-4: Google Places API 캐싱

**현재 파일**: `apps/travel/src/lib/api/places.ts`

- [ ] P3-4-T1: Places API 응답 캐시 레이어 구현 (Cache-Aside + SWR)
  - 캐시 키: `places:{normalized_query_hash}`
  - TTL: 24시간 + TTL jitter(±10%)
- [ ] P3-4-T2: 캐시 저장소 Redis 단일 운영으로 고정 (docker-compose redis 재사용)
- [ ] P3-4-T3: 캐시 히트/미스/스테일 반환 로깅
- [ ] P3-4-T4: Stampede 방지 lock (동일 key 재계산 단일화)
- [ ] P3-4-T5: stale-if-error 정책 (외부 API 실패 시 최근 stale 데이터 반환)
- [ ] P3-4-T6: 캐시 무효화 전략 (수동 + TTL 기반)

### P3-5: 날씨/환율 데이터 캐싱

**현재 파일**: `apps/travel/src/lib/api/weather.ts`, `exchangeRate.ts`

- [ ] P3-5-T1: 환율 데이터 캐싱 (TTL: 1시간)
- [ ] P3-5-T2: 날씨 히스토리 데이터 캐싱 (TTL: 7일)
- [ ] P3-5-T3: SWR + stale-if-error 공통 정책 적용 (백엔드 캐시 레이어 공용)
- [ ] P3-5-T4: 캐시 워밍업 - 인기 통화쌍 사전 로딩 (USD/KRW, USD/JPY, USD/EUR)

### P3-6: 인기 여행지 사전 캐싱 (Stage B 이후)

- [ ] P3-6-T1: 인기 여행지 목록 정의 (Tokyo, Seoul, Bangkok, Paris 등 Top 30)
- [ ] P3-6-T2: Cron job으로 인기 여행지 데이터 주기적 사전 로딩
  - Places: 주요 관광지, 호텔, 식당
  - 날씨: 월별 히스토리
  - 환율: 해당 국가 통화
- [ ] P3-6-T3: 사전 캐시된 데이터가 있으면 API 호출 스킵 로직

## Cost Impact Analysis

| API | 현재 비용/호출 | 캐시 후 예상 절감 |
|-----|----------------|-------------------|
| Google Places | ~$0.017/request | 70-80% 절감 (반복 쿼리 높음) |
| OpenWeatherMap | Free tier 60/min | 캐시로 rate limit 여유 확보 |
| ExchangeRate | Free tier 1500/month | 캐시로 호출 수 90% 절감 |
| Awin Link Builder | 분당 20회 제한 | 링크 캐싱으로 반복 호출 방지 |
| Agoda Affiliate | Free (수익 창출) | N/A |

## Acceptance Criteria

### Stage A

- [ ] 숙소 관련 질문 시 `AccommodationCard` 표시
  - DB에 accommodation 광고주 존재 시: CTA 활성 + Awin 추적 링크 연결
  - DB에 광고주 없을 시: CTA 비활성 + "제휴 링크 준비중" 안내 + "광고/제휴" 라벨
- [ ] eSIM 관련 질문 시 DB에서 esim 카테고리 광고주 조회 후 Awin 링크 생성
- [ ] 카드 데이터가 `searchPlaces` 호텔 타입 결과에서 안정적으로 매핑되어 표시
- [ ] 가격 필드는 숨김 처리 + "가격은 제휴 연동 후 제공" 문구 노출
- [ ] 제휴 고지 문구와 비제휴 대안 카드/링크 2개가 함께 노출
- [ ] 비제휴 대안 2개가 평점/리뷰 수 기준 상위 결과로 선택되어 노출
- [ ] 평점/리뷰 데이터 부족 시 fallback 규칙으로 비제휴 대안 2개가 유지됨
- [ ] 비활성 CTA 클릭 시 토스트 + 안내 모달 노출 + `cta_attempt` 이벤트 기록
- [ ] `impression`, `cta_attempt`, `outbound_click` 이벤트가 DB에 정상 기록
  - 활성 CTA: `provider=awin:{advertiserId}`
  - 비활성 CTA: `provider=awin_pending:{category}`
- [ ] 동일 `conversationId + productId`의 `impression`이 로컬 날짜 기준 하루 1회만 기록
- [ ] `cta_attempt` 이벤트에 `reasonCode=no_advertiser_for_category`가 저장됨
- [ ] 이벤트별 `userTimezone`가 DB에 저장됨 (프로필 우선, 미설정 시 브라우저 fallback)
- [ ] `userTimezone` 미수집 이벤트는 UTC day 기준으로 dedupe/집계됨
- [ ] 대시보드 통계가 5분 캐시 기준으로 제공되고 만료 시 재집계됨
- [ ] 동일 Places 검색 시 두 번째부터 캐시 응답
- [ ] 환율/날씨 캐시 정상 동작 및 TTL 만료 후 갱신

### Stage B

- [ ] 숙소 관련 질문 시 Agoda 제휴 링크가 포함된 카드 표시
- [ ] 숙소 카드에 Agoda 가격/통화 정보가 정확히 표시
- [ ] 제휴 고지 문구가 링크 인접 위치에 표시되고 비제휴 대안 2개 함께 제공
- [ ] 계정 기본 토글 + 대화별 오버라이드 설정이 동작하고 대화별 설정이 우선 적용됨
- [ ] 대화별 오버라이드 값이 대화 단위로 영구 유지되고 명시 변경 시에만 갱신됨
- [ ] 대화 소유자만 오버라이드를 변경할 수 있고, 비소유자 요청은 403으로 차단됨
- [ ] 오버라이드 변경 시 기본 감사 로그가 누락 없이 저장됨
- [ ] 감사 로그가 1년 보관 정책을 따르고 365일 초과 데이터가 DB cron으로 hard delete됨
- [ ] 정리 배치 실패 시 즉시 3회 재시도되고 최종 실패 시 Telegram 알림 발송됨
- [ ] 동일 원인 실패 알림은 24시간 내 1회로 제한되고 복구 시 1회 알림 발송됨
- [ ] Telegram 알림이 Markdown 템플릿으로 가독성 있게 렌더링됨
- [ ] Agoda provider 기준 전환 리포트가 대시보드에서 조회 가능

## Environment Variables (New)

```dotenv
# Awin (이미 일부 존재, travel 앱 추가 필요)
AWIN_API_TOKEN=your-token
AWIN_PUBLISHER_ID=your-publisher-id  # /accounts API로 조회 가능

# Link Builder
AWIN_LINK_BUILDER_SHORTEN=false  # true면 단축 URL 포함

# Agoda (Stage B)
AGODA_AFFILIATE_API_KEY=your-key
AGODA_AFFILIATE_SITE_ID=your-site-id

# Cache
CACHE_PROVIDER=redis
CACHE_DEFAULT_TTL_SECONDS=86400
AFFILIATE_DASHBOARD_CACHE_TTL_SECONDS=300
AFFILIATE_LINK_DEFAULT_ENABLED=true

# Audit Log (Stage B)
AFFILIATE_AUDIT_RETENTION_DAYS=365
AFFILIATE_AUDIT_PURGE_CRON="10 3 * * *"
AFFILIATE_AUDIT_PURGE_RETRY_MAX=3
AFFILIATE_AUDIT_PURGE_RETRY_BACKOFF_SECONDS=10
AFFILIATE_AUDIT_ALERT_TELEGRAM_BOT_TOKEN=your-bot-token
AFFILIATE_AUDIT_ALERT_TELEGRAM_CRITICAL_CHAT_ID=your-critical-chat-id
AFFILIATE_AUDIT_ALERT_TELEGRAM_WARNING_CHAT_ID=your-warning-chat-id
AFFILIATE_AUDIT_ALERT_TELEGRAM_CRITICAL_THREAD_ID=optional-thread-id
AFFILIATE_AUDIT_ALERT_TELEGRAM_WARNING_THREAD_ID=optional-thread-id
AFFILIATE_AUDIT_ALERT_DEDUPE_WINDOW_SECONDS=86400
AFFILIATE_AUDIT_ALERT_RECOVERY_ENABLED=true
AFFILIATE_AUDIT_PURGE_CRON_MISS_THRESHOLD_MINUTES=90
AFFILIATE_RUN_STARTED_REDIS_KEY_PREFIX=affiliate:audit:run_started
```

## Technical Notes

- **캐시 저장소**: Redis (docker-compose에 이미 포함)
- **travel 서비스 Redis 접속**: 같은 docker network (`binbang_shared_network`)
- **Awin API Rate Limit**: 분당 20회 → 링크는 생성 후 캐싱 권장 (캐시 키: `awin:link:{advertiserId}:{destinationUrlHash}`)
- **Awin Publisher ID**: `AWIN_API_TOKEN`으로 `/accounts` API 호출 → 첫 번째 publisher accountId 사용 (`fetchPublisherId` 기존 구현 존재)
- **provider 필드 규칙**: 광고주 확정 시 `awin:{advertiserId}`, 미확정 시 `awin_pending:{category}`, Agoda 직접 API 시 `agoda_direct`
- **대시보드 집계 캐시**: Redis key 기반 5분 TTL
- **Stage A 캐시 무효화**: TTL 만료 기반만 (이벤트 즉시 무효화 미적용)
- **Stage B 설정 저장소**: 계정 기본값(User)과 대화 오버라이드(`ConversationPreference`) 분리
- **Stage B 권한**: 대화 설정 변경 API는 conversation owner 권한 필수
- **Agoda 링크 형식 (Stage B)**: `https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid={SITE_ID}&hid={HOTEL_ID}`
