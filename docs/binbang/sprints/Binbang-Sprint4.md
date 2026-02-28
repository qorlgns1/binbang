# Binbang Sprint 4 — 알림 설정 완성 & 공개 전환

> **상태: 계획 중**
> 기간: 2026-04-06 ~ 2026-04-17 (2주, Day 31~40)
> 최종 업데이트: 2026-02-27

---

## Executive Summary

Sprint 3까지 완성된 폴링 파이프라인(이메일 + 카카오)을 사용자가 **직접 제어**할 수 있도록 하고,
신규 사용자가 Binbang를 발견·가입·유지할 수 있는 **공개 전환 기반**을 만든다.

**핵심 과제**:
- 숙소별 알림 타입(vacancy / price_drop / 둘 다) 선택 기능
- priceDropThreshold + alertTypes UI (숙소 수정 페이지)
- 카카오 연동 상태 표시 + 설정 페이지 (`/settings/notifications`)
- 공개 홈페이지에 Binbang 소개 섹션 추가
- 온보딩 강화 (카카오 연동 유도, 첫 숙소 등록 가이드)
- 수익화 진입점 강화 (quota 초과 → upgrade CTA)

---

## 아키텍처 결정 사항

| 항목 | 결정 |
|---|---|
| alertTypes 저장 방식 | `Accommodation.alertTypes String[] @default(["vacancy","price_drop"])` (Postgres 배열) |
| alertTypes 적용 위치 | `agoda-polling.service.ts` — vacancy/price_drop 감지 루프 진입 전 조건 분기 |
| 카카오 연결 해제 | DB `kakaoAccessToken / kakaoRefreshToken / kakaoTokenExpiry = null` UPDATE (토큰 폐기 API 별도 미호출, MVP) |
| 온보딩 카카오 스텝 | `FirstUserTutorialDialog` 5단계로 확장 (기존 4단계 + 카카오 연동 유도) |
| 공개 홈 Binbang 섹션 | 기존 `/(public)/[lang]/page.tsx` 내 섹션 추가 (별도 라우트 불필요) |

---

## Sprint 4 완료 기준

- 사용자가 숙소 수정 페이지에서 알림 타입(vacancy / price_drop / 둘 다)을 선택할 수 있다
- 사용자가 숙소 수정 페이지에서 priceDropThreshold를 입력할 수 있다 (현재는 API만 존재)
- `/settings/notifications`에서 카카오 연동 상태를 확인하고 연결/해제할 수 있다
- 공개 홈 페이지(`/ko`, `/en`)에 Binbang 기능 소개 섹션이 있다
- 튜토리얼 완료 후 카카오 연동을 권장하는 스텝이 노출된다
- quota 초과 시 upgrade 버튼이 노출되고 pricing 페이지로 연결된다

---

## DB 마이그레이션

### `add_accommodation_alert_types`
```sql
ALTER TABLE "accommodations" ADD COLUMN "alertTypes" TEXT[] NOT NULL DEFAULT ARRAY['vacancy','price_drop'];
```

---

## W7: 알림 설정 UX 완성 (Day 31~35)

### W7-D1: 숙소별 alertTypes 필드 ⬜

**목표**: 사용자가 숙소별로 어떤 종류의 알림을 받을지 선택한다.
현재는 폴링 시 vacancy + price_drop 모두 감지·알림 발송. 선택 불가.

| Task | 파일 | 내용 |
|---|---|---|
| T1 | `packages/db/prisma/schema.prisma` | `Accommodation.alertTypes String[] @default(["vacancy","price_drop"])` + migration |
| T2 | `services/accommodations.service.ts` | `UpdateAccommodationInput.alertTypes` + `ACCOMMODATION_SELECT.alertTypes` + update 로직 |
| T3 | `api/accommodations/[id]/route.ts` | PATCH 스키마에 `alertTypes: z.array(z.enum(['vacancy','price_drop'])).min(1).optional()` |
| T4 | `services/agoda-polling.service.ts` | vacancy / price_drop 감지 루프 앞에 `accommodation.alertTypes.includes(...)` 조건 추가 |

