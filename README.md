# Accommodation Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![CI](https://github.com/qorlgns1/accommodation-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/qorlgns1/accommodation-monitor/actions/workflows/ci.yml)

Airbnb, Agoda 숙소의 **예약 가능 여부를 주기적으로 모니터링**하고, 예약이 가능해지면 **카카오톡으로 알림**을 보내주는 웹 애플리케이션입니다

> 인기 숙소의 취소 건을 잡기 위해 만들었습니다.

## 필수 규칙

이 저장소의 모든 구현/리팩터링/리뷰는 반드시 아래 규칙 문서를 따릅니다.

- [rules.md](rules.md)
- [RULES_SUMMARY.md](RULES_SUMMARY.md)

코드 경계/아키텍처 정책은 위 두 문서를 최우선 기준으로 적용합니다.

규칙 위반 가능성이 있으면 작업을 진행하지 말고 먼저 확인/합의하세요.

---

## 주요 기능

- **카카오 / 구글 소셜 로그인**
- **멀티 유저 지원** – 각자 자신의 숙소만 관리
- **숙소 CRUD** – UI로 등록 / 수정 / 삭제
- **자동 모니터링** – 기본 30분 주기 체크
- **카카오톡 알림** – 예약 가능 시 즉시 알림
- **체크 로그** – 모니터링 히스토리 확인
- **브라우저 풀** – Chromium 인스턴스 재사용으로 성능 최적화
- **관리자 설정** – Worker / 브라우저 / 체커 설정을 DB 기반 관리자 UI에서 실시간 변경
- **설정 변경 이력** – 누가 언제 어떤 설정을 변경했는지 감사 로그 확인
- **하트비트 모니터링** – 워커 생존 상태 추적, 이상 시 카카오 알림, 2시간 타임라인
- **워커 재시작** – 관리자 UI에서 원클릭 워커 재시작
- **사용자 관리** – 관리자가 사용자 목록 조회, 역할(Role) 변경
- **처리량 대시보드** – 체크 사이클 기반 처리량 추이/비교/요약 분석
- **체크 사이클 메트릭** – 사이클별 성공/에러/지속 시간/재시도 집계
- **API Rate Limiting** – IP 기반 슬라이딩 윈도우 요청 제한
- **동적 셀렉터 관리** – DB 기반 CSS 셀렉터/패턴 관리, 코드 배포 없이 플랫폼 UI 변경 대응
- **일관된 디자인 시스템** – shadcn/ui 기반의 모던한 UI

---

## 빠른 시작

```bash
pnpm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

pnpm local:docker up -d db
pnpm db:migrate

pnpm dev:web
pnpm dev:worker
```

---

## 자주 쓰는 명령

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm db:migrate
pnpm local:docker up -d --build
```

---

## 문서

- 문서 인덱스: `docs/README.md`
- 로컬 개발: `docs/guides/local-development.md`
- 배포: `docs/guides/deployment.md`
- 아키텍처/경계: `docs/architecture/architecture.md`
- 모노레포 계획: `docs/architecture/monorepo-plan.md`
- 변경 이력: `docs/history/changelog.md`
- 작업 단위 히스토리 정리: `docs/history/develop-work-units.md`
- RBAC 로컬 검증: `docs/guides/rbac-local-testing.md`

---

## Contributing

- 버그 리포트나 기능 제안은 [Issues](https://github.com/qorlgns1/accommodation-monitor/issues)에 등록해주세요
- PR 전에 관련 이슈가 있는지 확인해주세요

---

## Acknowledgments

- [Puppeteer](https://pptr.dev/) - 웹 스크래핑
- [Next.js](https://nextjs.org/) - React 프레임워크
- [Prisma](https://www.prisma.io/) - ORM
- [NextAuth.js](https://next-auth.js.org/) - 인증

---

## 라이센스

MIT License
