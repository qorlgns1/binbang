# SEO 전략 가이드: 빈방어때

## 1. 핵심 키워드 전략

### 주요 타겟 키워드

**1차 키워드 (Primary)**

- 숙소 빈방 알림
- 숙소 예약 모니터링
- 에어비앤비 알림
- 아고다 알림
- 숙소 가격 알림

**2차 키워드 (Secondary)**

- 인기 숙소 예약
- 품절 숙소 알림
- 숙소 가격 추적
- 숙소 실시간 알림
- 카카오톡 숙소 알림

**롱테일 키워드 (Long-tail)**

- "에어비앤비 예약 못한 숙소 알림"
- "인기 숙소 빈자리 나오면 알림"
- "숙소 가격 변동 추적 서비스"
- "해외 숙소 예약 모니터링"

### 브랜드 키워드와의 연결

브랜드 메시지를 키워드에 자연스럽게 녹이기:

- "24시간 모니터링" → "잠든 사이에도 당신을 지키는"
- "실시간 알림" → "누구보다 빨리 전하는 가장 밝은 소식"
- "정확한 추적" → "어떤 풍랑에도 흔들림 없는 정교함"

## 2. 메타데이터 최적화

### Title 태그 전략

```html
<!-- 홈페이지 -->
<title>빈방어때 - 숙소 빈방 알림 서비스 | 에어비앤비·아고다 실시간 모니터링</title>

<!-- 요금제 페이지 -->
<title>요금제 안내 - 빈방어때 | 1분마다 체크하는 숙소 알림</title>

<!-- 대시보드 -->
<title>내 대시보드 - 빈방어때</title>
```

**Title 작성 원칙**

- 50-60자 이내 (모바일 고려)
- 핵심 키워드 앞쪽 배치
- 브랜드명 포함
- 클릭을 유도하는 문구

### Meta Description 전략

```html
<!-- 홈페이지 -->
<meta
  name="description"
  content="원하는 숙소가 품절됐나요? 빈방어때가 1분마다 자동으로 체크해서 빈방이 생기면 즉시 카카오톡으로 알려드립니다. 에어비앤비, 아고다 지원. 무료로 시작하세요."
/>

<!-- 요금제 페이지 -->
<meta
  name="description"
  content="빈방어때 요금제를 확인하세요. FREE 플랜으로 무료 체험 후 업그레이드 가능. 1분마다 자동 체크, 실시간 카카오톡 알림, 가격 추이 분석까지."
/>
```

**Description 작성 원칙**

- 120-155자 이내
- 행동 유도 문구 (CTA) 포함
- 핵심 가치 제안 명시
- 브랜드 톤 유지 (차분하고 격려하는)

### Open Graph (OG) 태그

```html
<!-- 소셜 미디어 공유 최적화 -->
<meta
  property="og:type"
  content="website"
/>
<meta
  property="og:title"
  content="빈방어때 - 당신의 휴식이 길을 잃지 않도록"
/>
<meta
  property="og:description"
  content="1분마다 체크하는 숙소 빈방 알림 서비스. 잠든 사이에도 당신을 지킵니다."
/>
<meta
  property="og:image"
  content="https://binbang.moodybeard.com/og-image.png"
/>
<meta
  property="og:url"
  content="https://binbang.moodybeard.com"
/>

<!-- Twitter Card -->
<meta
  name="twitter:card"
  content="summary_large_image"
/>
<meta
  name="twitter:title"
  content="빈방어때 - 숙소 빈방 알림 서비스"
/>
<meta
  name="twitter:description"
  content="1분마다 체크하는 숙소 빈방 알림. 누구보다 빨리 전하는 가장 밝은 소식."
/>
<meta
  name="twitter:image"
  content="https://binbang.moodybeard.com/twitter-image.png"
/>
```

## 3. 구조화된 데이터 (Schema.org)

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "빈방어때",
  "description": "1분마다 자동으로 체크하는 숙소 빈방 알림 서비스",
  "url": "https://binbang.moodybeard.com",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  }
}
```

### Service Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "숙소 빈방 모니터링 알림",
  "provider": {
    "@type": "Organization",
    "name": "빈방어때"
  },
  "areaServed": "KR",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "요금제",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "FREE 플랜"
        }
      }
    ]
  }
}
```

### FAQ Schema (랜딩 페이지)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "빈방어때는 어떻게 작동하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "1분마다 자동으로 숙소 예약 페이지를 확인하고, 빈방이 생기면 즉시 카카오톡으로 알려드립니다."
      }
    }
  ]
}
```

## 4. 컨텐츠 SEO 전략

### URL 구조

```
✅ 좋은 예시:
- /pricing (요금제)
- /accommodations/new (숙소 등록)
- /dashboard (대시보드)
- /login (로그인)

❌ 나쁜 예시:
- /p123 (의미 없음)
- /accommodations?action=create (쿼리 파라미터)
```

### 내부 링크 전략

**Hub & Spoke 모델**

```
홈페이지 (Hub)
├─ 요금제 페이지
├─ 대시보드
│  ├─ 숙소 관리
│  └─ 설정
├─ 로그인
└─ 회원가입
```

**Anchor Text 최적화**

```tsx
// ❌ 나쁜 예시
<Link href="/pricing">여기를 클릭하세요</Link>