**테스트**:
- `agoda-polling.service.ts` 관련 테스트에 alertTypes=['price_drop']일 때 vacancy 이벤트 생성 안 됨 케이스 추가

---

### W7-D2: 숙소 수정 UI에 알림 설정 섹션 ⬜

**목표**: `accommodations/[id]/edit/page.tsx`에 alertTypes 토글 + priceDropThreshold 입력 UI 추가.
현재 수정 페이지는 이름/URL/체크인아웃/인원 수정만 가능.

| Task | 파일 | 내용 |
|---|---|---|
| T1 | `features/accommodations/mutations.ts` | `useUpdateAccommodationMutation` — alertTypes + priceDropThreshold 포함 |
| T2 | `accommodations/[id]/edit/page.tsx` | "알림 설정" 섹션 추가: alertTypes 체크박스(vacancy/price_drop), priceDropThreshold 숫자 입력(%) |
| T3 | `types/accommodation.ts` | `Accommodation.alertTypes: string[]` 추가 (이미 없는 경우) |

**UI 상세**:
- alertTypes: Checkbox 그룹 (`빈방 감지`, `가격 하락 감지`) — 최소 1개 필수
- priceDropThreshold: 숫자 input + `%` 표시 (1~50), 비워두면 전역 설정 사용
- `price_drop`이 선택 해제되면 priceDropThreshold 입력 필드 비활성화

---

### W7-D3: 알림 채널 설정 페이지 (`/settings/notifications`) ⬜

**목표**: 사용자가 카카오 연동 상태를 확인하고 연결/해제할 수 있다.
현재 설정 페이지는 `/settings/subscription` 만 존재.

| Task | 파일 | 내용 |
|---|---|---|
| T1 | `api/user/kakao/disconnect/route.ts` | DELETE: kakaoAccessToken/RefreshToken/TokenExpiry = null UPDATE |
| T2 | `features/user/queries.ts` | `useKakaoStatusQuery` — `GET /api/user/kakao/status` (연동 여부 + 만료일) |
| T3 | `settings/notifications/page.tsx` | 신규: 카카오 연동 상태 카드 (연결됨/미연결) + 연결하기/해제 버튼 |
| T4 | `(app)/layout.tsx` 또는 Sidebar | "알림 설정" 메뉴 항목 추가 (`/settings/notifications`) |

**UI 상세**:
- 카카오 연결됨: 초록 뱃지 + "연결 해제" 버튼 + 토큰 만료 예정일
- 카카오 미연결: 회색 뱃지 + "카카오로 연결하기" 버튼 (`signIn('kakao')`)

---

## W8: Binbang 공개 전환 (Day 36~40)

### W8-D1: 공개 홈 Binbang 소개 섹션 ⬜

**목표**: 비로그인 사용자가 홈에서 Binbang 기능을 발견하고 가입 CTA로 유입된다.

| Task | 파일 | 내용 |
|---|---|---|
| T1 | `(public)/[lang]/page.tsx` | Binbang 소개 섹션 추가 (Agoda 호텔 모니터링 + 카카오 실시간 알림 + 가격 하락 감지) |
| T2 | `messages/ko.json` + `messages/en.json` | `binbang` namespace 추가 (hero/features/cta 문자열) |
| T3 | `(public)/[lang]/page.tsx` | Feature 카드 3종: 🏨 빈방 감지 / 💸 가격 하락 감지 / 💬 카카오 즉시 알림 |

**UI 상세**:
- 기존 홈 섹션 아래에 "Binbang" 소개 블록 추가
- 비로그인: "무료로 시작하기 →" 버튼 (`/ko/signup`)
- 로그인 상태: "대시보드 바로가기 →" 버튼 (`/dashboard`)

---

### W8-D2: 온보딩 강화 (카카오 연동 유도) ⬜

**목표**: 첫 가입 사용자가 튜토리얼 완료 후 카카오 연동까지 이어진다.

