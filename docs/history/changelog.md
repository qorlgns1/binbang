# Changelog

## v2.18.0 – 대시보드 첫 방문 튜토리얼

로그인 직후 첫 방문 사용자에게 서비스 핵심 기능을 안내하는 온보딩 튜토리얼을 추가했습니다.

- **4단계 튜토리얼 Dialog**: 서비스 소개 → 숙소 등록 안내 → 카카오 알림 설정 → 완료, shadcn Dialog/Progress 사용
- **DB 기반 상태 관리**: User 모델에 `tutorialCompletedAt`, `tutorialDismissedAt` 필드 추가, 완료/건너뛰기 후 재노출 방지
- **API**: `GET/PATCH /api/user/tutorial` (인증 필수, Zod 검증, 서비스 레이어 위임)
- **React Query 연동**: `useUserTutorialQuery` + `useCompleteTutorialMutation` / `useDismissTutorialMutation`
- **UX**: 실수 종료 방지(외부 클릭/ESC 무시), 키보드 접근성, 모바일(360px+) 대응
- **서비스 테스트**: `user.service.test.ts` 6개 케이스 (상태 조회/완료/건너뛰기)

## v2.17.0 – 저장소 규칙 문서 체계 정비

개발 규칙 문서의 기준점을 통합하고, 모노레포 경계/정책 설명을 명확히 정리했습니다.

- **규칙 문서 업데이트**: `rules.md` 개편 및 한국어 규칙 문서 `docs/rules.ko.md` 추가
- **Cursor 룰 통합**: `.cursor/rules/rules.md`를 단일 기준 방향으로 정리
- **RULES_SUMMARY 강화**: 공개 API, DB/Prisma 규칙, 레이어 경계 설명 보강
- **Biome assist 비활성화**: 자동 액션으로 인한 의도치 않은 수정 가능성 축소

## v2.16.0 – Biome 전환 및 툴링 파이프라인 재정비

코드 품질 체계를 ESLint/Prettier에서 Biome 중심으로 전환하고, 관련 스크립트와 설정을 정리했습니다.

- **Biome 도입**: `biome.json` 추가, lint/format 명령 Biome 기준으로 통일
- **기존 설정 제거**: `.prettierrc`, `.prettierignore`, `eslint.config.ts` 삭제
- **대규모 포맷 정리**: Biome 적용 과정에서 코드베이스 일괄 정렬/정리
- **Next 이미지 호스트 확장**: 카카오/구글 프로필 이미지 도메인 허용 추가

## v2.15.0 – Action Center 대시보드 및 랜딩 i18n 고도화

운영 우선순위 중심 대시보드로 재구성하고, 랜딩 페이지의 국제화/분석/접근성을 강화했습니다.

- **대시보드 4섹션 재구성**: KPI Strip → Action Center → 운영 보드 → 최근 이벤트
- **랜딩 페이지 개선**: 인터랙션/애니메이션/접근성 강화 및 언어 리소스(ko/en) 구조화
- **분석/트래킹 보강**: 세션/이벤트 수집 안정성 개선, 테마/로딩 상태 관련 버그 수정
- **개발환경 정비**: `.env.example` 확장, lint 규칙 구조화, 타입체크 파이프라인 안정화

## v2.14.0 – 시스템 설정 MIN/MAX 제한 및 공유 모듈 정리

관리자 시스템 설정에 DB 기반 최솟값/최댓값 제한을 추가하고, 공유 모듈을 정리했습니다.

- **DB 기반 설정 범위 제한**: `SystemSettings`에 MIN/MAX 값을 추가하여 관리자 UI에서 유효 범위 편집 지원
- **`computeUnits` 함수 개선**: 설정값 계산 시 min/max 핸들링 포함
- **`@shared/url-builder` 추출**: `buildAccommodationUrl` 유틸을 shared 패키지로 승격
- **의존성 정리**: axios 제거, tsc-alias 추가

## v2.13.0 – BullMQ + Playwright 워커 마이그레이션

워커 런타임을 node-cron + Puppeteer에서 BullMQ + Playwright로 전면 교체했습니다.

- **BullMQ 잡 큐 도입**: Redis 기반 2단계 큐 (cycle → check), 반복 스케줄러
- **Playwright 마이그레이션**: Puppeteer → Playwright Chromium으로 브라우저 엔진 교체
- **배포 워크플로우 개선**: GitHub Actions digest 추출 간소화
- **robots.txt 정리**: 불필요한 정적 파일 제거

## v2.12.0 – 브랜드 아이덴티티 적용 및 코드 품질 강화

