# Phase 4: SEO + i18n (한/영)

Status: IN PROGRESS
Priority: MEDIUM
Depends on: Phase 3
Last updated: 2026-02-24
Implementation note: 2026-02-24 — 기술 구현 항목 7개 완료 (데이터 투입·Search Console 제출은 별도 진행)

## Goal

구글 검색을 통한 유기적 트래픽 확보를 위해 랜딩 페이지와 여행지별 SEO 페이지를 구축한다. next-intl을 도입하여 한국어/영어 UI를 지원한다.

## Traffic Funnel

```
구글 검색 "경주 여행 추천"
  → /ko/destinations/gyeongju (SSR 페이지)
    → "AI에게 경주에 대해 물어보기" CTA
      → /ko/chat?context=gyeongju (AI 채팅 시작)
```

## Decision Snapshot (2026-02-24)

| 항목 | 결정 | 근거 |
|------|------|------|
| i18n 라이브러리 | next-intl (App Router 전용) | RSC 지원, `useTranslations` / `getTranslations` API, middleware locale 감지 내장 |
| 기본 locale | `en` (영어) | 글로벌 유기적 트래픽 확보 우선; 한국어 사용자는 Accept-Language 감지로 `/ko` 리다이렉트 |
| URL prefix 정책 | `localePrefix: 'always'` | `/ko/...` `/en/...` 명시적 URL로 hreflang SEO 신호 극대화 |
| 여행지 페이지 렌더링 | ISR (`revalidate: 86400`) | 빌드 비용 최소화 + 최신 데이터 보장; 핫 여행지는 on-demand revalidation 확장 가능 |
| 콘텐츠 생성 | OpenAI(`gpt-4o-mini`) 자동 생성 + 수동 검수 | AI 생성으로 30개 여행지 초기 투입 비용 절감, 품질 게이트는 `published=false` 플래그 |
| 이미지 소스 | Unsplash API (무료 티어) | Google Places 사진 API 대비 저비용; 추후 Google Places로 보강 가능 |
| 여행지 데이터 | Prisma `Destination` 모델 | 한/영 JSON 필드로 단일 레코드 다국어 관리 |
| Sitemap | Next.js `sitemap.ts` (App Router) | 동적 여행지 목록을 DB에서 직접 조회하여 자동 생성 |
| GA 연동 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경 변수 | Phase 5 분석 이벤트와 연계, script는 layout에 삽입 |
| 채팅 locale 동기화 | API 요청 body에 `locale` 필드 추가 | 시스템 프롬프트에 언어 지시문 삽입 → AI 응답 언어 일치 |

## 핵심 아키텍처

```text
Next.js App Router
  ├── middleware.ts (locale 감지 → /[locale] 리다이렉트)
  ├── src/i18n.ts (locales, defaultLocale 설정)
  ├── messages/
  │     ├── ko.json  (한국어 메시지)
  │     └── en.json  (영어 메시지)
  └── src/app/[locale]/
        ├── layout.tsx     (NextIntlClientProvider, 메타태그, hreflang)
        ├── page.tsx       (랜딩 페이지, WebApplication JSON-LD)
        ├── chat/page.tsx  (AI 채팅)
        └── destinations/
              ├── page.tsx          (여행지 목록, ItemList JSON-LD, ISR 1h)
              └── [slug]/page.tsx   (여행지 상세, TouristDestination JSON-LD, ISR 24h)

콘텐츠 파이프라인
  scripts/generateDestinations.ts
    → OpenAI API (`gpt-4o-mini`, 한/영 동시 생성)
    → Prisma Destination 테이블 (published=false)
    → 검수 후 published=true
    → ISR 페이지 자동 반영

SEO 크롤링 흐름
  sitemap.xml (generateSitemap) ← DB 여행지 목록
  robots.txt ← 크롤러 허용 정책
  Google Search Console ← 사이트맵 제출
```

## 파일 매핑

