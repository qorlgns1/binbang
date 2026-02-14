# 빈방(binbang) 종합 백로그 & 비즈니스 로드맵

> 작성일: 2026-02-14
> 기준 버전: v2.26.0 | 기준 브랜치: `develop`
> 목적: 프로젝트의 현재 상태를 360도 분석하고, 기술/제품/비즈니스 관점의 종합 TODO 리스트와 장기 방향성을 정의한다.
> 관련 문서: `improvement-plan.md`, `google-form-ops-mvp-backlog.md`, `i18n-architecture-plan.md`, `throughput-and-analysis.md`

### 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| v1.0 | 2026-02-14 | 초기 작성 — 28개 섹션 + 6개 부록 | Claude |
| v1.1 | 2026-02-14 | 피드백 반영: 용어 일관성, 의존성 맵, KPI baseline, 문화적 적합성, Mermaid 다이어그램 | Claude |
| v1.2 | 2026-02-14 | 섹션별 구체 피드백 반영: 성숙도 근거 연결, i18n 우선순위 근거, OKR 재구성, 법적/비용/컴플라이언스 보강 | Codex |
| v1.3 | 2026-02-14 | P0-9/P0-10/KPI 정밀화: SoT 지표 정의, 30일 실측 baseline, UTC/KST 시간대 원칙, PriceQuote/매출 SoT 명시 | Codex |

---

## 1페이지 요약 (Quick Reference)

| 영역 | 현재 | 3개월 목표 | 6개월 목표 |
|------|------|-----------|-----------|
| **핵심 기능** | MVP 운영 중 (수동 파이프라인) | 운영 자동화 (견적 엔진, 자동 만료) | 셀프서비스 (웹 접수, PG 결제) |
| **테스트** | 324+ 단위 테스트 (커버리지 ~40%) | 70% 커버리지, Worker 테스트 추가 | 80% + 통합/E2E 테스트 |
| **관측성** | console.error + Heartbeat | pino 구조화 로거 + Slack 알림 | Grafana + 메트릭 대시보드 |
| **i18n** | Public 5개국어 완료 | App 페이지 완료 | Admin 페이지 완료 |
| **플랫폼** | Airbnb, Agoda (2개) | 동일 (안정화) | + Booking.com (3개) |
| **비즈니스** | Google Form 접수, 수동 견적 | 견적 자동화, 퍼널 KPI | 웹 접수 + PG 결제 자동화 |
| **운영 경계(금지)** | 예약 대행/결제 보장 미제공 | 랜딩/상태 페이지 고지 일원화 | 법적 분쟁 0건 유지 |
| **최우선 과제** | P0-9 퍼널 대시보드, P0-10 견적 엔진, 도메인 에러 타입 |||

---

## 목차

