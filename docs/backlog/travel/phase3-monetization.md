# Phase 3: 수익화 + 데이터 캐싱

Status: NOT STARTED
Priority: MEDIUM
Depends on: Phase 2

## Goal

Agoda Affiliate API를 연동하여 숙소 추천 시 제휴 링크를 자연스럽게 삽입하고, 레퍼럴 수익을 창출한다. 외부 API 호출 비용을 줄이기 위한 캐싱 전략을 구축한다.

## Revenue Model

```
사용자 질문 → AI가 숙소 추천 (searchPlaces tool)
                ↓
          Agoda Affiliate 링크 포함 카드 렌더링
                ↓
          사용자가 링크 클릭 → Agoda에서 예약
                ↓
          레퍼럴 수수료 수익
```

## Tasks

### P3-1: Agoda Affiliate API 연동

- [ ] P3-1-T1: Agoda Affiliate 파트너 가입 및 API 키 발급
- [ ] P3-1-T2: Agoda API 클라이언트 구현 (`apps/travel/src/lib/api/agoda.ts`)
  - 호텔 검색 (위치 기반, 날짜별)
  - 호텔 상세 정보 (가격, 평점, 이미지)
  - 어필리에이트 링크 생성
- [ ] P3-1-T3: `searchAccommodation` 새 AI 도구 추가 (`apps/travel/src/lib/ai/tools.ts`)
- [ ] P3-1-T4: 시스템 프롬프트에 숙소 관련 질문 시 `searchAccommodation` 도구 사용 규칙 추가
- [ ] P3-1-T5: AccommodationCard 컴포넌트 생성 (가격, 평점, 이미지, "예약하기" CTA 버튼)
- [ ] P3-1-T6: CTA 버튼에 Agoda affiliate 트래킹 파라미터 포함

### P3-2: 레퍼럴 트래킹

- [ ] P3-2-T1: 클릭 트래킹 DB 모델 추가

```prisma
model AffiliateClick {
  id             String   @id @default(cuid())
  conversationId String?
  userId         String?
  provider       String   // "agoda", "booking" 등
  hotelId        String
  hotelName      String
  clickedAt      DateTime @default(now())
  
  @@index([provider])
  @@index([clickedAt])
}
```

- [ ] P3-2-T2: 클릭 트래킹 API endpoint (`POST /api/affiliate/click`)
- [ ] P3-2-T3: 관리자 대시보드 - 클릭 수, 전환율 기본 통계
- [ ] P3-2-T4: 일별/월별 레퍼럴 수익 리포트 (Agoda 대시보드 연동 또는 수동)

### P3-3: 자연스러운 제휴 링크 삽입

- [ ] P3-3-T1: AI 응답에서 숙소 추천 시 Agoda 링크가 자연스럽게 표시되도록 프롬프트 조정
- [ ] P3-3-T2: "광고" 또는 "제휴" 라벨 표시 (투명성)
- [ ] P3-3-T3: 사용자가 제휴 링크를 원하지 않을 때 비활성화 옵션 (설정)
- [ ] P3-3-T4: 제휴 링크 없는 일반 검색 결과도 함께 표시 (균형)

### P3-4: Google Places API 캐싱

**현재 파일**: `apps/travel/src/lib/api/places.ts`

- [ ] P3-4-T1: Places API 응답 캐시 레이어 구현
  - 캐시 키: `places:{query}:{type}:{location}` 해시
  - TTL: 24시간 (장소 정보는 자주 변하지 않음)
- [ ] P3-4-T2: 캐시 저장소 선택 및 구현
  - Option A: Redis (이미 인프라에 있음, `docker-compose`에 redis 서비스 존재)
  - Option B: PostgreSQL JSON 컬럼 (추가 인프라 불필요)
- [ ] P3-4-T3: 캐시 히트/미스 로깅
- [ ] P3-4-T4: 캐시 무효화 전략 (수동 + TTL 기반)

### P3-5: 날씨/환율 데이터 캐싱

**현재 파일**: `apps/travel/src/lib/api/weather.ts`, `exchangeRate.ts`

- [ ] P3-5-T1: 환율 데이터 캐싱 (TTL: 1시간, 환율은 자주 변동)
- [ ] P3-5-T2: 날씨 히스토리 데이터 캐싱 (TTL: 7일, 과거 데이터는 변하지 않음)
- [ ] P3-5-T3: 캐시 워밍업 - 인기 통화쌍 사전 로딩 (USD/KRW, USD/JPY, USD/EUR 등)

### P3-6: 인기 여행지 사전 캐싱

- [ ] P3-6-T1: 인기 여행지 목록 정의 (Tokyo, Seoul, Bangkok, Paris 등 Top 30)
- [ ] P3-6-T2: Cron job으로 인기 여행지 데이터 주기적 사전 로딩
  - Places: 주요 관광지, 호텔, 식당
  - 날씨: 월별 히스토리
  - 환율: 해당 국가 통화
- [ ] P3-6-T3: 사전 캐시된 데이터가 있으면 API 호출 스킵 로직

## Cost Impact Analysis

| API | 현재 비용/호출 | 캐시 후 예상 절감 |
|-----|----------------|-------------------|
| Google Places | ~$0.017/request | 70-80% 절감 (반복 쿼리 높음) |
| OpenWeatherMap | Free tier 60/min | 캐시로 rate limit 여유 확보 |
| ExchangeRate | Free tier 1500/month | 캐시로 호출 수 90% 절감 |
| Agoda Affiliate | Free (수익 창출) | N/A |

## Acceptance Criteria

- [ ] 숙소 관련 질문 시 Agoda 제휴 링크가 포함된 카드 표시
- [ ] 클릭 트래킹이 DB에 정상 기록
- [ ] 동일 Places 검색 시 두 번째부터 캐시 응답 (응답 속도 개선)
- [ ] 인기 여행지 검색 시 즉시 응답 (사전 캐싱)
- [ ] 환율/날씨 캐시 정상 동작 및 TTL 만료 후 갱신

## Environment Variables (New)

```
AGODA_AFFILIATE_API_KEY=your-key
AGODA_AFFILIATE_SITE_ID=your-site-id
CACHE_PROVIDER=redis  # or "db"
CACHE_DEFAULT_TTL_SECONDS=86400
```

## Technical Notes

- 캐시 저장소: Redis 우선 (docker-compose에 이미 포함)
- travel 서비스에서 Redis 접속: 같은 docker network (`binbang_shared_network`) 사용
- Agoda API 문서: https://partners.agoda.com (파트너 가입 후 접근)
- 제휴 링크 형식: `https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid={SITE_ID}&hid={HOTEL_ID}`
