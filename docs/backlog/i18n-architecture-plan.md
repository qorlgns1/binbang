# 다국어(i18n) 아키텍처 상세 계획서 (Backlog)

> 작성일: 2026-02-12 | 최종 업데이트: 2026-02-13
> 기준 브랜치: `develop`
> 목표: Web/App/Admin/Worker/Email까지 **일관된 Locale 전파 + 메시지 카탈로그 + 검증/운영 파이프라인**을 갖춘, 프레임워크/라우팅 변경에도 흔들리지 않는 i18n 아키텍처를 정의한다.

이 문서는 “지금 코드가 어떻게 되어 있냐”가 아니라, **장기적으로 가장 좋은 i18n 아키텍처가 무엇인지**를 모노레포 경계(`rules.md`) 관점에서 구체화한 계획서다.

---

## 현재 구현 상태 요약 (2026-02-13)

- **지원 locale**: 계획 1차 지원은 `ko`, `en`, `ja`, `zh-CN`, `es-419`이나, **현재 구현은 `ko`, `en`만** 적용됨. `packages/shared` `SUPPORTED_LOCALES`가 단일 소스이며, `apps/web` 전체가 `@workspace/shared/i18n`의 `Locale`/`SUPPORTED_LOCALES`/`isSupportedLocale`을 사용. 레거시 `Lang`/`supportedLangs`/`isValidLang`(`apps/web/src/lib/i18n/config.ts`)은 제거됨.
- **Public 라우팅**: `(public)/[lang]/**` 구조 정렬 완료(WU-14). middleware에서 `/`, `/login`, `/signup`, `/pricing`, `/terms`, `/privacy` 접근 시 locale 협상 후 `/{locale}/...` 로 redirect.
- **Public 헤더(단일·한 줄)**: `(public)/[lang]/layout.tsx`에서 **PublicHeader** 한 개만 주입. layout에서 `lang` props 전달, pathname으로 variant 자동 판단.
  - **landing** (`/[lang]`): 브랜드 | 네비(기능/상태/요금제/개인정보) | 테마 | 언어 | 로그인. 모바일은 브랜드 | 테마 | 언어 | 햄버거(시트 내 네비·로그인).
  - **pricing** (`/[lang]/pricing`): 브랜드 | 뒤로 | 언어 | (로그인 시 대시보드, 비로그인 시 로그인·가입). `useSession()` 연동.
  - **auth** (`/[lang]/login`, `/[lang]/signup`): 브랜드 | 언어.
  - **legal** (`/[lang]/terms`, `/[lang]/privacy`): 브랜드 | 홈으로 | 언어.
  - **default**: 브랜드 | 언어.
  - 랜딩은 별도 네비 바 없음(Landing Header 제거). pricing/terms/privacy는 페이지 내 헤더·뒤로가기 제거, 모두 PublicHeader 한 줄로 통합.
- **MobileMenu**: `useTranslations('landing')` 기반, `copy` prop 제거. 터치 타겟 44px+, 시트 내 계층·구분선·접근성. 링크/버튼 클릭 시 시트 닫기; #features/#status는 `scrollToAndClose`(시트 닫힌 뒤 350ms 지연 scrollIntoView로 포커스 복원에 의한 상단 스크롤 방지).
- **메시지/네임스페이스**: `apps/web/messages/{ko,en}/` 에 `common`, `auth`, `landing`, `legal`, `pricing` 존재. **랜딩 포함 모든 Public 페이지**는 next-intl 사용. `getLandingCopy` 제거됨.
- **request.ts + namespace slicing(적용 완료)**: locale은 `(public)/[lang]`에서는 URL param, `(app)`에서는 cookie fallback. middleware가 `x-pathname` 헤더를 전달하고, `request.ts`가 `namespaces.ts`의 `getNamespacesForPathname()`을 사용해 **라우트별 필요 namespace만** 동적 로드. Landing/Pricing은 3개(common+landing+pricing), Auth는 4개(+auth), Legal은 4개(+legal), App 라우트는 1개(common). pathname 미확인 시 전체 5개 fallback.
- **Public SEO(WU-16 완료)**: `sitemap.ts`는 locale 접두어(`/ko`, `/en`, `/ko/pricing` 등) URL + 항목별 `alternates.languages`(hreflang) 출력. Public 각 페이지(landing, pricing, login, signup, terms, privacy)는 `generateMetadata`/layout에서 `alternates.canonical`(절대 URL) 및 `alternates.languages`(ko/en) 설정. 헬퍼: `apps/web/src/lib/i18n-runtime/seo.ts`(getBaseUrl, buildPublicAlternates).

---

## 앞으로 구현할 사항

### 우선순위 높음 (Public / SEO)

| # | 항목 | 설명 | 참고 |
|---|------|------|------|
| 1 | **(완료) 랜딩 텍스트 i18n** | 랜딩을 next-intl `useTranslations('landing')` 기반으로 통일 완료. | 17.3 Landing 행 |
| 2 | **(완료) WU-16 Public SEO** | hreflang/canonical/sitemap 적용 완료. | 17.2, 17.3 |

### 우선순위 중간 (아키텍처·품질)

| # | 항목 | 설명 | 참고 |
|---|------|------|------|
| 3 | **(완료) request.ts namespace slicing** | middleware `x-pathname` 헤더 + `namespaces.ts` `getNamespacesForPathname()` 기반으로 라우트별 최소 namespace 로드 적용 완료. | 5.8, 현재 구현 상태 요약 |
| 4 | **사용자 preferredLocale 저장·반영** | 사용자 프로필에 `preferredLocale` 저장, Web 2차 확정·Worker/이메일 발송 시 반영. (DB 스키마·마이그레이션 별도.) | ADR-2, ADR-4, 7.5 |
| 5 | **Missing-key 관측(Prod)** | missing-key 발생 시 메트릭/로그 수집, SLO·알람 설계. | 12.4, 12.7 |

### 우선순위 낮음 / 확장

| # | 항목 | 설명 | 참고 |
|---|------|------|------|
| 6 | **지원 locale 확장** | 현재 ko/en만. 계획 1차: ja, zh-CN, es-419 추가 시 `@workspace/shared/i18n`의 `Locale`/`SUPPORTED_LOCALES` 확장 + messages·middleware·LangToggle 대응. | 2.1, ADR-9 |
| 7 | **App(비공개) 페이지 i18n** | Dashboard, Accommodations, Subscription Settings 등에 텍스트 i18n 적용 및 언어 변경 동작. (SEO 비대상.) | 17.3 매트릭스 |
| 8 | **포맷 토큰 통일** | Admin/Email/Worker 등에서 날짜·숫자·통화 포맷을 `@workspace/shared` 포맷 토큰으로 통일. | 9.4 |

### 선택·장기

- **레거시 경로 EOL(2026-06-30)**: `apps/web/public/locales/**` 참조 완전 제거(이미 메시지는 `messages/**` 단일화됨, CI 차단만 유지).
- **i18n messages payload 측정/CI 게이트**: route별 client messages 크기 측정, 임계치 초과 시 실패. (13.4)

---

## 목차

