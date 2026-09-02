# Deployment

> **Status: CURRENT — Source of Truth (CI/CD 파이프라인)**
> `CLAUDE.md` 규약상 서버/배포 변경 제안 전 반드시 읽는다.

## CI/CD 파이프라인

### 워크플로우 구성

| 워크플로우 | 트리거 | 설명 |
| --- | --- | --- |
| **CI** | PR, reusable call | lint/format/typecheck/test/build 검증 |
| **CodeQL** | PR, 주간 스케줄 | 보안 취약점 분석 |
| **Deploy** | develop/main push | 브랜치별 Docker 이미지 빌드 및 OCI 배포 |
| **Release Tag** | main 브랜치 push | package.json 버전으로 태그 자동 생성 |

CI는 실제 Oracle에 붙지 않고 더미 `ORACLE_*` 값으로 정적 검증만 수행합니다.  
배포 워크플로우는 `pnpm db:migrate:deploy`와 `pnpm db:seed:base`를 실행하며, Prisma generate 단계는 없습니다.

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
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY       # travel 빌드용 공개 Maps 키
```

## 운영 배포 (OCI + Docker Compose)

### 1) Oracle 연결 정보 설정

`.env.production` 또는 서버의 배포용 env 파일에는 아래 값이 필요합니다.

```bash
ORACLE_USER=BINBANG_PROD
ORACLE_PASSWORD=replace-with-secret
ORACLE_CONNECT_STRING=tcps://your-adb-host:1522/your_service_name.adb.oraclecloud.com?ssl_server_dn_match=yes
ORACLE_AGODA_SHARED_SCHEMA=BINBANG_SHARED
REDIS_URL=redis://redis-prod:6379
```

Oracle 연결 문자열은 Easy Connect Plus 형식으로 관리합니다.  
Agoda 공용 카탈로그를 별도 스키마로 운영하면 `ORACLE_AGODA_SHARED_SCHEMA`에 해당 스키마명을 설정합니다.  
`PG_SOURCE_DATABASE_URL`은 일회성 PG→Oracle 데이터 이관 리허설에만 사용하며, 일반 배포 경로에는 넣지 않습니다.

### 2) 수동 배포 (CI/CD 미사용 시)

```bash
docker compose -f docker/docker-compose.production.yml --env-file .env.production pull
docker compose -f docker/docker-compose.production.yml --env-file .env.production up -d
```

### 3) DB 마이그레이션 적용 (필수)

서버에서 직접 실행할 때는 Doppler로 감싸 값을 주입합니다.
`with-env`는 `APP_ENV`가 설정돼 있으면 아무것도 하지 않고 명령을 그대로 넘기므로,
바깥에서 값을 넣어주지 않으면 DB 접속 정보가 비어 있습니다.

```bash
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:migrate:deploy
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:seed:base
```

develop 환경에서 샘플 데이터가 필요하면 아래를 추가로 실행합니다.

```bash
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:seed
```

배포 워크플로우도 같은 순서로 실행합니다.

### 4) PublicAvailability 초기 스냅샷 1회 생성 (권장)

`PublicProperty` / `PublicAvailabilitySnapshot` 테이블은 워커 스케줄 실행 전까지 비어 있을 수 있습니다. 배포 직후 즉시 공개 페이지/사이트맵을 채우려면 아래를 1회 실행하세요.

```bash
doppler run --token "$DOPPLER_TOKEN_WORKER" -- pnpm --filter @workspace/worker snapshot:public-availability -- --windowDays=30
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
