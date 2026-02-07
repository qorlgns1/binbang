# 추후 작업 목록

이 문서는 설정 관리 기능 구현 중 발견된, 아직 처리하지 않은 개선 사항을 정리한 것입니다.

---

## 높은 우선순위

### 1. 설정 값 상한/하한 검증 추가

현재 API에서 음수만 차단하고 **상한 검증이 없어** 관리자 실수로 운영이 중단될 수 있습니다.

| 설정                          | 위험한 값           | 결과                             |
| ----------------------------- | ------------------- | -------------------------------- |
| `worker.concurrency`          | `100`               | 무료/저사양 인스턴스 메모리 폭주 |
| `worker.browserPoolSize`      | `10`                | OOM kill                         |
| `browser.navigationTimeoutMs` | `0`                 | 즉시 타임아웃, 모든 체크 실패    |
| `worker.cronSchedule`         | `*/1 * * * *` (1분) | 과부하                           |

**작업 내용**: `src/app/api/admin/settings/route.ts`의 PATCH 핸들러에 키별 `min`/`max` 범위 검증 추가

---

## 중간 우선순위

### 2. browserPool waiter 타임아웃 추가

`src/lib/checkers/browserPool.ts`에서 브라우저 생성이 멈출 경우 waiter가 무한 대기할 수 있습니다.

**작업 내용**: waiter promise에 타임아웃(예: 30초) 추가, 초과 시 reject

### 3. settings/route.ts 트랜잭션 결과 의존성 개선

`src/app/api/admin/settings/route.ts`에서 `$transaction` 결과 배열을 `slice()`로 분리하는 방식이 결과 순서에 의존합니다.

**작업 내용**: 설정 업데이트와 변경 로그 생성을 분리하거나, 타입 안전한 방식으로 결과 처리

### 4. useSettingsHistory 필터 키 메모이제이션

`src/hooks/useSettingsHistory.ts`에서 필터 키 객체가 렌더마다 새로 생성됩니다.

**작업 내용**: `useMemo`로 필터 키 객체 메모이제이션

---
