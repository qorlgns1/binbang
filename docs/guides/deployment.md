# Deployment

## CI/CD 파이프라인

### 워크플로우 구성

| 워크플로우      | 트리거            | 설명                                    |
| --------------- | ----------------- | --------------------------------------- |
| **CI**          | PR, reusable call | lint/format/test/build 검증             |
| **CodeQL**      | PR, 주간 스케줄   | 보안 취약점 분석                        |
| **Deploy**      | develop/main push | 브랜치별 Docker 이미지 빌드 및 OCI 배포 |
| **Release Tag** | main 브랜치 push  | package.json 버전으로 태그 자동 생성    |

### 필요한 GitHub Secrets

```text
DOCKERHUB_USERNAME    # Docker Hub 사용자명
DOCKERHUB_TOKEN       # Docker Hub 액세스 토큰
OCI_HOST              # OCI 서버 호스트
OCI_USER              # OCI SSH 사용자
OCI_SSH_KEY           # OCI SSH 프라이빗 키
OCI_PORT              # OCI SSH 포트 (기본: 22)
RELEASE_TAG_PAT       # 태그 생성용 GitHub PAT
```

### 필요한 GitHub Variables

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID         # Google Analytics 측정 ID
NEXT_PUBLIC_NAVER_SITE_VERIFICATION   # 네이버 사이트 인증
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION  # 구글 사이트 인증
```

## 운영 배포 (OCI + Docker Compose)

### 1) DATABASE_URL 설정

`.env.production`에 아래처럼 설정합니다:

```bash
DATABASE_URL=postgresql://username:password@your-db-host:5432/accommodation_monitor
```

### 2) 수동 배포 (CI/CD 미사용 시)

```bash
docker compose -f docker/docker-compose.production.yml --env-file .env.production pull
docker compose -f docker/docker-compose.production.yml --env-file .env.production up -d
```

### 3) DB 마이그레이션 적용 (필수)

`.env.production`만 사용하는 환경(로컬에서 원격 DB 대상 등)에서는:

```bash
APP_ENV=production pnpm db:migrate:deploy
```

**서버(OCI 호스트)에서 배포할 때**는 호스트별 설정(`.env.production.local`)을 쓰는 표준 절차가 따로 있습니다. 이 경우 **배포 SOT**인 [docs/deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md)의 "5) Standard Deploy Procedure"를 따르고, 해당 문서의 `APP_ENV=production pnpm db:migrate:deploy` 명령을 사용하세요.

초기 배포이거나 `systemSettings` 기본값이 비어 있는 환경이라면 아래도 1회 실행합니다.

```bash
APP_ENV=production pnpm db:seed:base
```

### 4) PublicAvailability 초기 스냅샷 1회 생성 (권장)

`PublicProperty` / `PublicAvailabilitySnapshot` 테이블은 워커 스케줄 실행 전까지 비어 있을 수 있습니다. 배포 직후 즉시 공개 페이지/사이트맵을 채우려면 아래를 1회 실행하세요.

```bash
APP_ENV=production pnpm with-env pnpm --filter @workspace/worker snapshot:public-availability -- --windowDays=30
```

## 서버 리소스 스냅샷 (2026-02-15 기준)

```text
OS: Ubuntu 24.04.3 LTS (aarch64)
CPU: 3 vCPU (ARM Neoverse-N1)
Memory: total 15Gi / available 13Gi / swap 0B
Disk(/): total 96G / used 18G / avail 79G (18%)
```

실시간으로 다시 확인할 때:

```bash
free -h
df -h /
lscpu | head -n 15
```