등대 테마 브랜드 아이덴티티를 전 페이지에 적용하고, 코드 품질 기반을 강화했습니다.

- **브랜드 아이덴티티 적용**: 대시보드, 프라이싱, 404, 숙소, 설정, 랜딩, 인증 페이지에 등대 테마 및 다크 모드 대응
- **SEO Phase 1**: 메타데이터 최적화, 키워드 전략 수립, sitemap/robots 설정
- **ESLint 모노레포 경계 규칙**: `rules.md` 기반 import 제한 자동 검증
- **TypeScript 명시적 반환 타입**: 전체 코드베이스에 explicit function return types 적용
- **rules.md 준수 리팩토링**: 랜딩/인증 페이지 구조 정리, JSX 간소화

## v2.11.0 – 동적 셀렉터 관리 시스템

플랫폼 UI 변경에 코드 배포 없이 대응할 수 있는 동적 셀렉터 관리 시스템을 추가했습니다.

- **DB 기반 셀렉터/패턴 관리**: `PlatformSelector`, `PlatformPattern` 모델로 CSS 셀렉터와 텍스트 패턴을 DB에서 관리
- **동적 Extractor 빌드**: DB 셀렉터 기반으로 JavaScript 추출 함수를 자동 생성
- **5분 TTL 캐시**: 성능 최적화를 위한 메모리 캐시, Fallback 로직으로 안정성 확보
- **어드민 UI**: `/admin/selectors`에서 플랫폼별 셀렉터/패턴 CRUD
- **변경 이력 추적**: `SelectorChangeLog` 모델로 모든 변경 감사 로그 기록
- **셀렉터 테스트 패널**: URL 입력 시 실시간 셀렉터 테스트 및 결과 미리보기
- **캐시 무효화 API**: 셀렉터 변경 후 즉시 반영을 위한 수동 캐시 무효화

### 사용 방법

```bash
# 개발 환경
pnpm db:migrate            # 마이그레이션 적용
pnpm db:seed               # 전체 시드 (테스트 데이터 포함)

# 운영 환경
pnpm db:migrate:deploy     # 마이그레이션 배포
pnpm --filter @workspace/db db:seed:base    # 운영용 시드 (RBAC, 설정, 셀렉터/패턴만)
```

### 카테고리별 셀렉터

| 카테고리       | 설명                  | 예시                                 |
| -------------- | --------------------- | ------------------------------------ |
| `PRICE`        | 가격 추출             | `[aria-label*="총액"]`               |
| `AVAILABILITY` | 예약 가능/불가 요소   | `[data-element-value="unavailable"]` |
| `METADATA`     | JSON-LD 등 메타데이터 | `script[type="application/ld+json"]` |
| `PLATFORM_ID`  | 플랫폼 고유 ID        | URL 패턴 또는 스크립트               |

### 패턴 타입

| 타입          | 설명             | 예시                         |
| ------------- | ---------------- | ---------------------------- |
| `AVAILABLE`   | 예약 가능 텍스트 | "예약하기", "Reserve"        |
| `UNAVAILABLE` | 예약 불가 텍스트 | "날짜 변경", "not available" |

## v2.10.0 – 처리량 대시보드 및 체크 사이클 메트릭

체크 사이클 기준 처리량을 집계/시각화하는 관리 도구를 추가했습니다.

- **CheckCycle 모델**: 사이클별 시작/종료/지속시간, 성공/에러 수, 설정 스냅샷 저장
- **CheckLog 확장**: `cycleId`, `durationMs`, `retryCount`, `previousStatus` 추가
- **처리량 대시보드**: 요약 카드, 히스토리 라인 차트, 설정별 비교 바 차트
- **Throughput API**: `/api/admin/throughput/summary`, `/history`, `/compare`

## v2.9.0 – 관리자 시스템 구축, 보안 강화, CI/CD 통합

관리자 전용 시스템(모니터링·사용자 관리·설정), 워커 하트비트, API 보안을 전면적으로 구축했습니다.

