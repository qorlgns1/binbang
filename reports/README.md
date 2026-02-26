# MoonCatch Reports

운영용 SQL 모음.

- `daily.sql`
  - 직전 1일 기준 알림 성공률, 오탐 후보, 클릭아웃 집계
- `consent-reconfirm.sql`
  - 최신 동의가 `opt_in`이면서 2년 경과한 재확인 대상 추출

권장 실행 순서:
1. `daily.sql` 요약 쿼리 실행
2. `daily.sql` 상세 쿼리(오탐 후보/클릭아웃 숙소별) 실행
3. 주 1회 `consent-reconfirm.sql` 실행
