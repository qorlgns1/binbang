# Product Overview

> 이 문서는 비즈니스 관점에서 binbang이 무엇을 하는지 기술한다.
> 코드 구조는 `docs/architecture/architecture.md`, 배포는 `docs/deployment/`를 기준으로 한다.
> 최종 업데이트: 2026-02-27

---

## 제품 한 줄 요약

**빈방** — 인기 숙소의 취소 건(빈방·가격하락)을 자동 감지해 즉시 알려주는 서비스.
**여행 AI** — AI 채팅으로 여행지·숙소·날씨·환율·eSIM을 한 번에 검색하는 여행 어시스턴트.

---

## 제품 포트폴리오

| 제품 | 앱 | 상태 | 핵심 가치 |
|---|---|---|---|
| 빈방 (MoonCatch) | `apps/web` | ✅ 운영 중 | 내가 원하는 숙소에 빈방이 나면 누구보다 빨리 알려줌 |
| 여행 AI | `apps/travel` | ✅ 운영 중 | 여행 계획 전 과정을 AI와 대화로 해결 |
| 백그라운드 워커 | `apps/worker` | ✅ 운영 중 | Playwright 기반 스크래핑 (빈방 감지 지원) |

두 제품은 같은 DB, 같은 인증 시스템을 공유하지만 **독립된 Next.js 앱**으로 분리되어 있다.
공통 수익화 파트너: **Agoda** (제휴 API + 클릭아웃)

---

## 빈방 (apps/web)

### 누구를 위한 서비스인가

인기 숙소(특히 신혼여행지)를 노리고 있지만 매진 상태인 사람.
취소가 나는 순간을 직접 새로고침 없이 포착하고 싶은 사람.

### 핵심 플로우

```
회원가입/로그인
    ↓
Agoda 호텔 검색 후 알림 등록
    ↓
[시스템] 30분마다 Agoda API 폴링 → 스냅샷 저장
    ↓
변화 감지 (빈방 재등장 / 가격 하락)
    ↓
쿨다운 체크 → 이메일 알림 발송
    ↓
사용자 → Agoda 예약 페이지 (클릭아웃)
```

자세한 플로우: `docs/mooncatch/user-flow.md`

### 기능 목록

**사용자 기능**

| 기능 | 상태 | 비고 |
|---|---|---|
| 카카오/구글 로그인 | ✅ | NextAuth |
| Agoda 호텔 검색 | ✅ | agoda_hotels DB (trigram 검색) |
| 알림 등록 / 삭제 | ✅ | platformId 방식 |
| 대시보드 (알림 목록) | ✅ | lastPolledAt, 방 목록 표시 |
| 알림 이력 조회 | ✅ | 숙소 상세 페이지 |
| 이메일 알림 (ko/en) | ✅ | locale 분기, HTML 템플릿 |
| 카카오톡 직접 알림 | 🔨 | 카카오 토큰 있는 경우만 동작 |
| Agoda 클릭아웃 | ✅ | `/api/go` 경유 (화이트리스트 보안) |
| 이메일 수신거부 | ✅ | 서명된 토큰 방식 |
| 구독 플랜 조회 | ✅ | Plan/Quota 모델 |
| 구독 결제 | 📋 | 계획됨 (수익화 미구현) |

**시스템/백엔드**

| 기능 | 상태 | 비고 |
|---|---|---|
| 30분 주기 폴링 | ✅ | BullMQ Repeat Job → `/api/internal/accommodations/poll-due` |
| 5분 주기 알림 dispatch | ✅ | BullMQ Repeat Job → `/api/internal/accommodations/notifications/dispatch` |
| 빈방 재등장 감지 | ✅ | 이전 poll 없음(매진) + 현재 오퍼 있음 |
| 가격 하락 감지 | ✅ | 이전 스냅샷 대비 가격 비교 |
| 쿨다운 (중복 방지) | ✅ | vacancy 24h / price_drop 6h |
| 스냅샷 자동 정리 | ✅ | 매일 03:00 UTC cron |
| 스톨 감지 (어드민) | ✅ | `/admin/ops` |

