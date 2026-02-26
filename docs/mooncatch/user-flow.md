# User Flow — 신혼여행 빈방·가격 알림 (apps/web)

> 최종 업데이트: 2026-02-26
> 기준 플랫폼: `apps/web` (Sprint 3 기준)

---

## 전체 플로우 요약

```text
[신규 사용자]
    │
    ▼
회원가입 / 로그인 (NextAuth)
    │
    ▼
호텔 검색 후 알림 등록 (agoda_hotels DB)
    │
    ▼
대시보드에서 내 알림 목록 확인
    │
    ▼
[시스템 자동 폴링 — 30분마다]
    │
    ├── 변화 없음 → 다음 폴링 대기
    │
    └── 변화 감지 (가격 하락 / 빈방 / vacancy_proxy)
            │
            ├── 쿨다운 체크 (동일 오퍼 중복 방지)
            │       ├── 쿨다운 내 → 스킵
            │       └── 쿨다운 외 → 이벤트 생성
            │
            ▼
        이메일 알림 발송
            │
            ▼
        사용자 → Agoda 예약 페이지 (클릭아웃)
```

---

## 1. 사용자 플로우

### 1-1. 회원가입 / 로그인

```text
랜딩 페이지
    │
    ├── "알림 등록하기" CTA 클릭
    │       │
    │       ▼
    │   로그인 페이지
    │       ├── Google로 계속하기
    │       ├── Kakao로 계속하기
    │       └── 이메일 로그인 (Magic Link)
    │               │
    │               ▼
    │           인증 완료 → 대시보드로 이동
    │
    └── 이미 로그인 → 대시보드로 바로 이동
```

---

### 1-2. 알림 등록

```text
대시보드 → "알림 등록" 버튼
    │
    ▼
/accommodations/new
    │
    ├── 검색창에 호텔명 / 도시 입력 (예: "메두푸시", "몰디브")
    │       │
    │       ▼
    │   실시간 검색 결과 (agoda_hotels DB, 최대 20개)
    │       │
    │       └── 호텔 선택 → 폼에 자동 입력 (이름, platformId)
    │
    ├── 체크인 / 체크아웃 날짜 선택
    ├── 객실 수, 성인 수, 아동 수
    ├── 알림 수신 동의 체크박스 ← 필수 (consent_logs 기록)
    │
    └── "알림 등록" 버튼
            │
            ▼
        Accommodation 생성
        (platform=AGODA, platformId=호텔ID, url=null)
            │
            ▼
        대시보드로 이동
```

**제약 사항 (Agoda 계약)**:

- ❌ 복수 호텔의 실시간 가격 비교 UI 금지
- ❌ 타사 OTA 가격과의 비교 금지
- ✅ 호텔 이름/도시 검색 후 알림 등록은 허용
- ✅ 내 알림 등록 호텔의 현재 가격 (자체 폴링 결과) 표시는 허용

**관련 API**:

- `GET /api/hotels/search?q={query}` → agoda_hotels 검색
- `POST /api/accommodations` → `platform=AGODA`, `platformId` 저장, `url=null`

---

### 1-3. 대시보드 (메인 화면)

```text
대시보드 (/dashboard)
    │
    ├── KPI Strip
    │       ├── 전체 알림 등록 수
    │       ├── 활성 모니터링 수
    │       └── 최근 알림 수
    │
    ├── 알림 등록 목록 (AccommodationBoard)
    │       ├── 호텔명 / 날짜 / 인원
    │       ├── 상태: 모니터링 중 / 일시정지 / 만료
    │       ├── 마지막 폴링: N분 전
    │       └── 현재 가격: $XXX (최근 폴링 기준)
    │
    ├── 최근 알림 이벤트 (RecentEvents → agoda_alert_events)
    │       └── "2026-03-01 메두푸시 가격 $112 → $98"
    │
    ├── [일시정지] → isActive: false (폴링 중단)
    ├── [재개]     → isActive: true
    └── [삭제]     → 확인 후 삭제
```

**platform 구분**:

- `platform = AGODA` + `platformId` 있음 → Agoda API 폴링 (일반 사용자)
- `platform = AIRBNB` or `url` 있음 → 스크래핑 (어드민 전용, 대시보드에서 분리 표시 또는 숨김)