1. [Executive Summary](#1-executive-summary)
2. [프로젝트 현재 상태 분석](#2-프로젝트-현재-상태-분석)
3. [아키텍처 성숙도 평가](#3-아키텍처-성숙도-평가)
4. [비즈니스 방향성 및 전략](#4-비즈니스-방향성-및-전략)
5. [Phase 1 — 즉시 실행 (0~2주)](#5-phase-1--즉시-실행-02주)
6. [Phase 2 — 단기 (2~6주)](#6-phase-2--단기-26주)
7. [Phase 3 — 중기 (1~3개월)](#7-phase-3--중기-13개월)
8. [Phase 4 — 장기 (3~6개월)](#8-phase-4--장기-36개월)
9. [Phase 5 — 비전 (6개월+)](#9-phase-5--비전-6개월)
10. [기술 부채 상세](#10-기술-부채-상세)
11. [테스트 전략](#11-테스트-전략)
12. [보안 강화 계획](#12-보안-강화-계획)
13. [성능 최적화 계획](#13-성능-최적화-계획)
14. [관측성(Observability) 로드맵](#14-관측성observability-로드맵)
15. [데이터 전략](#15-데이터-전략)
16. [비즈니스 모델 진화](#16-비즈니스-모델-진화)
17. [경쟁 환경 및 차별화 전략](#17-경쟁-환경-및-차별화-전략)
18. [리스크 관리](#18-리스크-관리)
19. [KPI 및 성공 지표](#19-kpi-및-성공-지표)
20. [하지 않을 것](#20-하지-않을-것)

---

## 1. Executive Summary

### 빈방이란?

**빈방(binbang)** 은 Airbnb/Agoda 등 숙박 플랫폼의 빈방(취소/공실)을 24시간 자동 모니터링하고, 조건 충족 시 카카오톡으로 즉시 알림을 보내는 SaaS 서비스다.

### 핵심 가치 제안

- "당신의 휴식이 길을 잃지 않도록, 빈방이 밤새 불을 밝혀둘게요"
- 사용자가 직접 반복 확인하기 어려운 숙소 가용성을 대신 모니터링
- 취소/공실 발생 시 즉시 알림으로 예약 기회 제공

### 비즈니스 모델

- **과금 기준**: 조건 충족(빈방 확인) 시점에만 비용 발생
- **금지 사항**: 예약 대행/결제 보장 아님 (약관/랜딩/상태 페이지 동일 문구 고정)
- **운영 방식**: Google Forms 접수 → 관리자 검토 → 결제 확인 → 자동 모니터링 → 조건 충족 알림

> **법적 리스크 방지 고지(필수)**: 빈방은 "알림 서비스"이며 "예약 대행/완료 보장 서비스"가 아니다. 고객 접점 문구를 단일 표준으로 관리해 분쟁 가능성을 낮춘다.

### 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 웹 프레임워크 | Next.js 15 (App Router, RSC) |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI |
| 데이터베이스 | PostgreSQL + Prisma 7 |
| 작업 큐 | BullMQ (Redis) |
| 브라우저 자동화 | Playwright Chromium |
| 인증 | NextAuth v4 (Kakao, Google, Email) |
| 국제화 | next-intl (5개국어) |
| 모노레포 | pnpm workspace + Turborepo |
| 코드 품질 | Biome (lint + format) + Vitest |
| 배포 | Docker + GitHub Actions + OCI |

### 프로젝트 성숙도

| 영역 | 점수 | 근거(연결 섹션) |
|------|------|------------------|
| 아키텍처 | 9/10 | 3.1 강점: 모노레포 경계/서비스 레이어 분리 |
| 코드 품질 | 8/10 | strict TS + Biome 강제, 규칙 기반 리뷰 체계 |
| 테스트 | 5/10 | 2.5 테스트 갭: E2E/API/통합 부재, Worker 프로세서 무테스트 |
| 문서화 | 9/10 | 22/23/24절 상세 명세 + 운영 가이드 충실 |
| 보안 | 7/10 | 12.1 현황: Auth/RBAC/감사 완성, CORS/CSP 보강 필요 |
| 관측성 | 5/10 | 14.1 현재: Heartbeat 중심, 구조화 로거/메트릭 부족 |
| CI/CD | 8/10 | GitHub Actions 자동화 + Turbo 캐시 최적화 |
| 국제화 | 7/10 | Public 5개국어 완료, App/Admin 미완(2.2/6.6/8.5) |
| 비즈니스 | 6/10 | 4.1 수동 운영 병목, 셀프서비스 전환 전 단계 |

> 테스트 5/10 평점은 2.5 테스트 갭 분석의 정량 근거(E2E 0, 통합 0, API 라우트 51개 무테스트)를 기준으로 산정한다.

---

## 2. 프로젝트 현재 상태 분석

### 2.1 코어 기능 완성도

#### 숙소 모니터링 (핵심 기능)

| 기능 | 상태 | 비고 |
|------|------|------|
| Airbnb 가용성 확인 | ✅ 완료 | Playwright 기반, 동적 셀렉터 |
| Agoda 가용성 확인 | ✅ 완료 | Playwright 기반, 동적 셀렉터 |
| 가격 추출/파싱 | ✅ 완료 | KRW/USD/EUR/GBP/CHF 지원 |
| 카카오톡 알림 | ✅ 완료 | 토큰 자동 갱신 |
| 주기적 체크 (BullMQ) | ✅ 완료 | cron 기반, 동적 설정 |
| 스크린샷 캡처 | ✅ 완료 | Case-linked 체크 시 |
| 동적 셀렉터 관리 | ✅ 완료 | DB 기반, 캐시, 테스트 패널 |
| 가격 추이 차트 | ✅ 완료 | 7일 이동평균, 통계 |

#### 케이스 관리 (운영 기능)

| 기능 | 상태 | 비고 |
|------|------|------|
| Google Form 웹훅 접수 | ✅ 완료 | 멱등, 서명 검증 |
| Q1~Q7 스키마 검증 | ✅ 완료 | Zod, 의미키 기반 |
| 상태 머신 (11단계) | ✅ 완료 | 가드/전이 규칙 엄격 |
| 모호성 감지 (Q4) | ✅ 완료 | GREEN/AMBER/RED 3단계 |
| 결제 확인 하드게이트 | ✅ 완료 | 결제 전 시작 차단 |
| 증거 패킷 자동 생성 | ✅ 완료 | 스크린샷 + JSON + 멱등 |
| 원자적 과금/알림 트리거 | ✅ 완료 | TX 기반, 재시도 |
| 운영자 메시지 템플릿 | ✅ 완료 | 6종, 이력 추적 |
| 폼 질문 매핑 관리 | ✅ 완료 | 동적, formKey별 |

#### 사용자 관리

| 기능 | 상태 | 비고 |
|------|------|------|
| 이메일/비밀번호 가입 | ✅ 완료 | bcrypt 12라운드 |
| Google OAuth | ✅ 완료 | |
| Kakao OAuth | ✅ 완료 | 토큰 별도 저장 |
| RBAC (USER/ADMIN) | ✅ 완료 | Plan 기반 |
| 구독 관리 | ✅ 완료 | Plan/Quota |
| 감사 로그 | ✅ 완료 | actor/target/변경값 |
| 온보딩 튜토리얼 | ✅ 완료 | 4단계 Dialog |

#### 관리자 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| 사용자 관리 | ✅ 완료 | 검색, 역할/플랜 변경 |
| 플랜 관리 | ✅ 완료 | CRUD, 쿼터 |
| 시스템 설정 | ✅ 완료 | 동적, 변경 이력 |
| 셀렉터/패턴 관리 | ✅ 완료 | 테스트 패널 포함 |
| 모니터링 대시보드 | ✅ 완료 | 헬스체크, 로그 |
| 처리량 분석 | ✅ 완료 | 비교 차트 |
| 워커 하트비트 | ✅ 완료 | 실시간 상태 |
| 감사 로그 뷰어 | ✅ 완료 | 필터, 타임라인 |

### 2.2 미완성/미구현 기능

| 기능 | 상태 | 우선순위 | 비고 |
|------|------|----------|------|
| 운영 퍼널 대시보드 (P0-9) | ⬜ 미구현 | P0 | 제출/처리/결제확인/조건충족 KPI (클릭은 2차) |
| 견적 산식 엔진 (P0-10) | ⬜ 미구현 | P0 | 가격 일관성 |
| 요청 기간 자동 만료 (P1-1) | ⬜ 미구현 | P1 | 미충족 → EXPIRED |
| 알림 채널 이중화 (P1-2) | ⬜ 미구현 | P1 | 카톡 실패 → 이메일 |
| 운영 SLA 타이머 (P1-4) | ⬜ 미구현 | P1 | 응답 지연 경고 |
| 고객 상태 페이지 (P2-1) | ⬜ 미구현 | P2 | 비로그인 읽기전용 |
| App 페이지 i18n | ⏳ 일부 | P1 | Dashboard/Settings |
| Admin 페이지 i18n | ⬜ 미구현 | P2 | Admin 전체 (운영자 내부 화면) |
| 구조화 로깅 | ⬜ 미구현 | P1 | pino/winston |
| API 문서화 | ⬜ 미구현 | P2 | OpenAPI |
| E2E 테스트 | ⬜ 미구현 | P2 | Playwright |
| 도메인 에러 타입 | ⬜ 미구현 | P1 | AppError 계층 |

> **우선순위 기준**: P1은 "최종 사용자 노출도 + 전환/매출 영향"이 높은 항목 우선.  
> App i18n은 사용자 대시보드/설정 UX에 직접 영향이 있어 P1, Admin i18n은 내부 운영 효율 개선 성격이라 P2로 배치.

### 2.3 데이터베이스 현황

#### 모델 수: 23개

**인증**: Account, Session, User, VerificationToken
**도메인**: Accommodation, CheckLog, CheckCycle
**케이스**: FormSubmission, FormQuestionMapping, Case, CaseStatusLog, CaseMessage, ConditionMetEvent, BillingEvent, CaseNotification
**RBAC**: Plan, PlanQuota, Role, Permission, Subscription
**운영**: SystemSettings, SettingsChangeLog, AuditLog
**모니터링**: WorkerHeartbeat, HeartbeatHistory
**셀렉터**: PlatformSelector, PlatformPattern, SelectorChangeLog

#### 마이그레이션 수: 23개

초기 스키마(2025-02) → 사이클 관리 → RBAC → 셀렉터 → 케이스 파이프라인 → 과금/알림 (2026-02)

### 2.4 API 엔드포인트 현황

#### 총 51개 API 라우트

> API 수가 많아 운영/온보딩/통합 비용이 급증할 수 있으므로, **7.4 API 문서화(OpenAPI)는 선택이 아니라 필수 게이트**로 관리한다.

| 카테고리 | 수량 | 예시 |
|----------|------|------|
| 인증 | 4 | signup, credentials-login, [...nextauth] |
| 숙소 | 6 | CRUD, logs, prices |
| 사용자 | 3 | quota, subscription, tutorial |
| 관리자-사용자 | 5 | users CRUD, roles, plan, activity |
| 관리자-케이스 | 7 | cases CRUD, status, payment, accommodation, messages, notifications |
| 관리자-플랜 | 4 | plans CRUD |
| 관리자-셀렉터 | 7 | selectors CRUD, history, test, cache |
| 관리자-패턴 | 4 | patterns CRUD |
| 관리자-설정 | 3 | settings CRUD, history |
| 관리자-접수 | 5 | submissions, intake mappings |
| 관리자-모니터링 | 2 | summary, logs |
| 관리자-처리량 | 3 | summary, history, compare |
| 관리자-감사 | 1 | audit-logs |
| 헬스체크 | 3 | health, heartbeat, history |
| 기타 | 3 | plans(public), logs, worker restart |

### 2.5 테스트 현황

#### 총 22개 테스트 파일, 324+ 테스트 케이스

| 패키지 | 파일 수 | 테스트 수 | 커버리지 영역 |
|--------|---------|-----------|--------------|
| apps/web/src/services | 8 | 197 | auth, user, accommodations, cases, intake, messages, condition-parser, admin/users |
| apps/web/src/lib | 4 | 40 | rateLimit, utils, env, url-parser |
| apps/web/src/i18n | 1 | 15 | request namespace resolution |
| packages/shared | 6 | 114 | checkers (priceParser, utils), i18n (createI18n, resolveLocale, locale, format) |
| packages/worker-shared | 2 | 13 | caseNotifications, i18n templates |
| apps/worker | 0 | 0 | - |

#### 테스트 갭 분석

| 영역 | 현재 상태 | 심각도 |
|------|-----------|--------|
| UI 컴포넌트 테스트 | 없음 (React Testing Library 미사용) | 중간 |
| E2E 테스트 | 없음 | 높음 |
| API 라우트 테스트 | 없음 (51개 라우트 무테스트) | 높음 |
| 통합 테스트 | 없음 | 중간 |
| Worker 프로세서 테스트 | 없음 (cycleProcessor, checkProcessor) | 높음 |
| Browser Checker 테스트 | 없음 (Airbnb/Agoda 체커) | 중간 |
| 보안 테스트 | 없음 | 중간 |
| 성능 벤치마크 | 없음 | 낮음 |

---

## 3. 아키텍처 성숙도 평가

### 3.1 강점

1. **엄격한 모노레포 경계**: `rules.md`가 최종 권위, Biome lint 규칙으로 import 경계 강제
2. **서비스 레이어 분리**: Web → Services → DB 단방향 흐름, Route Handler에서 직접 DB 접근 금지
3. **Worker-Shared 4도메인 모델**: browser/jobs/runtime/observability 분리, DB 접근은 runtime만
4. **동적 설정 시스템**: DB 기반 SystemSettings, env fallback, 5분 캐시
5. **동적 셀렉터**: 플랫폼 UI 변경에 코드 배포 없이 대응 가능
6. **원자적 트랜잭션**: 조건 충족 → 증거 → 과금 → 알림을 단일 TX로 보장
7. **멱등성 설계**: FormSubmission(responseId), ConditionMetEvent(caseId+checkLogId)

### 3.2 개선 필요 영역

1. **에러 처리**: 일반 `Error` 사용, 도메인 에러 타입 부재 → HTTP 상태 매핑 불안정
2. **로깅**: `console.error` 의존, 요청 ID/컨텍스트 부족 → 프로덕션 디버깅 어려움
3. **캐싱 전략**: roles/plans 등 정적 데이터 매 요청 조회 (→ [7.6 정적 참조 데이터 캐싱](#76-정적-참조-데이터-캐싱))
4. **API 문서화**: 51개 엔드포인트에 문서 없음
5. **Worker 프로세서**: `apps/worker/src/`에 일부 비즈니스 로직 잔존
6. **분석 연동**: landing-tracker가 console.log만 사용, 실제 analytics 미연동

### 3.3 기술 부채 우선순위 매트릭스

```
영향도 ↑
          │  ●도메인에러타입  ●구조화로깅   ●E2E테스트
          │
          │  ●API문서화      ●통합테스트   ●환경변수검증
          │
          │  ●CORS설정       ●접근성감사   ●레거시정리
          │
          └────────────────────────────────────→ 긴급도
```

---

## 4. 비즈니스 방향성 및 전략

### 4.1 현재 비즈니스 모델 분석

#### 수익 구조

```
Google Form 접수 → 관리자 검토 → 견적 산정 (수동) → 결제 확인 (수동) → 모니터링 시작 → 조건 충족 → 과금
```

#### 현재 한계

1. **수동 운영 병목**: 접수/검토/견적/결제 확인이 모두 관리자 수작업
2. **확장성 부재**: 관리자 1인 기준 동시 처리 가능 케이스 수 제한
3. **가격 불일치**: 견적이 운영자 감각에 의존 → 분쟁 리스크
4. **셀프서비스 부재**: 고객이 직접 요청/결제/상태 확인 불가
5. **단일 알림 채널**: 카카오톡 의존 → 해외 사용자 대응 불가

### 4.2 단기 전략 (0~3개월): 운영 효율화

**핵심 목표**: 관리자 1인이 처리할 수 있는 케이스 수를 3배로 증가

1. **견적 자동화** (P0-10): 숫자 기반 산식 엔진으로 일관된 가격 산출
2. **운영 퍼널 대시보드** (P0-9): 전환율 실시간 모니터링
3. **자동 만료** (P1-1): EXPIRED 자동 처리로 수동 정리 제거
4. **SLA 타이머** (P1-4): 지연 건 자동 알림으로 누락 방지
5. **알림 이중화** (P1-2): 카톡 실패 시 이메일 자동 전환

### 4.3 중기 전략 (3~6개월): 셀프서비스 전환

**핵심 목표**: 고객이 직접 요청/결제/추적하는 자동화 파이프라인 구축

1. **고객 셀프서비스 포털**: Google Form → 웹 기반 접수 양식
2. **온라인 결제 연동**: 토스페이먼츠/카카오페이 등 PG 연동
3. **고객용 상태 페이지**: 내 요청 현황/알림 이력 확인
4. **자동 모니터링 시작**: 결제 완료 → 자동 케이스 생성 → 모니터링 시작
5. **다국어 고객 경험**: App/Settings 페이지 i18n 완료

### 4.4 장기 전략 (6개월+): 플랫폼 확장

**핵심 목표**: 숙소 모니터링 SaaS 플랫폼으로 진화

1. **플랫폼 확장**: Booking.com, Hotels.com, 야놀자, 여기어때 등
2. **알림 채널 확장**: 이메일, SMS, 텔레그램, 라인, 슬랙 Webhook
3. **고급 분석**: 가격 예측, 최적 예약 시점 추천, 지역별 패턴 분석
4. **B2B 모델**: 여행사/호텔 관리업체 대상 API/화이트라벨
5. **구독 모델 전환**: 건당 과금 → 월/연 구독 기반 SaaS
6. **경쟁 연동 포지셔닝**: [17절 경쟁 분석](#17-경쟁-환경-및-차별화-전략) 기준으로 "24시간 빈방 자동 모니터링 + 운영 증거 제공"을 B2B 핵심 USP로 고정

### 4.5 시장 확장 로드맵

```
Phase 1 (현재)     Phase 2 (3~6개월)     Phase 3 (6~12개월)     Phase 4 (12개월+)
┌─────────┐       ┌──────────────┐      ┌──────────────┐       ┌──────────────┐
│ 한국 시장 │  →   │ 일본 시장     │  →   │ 동남아 시장    │  →    │ 글로벌 확장   │
│ Airbnb   │       │ + Booking    │      │ + Agoda 강화  │       │ + Hotels.com │
│ Agoda    │       │ + 야놀자     │      │ + 지역 OTA    │       │ + B2B API    │
│ 카카오톡  │       │ + 라인/이메일 │      │ + SMS/텔레그램 │       │ + Webhook    │
└─────────┘       └──────────────┘      └──────────────┘       └──────────────┘
```

---

## 5. Phase 1 — 즉시 실행 (0~2주)

> 목표: 현재 운영 파이프라인의 완성도를 높이고, 가장 시급한 기술 부채를 해소한다.

### 작업 의존성 맵 (Phase 1)

```mermaid
graph LR
    A[5.5 next.config 정리] --> |독립| Z[완료]
    B[5.4 처리량 차트 개선] --> |독립| Z
    C[5.3 도메인 에러 타입] --> |독립| Z
    D[5.1 P0-9 퍼널 대시보드] --> |독립| Z
    E[5.2 P0-10 견적 엔진] --> |Prisma 마이그레이션 필요| F[PriceQuote 모델 추가]
    F --> Z

    style E fill:#ff9,stroke:#333
    style F fill:#f96,stroke:#333
```

> **리스크**: P0-10 견적 엔진은 Prisma 스키마 변경(PriceQuote 모델)을 수반합니다. 마이그레이션 전 스테이징 환경에서 테스트 필수. 나머지 항목은 독립적으로 병렬 진행 가능합니다.

### 5.1 [P0-9] 운영 퍼널 대시보드

- **목표**: 1차 릴리즈는 **서버 SoT(제출/처리/결제확인/조건충족)** 기반 퍼널을 고정하고, 클릭 지표는 2차(트래킹 저장 완료 후)로 분리한다.
- **지표 정의서(고정)**: `docs/guides/admin-funnel-kpi-sot.md`
- **구현 범위**:
  - KPI 카드 4개: 제출 수, 처리 수, 결제 확인 수, 조건 충족 수
  - 단계별 전환율: 제출→처리, 처리→결제확인, 결제확인→조건충족, 제출→조건충족(전체)
  - 기간 필터: 오늘/7일/30일/전체
  - 트렌드 차트: 일별 제출/처리/결제확인/조건충족 추이
  - 목표선 표시: Baseline(최근 30일 실측) 대비 단계별 Target 표시
  - 2차 확장 항목: 클릭 퍼널(landing CTA/event 저장 완료 후 연동)
- **지표 정의 (SoT/기준 시각/중복 규칙)**:

| 지표 | Source of Truth | 기준 시각 | 중복/집계 규칙 |
|------|------------------|-----------|----------------|
| 제출(접수) | `FormSubmission` | `createdAt` | `responseId` unique로 중복 제출 방지 |
| 처리 | `FormSubmission.status='PROCESSED'` | `updatedAt` | 상태 변경 시각 기준, `count(distinct id)` |
| 결제 확인 | `Case.paymentConfirmedAt IS NOT NULL` | `paymentConfirmedAt` | `count(distinct case.id)` |
| 조건 충족 | `BillingEvent` | `createdAt` | 케이스당 1개 unique, 조인 시 `count(distinct caseId)` 권장 |

- **전환율 정의 (1차 릴리즈 고정)**:
  - 제출→처리 = `처리 수 / 제출 수`
  - 처리→결제확인 = `결제 확인 수 / 처리 수`
  - 결제확인→조건충족 = `조건 충족 수 / 결제 확인 수`
  - 제출→조건충족 = `조건 충족 수 / 제출 수`

- **Baseline (최근 30일 실측, 2026-01-14 ~ 2026-02-13 UTC)**:
  - 제출 `7`, 처리 `6`, 결제확인 `2`, 조건충족 `1`
  - 제출→처리 `85.7%` (`6/7`)
  - 처리→결제확인 `33.3%` (`2/6`)
  - 결제확인→조건충족 `50.0%` (`1/2`)
  - 제출→조건충족 `14.3%` (`1/7`)

### 5.1.1 Admin 시간대 정책 (P0-9 동시 적용)

- **원칙**:
  - 저장/필터: UTC 유지
  - Admin 표시: `Asia/Seoul` 강제 (KST)
- **표준 포맷**:
  - `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ... })`
- **주의 사항**:
  - 표시를 사용자 로컬 타임존에 의존하면 기간 필터 경계(일자 시작/종료) 불일치 버그가 발생할 수 있으므로 금지
- **구현 위치**:
  - `apps/web/src/services/admin/funnel.service.ts` (신규)
  - `apps/web/src/app/api/admin/funnel/route.ts` (신규)
  - `apps/web/src/app/admin/funnel/page.tsx` (신규)
  - `apps/web/src/app/admin/funnel/_components/` (신규)
- **완료조건(DoD)**:
  - 4개 KPI 카드(제출/처리/결제확인/조건충족)가 실시간 DB 데이터 기반으로 표시
  - 기간 필터 변경 시 즉시 업데이트
  - AdminNav에 "퍼널" 메뉴 추가
  - 목표 대비 실적(Actual vs Target) 색상 구분 표시
  - 지표 정의서(SoT/중복/기준 시각)가 문서에 고정
  - 최근 30일 스냅샷 수치가 검증 쿼리/테스트로 재현 가능
  - 시간대 정책(저장/필터 UTC, 표시 KST)이 코드/화면에 적용
- **예상 공수**: 2~3일

### 5.2 [P0-10] 숫자형 가격 산식 엔진

- **목표**: 견적 산정의 일관성을 숫자 기반 규칙으로 보장
- **구현 범위**:
  - 가격 입력 요소: `baseFee`, `durationWeight`, `difficultyWeight`, `urgencyWeight`, `frequencyWeight`
  - 계산 규칙: 1,000원 반올림 + 하한(10,000)/상한(500,000) 적용
  - 케이스별 가격 근거 스냅샷 저장 (누가/언제/어떤 가중치/어떤 정책 버전)
  - `PriceQuote` 필수 필드:
    - `pricingPolicyVersion`
    - `inputsSnapshot` (intake 입력 스냅샷)
    - `weightsSnapshot` (`baseFee + weights`)
    - `computedAmountKrw`, `roundedAmountKrw`
    - `changeReason` (필수)
    - `isActive` (선택, 케이스 현재 적용 quote)
  - 관리자 UI: 산식 입력 → 미리보기 → 저장
- **SoT 주석**:
  - 현 단계 `BillingEvent`는 **조건충족 이벤트 기록**(현재 `amountKrw=0`)이며 매출 SoT가 아니다.
  - 매출 SoT는 Phase 2 `Payment` 모델 도입 이후 확정한다.
- **구현 위치**:
  - `packages/db/prisma/schema.prisma` — PriceQuote 모델
  - `apps/web/src/services/pricing.service.ts` (신규)
  - `apps/web/src/app/admin/cases/[id]/_components/pricingBreakdown.tsx` (신규)
- **완료조건(DoD)**:
  - 동일 입력에 동일 가격 산출
  - 모든 결제 대기 건에서 산식 근거 조회 가능
  - 가격 변경 시 변경 이력 자동 저장
- **예상 공수**: 3~4일

### 5.3 도메인 에러 타입 도입

- **목표**: Route Handler에서 에러 종류별 HTTP 상태 코드 자동 매핑
- **구현 범위**:
  ```
  packages/shared/src/errors/
  ├── base.ts           # AppError (code, statusCode, context, toJSON)
  ├── auth.ts           # UnauthorizedError (401), ForbiddenError (403)
  ├── resource.ts       # NotFoundError (404), ConflictError (409), QuotaExceededError (403)
  └── validation.ts     # ValidationError (400)
  ```
- **적용 대상**: 모든 서비스 파일 (`throw new Error(...)` → `throw new NotFoundError(...)`)
- **Route Handler 공통 핸들러**:
  ```typescript
  function handleServiceError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.toJSON() }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
  ```
- **완료조건(DoD)**:
  - 최소 5개 서비스 파일에 적용
  - Route Handler에서 에러 코드 기반 HTTP 매핑 동작
  - 기존 테스트 모두 통과
- **예상 공수**: 2~3일

### 5.4 처리량 차트 개선 (기존 백로그)

- **시간 버킷 간격 조정**: ≤1h → 2분(30포인트), ≤6h → 10분(36포인트)
- **작업 파일**: `apps/web/src/app/api/admin/throughput/history/route.ts`
- **예상 공수**: 0.5일

### 5.5 next.config.ts 레거시 정리

- **작업**: `serverExternalPackages`에서 puppeteer 참조 제거 (현재 Playwright 사용 중)
- **작업 파일**: `apps/web/next.config.ts`
- **예상 공수**: 0.5시간

---

## 6. Phase 2 — 단기 (2~6주)

> 목표: 운영 자동화를 강화하고, 코드 품질/테스트 기반을 확립한다.

### 6.1 [P1-1] 요청 기간 자동 만료

- **목표**: 요청 기간(Q5) 종료 후 미충족 케이스 자동 EXPIRED 처리
- **구현 범위**:
  - 배치 잡: 하루 1회 실행, ACTIVE_MONITORING 상태 + 종료일 경과 케이스 검색
  - 상태 전이: ACTIVE_MONITORING → EXPIRED (시스템 자동, reason: "요청 기간 만료")
  - 만료 안내 메시지 자동 발송 (카카오톡)
  - 비용 0원 처리 확인
- **구현 위치**:
  - `packages/worker-shared/src/runtime/caseExpiration.ts` (신규)
  - `apps/worker/src/cycleProcessor.ts` — 만료 배치 잡 추가
  - `packages/worker-shared/src/runtime/scheduler.ts` — 만료 스케줄 추가
- **완료조건(DoD)**:
  - 만료 배치가 매일 00:00 실행
  - 만료 시 CaseStatusLog에 시스템 전이 기록
  - 만료 안내 카카오 메시지 발송
- **예상 공수**: 2~3일

### 6.2 [P1-2] 알림 채널 이중화

- **목표**: 카카오톡 실패 시 이메일로 자동 전환
- **구현 범위**:
  - 이메일 발송 인프라: Resend/Nodemailer + HTML 템플릿
  - 알림 채널 우선순위: 카카오톡 → 이메일
  - CaseNotification에 channel 필드 확장
  - 재시도 로직: 1차(카톡) 실패 → 2차(이메일) 시도
  - 사용자 이메일 연락처 저장 (FormSubmission.extractedFields에서 추출)
- **구현 위치**:
  - `packages/worker-shared/src/observability/email/sender.ts` (신규)
  - `packages/worker-shared/src/runtime/notifications.ts` — 이중화 로직 추가
  - `apps/web/src/messages/{locale}/email.json` — 이메일 템플릿
- **완료조건(DoD)**:
  - 카톡 3회 실패 → 이메일 자동 시도
  - 케이스별 채널 도달률 집계 가능
- **예상 공수**: 4~5일

### 6.3 [P1-4] 운영 SLA 타이머

- **목표**: 접수 후 응답 지연 건에 대한 자동 알림
- **구현 범위**:
  - SLA 규칙:
    - RECEIVED → 30분 내 미응답 → 관리자 알림
    - WAITING_PAYMENT → 24시간 정체 → 고객 리마인드
    - NEEDS_CLARIFICATION → 48시간 미응답 → 에스컬레이션
  - 배치 잡: 5분마다 SLA 위반 건 스캔
  - 관리자 알림: 카카오/이메일
  - 대시보드에 SLA 위반 건 수 표시
- **구현 위치**:
  - `packages/worker-shared/src/runtime/slaMonitor.ts` (신규)
  - `apps/web/src/services/admin/sla.service.ts` (신규)
- **예상 공수**: 3~4일

### 6.4 환경변수 검증 스키마

- **목표**: 워커/웹 시작 시 환경변수 검증 → 누락/잘못된 값 즉시 감지
- **구현 범위**:
  - Zod 스키마 정의 (DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET 등)
  - 워커 시작 시 fail-fast 검증
  - 웹 빌드 시 필수 PUBLIC 변수 검증
- **구현 위치**:
  - `packages/worker-shared/src/runtime/settings/schema.ts` (신규)
  - `apps/web/src/lib/env.ts` — Zod 스키마 추가
- **예상 공수**: 1~2일

### 6.5 구조화된 로깅 시스템

- **목표**: console.error → 구조화 로거 전환
- **구현 범위**:
  - pino 기반 구조화 로거
  - 로그 컨텍스트: requestId, userId, action, duration, error.code
  - 워커 로그: jobId, accommodationId, cycleId
  - 로그 레벨: debug/info/warn/error
  - 개발환경: pretty print, 프로덕션: JSON
- **구현 위치**:
  - `packages/worker-shared/src/observability/logger.ts` — 로거 팩토리
  - 각 서비스/프로세서 파일에 적용
- **예상 공수**: 3~4일

### 6.6 App(비공개) 페이지 i18n

- **목표**: Dashboard, Accommodations, Settings 등 인증 페이지 다국어 적용
- **구현 범위**:
  - `apps/web/src/messages/{locale}/app.json` — App 네임스페이스 메시지
  - Dashboard: KPI 라벨, 상태 텍스트, 액션 버튼
  - Accommodation: 폼 라벨, 상태, 에러 메시지
  - Settings: 구독 정보, 플랜 설명
  - AppHeader: 네비게이션 텍스트 (일부 하드코딩 → i18n)
- **참고**: `i18n-architecture-plan.md` 항목 #7
- **예상 공수**: 5~7일

### 6.7 Worker 프로세서 테스트 강화

- **목표**: cycleProcessor, checkProcessor 단위 테스트 작성
- **구현 범위**:
  - cycleProcessor: cycle-trigger 잡 처리, notification-retry 잡 처리
  - checkProcessor: 상태 결정, CheckLog 저장, Case-linked 증거 생성
  - Mock: prisma, BullMQ queue, browser checker
- **예상 공수**: 3~4일

---

## 7. Phase 3 — 중기 (1~3개월)

> 목표: 셀프서비스 기반을 마련하고, 품질/보안/관측성을 프로덕션 수준으로 끌어올린다.

### 7.1 고객 셀프서비스 접수 양식

- **목표**: Google Form 의존 탈피, 웹 기반 접수 양식 구축
- **구현 범위**:
  - 공개 접수 페이지: `/request/new`
  - 양식 필드: 숙소 URL, 조건 정의, 요청 기간, 연락처, 동의 체크
  - URL 자동 파싱: 플랫폼 감지, 체크인/아웃 날짜 추출
  - 실시간 유효성 검사: URL 형식, 날짜 범위, 조건 모호성 사전 경고
  - 접수 완료 → FormSubmission 생성 (기존 파이프라인 재사용)
- **기대 효과**: Google Form/Apps Script 의존 제거, 사용자 경험 향상
- **예상 공수**: 7~10일

### 7.2 온라인 결제 연동

- **목표**: 관리자 수동 결제 확인 → PG 자동 결제
- **구현 범위**:
  - PG 연동: 토스페이먼츠 또는 카카오페이
  - 결제 플로우: 견적 안내 → 결제 링크 발송 → 결제 완료 Webhook → 자동 결제 확인
  - 환불 처리: 조건 미충족 시 자동 환불 (향후)
  - 결제 이력: BillingEvent 확장
- **스키마 변경**:
  - Payment 모델 추가: paymentId, provider, amount, status, paidAt, refundedAt
  - Case와 1:1 관계
- **예상 공수**: 10~14일

### 7.3 고객용 상태 페이지

- **목표**: 고객이 자신의 요청 상태를 직접 확인 (비로그인/토큰 링크)
- **구현 범위**:
  - `/status/[token]` — 토큰 기반 접근 (UUID, 케이스당 1개)
  - 표시 정보: 현재 상태, 주의문구, 최근 알림 시각, 타임라인
  - 제외 정보: 내부 운영 로그, 셀렉터 정보, 다른 고객 데이터
  - 주의 문구 고정: "본 서비스는 빈방 알림 서비스이며, 예약 대행이 아닙니다"
- **예상 공수**: 3~5일

### 7.4 API 문서화 (OpenAPI)

- **목표**: 51개 API 엔드포인트에 대한 자동 생성 문서
- **구현 범위**:
  - `zod-to-openapi` 라이브러리 도입
  - 기존 Zod 스키마에 OpenAPI 메타데이터 추가
  - `/api/docs` — Swagger UI (개발환경 전용)
  - CI에서 OpenAPI 스펙 자동 생성/검증
- **예상 공수**: 5~7일

### 7.5 통합 테스트 환경 구축

- **목표**: 주요 비즈니스 플로우의 end-to-end 검증
- **구현 범위**:
  - Testcontainers: PostgreSQL + Redis
  - 테스트 시나리오:
    1. 숙소 생성 → 체크 처리 → 알림 발송
    2. 폼 접수 → 케이스 생성 → 결제 → 모니터링 → 조건 충족
    3. 사용자 쿼터 초과 시 숙소 추가 거부
    4. 관리자 설정 변경 → 워커 반영
  - 테스트용 시드 데이터 스크립트
- **예상 공수**: 7~10일

### 7.6 정적 참조 데이터 캐싱

- **목표**: roles, plans, system settings 등 정적 데이터의 반복 조회 제거
- **구현 범위**:
  - 서비스 계층 메모리 캐시 (TTL 5분)
  - 관리자 변경 시 캐시 무효화
  - Map 기반 단순 구현 (외부 라이브러리 불필요)
- **대상 데이터**: roles 목록, plans 목록 + 쿼터, system settings
- **예상 공수**: 1~2일

### 7.7 Evidence Packet 자동 봉인 (P1-5)

- **목표**: 조건 충족 증거 패킷의 무결성 보장
- **구현 범위**:
  - 멱등 키: `caseId + firstConditionMetAt`
  - 봉인 상태: OPEN → SEALED / PARTIAL
  - `sealedAt` 이후 수정 불가
  - 스크린샷/발송 로그 실패 시 PARTIAL + 재시도 큐
- **예상 공수**: 3~4일

### 7.8 사용자 preferredLocale 저장

- **목표**: 사용자 프로필에 선호 언어 저장, 알림 발송 시 반영
- **구현 범위**:
  - User 모델에 `preferredLocale` 필드 추가
  - 설정 페이지에서 언어 변경 UI
  - Worker/이메일 발송 시 사용자 locale 적용
- **참고**: `i18n-architecture-plan.md` ADR-2, ADR-4
- **예상 공수**: 2~3일

---

## 8. Phase 4 — 장기 (3~6개월)

> 목표: 플랫폼을 확장하고, B2B 가능성을 검증한다.

### 8.1 Booking.com 플랫폼 지원

- **목표**: 세 번째 플랫폼으로 Booking.com 추가
- **구현 범위**:
  - `Platform` enum에 `BOOKING` 추가
  - `packages/worker-shared/src/browser/booking.ts` — Booking.com 체커
  - `packages/shared/src/checkers/constants.ts` — Booking 패턴 추가
  - URL 파서: Booking.com URL 구조 해석
  - DB 셀렉터: Booking.com용 초기 셀렉터 시드
- **예상 공수**: 5~7일

### 8.2 국내 플랫폼 지원 (야놀자/여기어때)

- **목표**: 한국 시장 특화 플랫폼 추가
- **구현 범위**:
  - `Platform` enum에 `YANOLJA`, `GOODCHOICE` 추가
  - 각 플랫폼별 체커 구현
  - URL 파서 확장
  - 한국어 특화 패턴 (가격 형식, 가용성 텍스트)
- **예상 공수**: 7~10일 (플랫폼당)

### 8.3 알림 채널 확장

- **목표**: 카카오톡/이메일 외 추가 채널 지원
- **구현 범위**:
  - 텔레그램 Bot API 연동
  - 라인 Messaging API 연동 (일본 시장)
  - Slack Webhook (B2B)
  - SMS (해외 사용자)
  - 알림 채널 선호도 설정 (사용자별)
- **예상 공수**: 채널당 2~3일

### 8.4 E2E 테스트 도입

- **목표**: 주요 사용자 플로우의 브라우저 기반 테스트
- **구현 범위**:
  - Playwright 테스트 환경 구축
  - 시나리오:
    1. 회원가입 → 로그인 → 대시보드
    2. 숙소 등록 → 목록 확인 → 상세 보기
    3. 관리자: 케이스 생성 → 상태 전이 → 증거 확인
    4. 다국어: 언어 변경 → 페이지 확인
  - CI 연동: 별도 stage로 실행
- **예상 공수**: 7~10일

### 8.5 Admin 페이지 i18n

- **목표**: 관리자 페이지 전체 다국어 지원
- **구현 범위**:
  - `apps/web/src/messages/{locale}/admin.json` — Admin 네임스페이스
  - 모든 Admin 페이지의 하드코딩 텍스트 → i18n 키
  - AdminNav 메뉴 텍스트
  - 상태 라벨, 버튼 텍스트, 에러 메시지
- **예상 공수**: 7~10일

### 8.6 분쟁 리스크 스코어링 (P2-2)

- **목표**: 분쟁 가능성 높은 요청 사전 식별
- **구현 범위**:
  - 리스크 입력: Q4 모호성, 잦은 조건 변경, 답변 지연, 가격 민감도
  - 스코어링: 0~100 점수 + HIGH/MEDIUM/LOW 등급
  - 케이스 목록에 리스크 배지 표시
  - 리스크 HIGH 건 자동 에스컬레이션
- **예상 공수**: 3~5일

### 8.7 가용성 분석 대시보드 (기존 백로그)

- **목표**: 숙소별 가용 패턴 분석
- **구현 범위**:
  - Summary 카드: 모니터링 숙소 수, 현재 가용률, 가용 전환 횟수, 평균 간격
  - 타임라인 차트: 시간대별 AVAILABLE/UNAVAILABLE
  - 시간대별 패턴: 0~23시별 가용 전환 빈도
  - 숙소별 테이블: 가용률%, 상태 변경 횟수
- **API**: `/api/admin/availability/{summary,timeline,accommodations,patterns}`
- **예상 공수**: 5~7일

---

## 9. Phase 5 — 비전 (6개월+)

> 목표: 장기적으로 빈방이 나아가야 할 방향. 시장 검증 후 선택적 실행.

### 9.1 AI/ML 기반 가격 예측

- **개요**: 과거 가격 데이터 + 시즌/이벤트 정보를 학습하여 가격 하락/빈방 발생 확률 예측
- **가치**: "지금 기다리면 가격이 내려갈 확률 73%" 같은 인사이트 제공
- **필요 데이터**: 최소 6개월 이상의 가격/가용성 히스토리
- **기술**: Python ML 서비스 (별도 마이크로서비스) 또는 LLM 기반 분석
- **비용 추정**:
  - PoC(6~8주): 약 ₩15,000,000 ~ ₩30,000,000 (모델링/특성 엔지니어링/평가)
  - 운영(월): 약 ₩1,000,000 ~ ₩3,000,000 (추론 인프라 + 데이터 파이프라인)

### 9.2 B2B API / 화이트라벨

- **개요**: 여행사/호텔 관리업체가 자체 시스템에서 빈방 API 활용
- **구현 범위**:
  - REST API: 모니터링 등록/해제, 상태 조회, 웹훅 알림
  - API 키 인증 + Rate Limiting
  - 화이트라벨: 커스텀 브랜딩으로 재판매
  - 대시보드: 파트너별 사용량/과금 현황
- **비즈니스 모델**: API 호출 건당 과금 또는 월 구독
- **비용 추정**:
  - 초기 구축(8~12주): 약 ₩20,000,000 ~ ₩40,000,000 (인증/과금/파트너 포털 포함)
  - 운영(월): 약 ₩1,500,000 ~ ₩4,000,000 (API 게이트웨이, 모니터링, 파트너 지원)

### 9.3 모바일 앱 (React Native)

- **개요**: 빈방 알림을 모바일 푸시로 받는 전용 앱
- **가치**: 카카오톡 의존 탈피, 앱 내 직접 예약 연결, 더 풍부한 알림 UX
- **기술**: React Native (Expo) + 기존 API 재사용
- **비용 추정**: MVP 1플랫폼 기준 약 ₩25,000,000 ~ ₩50,000,000, 운영(월) 약 ₩500,000 ~ ₩1,500,000

### 9.4 구독 기반 SaaS 모델

- **개요**: 건당 과금 → 월/연 구독으로 전환
- **플랜 예시**:
  - Free: 숙소 1개, 일 1회 체크
  - Basic (₩9,900/월): 숙소 3개, 30분 간격
  - Pro (₩29,900/월): 숙소 10개, 15분 간격, 가격 알림
  - Business (₩99,900/월): 무제한, API 접근, 우선 지원
- **필요 인프라**: Stripe/토스 반복결제, 사용량 미터링, 업/다운그레이드
- **비용 추정**: 결제/미터링 인프라 구축 약 ₩10,000,000 ~ ₩20,000,000 + 결제 수수료(매출 연동)

### 9.5 커뮤니티/리뷰 기능

- **개요**: 사용자간 숙소 정보/후기 공유 플랫폼
- **가치**: 네트워크 효과 + 유저 리텐션 + SEO 콘텐츠
- **구현**: 후기, 숙소 추천, 가격 비교, 알림 공유

### 9.6 글로벌 확장

- **1차 확장**: 일본 (Airbnb + Booking.com + 라쿠텐트래블)
- **2차 확장**: 동남아 (Agoda 강화 + Hotels.com)
- **3차 확장**: 유럽/북미 (Booking.com + Hotels.com + Vrbo)
- **필요 인프라**: CDN, 멀티리전 DB, 현지 결제 수단, 현지 알림 채널

---

## 10. 기술 부채 상세

> 본 섹션은 기술 부채의 **등록 및 추적**을 담당한다. 각 항목의 **상세 구현 계획**은 해당 Phase를 참조한다.

### 10.1 코드 레벨

| # | 항목 | 위치 | 심각도 | 해결 Phase | 설명 |
|---|------|------|--------|-----------|------|
| TD-1 | 일반 Error throw | 서비스 전체 | 높음 | → [5.3 도메인 에러 타입](#53-도메인-에러-타입-도입) (Phase 1 주차 1 필수) | `throw new Error('...')` → AppError 계층 + HTTP 매핑 통일 필요 |
| TD-2 | console.error 로깅 | 전체 | 높음 | → [6.5 구조화 로깅](#65-구조화된-로깅-시스템) | 구조화 로거(pino) 전환 필요 |
| TD-3 | Puppeteer 참조 잔존 | `next.config.ts` | 낮음 | → [5.5 레거시 정리](#55-nextconfigts-레거시-정리) | serverExternalPackages에서 제거 |
| TD-4 | TODO/FIXME 미정리 | 4개 파일 | 낮음 | → [부록 D](#부록-d-파일별-todofixme-목록) | analytics tracker, hooks/index.ts 등 |
| TD-5 | analytics console.log | `landing-tracker.ts` | 중간 | → [27.2 SEO 전략](#272-seo-전략) | 실제 GA/Mixpanel 연동 필요 |
| TD-6 | formatDateTime 중복 | admin/cases 4개 파일 | 낮음 | — | 공용 유틸 추출 완료, consentPanel만 별도 |
| TD-7 | useEffect import 불필요 | 정리 완료 | ✅ 완료 | — | app-header.tsx ThemeToggle 전환으로 해결 |

### 10.2 아키텍처 레벨

| # | 항목 | 심각도 | 해결 Phase | 설명 |
|---|------|--------|-----------|------|
| TD-8 | API 라우트 에러 핸들링 패턴 불일치 | 높음 | → [22.3 API-1](#223-api-개선-로드맵) | 각 route.ts마다 try/catch 패턴이 다름 → 공통 에러 핸들러 필요 |
| TD-9 | 정적 데이터 매 요청 조회 | 중간 | → [7.6 참조 데이터 캐싱](#76-정적-참조-데이터-캐싱) | roles, plans 등 거의 변하지 않는 데이터 캐싱 없음 |
| TD-10 | Worker 프로세서 비즈니스 로직 | 중간 | → [23.4 WRK-1](#234-worker-개선-todo) | cycleProcessor/checkProcessor에 일부 로직 잔존 → runtime으로 이관 |
| TD-11 | CORS 미설정 | 중간 | → [12.2 SEC-1](#122-보안-강화-항목) | Next.js 기본 동작 의존 |
| TD-12 | CSP(Content Security Policy) 미설정 | 중간 | → [12.2 SEC-2](#122-보안-강화-항목) | XSS 방어 헤더 부재 |

### 10.3 인프라 레벨

| # | 항목 | 심각도 | 설명 |
|---|------|--------|------|
| TD-13 | 단일 서버 배포 | 높음 | OCI 단일 인스턴스 → HA 구성 필요 (장기) |
| TD-14 | DB 백업 정책 미정의 | 높음 | PostgreSQL 자동 백업/복구 전략 필요 |
| TD-15 | Redis 영속성 미설정 | 중간 | BullMQ 작업 큐 데이터 유실 가능 |
| TD-16 | 모니터링 도구 부재 | 중간 | DataDog/New Relic/Grafana 없음 |
| TD-17 | 로그 수집/분석 부재 | 중간 | ELK/Loki 없음, 서버 로그 직접 확인 |

---

## 11. 테스트 전략

### 11.1 테스트 피라미드 목표

```
         ┌──────────┐
         │   E2E    │  10% — 주요 사용자 플로우 (Phase 4)
         │ (5~10)   │
        ┌┴──────────┴┐
        │  통합 테스트  │  20% — 서비스 간 연동 (Phase 3)
        │  (20~30)    │
       ┌┴────────────┴┐
       │  단위 테스트    │  70% — 서비스/유틸/컴포넌트 (Phase 1~2)
       │  (200+)       │
       └──────────────┘
```

- **Vitest 커버리지 게이트**: 3개월 70%+, 6개월 80%+, 장기 85% (statements/branches/functions/lines 모두 최소 80% 목표)

### 11.2 단위 테스트 확장 계획

| 영역 | 현재 | 목표 | 우선순위 |
|------|------|------|----------|
| Web Services | 8/15+ 파일 | 전체 | P1 |
| Web Lib/Utils | 4/8+ 파일 | 전체 | P2 |
| Shared Checkers | 2/3 파일 | 전체 | P2 |
| Shared i18n | 4/5 파일 | 전체 | 완료에 가까움 |
| Worker-Shared Runtime | 2/10+ 파일 | 핵심 7개 | P1 |
| Worker-Shared Browser | 0/4 파일 | 2개 | P2 |
| Worker Processors | 0/3 파일 | 전체 | P1 |

#### 신규 테스트 대상 상세

**P1 — 즉시 작성 필요**:

| 파일 | 테스트 포인트 | 예상 테스트 수 |
|------|-------------|---------------|
| `cases.service.ts` (추가) | P0-9 퍼널 쿼리, P0-10 견적 연동 | 10+ |
| `notifications.service.ts` | 알림 재시도, 채널 전환, 토큰 만료 | 8+ |
| `condition-parser.service.ts` (추가) | 엣지 케이스, 다국어 입력 | 5+ |
| `pricing.service.ts` (신규) | 산식 계산, 반올림, 하한/상한 | 10+ |
| `worker-shared/runtime/conditionTrigger.ts` | 원자적 트리거, 멱등, 롤백 | 8+ |
| `worker-shared/runtime/heartbeat.ts` | 상태 감지, 알림 쿨다운 | 6+ |
| `worker-shared/runtime/settings/index.ts` | DB→env→default 체인, 캐시 | 8+ |
| `apps/worker/src/cycleProcessor.ts` | 사이클 트리거, 재시도, 케이스 연결 | 10+ |
| `apps/worker/src/checkProcessor.ts` | 상태 결정, 증거 생성, 알림 | 10+ |

**P2 — 2~4주 내 작성**:

| 파일 | 테스트 포인트 | 예상 테스트 수 |
|------|-------------|---------------|
| `admin/plans.service.ts` | CRUD, 삭제 가드, 쿼터 | 8+ |
| `admin/selectors.service.ts` | CRUD, 히스토리, 우선순위 | 10+ |
| `admin/monitoring.service.ts` | 요약 쿼리, 로그 필터 | 5+ |
| `health.service.ts` | 헬스체크 로직 | 3+ |
| `worker-shared/browser/baseChecker.ts` | 리트라이, 타임아웃, 리소스 차단 | 8+ |
| `worker-shared/browser/browserPool.ts` | 풀 관리, 건강검사, 타임아웃 | 6+ |

### 11.3 통합 테스트 시나리오

| # | 시나리오 | 관련 서비스 | 우선순위 |
|---|---------|-----------|----------|
| IT-1 | 숙소 등록 → 쿼터 검증 → 저장 → 조회 | accommodations, user | P1 |
| IT-2 | 폼 접수 → 검증 → 케이스 생성 → 상태 전이 | intake, cases | P1 |
| IT-3 | 결제 확인 → 모니터링 시작 → 조건 충족 → 과금 | cases, conditionTrigger | P1 |
| IT-4 | 알림 발송 → 실패 → 재시도 → 성공 | notifications, caseNotifications | P2 |
| IT-5 | 설정 변경 → 워커 반영 → 캐시 무효화 | settings, selector cache | P2 |
| IT-6 | 사용자 역할 변경 → 감사 로그 기록 | admin/users, audit | P2 |

### 11.4 E2E 테스트 시나리오

| # | 시나리오 | 관련 페이지 | 우선순위 |
|---|---------|-----------|----------|
| E2E-1 | 회원가입 → 로그인 → 대시보드 | signup, login, dashboard | P1 |
| E2E-2 | 숙소 등록 → 목록 → 상세 → 가격 차트 | accommodations/* | P1 |
| E2E-3 | 관리자: 케이스 목록 → 상세 → 상태 전이 | admin/cases/* | P2 |
| E2E-4 | 다국어: 언어 변경 → 페이지 내용 확인 | 전체 | P2 |
| E2E-5 | 다크모드: 테마 전환 → 스타일 확인 | 전체 | P3 |

---

## 12. 보안 강화 계획

### 12.1 현재 보안 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 비밀번호 해싱 | ✅ bcrypt 12라운드 | |
| OAuth (Google, Kakao) | ✅ NextAuth | |
| 세션 관리 | ✅ DB 기반 | |
| RBAC | ✅ USER/ADMIN | |
| Rate Limiting | ✅ 인메모리 슬라이딩 윈도우 | |
| 입력 검증 | ✅ Zod 전체 적용 | |
| 웹훅 서명 검증 | ✅ timing-safe 비교 | |
| 감사 로그 | ✅ actor/target/변경값 | |
| CORS | ❌ Next.js 기본 의존 | |
| CSP | ❌ 미설정 | |
| CSRF | ✅ NextAuth 내장 | |
| XSS 방지 | ⚠️ React 기본 + 추가 없음 | |
| SQL Injection | ✅ Prisma ORM | |
| 환경변수 보호 | ⚠️ 검증 스키마 없음 | |

### 12.2 보안 강화 항목

| # | 항목 | 우선순위 | 설명 |
|---|------|----------|------|
| SEC-1 | CORS 명시적 설정 | P1 | middleware.ts에 허용 origin 설정 |
| SEC-2 | CSP 헤더 추가 | P2 | script-src, style-src, img-src 제한 |
| SEC-3 | Rate Limiting Redis 전환 | P2 | 인메모리 → Redis (다중 인스턴스 대비) |
| SEC-4 | 환경변수 Zod 검증 | P1 | fail-fast 검증 |
| SEC-5 | API 키 인증 (B2B) | P3 | 향후 API 공개 시 |
| SEC-6 | 보안 헤더 강화 | P2 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| SEC-7 | 의존성 감사 자동화 | P2 | `pnpm audit` CI 통합 |
| SEC-8 | 스크린샷 데이터 암호화 | P3 | screenshotBase64 at-rest 암호화 + GDPR 관점 개인정보(이름/연락처 노출 가능성) 최소보관/보호 |

---

## 13. 성능 최적화 계획

### 13.1 현재 성능 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| Turbo 빌드 캐시 | ✅ | 변경 없는 패키지 스킵 |
| Docker 멀티스테이지 | ✅ | 의존성 레이어 캐시 |
| Next.js Standalone | ✅ | 축소된 프로덕션 번들 |
| React Query 캐시 | ✅ | queryKey 기반 |
| 셀렉터 캐시 | ✅ | 5분 TTL |
| SystemSettings 캐시 | ✅ | 5분 TTL |
| DB select 절 | ✅ | 필요 필드만 |
| 이미지 최적화 | ⚠️ | Next Image 일부 사용 |
| 번들 분석 | ❌ | bundle-analyzer 미사용 |
| DB 인덱스 최적화 | ⚠️ | 기본 인덱스만 |

### 13.2 최적화 항목

| # | 항목 | 영향도 | 설명 |
|---|------|--------|------|
| PERF-1 | 정적 데이터 서버 캐시 | 높음 | roles/plans 5분 메모리 캐시 |
| PERF-2 | DB 쿼리 최적화 | 중간 | N+1 쿼리 감지, 복합 인덱스 추가 (예: 케이스 목록에서 각 row별 latest CheckLog 개별 조회 패턴 제거) |
| PERF-3 | 번들 사이즈 분석 | 중간 | @next/bundle-analyzer 도입 |
| PERF-4 | 이미지 최적화 | 낮음 | Next Image + WebP 전면 적용 |
| PERF-5 | API 응답 압축 | 낮음 | gzip/brotli 확인/설정 |
| PERF-6 | 브라우저 풀 워밍업 | 중간 | 워커 시작 시 pre-create |
| PERF-7 | CheckLog 파티셔닝 | 장기 | 월별 파티셔닝 (데이터 증가 시) |

---

## 14. 관측성(Observability) 로드맵

### 14.1 현재 → 목표

```
현재                          목표 (Phase 2~3)                 장기 (Phase 4+)
┌──────────────┐            ┌──────────────────┐            ┌──────────────────┐
│ console.log  │    →       │ pino 구조화 로거   │    →       │ Grafana/Loki     │
│ Heartbeat    │            │ 요청 ID 추적      │            │ 분산 추적 (OTEL) │
│ DB 감사 로그  │            │ 에러 알림 (Slack) │            │ 메트릭 대시보드   │
└──────────────┘            └──────────────────┘            └──────────────────┘
```

### 14.2 단계별 구현

**Phase 2 (2~6주)**:
- pino 로거 도입 + 요청 ID 미들웨어
- 에러 발생 시 Slack/카카오 관리자 알림
- 워커 에러율 메트릭 수집

**Phase 3 (1~3개월)**:
- Grafana + Loki 로그 수집
- Prometheus 메트릭 엔드포인트
- 대시보드: API 응답시간, 에러율, 워커 성능
- 비용 가드레일: Grafana Cloud 사용 시 월 ₩150,000 ~ ₩600,000 범위 내 예산 상한 관리

**Phase 4+ (3개월+)**:
- OpenTelemetry 분산 추적
- 알림 규칙: P95 응답시간 > 2초, 에러율 > 5%
- SLO/SLI 정의 및 모니터링
- 비용 최적화: 로그 샘플링/보존 기간 분리(핫 7~14일, 아카이브 90일+)로 월 비용 20~40% 절감

---

## 15. 데이터 전략

### 15.1 데이터 수집 현황

| 데이터 | 수집 상태 | 활용 상태 | 비고 |
|--------|-----------|-----------|------|
| 가용성 체크 로그 | ✅ 수집 중 | ⚠️ 일부 활용 | 가용성 분석 대시보드 미구현 |
| 가격 이력 | ✅ 수집 중 | ✅ 차트 표시 | 7일 이동평균 |
| 사이클 메트릭 | ✅ 수집 중 | ✅ 처리량 대시 | |
| 하트비트 이력 | ✅ 수집 중 | ✅ 모니터링 | 24시간 보존 |
| 감사 로그 | ✅ 수집 중 | ✅ 뷰어 | |
| 케이스 상태 이력 | ✅ 수집 중 | ✅ 타임라인 | |
| 폼 제출 원문 | ✅ 수집 중 | ✅ 증거 | |
| 랜딩 분석 이벤트 | ⚠️ console.log | ❌ 미연동 | GA 연동 필요 |
| 사용자 행동 | ❌ 미수집 | ❌ | 이벤트 트래킹 필요 |

### 15.2 데이터 활용 계획

**단기 (0~3개월)**:
- GA4 연동 완료 → 랜딩 전환율 측정
- 운영 퍼널 KPI: 접수→결제→충족 전환율
- 가격 데이터 백필: 기존 문자열 → 숫자 변환 (이미 priceAmount/priceCurrency 존재)
  - 예시 마이그레이션 스크립트 (`packages/db/prisma/migrations/20260214_price_backfill/migration.sql`):

```sql
-- 문자열 가격(CheckLog.price)을 숫자(CheckLog.priceAmount)로 백필
UPDATE "CheckLog"
SET
  "priceAmount" = NULLIF(regexp_replace("price", '[^0-9]', '', 'g'), '')::int,
  "priceCurrency" = COALESCE("priceCurrency", 'KRW')
WHERE "price" IS NOT NULL
  AND "priceAmount" IS NULL;
```

**중기 (3~6개월)**:
- 가용성 패턴 분석: 시간대별/요일별/시즌별 빈방 발생 패턴
- 가격 트렌드 분석: 환율 변환 + KRW 기준 비교
- 사용자 코호트 분석: 가입일 기준 리텐션/이탈률

**장기 (6개월+)**:
- ML 기반 가격 예측 모델
- 숙소 추천 알고리즘
- 지역별/유형별 수요 예측

### 15.3 데이터 보존 정책

| 데이터 | 현재 보존 | 권장 보존 | 비고 |
|--------|-----------|-----------|------|
| CheckLog | 무기한 | 6개월 핫 + 아카이브 | 데이터 증가 대비 |
| HeartbeatHistory | 24시간 | 7일 | 트렌드 분석 |
| 감사 로그 | 무기한 | 2년 | 컴플라이언스 |
| 케이스 데이터 | 무기한 | 5년 | 분쟁 대비 |
| 스크린샷 | DB (Base64) | 6개월 + S3 아카이브 | DB 부하 감소 |

---

## 16. 비즈니스 모델 진화

### 16.1 현재 모델: 건당 과금 (Google Form 기반)

```
접수(무료) → 검토(수동) → 견적(수동) → 결제(수동 확인) → 모니터링 → 조건 충족 → 과금
```

**장점**: 사용자 리스크 최소 (결과 기반 과금)
**단점**: 관리자 수작업 병목, 확장 불가, 예측 불가능한 수익

### 16.2 단기 진화: 웹 기반 건당 과금

```
웹 접수(자동) → 자동 검토 → 견적(산식) → PG 결제(자동) → 모니터링 → 조건 충족 → 과금
```

**변화점**: 수작업 제거, 24시간 접수 가능
**필요 투자**: 접수 양식, PG 연동, 견적 엔진

### 16.3 중기 진화: 하이브리드 모델 (건당 + 구독)

```
구독 플랜 선택 → 자동 모니터링 설정 → 기본 체크 포함 → 추가 건당 과금
```

**플랜 예시**:

| 플랜 | 월 요금 | 숙소 수 | 체크 간격 | 추가 기능 |
|------|---------|---------|-----------|-----------|
| Free | ₩0 | 1개 | 6시간 | 기본 알림 |
| Starter | ₩4,900 | 3개 | 1시간 | 가격 알림 |
| Pro | ₩14,900 | 10개 | 30분 | 가격 추이, 다중 채널 |
| Business | ₩49,900 | 무제한 | 15분 | API, 우선 지원 |

### 16.4 장기 진화: 플랫폼 모델

```
B2C (직접 사용자) + B2B (여행사/관리업체 API) + Marketplace (숙소 정보 공유)
```

**수익원 다각화**:
- 구독료 (B2C)
- API 사용료 (B2B)
- 제휴 수수료 (예약 플랫폼 연결)
- 프리미엄 분석 (가격 예측, 시장 리포트)

### 16.5 ARPU(고객당 평균 수익) 예측

| 단계 | 가정 | 월 ARPU(예상) | 비고 |
|------|------|---------------|------|
| 현재 (건당 중심) | 월 1~2건 결제 사용자 중심 | ₩8,000 ~ ₩12,000 | 이벤트성 수익 변동 큼 |
| 단기 (웹 자동화) | 결제 전환율 개선 + 이탈 감소 | ₩12,000 ~ ₩18,000 | 운영 지연 감소 효과 반영 |
| 중기 (하이브리드) | 구독 + 초과 사용 과금 | ₩20,000 ~ ₩35,000 | 플랜 업셀링 본격화 |
| 장기 (플랫폼) | B2C + B2B 혼합 | ₩40,000+ | 파트너 API 매출 포함 |

---

## 17. 경쟁 환경 및 차별화 전략

### 17.1 경쟁 환경

| 경쟁 유형 | 예시 | 차별점 |
|----------|------|--------|
| 플랫폼 자체 기본 알림 | 일반 OTA의 위시리스트/가격 알림 | 가격 알림 중심, "조건 기반 빈방" 24시간 감시는 제한적 |
| 직접 수동 확인 | 사용자 본인 | 24시간 자동 모니터링 |
| 가격 비교 사이트 | Kayak, Skyscanner | 실시간 빈방 감지 + 즉시 알림 |
| 호텔 알림 서비스 | Hotelscombined | 가격 변동 알림 (빈방 특화 아님) |
| 커스텀 스크립트 | 개인 개발자 | 설정/관리 불필요, 안정성 |

### 17.2 핵심 차별화 요소

1. **24시간 빈방 자동 모니터링**: 가격 알림이 아닌 "가용성/취소 좌석" 탐지에 집중
2. **즉시 알림**: 카카오톡 실시간 푸시 (한국 시장 최적화)
3. **증거 기반 투명성**: 스크린샷 + 증거 패킷으로 분쟁 방지
4. **동적 셀렉터**: 플랫폼 UI 변경에 코드 배포 없이 즉시 대응
5. **과금 공정성**: 결과 확인 시에만 비용 발생

### 17.3 경쟁 우위 강화 전략

- **기술 해자**: 동적 셀렉터 + 브라우저 자동화 노하우
- **B2B 해자**: 파트너 API + 증거 패킷(감사 가능 로그)로 운영 신뢰성 제공
- **데이터 해자**: 가격/가용성 이력 데이터 축적 → 분석/예측 서비스
- **사용자 경험**: 접수부터 알림까지 원스톱, 다국어 지원
- **신뢰**: 증거 패킷, 감사 로그, 동의 기록으로 투명한 운영

---

## 18. 리스크 관리

### 18.1 기술 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 플랫폼 UI 변경으로 체커 실패 | 높음 | 높음 | 동적 셀렉터 + 알림 + 빠른 대응 SLA |
| 플랫폼의 봇 차단 강화 | 중간 | 높음 | 브라우저 핑거프린트 다양화, 속도 제한, IP 로테이션 |
| Kakao API 변경/중단 | 낮음 | 높음 | 알림 채널 이중화 (이메일, SMS) |
| 단일 서버 장애 | 중간 | 높음 | HA 구성, 자동 복구, 백업 |
| DB 데이터 증가 | 중간 | 중간 | 파티셔닝, 아카이브, 보존 정책 |
| 의존성 보안 취약점 | 중간 | 중간 | pnpm audit 자동화, Dependabot |

### 18.2 비즈니스 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 숙박 플랫폼의 API 제공 (경쟁 무력화) | 낮음 | 높음 | 다중 플랫폼 + 부가가치(분석/예측) |
| 고객 분쟁 (과금 관련) | 중간 | 중간 | 증거 패킷 + 동의 기록 + 템플릿 |
| 수요 불확실성 (시장 검증) | 중간 | 중간 | 최소 운영비용, 데이터 기반 의사결정 |
| 가격 경쟁 | 낮음 | 중간 | 차별화된 UX + 데이터 해자 |
| 법적 리스크 (스크래핑 관련) | 중간 | 높음 | ToS 준수, 접근 빈도 제한, 법률 자문 |

### 18.3 운영 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 관리자 번아웃 (1인 운영) | 높음 | 높음 | 자동화 우선, SLA 타이머, 수작업 제거 |
| 야간/주말 모니터링 공백 | 중간 | 중간 | 자동 알림 + 자동 만료 |
| 견적 불일치 분쟁 | 중간 | 중간 | 산식 엔진 + 스냅샷 |
| 환불 요청 증가 | 낮음 | 중간 | 명확한 약관 + 동의 증거 |

### 18.4 핵심 리스크 Contingency Plan

#### RISK-CP1: 관리자 1인 병목 (확률 높음 / 영향 높음)

**현재 상황**: 접수 검토, 견적, 결제 확인, 분쟁 대응 모두 관리자 1인 수작업

**단계별 대응:**

| 단계 | 트리거 | 대응 |
|------|--------|------|
| 예방 (Phase 1) | 일 접수 > 5건 | P0-10 견적 자동화 + P1-4 SLA 타이머로 수작업 70% 감소 |
| 경고 (Phase 2) | 일 접수 > 15건 | 자동 만료(P1-1) + 알림 이중화(P1-2)로 야간 무인 운영 |
| 전환 (Phase 3) | 일 접수 > 30건 | 셀프서비스 전환으로 관리자 개입 최소화 (접수/결제 자동) |
| 확장 (Phase 4+) | 일 접수 > 100건 | 운영 인력 추가 채용 또는 파트타임 CS |

**최악의 경우**: 관리자 장기 부재 시 → 자동 만료 + 신규 접수 일시 중단 안내 자동화

#### RISK-CP2: 플랫폼 봇 차단 (확률 중간 / 영향 높음)

**단계별 대응:**

| 단계 | 트리거 | 대응 |
|------|--------|------|
| 감지 | 체크 에러율 > 30% | 관리자 Slack/카카오 자동 알림 |
| 1차 대응 | 특정 플랫폼 실패 | 동적 셀렉터 긴급 업데이트 (코드 배포 불필요) |
| 2차 대응 | 셀렉터 업데이트 무효 | 체크 간격 확대 (30분→2시간), User-Agent 로테이션 |
| 3차 대응 | 지속적 차단 | 해당 플랫폼 일시 중단 + 고객 안내 + 대안 조사 |

#### RISK-CP3: DB/인프라 장애 (확률 중간 / 영향 높음)

| 단계 | 트리거 | 대응 |
|------|--------|------|
| 예방 | — | 일 1회 자동 백업 (→ INFRA-1), Redis AOF 영속성 (→ INFRA-2) |
| 감지 | 헬스체크 실패 | 하트비트 시스템으로 1분 내 감지 |
| 복구 | 서버 장애 | Docker 자동 재시작 (`unless-stopped`), 최대 복구 목표 < 30분 |
| 최악 | DB 손실 | 백업에서 복구 (최대 24시간 데이터 손실 허용) → 장기적으로 WAL 아카이빙 |

### 18.5 법적/컴플라이언스 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 플랫폼 ToS 위반 해석 가능성 | 중간 | 높음 | 플랫폼별 ToS 검토 체크리스트 운영, 고빈도 접근 금지 기본값 적용 |
| 개인정보 포함 스크린샷 보관 | 중간 | 높음 | SEC-8 암호화 + 마스킹 + 보존기간 단축(기본 6개월) |
| 국가별 데이터 규제(GDPR 등) 미준수 | 낮음 | 높음 | 동의 문구 표준화, 삭제 요청 절차(DSR) 정의, 접근 로그 보존 |
| 법령/정책 변경 대응 지연 | 중간 | 중간 | 분기별 법률 점검, 외부 자문 슬롯 사전 확보 |

**LandingEvent PII 보존/DSR 매핑 (2026-02-15 기준)**

- 대상 컬럼: `LandingEvent.ipAddress`, `LandingEvent.userAgent`
- 기본 보존 정책: `occurredAt` 기준 30일 경과 시 PII 필드 익명화(`NULL`)
- 자동화 경로: 워커 repeatable job `landing-event-pii-retention`(UTC cron `17 0 * * *`)가 일 1회 실행
- DSR 대응: 요청 접수 시 즉시 `sessionId`/시간대 기준 대상 이벤트를 삭제 또는 PII 익명화하고, 30일 경과 데이터는 정기잡으로 재검증

---

## 19. KPI 및 성공 지표

### 19.1 Objective 1 — 운영 자동화로 매출 전환율 개선

| Key Result | Baseline (현재) | 3개월 Target | 6개월 Target | 측정 방법 |
|------------|-----------------|-------------|-------------|-----------|
| KR1. 월 접수 건 수 확대 | 7건 (최근 30일 실측) | 50건 | 200건 | `count(FormSubmission)` (`createdAt` 기준) |
| KR2. 접수→결제 전환율 개선 | 28.6% (`2/7`) | 35% | 50% | Cohort 기준: 기간 내 접수된 `FormSubmission` 중 `Case.paymentConfirmedAt IS NOT NULL` 비율 |
| KR3. 월 매출 성장 | 매출 SoT 미확정 (현 단계 `BillingEvent.amountKrw=0`) | ₩500,000* | ₩2,000,000* | *Phase 2 `Payment` 모델(`paidAt`, `amount`) 도입 후 확정 |
| KR4. 평균 응답 시간 단축 | ~2시간 (추정) | <30분 | <15분 | RECEIVED→REVIEWING 평균 시간차 |
| KR5. 결제확인→조건충족 비율 (보조지표) | 50.0% (`1/2`) | 55% | 65% | `count(BillingEvent)` / `count(Case where paymentConfirmedAt is not null)` |

> **KR2 측정 원칙(고정)**: 분모는 기간 내 접수 cohort(`FormSubmission.createdAt`), 분자는 해당 cohort에서 결제확인(`paymentConfirmedAt`)된 건으로 계산한다.
> **매출 SoT 주석**: 현 단계 `BillingEvent`는 조건충족 이벤트 기록용이며, 매출 지표는 Phase 2 `Payment` 모델에서 확정한다.

### 19.2 Objective 2 — 신뢰 가능한 제품 품질/운영 안정성 확보

| Key Result | Baseline (현재) | 3개월 Target | 6개월 Target | 측정 방법 |
|------------|-----------------|-------------|-------------|-----------|
| KR1. Vitest 커버리지 확보 | ~40% (추정) | 70%+ | 80%+ | `vitest --coverage` |
| KR2. 워커 체크 성공률 향상 | ~90% | 95% | 98% | successCount/totalCount |
| KR3. 알림 도달률 향상 | ~80% | 95% | 99% | SENT/(SENT+FAILED) |
| KR4. MTTR 단축 | 미측정 | <1시간 | <30분 | 장애 감지→복구 시간 |
| KR5. 분쟁 발생률 통제 | 운영 분쟁 1건(해석 단계), 과금 후 분쟁 0건 | <5% | <3% | 분쟁=`CaseMessage.templateKey LIKE 'dispute_%'`; 과금 후 분쟁율=`(paymentConfirmedAt IS NOT NULL AND dispute)`/`전체 BILLED` |

> **분쟁 데이터 해석 주석**: 현재 확인된 1건은 `dispute_termination`이며 과금 후 분쟁이 아니라 해석 단계(`CANCELLED`, `paymentConfirmedAt=null`) 종료 건이다.

### 19.3 Objective 3 — 성장 채널과 재방문 기반 구축

| Key Result | Baseline (현재) | 3개월 Target | 6개월 Target | 측정 방법 |
|------------|-----------------|-------------|-------------|-----------|
| KR1. 월 유기적 트래픽 확보 | 미측정 | 1,000 | 5,000 | GA4 organic sessions |
| KR2. 랜딩→가입 전환율 확보 | 미측정 | 5% | 10% | signup 완료/랜딩 방문 |
| KR3. 검색 노출 키워드 확대 | 미측정 | 50 | 200 | Search Console |
| KR4. 고객 재이용률 확보 | 미측정 | 20% | 30% | 재접수 고객/전체 고객 |

> **측정 우선 과제**: P0-9 퍼널 대시보드와 GA4 이벤트가 먼저 배포되어야 Baseline 추정값을 실측값으로 치환할 수 있다.

---

## 20. 하지 않을 것

> 리소스 집중을 위해 의도적으로 하지 않는 것들

### 20.1 제품 범위 제한

- ❌ **예약 대행/완료 보장**: 핵심 가치는 "알림"이지 "대행"이 아님
- ❌ **항공권/교통편 모니터링**: 숙소 특화에 집중
- ❌ **리뷰/평점 수집**: 가용성과 가격에만 집중
- ❌ **소셜 기능 (초기)**: MVP 이후 검토

### 20.2 기술 범위 제한

- ❌ **마이크로서비스 전환 (초기)**: 모노레포로 충분, 필요 시 점진적 분리
- ❌ **Kubernetes (초기)**: Docker Compose + 단일 서버로 충분
- ❌ **GraphQL**: REST API로 충분, 복잡도 증가 불필요
- ❌ **SSR 전면 전환**: 현재 RSC + CSR 혼합으로 적절
- ❌ **네이티브 모바일 앱 (초기)**: PWA 또는 반응형 웹으로 대응

### 20.3 운영 범위 제한

- ❌ **24시간 고객 지원 (초기)**: 자동화 + 비동기 대응
- ❌ **복잡한 AI 자동 판단 (초기)**: Q4 원문 규칙 기반 우선
- ❌ **웹사이트 전환 태그/고급 마케팅 자동화 (초기)**: GA4 기본 연동으로 시작
- ❌ **고객 셀프 결제 플로우 대형 구축 (초기)**: 단계적 접근

---

## 부록 A: 전체 TODO 체크리스트 (우선순위별)

### P0 — 즉시 (0~2주)

- [ ] P0-9: 운영 퍼널 대시보드
- [ ] P0-10: 숫자형 가격 산식 엔진
- [ ] 도메인 에러 타입 도입 (AppError 계층)
- [ ] 처리량 차트 시간 버킷 조정
- [ ] next.config.ts puppeteer 참조 제거

### P1 — 단기 (2~6주)

- [ ] P1-1: 요청 기간 자동 만료
- [ ] P1-2: 알림 채널 이중화 (카톡 → 이메일)
- [ ] P1-4: 운영 SLA 타이머
- [ ] 환경변수 Zod 검증 스키마
- [ ] 구조화된 로깅 (pino)
- [ ] App 페이지 i18n (Dashboard/Settings)
- [ ] Worker 프로세서 테스트 (cycleProcessor, checkProcessor)
- [ ] CORS 명시적 설정
- [ ] 보안 헤더 강화 (CSP, X-Frame-Options 등)

### P2 — 중기 (1~3개월)

- [ ] 고객 셀프서비스 접수 양식
- [ ] 온라인 결제 연동 (PG)
- [ ] 고객용 상태 페이지
- [ ] API 문서화 (OpenAPI/Swagger)
- [ ] 통합 테스트 환경 구축
- [ ] 정적 데이터 캐싱
- [ ] Evidence Packet 봉인 (P1-5)
- [ ] 사용자 preferredLocale 저장
- [ ] Q4 자동 검증 규칙 엔진 강화 (P1-6)
- [ ] Admin 페이지 i18n
- [ ] Rate Limiting Redis 전환
- [ ] 의존성 감사 자동화

### P3 — 장기 (3~6개월)

- [ ] Booking.com 플랫폼 지원
- [ ] 국내 플랫폼 (야놀자/여기어때)
- [ ] 알림 채널 확장 (텔레그램/라인/SMS)
- [ ] E2E 테스트 도입 (Playwright)
- [ ] 분쟁 리스크 스코어링 (P2-2)
- [ ] 가용성 분석 대시보드
- [ ] Grafana + Loki 로그 수집
- [ ] DB 백업 자동화

### P4 — 비전 (6개월+)

- [ ] 구독 기반 SaaS 모델 전환
- [ ] B2B API / 화이트라벨
- [ ] AI/ML 가격 예측
- [ ] 모바일 앱 (React Native)
- [ ] 글로벌 확장 (일본 → 동남아 → 유럽)
- [ ] OpenTelemetry 분산 추적

---

## 부록 B: 관련 문서 인덱스

| 문서 | 위치 | 설명 |
|------|------|------|
| 프로젝트 규칙 | `rules.md` | 모노레포 강제 규칙 (최우선) |
| 규칙 요약 | `RULES_SUMMARY.md` | 규칙 빠른 참조 |
| 아키텍처 | `docs/architecture/architecture.md` | 현재 구조/경계 |
| 모노레포 계획 | `docs/architecture/monorepo-plan.md` | 마이그레이션 상태 |
| 로컬 개발 | `docs/guides/local-development.md` | 개발 환경 설정 |
| 배포 가이드 | `docs/guides/deployment.md` | CI/CD/OCI 배포 |
| Worker 런타임 | `docs/guides/worker-bullmq-runtime-flow.md` | BullMQ 실행 흐름 |
| 운영 정책 | `docs/guides/google-form-service-operations.md` | Google Form 운영 SOP |
| RBAC 테스트 | `docs/guides/rbac-local-testing.md` | 역할 테스트 가이드 |
| 변경 이력 | `docs/history/changelog.md` | v2.0.0 ~ v2.26.0 |
| 운영 MVP 백로그 | `docs/backlog/google-form-ops-mvp-backlog.md` | P0-1 ~ P0-10 |
| 코드 개선 계획 | `docs/backlog/improvement-plan.md` | 기술 부채/테스트 |
| i18n 아키텍처 | `docs/backlog/i18n-architecture-plan.md` | 다국어 상세 설계 |
| 처리량 분석 | `docs/backlog/throughput-and-analysis.md` | 대시보드/분석 백로그 |
| **종합 백로그** | **`docs/backlog/master-backlog-and-roadmap.md`** | **본 문서** |

---

## 부록 C: 용어 사전

| 용어 | 설명 |
|------|------|
| 빈방 (binbang) | 서비스 브랜드명. 숙소 빈방 모니터링 서비스 |
| Case | 고객 요청 건. FormSubmission에서 생성, 상태 머신으로 관리 |
| Condition Met | 조건 충족. 모니터링 중인 숙소가 사용자 정의 조건을 만족한 상태 |
| Evidence Packet | 증거 패킷. 조건 충족 시점의 스크린샷 + 메타데이터 + 타임스탬프 |
| CheckCycle | 체크 사이클. 한 번의 전체 숙소 확인 배치 실행 |
| CheckLog | 개별 숙소 체크 결과 기록 |
| PlatformSelector | 숙박 플랫폼 UI에서 데이터를 추출하기 위한 CSS 셀렉터 |
| PlatformPattern | 가용/불가용 상태를 판단하기 위한 텍스트 패턴 |
| SystemSettings | DB에 저장되는 동적 시스템 설정 (cron, 동시성, 타임아웃 등) |
| FormSubmission | Google Form 또는 웹 양식으로 접수된 원본 데이터 |
| BillingEvent | 과금 이벤트. 조건 충족 시 생성 |
| SLA | Service Level Agreement. 운영 응답 시간 기준 |

---

## 21. UI/UX 아키텍처 상세

### 21.1 페이지 라우트 전체 맵

#### 공개 페이지 (Public Routes — `/[lang]/`)

| 라우트 | 파일 | 설명 | i18n |
|--------|------|------|------|
| `/[lang]` | `(public)/[lang]/page.tsx` | 랜딩 페이지 | ✅ 5개국어 |
| `/[lang]/about` | `(public)/[lang]/about/page.tsx` | 소개 페이지 | ✅ |
| `/[lang]/faq` | `(public)/[lang]/faq/page.tsx` | FAQ 페이지 | ✅ |
| `/[lang]/pricing` | `(public)/[lang]/pricing/page.tsx` | 요금제 페이지 | ✅ |
| `/[lang]/privacy` | `(public)/[lang]/privacy/page.tsx` | 개인정보처리방침 | ✅ |
| `/[lang]/terms` | `(public)/[lang]/terms/page.tsx` | 이용약관 | ✅ |
| `/[lang]/login` | `(public)/[lang]/login/page.tsx` | 로그인 | ✅ |
| `/[lang]/signup` | `(public)/[lang]/signup/page.tsx` | 회원가입 | ✅ |

#### 인증 페이지 (App Routes — `/(app)/`)

| 라우트 | 파일 | 설명 | i18n |
|--------|------|------|------|
| `/dashboard` | `(app)/dashboard/page.tsx` | 대시보드 홈 | ⏳ 일부 |
| `/accommodations/new` | `(app)/accommodations/new/page.tsx` | 숙소 등록 | ⏳ 일부 |
| `/accommodations/[id]` | `(app)/accommodations/[id]/page.tsx` | 숙소 상세 | ⏳ 일부 |
| `/accommodations/[id]/edit` | `(app)/accommodations/[id]/edit/page.tsx` | 숙소 수정 | ⏳ 일부 |
| `/settings/subscription` | `(app)/settings/subscription/page.tsx` | 구독/플랜 관리 | ⏳ 일부 |

#### 관리자 페이지 (Admin Routes — `/admin/`)

| 라우트 | 파일 | 설명 | i18n |
|--------|------|------|------|
| `/admin/monitoring` | `admin/monitoring/page.tsx` | 모니터링 대시보드 | ⬜ 없음 |
| `/admin/heartbeat` | `admin/heartbeat/page.tsx` | 워커 하트비트 | ⬜ 없음 |
| `/admin/throughput` | `admin/throughput/page.tsx` | 처리량 분석 | ⬜ 없음 |
| `/admin/cases` | `admin/cases/page.tsx` | 케이스 관리 | ⬜ 없음 |
| `/admin/cases/[id]` | `admin/cases/[id]/page.tsx` | 케이스 상세 | ⬜ 없음 |
| `/admin/users` | `admin/users/page.tsx` | 사용자 관리 | ⬜ 없음 |
| `/admin/users/[id]` | `admin/users/[id]/page.tsx` | 사용자 상세 | ⬜ 없음 |
| `/admin/plans` | `admin/plans/page.tsx` | 플랜 관리 | ⬜ 없음 |
| `/admin/settings` | `admin/settings/page.tsx` | 시스템 설정 | ⬜ 없음 |
| `/admin/selectors` | `admin/selectors/page.tsx` | 셀렉터 관리 | ⬜ 없음 |
| `/admin/submissions` | `admin/submissions/page.tsx` | 폼 접수 조회 | ⬜ 없음 |
| `/admin/intake-mappings` | `admin/intake-mappings/page.tsx` | 질문 매핑 관리 | ⬜ 없음 |
| `/admin/audit-logs` | `admin/audit-logs/page.tsx` | 감사 로그 | ⬜ 없음 |

### 21.2 컴포넌트 아키텍처

#### 컴포넌트 계층 구조

```
페이지 (page.tsx)
  └── 오케스트레이터 (dashboardContent.tsx, caseDetailView.tsx)
        └── 기능 컴포넌트 (kpi-strip.tsx, action-center.tsx)
              └── UI 프리미티브 (Button, Card, Badge — shadcn/ui)
```

#### shadcn/ui 설치 컴포넌트 (20개)

| 카테고리 | 컴포넌트 | 파일 |
|----------|----------|------|
| **폼** | Input, Textarea, Label, Checkbox, RadioGroup, Select | `components/ui/` |
| **레이아웃** | Card, Separator, ScrollArea | `components/ui/` |
| **인터랙션** | Button, Dialog, Sheet, Tabs, Tooltip | `components/ui/` |
| **디스플레이** | Badge, Alert, Skeleton, Progress, Table | `components/ui/` |
| **시각화** | Chart (Recharts) | `components/ui/` |

#### 대시보드 컴포넌트 상세 (15개)

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `dashboardContent` | `dashboard/dashboardContent.tsx` | 메인 오케스트레이터. 데이터 페칭, 메트릭 계산, 액션 생성 |
| `kpi-strip` | `dashboard/_components/kpi-strip.tsx` | KPI 카드 4개: 전체, 활성, 문제, 쿼터. 반응형 그리드 |
| `action-center` | `dashboard/_components/action-center.tsx` | 컨텍스트 기반 액션 카드 그리드 |
| `action-card` | `dashboard/_components/action-card.tsx` | 개별 액션 카드: 아이콘, 제목, 설명, CTA |
| `accommodation-board` | `dashboard/_components/accommodation-board.tsx` | 탭 기반 숙소 목록 (문제/전체/일시정지) |
| `accommodation-row` | `dashboard/_components/accommodation-row.tsx` | 단일 숙소 행: 상태 점, 플랫폼 배지, 날짜 |
| `recent-events` | `dashboard/_components/recent-events.tsx` | 페이지네이션 이벤트 로그 |
| `event-row` | `dashboard/_components/event-row.tsx` | 단일 이벤트 행 |
| `status-badge` | `dashboard/_components/status-badge.tsx` | 상태 인디케이터 배지 (색상 코딩) |
| `section-skeleton` | `dashboard/_components/section-skeleton.tsx` | 로딩 스켈레톤 변형 (KPI, 액션, 보드, 이벤트) |
| `empty-illustrations` | `dashboard/_components/empty-illustrations.tsx` | SVG 일러스트: LighthouseHero, LighthouseCalm, LighthouseQuiet |
| `section-error` | `dashboard/_components/section-error.tsx` | 에러 상태: 메시지 + 재시도 버튼 |
| `first-user-tutorial-dialog` | `dashboard/_components/first-user-tutorial-dialog.tsx` | 온보딩 4단계 다이얼로그 |
| `logout-button` | `dashboard/_components/logout-button.tsx` | 로그아웃 버튼 |
| `priceTrendSection` | `accommodations/[id]/_components/priceTrendSection.tsx` | 가격 추이 분석 섹션 |

#### 관리자 컴포넌트 상세

**케이스 관리 (8개)**:

| 컴포넌트 | 역할 |
|----------|------|
| `caseManagement` | 케이스 목록/필터/검색 |
| `caseDetailView` | 케이스 상세 오케스트레이터 |
| `clarificationPanel` | 고객 문의/답변 패널 |
| `conditionEvidencePanel` | 조건 충족 증거 패널 |
| `consentEvidencePanel` | 동의 증거 패널 |
| `messageTemplatesPanel` | 6종 운영 메시지 템플릿 |
| `paymentConfirmButton` | 결제 확인 버튼 (하드게이트) |
| `statusTransitionDialog` | 상태 전이 다이얼로그 (가드 규칙) |

**사용자 관리 (6개)**:

| 컴포넌트 | 역할 |
|----------|------|
| `userManagement` | 사용자 검색/필터 인터페이스 |
| `usersTable` | 사용자 목록 테이블 |
| `planChangeDialog` | 플랜 변경 다이얼로그 |
| `roleChangeDialog` | 역할 변경 다이얼로그 |
| `userDetailView` | 사용자 프로필 상세 |
| `userActivityTimeline` | 사용자 활동 타임라인 |

**셀렉터 관리 (6개)**:

| 컴포넌트 | 역할 |
|----------|------|
| `selectorManager` | 셀렉터 관리 메인 |
| `selectorList` | 셀렉터 목록 |
| `selectorForm` | 생성/수정 폼 |
| `selectorHistory` | 버전 이력 |
| `selectorTestPanel` | 실시간 테스트 패널 |
| `patternForm` | 패턴 생성/수정 |

### 21.3 디자인 시스템 현황

#### 색상 체계 (CSS Custom Properties)

**라이트 모드:**

| 변수 | 값 | 용도 |
|------|-----|------|
| `--color-background` | `#f8fbff` | 페이지 배경 |
| `--color-foreground` | `#1a2a40` | 기본 텍스트 |
| `--color-primary` | `#f4b400` | 브랜드 앰버 (등대 불빛) |
| `--color-secondary` | `#eef3f9` | 보조 배경 |
| `--color-destructive` | `#e86a5d` | 에러/삭제 |
| `--color-border` | `#d6e0ec` | 테두리 |

**다크 모드:**

| 변수 | 값 | 용도 |
|------|-----|------|
| `--color-background` | `#071326` | Deep Navy 배경 |
| `--color-foreground` | `#eaf1f8` | Mist 텍스트 |
| `--color-primary` | `#f4b400` | 동일 앰버 (일관성) |
| `--color-secondary` | `#0d1b2f` | 어두운 보조 |
| `--color-border` | `#25364f` | 어두운 테두리 |

**브랜드 고유 색상:**
- `--brand-navy`: `#071326` — 깊은 밤바다 네이비
- `--brand-amber`: `#f4b400` — 등대 불빛 앰버

#### 애니메이션 시스템

**글로벌 애니메이션 (globals.css):**

| 이름 | 지속시간 | 이징 | 용도 |
|------|----------|------|------|
| `dashboard-card-enter` | 200ms | ease-out | 대시보드 카드 입장 |
| `landing-hero-fadein` | 220ms | cubic-bezier(0.22,1,0.36,1) | 히어로 섹션 페이드인 |
| `landing-log-slideup` | — | — | 로그 슬라이드업 (블러 효과) |

**스태거 딜레이 패턴:**
```css
[animation-delay:60ms]   /* 카드 1 */
[animation-delay:120ms]  /* 카드 2 */
[animation-delay:180ms]  /* 카드 3 */
```

**인터랙션 애니메이션:**
- 호버 리프트: `-translate-y-1px`
- 피처 카드: `hover:-translate-y-0.5 group-hover:scale-[1.08]`
- 트랜지션: 120ms ~ 200ms, `ease-out`
- 로딩: `animate-pulse` (스켈레톤), `animate-spin` (스피너), `animate-ping` (상태 점)

**모션 감소 지원:**
```css
@media (prefers-reduced-motion: reduce) {
  /* 모든 애니메이션 비활성화 */
}
```

#### 반응형 디자인 패턴

**그리드 시스템:**

| 컴포넌트 | 모바일 | 태블릿 | 데스크톱 |
|----------|--------|--------|----------|
| KPI 스트립 | `grid-cols-1` | `grid-cols-2` | `grid-cols-4` |
| 액션 카드 | `grid-cols-1` | `grid-cols-2` | `grid-cols-3` |
| 피처 섹션 | `grid-cols-1` | `grid-cols-3` | `grid-cols-3` |
| 숙소 상세 | `grid-cols-1` | `grid-cols-2` | `grid-cols-2` |

**브레이크포인트 활용:**
- `md:` (768px): 태블릿 이상 — 데스크톱 네비게이션 표시, 모바일 메뉴 숨김
- `lg:` (1024px): 데스크톱 — 4열 그리드, 풀 레이아웃
- `xl:`, `2xl:`: 대형 화면 — 최대 너비 제한 (`max-w-7xl`)

**터치 타겟:**
- 최소 버튼 높이: `min-h-[44px]` (WCAG 2.5.5 충족)
- 모바일 네비: `sr-only md:not-sr-only` (아이콘 전용 → 텍스트 표시)

### 21.4 UI/UX 개선 TODO

#### UX-1: 폼 패턴 일관성 강화

| 항목 | 현재 상태 | 개선 방향 |
|------|-----------|-----------|
| 로그인 폼 | 자체 구현 | react-hook-form + Zod 클라이언트 검증 통합 |
| 회원가입 폼 | 자체 구현 | 동일 패턴 적용, 실시간 비밀번호 강도 표시 |
| 숙소 등록 폼 | 자체 구현 + URL 자동 파싱 | URL 파싱 결과 시각적 피드백 강화 |
| 관리자 폼 | Dialog 기반 | 일관된 Dialog 내 폼 패턴 |

**구현 방향:**
- `react-hook-form` + `zod` resolver 도입 (Phase 2)
- 공통 FormField 컴포넌트: Label + Input + Error 래퍼
- 제출 중 상태: 버튼 비활성 + 스피너 일관화
- 성공 피드백: toast 알림 통합

#### UX-2: 로딩 상태 체계화

| 현재 | 개선 |
|------|------|
| 각 컴포넌트별 개별 스켈레톤 | 공통 스켈레톤 변형 시스템 |
| `animate-pulse` 일괄 적용 | Shimmer 효과 도입 (방향성 있는 로딩 힌트) |
| 에러 후 수동 재시도 | 자동 재시도 + 에러 경계 일관화 |

#### UX-3: 빈 상태(Empty State) 개선

| 페이지 | 현재 | 개선 |
|--------|------|------|
| 대시보드 | SVG 등대 일러스트 | ✅ 양호 |
| 숙소 목록 | 단순 텍스트 | 일러스트 + CTA 추가 |
| 관리자 케이스 | 텍스트 | 상태별 안내 메시지 |
| 이벤트 로그 | "최근 이벤트 없음" | 일러스트 + 모니터링 시작 안내 |

#### UX-4: 마이크로인터랙션 추가

- 숙소 상태 변경 시 상태 배지 전환 애니메이션
- 가격 차트 데이터 포인트 호버 시 상세 툴팁
- 케이스 상태 전이 시 타임라인 자동 스크롤
- 알림 도착 시 헤더 벨 아이콘 애니메이션 (향후)

#### UX-5: 다크모드 세부 최적화

- 차트 색상 팔레트 다크모드 최적화 (가독성 향상)
- 스크린샷 증거 이미지의 다크모드 컨텍스트 배경
- 셀렉터 테스트 패널의 코드 하이라이팅 다크모드
- 로그 타임라인 색상 대비 강화

---

## 22. API 엔드포인트 상세 명세

### 22.1 API 설계 패턴 분석

#### 현재 패턴

```typescript
// 패턴 1: 인증 + try/catch + console.error (대부분의 라우트)
export async function GET(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await someService(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 패턴 2: Admin 인증 (requireAdmin 헬퍼)
export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}

// 패턴 3: 에러 메시지 기반 상태 코드 분기 (patterns 라우트)
catch (error) {
  if (error instanceof Error) {
    if (error.message === 'Pattern not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
  }
  throw error; // 500으로 전파
}
```

#### 패턴 문제점 분석

| 문제 | 영향 | 빈도 | 해결 |
|------|------|------|------|
| 에러 메시지 문자열 비교 | 리팩토링 시 깨짐, 타입 안전성 없음 | 12+ 라우트 | AppError 계층 (Phase 1) |
| console.error 로깅 | 요청 ID/컨텍스트 부족, 프로덕션 디버깅 어려움 | 전체 | 구조화 로거 (Phase 2) |
| try/catch 보일러플레이트 | 코드 중복, 불일치 | 51개 라우트 | 공통 에러 핸들러 래퍼 |
| 응답 형식 불일치 | `{ error: string }` vs `{ error: { code, message } }` | 혼재 | 표준 응답 엔벨로프 |
| Zod 검증 위치 불일치 | 일부 라우트에서만 Zod 사용 | 30% | 전체 입력 Zod 검증 |
| 한국어 에러 메시지 혼재 | API 응답에 한국어 에러 ('사용자를 찾을 수 없습니다') | 3+ 라우트 | i18n 또는 영어 코드 통일 |

### 22.2 전체 API 엔드포인트 목록

#### 인증 (Authentication) — 4개

| 메서드 | 경로 | 설명 | Zod 검증 | Rate Limit |
|--------|------|------|----------|------------|
| POST | `/api/auth/signup` | 이메일 회원가입 | ✅ | ✅ 5/분 |
| POST | `/api/auth/credentials-login` | 이메일 로그인 | ✅ | ✅ 10/분 |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth 핸들러 | (내장) | ✅ 30/분 |
| POST | `/api/auth/kakao-token` | 카카오 토큰 저장 | ✅ | — |

#### 숙소 (Accommodations) — 6개

| 메서드 | 경로 | 설명 | Zod 검증 |
|--------|------|------|----------|
| GET | `/api/accommodations` | 내 숙소 목록 | — |
| POST | `/api/accommodations` | 숙소 등록 (쿼터 확인) | ✅ |
| GET | `/api/accommodations/[id]` | 숙소 상세 (소유자만) | — |
| PATCH | `/api/accommodations/[id]` | 숙소 수정 | ✅ |
| DELETE | `/api/accommodations/[id]` | 숙소 삭제 | — |
| GET | `/api/accommodations/[id]/logs` | 체크 로그 목록 | — |
| GET | `/api/accommodations/[id]/prices` | 가격 이력 | — |

#### 사용자 (User) — 3개

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/user/quota` | 쿼터 사용량 조회 |
| GET | `/api/user/subscription` | 구독/플랜 정보 |
| PATCH | `/api/user/tutorial` | 튜토리얼 상태 업데이트 |

#### 관리자 — 케이스 (Admin Cases) — 7개

| 메서드 | 경로 | 설명 | Zod |
|--------|------|------|-----|
| GET | `/api/admin/cases` | 케이스 목록 (필터/검색) | — |
| GET | `/api/admin/cases/[id]` | 케이스 상세 | — |
| PATCH | `/api/admin/cases/[id]/status` | 상태 전이 (가드 규칙) | ✅ |
| PATCH | `/api/admin/cases/[id]/payment` | 결제 확인 (하드게이트) | — |
| PATCH | `/api/admin/cases/[id]/accommodation` | 숙소 연결/해제 | ✅ |
| GET | `/api/admin/cases/[id]/messages` | 운영 메시지 목록 | — |
| POST | `/api/admin/cases/[id]/messages` | 메시지 발송 (6종 템플릿) | ✅ |
| POST | `/api/admin/cases/[id]/notifications` | 알림 발송 | ✅ |

#### 관리자 — 사용자 (Admin Users) — 5개

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/users` | 사용자 목록 (검색) |
| GET | `/api/admin/users/[id]` | 사용자 상세 |
| PATCH | `/api/admin/users/[id]/roles` | 역할 변경 |
| PATCH | `/api/admin/users/[id]/plan` | 플랜 변경 |
| GET | `/api/admin/users/[id]/activity` | 활동 이력 |

#### 관리자 — 플랜/설정 (Admin Plans/Settings) — 7개

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/plans` | 플랜 목록 |
| POST | `/api/admin/plans` | 플랜 생성 |
| PATCH | `/api/admin/plans/[id]` | 플랜 수정 |
| DELETE | `/api/admin/plans/[id]` | 플랜 삭제 (구독자 가드) |
| GET | `/api/admin/settings` | 시스템 설정 목록 |
| PATCH | `/api/admin/settings` | 설정 변경 |
| GET | `/api/admin/settings/history` | 설정 변경 이력 |

#### 관리자 — 셀렉터/패턴 (Admin Selectors) — 11개

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/selectors` | 셀렉터 목록 |
| POST | `/api/admin/selectors` | 셀렉터 생성 |
| PATCH | `/api/admin/selectors/[id]` | 셀렉터 수정 |
| DELETE | `/api/admin/selectors/[id]` | 셀렉터 삭제 |
| GET | `/api/admin/selectors/[id]/history` | 변경 이력 |
| POST | `/api/admin/selectors/test` | 셀렉터 테스트 |
| POST | `/api/admin/selectors/cache/invalidate` | 캐시 무효화 |
| GET | `/api/admin/patterns` | 패턴 목록 |
| POST | `/api/admin/patterns` | 패턴 생성 |
| PATCH | `/api/admin/patterns/[id]` | 패턴 수정 |
| DELETE | `/api/admin/patterns/[id]` | 패턴 삭제 |

#### 관리자 — 접수/모니터링 (Admin Intake/Monitoring) — 10개

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/submissions` | 폼 접수 목록 |
| GET | `/api/admin/intake-mappings` | 질문 매핑 목록 |
| POST | `/api/admin/intake-mappings` | 매핑 생성/수정 |
| GET | `/api/admin/monitoring/summary` | 모니터링 요약 |
| GET | `/api/admin/monitoring/logs` | 모니터링 로그 |
| GET | `/api/admin/throughput/summary` | 처리량 요약 |
| GET | `/api/admin/throughput/history` | 처리량 이력 |
| GET | `/api/admin/throughput/compare` | 처리량 비교 |
| GET | `/api/admin/audit-logs` | 감사 로그 |

#### 시스템 (Health/Webhook) — 6개

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스체크 |
| GET | `/api/health/heartbeat` | 하트비트 상태 |
| GET | `/api/health/heartbeat/history` | 하트비트 이력 |
| POST | `/api/webhooks/google-form` | Google Form 웹훅 (서명 검증) |
| GET | `/api/plans` | 공개 플랜 목록 |
| GET | `/api/logs` | 최근 로그 |
| POST | `/api/worker/restart` | 워커 재시작 (Admin) |

### 22.3 API 개선 로드맵

#### API-1: 공통 에러 핸들러 도입

```typescript
// 목표: 모든 라우트에서 일관된 에러 처리
function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }
      logger.error({ error, url: request.url }, 'Unhandled API error');
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  };
}
```

**적용 범위**: 51개 라우트 전체
**예상 공수**: 3~4일

#### API-2: 표준 응답 엔벨로프

```typescript
// 성공 응답
{ data: T, meta?: { page, limit, total } }

// 에러 응답
{ error: { code: string, message: string, details?: unknown } }
```

**마이그레이션 전략**: 새 라우트부터 적용, 기존 라우트 점진적 전환

#### API-3: Rate Limiting Redis 전환

| 현재 | 목표 |
|------|------|
| 인메모리 Map (프로세스 단위) | Redis 기반 (다중 인스턴스 공유) |
| `MAX_ENTRIES: 10000` 제한 | Redis TTL 기반 자동 정리 |
| `CLEANUP_AGE_MS: 300000` (5분) 수동 정리 | 슬라이딩 윈도우 그대로 |

#### API-4: 입력 검증 일관화

| 현재 | 라우트 수 | 개선 |
|------|-----------|------|
| Zod 검증 있음 | ~20개 (40%) | — |
| Zod 검증 없음 | ~31개 (60%) | 전체 Zod 스키마 추가 |
| `as` 타입 캐스팅 사용 | ~5개 | Zod `.parse()` 전환 |

---

## 23. Worker 아키텍처 상세

### 23.1 Worker 프로세스 구조

```
apps/worker/src/
├── main.ts              # 진입점: Redis 연결, 큐/워커 생성, HTTP 제어 서버
├── config.ts            # WorkerConfig: DB → env → 기본값 로딩
├── checkProcessor.ts    # 개별 숙소 체크 처리기
└── cycleProcessor.ts    # 사이클 오케스트레이터
```

#### 진입점 초기화 흐름 (`main.ts`)

```
1. initConfig()           — DB에서 설정 로딩
2. createBrowserPool()    — Playwright 브라우저 풀 생성
3. Redis 연결 3개 생성     — queue용, cycle-worker용, check-worker용
4. 큐 생성               — CYCLE 큐, CHECK 큐
5. 워커 생성             — cycle-worker(concurrency=1), check-worker(configurable)
6. 스케줄러 설정          — cron 기반 반복 잡
7. HTTP 제어 서버 시작    — Port 3500
8. 하트비트 루프 시작     — 60초 간격
```

#### HTTP 제어 서버 (Port 3500)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/health` | GET | 워커 상태 + 가동시간 |
| `/restart` | POST | 그레이스풀 재시작 |
| `/cache/invalidate` | POST | 셀렉터 캐시 무효화 (platform 필터 옵션) |
| `/test` | POST | 셀렉터 실시간 테스트 |

#### 그레이스풀 셧다운

```
SIGINT/SIGTERM 수신
  → 워커 종료 (진행 중 잡 완료 대기)
  → 큐 연결 종료
  → Redis 연결 종료
  → 브라우저 풀 종료
  → Prisma 연결 종료
  → Exit 0
```

셧다운 타임아웃: `shutdownTimeoutMs` (기본 60초)

### 23.2 BullMQ 잡 시스템

#### 큐 구성

| 큐 이름 | 용도 | 동시성 |
|---------|------|--------|
| `accommodation-check-cycle` | 사이클 트리거 + 알림 재시도 | 1 (고정) |
| `accommodation-check` | 개별 숙소 체크 | 설정값 (기본 1) |

#### 반복 잡 스케줄

| 잡 이름 | 스케줄 | 처리기 |
|---------|--------|--------|
| `cycle-trigger` | `settings.worker.cronSchedule` (기본 `*/30 * * * *`) | cycleProcessor |
| `notification-retry` | `*/2 * * * *` (2분마다) | 알림 재시도 배치 |

#### 사이클 처리 흐름

```
cycle-trigger 잡 수신
  ↓
활성 숙소 조회 (isActive=true, checkIn >= now)
  ↓
활성 케이스 링크 조회 (ACTIVE_MONITORING 상태)
  ↓
CheckCycle 레코드 생성 (메타데이터: 동시성, 풀 사이즈, 타임아웃)
  ↓
체크 잡 플래트닝:
  - 케이스 없는 숙소: 1개 체크 잡
  - 케이스 있는 숙소: 케이스당 1개 체크 잡 (중복 가능)
  ↓
CHECK 큐에 대량 추가
  ↓
하트비트 업데이트
```

#### 개별 체크 처리 흐름

```
check 잡 수신 (CheckJobPayload)
  ↓
런타임 설정 로딩
  ↓
플랫폼별 셀렉터 캐시 조회 (5분 TTL)
  ↓
checkAccommodation() 실행 (브라우저 자동화)
  ↓
상태 결정 (AVAILABLE/UNAVAILABLE/ERROR)
  ↓
CheckLog 저장 (가격, 지속시간, 재시도 횟수)
  ↓
분기:
  ├── 케이스 연결 + AVAILABLE:
  │     ↓ 원자적 트리거 (TX 내)
  │     ├── 증거 패킷 생성 (스크린샷 + 메타데이터)
  │     ├── BillingEvent 생성
  │     ├── CaseNotification 생성 (PENDING)
  │     └── 상태 전이: ACTIVE_MONITORING → CONDITION_MET
  │     ↓
  │     카카오 알림 비동기 발송
  │
  └── 케이스 미연결:
        ↓ 전통적 알림 발송
        (상태 변경 시 사용자에게 카카오 메시지)
  ↓
사이클 카운터 원자적 업데이트 (successCount/errorCount)
```

### 23.3 브라우저 자동화 상세

#### 체커 아키텍처

```
baseChecker.ts (핵심 로직)
  ├── acquireBrowser()     — 풀에서 브라우저 획득 (30초 타임아웃)
  ├── setupPage()          — 뷰포트, 헤더, 리소스 차단
  ├── navigate()           — URL 이동 (DOMContentLoaded 대기)
  ├── scroll()             — 콘텐츠 로딩 트리거
  ├── waitForPatterns()    — 가용성 패턴 대기
  ├── evaluate()           — 페이지 내 JavaScript 실행
  │     ├── 커스텀 추출기 (플랫폼별)
  │     ├── 셀렉터 기반 체크
  │     └── bodyText 패턴 매칭
  ├── captureScreenshot()  — 증거용 스크린샷
  └── releaseBrowser()     — 풀에 반환
```

#### 플랫폼별 체커 비교

| 항목 | Airbnb | Agoda |
|------|--------|-------|
| **스크롤 거리** | 800px | 2000px |
| **가격 셀렉터 우선순위** | 1. `[aria-label*="총액"]` 2. `[data-testid="book-it-default"]` | 1. `[data-testid="price-after-tax"]` 2. `[data-element-name="fpc-room-price"]` |
| **가용 판단** | `"예약하기"` 텍스트 | `[data-element-value="available"]` |
| **불가 판단** | `"날짜 변경"` 텍스트 | `[data-element-value="unavailable"]` |
| **메타데이터 추출** | JSON-LD VacationRental | JSON-LD Hotel |
| **URL 파싱** | `/rooms/[ID]` 경로 | 인라인 스크립트 hotelId |

#### 브라우저 풀 관리

```typescript
BrowserPool {
  poolSize: number          // 최대 브라우저 수
  acquireTimeoutMs: 30_000  // 획득 타임아웃
  browsers: Set<Browser>    // 전체 생성된 브라우저
  idle: Browser[]           // 사용 가능한 브라우저
  waiters: Waiter[]         // 대기 중인 요청
  creating: number          // 생성 중인 수
}
```

**획득 흐름:**
1. idle 큐에서 건강한 브라우저 확인
2. 건강하지 않으면 파괴 후 다음 시도
3. 생성 중 < 풀 사이즈이면 새 브라우저 생성
4. 용량 한도이면 대기 큐에 추가 (30초 타임아웃)

**해제 흐름:**
- 건강한 브라우저: idle 큐 반환 또는 대기 요청에 직접 전달
- 불건강한 브라우저: 파괴

#### Playwright 실행 설정

```javascript
chromium.launch({
  headless: true,
  timeout: protocolTimeoutMs,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ]
})
```

**페이지 설정:**
- 뷰포트: `1920x1080`
- Accept-Language: `ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7`
- 리소스 차단: 기본 `['image', 'media', 'font']` (설정 가능)

#### 재시도 정책

| 항목 | 기본값 | 설정 가능 |
|------|--------|-----------|
| 최대 재시도 | 2회 | ✅ `maxRetries` |
| 재시도 딜레이 | 3,000ms | ✅ `retryDelayMs` |
| 패턴 재시도 | 5,000ms | ✅ `patternRetryMs` |
| 네비게이션 타임아웃 | 25,000ms | ✅ `navigationTimeoutMs` |
| 콘텐츠 대기 | 10,000ms | ✅ `contentWaitMs` |
| 프로토콜 타임아웃 | 설정값 | ✅ `protocolTimeoutMs` |

### 23.4 Worker 개선 TODO

#### WRK-1: 프로세서 비즈니스 로직 이관

| 현재 (apps/worker) | 목표 (packages/worker-shared/runtime) |
|---------------------|---------------------------------------|
| checkProcessor 내 상태 결정 로직 | `runtime/status.ts` |
| cycleProcessor 내 숙소 쿼리 | `runtime/cycle.ts` (이미 일부 이관) |
| 알림 발송 분기 로직 | `runtime/postCheck.ts` |

#### WRK-2: 체커 에러 분류 체계

| 에러 유형 | 현재 처리 | 개선 |
|-----------|-----------|------|
| 네비게이션 타임아웃 | ERROR 기록 | 재시도 + 별도 카운트 |
| 셀렉터 미매칭 | UNKNOWN | 동적 셀렉터 알림 + 자동 갱신 제안 |
| 브라우저 크래시 | ERROR | 풀 건강검사 강화 + 자동 교체 |
| 봇 차단 감지 | ERROR | IP 로테이션 + 속도 감소 |

#### WRK-3: 알림 채널 추상화

```typescript
// 목표: NotificationChannel 인터페이스
interface NotificationChannel {
  send(userId: string, message: string): Promise<boolean>;
  isAvailable(userId: string): Promise<boolean>;
}

// 구현체
class KakaoChannel implements NotificationChannel { ... }
class EmailChannel implements NotificationChannel { ... }  // Phase 2
class TelegramChannel implements NotificationChannel { ... } // Phase 4
```

---

## 24. 인프라/DevOps 상세

### 24.1 Docker 구성 현황

#### 환경별 구성 비교

| 항목 | 로컬 | 개발 | 운영 |
|------|------|------|------|
| **파일** | `docker-compose.local.yml` | `docker-compose.develop.yml` | `docker-compose.production.yml` |
| **DB** | `postgres:15-alpine` (자체) | 외부 관리 | 외부 관리 |
| **Redis** | `redis:7-alpine` (자체) | `redis:7-alpine` (자체) | `redis:7-alpine` (자체) |
| **Web 이미지** | 로컬 빌드 | `kihoonbae/binbang:web-develop` | `kihoonbae/binbang:web-${TAG}@${DIGEST}` |
| **Worker 이미지** | 로컬 빌드 | `kihoonbae/binbang:worker-develop` | `kihoonbae/binbang:worker-${TAG}@${DIGEST}` |
| **Web 포트** | 3000 | 3200:3000 | 4000:3000 |
| **Worker 포트** | 3500 | 3500 | 3500 (내부) |
| **네트워크** | 기본 | `binbang_shared_network` (외부) | `binbang_shared_network` (외부) |
| **Redis 정책** | `noeviction` | `noeviction` | `noeviction` |
| **시드 데이터** | base + dev | base + dev | base only |

#### Dockerfile 분석

**Web (node:24-slim):**
```
deps → builder → runner
- Multi-stage 빌드 (3단계)
- pnpm turbo run build --filter=@workspace/web
- Next.js standalone 출력 (축소된 번들)
- 비root 유저: nextjs (UID 1001)
- Expose: 3000
```

**Worker (playwright:v1.58.2-noble):**
```
deps → builder → runner
- Multi-stage 빌드 (3단계)
- Playwright Chromium 내장 이미지
- tsx 실행 (빌드 출력 없이 소스 직접 실행)
- Expose: 3500
```

#### Docker Bake 설정

```hcl
platforms = ["linux/arm64"]  // OCI ARM 인스턴스 타겟
cache = GitHub Actions (type=gha)
```

### 24.2 CI/CD 파이프라인 상세

#### CI 워크플로우 (`.github/workflows/ci.yml`)

```
트리거: pull_request, workflow_call
동시성: 같은 브랜치에서 진행 중인 빌드 취소

단계:
1. Checkout
2. Setup pnpm 10.28.0
3. Setup Node 24
4. pnpm install --frozen-lockfile
5. pnpm i18n:ci              — i18n 문자열 검증
6. pnpm turbo run lint        — Biome 린트 (전 패키지)
7. pnpm format:check          — Biome 포맷 검증
8. pnpm turbo run test        — Vitest 테스트
9. pnpm turbo run build       — 전체 빌드
```

#### 배포 워크플로우 (`.github/workflows/deploy.yml`)

```
트리거: push to main, develop

Jobs:
1. validate    — CI 워크플로우 호출 (재사용)
2. docker      — Docker 이미지 빌드/푸시
   - Runner: ubuntu-24.04-arm
   - docker/bake-action@v6
   - Docker Hub: kihoonbae/binbang
   - 출력: image_tag, web_digest, worker_digest
3. deploy      — OCI 서버 SSH 배포
   - appleboy/ssh-action@v1.2.5
   - git fetch + reset
   - .env 파일 업데이트 (IMAGE_TAG, 다이제스트, DEPLOY_SHA, DEPLOYED_AT)
   - prisma migrate deploy
   - 시드 데이터 실행
   - docker compose up -d
```

#### 추가 워크플로우

| 워크플로우 | 트리거 | 설명 |
|-----------|--------|------|
| `release-tag.yml` | push to main | package.json 버전으로 git 태그 생성 |
| `codeql.yml` | PR + 주간 (일요일 03:00) | JavaScript 보안 분석 |

### 24.3 데이터베이스 마이그레이션 이력

총 23개 마이그레이션 (2025-02 ~ 2026-02):

| # | 날짜 | 마이그레이션 | 주요 변경 |
|---|------|------------|-----------|
| 1 | 2025-02 | `0_init` | 초기 스키마 (Users, Accounts, Sessions, Accommodations, CheckLog) |
| 2 | 2025-02 | `add_check_cycle` | CheckCycle 모델 추가 |
| 3 | 2025-02 | `add_price_amount_currency` | 가격 파싱 필드 (priceAmount, priceCurrency) |
| 4 | 2026-02-04 | `extend_checklog_with_stay_dates` | CheckLog에 checkIn, checkOut, pricePerNight |
| 5 | 2026-02-04 | `add_user_password` | 이메일 로그인용 비밀번호 필드 |
| 6 | 2026-02-05 | `rbac_migration` | Plan, PlanQuota, Role, Permission 모델 |
| 7 | 2026-02-05 | `add_subscription_and_audit_target` | Subscription, AuditLog 모델 |
| 8 | 2026-02-05 | `add_accommodation_metadata_fields` | JSON-LD 메타데이터 (platformId, address, rating, coordinates) |
| 9 | 2026-02-05 | `add_platform_id` | Platform ID 추적 |
| 10 | 2026-02-05 | `add_platform_selector_management` | PlatformSelector, PlatformPattern, SelectorChangeLog |
| 11 | 2026-02-08 | `add_setting_limits` | SystemSettings KV 저장소 |
| 12 | 2026-02-11 | `add_user_tutorial_fields` | 튜토리얼 완료/해제 타임스탬프 |
| 13 | 2026-02-11 | `add_form_submission` | FormSubmission 모델 (Google Form 접수) |
| 14 | 2026-02-11 | `add_case_model` | Case, CaseStatusLog 모델 (상태 머신) |
| 15 | 2026-02-11 | `add_needs_clarification` | NEEDS_CLARIFICATION 상태, 명확화 필드 |
| 16 | 2026-02-11 | `add_consent_evidence_fields` | 동의 증거 필드 |
| 17 | 2026-02-11 | `add_payment_confirmation_fields` | 결제 확인 필드 |
| 18 | 2026-02-11 | `add_condition_met_evidence` | ConditionMetEvent 모델 |
| 19 | 2026-02-12 | `add_billing_event_and_case_notification` | BillingEvent, CaseNotification 모델 |
| 20 | 2026-02-13 | `add_case_message` | CaseMessage 모델 (운영 메시지) |
| 21 | 2026-02-13 | `add_form_question_mapping` | FormQuestionMapping 모델 |
| 22 | 2026-02-13 | `add_form_question_mapping_item_id` | questionItemId 필드 추가 |
| 23 | 2026-02-14 | `add_case_message_sent_by_fkey` | CaseMessage sentById FK |

### 24.4 환경변수 전체 목록

#### 필수 환경변수

| 변수 | 용도 | 예시 |
|------|------|------|
| `APP_ENV` | 환경 구분 | `local`, `development`, `production` |
| `DATABASE_URL` | PostgreSQL 연결 | `postgresql://user:pass@host/db` |
| `REDIS_URL` | Redis 연결 | `redis://host:6379` |
| `NEXTAUTH_URL` | NextAuth 베이스 URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 | (랜덤 문자열) |
| `KAKAO_CLIENT_ID` | 카카오 OAuth | (API 키) |
| `KAKAO_CLIENT_SECRET` | 카카오 시크릿 | (시크릿 키) |
| `GOOGLE_CLIENT_ID` | Google OAuth | (클라이언트 ID) |
| `GOOGLE_CLIENT_SECRET` | Google 시크릿 | (시크릿) |

#### Worker 런타임 환경변수 (DB 기본값 존재)

| 변수 | 기본값 | 용도 |
|------|--------|------|
| `CRON_SCHEDULE` | `*/30 * * * *` | 체크 사이클 스케줄 |
| `WORKER_CONCURRENCY` | `1` | 체크 워커 동시성 |
| `BROWSER_POOL_SIZE` | `1` | 브라우저 풀 크기 |
| `NAVIGATION_TIMEOUT_MS` | `25000` | 페이지 로딩 타임아웃 |
| `CONTENT_WAIT_MS` | `10000` | 콘텐츠 대기 시간 |
| `PATTERN_RETRY_MS` | `5000` | 패턴 재시도 대기 |
| `BLOCK_RESOURCE_TYPES` | `image,media,font` | 차단 리소스 유형 |

#### 하트비트 모니터링

| 변수 | 기본값 | 용도 |
|------|--------|------|
| `HEARTBEAT_INTERVAL_MS` | `60000` | 하트비트 간격 |
| `HEARTBEAT_MISSED_THRESHOLD` | `1` | 경고 임계값 |
| `MAX_PROCESSING_TIME_MS` | `3600000` | 최대 처리 시간 (1시간) |
| `WORKER_HEALTHY_THRESHOLD_MS` | `2400000` | 정상 임계값 (40분) |
| `WORKER_DEGRADED_THRESHOLD_MS` | `5400000` | 저하 임계값 (90분) |

#### 공개 빌드 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 검색 인증 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google 검색 인증 |

### 24.5 인프라 개선 TODO

#### INFRA-1: DB 백업 자동화

| 항목 | 현재 | 목표 |
|------|------|------|
| 자동 백업 | ❌ 없음 | pg_dump 일 1회 + S3/OCI Object Storage |
| 포인트 인 타임 복구 | ❌ | WAL 아카이빙 |
| 복구 테스트 | ❌ | 월 1회 복구 드릴 |
| 보존 기간 | — | 일별 7일 + 주별 4주 + 월별 6개월 |

#### INFRA-2: Redis 영속성

| 항목 | 현재 | 목표 |
|------|------|------|
| 영속성 | 없음 (메모리 전용) | AOF appendonly |
| 메모리 정책 | `noeviction` | ✅ 유지 (BullMQ 필수) |
| 최대 메모리 | 미설정 | `maxmemory 256mb` |
| 모니터링 | 없음 | Redis INFO 주기적 수집 |

#### INFRA-3: HA(High Availability) 구성 (장기)

```
현재:                        목표 (Phase 4+):
┌─────────────┐             ┌─────────────┐  ┌─────────────┐
│ OCI 단일 VM │             │   VM 1      │  │   VM 2      │
│ Web+Worker  │     →       │   Web       │  │   Worker    │
│ DB+Redis    │             │   Redis     │  │   Redis(R)  │
└─────────────┘             └──────┬──────┘  └──────┬──────┘
                                   │                │
                            ┌──────┴────────────────┴──────┐
                            │    Managed PostgreSQL        │
                            └──────────────────────────────┘
```

#### INFRA-4: Turbo 빌드 최적화

| 항목 | 현재 | 개선 |
|------|------|------|
| 원격 캐시 | ❌ | Turborepo Remote Cache (Vercel 또는 자체) |
| CI 빌드 시간 | ~4분 (추정) | 목표 < 2분 |
| Docker 레이어 캐시 | ✅ GitHub Actions gha | ✅ 유지 |

---

## 25. 접근성(Accessibility) 개선 계획

### 25.1 현재 접근성 상태 감사

#### 구현된 항목

| 항목 | 상태 | 구현 위치 |
|------|------|-----------|
| `aria-label` 버튼 | ✅ | ThemeToggle, 메뉴 버튼 |
| `aria-hidden` 장식 요소 | ✅ | 아이콘, 일러스트 SVG |
| `sr-only` 스크린 리더 텍스트 | ✅ | 아이콘 버튼, 모바일 숨김 텍스트 |
| `focus-visible` 스타일 | ✅ | globals.css 전역 정의 |
| 시맨틱 HTML | ✅ | `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>` |
| 헤딩 계층 | ✅ | h1~h4 적절한 사용 |
| 폼 라벨 연결 | ✅ | `htmlFor` + `id` 매칭 |
| 적절한 `autoComplete` | ✅ | email, password, name |
| 색 대비 | ⚠️ | 기본적으로 양호, 일부 `muted-foreground` 검증 필요 |
| 모션 감소 | ✅ | `prefers-reduced-motion` 미디어 쿼리 |

#### 미구현/개선 필요 항목

| 항목 | 심각도 | 설명 |
|------|--------|------|
| Skip-to-content 링크 | 높음 | 키보드 내비게이션 진입점 없음 |
| 키보드 내비게이션 패턴 | 중간 | Tab/Enter/Escape 핸들링 불완전 |
| ARIA 역할 속성 | 중간 | 복잡한 컴포넌트에 `role` 부재 |
| Dialog 포커스 트랩 | 중간 | Radix UI 내장이나 커스텀 Dialog 검증 필요 |
| 라이브 리전 | 낮음 | 동적 콘텐츠 변경 알림 없음 (`aria-live`) |
| 차트 접근성 | 낮음 | Recharts 차트의 대체 텍스트 없음 |
| 에러 알림 연결 | 중간 | 폼 에러 시 `aria-describedby` 미사용 |
| 색 대비 검사 | 중간 | 전체 색상 쌍 WCAG AA 검증 미실시 |

### 25.2 접근성 개선 로드맵

#### A11Y-1: Skip-to-content 링크 (P1)

```tsx
// 목표: 모든 레이아웃에 skip-to-content 추가
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  본문으로 건너뛰기
</a>
// ...
<main id="main-content">
```

**대상**: `(app)/layout.tsx`, `(public)/[lang]/layout.tsx`, `admin/layout.tsx`
**예상 공수**: 0.5일

#### A11Y-2: 폼 에러 접근성 (P1)

```tsx
// 목표: 에러 메시지와 입력 필드 연결
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && <p id="email-error" role="alert">{errors.email}</p>}
```

**대상**: 로그인, 회원가입, 숙소 등록/수정 폼
**예상 공수**: 1일

#### A11Y-3: 라이브 리전 도입 (P2)

```tsx
// 목표: 동적 콘텐츠 변경 알림
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

**적용 대상**:
- 숙소 상태 변경 알림
- 케이스 상태 전이 결과
- 폼 제출 성공/실패

#### A11Y-4: 차트 대체 텍스트 (P2)

```tsx
// 목표: Recharts 차트에 접근 가능한 대체 설명
<div role="img" aria-label="최근 7일 가격 추이: 최저 85,000원, 최고 120,000원">
  <PriceChart data={priceData} />
</div>
```

#### A11Y-5: WCAG AA 색상 대비 검사 (P2)

| 검사 대상 | 최소 대비비 | 도구 |
|-----------|------------|------|
| 일반 텍스트 | 4.5:1 | axe DevTools, Lighthouse |
| 대형 텍스트 | 3:1 | 동일 |
| UI 컴포넌트 | 3:1 | 동일 |
| `muted-foreground` on `background` | ⚠️ 검증 필요 | — |
| `primary` on `background` | ⚠️ 검증 필요 | — |

### 25.3 문화적 적합성 (Cultural Localization)

> 5개국어 지원이 강점이므로, WCAG 접근성 외에 시장별 문화적 UX 차이도 고려한다.

#### 시장별 알림 채널 매핑

| 시장 | 주요 채널 | 보조 채널 | 문화적 고려 |
|------|----------|----------|------------|
| 한국 | 카카오톡 (현재) | 이메일, SMS | 카톡 친구톡 vs 알림톡 구분, 야간 발송 제한 (21~08시) |
| 일본 | 라인 | 이메일 | 경어(敬語) 사용 필수, 시간 표기 24시 → 12시 선호 |
| 중국 | 위챗 | 이메일, SMS | 간체/번체 구분 (현재 zh-CN 간체만), 위안화 표시 |
| 동남아 | 텔레그램, WhatsApp | 이메일 | 다중 통화 (THB, SGD, MYR 등), 영어 혼용 |
| 중남미 | WhatsApp | 이메일 | es-419 (라틴 스페인어), 현지 결제 수단 |

#### 시장별 UI/UX 고려사항

| 항목 | 한국 | 일본 | 글로벌 |
|------|------|------|--------|
| **날짜 형식** | YYYY.MM.DD | YYYY年MM月DD日 | locale별 `Intl.DateTimeFormat` |
| **통화 형식** | ₩10,000 | ¥10,000 | locale별 `Intl.NumberFormat` |
| **주소 형식** | 도/시/구/동 순서 | 県/市/区 역순 | 플랫폼별 자동 파싱 |
| **색상 문화** | 빨강=위험, 녹색=안전 | 동일 (대체로 보편적) | 색상 의미 보편적 체계 유지 |
| **결제 수단** | 카카오페이, 토스 | PayPay, 라쿠텐페이 | Stripe (글로벌 통합) |
| **신뢰 요소** | 사업자등록번호, 이용약관 | 特定商取引法 표시 | 현지 법률 요건 준수 |

#### 문화적 적합성 TODO

| # | 항목 | Phase | 설명 |
|---|------|-------|------|
| CL-1 | 알림 메시지 톤 가이드 | 2 | 시장별 경어/반말, 이모지 사용 가이드 |
| CL-2 | 날짜/통화 포맷 통합 | 2 | `Intl` API 기반 자동 포맷 (현재 일부 하드코딩) |
| CL-3 | 일본 시장 라인 연동 | 4 | Line Messaging API + 일본어 알림 템플릿 |
| CL-4 | 중국 시장 위챗 연동 | 5 | WeChat Official Account + zh-TW 번체 추가 |
| CL-5 | 현지 결제 수단 | 3~4 | Stripe 글로벌 또는 현지 PG 파트너 |

---

## 26. 데이터베이스 스키마 진화 계획

### 26.1 핵심 모델 현황 (23개)

#### 모델별 필드 수 및 관계

| 모델 | 필드 수 | 관계 | 인덱스 |
|------|---------|------|--------|
| User | 10+ | accounts, sessions, accommodations, checkLogs | id, email |
| Account | 12 | user | userId+provider (unique) |
| Session | 4 | user | sessionToken (unique) |
| Accommodation | 25+ | user, checkLogs, cases | userId, isActive |
| CheckLog | 15+ | accommodation, user, cycle, conditionMetEvents | accommodationId, createdAt, cycleId |
| CheckCycle | 10 | checkLogs | startedAt |
| Case | 10+ | submission, statusLogs, conditionMetEvents, notifications, billingEvent, messages | status, createdAt |
| FormSubmission | 8+ | case | responseId (unique) |
| CaseStatusLog | 6 | case | caseId |
| CaseMessage | 7 | case, sender | caseId |
| CaseNotification | 10 | case | caseId, status, idempotencyKey (unique) |
| ConditionMetEvent | 8 | case, checkLog | caseId+checkLogId (unique) |
| BillingEvent | 6 | case | caseId (unique) |
| Plan | 6+ | planQuotas, users | name (unique) |
| PlanQuota | 4 | plan | planId+resource (unique) |
| Subscription | 5 | user, plan | userId |
| Role | 3 | permissions | name (unique) |
| Permission | 3 | role | — |
| AuditLog | 8 | — | createdAt, actorId |
| SystemSettings | 8 | — | category |
| SettingsChangeLog | 6 | — | settingsKey |
| PlatformSelector | 8 | patterns, changeLog | platform+type (unique) |
| PlatformPattern | 7 | selector | selectorId |
| SelectorChangeLog | 6 | selector | selectorId |
| WorkerHeartbeat | 8 | history | — (싱글톤) |
| HeartbeatHistory | 6 | heartbeat | timestamp |
| FormQuestionMapping | 7 | — | formKey+questionKey (unique) |

### 26.2 향후 스키마 변경 예정

#### Phase 1: PriceQuote 모델 (P0-10)

```prisma
model PriceQuote {
  id                    String   @id @default(cuid())
  caseId                String
  pricingPolicyVersion  String   // 예: "v1.0.0"
  inputsSnapshot        Json     // FormSubmission.extractedFields 스냅샷
  weightsSnapshot       Json     // { baseFee, duration, difficulty, urgency, frequency }
  computedAmountKrw     Int
  roundedAmountKrw      Int
  changeReason          String   // 필수
  isActive              Boolean  @default(true) // 케이스 현재 적용 quote
  createdBy             String
  createdAt             DateTime @default(now())

  case Case @relation(fields: [caseId], references: [id])

  @@index([caseId])
  @@index([caseId, isActive])
}
```

#### Phase 2: Payment 모델 (PG 연동)

```prisma
model Payment {
  id           String        @id @default(cuid())
  caseId       String        @unique
  provider     PaymentProvider // TOSS, KAKAOPAY
  paymentKey   String        @unique
  amount       Int
  currency     String        @default("KRW")
  status       PaymentStatus // PENDING, PAID, REFUNDED, CANCELLED
  paidAt       DateTime?
  refundedAt   DateTime?
  metadata     Json?

  case Case @relation(fields: [caseId], references: [id])
}

enum PaymentProvider { TOSS KAKAOPAY }
enum PaymentStatus { PENDING PAID REFUNDED CANCELLED }
```

#### Phase 2: User preferredLocale

```prisma
model User {
  // ... 기존 필드
  preferredLocale String? // ko, en, ja, zh-CN, es-419
}
```

#### Phase 3: Platform enum 확장

```prisma
enum Platform {
  AIRBNB
  AGODA
  BOOKING    // Phase 3
  YANOLJA    // Phase 4
  GOODCHOICE // Phase 4
}
```

### 26.3 데이터베이스 인덱스 최적화 계획

#### 현재 인덱스 분석

| 테이블 | 기존 인덱스 | 추가 필요 |
|--------|------------|-----------|
| CheckLog | accommodationId, createdAt, cycleId | `[status, createdAt]` (상태별 조회) |
| Case | status, createdAt | `[status, statusChangedAt]` (SLA 모니터링) |
| AuditLog | createdAt, actorId | `[action, createdAt]` (감사 분석) |
| CaseNotification | caseId, status | `[status, createdAt]` (재시도 조회) |
| Accommodation | userId, isActive | `[platform, isActive]` (플랫폼별 통계) |

#### 복합 인덱스 추가 계획

```prisma
// CheckLog: 숙소별 기간 조회 최적화
@@index([accommodationId, checkIn, checkOut])  // ✅ 이미 존재

// Case: 상태별 시간순 정렬 (관리자 목록)
@@index([status, createdAt(sort: Desc)])

// CaseNotification: 재시도 대상 빠른 조회
@@index([status, createdAt])

// FormSubmission: 기간별 접수 통계 (퍼널 대시보드)
@@index([createdAt])
```

### 26.4 데이터 파티셔닝 계획 (장기)

#### CheckLog 파티셔닝 (6개월+)

| 전략 | 기준 | 이점 |
|------|------|------|
| 월별 파티셔닝 | `createdAt` | 오래된 데이터 아카이브 용이 |
| 핫/콜드 분리 | 최근 30일 핫, 이후 콜드 | 쿼리 성능 유지 |
| 아카이브 정책 | 6개월 초과 → S3/Object Storage | DB 부하 감소 |

**Prisma 제한**: Prisma는 네이티브 파티셔닝 미지원 → Raw SQL 마이그레이션 필요

#### 스크린샷 데이터 외부화 (중기)

| 현재 | 목표 |
|------|------|
| `screenshotBase64` (DB BLOB) | S3/OCI Object Storage URL |
| DB 부하 높음 | DB 부하 감소, CDN 캐싱 가능 |
| 백업 크기 증가 | 별도 보존 정책 적용 가능 |

---

## 27. 마케팅/그로스 전략

### 27.1 현재 마케팅 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 랜딩 페이지 | ✅ 완료 | 5개국어, 다크모드, 반응형 |
| SEO 기본 | ✅ 완료 | 메타데이터, sitemap, robots.txt |
| Google Analytics | ⚠️ 컴포넌트 있음 | 실제 이벤트 전송은 console.log |
| 네이버 검색 인증 | ⚠️ 환경변수 존재 | 실제 인증 상태 미확인 |
| 소셜 미디어 | ❌ | 계정 없음 |
| 콘텐츠 마케팅 | ❌ | 블로그 없음 |
| 유료 광고 | ❌ | — |

### 27.2 SEO 전략

#### 기존 SEO 구현

| 항목 | 구현 상태 | 파일 |
|------|-----------|------|
| 다국어 메타데이터 | ✅ | 각 `page.tsx`의 `generateMetadata` |
| `hreflang` 태그 | ✅ | 레이아웃 메타데이터 |
| Open Graph | ✅ | 랜딩/소개 페이지 |
| 구조화 데이터 (JSON-LD) | ⬜ 미구현 | — |
| sitemap.xml | ✅ | 자동 생성 |
| robots.txt | ✅ | 기본 설정 |

#### SEO 개선 항목

| # | 항목 | 우선순위 | 설명 |
|---|------|----------|------|
| SEO-1 | JSON-LD 구조화 데이터 | P1 | Organization, WebApplication, FAQPage 스키마 추가 |
| SEO-2 | GA4 이벤트 실제 연동 | P1 | console.log → gtag 실제 전송 |
| SEO-3 | 핵심 키워드 최적화 | P1 | "빈방 알림", "숙소 모니터링", "에어비앤비 취소" 등 |
| SEO-4 | 블로그 섹션 추가 | P2 | 여행 팁, 예약 가이드, 서비스 업데이트 |
| SEO-5 | 성능 최적화 (Core Web Vitals) | P2 | LCP, FID, CLS 측정 및 개선 |
| SEO-6 | 소셜 미디어 프로필 연결 | P2 | 인스타그램, 트위터, 페이스북 |

### 27.3 콘텐츠 마케팅 전략

#### 타겟 키워드 그룹

| 키워드 그룹 | 예시 키워드 | 검색 의도 | 콘텐츠 유형 |
|-------------|-----------|-----------|------------|
| 문제 인식 | "에어비앤비 예약 취소 알림" | 정보 | 블로그 |
| 솔루션 탐색 | "숙소 빈방 모니터링" | 비교 | 랜딩 페이지 |
| 서비스 탐색 | "빈방 알림 서비스" | 거래 | 요금제 페이지 |
| 여행 관련 | "제주도 숙소 예약 팁" | 정보 | 블로그 |
| 가격 관련 | "에어비앤비 가격 추이" | 정보 | 블로그/도구 |

#### 콘텐츠 캘린더 제안 (월 4건)

| 주차 | 주제 유형 | 예시 |
|------|----------|------|
| 1주 | 서비스 가이드 | "빈방 서비스 이용 가이드" |
| 2주 | 여행 팁 | "인기 지역 숙소 예약 전략" |
| 3주 | 데이터 인사이트 | "이번 달 빈방 발생 패턴 분석" |
| 4주 | 서비스 업데이트 | "신규 기능 소개" |

### 27.4 그로스 해킹 전략

#### 사용자 획득 채널

| 채널 | 전략 | 예상 효과 | 비용 |
|------|------|-----------|------|
| 검색 (SEO) | 콘텐츠 마케팅 + 키워드 최적화 | 높음 (장기) | 시간 투자 |
| 입소문 | 조건 충족 성공 시 공유 기능 | 높음 | 무료 |
| 커뮤니티 | 네이버 카페, 여행 커뮤니티 참여 | 중간 | 시간 투자 |
| SNS | 인스타그램/트위터 운영 | 중간 | 시간 투자 |
| 파트너십 | 여행 블로거/인플루언서 협업 | 중간 | 제품 제공 |
| 유료 광고 | Google Ads, 네이버 검색 광고 | 높음 (단기) | 예산 필요 |

#### 리텐션 전략

| 전략 | 설명 | Phase |
|------|------|-------|
| 성공 알림 공유 | "빈방 찾기 성공!" 소셜 공유 버튼 | 2 |
| 리워드 프로그램 | 추천인 할인 | 3 |
| 주기적 인사이트 | 주간 가격/가용성 리포트 이메일 | 3 |
| 커뮤니티 | 숙소 정보/후기 공유 게시판 | 4+ |

### 27.5 전환율 최적화 (CRO)

#### 현재 전환 퍼널

```
방문 → 가입 → 숙소 등록 → 활성 모니터링 → 유료 전환
 100%    ?%       ?%          ?%             ?%
```

#### CRO 개선 항목

| # | 항목 | 설명 | Phase |
|---|------|------|-------|
| CRO-1 | GA4 퍼널 추적 | 각 단계 전환율 측정 | 1 |
| CRO-2 | 랜딩 A/B 테스트 | 히어로 문구/CTA 변형 테스트 | 2 |
| CRO-3 | 소셜 증거 | 성공 사례/사용자 수 표시 | 2 |
| CRO-4 | 온보딩 개선 | 가입 후 첫 숙소 등록까지 안내 강화 | 2 |
| CRO-5 | 이탈 방지 | 숙소 등록 중단 시 이메일 리마인더 | 3 |

---

## 28. 서비스 레이어 상세 분석

### 28.1 서비스 파일 전체 목록

#### 사용자 서비스 (`apps/web/src/services/`)

| 파일 | 테스트 | 주요 함수 |
|------|--------|-----------|
| `auth.service.ts` | ✅ | `createUser`, `findUserByEmail`, `verifyPassword`, `createUserViaOAuth` |
| `user.service.ts` | ✅ | `getUserQuota`, `getSubscription`, `updateTutorialStatus` |
| `accommodations.service.ts` | ✅ | `createAccommodation`, `getAccommodationById`, `updateAccommodation`, `deleteAccommodation`, `getUserAccommodations` |
| `logs.service.ts` | ❌ | `getRecentLogs` |
| `cases.service.ts` | ✅ | `getCaseById`, `getCases`, `updateCaseStatus`, `confirmPayment`, `linkAccommodation` |
| `intake.service.ts` | ✅ | `processFormSubmission`, `validateFormData`, `extractFormFields` |
| `messages.service.ts` | ✅ | `getCaseMessages`, `sendCaseMessage`, `getMessageTemplates` |
| `condition-parser.service.ts` | ✅ | `parseConditionDefinition`, `evaluateCondition` |
| `notifications.service.ts` | ❌ | `sendCaseNotification`, `retryCaseNotification` |
| `health.service.ts` | ❌ | `getHealthStatus`, `getHeartbeatStatus` |
| `pricing.service.ts` | 미구현 | (P0-10에서 생성 예정) |

#### 관리자 서비스 (`apps/web/src/services/admin/`)

| 파일 | 테스트 | 주요 함수 |
|------|--------|-----------|
| `users.service.ts` | ✅ | `getUsers`, `getUserDetail`, `changeUserRole`, `changeUserPlan`, `getUserActivity` |
| `plans.service.ts` | ❌ | `getPlans`, `createPlan`, `updatePlan`, `deletePlan` |
| `selectors.service.ts` | ❌ | `getSelectors`, `createSelector`, `updateSelector`, `deleteSelector`, `getSelectorHistory` |
| `patterns.service.ts` | ❌ | `getPatterns`, `createPattern`, `updatePattern`, `deletePattern` |
| `settings.service.ts` | ❌ | `getSettings`, `updateSettings`, `getSettingsHistory` |
| `monitoring.service.ts` | ❌ | `getMonitoringSummary`, `getMonitoringLogs` |
| `throughput.service.ts` | ❌ | `getThroughputSummary`, `getThroughputHistory`, `compareThroughput` |
| `audit.service.ts` | ❌ | `getAuditLogs` |
| `submissions.service.ts` | ❌ | `getSubmissions` |
| `intake-mappings.service.ts` | ❌ | `getMappings`, `upsertMapping` |

### 28.2 서비스 테스트 커버리지 갭

#### 테스트 있는 서비스 (8/21 = 38%)

| 서비스 | 테스트 수 | 커버리지 수준 |
|--------|-----------|--------------|
| auth.service | 35+ | 높음 — 가입, 로그인, OAuth, 에러 |
| user.service | 15+ | 중간 — 쿼터, 구독, 튜토리얼 |
| accommodations.service | 30+ | 높음 — CRUD, 쿼터, 소유권 |
| cases.service | 25+ | 중간 — 상태 전이, 결제, 연결 |
| intake.service | 20+ | 높음 — 폼 검증, 파싱, 멱등 |
| messages.service | 15+ | 중간 — 발송, 템플릿 |
| condition-parser.service | 15+ | 높음 — 파싱, 평가, 엣지 케이스 |
| admin/users.service | 12+ | 중간 — 목록, 역할, 플랜 |

#### 테스트 없는 서비스 (13/21 = 62%) — 우선순위별

**P1 (즉시):**
- `notifications.service.ts` — 알림 채널 이중화 전 필수
- `pricing.service.ts` — P0-10 신규 서비스
- `health.service.ts` — 헬스체크 정확성

**P2 (2~4주):**
- `admin/plans.service.ts` — 삭제 가드 검증
- `admin/selectors.service.ts` — 히스토리/우선순위
- `admin/monitoring.service.ts` — 요약 쿼리
- `admin/throughput.service.ts` — 시간 버킷 계산
- `admin/settings.service.ts` — 설정 변경/이력
- `admin/audit.service.ts` — 필터/검색

**P3 (1~3개월):**
- `logs.service.ts` — 단순 조회
- `admin/submissions.service.ts` — 목록 조회
- `admin/intake-mappings.service.ts` — 매핑 CRUD
- `admin/patterns.service.ts` — 패턴 CRUD

---

## 부록 D: 파일별 TODO/FIXME 목록

| # | 파일 | 라인 | 내용 | 우선순위 |
|---|------|------|------|----------|
| 1 | `apps/web/src/hooks/index.ts` | 4 | `TODO: 컴포넌트들이 직접 @/features에서 import하도록 마이그레이션 후 제거` | P2 |
| 2 | `apps/web/src/lib/analytics/landing-tracker.ts` | 185 | `TODO: 실제 분석 서비스로 전송 (Google Analytics, Mixpanel 등)` | P1 |
| 3 | `apps/web/src/app/(app)/dashboard/_lib/dashboard-tracker.ts` | 130 | `TODO: 실제 분석 서비스로 전송 (Google Analytics, Mixpanel 등)` | P1 |
| 4 | `packages/worker-shared/src/runtime/i18n/userLocale.ts` | — | `TODO: User.preferredLocale 필드 추가 시 활성화` | P2 |

---

## 부록 E: Turborepo 태스크 의존성 그래프

```mermaid
graph TD
    A[db:generate] --> B[build]
    A --> C[typecheck]
    A --> D[dev]
    B --> E[start]
    F[^build] --> B
    F --> G[test]
    H[lint]:::independent
    I[format:check]:::independent

    classDef independent fill:#f5f5f5,stroke:#999,stroke-dasharray: 4 4;
```

**태스크별 캐시 설정:**

| 태스크 | 의존 | 캐시 | 출력 |
|--------|------|------|------|
| `db:generate` | 없음 | ❌ | `generated/**` |
| `build` | `^build`, `db:generate` | ✅ | `.next/**`, `dist/**` |
| `test` | `^build` | ✅ | — |
| `typecheck` | `db:generate` | ✅ | — |
| `lint` | 없음 | ✅ | — |
| `dev` | `db:generate` | ❌ | — |
| `start` | `build` | ❌ | — |
| `clean` | 없음 | ❌ | — |

---

## 부록 F: 서비스 의존성 매트릭스

```mermaid
graph TD
    subgraph "Route Handlers (51개 API 라우트)"
        RH[인증/검증 → 서비스 호출]
    end

    subgraph "Service Layer — 사용자 도메인"
        AUTH[auth.service]
        USER[user.service]
        ACCOM[accommodations.service]
        LOGS[logs.service]
        CASES[cases.service]
        INTAKE[intake.service]
        MSGS[messages.service]
        NOTIF[notifications.service]
        COND[condition-parser.service]
        PRICE[pricing.service ⬜]
    end

    subgraph "Service Layer — 관리자 도메인"
        AU[admin/users]
        AP[admin/plans]
        AS[admin/settings]
        ASEL[admin/selectors]
        APAT[admin/patterns]
        AMON[admin/monitoring]
        ATHR[admin/throughput]
        AAUD[admin/audit]
        ASUB[admin/submissions]
        AIM[admin/intake-mappings]
    end

    subgraph "Data Layer"
        DB["@workspace/db (Prisma Client)"]
    end

    RH --> AUTH & USER & ACCOM & LOGS & CASES & INTAKE & MSGS & NOTIF
    RH --> AU & AP & AS & ASEL & APAT & AMON & ATHR & AAUD & ASUB & AIM

    CASES --> COND
    CASES --> PRICE
    INTAKE --> CASES

    AUTH & USER & ACCOM & LOGS & CASES & INTAKE & MSGS & NOTIF --> DB
    AU & AP & AS & ASEL & APAT & AMON & ATHR & AAUD & ASUB & AIM --> DB

    style PRICE fill:#ff9,stroke:#333
```

**의존 방향 규칙 (rules.md):**
- Route Handler → Service → DB (단방향만 허용)
- Route Handler에서 직접 DB 접근 금지
- Service 간 순환 의존 금지
- 공유 타입은 `@workspace/shared`에서 import

---

## 부록 G: Phase 간 의존성 다이어그램

```mermaid
graph LR
    subgraph "Phase 1 (0~2주)"
        P09[P0-9 퍼널 대시보드]
        P010[P0-10 견적 엔진]
        ERR[도메인 에러 타입]
        LEGACY[next.config 정리]
        CHART[처리량 차트 개선]
    end

    subgraph "Phase 2 (2~6주)"
        P11[P1-1 자동 만료]
        P12[P1-2 알림 이중화]
        P14[P1-4 SLA 타이머]
        ENV[환경변수 검증]
        LOG[구조화 로깅]
        I18N_APP[App i18n]
        WTEST[Worker 테스트]
    end

    subgraph "Phase 3 (1~3개월)"
        SELF[셀프서비스 접수]
        PG[PG 결제 연동]
        STATUS[고객 상태 페이지]
        API_DOC[API 문서화]
        INT_TEST[통합 테스트]
    end

    subgraph "Phase 4 (3~6개월)"
        BOOKING[Booking.com]
        DOMESTIC[야놀자/여기어때]
        E2E[E2E 테스트]
        I18N_ADMIN[Admin i18n]
    end

    %% Phase 1 → Phase 2 의존성
    ERR --> LOG
    P09 --> P14
    P010 --> PG

    %% Phase 2 → Phase 3 의존성
    P12 --> SELF
    LOG --> INT_TEST
    I18N_APP --> I18N_ADMIN

    %% Phase 3 → Phase 4 의존성
    SELF --> PG
    INT_TEST --> E2E
    API_DOC --> BOOKING

    style P09 fill:#f96
    style P010 fill:#f96
    style ERR fill:#f96
```

---

> 이 문서는 빈방 프로젝트의 살아있는 문서(Living Document)로, 프로젝트 진행에 따라 지속적으로 업데이트한다.
> 변경 이력은 문서 상단의 **변경 이력** 표를 참조한다.
> 최종 업데이트: 2026-02-14
