# RBAC UI 기능 구현 TODO

## 개요
RBAC 시스템(Role, Plan, Permission, AuditLog, Subscription) 기반 UI 기능 구현 계획

---

## 1차 구현 (완료)

### 관리자용

- [x] **유저 플랜 변경 다이얼로그** ✅
  - 위치: `/admin/users` 페이지 내 PlanChangeDialog
  - 기능: 관리자가 유저의 플랜을 FREE/PRO/BIZ 중 선택하여 변경
  - AuditLog 자동 기록
  - 파일: `src/app/admin/users/_components/planChangeDialog.tsx`

- [x] **전체 감사 로그 페이지** ✅
  - 위치: `/admin/audit-logs`
  - 기능: 서비스 전체 AuditLog 타임라인 조회
  - 필터: 액션 타입, 대상 엔티티
  - 페이지네이션 (커서 기반 무한 스크롤)
  - 파일: `src/app/admin/audit-logs/page.tsx`, `auditLogTimeline.tsx`

### 사용자용

- [x] **사용량 게이지 (Quota Tracker)** ✅
  - 위치: `/dashboard` 페이지 상단
  - 기능: "사용 중인 숙소 3/5개" 프로그레스 바
  - PlanQuota.MAX_ACCOMMODATIONS 기준
  - 파일: `src/components/quota-gauge.tsx`

---

## 2차 구현 (완료)

### 관리자용

- [x] **유저 활동 타임라인** ✅
  - 위치: `/admin/users/[id]` 상세 페이지
  - 기능: 특정 유저의 활동 이력 (AuditLog, CheckLog, Accommodation 통합)
  - 활동 유형별 필터링, 무한 스크롤 페이지네이션
  - 파일: `src/app/admin/users/[id]/page.tsx`, `userActivityTimeline.tsx`, `activityItem.tsx`

### 사용자용

- [x] **플랜 비교 페이지 (Pricing Page)** ✅
  - 위치: `/pricing`
  - 기능: 플랜별 혜택 비교 카드 (숙소 개수, 체크 주기)
  - Plan, PlanQuota 데이터 활용
  - 업그레이드 버튼 (결제 연동 전까지는 이메일 문의 링크)
  - 파일: `src/app/pricing/page.tsx`, `pricingCards.tsx`

- [x] **구독 정보 관리 (Subscription Detail)** ✅
  - 위치: `/settings/subscription`
  - 기능: 현재 플랜, 사용량 게이지, 결제 정보 (Subscription 있을 때)
  - Subscription 모델 활용
  - 파일: `src/app/settings/subscription/page.tsx`, `subscriptionOverview.tsx`

---

## 3차 구현 (장기)

- [ ] **Permission 기반 세분화된 접근 제어**
  - 현재는 Role 단위 (USER/ADMIN)
  - 추후 Permission 단위로 기능별 접근 제어

- [ ] **플랜별 기능 제한 적용**
  - [x] 숙소 등록 시 quota 초과 체크 ✅
  - [ ] 체크 주기 플랜별 차등 적용

- [ ] **결제 연동**
  - Stripe 또는 Toss Payments
  - Webhook으로 Subscription 상태 동기화

---

## 관련 파일

### 스키마
- `prisma/schema.prisma`: Plan, PlanQuota, Role, Permission, AuditLog, Subscription

### API
- `POST /api/admin/users/[id]/roles`: 역할 변경
- `PATCH /api/admin/users/[id]/plan`: 플랜 변경
- `GET /api/admin/audit-logs`: 감사 로그 목록
- `GET /api/admin/users/[id]`: 유저 상세 정보
- `GET /api/admin/users/[id]/activity`: 유저 활동 타임라인
- `GET /api/user/quota`: 현재 사용량 및 한도
- `GET /api/user/subscription`: 구독 정보

### 유틸
- `src/lib/rbac.ts`: isAdmin() 헬퍼
- `src/lib/auditLog.ts`: createAuditLog()