| 도메인 | 파일 | 상태 |
|--------|------|------|
| i18n 설정 | `apps/travel/src/i18n.ts` | ✅ 완료 |
| Middleware | `apps/travel/src/middleware.ts` | ✅ 완료 |
| 한국어 메시지 | `apps/travel/messages/ko.json` | ✅ 완료 (`destinations`, `landing.destinations` 네임스페이스 추가) |
| 영어 메시지 | `apps/travel/messages/en.json` | ✅ 완료 (`destinations`, `landing.destinations` 네임스페이스 추가) |
| Locale 레이아웃 | `apps/travel/src/app/[locale]/layout.tsx` | ✅ 완료 (GA Script 조건부 렌더링 추가) |
| 랜딩 페이지 | `apps/travel/src/app/[locale]/page.tsx` | ✅ 완료 (ISR 1h + 인기 여행지 Top 6 그리드 추가) |
| 채팅 페이지 | `apps/travel/src/app/[locale]/chat/page.tsx` | ✅ 완료 |
| 여행지 목록 | `apps/travel/src/app/[locale]/destinations/page.tsx` | ✅ 완료 |
| 여행지 상세 | `apps/travel/src/app/[locale]/destinations/[slug]/page.tsx` | ✅ 완료 |
| DestinationDetail | `apps/travel/src/components/destinations/DestinationDetail.tsx` | ✅ 완료 |
| DestinationGrid | `apps/travel/src/components/destinations/DestinationGrid.tsx` | ✅ 완료 (검색 바, 클라이언트 필터링, 12개 페이지네이션, i18n 추가) |
| 언어 전환 UI | `apps/travel/src/components/LanguageSwitcher.tsx` | ✅ 완료 |
| Destination 서비스 | `apps/travel/src/services/destination.service.ts` | ✅ 완료 |
| 콘텐츠 생성 스크립트 | `apps/travel/src/scripts/generateDestinations.ts` | ✅ 완료 |
| DB 스키마 | `packages/db/prisma/schema.prisma` (`Destination` 모델) | ✅ 완료 |
| Sitemap | `apps/travel/src/app/sitemap.ts` | ✅ 완료 |
| Robots.txt | `apps/travel/src/app/robots.ts` | ✅ 완료 |
| GA 스크립트 | `apps/travel/src/app/[locale]/layout.tsx` (Script 태그 추가) | ✅ 완료 |
| AI locale 동기화 | `apps/travel/src/lib/ai/systemPrompt.ts`, `route.ts`, `useChatComposer.ts`, `ChatPanel.tsx` | ✅ 완료 |

## Rollout Scope

### Stage A — i18n + 랜딩 + 기본 SEO (진행 중)

**next-intl 설정 (완료)**
- [x] next-intl 패키지 설치 및 `apps/travel/src/i18n.ts` 설정
- [x] `apps/travel/messages/ko.json` (한국어), `en.json` (영어) 메시지 파일
- [x] `apps/travel/src/middleware.ts` — locale 감지 + `localePrefix: 'always'` 리다이렉트
- [x] `apps/travel/src/app/[locale]/layout.tsx` — `NextIntlClientProvider`, hreflang, OG 메타태그
- [x] `apps/travel/src/app/[locale]/chat/page.tsx` — 채팅 페이지 locale 라우팅

**기존 UI 다국어화 (완료)**
- [x] 헤더, 채팅 입력 플레이스홀더, 추천 질문, 버튼 텍스트
- [x] 에러 메시지, Rate Limit 문구, 복원 안내 문구
- [x] 카드 라벨 (평점, 날씨 단위, 환율 등)
- [x] `LanguageSwitcher` 컴포넌트 (헤더에 한/영 토글)

**랜딩 페이지 (완료)**
- [x] 히어로 섹션: 서비스 소개 + CTA
- [x] 기능 소개 섹션: AI 채팅, 날씨, 환율, 지도
- [x] 푸터: 서비스 정보, 링크
- [x] JSON-LD `WebApplication` 구조화 데이터
- [x] OG 메타태그, Twitter Card
- [x] P4-1-T1: 인기 여행지 그리드 (Top 6, ISR 1h, `/{locale}/destinations/{slug}` 링크)
- [ ] P4-1-T1: 사용 예시 / 데모 미리보기 섹션 (미구현 유지)

**URL 구조 (완료)**
- [x] `/ko`, `/en` — 언어별 랜딩
- [x] `/ko/chat`, `/en/chat` — 언어별 채팅
- [x] `/ko/destinations/[slug]`, `/en/destinations/[slug]` — 여행지 상세
- [x] 기본 locale `en` 설정
- [x] Accept-Language 헤더 기반 locale 감지 미들웨어
- [x] hreflang 태그 자동 생성 (layout + destination 페이지)

### Stage B — 여행지 SEO + 콘텐츠 + GA (미완료)

**여행지 데이터 모델 + 서비스 (완료)**
- [x] P4-2-T1: `Destination` Prisma 모델 설계 및 마이그레이션
- [x] `apps/travel/src/services/destination.service.ts` — `getDestinationBySlug`, `getPublishedDestinations`

