# Phase 4 미구현 항목 구현 계획

## Context

`phase4-seo-i18n.md`에 정의된 미구현 항목들을 구현한다.
next-intl 기반 App Router 구조, Prisma Destination 모델, destination.service.ts는 이미 구현됨.
다음 7개 항목이 남아있음:

1. 랜딩 페이지 인기 여행지 그리드 (Top 6)
2. 여행지 목록 페이지 검색 + 페이지네이션
3. sitemap.ts
4. robots.ts
5. Google Analytics 연동
6. AI 응답 언어 동기화 (locale → systemPrompt)
7. i18n 메시지 키 추가 (destinations, landing.destinations)

---

## 구현 계획

### Step 1. i18n 메시지 키 추가

**파일:** `apps/travel/messages/ko.json`, `apps/travel/messages/en.json`

**ko.json 추가 위치 — `"landing"` 객체 안에:**
```json
"destinations": {
  "title": "인기 여행지",
  "subtitle": "AI와 함께 특별한 여행지를 발견하세요",
  "viewAll": "모든 여행지 보기"
}
```

**ko.json 최상위에 새 네임스페이스 추가:**
```json
"destinations": {
  "searchPlaceholder": "여행지 검색...",
  "filterAll": "전체",
  "noResults": "검색 결과가 없습니다",
  "resultCount": "{count}개의 여행지",
  "prev": "이전",
  "next": "다음",
  "pageInfo": "{current} / {total} 페이지"
}
```

en.json도 동일 구조 (영어 번역).

---

### Step 2. DestinationGrid — 검색 + 페이지네이션 추가

**파일:** `apps/travel/src/components/destinations/DestinationGrid.tsx`

클라이언트 사이드 (30개 이하 데이터라 서버 쿼리 불필요):
- 상단에 `<input>` 검색 바 추가 (placeholder: `t('destinations.searchPlaceholder')`)
- 검색어 → `nameKo`, `nameEn`, `country` 포함 여부로 클라이언트 필터
- 기존 국가 필터 버튼 유지
- 검색어 변경 시 페이지를 0으로 리셋
- 국가 필터 변경 시 페이지를 0으로 리셋
- `ITEMS_PER_PAGE = 12` 상수 정의
- 하단 페이지네이션: "이전/다음" 버튼 + 페이지 정보
- `useTranslations('destinations')` 사용 (하드코딩된 영어 문자열 교체)

**상태:**
```typescript
const [search, setSearch] = useState('');
const [currentPage, setCurrentPage] = useState(0);
```

**필터링 순서:** destinations → 국가필터 → 검색어 → 페이지네이션 슬라이싱

---

### Step 3. 랜딩 페이지 인기 여행지 그리드

**파일:** `apps/travel/src/app/[locale]/page.tsx`

- `export const revalidate = 3600` 추가 (ISR: 1시간마다 재생성)
- 서버 컴포넌트에서 `getPublishedDestinations({ limit: 6 })` 호출
- `LandingPageClient`에 `destinations` prop으로 전달
- Features 섹션과 Footer 사이에 "Popular Destinations" 섹션 삽입
- 카드: `DestinationGrid` 재사용 **하지 않음** (필터/페이지네이션 불필요)
- 인라인으로 간단한 2×3 그리드 (md:grid-cols-3) 카드 렌더링
- 각 카드: 이미지(aspect-video) + 국가 배지 + 이름 + `/{locale}/destinations/{slug}` 링크
- 하단에 `/{locale}/destinations` 링크 ("모든 여행지 보기" 버튼)
- `useTranslations('landing.destinations')` 사용
- destinations가 없으면 섹션 전체 숨김

---

### Step 4. sitemap.ts 생성

**파일:** `apps/travel/src/app/sitemap.ts` (신규)

