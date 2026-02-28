# 구글폼 운영형 MVP 백로그

> 최종 업데이트: 2026-02-27
> P0-1~P0-10, P1-1~P1-2 완료. 미완료 항목만 남김.
> 운영 정책/상품 기준: `docs/guides/google-form-service-operations.md`

---

## P1 — 단기 (미완료)

### P1-3. 가격표/기간 기반 견적 규칙 엔진

플랫폼/기간/난이도별 기본 요금 규칙 저장 및 미리보기 지원.
운영자 감각 의존 제거.

### P1-4. 운영 SLA 타이머

- `RECEIVED` 후 30분 내 미응답 건 경고
- `WAITING_PAYMENT` 장기 정체 건 자동 리마인드

### P1-5. Evidence Packet 자동 봉인 파이프라인

멱등 키(`caseId + firstConditionMetAt`) 기준 패킷 1건만 생성.
`sealedAt` 이후 수정 불가. 스크린샷/발송 로그 일부 실패 시 `PARTIAL`로 봉인 + 재시도 큐 이관.

구현 위치:
- `packages/db/prisma/schema.prisma`
- `packages/worker-shared/src/runtime/notifications/**`
- `apps/web/src/services/evidence.service.ts`

### P1-6. Q4 자동 검증 규칙 엔진 (LLM 보조)

`GREEN/AMBER/RED` 판정과 누락 필드/모호 표현 리포트. `AMBER/RED`는 운영자 확인 전 상태 전이 불가. LLM 비가용 시 규칙 기반 최소 판정 동작.

구현 위치:
- `apps/web/src/services/condition-parser.service.ts`
- `apps/web/src/app/admin/cases/_components/clarification-panel.tsx`

---

## P2 — 검증 후 확장

### P2-1. 고객용 읽기 전용 상태 페이지 (비로그인 링크)

현재 상태/주의문구/최근 알림 시각 확인. 예약 대행 오해 방지 문구 고정 필요.

### P2-2. 분쟁 리스크 스코어링

분쟁 가능성 높은 요청 사전 식별. 입력: Q4 모호성, 잦은 조건 변경, 답변 지연 등.

### P2-3. 광고 소재-요청 품질 상관 분석

클릭이 아닌 "결제/조건 충족" 중심으로 광고 문구 최적화.