**여행지 페이지 (부분 완료)**
- [x] P4-2-T2: `[locale]/destinations/[slug]/page.tsx` — ISR 24h, JSON-LD `TouristDestination`
- [x] `DestinationDetail` 컴포넌트 — 여행지 개요, 주요 관광지, 기후·환율 정보, "AI에게 물어보기" CTA
- [x] `[locale]/destinations/page.tsx` — 목록 페이지, JSON-LD `ItemList`, ISR 1h
- [x] `DestinationGrid` 컴포넌트

**여행지 콘텐츠 (완료/미완료)**
- [x] P4-2-T3: `scripts/generateDestinations.ts` — OpenAI(`gpt-4o-mini`) 기반 한/영 콘텐츠 자동 생성 스크립트
- [ ] P4-2-T4: 초기 여행지 30개 데이터 실제 투입 + `published=true` 처리
  - 아시아 16 (일본 3, 한국 3, 동남아 8, 중동/서아시아 2)
  - 유럽 8 (프랑스 2, 영국 1, 이탈리아 3, 스페인 2)
  - 미주/오세아니아 6 (미국 3, 호주 2, 뉴질랜드 1)
- [x] P4-2-T5: 여행지 목록 페이지 검색 기능 (클라이언트 사이드, nameKo/nameEn/country 포함 검색)
- [x] P4-2-T5: 여행지 목록 페이지 국가별 필터 (기존 유지 + i18n 적용)
- [x] P4-2-T5: 여행지 목록 페이지 페이지네이션 (12개/페이지)

**SEO 기반 요소 (완료/미완료)**
- [x] P4-3-T1: `apps/travel/src/app/sitemap.ts` — published 여행지 ko/en URL, 정적 라우트 포함
- [x] P4-3-T2: `apps/travel/src/app/robots.ts` — `/api/`, `/login`, `/monitoring` 차단, sitemap URL 명시
- [ ] P4-3-T5: Google Search Console 도메인 인증 + 사이트맵 제출 (운영 작업)
- [x] P4-3-T6: Google Analytics 연동 — `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경 변수 존재 시 조건부 Script 삽입

**AI 응답 언어 동기화 (완료)**
- [x] P4-4-T5: `/api/chat` 요청 body에 `locale` 필드 추가
  - `apps/travel/src/app/api/chat/route.ts` — `locale` 파라미터 수신 (zod 스키마 포함)
  - `apps/travel/src/lib/ai/systemPrompt.ts` — `buildTravelSystemPrompt(summary, locale)` locale 파라미터 추가
  - `apps/travel/src/hooks/useChatComposer.ts` — `ChatRequestBody`, `UseChatComposerOptions`에 `locale` 추가
  - `apps/travel/src/components/chat/ChatPanel.tsx` — `useLocale()` hook으로 locale 전달

**Phase 3 연계 (미완료)**
- [ ] 여행지 상세 페이지에서 숙소 추천 시 `AccommodationCard` + Awin 제휴 링크 표시
  - `/chat?destination=gyeongju` 파라미터로 채팅 컨텍스트 사전 설정
  - 채팅에서 해당 여행지 숙소 자동 추천 트리거

## DB 스키마

```prisma
model Destination {
  id          String   @id @default(cuid())
  slug        String   @unique    // "gyeongju", "tokyo"
  nameKo      String              // "경주"
  nameEn      String              // "Gyeongju"
  country     String              // "South Korea"
  countryCode String              // "KR"
  description Json                // { ko: "...", en: "..." }
  highlights  Json                // { ko: ["...", ...], en: ["...", ...] }
  weather     Json?               // { jan: { avgTemp: 2, rainfall: 30 }, ... }
  currency    String?             // "KRW"
  latitude    Float
  longitude   Float
  imageUrl    String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([country])
  @@index([published])
}
```

## Environment Variables (New)

```dotenv
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console (도메인 인증용 메타태그 또는 파일)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-token

# Unsplash (여행지 이미지)
UNSPLASH_ACCESS_KEY=your-access-key

# OpenAI (여행지 콘텐츠 생성 스크립트)
OPENAI_API_KEY=your-openai-api-key

