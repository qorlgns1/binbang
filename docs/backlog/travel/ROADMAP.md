# AI Travel Planner - Long-term Roadmap

Last updated: 2026-02-16
Owner: KIHOON BAE

## Service Vision

mindtrip.ai 스타일의 AI 기반 여행 플래닝 서비스. 실시간 장소 검색, 날씨 분석, 환율 비교를 통합한 대화형 여행 어시스턴트.

## Current State (MVP)

- AI 채팅 (Gemini 2.5 Flash-Lite, AI SDK v6)
- 도구 호출: searchPlaces, getWeatherHistory, getExchangeRate
- Google Maps 자동 핀/마커 매핑
- 장소/날씨/환율 카드 렌더링
- 스트리밍 응답
- Docker 빌드 + CI/CD 파이프라인
- `dev-travel.moodybeard.com` / `travel.moodybeard.com` 도메인

### Key Files

| Component | Path |
|-----------|------|
| Entry page | `apps/travel/src/app/page.tsx` |
| Chat panel | `apps/travel/src/components/chat/ChatPanel.tsx` |
| Map panel | `apps/travel/src/components/map/MapPanel.tsx` |
| AI route | `apps/travel/src/app/api/chat/route.ts` |
| Tools | `apps/travel/src/lib/ai/tools.ts` |
| System prompt | `apps/travel/src/lib/ai/systemPrompt.ts` |
| Model config | `apps/travel/src/lib/ai/model.ts` |
| Conversation service | `apps/travel/src/services/conversation.service.ts` |
| DB schema | `packages/db/prisma/schema.prisma` |

## Decision Log

| Item | Decision | Rationale |
|------|----------|-----------|
| UI/UX | mindtrip.ai 스타일 | 지도+채팅 사이드바 레이아웃이 여행 서비스에 최적 |
| 인증 | 게스트 우선 + 선택적 로그인 | 진입 장벽 제거, 전환율 향상 |
| 대화 히스토리 | 풍부함 + 비용 제어 | 목록/검색/자동제목 + sliding window/rate limiting |
| SEO | 랜딩 + 여행지별 페이지 | AI 자동 생성으로 유지비용 최소화, 유기적 트래픽 확보 |
| 모바일 | 반응형 최적화 | 여행 앱 특성상 모바일 사용자 비중 높음 |
| 다국어 | 한/영 2개 언어 (next-intl) | 초기 타겟 커버, 추후 확장 용이 |
| 수익화 | Phase 3에서 Agoda Affiliate | 사용자 기반 확보 후 자연스러운 도입 |
| 일정 생성 | 이번 로드맵 제외 | 추후 검토, MVP 범위 유지 |
| 알람 서비스 | 추후 결정 | travel은 AI 여행에만 집중 |
| LLM 모델 | 유연한 모델 추상화 | provider 패턴으로 교체 가능 구조 |
| 캐싱 | 외부 API + 인기 여행지 사전 캐싱 | API 비용 절감 + 응답 속도 개선 |

## Phase Overview

```
Phase 1 ──> Phase 2 ──> Phase 3 ──> Phase 4 ──> Phase 5
UI/UX       Auth +      수익화 +     SEO +       모델 추상화
+ Mobile    History     Caching     i18n        + 고도화
+ Error     + Cost
Handling    Control
```

| Phase | Name | Focus | Detail Doc |
|-------|------|-------|------------|
| 1 | UI/UX 고도화 | mindtrip 스타일 리디자인 + 모바일 + 에러 핸들링 | [phase1-ui-polish.md](phase1-ui-polish.md) |
| 2 | 인증 + 히스토리 | 게스트 세션 + OAuth + 대화 관리 + 비용 제어 | [phase2-auth-history.md](phase2-auth-history.md) |
| 3 | 수익화 + 캐싱 | Agoda Affiliate + API 캐싱 + 사전 데이터 로딩 | [phase3-monetization.md](phase3-monetization.md) |
| 4 | SEO + i18n | 랜딩 페이지 + 여행지 SSR 페이지 + 한/영 다국어 | [phase4-seo-i18n.md](phase4-seo-i18n.md) |
| 5 | 모델 고도화 | LLM 추상화 + 대화 압축 + 분석 + 성능 최적화 | [phase5-advanced.md](phase5-advanced.md) |

## Cost Estimation (Gemini 2.5 Flash-Lite)

| Metric | Value |
|--------|-------|
| Input price | $0.075 / 1M tokens |
| Output price | $0.30 / 1M tokens |
| Avg conversation (10 turns) | ~$0.01 |
| DAU 1000, 3 conversations/day | ~$30/month |
| With sliding window (10 turns) | 비용 일정하게 유지 |

## Infrastructure

| Environment | Domain | Port | Compose |
|-------------|--------|------|---------|
| Development | `dev-travel.moodybeard.com` | 3301 | `docker-compose.develop.yml` |
| Production | `travel.moodybeard.com` | 3300 | `docker-compose.production.yml` |

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API 가격 변동 | 운영비 증가 | 모델 추상화로 대체 모델 즉시 전환 가능 |
| Google Places API 비용 | 외부 API 비용 증가 | 캐싱 전략 (Phase 3) |
| 스크래핑 법적 리스크 | 서비스 중단 가능 | 공식 API만 외부 노출, 비공식은 내부만 |
| 경쟁 서비스 출현 | 사용자 이탈 | SEO + 차별화 기능으로 선점 |
