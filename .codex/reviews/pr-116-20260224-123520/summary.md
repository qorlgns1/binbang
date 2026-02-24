# PR #116 Multi-Agent Review

- title: feat(travel): Phase 4 SEO + i18n 구현 — 여행지 페이지, sitemap, robots, GA, AI 언어 동기화
- url: https://github.com/qorlgns1/binbang/pull/116
- overall_status: fail
- total_findings: 10
- severity: critical=0, high=2, medium=8, low=0, info=0
- agent_statuses: security:success(2), correctness:success(3), test-maintainability:success(5)

## Top Findings
1. [high] Locale-dependent prompt branching lacks unit/integration coverage (apps/travel/src/lib/ai/systemPrompt.ts:69)
2. [high] Locale routing behavior changed without middleware regression tests (apps/travel/src/middleware.ts:15)
3. [medium] Stored XSS risk from unescaped JSON-LD in destination detail page (apps/travel/src/app/[locale]/destinations/[slug]/page.tsx:76)
4. [medium] Stored XSS risk from unescaped JSON-LD in destinations list page (apps/travel/src/app/[locale]/destinations/page.tsx:44)
5. [medium] Locale-specific landing CTA links to non-localized chat path (apps/travel/src/app/[locale]/page.tsx:81)
6. [medium] Sitemap generation introduces nondeterministic timestamps without test seam (apps/travel/src/app/sitemap.ts:12)
7. [medium] DestinationGrid state transitions are untested (search/filter/pagination coupling) (apps/travel/src/components/destinations/DestinationGrid.tsx:34)
8. [medium] Language switcher drops query parameters during locale change (apps/travel/src/components/LanguageSwitcher.tsx:21)
9. [medium] Published destinations API silently truncates list to 30 by default (apps/travel/src/services/destination.service.ts:32)
10. [medium] New destination seeding path added without idempotency or data-shape tests (packages/db/prisma/seed-base.ts:204)