// ✅ 좋은 예시
<Link href="/pricing">요금제 확인하기</Link>
<Link href="/accommodations/new">숙소 등록하기</Link>
```

### 시맨틱 HTML

```tsx
// ✅ 올바른 구조
<main>
  <article>
    <header>
      <h1>빈방어때 - 숙소 빈방 알림</h1>
    </header>
    <section>
      <h2>주요 기능</h2>
      {/* 컨텐츠 */}
    </section>
  </article>
</main>

// ❌ 피해야 할 구조
<div>
  <div>
    <div class="title">빈방어때</div>
  </div>
</div>
```

## 5. 페이지별 SEO 체크리스트

### 랜딩 페이지 (/)

- [ ] H1 태그에 핵심 키워드 포함
- [ ] Hero 섹션에 명확한 가치 제안
- [ ] 브랜드 메시지와 키워드의 자연스러운 조화
- [ ] CTA 버튼 명확성 ("무료로 시작하기")
- [ ] FAQ 섹션 추가 (롱테일 키워드 타겟)
- [ ] 구조화된 데이터 삽입

### 요금제 페이지 (/pricing)

- [ ] 플랜 비교 테이블 (시맨틱 마크업)
- [ ] 각 플랜의 혜택 명확히 표현
- [ ] "무료 플랜" 강조 (진입 장벽 낮추기)
- [ ] FAQ 섹션 (가격 관련 질문)

### 대시보드 (/dashboard)

- [ ] noindex 태그 (개인 정보 보호)
- [ ] 빠른 로딩 속도
- [ ] 명확한 내부 링크

### 404 페이지

- [ ] 브랜드 메시지 유지
- [ ] 명확한 네비게이션
- [ ] 홈/대시보드로 복귀 링크

## 6. 기술적 SEO

### Core Web Vitals 목표

```
✅ LCP (Largest Contentful Paint): < 2.5s
✅ FID (First Input Delay): < 100ms
✅ CLS (Cumulative Layout Shift): < 0.1
```

### 이미지 최적화

```tsx
// Next.js Image 사용 (이미 적용됨)
<Image
  src='/hero.png'
  alt='빈방어때 - 숙소 빈방 알림 서비스 대시보드'
  width={800}
  height={600}
  priority // Hero 이미지
  quality={85}
/>
```

**Alt 텍스트 작성 원칙**

- 이미지 내용 설명 + 맥락
- 키워드 자연스럽게 포함
- 50자 이내

### robots.txt

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /accommodations/
Disallow: /settings/

Sitemap: https://binbang.moodybeard.com/sitemap.xml
```

### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://binbang.moodybeard.com/</loc>
    <lastmod>2026-02-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://binbang.moodybeard.com/pricing</loc>
    <lastmod>2026-02-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://binbang.moodybeard.com/login</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

## 7. 브랜드 톤과 SEO의 조화

### 컨텐츠 작성 원칙

**브랜드 메시지를 키워드에 자연스럽게 녹이기**

❌ **키워드 스터핑** (나쁜 예)

```
빈방어때는 숙소 빈방 알림 서비스입니다.
숙소 빈방 알림을 원하시면 빈방어때를 사용하세요.
빈방어때 숙소 빈방 알림은 최고입니다.
```

✅ **자연스러운 통합** (좋은 예)

```
원하는 숙소가 품절됐나요?
빈방어때가 1분마다 자동으로 체크해서
빈방이 생기면 즉시 알려드립니다.

잠든 사이에도 당신을 지키는 성실함.
```

### 브랜드 메시지 활용

| 브랜드 메시지                         | SEO 키워드 통합                  |
| ------------------------------------- | -------------------------------- |
| "당신의 휴식이 길을 잃지 않도록"      | → "예약 못한 숙소도 놓치지 않고" |
| "밤새 불을 밝혀둘게요"                | → "24시간 자동 모니터링"         |
| "누구보다 빨리 전하는 가장 밝은 소식" | → "실시간 빈방 알림"             |
| "어떤 풍랑에도 흔들림 없는 정교함"    | → "정확한 가격 추적"             |

## 8. 로컬 SEO (향후 확장)

### Google Business Profile

- 서비스 카테고리: "소프트웨어 회사"
- 설명에 핵심 키워드 포함
- 정기적인 포스트 업데이트

### 리뷰 관리

- 사용자 후기 섹션 추가
- Schema.org Review 마크업
- 평점 및 리뷰 수 표시

## 9. 실행 우선순위

### Phase 1: 기초 (즉시 실행)

1. [ ] 모든 페이지에 적절한 Title/Description 추가
2. [ ] OG 태그 추가
3. [ ] 이미지 Alt 텍스트 최적화
4. [ ] robots.txt, sitemap.xml 생성

### Phase 2: 컨텐츠 (1-2주)

5. [ ] 랜딩 페이지 FAQ 섹션 추가
6. [ ] 구조화된 데이터 삽입
7. [ ] 내부 링크 구조 점검

### Phase 3: 고도화 (1개월)

8. [ ] 블로그/가이드 섹션 추가
9. [ ] 사용자 후기 시스템
10. [ ] Core Web Vitals 최적화

## 10. 성과 측정

### KPI (Key Performance Indicators)

- **유기적 트래픽**: Google Analytics
- **키워드 순위**: Google Search Console
- **전환율**: 회원가입 / 방문자 수
- **Core Web Vitals**: PageSpeed Insights

### 모니터링 도구

- Google Search Console
- Google Analytics 4
- Naver Search Advisor (한국 시장)

---

**작성일**: 2026-02-07
**버전**: v1.0
**담당**: SEO Team