---

### 1-4. 알림 상세 & 이력

```text
/accommodations/{id}
    │
    ├── 가격 히스토리 (스냅샷 차트)
    │
    └── 알림 이력 테이블 (최근 20건)
            ├── 감지 시각
            ├── 이벤트 유형 (vacancy / price_drop / vacancy_proxy)
            ├── 발송 상태 (queued / sent / failed)
            └── 발송 시각
```

**관련 API**:

- `GET /api/accommodations/{id}/notifications` → 알림 이력 (소유권 검증 + 최근 20건)

---

### 1-5. 이메일 알림 수신

```text
이메일 알림 — 가격 하락 예시

제목: "[메두푸시 리조트] 가격이 $112 → $98로 내려갔습니다"

본문:
  호텔: Medhufushi Island Resort
  체크인: 2026-11-10 / 체크아웃: 2026-11-14
  변화: Beach Villa 기준 $112.83 → $98.50 (-12.7%)
  이 가격은 실시간으로 변동될 수 있습니다.

  [Agoda에서 확인하기]  ← 클릭아웃
  [대시보드 보기]
  [알림 수신거부]
```

이메일 알림 — vacancy_proxy 예시:

```text
제목: "[메두푸시 리조트] 새 객실 유형이 감지되었습니다"

본문:
  새로운 객실 유형이 나타났습니다. 빈방 가능성이 있습니다.
  (remainingRooms 정보 없는 신규 오퍼 감지)

  [Agoda에서 확인하기]
```

**클릭아웃 흐름**:

```text
이메일 "Agoda에서 확인하기" 클릭
    │
    ▼
GET /api/go?accommodationId={id}&url={agodaUrl}
    │
    ├── agoda_clickout_events 테이블에 1건 기록
    └── 302 redirect → Agoda 예약 페이지
```

---

### 1-6. 수신거부

```text
이메일 하단 "알림 수신거부" 클릭
    │
    ▼
GET /api/unsubscribe?token={signedToken}
    │
    ├── 토큰 유효
    │       → consent_logs에 opt_out 기록
    │       → accommodation.isActive = false
    │       → "알림이 중단되었습니다" 페이지
    │
    └── 토큰 무효/만료 → "링크가 만료되었습니다"
```

---

## 2. 시스템 자동 플로우 (Cron → 폴링 → 알림)

```text
Vercel Cron (매 30분)
    │
    └── POST /api/internal/accommodations/poll-due
            {x-internal-token: ...}
            │
            ▼
        platform=AGODA, isActive=true, lastPolledAt < 30분 전
        조건으로 Accommodation 조회 (limit=20)
            │
            ▼
        concurrency=3으로 병렬 처리
            │
            ├── 각 Accommodation마다:
            │       │
            │       ▼
            │   Agoda Search API 호출
            │   (platformId, checkIn, checkOut, adults, children, ...)
            │       │
            │       ▼
            │   agoda_room_snapshots 저장
            │       │
            │       ▼
            │   이전 스냅샷과 비교
            │       ├── 가격 하락 (-10% 이상)
            │       │       ├── 쿨다운 체크 (6h)
            │       │       ├── 쿨다운 내 → 스킵
            │       │       └── 쿨다운 외 → alert_events (price_drop) 생성
            │       │                         → agoda_notifications (queued) 생성
            │       ├── 빈방 감지 (remainingRooms 0→양수)
            │       │       ├── verify re-check
            │       │       ├── 쿨다운 체크 (24h)
            │       │       └── 통과 → alert_events (vacancy) 생성
            │       ├── vacancy_proxy 감지 (신규 offerKey + remainingRooms=null + hasBaseline)
            │       │       ├── 쿨다운 체크 (24h)
            │       │       └── 통과 → alert_events (vacancy_proxy) 생성
            │       └── 변화 없음 → 로그만 기록
            │
            └── agoda_poll_runs 기록 (성공/실패, latency)

이메일 발송 (동일 cron 후처리 또는 별도 cron)
    │
    ▼
agoda_notifications (queued) 조회
    │
    ├── 이메일 발송 (Resend / console 모드)
    ├── 성공 → agoda_notifications.status = sent
    └── 실패 → 지수 백오프 재시도 (최대 4회)

Vercel Cron (매일 03:00 UTC)
    │
    └── POST /api/internal/snapshots/cleanup
            │
            └── 30일 이상 된 agoda_poll_runs + agoda_room_snapshots 삭제
```

