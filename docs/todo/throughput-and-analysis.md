# 처리량 대시보드 개선 + 데이터 분석 확장

이 문서는 처리량 모니터링 대시보드 구현 후 대화에서 도출된 미완료 작업을 정리한 것입니다.

---

## 높은 우선순위

### 1. 시간 버킷 간격 조정 (최소 30개 데이터 포인트 보장)

현재 1시간 필터 시 5분 간격 = 12개 데이터 포인트만 표시되어 차트가 빈약합니다.

| 기간 | 현재 | 변경 후 | 데이터 포인트 |
|------|------|---------|-------------|
| ≤1h | 5분 (12개) | **2분** | **30개** |
| ≤6h | 15분 (24개) | **10분** | **36개** |
| ≤24h | 30분 (48개) | 30분 (유지) | 48개 |
| >24h | 180분 (56개) | 180분 (유지) | ≥56개 |

**작업 파일**: `src/app/api/admin/throughput/history/route.ts` — `autoBucketMinutes()` 함수 수정

### 2. 처리량 추이 차트 툴팁 데이터 검증

처리량/분 값의 정확성 확인 필요. 워커 사이클 타이밍에 따라 값이 들쭉날쭉할 수 있음.

- 현재 계산: `totalChecks / bucketMinutes`
- 워커가 30분마다 한 사이클을 돌기 때문에, 체크가 몰린 버킷은 과대 표시되고 빈 버킷은 0이 됨
- 차트에 처리량/분 라인과 성공/에러 카운트 라인이 스케일이 달라 같이 읽기 어려울 수 있음

**작업 파일**: `src/app/api/admin/throughput/history/route.ts`, `src/app/admin/throughput/_components/throughputChart.tsx`

---

## 중간 우선순위

### 3. 가격 숫자 파싱 + 환율 변환

현재 가격이 문자열(`"₩150,000"`, `"$200.50"`)로만 저장되어 가격 추이 분석이 불가능합니다.

**스키마 변경:**
- CheckLog에 `priceAmount Int?`, `priceCurrency String?`, `priceKRW Int?` 추가
- Accommodation에 `lastPriceAmount Int?`, `lastPriceCurrency String?`, `lastPriceKRW Int?` 추가

**구현 항목:**
- 가격 파싱 유틸리티: 통화 심볼 → ISO 코드 매핑 + 최소 단위 Int 변환
- 환율 모듈: `open.er-api.com` (무료, API 키 불필요) + 메모리/DB/하드코딩 fallback 캐시
- processor.ts 통합: 사이클 시작 시 환율 1회 조회, 체크 저장 시 파싱 + 변환
- 기존 데이터 백필 스크립트

**작업 파일:**
- `prisma/schema.prisma`
- `src/lib/checkers/priceParser.ts` (신규)
- `src/lib/exchangeRate.ts` (신규)
- `src/lib/cron/processor.ts`
- `scripts/backfill-prices.ts` (신규)

### 4. 가용성 분석 대시보드

기존 CheckLog 데이터를 활용하여 숙소 예약 가능 패턴을 분석하는 대시보드.

**대시보드 구성:**
- Summary 카드 4개: 모니터링 숙소 수, 현재 가용률, 가용 전환 횟수, 평균 가용 간격
- 타임라인 차트: 시간대별 AVAILABLE/UNAVAILABLE 수 (라인 차트, 1h/6h/24h/7d)
- 시간대별 패턴 차트: 0~23시별 가용 전환 횟수 (바 차트)
- 숙소별 테이블: 이름, 플랫폼, 현재 상태, 가용률%, 마지막 가용 시각, 상태 변경 횟수

**API 라우트 (4개):**
- `GET /api/admin/availability/summary`
- `GET /api/admin/availability/timeline`
- `GET /api/admin/availability/accommodations`
- `GET /api/admin/availability/patterns`

**작업 파일:**
- `src/types/admin.ts` — 가용성 타입 추가
- `src/app/api/admin/availability/` — API 4개 (신규)
- `src/hooks/queryKeys.ts` — 가용성 query key 추가
- `src/hooks/useAvailability*.ts` — 훅 4개 (신규)
- `src/app/admin/availability/` — 페이지 + 컴포넌트 5개 (신규)
- `src/app/admin/_components/adminNav.tsx` — 네비게이션 추가

---

## 낮은 우선순위

### 5. 평균 처리량 계산 방식 개선 (완료 후 모니터링)

`summary/route.ts`에서 CheckCycle 기반 계산으로 변경 완료. CheckCycle 데이터가 충분히 쌓인 후 fallback 로직이 정상 동작하는지 확인 필요.

- CheckCycle 있을 때: `avg(totalCount / durationMs * 60000)` — 워커 비활성 시간 제외
- CheckCycle 없을 때 (fallback): 전체 시간 범위 기반 — 비활성 시간 포함되어 부정확

### 6. 추가 분석 지표 검토

데이터가 더 쌓인 후 검토할 항목:
- `daysUntilCheckIn`: 체크인까지 남은 일수 기록 → 막판 취소 패턴 분석
- 알림 후 예약 완료 피드백: 알림 → 예약 전환율 측정
- 숙소 메타데이터 보강: 지역, 숙소 유형, 최대 수용 인원 → 지역별/유형별 분석