# ISR On-Demand Revalidation (선택)
REVALIDATION_TOKEN=random-secret-for-revalidate-endpoint
```

## Acceptance Criteria

- [ ] 구글에서 "경주 여행" 검색 시 `/ko/destinations/gyeongju` 페이지 노출 가능
- [ ] 랜딩 페이지에서 AI 채팅으로의 자연스러운 전환
- [ ] 한국어/영어 UI 전환이 URL 기반으로 동작 (`/ko`, `/en`)
- [ ] sitemap.xml에 모든 published 여행지 페이지가 정확히 포함 (ko/en 양쪽)
- [ ] Lighthouse SEO 점수 90+
- [ ] 여행지 페이지 LCP < 2.5s (ISR)
- [ ] 한국어 UI에서 AI도 한국어로 응답
- [ ] `/` 진입 시 Accept-Language 헤더 기반 locale 리다이렉트 정상 동작
- [ ] hreflang 태그가 모든 페이지에 정확히 포함

## QA 시나리오

| ID | 시나리오 | 절차 | 기대 결과 |
|----|---------|------|----------|
| `TC-P4-01` | 한국어 리다이렉트 | `Accept-Language: ko`로 `/` 접근 | `/ko`로 리다이렉트 |
| `TC-P4-02` | 영어 리다이렉트 | `Accept-Language: en`으로 `/` 접근 | `/en`으로 리다이렉트 |
| `TC-P4-03` | 언어 전환 | `/ko/chat`에서 언어 전환 UI 클릭 | `/en/chat`으로 전환, UI 텍스트 변경 |
| `TC-P4-04` | 여행지 SEO | `/ko/destinations/tokyo` 접근 | 한국어 콘텐츠, TouristDestination JSON-LD 포함 |
| `TC-P4-05` | hreflang 확인 | 여행지 상세 페이지 HTML 검사 | `<link rel="alternate" hreflang="ko/en">` 포함 |
| `TC-P4-06` | 메타 태그 | 랜딩/여행지 페이지 head 검사 | title, description, OG, Twitter Card 정상 |
| `TC-P4-07` | sitemap | `/sitemap.xml` 접근 | 모든 published 여행지 ko/en URL 포함 |
| `TC-P4-08` | robots.txt | `/robots.txt` 접근 | `/api/*` 차단, sitemap 명시 |
| `TC-P4-09` | AI 응답 언어 | `/ko/chat`에서 질문 | AI 응답이 한국어로 제공됨 |
| `TC-P4-10` | ISR 동작 | 여행지 데이터 업데이트 후 | 24시간 또는 on-demand revalidate 후 반영 |
| `TC-P4-11` | Lighthouse SEO | 랜딩/여행지 페이지 Lighthouse 실행 | SEO 점수 90+ |

## Risk Register

| Risk ID | 리스크 | 감지 신호 | 완화 전략 |
|---------|--------|-----------|-----------|
| `R-P4-01` | 기존 `/chat` 경로 북마크 깨짐 | 404 증가 | middleware에서 `/chat` → `/en/chat` 리다이렉트 추가 |
| `R-P4-02` | OpenAI 생성 콘텐츠 품질 미달 | `published=false`로 블로킹 | 검수 게이트: 생성 후 수동 확인 + `published=true` 수동 승인 |
| `R-P4-03` | ISR 빌드 시 DB 연결 실패 | 빌드 타임아웃 | `dynamicParams=true` + `generateStaticParams` 제거로 빌드 독립성 유지 |
| `R-P4-04` | hreflang 오류로 SEO 페널티 | Search Console 경고 | 레이아웃·페이지별 alternates 자동 생성, 배포 후 Search Console 검증 필수 |
| `R-P4-05` | Unsplash API Rate Limit | 이미지 로딩 실패 | 이미지 URL DB 저장 + CDN 캐싱; Rate limit 시 placeholder 폴백 |
| `R-P4-06` | 다국어 메시지 키 누락 | UI에 키 문자열 노출 | `fallback: ko` 설정 (번역 누락 시 한국어 폴백) + CI에서 키 일치 검증 |

## Technical Notes

### next-intl 구현 패턴

```typescript
// 서버 컴포넌트 (RSC)
import { getTranslations } from 'next-intl/server';
const t = await getTranslations({ locale, namespace: 'chat' });

// 클라이언트 컴포넌트
import { useTranslations } from 'next-intl';
const t = useTranslations('chat');
```

### ISR 전략

- 여행지 상세 (`[slug]`): `revalidate = 86400` (24시간) — 데이터 안정적
- 여행지 목록 (`/destinations`): `revalidate = 3600` (1시간) — 신규 여행지 반영
- 랜딩 페이지: `revalidate = 3600` (1시간) — 인기 여행지 그리드(Top 6) 포함으로 ISR 적용
- On-demand revalidation: `REVALIDATION_TOKEN` 기반 `/api/revalidate` 엔드포인트 (선택)

### 콘텐츠 생성 파이프라인

```bash
# 여행지 콘텐츠 생성 실행
pnpm --filter @workspace/travel generate:destinations

# 생성 후 수동 검수 → published=true 처리
# DB 직접 업데이트 또는 Admin 패널 활용
```

- OpenAI(`gpt-4o-mini`)를 사용해 각 여행지의 한/영 설명, 하이라이트, 여행 팁 동시 생성
- `published=false`로 생성 → 검수 후 `published=true`
- `generateStaticParams` 활성화는 데이터 투입 완료 후 진행

### AI 응답 언어 동기화

```typescript
// apps/travel/src/app/api/chat/route.ts
const { messages, sessionId, conversationId, locale } = await req.json();

// apps/travel/src/lib/ai/systemPrompt.ts
const languageInstruction = locale === 'ko'
  ? '반드시 한국어로 답변하세요.'
  : 'Always respond in English.';
```

### 메시지 파일 키 네이밍 규칙

- 형식: `feature.scope.state` (기존 문서 `phase2-phase3-ui-ux-requirements.md` 27.2절 준수)
- 길이 제한: 버튼 12자, 토스트 40자, 배너 60자
- `fallback`: 번역 누락 시 한국어 기본 문구 (`i18n.ts`의 `defaultLocale: 'en'`과 별개로 메시지 fallback은 ko)
- 변수 삽입: `{count}`, `{name}` 형태만 허용

### Sitemap 구현 예시

```typescript
// apps/travel/src/app/sitemap.ts
import { getPublishedDestinations } from '@/services/destination.service';

export default async function sitemap() {
  const destinations = await getPublishedDestinations();
  const locales = ['ko', 'en'];

  const destinationUrls = destinations.flatMap((dest) =>
    locales.map((locale) => ({
      url: `https://travel.moodybeard.com/${locale}/destinations/${dest.slug}`,
      lastModified: dest.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  return [
    { url: 'https://travel.moodybeard.com/ko', priority: 1.0 },
    { url: 'https://travel.moodybeard.com/en', priority: 1.0 },
    { url: 'https://travel.moodybeard.com/ko/destinations', priority: 0.9 },
    { url: 'https://travel.moodybeard.com/en/destinations', priority: 0.9 },
    ...destinationUrls,
  ];
}
```

### 초기 여행지 30개 배분

| 국가/권역 | 개수 | 도시 |
|------|------|-----------|
| 일본 | 3 | 도쿄, 오사카, 교토 |
| 한국 | 3 | 서울, 부산, 제주 |
| 태국 | 3 | 방콕, 푸켓, 치앙마이 |
| 프랑스 | 2 | 파리, 니스 |
| 이탈리아 | 3 | 로마, 베네치아, 피렌체 |
| 영국 | 1 | 런던 |
| 스페인 | 2 | 바르셀로나, 마드리드 |
| 미국 | 3 | 뉴욕, 로스앤젤레스, 샌프란시스코 |
| 싱가포르 | 1 | 싱가포르 |
| 호주 | 2 | 시드니, 멜버른 |
| 뉴질랜드 | 1 | 오클랜드 |
| 베트남 | 2 | 하노이, 호치민 |
| 말레이시아 | 1 | 쿠알라룸푸르 |
| 인도네시아 | 1 | 발리 |
| 아랍에미리트 | 1 | 두바이 |
| 터키 | 1 | 이스탄불 |

### Phase 3 연계 포인트

- 여행지 상세 페이지 CTA: `/[locale]/chat?destination=[slug]`
- 채팅 진입 시 `context` 파라미터로 `searchAccommodation` 자동 트리거
- 여행지 페이지의 숙소 추천 섹션 → `AccommodationCard` + Awin 제휴 링크 (Phase 3 구현 재사용)

### 비용 고려사항

| 항목 | 예상 비용 | 비고 |
|------|-----------|------|
| OpenAI 콘텐츠 생성 (30개) | ~$0.30 | `gpt-4o-mini` 기준, 여행지당 약 $0.01 내외 |
| Unsplash API | 무료 | 50 req/hour 무료 티어 |
| ISR 재빌드 (CDN) | 미미 | Vercel/Cloudflare 무료 티어 범위 |
| Google Analytics | 무료 | |
| Google Search Console | 무료 | |