| Task | 파일 | 내용 |
|---|---|---|
| T1 | `dashboard/_components/FirstUserTutorialDialog.tsx` | 5단계로 확장: 기존 4단계 + 카카오 연동 유도 스텝 (`step5`) |
| T2 | `messages/ko.json` + `messages/en.json` | `tutorial.step5` 키 추가 (카카오 알림 연동 안내) |
| T3 | `FirstUserTutorialDialog.tsx` | 마지막 스텝에 "카카오 연결하기" 버튼 추가 (클릭 시 `signIn('kakao')`) |

**플로우**: 가입 → 튜토리얼(1~4단계: 서비스 소개) → **5단계: 카카오 알림 연동 권장** → 완료

---

### W8-D3: 수익화 진입점 강화 ⬜

**목표**: quota 초과 / 한도 임박 시 upgrade CTA가 명확하게 노출된다.

| Task | 파일 | 내용 |
|---|---|---|
| T1 | `dashboard/_lib/actionCardGenerator.ts` | `QUOTA_NEAR_LIMIT` 카드의 CTA를 `navigate_pricing`으로 연결 (현재 상태 확인) |
| T2 | `(public)/[lang]/pricing/_components/PricingCards.tsx` | Binbang 기능(알림 횟수 / 모니터링 숙소 수 / 카카오 알림) 요금제별 명세 추가 |
| T3 | `(app)/layout.tsx` 또는 AccommodationBoard | quota 100% 도달 시 인라인 upgrade 배너 표시 |

---

## 환경 변수 (Sprint 4 신규 없음)

Sprint 4는 기존 변수 재사용. 카카오 disconnect는 DB만 변경하므로 추가 env 불필요.

---

## 수정/생성 파일 목록

| 작업 | 파일 |
|---|---|
| 수정 | `packages/db/prisma/schema.prisma` |
| 신규 | `packages/db/prisma/migrations/…_add_accommodation_alert_types/` |
| 수정 | `apps/web/src/services/accommodations.service.ts` |
| 수정 | `apps/web/src/services/agoda-polling.service.ts` |
| 수정 | `apps/web/src/app/api/accommodations/[id]/route.ts` |
| 수정 | `apps/web/src/types/accommodation.ts` |
| 수정 | `apps/web/src/features/accommodations/mutations.ts` |
| 수정 | `apps/web/src/app/(app)/accommodations/[id]/edit/page.tsx` |
| 신규 | `apps/web/src/app/api/user/kakao/status/route.ts` |
| 신규 | `apps/web/src/app/api/user/kakao/disconnect/route.ts` |
| 수정 | `apps/web/src/features/user/queries.ts` |
| 신규 | `apps/web/src/app/(app)/settings/notifications/page.tsx` |
| 수정 | `apps/web/src/app/(app)/layout.tsx` (Sidebar 메뉴) |
| 수정 | `apps/web/src/app/(public)/[lang]/page.tsx` |
| 수정 | `apps/web/messages/ko.json` |
| 수정 | `apps/web/messages/en.json` |
| 수정 | `apps/web/src/app/(app)/dashboard/_components/FirstUserTutorialDialog.tsx` |
| 수정 | `apps/web/src/app/(public)/[lang]/pricing/_components/PricingCards.tsx` |

---

## 테스트 카운트 목표

| 시점 | 테스트 수 |
|---|---|
| Sprint 3 완료 | 341개 |
| W7-D1 (alertTypes 폴링 분기 테스트) | +3~4개 |
| **Sprint 4 목표** | **345개 이상** |

---

## 우선순위 판단 기준

MVP에서 제외 가능한 항목 (Sprint 5로 이월):
- W8-D3 T3 (quota 배너): 대시보드 action card가 이미 존재하므로 낮은 우선순위
- 카카오 토큰 폐기 API 실제 호출 (disconnect 시): 보안보다 UX 우선 MVP

**가장 중요한 항목 (반드시 포함)**:
1. W7-D1 alertTypes — 사용자가 원하지 않는 알림을 끌 수 있어야 한다 (리텐션)
2. W7-D2 수정 UI — priceDropThreshold가 API만 있고 UI 없는 상태를 해소
3. W7-D3 카카오 설정 페이지 — 연동 상태 확인/해제 (신뢰도)