```typescript
import type { MetadataRoute } from 'next';
import { getPublishedDestinations } from '@/services/destination.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://travel.moodybeard.com';
  const locales = ['ko', 'en'];
  const destinations = await getPublishedDestinations({ limit: 1000 });

  const staticRoutes = locales.flatMap((locale) => [
    { url: `${baseUrl}/${locale}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/${locale}/destinations`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
  ]);

  const destinationRoutes = destinations.flatMap((dest) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/destinations/${dest.slug}`,
      lastModified: dest.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  );

  return [...staticRoutes, ...destinationRoutes];
}
```

---

### Step 5. robots.ts 생성

**파일:** `apps/travel/src/app/robots.ts` (신규)

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://travel.moodybeard.com';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/login'] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

### Step 6. Google Analytics 연동

**파일:** `apps/travel/src/app/[locale]/layout.tsx`

- `import Script from 'next/script'` 추가
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경 변수 존재 시에만 Script 렌더
- `<body>` 내부, `<NextIntlClientProvider>` 이전에 두 개의 Script 태그 추가:
  1. GTM script (`strategy="afterInteractive"`)
  2. gtag init script (`strategy="afterInteractive"`, 인라인 코드)

**주의:** `Script` children은 inline script로 렌더되므로 biome lint ignore 주석 불필요 (React Server Component에서 `next/script` 사용)

---

### Step 7. AI 응답 언어 동기화

**파일 3개 수정:**

#### 7-1. `apps/travel/src/lib/ai/systemPrompt.ts`
```typescript
export function buildTravelSystemPrompt(previousConversationSummary?: string, locale?: string): string {
  const summary = previousConversationSummary?.trim() || 'NONE';
  let prompt = BASE_TRAVEL_SYSTEM_PROMPT.replace(PREVIOUS_CONVERSATION_SUMMARY_SLOT, summary);

  if (locale === 'ko') {
    prompt = prompt.replace(
      'Detect the user\'s language and respond in the SAME language.',
      'Always respond in Korean (한국어). 반드시 한국어로 답변하세요.',
    );
  } else if (locale === 'en') {
    prompt = prompt.replace(
      'Detect the user\'s language and respond in the SAME language.',
      'Always respond in English.',
    );
  }
  return prompt;
}
```
`TRAVEL_SYSTEM_PROMPT` 정적 export는 유지 (기존 코드 호환성).

#### 7-2. `apps/travel/src/app/api/chat/route.ts`
- `postBodySchema`에 `locale: z.string().optional()` 추가
- `parsedBody.data` 구조분해에 `locale` 추가
- `import { buildTravelSystemPrompt }` 추가 (기존 `TRAVEL_SYSTEM_PROMPT` import 제거)
- `system: buildTravelSystemPrompt(undefined, locale)` 로 변경

#### 7-3. `apps/travel/src/hooks/useChatComposer.ts`
- `ChatRequestBody` 타입에 `locale?: string` 추가
- `UseChatComposerOptions`에 `locale?: string` 추가
- `getChatRequestBody`에 `locale` 포함, deps 배열에 추가

#### 7-4. `apps/travel/src/components/chat/ChatPanel.tsx`
- `import { useLocale } from 'next-intl'` 추가
- `const locale = useLocale()` 추가
- `useChatComposer({ ..., locale })` 로 전달

---

## 수정/생성 파일 목록

| 파일 | 작업 |
|------|------|
| `apps/travel/messages/ko.json` | `destinations` 네임스페이스 + `landing.destinations` 키 추가 |
| `apps/travel/messages/en.json` | 동일 |
| `apps/travel/src/components/destinations/DestinationGrid.tsx` | 검색 + 페이지네이션 + i18n 추가 |
| `apps/travel/src/app/[locale]/page.tsx` | ISR revalidate + 인기 여행지 그리드 섹션 추가 |
| `apps/travel/src/app/sitemap.ts` | 신규 생성 |
| `apps/travel/src/app/robots.ts` | 신규 생성 |
| `apps/travel/src/app/[locale]/layout.tsx` | GA Script 추가 |
| `apps/travel/src/lib/ai/systemPrompt.ts` | `buildTravelSystemPrompt` locale 파라미터 추가 |
| `apps/travel/src/app/api/chat/route.ts` | locale 파라미터 수신 + buildTravelSystemPrompt 사용 |
| `apps/travel/src/hooks/useChatComposer.ts` | locale 옵션 + ChatRequestBody 타입 확장 |
| `apps/travel/src/components/chat/ChatPanel.tsx` | useLocale 추가 + locale 전달 |

---

## 검증

```bash
# 타입체크 + lint
cd /Users/marco/workspace/binbang && pnpm --filter @workspace/travel typecheck
pnpm --filter @workspace/travel lint

# 빌드 확인 (sitemap/robots 생성 검증)
pnpm --filter @workspace/travel build
```

수동 확인:
- `/sitemap.xml` → published 여행지 ko/en URL 포함 여부
- `/robots.txt` → disallow /api/, sitemap URL 포함 여부
- `/en/chat` 에서 AI 응답이 영어로 오는지
- `/ko/chat` 에서 AI 응답이 한국어로 오는지
- 랜딩 페이지에 여행지 그리드 카드 6개 노출 (DB에 published 여행지 있을 때)
- 여행지 목록 페이지에서 검색어 입력 시 필터링 동작
- 페이지네이션 (12개씩) 동작