**공개 페이지 (SEO)**

| 페이지 | 상태 |
|---|---|
| 랜딩 페이지 | ✅ |
| 가격 안내 | ✅ |
| 숙소 가용성 페이지 (`/availability/[platform]/[slug]`) | ✅ |
| About / FAQ / 이용약관 / 개인정보처리방침 | ✅ |

**어드민 (내부 운영)**

| 어드민 기능 | 상태 |
|---|---|
| URL 방식 숙소 등록 (스크래핑) | ✅ |
| Agoda API 테스트 패널 | ✅ |
| Awin 제휴 관리 | ✅ |
| 사용자 관리 / 역할 지정 | ✅ |
| Plans / Quota 설정 | ✅ |
| 구글폼 Intake / 케이스 관리 | ✅ |
| Throughput 대시보드 | ✅ |
| Funnel 분석 | ✅ |
| Worker 재시작 / 큐 확인 | ✅ |
| 감사 로그 | ✅ |
| Heartbeat 모니터링 | ✅ |
| CSS 셀렉터 관리 | ✅ |

---

## 여행 AI (apps/travel)

### 누구를 위한 서비스인가

여행 계획 초반에 어디 갈지, 어떤 숙소가 있는지, 날씨/환율은 어떤지 한 번에 파악하고 싶은 사람.

### 핵심 플로우

```
로그인 (선택)
    ↓
AI 채팅 시작 → 여행지/날짜/인원 입력
    ↓
AI가 도구 호출:
  - 장소 검색 (Google Maps)
  - 날씨 이력 조회
  - 환율 조회
  - 숙소 검색 (Agoda 제휴 API)
  - eSIM 검색
    ↓
결과 카드 + 대화 형태 응답
    ↓
숙소/서비스 클릭 → 제휴 링크 이동
```

### 기능 목록

| 기능 | 상태 | 비고 |
|---|---|---|
| AI 여행 채팅 | ✅ | Claude + streaming |
| 장소 검색 | ✅ | Google Maps API |
| 날씨 이력 조회 | ✅ | OpenWeatherMap |
| 환율 조회 | ✅ | ExchangeRate API |
| 숙소 검색 | ✅ | Agoda 제휴 API |
| eSIM 검색 | ✅ | 제휴 API |
| 대화 이력 저장/조회 | ✅ | 로그인 시 |
| 여행지 SEO 페이지 | ✅ | `/destinations/[slug]` |
| 제휴 이벤트 트래킹 | ✅ | Awin |
| i18n (멀티 로케일) | ✅ | `[locale]` 라우팅 |
| 지도 컴포넌트 | ✅ | Google Maps |

---

## 수익화 구조

| 수익원 | 상태 | 설명 |
|---|---|---|
| Agoda 클릭아웃 (빈방) | ✅ 동작 중 | 이메일 알림 → 예약 클릭 → 제휴 수익 |
| Agoda 제휴 (여행 AI) | ✅ 동작 중 | 숙소 검색 결과 → 제휴 링크 클릭 |
| Awin 제휴 | ✅ 동작 중 | eSIM 등 기타 여행 서비스 |
| 구독 플랜 (SaaS) | 📋 계획됨 | Plan/Quota 모델은 구현됨, 결제 미연동 |

---

## 공통 인프라

| 구성요소 | 역할 |
|---|---|
| PostgreSQL | 메인 DB (숙소, 알림, 대화, 여행지 등) |
| Redis | BullMQ 큐, 캐시 |
| BullMQ Worker | 폴링 / 알림 dispatch / 스냅샷 정리 / 캐시 예열 (Repeat Jobs) |
| BullMQ Worker | Playwright 스크래핑 (URL 방식 숙소 감지) |
| Sentry | 에러 모니터링 (web + travel) |
| NextAuth | 인증 (카카오, 구글, credentials) |