1. [설계 원칙(고정)](#1-설계-원칙고정)
2. [용어/스코프 정의](#2-용어스코프-정의)
3. [결정해야 하는 정책(ADR)](#3-결정해야-하는-정책adr)
4. [목표 아키텍처(To-Be) 개요](#4-목표-아키텍처to-be-개요)
5. [구현 예시(Next.js + next-intl) — 원칙과 분리](#5-구현-예시nextjs--next-intl--원칙과-분리)
6. [패키지/경계 설계(모노레포 규칙 준수)](#6-패키지경계-설계모노레포-규칙-준수)
7. [Locale 결정/전파 설계(RequestContext)](#7-locale-결정전파-설계requestcontext)
8. [메시지 카탈로그 설계](#8-메시지-카탈로그-설계)
9. [포맷팅(날짜/숫자/통화/상대시간) 표준](#9-포맷팅날짜숫자통화상대시간-표준)
10. [SEO/공개 URL 정책 레이어](#10-seo공개-url-정책-레이어)
11. [이메일/알림/워커 i18n](#11-이메일알림워커-i18n)
12. [품질 게이트(정합성/타입/린트/테스트/관측)](#12-품질-게이트정합성타입린트테스트관측)
13. [성능/캐시/번들 전략](#13-성능캐시번들-전략)
14. [마이그레이션 로드맵(세부 작업/DoD)](#14-마이그레이션-로드맵세부-작업dod)
15. [리스크/대응](#15-리스크대응)
16. [부록: 추천 디렉터리/파일 레이아웃](#16-부록-추천-디렉터리파일-레이아웃)
17. [LLM 실행 운영 가이드(이 문서 단독)](#17-llm-실행-운영-가이드이-문서-단독)
18. [관련 문서](#18-관련-문서)
19. [앞으로 구현할 사항](#앞으로-구현할-사항)

---

## 1. 설계 원칙(고정)

### 1.1 i18n은 기능이 아니라 “인프라”다

- UI 문자열만 번역하는 수준이 아니라, **서버 렌더링/SEO/이메일/알림/운영 로그**까지 동일한 locale 모델을 공유해야 한다.
- Locale은 화면 옵션이 아니라, **요청 컨텍스트의 1급 값(RequestContext)** 으로 시스템을 관통해야 한다.

### 1.2 코어는 런타임/프레임워크에 의존하지 않는다

- Next/라우팅 구조가 바뀌어도 i18n 코어는 유지되어야 한다.
- 코어는 “메시지 로딩”을 직접 하지 않고, **Loader 인터페이스(의존성 주입)** 로 런타임 어댑터에 위임한다.

### 1.3 “누락 키”는 운영 장애다 (단, 사용자 경험은 안전하게)

- Dev/CI에서는 **키/파라미터 불일치 = 실패**가 원칙.
- Prod에서는 안전 폴백(기본 언어)로 UI를 살리되, **관측(로그/메트릭)으로 누락을 즉시 드러낸다**.

### 1.4 모노레포 경계 규칙이 우선이다

- `@workspace/shared`는 순수(universal)여야 하며 Node built-in/환경변수/네트워크 I/O를 금지한다.
- 따라서 i18n 코어는 `@workspace/shared`에 둘 수 있지만, **fs 기반 로딩, env 접근, 런타임 제어**는 어댑터로 분리해야 한다.

---

## 2. 용어/스코프 정의

### 2.1 Locale / Language / Region

- **Language**: `ko`, `en`, `ja`, `zh`, `es` 등 (UI 언어)
- **Locale**: `ko-KR`, `en-US` 등 (언어+지역)
- 본 계획서의 1차 지원 locale은 `ko`, `en`, `ja`, `zh-CN`, `es-419`를 기준으로 한다.
- 2차 확장 시 지역 분리 locale(`zh-TW`, `es-ES` 등)로 확장 가능해야 한다.

### 2.2 Namespace

- 메시지 키를 “도메인/화면/채널”로 나누는 단위.
- 예: `common`, `auth`, `legal`, `app`, `admin`, `email`, `errors`

### 2.3 스코프(다국어 대상)

- **Public(SEO 대상)**: 랜딩/가격/로그인/회원가입/약관/개인정보
- **App/Admin(SEO 비대상)**: 대시보드/설정/관리자
- **Worker/Email/Notification**: 발송 콘텐츠, 운영/감사 이벤트의 사용자 노출 문자열

---

## 3. 결정해야 하는 정책(ADR)

> 아래 정책들은 기술 구현보다 먼저 “정책으로 고정”되어야 한다.

### ADR-1. 메시지 포맷: ICU 채택 여부

- **권장 결정**: ICU Message Format 채택
- 이유
  - 복수형/조건 분기(예: “{count}개”, “{gender}”)를 문자열 연결 없이 안전하게 표현
  - locale 간 파라미터 불일치 검증 가능

### ADR-2. Locale 소스 우선순위

- **권장 결정(표준)**: URL > 사용자 저장값(DB) > 쿠키 > `Accept-Language` > 기본값
- 이유
  - 공유 링크/SEO/캐시를 URL이 책임지게 할 수 있음
  - 로그인 사용자 경험(앱/이메일)에서 DB 선호 언어가 가장 안정적

주의(구현 레이어 분리):

- Edge middleware는 DB에 접근할 수 없으므로, **middleware는 URL/쿠키/헤더까지만 1차 협상**한다.
- DB(`preferredLocale`)는 서버(RSC/API)에서 세션/유저 컨텍스트를 확보한 뒤 **2차 확정**에 포함된다.
  - 즉, “정책(ADR-2)”과 “예시 코드(5.7)”는 역할이 다르며, 같은 코드에서 전부 해결하려고 하면 충돌한다.

### ADR-3. 누락 키 정책

- **권장 결정**
  - Dev/CI: 누락/여분 키, ICU 파라미터 불일치 → 실패
  - Prod: 기본 언어 폴백 + 누락 관측(메트릭/로그) + SLO 기반 알람

### ADR-4. 사용자 선호 언어 저장

- **권장 결정**: 사용자 프로필에 `preferredLocale`(또는 `preferredLang`) 저장
- 이유
  - 워커/이메일은 쿠키가 없고, 헤더는 신뢰할 수 없으며, “발송 시점”에 locale이 필요

### ADR-5. Web i18n 어댑터(Next App Router) 라이브러리 선택

> 코어는 프레임워크에 의존하지 않되, Web 어댑터는 선택이 필요하다.

- **권장 결정**: Web(Next)에서는 `next-intl`을 사용한다.
- 이유
  - App Router + RSC 지원이 강함(서버에서 번역을 완성하고, Client에는 필요한 메시지만 주입 가능)
  - ICU 기반 메시지 포맷(FormatJS 계열)과 궁합이 좋고, 장기 유지보수 비용이 낮음
- 제약(아키텍처 불변식)
  - `next-intl`은 Web 어댑터에만 존재해야 하며, `@workspace/shared` 코어는 이를 import하지 않는다.
  - Worker/Email은 `next-intl`에 의존하지 않고, 동일한 ICU 메시지(또는 호환 포맷)를 코어로 렌더링한다.

### ADR-6. 번역 Key 라이프사이클(호환성/Breaking Change)

목표:

- Web/Worker가 **분리 배포**되는 상황에서도 “번역 키 변경”이 즉시 장애로 이어지지 않게 한다.

권장 정책:

- **Key 삭제 금지(원칙)**: 기존 key를 제거하지 않는다.
- **Key rename은 add+deprecate로만**:
  - 새 key를 추가하고,
  - 기존 key는 일정 기간 유지(deprecate) 후 제거(제거는 별도 승인 + 릴리즈 노트 필수)
- **중복 key(aliases) 정책**:
  - 필요하면 “alias key → canonical key” 매핑을 코어 레벨(또는 빌드 단계)에서 지원한다.
  - 단, alias는 영구 기능이 아니라 마이그레이션 완충 장치로 취급한다(만료 기한 명시).

DoD(호환성):

- 키 변경 PR은 “변경 타입(add/rename/deprecate/remove)”을 명시해야 한다.
- remove는 기본적으로 금지이며, 예외 승인 시 CI/관측 전략(폴백/알람)을 함께 포함해야 한다.

### ADR-7. 리소스 버저닝/분리 배포 대응(웹/워커)

문제:

- Web과 Worker가 다른 시점에 배포되면, 번역 리소스/키/템플릿이 엇갈릴 수 있다.

권장 정책:

- missing-key는 Prod에서 폴백으로 “사용자 경험”은 살리되, **관측/알람으로 즉시 드러나야 한다**(12.7).
  - 즉, 분리 배포로 인한 mismatch는 “조용히 넘어가는 문제”가 아니어야 한다.
- Web/Worker는 각자 번역 리소스를 소유하되(6.4),
  - 공유 namespace는 키 집합 동일성을 CI로 강제한다.

권장 태깅(관측/디버깅용):

- `i18n_missing_key` 이벤트에 `version`을 포함한다.
  - Web: `NEXT_PUBLIC_APP_VERSION` 등
  - Worker: 워커 버전/이미지 태그

### ADR-8. 번역 리소스 보안/프라이버시(민감정보 금지)

원칙:

- 번역 JSON/템플릿에는
  - 토큰/시크릿/서명값,
  - 개인 식별 정보(PII) 원문,
  - 내부 전용 운영 URL(권한 없는 사용자에게 노출되면 안 되는 것)
  을 포함하지 않는다.
- 사용자 데이터는 항상 런타임 파라미터로 주입하고, 번역 리소스는 “정적 텍스트/ICU 템플릿”만 담는다.

### ADR-9. 지원 Locale 세트 + 지역 매핑 정책

권장 결정:

- 1차 지원 locale: `ko`, `en`, `ja`, `zh-CN`, `es-419`
- 기본 locale(`defaultLocale`): `ko`

지역 매핑 정책(1차):

- `zh-*` 요청은 `zh-CN`으로 매핑한다.
- `es-*` 요청은 `es-419`로 매핑한다.

2차 분리 정책:

- 트래픽/고객요청/운영지표가 충분하면 `zh-TW`, `es-ES`를 별도 locale로 분리한다.
- 분리 전까지는 매핑 정책으로 일관성을 유지한다.

---

## 4. 목표 아키텍처(To-Be) 개요

### 4.1 3-레이어 구조

1) **i18n Core (universal)**

- Locale 모델/협상/정규화
- `t()` / `format.*` / missing-key 정책
- Loader 인터페이스(“어디서 메시지를 가져오는지”는 모름)

1) **Runtime Adapters**

- Web(Next): middleware/서버 컴포넌트/API에서 locale 결정 후 코어에 주입
- Worker: job 실행 시 수신자/대상 사용자 locale로 메시지 렌더링
- Email/Notification: 템플릿 렌더링 시 코어를 사용

1) **Quality Gates + Tooling**

- 키 정합성/ICU 파라미터 검사
- 하드코딩 문자열 탐지(선택)
- 번역 리소스 변경 시 검증 자동화

### 4.2 핵심 불변식(Non-negotiable)

- (I1) “표시 문자열”은 **항상 key 기반**으로 생성된다.
- (I2) “locale”은 RequestContext로 흘러가며, 임의 전역/숨은 상태에 의존하지 않는다.
- (I3) 번역 파일은 **정적 자산**이며, 릴리즈 단위로 버저닝된다.
- (I4) 누락 키는 CI에서 막는다.

---

## 5. 구현 예시(Next.js + next-intl) — 원칙과 분리

이 섹션은 “아키텍처 원칙”이 아니라, **Web 어댑터를 Next(App Router)로 구현할 때의 예시**다.

원칙(코어 순수성/RequestContext 전파/namespace slicing)은 유지하되, 실제 구현은 교체 가능해야 한다.

### 5.1 목표(예시의 목적)

- URL 기반 locale prefix: `/{lang}/...`
- RSC(Server Component)에서 번역을 완성하고, Client에는 **필요한 메시지만** 전달
- `next-intl`은 Web 어댑터에만 존재(코어/worker는 의존하지 않음)

### 5.2 권장 디렉터리(예시)

```text
apps/web/
  messages/
    ko/
      common.json
      auth.json
    en/
      common.json
      auth.json
  src/
    i18n/
      request.ts          # next-intl request config(서버 로더/네임스페이스 선택)
      navigation.ts       # locale-aware navigation helpers(선택)
    middleware.ts         # URL/cookie/header 협상 + redirect(정책 레이어)
```

### 5.3 서버(RSC)에서 번역 사용 예시

```ts
import { getTranslations } from 'next-intl/server';

export default async function Page(): Promise<React.ReactElement> {
  const t = await getTranslations('auth');
  return <h1>{t('login.title')}</h1>;
}
```

### 5.4 클라이언트에서 번역 사용 예시(필요 최소)

```ts
'use client';

import { useTranslations } from 'next-intl';

export function LoginButton(): React.ReactElement {
  const t = useTranslations('auth');
  return <button type='button'>{t('login.submit')}</button>;
}
```

### 5.5 Hydration 최적화(예시의 핵심 규칙)

- Server Component는 번역을 완성 문자열로 렌더링할 수 있으면 그렇게 한다.
- Client Component는 “정말 필요한 namespace”만 받는다.
- `common`에 무한정 몰아넣지 않는다(결국 client messages payload가 커짐).

### 5.6 URL prefix + locale 라우팅(예시)

운영 모드:

- **Mode A (기본)**: Public만 `/{lang}/...` prefix 적용, App/Admin은 비-prefix 운영
- **Mode B (옵션)**: Public/App/Admin 모두 `/{lang}/...` prefix로 통일

지원 언어(1차): `ko`, `en`, `ja`, `zh-CN`, `es-419`

핵심 규칙:

- URL에 locale이 있으면 **그 값이 Source of Truth**다.
- URL에 locale이 없으면 (Mode에 따라) cookie/header로 **1차 협상 후 redirect**한다.
- 로그인 사용자 `preferredLocale`은 서버에서 **2차 확정**에 반영된다(ADR-2 참고).

### 5.6A Public 라우팅 구조 재설계(파일 시스템 정렬)

문제:

- Public 라우트가 `/(public)/[lang]/...`와 `/(public)/...`로 혼재하면,
  locale 소스 우선순위(URL 최우선), 링크 정책, 테스트 케이스가 분산된다.

목표(Mode A 기준):

- Public 페이지는 파일 시스템 기준으로 `apps/web/src/app/(public)/[lang]/**`로 통일한다.
- 비어드민 App 페이지(`(app)/**`)는 비-prefix 유지(Mode A 기본 정책).

현재 -> 목표(권장 매핑):

- `apps/web/src/app/(public)/[lang]/page.tsx` -> 유지
- `apps/web/src/app/(public)/pricing/page.tsx` -> `apps/web/src/app/(public)/[lang]/pricing/page.tsx`
- `apps/web/src/app/(public)/login/page.tsx` -> `apps/web/src/app/(public)/[lang]/login/page.tsx`
- `apps/web/src/app/(public)/signup/page.tsx` -> `apps/web/src/app/(public)/[lang]/signup/page.tsx`
- `apps/web/src/app/(public)/terms/page.tsx` -> `apps/web/src/app/(public)/[lang]/terms/page.tsx`
- `apps/web/src/app/(public)/privacy/page.tsx` -> `apps/web/src/app/(public)/[lang]/privacy/page.tsx`

마이그레이션 규칙:

- 전환 기간에는 레거시 비-prefix 경로를 삭제하지 말고, middleware redirect로 canonical 경로(`/[lang]/...`)로 수렴시킨다.
- canonical 경로 정착 후 레거시 파일/라우트를 제거한다(SEO 작업 전에 완료).

### 5.6B Public 공통 헤더 + 언어 변경 UX 표준

목표:

- Public 페이지(landing/pricing/login/signup/terms/privacy)에
  **경량 공통 헤더(브랜드 + 언어 변경)** 를 일관 적용한다.

권장 구성:

- 공통 헤더는 `apps/web/src/app/(public)/[lang]/layout.tsx`에서 주입한다.
- 필수 요소:
  - 브랜드/홈 링크
    - 브랜드 표기 정책: `ko` locale은 `빈방`, 그 외 locale(`en`, `ja`, `zh-CN`, `es-419`)은 `binbang`
  - 언어 변경 컨트롤(예: `ko` / `en` / `ja` / `zh-CN` / `es-419`)

언어 변경 동작 규칙(필수):

- 같은 페이지를 유지한 채 locale만 전환한다.
  - 예: `/ko/pricing?plan=pro` -> `/es-419/pricing?plan=pro`
- path와 query를 유지한다(불필요한 랜딩 페이지 복귀 금지).
- 로그인 사용자라면 언어 변경 시 `preferredLocale` 동기화 정책을 적용한다.
- 전환 후 화면 텍스트/포맷이 새 locale 기준으로 즉시 반영되어야 한다.

### 5.7 Middleware에서 locale 협상 + redirect(예시)

> 예시 코드는 “정책 레이어”를 보여준다. 실제 cookie 이름/헤더 이름은 프로젝트 정책에 맞춘다.

```ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SUPPORTED = new Set(['ko', 'en', 'ja', 'zh-CN', 'es-419'] as const);
type SupportedLocale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'es-419';
const DEFAULT_LOCALE = 'ko';

function mapToSupportedLocale(raw: string | null | undefined): SupportedLocale | null {
  if (!raw) return null;
  if (SUPPORTED.has(raw as SupportedLocale)) return raw as SupportedLocale;

  const normalized = raw.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('es')) return 'es-419';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ko')) return 'ko';
  return null;
}

function parseLocaleFromPath(pathname: string): SupportedLocale | null {
  const maybe = pathname.split('/')[1];
  return mapToSupportedLocale(maybe);
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // 1) URL에 locale이 이미 있으면 통과
  const urlLocale = parseLocaleFromPath(pathname);
  if (urlLocale) return NextResponse.next();

  // 2) 1차 협상(예시, Edge-safe): cookie -> Accept-Language -> default
  // DB(user preferredLocale)는 여기서 다루지 않는다(ADR-2 참고).
  const cookieLocale = mapToSupportedLocale(req.cookies.get('NEXT_LOCALE')?.value);
  const headerLocale = mapToSupportedLocale(req.headers.get('accept-language')?.split(',')[0]);

  const negotiated =
    cookieLocale ??
    headerLocale ??
    DEFAULT_LOCALE;

  // 3) redirect to /{locale}/...
  const url = req.nextUrl.clone();
  url.pathname = `/${negotiated}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/(?!api|_next|.*\\..*).*'],
};
```

### 5.7A 서버에서 2차 확정(DB 포함) 예시(개념)

이 예시는 “URL이 없는 모드(Mode A: App/Admin 비-prefix)”에서 특히 중요하다.

규칙(요약):

- URL locale이 있으면(Mode B 또는 Public) URL을 최우선으로 유지한다.
- URL locale이 없으면(Mode A의 App/Admin) 서버에서 session/user를 확인한 뒤
  - `preferredLocale`이 있으면 그 값을 사용하고,
  - 없으면 cookie/header/default를 사용한다.

```ts
// 개념 예시(실제 코드는 프로젝트 auth/session 구조에 맞춤)
type Locale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'es-419';

export async function resolveLocaleOnServer(input: {
  urlLocale: Locale | null;
  cookieLocale: Locale | null;
  headerLocale: Locale | null;
  userPreferredLocale: Locale | null;
  defaultLocale: Locale;
}): Promise<Locale> {
  if (input.urlLocale) return input.urlLocale;
  if (input.userPreferredLocale) return input.userPreferredLocale;
  return input.cookieLocale ?? input.headerLocale ?? input.defaultLocale;
}
```

### 5.8 `src/i18n/request.ts`에서 메시지 로딩(예시)

목표:

- 번역 리소스는 `apps/web/messages/{locale}/{namespace}.json`에서 로딩
- “필요한 namespace만” 조립해서 `next-intl`에 제공 (namespace slicing)

**구현 완료(2026-02-13)**: `middleware.ts`가 `x-pathname` 헤더를 전달하고, `request.ts`가 이를 읽어 `getNamespacesForPathname()`으로 필요한 namespace만 동적 `import()`한다. 전체 로드 fallback은 pathname 헤더가 없을 때(`getAllNamespaces()`)만 사용.

```ts
// apps/web/src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

type Locale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'es-419';
type Namespace = 'common' | 'auth';

async function loadNamespace(locale: Locale, ns: Namespace): Promise<Record<string, unknown>> {
  // 예시: JSON을 namespace 단위로 분리해두면, 필요한 것만 합칠 수 있다.
  // 실제 구현은 bundling/환경(Edge 여부)에 맞춰 조정한다.
  const mod = await import(`../../messages/${locale}/${ns}.json`);
  return (mod as { default: Record<string, unknown> }).default;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (requestLocale as Locale) ?? 'ko';

  // 예시: route group/page별로 필요한 namespace를 결정하는 규칙을 만든다.
  const namespaces: Namespace[] = ['common'];

  const messages = Object.assign({}, ...(await Promise.all(namespaces.map((ns) => loadNamespace(locale, ns)))));

  return { locale, messages };
});
```

### 5.9 Layout에서 Provider 주입(예시)

원칙:

- Server에서 messages를 준비하고, Client에는 필요한 messages만 전달
- `NextIntlClientProvider`는 “최소 범위”에 둔다(전체 root에 무조건 두지 않기)

```ts
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.ReactElement> {
  const messages = await getMessages();
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
```

### 5.10 Namespace slicing 운영 규칙(예시)

- “페이지/라우트 그룹 → 필요한 namespace 목록” 매핑을 코드로 고정한다.
- 리뷰에서 namespace 증가가 보이면 “왜 늘어났는지”가 설명되어야 한다.
- `common`은 정말 공통만 두고, 남용을 금지한다.

---

## 6. 패키지/경계 설계(모노레포 규칙 준수)

### 6.1 코어의 위치: `@workspace/shared`에 두되, “순수”를 유지

`rules.md`에 따라 universal 코드는 `@workspace/shared`가 적합하다.

- ✅ 코어에 허용되는 것
  - 타입/DTO/순수 함수
  - `Intl` 기반 포맷
  - 메시지 포맷터(외부 라이브러리) 사용(단, Node built-in/네트워크/환경변수 접근이 없어야 함)

- ❌ 코어에서 금지되는 것
  - `fs`, `path` 등 Node built-in을 사용한 파일 로딩
  - `process.env`
  - 네트워크로 번역 리소스 fetch

### 6.2 런타임 어댑터의 위치

- Web(Next)
  - `apps/web/src/lib/i18n-runtime/**` (코어 소비 + Next 친화 어댑터)

- Worker
  - `packages/worker-shared/src/runtime/i18n/**` (코어 소비 + 워커 전용 로딩/캐시)
  - env 접근은 반드시 `runtime/settings/**`에서만

> `apps/web`는 어떤 경우에도 `@workspace/worker-shared`를 import하면 안 된다.

추가 정책(사용자 승인 반영):

- `packages/worker-shared/src/i18n/**` 같은 **내부 폴더**를 둘 수 있다.
- 단, `@workspace/worker-shared`의 **public entrypoints(4개)** 규칙은 유지해야 한다.
  - 즉, 외부 소비자는 여전히 `@workspace/worker-shared/runtime` 등의 허용된 서브패스만 사용하고,
  - `src/i18n/**`는 **exports에 노출하지 않으며 deep import도 금지**를 유지한다.

### 6.3 번역 리소스의 소유권

- 소유권은 “배포 단위”를 따른다.
  - Web UI 번역 리소스: `apps/web` 소유
  - Worker/Email 번역 리소스: `packages/worker-shared` 또는 별도(하지만 top-level 신규는 금지)
- 단, “키/네임스페이스 설계”는 코어가 강제한다.

### 6.4 번역 리소스 소유권(단일 소스 vs 분리 소스) — 권장안

목표:

- Web/Worker가 각각 **자기 배포 단위에서 메시지 리소스를 소유**하면서도,
- 키/ICU 파라미터 정합성은 **단일 품질 게이트**로 강제한다.

권장안(분리 소스 + 강제 검증):

- Web: `apps/web/messages/{locale}/{namespace}.json`
- Worker/Email: `packages/worker-shared/messages/{locale}/{namespace}.json`
- CI에서
  - Web/Worker 각각의 리소스 정합성(키/ICU 파라미터)을 검사하고,
  - “공유해야 하는 namespace(예: `common`, `errors`)”는 **서로의 키 집합이 동일**해야 함을 강제한다.

이유:

- Web 리소스를 Worker가 직접 참조(또는 반대)하면, 빌드/배포 단위가 얽혀 운영 리스크가 커진다.
- Email/Notification 메시지는 Client로 절대 흘러가면 안 되므로(`payload`/bundle 관점), Worker 소유가 안전하다.

### 6.5 Namespace/채널 분리 규칙(페이로드/보안 관점)

- Client로 전달될 수 있는 namespace: `common`, `landing`, `auth`, `app`, `admin` 등 **UI 전용**
- Client로 절대 전달되면 안 되는 namespace: `email`, `notification`
- `errors`는 “UI 에러 메시지”와 “운영/내부 에러(진단)”를 분리한다.
  - 권장: `errors.public`(사용자 노출) vs `errors.internal`(로그/진단용, 사용자 노출 금지)

### 6.6 `packages/worker-shared/src/i18n/**` 내부 폴더 운용 가이드(사용자 승인 반영)

허용 범위:

- `packages/worker-shared/src/i18n/**`는 “내부 구현” 디렉터리로 둘 수 있다.
- 단, 외부 소비는 계속 **허용된 public entrypoints**(예: `@workspace/worker-shared/runtime`)를 통해서만 이루어져야 한다.

금지(불변식 유지):

- deep import(`@workspace/worker-shared/src/i18n/...`) 금지 유지
- `exports`에 `i18n` 카테고리를 추가해 “새 public entrypoint”를 만들지는 않는다(정책상 별도 합의 필요)

---

## 7. Locale 결정/전파 설계(RequestContext)

### 7.1 RequestContext 스키마(최소)

- `locale`: `ko` | `en` | `ja` | `zh-CN` | `es-419` (향후 `zh-TW`, `es-ES` 등 확장)
- `timeZone`: 예: `Asia/Seoul`
- `currency`: 예: `KRW`
- `source`: locale 결정 근거(디버깅/관측용)
  - `url` | `userProfile` | `cookie` | `acceptLanguage` | `default`

### 7.2 결정 알고리즘(표준 구현 요구)

`resolveLocale(input)`

- 입력: `url`, `cookies`, `acceptLanguage`, `user.preferredLocale`
- 출력: `{ locale, source }`

### 7.3 Web 전파 규칙

- middleware에서 1차 협상(가능하면 URL 정책 적용)
- SSR/RSC에서 `RequestContext` 생성
- Client에는 “표시/인터랙션”을 위해 locale을 내려주되, **진실의 원천은 서버**로 둔다.

### 7.4 Worker/Email 전파 규칙

- 이벤트(알림/메일) 생성 시 locale을 고정하지 않는다.
- **발송 시점**에 대상 사용자 `preferredLocale`을 조회해 렌더링한다.
  - 이유: 사용자가 설정을 바꿔도 다음 알림부터 반영되도록

### 7.5 사용자 선호 locale 데이터 모델/정책(계획)

목표:

- Web UI 토글/설정 화면에서 변경한 선호 언어가
  - 다음 로그인부터 UI에 반영되고,
  - Worker/Email 발송에도 반영된다.

권장 모델(개념):

- `User.preferredLocale: 'ko' | 'en' | 'ja' | 'zh-CN' | 'es-419' | null`
  - null이면 협상 결과(URL/cookie/header) 또는 기본값을 사용
- 변경은 인증된 사용자만 가능
- 저장 시 **supported locales**로 강제(검증 실패 시 거부)
- (선택) 변경 이력(누가/언제/어떤 값으로)을 감사 로그로 남김

주의:

- 이 문서는 아키텍처 계획서이며, 실제 Prisma 스키마/마이그레이션 변경은 별도 승인/절차가 필요하다.

### 7.6 locale 변경의 영향 범위(불변식)

- 동일 Request/Job 처리 중 locale은 바뀌지 않는다(불변식 유지).
- locale 변경은 “다음 요청/다음 발송”부터 반영된다.
- “감사/증거 목적”으로 발송 당시 locale을 고정해야 한다면
  - `renderedLocale`을 이벤트/발송 레코드에 저장하되,
  - core 정책은 여전히 “발송 시점 조회”가 기본이다.

---

## 8. 메시지 카탈로그 설계

### 8.1 파일 구조

정식(canonical) 경로(권장):

- Web: `apps/web/messages/{locale}/{namespace}.json`
- Worker/Email: `packages/worker-shared/messages/{locale}/{namespace}.json`

허용 예외(점진 마이그레이션용):

- Web의 레거시/정적 공개 리소스: `apps/web/public/locales/{locale}/{namespace}.json`
  - 단, 최종적으로는 `apps/web/messages/**`로 수렴하는 것을 목표로 한다.

레거시 경로 지원 정책(권장):

- `apps/web/public/locales/**`는 **장기 지원하지 않는다**.
- 전환 기간 동안 read-only 호환 경로로만 유지한다.
  - 신규 번역 추가/수정은 `apps/web/messages/**`에서만 수행한다.
- 종료 시점(EOL): **2026-06-30**
  - 2026-07-01부터 `apps/web/public/locales/**` 로딩 경로 제거
  - CI에서 `apps/web/public/locales/**` 변경 PR을 실패 처리(마이그레이션 예외 승인 제외)

예시

- `apps/web/messages/ko/common.json`
- `apps/web/messages/en/common.json`
- `packages/worker-shared/messages/ko/email.json`

### 8.2 키 네이밍 컨벤션

정의:

- “키”는 2-튜플로 다룬다: `namespace` + `messageKey`
- 문서에서의 정식 표기(canonical reference): `{namespace}:{messageKey}`
  - 예: `auth:login.title`

예시:

- `auth:login.title`
- `admin:users.table.empty`
- `email:case.conditionMet.subject`

금지

- 문장 자체를 키로 사용
- 문자열 연결로 문장 생성

### 8.3 ICU 템플릿 규칙

- 변수는 이름을 의미 있게
  - `{count}`, `{userName}`, `{platform}`
- locale 간 변수 집합이 동일해야 함

### 8.4 번역 리소스 로딩 인터페이스

코어가 요구하는 Loader 형태(개념)

- `loadMessages(locale, namespaces) -> Record<string, unknown>`
- 코어는 Loader 결과를 받아 `t()`에서 키를 조회/렌더링

> Loader 구현은 Web/Worker가 책임지고, 코어는 순수하게 유지한다.

### 8.5 번역하지 않는 문자열(예외 목록) — 정책으로 명시

원칙:

- “사용자에게 보이는 문자열은 key 기반”이 기본이지만,
- 예외는 **명확히 문서화**해 리뷰 가능해야 한다.

권장 예외:

- 브랜드/프로덕트 고유명사(예: 서비스명)
  - 본 서비스 표기 고정 규칙:
    - `ko` locale: `빈방`
    - `en`, `ja`, `zh-CN`, `es-419`: `binbang`
- 외부 서비스/제휴사 고유명사(번역하면 오히려 혼란)
- 법적 고정 문구 중 “번역본이 법적 효력을 갖지 않는” 경우(정책/법무 판단 필요)

금지:

- “편해서” 하드코딩(번역 비용 회피)하는 관행

---

## 9. 포맷팅(날짜/숫자/통화/상대시간) 표준

### 9.1 포맷은 `Intl`로 표준화

- 날짜: `Intl.DateTimeFormat`
- 숫자: `Intl.NumberFormat`
- 통화: `Intl.NumberFormat({ style: 'currency' })`
- 상대시간: `Intl.RelativeTimeFormat`

### 9.2 “표시 포맷”은 i18n의 일부다

- 동일한 값이라도 locale에 따라
  - 날짜 순서/표기
  - 1,000 단위 구분
  - 통화 기호
  - 상대시간 표현
  이 달라져야 한다.

### 9.3 timeZone/currency 기본값

- 기본 `timeZone`: `Asia/Seoul`
- 기본 `currency`: `KRW`
- 향후 사용자 설정으로 확장

### 9.4 포맷팅 “토큰화”(Design System) — 강력 권장

문제: 코드 곳곳에서 `new Intl.DateTimeFormat(...)`를 직접 호출하면, 제품 전반의 표기 일관성이 깨지고 (특히 Admin/Email/Worker) 유지보수 비용이 급격히 증가한다.

해결: `@workspace/shared`에 **포맷 프리셋(토큰)** 을 정의하고, 모든 포맷은 토큰을 통해서만 수행한다.

- **토큰 예시**
  - 날짜: `date.short`, `date.long`, `dateTime.short`, `dateTime.long`
  - 통화: `currency.krw`, `currency.usd`
  - 숫자: `number.compact`, `number.precise`
- **불변식**
  - 포맷 함수는 순수해야 하며(`@workspace/shared`), Node/Env/네트워크에 의존하지 않는다.
  - Server/Client/Worker에서 동일한 입력에 대해 같은 locale이면 같은 출력이 나와야 한다(동일 토큰 + 동일 locale).

---

## 10. SEO/공개 URL 정책 레이어

> i18n 코어와 분리된 “정책 레이어”다.

### 10.1 공개 페이지 URL 전략

- **권장**: Public(SEO 대상)만 locale prefix
  - `/ko/...`, `/en/...`, `/ja/...`, `/zh-CN/...`, `/es-419/...`
- 이유
  - canonical/hreflang/sitemap 설계가 단순해짐
  - 공유 링크의 의미가 명확해짐

### 10.2 메타데이터/링크 정책

- `<html lang>` locale 일치
- `hreflang` 제공
- locale별 sitemap

### 10.3 App/Admin

- SEO 비대상이라면 초기엔 prefix를 강제하지 않아도 됨
- 단, locale은 RequestContext로 동일하게 흐르도록 유지

---

## 11. 이메일/알림/워커 i18n

### 11.1 채널별 네임스페이스

- `email.*`
- `notification.*` (카카오/푸시 등)

### 11.2 렌더링 시점

- 발송 직전(Worker)에서
  - 사용자 locale 조회
  - `t()`로 subject/body 생성
  - 숫자/날짜 포맷 적용

주의(아키텍처 정책):

- “Job Payload에 locale을 반드시 포함”은 기본 정책이 아니다.
  - 기본은 **payload에는 `userId`(또는 recipient 식별자)만 포함**하고, 발송 시점에 DB의 `preferredLocale`을 조회해 적용한다.
  - 예외적으로 “증거/감사 목적”으로 발송 당시 locale을 고정해야 한다면, `renderedLocale`을 별도 필드로 저장하되(감사 로그), *payload 의존*으로 만들지 않는다.

### 11.3 감사/증거 목적 텍스트

- “운영/분쟁 대응용”으로 저장되는 텍스트는
  - 원문(예: ko)만 저장 + 사용자 노출 시 번역
  - 또는 사용자 노출 언어로 저장(정책 결정 필요)

권장

- **원문(기준 언어) + 구조화 데이터(JSON) 저장**
- 렌더링은 조회 시점에 locale로

---

## 12. 품질 게이트(정합성/타입/린트/테스트/관측)

### 12.1 정합성 검사(필수)

- 모든 locale이 동일한 key set을 가져야 한다.
- ICU 변수 파라미터가 locale 간 일치해야 한다.
- namespace별로 검사 가능해야 한다.

### 12.2 하드코딩 문자열 억제(강력 권장)

- “사용자에게 보이는 문자열”은
  - `t()`를 통해서만 표시
  - 예외: 로고/브랜드명/법적 고정 문구(정책으로 명시)

### 12.3 테스트(필수 최소)

- `resolveLocale()` 단위 테스트
- `t()` 렌더링 테스트(파라미터 치환, ICU plural 등)
- 키 정합성 검사 테스트(리소스 변경 시 자동)

### 12.4 관측(Prod 필수)

- missing-key 발생 카운트
  - 태그: `locale`, `namespace`
- fallback 사용 카운트

### 12.5 타입 안전성(Type Safety) — Codegen 기반(권장)

목표: `t('auth.loign')` 같은 오타를 “런타임”이 아니라 **컴파일 타임**에 차단한다.

원칙:

- 메시지 리소스(예: 기본 언어 `ko`)를 Source of Truth로 두고, TypeScript 타입을 **생성**한다.
- 생성된 타입은 `rules.md`의 Generated Artifact 규칙을 따라야 한다.
  - `**/generated/**` 같은 경로에 두고 git 추적에서 제외한다.
  - 생성 파일을 “소스 오브 트루스”로 취급하지 않는다(항상 JSON이 원천).

권장 설계(문서 레벨):

- **입력**: `apps/web/messages/ko/*.json` 또는 `apps/web/public/locales/ko/*.json`
- **출력**: `packages/shared/generated/i18n/` 하위의 `.d.ts` 또는 `.ts` 타입 파일(단, 커밋 금지)
- **CI**: PR에서 key set 정합성(12.1), `i18n:typegen` 실행, typecheck 통과를 함께 강제한다.

효과:

- 존재하지 않는 key 사용 시 컴파일 에러
- (선택) ICU 변수 파라미터 누락/불일치도 타입으로 일부 표현 가능(완전한 정적 검증은 어렵지만, 최소한의 안전장치로 충분한 가치가 있음)

### 12.6 Codegen/CI 파이프라인 명세(예시)

권장 스크립트(예시 이름):

- `pnpm i18n:typegen`
  - 입력(기본 locale, 예: `ko`)에서 key/type를 생성
  - 출력은 `packages/shared/generated/i18n/**` (gitignored)
- `pnpm i18n:check`
  - 모든 locale/namespace의 key set 정합성 검사
  - ICU 변수 파라미터 정합성 검사
- `pnpm i18n:ci`
  - `i18n:typegen` 실행(생성물은 git 추적 제외)
  - `i18n:check` 실행(키/ICU 파라미터 정합성)
  - `pnpm typecheck` 또는 `pnpm ci:check` 내 typecheck 단계가
    생성된 타입을 사용해 “키 오타/잘못된 사용”을 컴파일 타임에 차단

Generated Artifact 정책(강제):

- 생성물은 `rules.md` 규칙을 따라 `**/generated/**` 아래에만 둔다.
- 생성물은 커밋하지 않는다.
- 생성 실패/불일치가 있으면 CI는 실패해야 한다.

High 피드백 반영(검증 가능성):

- 생성물을 커밋하지 않는다면 “생성 결과 diff로 최신성 검증”은 기본적으로 성립하지 않는다.
  - 따라서 CI DoD는 “typegen 실행 + typecheck 통과 + i18n:check 통과”로 정의한다.
- (옵션) 정말로 diff 기반을 원하면, 별도의 “비생성 artifact(예: keys manifest)”를
  명시적으로 정의하고 커밋/검증 대상으로 삼아야 한다(추가 정책/합의 필요).

### 12.7 Missing-key 관측/알람 설계(운영 필수)

수집 대상:

- missing-key 발생(폴백 포함)
- ICU 렌더링 실패(파라미터 누락/타입 오류 등)

권장 이벤트/메트릭 스키마(개념):

- 이벤트명: `i18n_missing_key`
  - 필드: `locale`, `namespace`, `key`, `runtime`(web|worker), `route`(가능하면), `version`
- 메트릭: `i18n.missing_key.count`
  - 태그: `locale`, `namespace`, `runtime`

알람(예시):

- 5분 윈도우에서 missing-key가 0이 아니면 경고(초기 안정화 기간엔 임계치 완화 가능)
- 특정 key/namespace에서 지속 발생 시(예: 10분 이상) 에러로 격상

### 12.8 테스트 플랜(매트릭스) — 권장 최소

Locale 협상 테스트(Web):

- URL이 locale을 포함하는 경우: `/{lang}/...`는 항상 우선
- URL에 locale이 없는 경우:
  - middleware(Edge 1차): cookie/header/default로 redirect
  - server(2차): user profile의 `preferredLocale` 포함(ADR-2)
- 로그인 사용자: `preferredLocale`이 “다음 요청/다음 발송”에 반영되는지(7.6)

ICU/렌더링 테스트(공통):

- plural/select 동작
  - 파라미터 누락/타입 오류 시 동작(Dev/CI: 실패, Prod: 폴백+관측)

페이로드/성능 테스트(Web):

- 특정 페이지에서 messages payload 크기 상한(예: N KB)을 정하고 회귀를 탐지
  - namespace 추가가 “왜 필요한지” PR에서 설명되도록 가드

### 12.9 보안/프라이버시(번역 리소스) — 강제 규칙

- 번역 JSON에는 시크릿/토큰/서명값/내부 전용 URL을 넣지 않는다(ADR-8).
- 이메일/알림 템플릿은
  - “사용자에게 보내는 문자열”과
  - “로그/감사에 남기는 문자열”을 분리한다.
  - 로그에는 PII를 최소화(필요하면 마스킹)한다.

---

## 13. 성능/캐시/번들 전략

### 13.1 namespace 단위 로딩

- 화면이 필요한 namespace만 로딩
- 공통은 `common`

### 13.2 캐싱

- 서버(노드)에서는 메시지 카탈로그를 메모리 캐시 가능
- Edge 환경 대비가 필요하면
  - 빌드 타임 번들(정적 import) 전략 고려

### 13.3 버저닝

- 번역 리소스는 릴리즈 단위로 고정
- (선택) 해시 기반 파일명/manifest로 장기 캐시

### 13.4 Hydration/네트워크 페이로드 최적화 — 필수 원칙

문제: Client Component가 많아지면, 번역 메시지를 “통째로” client로 전달하는 순간 페이로드가 급증한다.

원칙:

- **Server First**: 가능하면 Server(RSC)에서 번역을 완료하고, Client에는 완성 문자열만 전달한다.
- **Namespace Slicing**: Client에 내려보내는 메시지는 “해당 페이지/컴포넌트가 실제로 사용하는 namespace”로 최소화한다.
- **공용/상수 메시지의 남용 금지**: `common`에 모든 걸 몰아넣지 않는다. 결국 client 페이로드가 커진다.

DoD(성능):

- “Client로 전달되는 messages payload”가 측정/관측 가능해야 한다(페이지 단위).
- 특정 임계치 초과 시(예: N KB) 빌드/리뷰 단계에서 탐지할 수 있는 가드(스크립트/리포트)를 둔다(필수).

권장 구현(필수 게이트):

- build 단계에서 “route별 messages payload(네임스페이스 슬라이싱 기준)”을 측정해 JSON 리포트로 남긴다.
- CI는 아래 중 하나라도 만족하면 실패한다(기본):
  - 절대 크기 초과: \(> N\) KB
  - 기준선 대비 증가율 초과: \(> X\%\)
- 기준선은 main 브랜치의 최신 리포트(또는 저장된 artifact)를 사용하고, PR에서는 diff를 계산한다.
- 리포트는 대시보드/모니터링으로 수집해 추세를 시각화한다(경고/알람 임계치 분리 권장).

### 13.5 Edge 런타임 제약(Next)과 메시지 로딩 표준

원칙:

- middleware는 Edge에서 실행될 수 있으므로, **절대 `fs`로 번역을 읽지 않는다**.
  - middleware의 책임은 “locale 협상/redirect”까지만이다.
- 메시지 로딩은
  - Node 런타임(server)에서는 fs/캐시 전략을 택할 수 있고,
  - Edge 런타임이 필요한 구간에서는 **정적 import(번들링)** 기반 로딩으로 표준화한다.

권장 표준:

- Web 어댑터(`next-intl`)의 `request.ts`는 “환경(Edge/Node)”에 따라 로딩 전략을 분기할 수 있어야 한다.
- Worker는 Node 전용이므로 fs 기반 로딩 + 메모리 캐시가 기본 전략이 된다.

### 13.6 Locale 확장(예: `en-US`, `en-GB`) 시 fallback 체인(표준)

목표:

- locale 확장 시에도 메시지 로딩/폴백이 런타임(웹/워커)마다 달라지지 않게 표준화한다.

권장 규칙:

- 지역 매핑(alias) 정책을 먼저 적용한다.
  - `zh-*` -> `zh-CN`
  - `es-*` -> `es-419`
- 요청 locale이 지역(locale)까지 포함하면,
  - 메시지는 `language-region` → `language` → `defaultLocale` 순으로 폴백한다.
  - 단, `language` 리소스가 없으면 해당 단계를 건너뛰고 `defaultLocale`로 폴백한다.

예시:

- `en-GB` 요청
  - `messages/en-GB/{ns}.json`가 없으면 `messages/en/{ns}.json`
  - `messages/en/{ns}.json`도 없으면 `messages/ko/{ns}.json`

주의:

- 포맷팅(`Intl`)에는 가능한 한 “요청 locale”을 유지하되,
  메시지 폴백으로 인해 표기가 뒤섞이지 않도록(예: 영문 메시지 + 한국식 통화 표기)
  `RequestContext.locale`(표시 locale)의 정의를 명확히 해야 한다.
  - 권장: 표시 locale(포맷 포함)은 “최종 확정 locale”로 단일화한다.

---

## 14. 마이그레이션 로드맵(세부 작업/DoD)

> 이 섹션은 구현 순서가 아니라 “아키텍처를 현실에 적용하기 위한 작업 단위”다.

## P0. 정책 고정 + 설계 확정 (반나절~1일)

### P0-1. ADR 확정(핵심 + 추가)

- 결정(예시, 현재 문서 기준 ADR-1~ADR-9)
  - 메시지 포맷(ICU)
  - locale 우선순위(2단계 협상 포함)
  - 지원 locale 세트/지역 매핑 정책
  - 누락 키 정책
  - 사용자 선호 locale 저장
  - Web 어댑터(`next-intl`) 선택
  - Key 라이프사이클/호환성
  - 분리 배포 버저닝 대응
  - 보안/프라이버시(번역 리소스)

#### 완료조건(DoD) — P0-1

- 이 문서(ADR)가 리뷰 가능 상태로 고정
- “예외/금지사항”이 명시됨

### P0-2. 언어 추가 프로세스(체크리스트) 문서화

목표:

- 새 언어 추가가 “사람 기억”이 아니라 “절차”가 되게 한다.

권장 체크리스트:

- `supportedLocales`/`defaultLocale` 업데이트
  - messages 디렉터리 생성(`{locale}/{namespace}.json`)
  - `pnpm i18n:check` 통과(키/ICU 파라미터)
  - Public SEO 정책(hreflang/sitemap/canonical) 반영 여부 확인
  - UI 깨짐(문장 길이/레이아웃) QA
  - Worker/Email 템플릿(해당 채널 namespace) 존재 여부 확인
  - 레거시 경로(`apps/web/public/locales/**`) 사용 여부 점검 및 EOL(2026-06-30) 영향 확인

#### 완료조건(DoD) — P0-2

- 새 언어 추가 PR 템플릿(체크박스)으로 활용 가능해야 한다.

---

## P1. i18n Core 설계/구현 (1~3일)

### P1-1. `@workspace/shared`에 i18n 코어 설계

#### 포함 요소(필수) — P1-1

- `Locale` 타입/정규화
- `resolveLocale()`
- `createI18n({ locale, loader, formatterOptions, missingKeyPolicy })`
- `t(key, params, { namespace })`
- `format.*`

#### 완료조건(DoD) — P1-1

- Node/Browser 어디서든 import 가능한 순수 코드
- Loader 없이도 테스트 가능한 구조(Loader 인터페이스 mock)

---

### P1-2. 키/ICU 파라미터 정합성 검사 도구

#### 내용 — P1-2

- `apps/web/messages/**`, `packages/worker-shared/messages/**`를 읽어
  - (전환 기간) 필요 시 `apps/web/public/locales/**`를 포함
  - key set 일치 검증
  - ICU 변수 집합 검증

#### 완료조건(DoD) — P1-2

- CI에서 실패/성공이 명확
- 에러 메시지가 “어떤 locale/namespace/key가 문제인지”를 정확히 출력

---

## P2. Web Runtime Adapter (2~5일)

### P2-1. Web용 locale 협상/컨텍스트 주입

#### 내용 — P2-1

- URL/쿠키/헤더/유저정보 기반 resolve
- SSR/RSC에서 i18n 인스턴스 생성

#### 완료조건(DoD) — P2-1

- 서버 렌더링 결과가 locale에 따라 결정적
- 클라이언트 토글이 서버 진실과 불일치하지 않음

---

### P2-1A. Public 라우팅 구조 정렬(`(public)/[lang]/**`)

#### 내용 — P2-1A

- Public 페이지 라우트를 `apps/web/src/app/(public)/[lang]/**`로 통일
- 레거시 비-prefix 경로는 middleware redirect로 canonical 경로로 유도
- 라우트 이동 후 페이지별 언어 변경 동작(토글/재렌더/링크)을 재검증

#### 완료조건(DoD) — P2-1A

- Public 주요 페이지(landing/pricing/login/signup/terms/privacy)의 canonical 경로가 `/[lang]/...`로 정렬
- 레거시 경로 접근 시 canonical로 일관 redirect
- SEO 작업(P2-2) 이전에 라우팅 정렬이 완료됨

---

### P2-1B. Public 공통 헤더/언어 변경 UX 적용

#### 내용 — P2-1B

- `apps/web/src/app/(public)/[lang]/layout.tsx`에 경량 Public 헤더 주입
- pricing/login/signup/terms/privacy/landing에서 동일 헤더 사용
- 언어 변경 시 현재 페이지 path/query 유지한 locale 전환

#### 완료조건(DoD) — P2-1B

- Public 주요 페이지에서 언어 변경 UI가 동일하게 노출
- 언어 변경 시 같은 페이지 유지 + 텍스트/포맷 재반영 확인
- 로그인 사용자 locale 변경 정책(`preferredLocale`)과 충돌 없음

---

### P2-2. Public SEO 정책 적용(선택: prefix)

실행 순서 정책(고정):

- 이 작업은 **비어드민 페이지의 번역 적용 + 페이지 내 언어 변경 동작**이 완료된 뒤,
  **마지막 단계**에서만 수행한다.

#### 내용 — P2-2

- `/ko/*`, `/en/*`, `/ja/*`, `/zh-CN/*`, `/es-419/*` 정책
- `hreflang`, `canonical`, sitemap

#### 완료조건(DoD) — P2-2

- 검색엔진이 locale별 페이지를 분리 인덱싱 가능
- 중복 canonical/중복 콘텐츠 경고 최소화

---

## P3. Worker/Email Adapter (2~5일)

### P3-1. Worker에서 locale 기반 렌더링

#### 내용 — P3-1

- 알림/메일 발송 직전 사용자 locale 로드
- `email`/`notification` namespace로 템플릿 렌더

#### 완료조건(DoD) — P3-1

- 사용자 locale 변경 후 다음 발송부터 반영
- 누락 키 발생 시 fallback + 관측 기록

---

## P4. 운영/가이드/정착 (지속)

### P4-1. 번역 워크플로우 확립

- 기본 언어를 소스로 두고 PR에서 번역을 채움
- 누락 키는 CI에서 차단

#### 완료조건(DoD) — P4-1

- 번역 리소스 수정 PR이 “검증 실패 없이” 머지 가능
- 번역 추가/수정이 재현 가능한 프로세스로 문서화

---

## 15. 리스크/대응

### R1. 초기엔 UI 하드코딩이 많아 마이그레이션 비용이 큼

- 대응: namespace 우선순위 + 단계적 적용(공개 페이지부터)

### R2. ICU 도입이 러닝커브를 만든다

- 대응: 공통 패턴을 `common`에 샘플로 제공 + lint/검증으로 실수를 조기에 차단

### R3. locale prefix 도입 시 링크/리다이렉트/캐시가 흔들릴 수 있음

- 대응: Public만 우선 적용 + App/Admin은 정책 레이어로 분리

---

## 16. 부록: 추천 디렉터리/파일 레이아웃

> “어떤 파일을 어디에 둘지”를 명확히 해서, 경계 위반을 구조적으로 방지한다.

### 16.1 `@workspace/shared` (universal)

```text
packages/shared/src/i18n/
  locale.ts                 # Locale 타입/정규화
  resolveLocale.ts          # 협상 로직
  messageKeys.ts            # key 타입(선택), 네임스페이스 규칙
  createI18n.ts             # t()/format.* 생성
  format.ts                 # Intl 포맷 유틸
  loaderTypes.ts            # Loader 인터페이스
  errors.ts                 # MissingKeyError 등
```

### 16.2 Web 어댑터

```text
apps/web/src/lib/i18n-runtime/
  server.ts                 # RSC/서버용 createI18n wiring
  client.ts                 # 클라이언트 provider(선택)
  seo.ts                    # hreflang/canonical helper(정책 레이어)
```

### 16.3 Worker 어댑터

```text
packages/worker-shared/src/runtime/i18n/
  server.ts                 # worker에서 createI18n wiring
  templates/
    email.ts                # 이메일 템플릿(키 기반)
    notification.ts         # 알림 템플릿(키 기반)
```

---

## 17. LLM 실행 운영 가이드(이 문서 단독)

이 섹션은 LLM이 **이 문서 하나만 읽고도** 구현을 시작/추적할 수 있도록 만든 실행 규약이다.

### 17.1 트리거 문구 규칙

사용자가 아래 문구 중 하나를 말하면, LLM은 즉시 17.2의 체크박스 보드를 기준으로 실행한다.

- `작업 진행하자`
- `i18n 작업 진행하자`
- `다음 작업 진행`

실행 절차(고정):

1. 17.2의 체크박스에서 **첫 번째 미완료(`- [ ]`) WU**를 찾는다.
2. 해당 WU **하나만** 구현한다(범위 확장 금지).
3. WU의 Verify 명령을 실행하고 결과를 기록한다.
4. 성공 시:
   - 해당 WU를 `- [x]`로 변경
   - `Done Date`에 완료일(`YYYY-MM-DD`) 기입
   - 17.4 Progress Log에 1줄 추가
5. 실패/차단 시:
   - 체크박스는 그대로 둔다.
   - WU의 `Blocker`를 채운다.
   - 사용자에게 필요한 결정 1개만 질문한다.

### 17.2 Work Units 체크박스 보드

- [x] WU-01 Locale 기본 타입/상수 추가
  - Scope: `Locale`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE` 정의
  - Allowed Files: `packages/shared/src/i18n/locale.ts`, 관련 테스트 파일
  - DoD: 타입/상수 export + 테스트 통과
  - Verify: `pnpm --filter @workspace/shared test`, `pnpm --filter @workspace/shared typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-02 `resolveLocale()` 순수 함수 구현
  - Scope: URL > DB > Cookie > Accept-Language > Default
  - Allowed Files: `packages/shared/src/i18n/resolveLocale.ts`, 관련 테스트 파일
  - DoD: `source`(`url|userProfile|cookie|acceptLanguage|default`) 포함 반환
  - Verify: `pnpm --filter @workspace/shared test`, `pnpm --filter @workspace/shared typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-03 Loader/에러 타입 정의
  - Scope: 런타임 독립 인터페이스/에러 타입 확정
  - Allowed Files: `packages/shared/src/i18n/loaderTypes.ts`, `packages/shared/src/i18n/errors.ts`
  - DoD: Node/Browser/Worker에서 공용 타입으로 import 가능
  - Verify: `pnpm --filter @workspace/shared typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-04 `createI18n()` + `t()` 최소 구현
  - Scope: key 조회, 파라미터 치환, missing-key 정책(Dev/CI fail, Prod fallback)
  - Allowed Files: `packages/shared/src/i18n/createI18n.ts`, 관련 테스트 파일
  - DoD: 핵심 경로 단위테스트 통과
  - Verify: `pnpm --filter @workspace/shared test`, `pnpm --filter @workspace/shared typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-05 `format.*` 토큰 유틸 구현
  - Scope: 날짜/숫자/통화/상대시간 토큰 API
  - Allowed Files: `packages/shared/src/i18n/format.ts`, 관련 테스트 파일
  - DoD: 동일 locale + 동일 토큰 입력 시 결정적 출력
  - Verify: `pnpm --filter @workspace/shared test`, `pnpm --filter @workspace/shared typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-06 Web middleware 1차 협상 적용
  - Scope: Edge-safe 협상(cookie/header/default) + redirect, DB 접근 금지
  - Allowed Files: `apps/web/src/middleware.ts`, 관련 테스트 파일
  - DoD: URL locale가 있으면 pass, 없으면 1차 협상 redirect
  - Verify: `pnpm --filter @workspace/web test`, `pnpm --filter @workspace/web typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-07 Web 서버 2차 확정(DB 포함)
  - Scope: URL 미존재 케이스에서 `preferredLocale` 반영
  - Allowed Files: `apps/web/src/lib/i18n-runtime/server.ts`, 관련 호출부/테스트
  - DoD: 서버에서 세션/유저 컨텍스트 기반 locale 확정
  - Verify: `pnpm --filter @workspace/web test`, `pnpm --filter @workspace/web typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-08 `request.ts` namespace slicing 적용
  - Scope: 페이지/그룹별 최소 namespace 로딩
  - Allowed Files: `apps/web/src/i18n/request.ts`, 필요 시 매핑 파일
  - DoD: `apps/web/messages/**` 기준으로 필요한 namespace만 주입
  - Verify: `pnpm --filter @workspace/web test`, `pnpm --filter @workspace/web typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-09 Worker i18n runtime 적용
  - Scope: 발송 직전 locale 조회 + `email`/`notification` 렌더링
  - Allowed Files: `packages/worker-shared/src/runtime/i18n/**`, 필요 시 `packages/worker-shared/src/runtime/evidence.ts`
  - DoD: payload locale 고정 의존 없이 렌더링
  - Verify: `pnpm --filter @workspace/worker-shared test`, `pnpm --filter @workspace/worker-shared typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-10 i18n 정합성 검사 스크립트
  - Scope: key set/ICU 파라미터/공유 namespace parity 검사
  - Allowed Files: `scripts/i18n/check.*`, 루트 `package.json` scripts
  - DoD: 실패 시 locale/namespace/key를 명확히 출력
  - Verify: `pnpm i18n:check`, `pnpm typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-11 i18n typegen 파이프라인
  - Scope: 메시지 key 타입 생성(`packages/shared/src/generated/i18n/**`, 비커밋)
  - Allowed Files: `scripts/i18n/typegen.*`, 루트 `package.json`, `.gitignore`(필요 시)
  - DoD: key 오타가 typecheck에서 실패
  - Verify: `pnpm i18n:typegen`, `pnpm typecheck`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-12 CI 게이트 + 레거시 경로 차단
  - Scope: `i18n:ci` 강제, `apps/web/public/locales/**` 변경 차단(EOL 정책 반영)
  - Allowed Files: `.github/workflows/*.yml`, `scripts/i18n/**`, 루트 `package.json`
  - DoD: 승인 없는 레거시 경로 변경 PR 실패
  - Verify: `pnpm ci:check` (또는 CI 워크플로우 검증 명령)
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-13 EOL 이후 레거시 경로 제거
  - Scope: `apps/web/public/locales/**` 로딩/참조 제거
  - Allowed Files: web i18n 로더/참조 코드, 필요 시 `apps/web/public/locales/**` 삭제
  - DoD: 메시지 소스가 `apps/web/messages/**`로 단일화
  - Verify: `pnpm i18n:check`, `pnpm --filter @workspace/web typecheck`, `pnpm --filter @workspace/web test`
  - Done Date: `2026-02-12`
  - Blocker: `-`

- [x] WU-14 Public 라우팅 구조 정렬(`(public)/[lang]/**`)
  - Scope: Public 페이지 파일 구조를 `[lang]` prefix 기준으로 통일
  - Allowed Files: `apps/web/src/app/(public)/**`, `apps/web/src/middleware.ts`, 관련 테스트 파일
  - DoD: pricing/login/signup/terms/privacy의 canonical 경로가 `/[lang]/...`로 정렬
  - Verify: `pnpm --filter @workspace/web test`, `pnpm --filter @workspace/web typecheck`
  - Done Date: `2026-02-13`
  - Blocker: `-`

- [x] WU-15 비어드민 페이지 언어 변경 동작 완료
  - Scope: Public 공통 헤더(언어 변경 UI) + 비어드민 페이지 locale 전환 동작 구현/검증
  - Allowed Files: `apps/web/src/app/(public)/**`, `apps/web/src/app/(app)/**`, `apps/web/src/lib/i18n/**`, 관련 테스트 파일
  - DoD: 17.3의 `Public 공통 헤더(언어 변경)` + `언어 변경 동작` 체크가 대상 페이지에서 완료
  - Verify: `pnpm --filter @workspace/web test`, `pnpm --filter @workspace/web typecheck`
  - Done Date: `2026-02-13`
  - Blocker: `-`

- [x] WU-16 Public SEO 최적화 마무리(최종 단계)
  - Scope: `hreflang`/`canonical`/sitemap 정합성 마무리
  - Allowed Files: `apps/web/src/app/(public)/**`, `apps/web/src/lib/i18n-runtime/seo.ts`, sitemap 관련 코드, 관련 테스트
  - DoD: 17.3의 Public 페이지에서 `SEO 최적화(마지막)` 체크 완료
  - Verify: `pnpm --filter @workspace/web test`, `pnpm --filter @workspace/web typecheck`, `pnpm ci:check`
  - Done Date: `2026-02-13`
  - Blocker: `-`

### 17.3 비어드민 페이지별 적용 매트릭스(체크박스)

적용 원칙:

- Public 페이지는 `/(public)/[lang]/**`로 라우팅 구조를 먼저 정렬한다.
- Public 페이지는 공통 헤더(브랜드 + 언어 변경 UI)를 동일하게 사용한다.
- 각 페이지는 **언어 변경 동작**(페이지에서 locale 전환 후 텍스트/포맷 반영)이 완료되어야 한다.
- Public 페이지의 **SEO 최적화 체크는 마지막 단계에서만** 수행한다.
  - 선행 조건: 해당 페이지의 `라우팅 구조 정렬([lang])` + `Public 공통 헤더(언어 변경)` + `텍스트 i18n 적용` + `언어 변경 동작` 체크 완료

| 페이지 | 현재 라우트 파일 | 목표 라우트 파일 | 라우팅 구조 정렬([lang]) | Public 공통 헤더(언어 변경) | 텍스트 i18n 적용 | 언어 변경 동작 | SEO 최적화(마지막) | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Landing | `apps/web/src/app/(public)/[lang]/page.tsx` | `apps/web/src/app/(public)/[lang]/page.tsx` | [x] | [x] | [x] | [x] | [x] | PublicHeader variant=landing 한 줄, next-intl landing |
| Pricing | `apps/web/src/app/(public)/[lang]/pricing/page.tsx` | `apps/web/src/app/(public)/[lang]/pricing/page.tsx` | [x] | [x] | [x] | [x] | [x] | PublicHeader variant=pricing 한 줄, useSession |
| Login | `apps/web/src/app/(public)/[lang]/login/page.tsx` | `apps/web/src/app/(public)/[lang]/login/page.tsx` | [x] | [x] | [x] | [x] | [x] | PublicHeader variant=auth |
| Signup | `apps/web/src/app/(public)/[lang]/signup/page.tsx` | `apps/web/src/app/(public)/[lang]/signup/page.tsx` | [x] | [x] | [x] | [x] | [x] | PublicHeader variant=auth |
| Terms | `apps/web/src/app/(public)/[lang]/terms/page.tsx` | `apps/web/src/app/(public)/[lang]/terms/page.tsx` | [x] | [x] | [x] | [x] | [x] | PublicHeader variant=legal, 홈으로 |
| Privacy | `apps/web/src/app/(public)/[lang]/privacy/page.tsx` | `apps/web/src/app/(public)/[lang]/privacy/page.tsx` | [x] | [x] | [x] | [x] | [x] | PublicHeader variant=legal, 홈으로 |
| Dashboard | `apps/web/src/app/(app)/dashboard/page.tsx` | `apps/web/src/app/(app)/dashboard/page.tsx` | N/A | N/A | [ ] | [ ] | N/A | SEO 비대상 |
| Accommodations New | `apps/web/src/app/(app)/accommodations/new/page.tsx` | `apps/web/src/app/(app)/accommodations/new/page.tsx` | N/A | N/A | [ ] | [ ] | N/A | SEO 비대상 |
| Accommodation Detail | `apps/web/src/app/(app)/accommodations/[id]/page.tsx` | `apps/web/src/app/(app)/accommodations/[id]/page.tsx` | N/A | N/A | [ ] | [ ] | N/A | SEO 비대상 |
| Subscription Settings | `apps/web/src/app/(app)/settings/subscription/page.tsx` | `apps/web/src/app/(app)/settings/subscription/page.tsx` | N/A | N/A | [ ] | [ ] | N/A | SEO 비대상 |

### 17.4 Progress Log (체크박스와 함께 업데이트)

- `2026-02-12`: `WU-01` 완료 — `locale.ts`(Locale/SUPPORTED_LOCALES/DEFAULT_LOCALE/isSupportedLocale/normalizeLocale) + `./i18n` export + 테스트 18개 통과, typecheck 통과
- `2026-02-12`: `WU-02` 완료 — `resolveLocale.ts`(URL>userProfile>cookie>acceptLanguage>default 우선순위) + 테스트 14개 통과, typecheck 통과
- `2026-02-12`: `WU-03` 완료 — `loaderTypes.ts`(MessageLoader/I18nOptions/MissingKeyPolicy) + `errors.ts`(MissingKeyError/MessageFormatError), typecheck 통과
- `2026-02-12`: `WU-04` 완료 — `createI18n.ts`(t() key 조회/파라미터 치환/missing-key error+fallback 정책/fallbackMessages/onMissingKey 콜백) + 테스트 16개 통과, typecheck 통과
- `2026-02-12`: `WU-05` 완료 — `format.ts`(formatDate/formatNumber/formatCurrency/formatRelativeTime + 토큰 프리셋) + 테스트 23개 통과, typecheck 통과
- `2026-02-12`: `WU-06` 완료 — `middleware.ts` 리팩터(shared i18n 코어 사용: parseLocaleFromPath+negotiateLocale), `.ts` 확장자 제거(cross-package 호환), web test 157개 + typecheck 통과
- `2026-02-12`: `WU-07` 완료 — `i18n-runtime/server.ts`(resolveServerLocale: cookies+headers 자동 읽기, urlLocale/userPreferredLocale 파라미터) + 테스트 7개 통과, web test 164개 + typecheck 통과
- `2026-02-12`: `WU-08` 완료 — `src/i18n/request.ts`(getNamespacesForRoute+loadMessages+getRequestMessages), route group→namespace 선언적 매핑, `messages/{locale}/{ns}.json` 구조, 테스트 9개 통과, web test 173개 + typecheck 통과
- `2026-02-12`: `WU-09` 완료 — worker i18n runtime(loader+templates+userLocale), conditionTrigger 구조화 페이로드 전환, caseNotifications 레거시/구조화 양방향 호환, 메시지 ko/en notification.json, 테스트 11개 통과, ci:check 통과
- `2026-02-12`: `WU-10` 완료 — `scripts/i18n/check.mjs`(key parity+param parity+빈 값 검사), apps/web+worker-shared messages 대상, `pnpm i18n:check` 스크립트 추가, ci:check 통과
- `2026-02-12`: `WU-11` 완료 — `scripts/i18n/typegen.mjs`(ko 기준 namespace별 key union 타입 생성), 출력 `packages/shared/src/generated/i18n/messages.ts`(gitignored), `pnpm i18n:typegen` 스크립트 추가, WebMessages/WorkerMessages/TypedTranslateFunction 타입 제공, ci:check 통과
- `2026-02-12`: `WU-12` 완료 — `scripts/i18n/check-legacy.mjs`(레거시 경로 변경 차단, EOL 2026-06-30), `pnpm i18n:ci`(typegen+check+check-legacy 통합), `.github/workflows/ci.yml`에 `pnpm i18n:ci` 단계 추가, ci:check 통과
- `2026-02-12`: `WU-13` 완료 — `apps/web/public/locales/` 삭제, `landing.json` → `messages/{ko,en}/landing.json` 이동, `getLandingCopy()` 경로 업데이트, i18n:check(common 13 + landing 40 keys), ci:check 통과
- `2026-02-13`: `WU-14` 완료 — Public 페이지(login/signup/pricing/terms/privacy) `(public)/[lang]/` 하위로 이동, middleware에 locale 협상 redirect 추가(PUBLIC_PATHS), 모든 내부 링크 `/${lang}/...` 패턴으로 통일(landing 6개 컴포넌트 + 3개 client 페이지), `generateStaticParams` 추가, ci:check 통과
- `2026-02-13`: 구현 상태 반영 — Public 전 페이지에 LangToggle 적용(경로 유지 전환), pricing/login/signup/terms/privacy는 next-intl(auth, legal, pricing namespace) 적용, 랜딩은 getLandingCopy(landing.json) 유지. 지원 언어 ko/en. 공통 헤더는 layout 주입 없이 페이지별 구성. request.ts는 전체 namespace 일괄 로드.
- `2026-02-13`: `WU-15` 완료 — Public 공통 헤더 `PublicHeader`(브랜드+LangToggle)를 `(public)/[lang]/layout.tsx`에서 주입. pricing/terms/privacy/login/signup에서 중복 브랜드·LangToggle 제거. Landing Header는 브랜드·LangToggle 제거 후 네비/테마/로그인만 유지(sticky top-14). web test 173개 + typecheck 통과.
- `2026-02-13`: PublicHeader 단일·한 줄 통합 — `lang`/`variant` props, pathname 기반 variant(landing/pricing/auth/legal/default). 랜딩: Landing Header 제거, LandingPage는 layout PublicHeader만 사용. pricing/terms/privacy: 페이지 내 헤더·뒤로가기 제거, PublicHeader 한 줄로 통합(pricing은 useSession으로 대시보드/로그인·가입 분기). MobileMenu: useTranslations 기반(copy 제거), 터치 44px·접근성·시트 닫힌 뒤 scrollIntoView 350ms 지연(포커스 복원으로 인한 상단 스크롤 방지).
- `2026-02-13`: `WU-16` 완료 — Public SEO: `lib/i18n-runtime/seo.ts`(getBaseUrl, buildPublicAlternates), sitemap locale prefix + alternates.languages, Public 각 페이지(landing/pricing/login/signup/terms/privacy) canonical + alternates.languages(ko/en). login/signup은 layout generateMetadata. 17.3 SEO 열 [x] 처리.
- `2026-02-13`: 랜딩 텍스트 i18n 전환 — `getLandingCopy` 제거, `lib/i18n/landing.ts`는 config 재export만. LandingPage 및 Hero/Features/Footer/CTAButtons/AppPurpose/StatusDashboard/StatusDashboardSlot은 `useTranslations('landing')`·`useMessages()`·`useParams()` 사용. 17.3 Landing 행 텍스트 i18n [x].
- `2026-02-13`: Locale 타입 통일 — `apps/web/src/lib/i18n/config.ts`(`Lang`/`supportedLangs`/`isValidLang`) 제거, 15개 소비 파일을 `@workspace/shared/i18n`(`Locale`/`SUPPORTED_LOCALES`/`isSupportedLocale`)로 이전. ci:check 통과(291 tests).
- `2026-02-13`: Namespace slicing 적용 — `namespaces.ts` 순수 함수 재작성(fs 의존 제거), middleware `x-pathname` 헤더 전달, `request.ts`에서 pathname 기반 최소 namespace만 동적 `import()`. 테스트 13개 추가. ci:check 통과(295 tests).
- `YYYY-MM-DD`: `-`

---

## 18. 관련 문서

- [rules.md](../../rules.md) — 모노레포 경계 규칙(최우선)
- [RULES_SUMMARY.md](../../RULES_SUMMARY.md) — 규칙 요약
- [docs/architecture/](../architecture/) — 아키텍처 문서 모음
