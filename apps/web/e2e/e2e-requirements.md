# E2E 테스트 필수 요구사항

> 이 문서는 E2E 테스트가 **반드시 커버해야 하는 시나리오**를 정의한다.
> 구현 방식(헬퍼 함수, 파일명 등)은 변경될 수 있으나, 아래 시나리오는 항상 통과해야 한다.

---

## 원칙

- E2E 테스트는 **비즈니스 로직의 회귀를 방지**하기 위해 존재한다.
- 각 시나리오는 "이것이 깨지면 사용자가 직접 피해를 받는다"를 기준으로 선정했다.
- 구현 세부 사항이 바뀌어도 아래 **검증 조건(assert)** 은 유지되어야 한다.

---

## 필수 시나리오

### S1. 회원가입 → 알림 등록 핵심 경로

**파일**: `e2e/specs/signupLoginAccommodation.spec.ts`

**검증 목적**: 사용자가 브라우저 UI로 가입하고, 호텔을 검색·선택해 알림을 등록하면 대시보드에 반영된다.

| # | 검증 조건 |
|---|---|
| 1 | 회원가입 후 `/ko/login`으로 리다이렉트된다 |
| 2 | 로그인 후 `/dashboard`로 리다이렉트된다 |
| 3 | 알림 등록 후 대시보드에 해당 숙소명이 보인다 |

**변경 금지 기준**: UI 가입/로그인/등록 플로우 자체를 반드시 브라우저로 검증해야 한다. API 기반 헬퍼로 대체 불가.

---

### S2. 수신동의 없이 알림 등록 차단

**파일**: `e2e/specs/consentRequired.spec.ts`

**검증 목적**: 수신동의를 체크하지 않으면 클라이언트 단에서 차단되고 서버 API가 호출되지 않는다.

| # | 검증 조건 |
|---|---|
| 1 | 동의 미체크 상태로 제출하면 에러 메시지 "알림 수신 동의가 필요합니다"가 보인다 |
| 2 | `POST /api/accommodations` 요청이 0회여야 한다 (서버 미호출) |
| 3 | URL이 `/accommodations/new`에 머물러야 한다 |

**변경 금지 기준**: 동의 체크박스 UI 검증이 핵심이므로 폼 제출까지는 브라우저 UI를 사용해야 한다.

---

### S3. Vacancy 감지 핵심 회귀 (베이스라인 / 재등장 / 쿨다운)

**파일**: `e2e/specs/vacancyAlert.spec.ts`

**검증 목적**: 폴링 파이프라인이 false positive / false negative / 중복 알림 없이 동작한다.

| # | 폴링 순서 | 검증 조건 |
|---|---|---|
| 1 | 1차: available (베이스라인 없음) | `vacancyEventsInserted = 0`, `snapshotsInserted > 0` |
| 2 | 2차: sold_out | `vacancyEventsInserted = 0`, `snapshotsInserted = 0` |
| 3 | 3차: available (재등장) | `vacancyEventsInserted > 0`, `notificationsQueued > 0` |
| 4 | 4차: sold_out | `vacancyEventsInserted = 0` |
| 5 | 5차: available (쿨다운 내 재등장) | `vacancyEventsInserted = 0`, `vacancyEventsSkippedByCooldown > 0` |
| 6 | 최종 알림 이력 | vacancy 알림이 정확히 1건, UI에서도 확인 가능 |

**변경 금지 기준**:
- 1차 폴이 available이어도 베이스라인 없으면 vacancy 미생성 (false positive 방지)
- 쿨다운 내 재등장은 감지되더라도 삽입/큐잉 차단 (중복 알림 방지)
- 최종 이력은 1건만 존재해야 함

---

### S4. Dispatch Pipeline (queued → sent 전환)

**파일**: `e2e/specs/dispatchPipeline.spec.ts`

**검증 목적**: 폴링으로 큐잉된 알림이 dispatch를 통해 실제 sent 상태로 전환된다.

| # | 검증 조건 |
|---|---|
| 1 | vacancy 이벤트 생성 후 `notificationsQueued > 0`이다 |
| 2 | dispatch 호출 시 `picked > 0`, `sent > 0`, `failed = 0`이다 |
| 3 | dispatch 후 알림 이력 API에서 해당 숙소 알림의 `status = 'sent'`가 확인된다 |

**변경 금지 기준**:
- dispatch는 수신동의(opt_in) 없으면 suppressed 처리된다. 알림 등록 시 반드시 opt_in이 함께 기록되어야 한다.
- `sent = 0`이면 dispatch가 억제된 것이므로 반드시 원인을 파악해야 한다.

---

## 인프라 전제조건

E2E 테스트가 올바르게 동작하려면 다음 조건이 만족되어야 한다.

| 조건 | 설명 |
|---|---|
| Agoda mock API | `MOONCATCH_AGODA_SEARCH_API_URL=http://localhost:{port}/api/test/agoda-mock` 설정 필요 (`playwright.config.ts`에서 자동 설정) |
| agoda_hotels 데이터 | 로컬 DB의 `agoda_hotels` 테이블에 검색 가능한 데이터가 존재해야 함 |
| `MOONCATCH_INTERNAL_API_TOKEN` | `.env.local`에 설정하지 않아야 함 (설정 시 내부 poll API 401 오류) |
| `MOONCATCH_EMAIL_PROVIDER` | 미설정 시 console 프로바이더 → 실제 이메일 없이 dispatch sent 처리 |
| 실행 환경 | `APP_ENV=local` 또는 미설정 (staging/production에서는 자동 skip) |

---

## 추가 예정 시나리오

구현이 완료되면 아래 시나리오도 필수로 추가한다.

| 시나리오 | 우선순위 | 관련 기능 |
|---|---|---|
| S5. `isActive=false` 시 dispatch 억제 | 높음 | 숙소 일시정지 |
| S6. price_drop 감지 → 알림 큐잉 | 높음 | 가격 하락 알림 |
| S7. alertTypes 조건 분기 | 중간 | W7-D1 alertTypes 필드 |
| S8. 수신거부(unsubscribe) → opt_out 기록 | 중간 | 수신거부 플로우 |

---

## 파일 구조 참고

```
apps/web/e2e/
├── helpers/
│   ├── auth.ts          — 회원가입/로그인 (UI + API 기반)
│   ├── accommodation.ts — 알림 등록 (UI + API 기반)
│   ├── polling.ts       — poll / dispatch / 알림 이력 API 호출
│   └── suite.ts         — 공통 가드 (환경 제한, cleanup, mock reset)
└── specs/
    ├── signupLoginAccommodation.spec.ts  — S1
    ├── consentRequired.spec.ts           — S2
    ├── vacancyAlert.spec.ts              — S3
    └── dispatchPipeline.spec.ts          — S4
```