---

## 3. 어드민 플로우

```text
어드민 로그인 (role=admin)
    │
    ▼
/admin 대시보드
    │
    ├── [URL 등록 (스크래핑)] — /admin/accommodations/new
    │       └── 기존 "숙소 추가" 화면 그대로 (URL 입력 방식 유지)
    │
    └── [운영 현황] — /admin/ops
            ├── 폴링 성공률 / latency P95
            ├── agoda_alert_events 목록
            ├── agoda_notifications 발송 현황
            └── 폴링 지연(Stall) 숙소 목록
                    ├── 숙소명
                    ├── 마지막 폴링 시각
                    └── 경과 시간
```

---

## 4. 페이지 목록

| 경로 | 설명 | 인증 |
|---|---|---|
| `/` | 랜딩 페이지 | 불필요 |
| `/dashboard` | 내 알림 등록 목록 + 현황 (메인) | 필요 |
| `/accommodations/new` | 호텔 검색 + 알림 등록 | 필요 |
| `/accommodations/{id}` | 알림 상세 (가격 히스토리, 알림 이력) | 필요 |
| `/api/unsubscribe` | 수신거부 처리 | 불필요 (토큰) |
| `/api/go` | 클릭아웃 redirect | 불필요 (토큰) |
| `/admin/accommodations/new` | URL 등록 (스크래핑, 어드민 전용) | admin role |
| `/admin/ops` | 폴링/알림/스톨 운영 현황 | admin role |

---

## 5. API 엔드포인트 목록

### 사용자 API (인증 필요)

| Method | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/hotels/search?q={query}` | 호텔 검색 (agoda_hotels) |
| `POST` | `/api/accommodations` | 알림 등록 (platform=AGODA) |
| `GET` | `/api/accommodations` | 내 알림 등록 목록 |
| `PATCH` | `/api/accommodations/{id}` | 상태 변경 (active/paused) |
| `DELETE` | `/api/accommodations/{id}` | 삭제 |
| `GET` | `/api/accommodations/{id}/notifications` | 알림 이력 (최근 20건) |

### 공개 API (토큰 기반)

| Method | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/go` | 클릭아웃 redirect |
| `GET` | `/api/unsubscribe` | 수신거부 처리 |

### 내부 API (x-internal-token 필요)

| Method | 경로 | 설명 |
|---|---|---|
| `POST` | `/api/internal/accommodations/poll-due` | 폴링 대상 일괄 처리 |
| `POST` | `/api/internal/accommodations/{id}/poll` | 특정 알림 등록 즉시 폴링 |
| `POST` | `/api/internal/snapshots/cleanup` | 30일 이상 스냅샷 정리 (Cron) |

---

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 체크인이 지난 알림 등록 | isActive = false, 폴링 제외, 만료 안내 |
| Agoda API 오류 | agoda_poll_runs 실패 기록, 다음 폴링까지 대기 |
| 동일 이벤트 중복 | agoda_alert_events.event_key unique → 중복 무시 |
| 수신거부 후 알림 시도 | consent_logs opt_out 확인 → 발송 차단 |
| 호텔이 agoda_hotels DB에 없음 | 검색 결과 0건 안내, 알림 등록 불가 |
| `remainingRooms` NULL | vacancy 알림 보류, 신규 offerKey면 vacancy_proxy로 처리 |
| vacancy_proxy 쿨다운 | 동일 offerKey 24시간 내 중복 방지 |
| price_drop 쿨다운 | 동일 offerKey 6시간 내 중복 방지 |
| 이메일 4회 연속 실패 | agoda_notifications.status = failed, 어드민 노출 |
| 폴링 지연 (Stall) | /admin/ops에 목록 노출, 수동 확인 필요 |
