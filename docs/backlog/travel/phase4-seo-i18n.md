# Phase 4: SEO + i18n (한/영)

Status: NOT STARTED
Priority: MEDIUM
Depends on: Phase 3

## Goal

구글 검색을 통한 유기적 트래픽 확보를 위해 랜딩 페이지와 여행지별 SEO 페이지를 구축한다. next-intl을 도입하여 한국어/영어 UI를 지원한다.

## Traffic Funnel

```
구글 검색 "경주 여행 추천"
  → /ko/destinations/gyeongju (SSR 페이지)
    → "AI에게 경주에 대해 물어보기" CTA
      → /ko/chat?context=gyeongju (AI 채팅 시작)
```

## Tasks

### P4-1: 랜딩 페이지

- [ ] P4-1-T1: 랜딩 페이지 디자인 및 구현 (`apps/travel/src/app/[locale]/page.tsx`)
  - 히어로 섹션: 서비스 소개 + CTA ("Start Planning")
  - 기능 소개 섹션: AI 채팅, 실시간 날씨, 환율 비교, 지도
  - 인기 여행지 그리드 (→ 여행지 페이지 링크)
  - 사용 예시 / 데모 미리보기
  - 푸터: 서비스 정보, 링크
- [ ] P4-1-T2: OG 메타태그, Twitter Card 설정
- [ ] P4-1-T3: 구조화된 데이터 (JSON-LD: WebApplication, FAQPage)

### P4-2: 여행지별 SEO 페이지

- [ ] P4-2-T1: 여행지 데이터 모델 설계

```prisma
model Destination {
  id          String   @id @default(cuid())
  slug        String   @unique    // "gyeongju", "tokyo"
  nameKo      String              // "경주"
  nameEn      String              // "Gyeongju"
  country     String              // "South Korea"
  countryCode String              // "KR"
  description Json                // { ko: "...", en: "..." }
  highlights  Json                // 주요 관광지 목록
  weather     Json?               // 월별 기후 요약
  currency    String?             // "KRW"
  latitude    Float
  longitude   Float
  imageUrl    String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([country])
}
```

- [ ] P4-2-T2: 여행지 페이지 구현 (`apps/travel/src/app/[locale]/destinations/[slug]/page.tsx`)
  - SSR (generateStaticParams + ISR revalidate)
  - 여행지 개요, 주요 관광지, 기후 정보, 환율 정보
  - "AI에게 물어보기" CTA 버튼
  - 관련 여행지 추천
- [ ] P4-2-T3: AI 기반 여행지 콘텐츠 자동 생성 스크립트
  - Gemini로 각 여행지 설명, 하이라이트, 여행 팁 자동 생성
  - 한국어/영어 동시 생성
  - DB에 저장하는 seed 스크립트
- [ ] P4-2-T4: 초기 여행지 데이터 투입 (Top 30 여행지)
- [ ] P4-2-T5: 여행지 목록 페이지 (`/[locale]/destinations`)
  - 국가별/지역별 필터
  - 검색 기능
  - 페이지네이션

### P4-3: SEO 기반 요소

- [ ] P4-3-T1: `sitemap.xml` 자동 생성 (Next.js generateSitemap)
  - 랜딩 페이지, 여행지 페이지 모두 포함
  - 한국어/영어 alternate hreflang
- [ ] P4-3-T2: `robots.txt` 설정
- [ ] P4-3-T3: 각 페이지별 메타 태그 최적화 (title, description, canonical)
- [ ] P4-3-T4: 구조화된 데이터 (JSON-LD: TouristDestination, BreadcrumbList)
- [ ] P4-3-T5: Google Search Console 연동 및 사이트맵 제출
- [ ] P4-3-T6: Google Analytics 연동 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)

### P4-4: next-intl 도입 (한/영)

- [ ] P4-4-T1: next-intl 패키지 설치 및 설정
  - `apps/travel/src/i18n.ts` - 설정 파일
  - `apps/travel/messages/ko.json` - 한국어 메시지
  - `apps/travel/messages/en.json` - 영어 메시지
- [ ] P4-4-T2: App Router 구조 변경
  - `apps/travel/src/app/[locale]/layout.tsx`
  - `apps/travel/src/app/[locale]/page.tsx`
  - middleware.ts로 locale 감지 및 리다이렉트
- [ ] P4-4-T3: 기존 UI 컴포넌트 다국어 처리
  - 헤더, 채팅 입력 플레이스홀더, 예시 질문, 버튼 텍스트
  - 에러 메시지, 빈 상태 메시지
  - 카드 라벨 (평점, 가격, 날씨 단위 등)
- [ ] P4-4-T4: 언어 전환 UI (헤더에 한/영 토글)
- [ ] P4-4-T5: AI 응답 언어와 UI 언어 동기화
  - 시스템 프롬프트에 현재 locale 전달
  - 사용자가 한국어 UI면 AI도 한국어로 응답하도록 가이드

### P4-5: URL 구조

- [ ] P4-5-T1: URL 패턴 정의
  - `/ko` - 한국어 랜딩
  - `/en` - 영어 랜딩
  - `/ko/chat` - 한국어 채팅
  - `/en/chat` - 영어 채팅
  - `/ko/destinations/gyeongju` - 한국어 여행지 페이지
  - `/en/destinations/gyeongju` - 영어 여행지 페이지
- [ ] P4-5-T2: 기본 locale 설정 (영어)
- [ ] P4-5-T3: locale 감지 미들웨어 (Accept-Language 헤더 기반)
- [ ] P4-5-T4: hreflang 태그 자동 생성

## Acceptance Criteria

- [ ] 구글에서 "경주 여행" 검색 시 `/ko/destinations/gyeongju` 페이지 노출 가능
- [ ] 랜딩 페이지에서 AI 채팅으로의 자연스러운 전환
- [ ] 한국어/영어 UI 전환이 URL 기반으로 동작
- [ ] sitemap.xml에 모든 페이지가 정확히 포함
- [ ] Lighthouse SEO 점수 90+
- [ ] 여행지 페이지 LCP < 2.5s (SSR/ISR)

## Technical Notes

- next-intl: App Router 호환, RSC 지원
- ISR revalidate: 여행지 페이지는 24시간마다 재생성
- 이미지: 여행지 대표 이미지는 Unsplash API 또는 Google Places 사진
- 초기 여행지 30개: 아시아 15, 유럽 10, 기타 5 배분 추천
