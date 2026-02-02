# 🔒 추가 컨텍스트 (Claude 작업 가이드 확장)

> 이 섹션은 Claude가 **운영 환경·성능 제약·아키텍처 의도를 오해하지 않도록** 하기 위한 보조 규칙입니다.  
> 기존 문서의 규칙보다 **우선 적용**됩니다.

---

## 🧭 의사결정 우선순위

모든 코드 변경, 리팩토링, 기능 제안은 아래 우선순위를 **반드시** 따른다.

1. **운영 안정성** (t2.micro에서 프로세스가 죽지 않는 것)
2. **메모리 / CPU 사용량 최소화**
3. **데이터 정합성**
   - 중복 체크 방지
   - 중복 알림 방지
4. **개발 편의성 / 가독성**
5. **기능 확장**

> ⚠️ 성능/안정성을 희생하면서 얻는 DX 개선이나 추상화는 허용하지 않는다.

---

## ⛔ 금지 사항 (운영 / 비용 / 보안)

다음 제안은 **하지 않는다**.

### Docker / Infra

- production 환경에서 `docker compose`에 `build:` 사용 ❌  
  → **항상 image + digest 고정**
- production에서 멀티 브라우저 풀, 동시성 증가 제안 ❌
- t2.micro 기준에서 메모리 사용량 증가를 전제로 한 설계 ❌

### Worker / Puppeteer

- `BROWSER_POOL_SIZE`, `WORKER_CONCURRENCY` 증가 제안 ❌
- 새 Chromium 인스턴스를 매 작업마다 생성 ❌
- 페이지/브라우저 close 누락 ❌

### Prisma / DB

- `src/generated/**` 파일 직접 수정 ❌
- Prisma import 경로 혼용 ❌  
  (`@prisma/client` 사용 금지, `@/generated/prisma/client`만 허용)
- DB 연결 보안 하향 (`sslmode=require` 등) 제안 ❌

### 보안

- 시크릿 / 토큰 / 키를 문서나 코드 예시에 그대로 작성 ❌  
  (항상 마스킹 또는 placeholder 사용)

---

## 🗺️ 기능별 코드 위치 가이드

Claude는 기능 변경 시 **아래 엔트리 포인트부터 확인**한다.

### 인증 / 세션 (NextAuth.js v4)

- 설정: `src/lib/auth.ts`
- API: `src/app/api/auth/*`

### 숙소 관리 (CRUD)

- API: `src/app/api/accommodations/*`
- 페이지: `src/app/accommodations/*`

### 워커 / 크론

- 엔트리 포인트: `src/lib/cron/worker.ts`
- 처리 흐름:  
  `worker.ts` → `processor.ts` → `checkers/*`

### 체커 (Scraping)

- 공통 로직: `src/lib/checkers/baseChecker.ts`
- 플랫폼별:
  - Airbnb: `src/lib/checkers/airbnb.ts`
  - Agoda: `src/lib/checkers/agoda.ts`
- 브라우저 관리: `src/lib/checkers/browserPool.ts`

### 알림

- 카카오 메시지: `src/lib/kakao/*`

### DB / ORM

- Prisma Client: `src/lib/prisma.ts`
- Schema: `prisma/schema.prisma`

---

## 🌱 환경별 실행 규칙

### Local (`docker-compose.local.yml`)

- 목적: **개발 전용**
- 특징:
  - DB 포함
  - `build:` 사용 허용
  - 메모리/동시성 제한 느슨함

### Develop (`docker-compose.develop.yml`)

- 목적: **develop 브랜치 검증**
- 특징:
  - 미리 빌드된 dev 이미지 사용
  - 운영과 유사하지만 제한은 완화

### Production (`docker-compose.production.yml`)

- 목적: **실서비스**
- 필수 규칙:
  - image + digest 고정
  - CA 번들 마운트 필수
  - Worker 메모리 제한 엄수
  - 동시성/풀 크기 변경 금지

---

## 🧯 트러블슈팅 체크리스트

### Prisma TLS 오류

`self-signed certificate in certificate chain`

확인 순서:

1. 컨테이너에 `ca-certificates` 설치 여부
2. RDS CA 번들 파일 마운트 여부
3. `DATABASE_URL`에 `sslrootcert` 포함 여부
4. `sslmode=verify-full` 유지 여부

> ❗ 보안 하향(`require`, `prefer`) 제안 금지

---

### Worker 메모리 급증 / 프로세스 종료

점검 포인트:

- 브라우저/페이지 close 누락 여부
- 브라우저 풀 재사용 여부
- 리소스 차단 설정 유지 여부
- 장시간 실행 시 메모리 누수 가능성

원칙:

- **브라우저 1개**
- **동시 처리 1개**
- 필요 시 재시작은 허용, 확장은 불가

---

## 🧪 변경 시 검증 기준

리팩토링 또는 기능 수정 후 반드시 아래를 만족해야 한다.

- 체크 결과 로직 동일 (패턴 탐지 결과 변경 ❌)
- 중복 알림 발생 ❌
- Worker 쿼리 수 증가 ❌
- 메모리 사용량 증가 ❌

권장 검증 명령:

```bash
pnpm lint
pnpm test
pnpm build
pnpm cron   # 로컬에서 워커 단독 실행 확인
```
