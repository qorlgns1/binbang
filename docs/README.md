# Docs Index

## AI 대화용 컨텍스트

- **`docs/AI_CONTEXT.md`**: ChatGPT, Gemini, Grok 등에 붙여넣을 **프로젝트/역할/구조 요약** 한 파일. `architecture.md`, `ai-context-extra.md`, `brand-identity.md` 수정 후 `pnpm update:ai-context` 실행하면 여기에 반영됨.

## 구조

- `docs/architecture/`
  - `architecture.md`: 현재 모노레포 구조/경계/워크스페이스 책임 (단일 기준)
  - `monorepo-plan.md`: 모노레포 전환 계획 원문
- `docs/guides/`
  - `local-development.md`: 로컬 개발/환경변수/명령
  - `deployment.md`: CI/CD 및 운영 배포 절차
  - `rbac-local-testing.md`: RBAC 기능 로컬 검증 가이드
  - `worker-bullmq-runtime-flow.md`: 워커(BullMQ/Playwright) 실행 흐름 상세
  - `codex-request-playbook.md`: Codex에 릴리즈/PR/커밋정리 작업을 요청하는 템플릿 모음
  - `google-form-service-operations.md`: 구글폼 기반 서비스 운영 설계서(상품/과금/분쟁/SOP/KPI)
- `docs/history/`
  - `changelog.md`: 버전 변경 이력
  - `develop-work-units.md`: `main..develop` 작업 단위 재구성 기록
- `docs/backlog/`
  - `google-form-ops-mvp-backlog.md`: 구글폼 운영형 MVP 기능 백로그(P0/P1/P2)
  - `improvement-plan.md`: 프로젝트 전반 개선 계획
  - `throughput-and-analysis.md`: 처리량/분석 대시보드 확장 백로그

## 문서 작성 원칙

- `README.md`에는 입문 정보만 유지
- 상세 절차/운영 정보는 `docs/guides/`에 유지
- 구조/경계 문서는 `docs/architecture/`에 유지
- 이력/기록은 `docs/history/`에 유지
