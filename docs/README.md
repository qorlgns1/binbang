# Docs Index

> Last verified: 2026-08-31


---

## 배포 기준 문서 (Source of Truth)

서버/배포/환경 관련 변경을 제안하기 전에 반드시 먼저 읽는다. (`CLAUDE.md` 규약)

| 문서 | 내용 |
|---|---|
| **`deployment/DEPLOYMENT.md`** | 배포 절차, 롤백, 스모크 체크 |
| **`deployment/ENVIRONMENTS.md`** | 환경 정의(dev/prod), URL, 브랜치, 환경변수 |
| **`deployment/RUNBOOK.md`** | 장애 등급/트리아지/대응 |
| **`deployment/CI-CD.md`** | GitHub Actions 파이프라인, 시크릿 |

로컬 개발 환경변수는 `deployment/ENVIRONMENTS.md`와 루트 `.env.example`이 기준이다.

## 제품

- **`PRODUCT.md`** — 비즈니스 관점 제품 개요(빈방 / 여행 AI), 기능 상태, 수익화
  - ⚠️ 인증 관련 서술은 이메일 OTP 전환으로 변경 예정

## 구조

- **`architecture/architecture.md`** — 모노레포 구조/경계/워크스페이스 책임 (단일 기준)
- `architecture/monorepo-plan.md` — 아키텍처 방향과 전환 기준

## 규칙

- 루트 **`rules.md`** — 원본(영문). 강제 규칙의 기준
- 루트 `RULES_SUMMARY.md` — 요약본
- `rules.ko.md` — 한국어 번역본. 원본과 다르면 `rules.md`가 이긴다

## 가이드

- `guides/agoda-affiliat-api-v2.0.md` — Agoda 제휴 API 연동 레퍼런스 (외부 스펙이라 코드로 대체 불가)
- `guides/seo-strategy.md` — SEO 전략

## 백로그

- `backlog/growth-activation-plan.md` — 유저 활성화 플랜
  - ⚠️ Week 1 컨시어지 테스트는 실행됐고 결과가 부정적이었다. Week 2 이후 계획은 그대로 진행하지 않는다

## 히스토리 (읽기 전용)

- `history/changelog.md` — 버전 변경 이력
- `history/branding/` — 브랜드 아이덴티티, 랜딩 카피

---

## 문서 작성 원칙

- **새 문서를 만들기 전에 코드/`.env.example`/git 히스토리로 대체되는지 먼저 확인한다**
- 모든 문서 최상단에 `Status` + `Last verified` 표기
- 배포/환경/장애 기준 문서는 `docs/deployment/` — 여기가 유일한 기준. 같은 주제를 다른 폴더에 두지 않는다
- 완료된 계획은 `history/`로 옮기지 말고 **삭제**한다. 기록은 git이 갖고 있다
- 결정이 바뀌면 문서 상단에 무엇이 왜 바뀌었는지 적는다