- **관리자 모니터링 대시보드**: 워커 상태, DB 상태, 24시간 성공률 요약 카드 + 로그 타임라인 (필터·무한 스크롤)
- **사용자 관리**: 사용자 목록 조회, 역할(Role) 변경, 검색·필터·커서 페이지네이션
- **시스템 설정 env → DB 마이그레이션**: 7개 환경변수를 DB 기반으로 전환, 관리자 UI에서 실시간 변경, 변경 감사 로그
- **워커 하트비트**: 1분 단위 상태 기록, 워커 다운/처리 초과 감지 시 카카오 알림, 2시간 타임라인 UI
- **워커 재시작**: 내부 HTTP 서버(3500) + 관리자 원클릭 재시작 (Docker 자동 복구)
- **API Rate Limiting**: IP 기반 슬라이딩 윈도우 (auth: 10req/min, API: 60req/min)
- **CI/CD 통합**: deploy-prod + publish-dev → deploy.yml 단일 워크플로우, ARM64 전용
- **보안**: production 워커 포트 외부 노출 차단 (`expose`), 하트비트 API ADMIN 인증
- **Prisma Schema**: `Role` enum, `WorkerHeartbeat`, `HeartbeatHistory`, `SystemSettings`, `SettingsChangeLog` 모델 추가

## v2.8.0 – CI/CD 파이프라인 개선, 코드 품질 강화 및 Docker

빌드 최적화, 테스트 커버리지를 확대하고, CI/CD 파이프라인을 안정화하며, 빌드·배포 효율을 개선했습니다.

## v2.7.0 – TanStack Query 도입 및 데이터 관리/UX 대폭 개선

데이터 패칭을 React Query 중심으로 재정비해 실시간성/반응성/로딩 UX를 전반적으로 끌어올렸습니다.

- **TanStack React Query 도입**: `@tanstack/react-query` + Devtools 적용, `QueryClientProvider` 및 기본 캐시/재시도 정책 구성
- **전 페이지 fetch → Query 전환**: `useQuery`/`useMutation` 기반으로 일원화
- **커스텀 훅 패턴 도입**: `useAccommodations`, `useAccommodation`, `useCheckLogs`, `useRecentLogs`, `useCreate/Update/Delete/ToggleActive` 등
- **체크 로그 무한 스크롤**: `useInfiniteQuery` + cursor 기반 페이징, "더 보기" UI
- **Optimistic Update 적용**: 숙소 활성/일시정지 토글 즉시 반영 + 실패 시 rollback
- **대시보드 클라이언트화 + 자동 refetch**: 숙소 목록 30초, 최근 로그 60초 주기 갱신
- **부드러운 로딩 경험**: `placeholderData` + `keepPreviousData`로 화면 깜빡임 최소화
- **에러/상태 처리 일관화**: mutation pending 상태 통합 처리 및 에러 메시지 단일화
- **Query Key 체계화**: `queryKeys.ts`로 키 관리, 캐시 무효화 전략 개선

## v2.6.0 – Tailwind CSS v4 & shadcn/ui 도입

- **shadcn-ui(v3) 도입**: `components.json` 설정 및 `radix-vega` 스타일 적용
- **Tailwind CSS v4 마이그레이션**: `tailwind.config.ts` 삭제, `globals.css`로 설정 일원화
- OKLCH 색상 공간 기반의 semantic 토큰 및 다크 모드 변수 체계 구축

## v2.5.0 – 숙소 수정 페이지 추가

- **숙소 수정 페이지** (`/accommodations/[id]/edit`) 추가
- URL 변경 시 자동 파싱 및 "모두 적용" 기능

## v2.4.0 – CI/CD 파이프라인 및 인프라 현대화

- **Node.js 24** 업그레이드, **Prisma 7** 마이그레이션
- **GitHub Actions CI/CD** 파이프라인 구축
- Docker 멀티스테이지 빌드로 web/worker 통합
- Vitest 테스트 프레임워크 도입

## v2.3.0 – ESLint 9 + Prettier 설정

- ESLint 9 flat config (TypeScript strict, React Hooks, Next.js core-web-vitals)
- Prettier 설정 (싱글쿼트, 세미콜론, 줄 길이 120자, import 자동 정렬)

## v2.2.0 – Google Analytics 및 SEO

- Google Analytics 통합
- SEO 검증용 환경변수 추가

## v2.1.0 – 브라우저 풀 도입 및 성능 개선

체크마다 Chromium을 새로 띄우지 않고 **브라우저 풀을 통해 재사용**합니다.

- 4개 숙소 처리 시간: **40~50초 → 12~14초** (약 65~76% 단축)
- 브라우저 풀 기반 동시 처리, 리소스 차단, 타임아웃 최적화

## v2.0.0 – 웹 애플리케이션 전환

v1.x CLI 도구에서 완전히 재작성되었습니다.

| v1.x                  | v2.0.0                 |
| --------------------- | ---------------------- |
| CLI 기반              | 풀 웹 UI               |
| `config.js` 직접 편집 | 브라우저에서 숙소 관리 |
| 단일 사용자           | 멀티 유저 (OAuth)      |
| -                     | PostgreSQL + 체크 로그 |
| -                     | Docker Compose 배포    |
