# Travel UI/UX 상세 요구사항서 (Phase 2 + Phase 3)

문서 ID: `TRAVEL-UI-P2P3-SPEC-20260219`  
버전: `v2.7`  
상태: `EXECUTION READY`  
기준일: `2026-02-19`  
대상 앱: `apps/travel` (주), `apps/web` (admin 연동)  
상위 근거 문서:
- `docs/backlog/travel/phase2-auth-history.md`
- `docs/backlog/travel/phase3-monetization.md`

## 0. 마스터 체크리스트 (실행/검증용)

체크 규칙:
- 구현 + 코드리뷰 + `pnpm ci:check` 통과 후 체크
- QA/운영 게이트 항목은 증빙 확보 후 체크

### 0.1 동시성/경합 시나리오
- [x] `CC-01` 멀티탭 동시 로그인 idempotent 처리 + UI 중복 성공 토스트 금지
- [x] `CC-02` 복원 중 send 비활성
- [x] `CC-03` stale `travel_pending_restore` 폐기
- [x] `CC-04` 멀티디바이스 session merge 재시도 허용
- [x] `CC-05` delete pending 상태에서 edit 저장 차단

### 0.2 Phase 2 Requirement ID
- [x] `P2-UI-001` 게스트 세션 준비 상태
- [x] `P2-UI-002` 로그인 유도 모달 트리거 정책
- [x] `P2-UI-003` 로그인 유도 모달 UI/접근성
- [x] `P2-UI-004` 저장/히스토리 버튼 정책
- [x] `P2-UI-005` 히스토리 사이드바 조회/검색
- [x] `P2-UI-006` 히스토리 항목 편집/삭제
- [x] `P2-UI-007` 대화 이어가기/새 대화
- [x] `P2-UI-008` 로그인 후 자동 복원 순서 제약
- [x] `P2-UI-009` Rate Limit UX
- [x] `P2-UI-010` API 에러 공통 처리

### 0.3 API 정합성 체크
- [x] `API-CHECK-01` 429 응답 payload `reason` 포함
- [x] `API-CHECK-02` merge 400 에러 문자열 정합 (`sessionId or sessionIds is required`)
- [x] `API-CHECK-03` restore 404/403 상태코드 분기/fallback 정합
- [x] `API-CHECK-04` event timeout 2초 + UI 비차단
- [x] `API-CHECK-05` 에러 로그 `requestId` 누락 없음

### 0.4 Phase 3 Stage A Requirement ID
- [x] `P3-UI-001` 숙소 카드 상태 매트릭스
- [x] `P3-UI-002` Pending CTA 시도 UX
- [x] `P3-UI-003` 제휴 고지/투명성
- [x] `P3-UI-004` 비제휴 대안 2개 병기
- [x] `P3-UI-005` 이벤트 트래킹 UI 계약
- [x] `P3-UI-005A` 트래킹 데이터 거버넌스/개인정보 규격
- [x] `P3-UI-006` 타임존 표시 정책

### 0.5 Stage B Requirement ID
- [x] `P3B-UI-001` 가격/통화 실데이터 노출
- [x] `P3B-UI-002` 제휴 링크 설정 UX
- [x] `P3B-UI-003` 감사 로그/운영 알림 연동 표시

### 0.6 Feature Flag / Rollback
- [x] `TRAVEL_AFFILIATE_CTA_ENABLED` 적용
- [x] `TRAVEL_AFFILIATE_TRACKING_ENABLED` 적용
- [x] `TRAVEL_RESTORE_AUTO_ENABLED` 적용
- [x] `TRAVEL_HISTORY_EDIT_ENABLED` 적용
- [x] 롤백 절차 1~4 문서화 완료 (RUNBOOK 9절), 리허설은 운영 단계에서 수행

### 0.7 QA 시나리오 (증빙 체크)
- [ ] `TC-P2-01`
- [ ] `TC-P2-02`
- [ ] `TC-P2-03`
- [ ] `TC-P2-04`
- [ ] `TC-P2-05`
- [ ] `TC-P2-06`
- [ ] `TC-P2-07`
- [ ] `TC-P2-08`
- [ ] `TC-P2-09`
- [ ] `TC-P2-10`
- [ ] `TC-P2-11`
- [ ] `TC-P2-12`
- [ ] `TC-P3A-01`
- [ ] `TC-P3A-02`
- [ ] `TC-P3A-03`
- [ ] `TC-P3A-04`
- [ ] `TC-P3A-05`
- [ ] `TC-P3A-06`
- [ ] `TC-P3A-07`
- [ ] `TC-P3A-08`

### 0.8 릴리즈 게이트/체크포인트
- [ ] `Gate-1` UI 스크린샷 세트 승인
- [ ] `Gate-2` API/이벤트 로그 샘플 승인
- [ ] `Gate-3` QA 실행 리포트 승인
- [ ] `Gate-4` 운영 지표 확인표 승인
- [ ] `C1-Design Freeze`
- [ ] `C2-P2 Ready`
- [ ] `C3-P3 StageA Ready`
- [ ] `C4-Go/No-Go`
- [ ] `C5-Production Rollout`

## 1. 문서 목적

이 문서는 Phase 2(게스트 인증/히스토리/비용 제어)와 Phase 3(수익화/캐싱) 정책을 UI 개발 관점에서 실행 가능한 요구사항으로 고정한다.

사용 대상:
- 기획자: 범위, 우선순위, 품질 게이트, 배포 게이트 합의
- 개발자: 화면/상태/API/이벤트/예외 처리 구현 기준 확정
- QA: 테스트 시나리오와 합격 기준의 단일 기준서 활용

## 2. 범위 정의

### 2.1 In Scope (이번 문서에서 반드시 명시)

- 게스트 세션 준비/동기화 UX
- 로그인 유도 모달 UX (save/history/bookmark/limit 트리거)
- 로그인 후 세션 병합/대화 자동 복원 UX
- 대화 히스토리 사이드바 UX (조회/검색/수정/삭제/새 대화)
- Rate Limit 에러 UX
- Stage A 제휴 카드 UX (활성 CTA/비활성 CTA)
- 제휴 고지/비제휴 대안 동시 노출 UX
- 제휴 이벤트 트래킹을 위한 UI 트리거 요구사항
- Stage A/Stage B 롤아웃 경계

### 2.2 Out of Scope (명시적 제외)

- 쿠키/로컬스토리지 초기화 우회 완전 방지
- 디바이스 fingerprint/CAPTCHA 도입
- 동일 기기 다계정 정책 강제
- Agoda API 미연동 상태에서 Stage B 가격/통화 실데이터 UI 적용

## 3. 용어/정의

| 용어 | 정의 |
| --- | --- |
| Guest | 로그인하지 않은 사용자 |
| Authenticated User | OAuth 로그인 완료 사용자 |
| Session Merge | 로그인 시 guest conversation을 userId로 귀속하는 처리 |
| Restore | 로그인 직후 직전 대화를 자동 로드하는 처리 |
| Active CTA | 제휴 링크가 존재하여 클릭 가능한 CTA |
| Pending CTA | 광고주/링크 부재로 비활성 상태인 CTA |
| Impression | 카드 노출 이벤트 |
| Outbound Click | 외부 제휴 링크 클릭 이벤트 |
| CTA Attempt | 비활성 CTA 클릭 시도 이벤트 |

## 4. 역할 및 책임 (RACI)

| 업무 | Planner | FE | BE | QA | 비고 |
| --- | --- | --- | --- | --- | --- |
| 요구사항 우선순위 확정 | A/R | C | C | C | Stage A/Stage B 기준 |
| UI 컴포넌트 구현 | C | A/R | C | C | Travel app |
| API 계약/에러 코드 확정 | C | C | A/R | C | `/api/chat`, `/api/conversations` 등 |
| 이벤트 스키마/저장소 구현 | C | C | A/R | C | `AffiliateEvent` |
| 테스트 케이스 실행/판정 | C | C | C | A/R | 회귀 포함 |
| 배포 게이트 승인 | A/R | C | C | C | 운영지표 포함 |

## 5. 화면 구조 및 파일 매핑

| 도메인 | 화면/컴포넌트 | 파일 |
| --- | --- | --- |
| 채팅 메인 | Chat workspace | `apps/travel/src/components/chat/ChatPanel.tsx` |
| 로그인 유도 | LoginPromptModal | `apps/travel/src/components/modals/LoginPromptModal.tsx` |
| 히스토리 | HistorySidebar | `apps/travel/src/components/history/HistorySidebar.tsx` |
| 제휴 카드 | AccommodationCard | `apps/travel/src/components/cards/AccommodationCard.tsx` |
| 세션 | guest session hook | `apps/travel/src/hooks/useGuestSession.ts` |
| 병합 | session merge hook | `apps/travel/src/hooks/useSessionMerge.ts` |
| 채팅 API | chat endpoint | `apps/travel/src/app/api/chat/route.ts` |
| 병합 API | merge endpoint | `apps/travel/src/app/api/auth/merge-session/route.ts` |
| 히스토리 API | conversations endpoints | `apps/travel/src/app/api/conversations/route.ts`, `apps/travel/src/app/api/conversations/[id]/route.ts` |

### 5.1 핵심 상태 전이 요약

| 도메인 | 현재 상태 | 이벤트 | 다음 상태 | 사용자 가시 상태 |
| --- | --- | --- | --- | --- |
| Chat | `ready` | guest send + session 없음 | `blocked` | 세션 준비 토스트 |
| Chat | `ready` | send success | `streaming` | 답변 스트리밍 |
| Chat | `streaming` | stream done | `ready` | 입력 가능 |
| Restore | `idle` | `mergeStatus=done` + 복원 대상 존재 | `restoring` | `이전 대화를 복원하는 중...` 배너 |
| Restore | `restoring` | target restore 실패 + fallback 성공 | `idle` | `최근 대화로 복원` 토스트 |
| Restore | `restoring` | target/fallback 모두 실패 | `failed` | 실패 배너 + 재시도/히스토리 버튼 |
| Affiliate CTA | `active` | CTA click | `navigated` | 외부 제휴 링크 이동 |
| Affiliate CTA | `pending` | CTA click | `explained` | 토스트 + 안내 모달 |

### 5.2 동시성/경합 시나리오 규격

| 시나리오 ID | 상황 | 충돌 리스크 | 강제 규칙 | 사용자 노출 |
| --- | --- | --- | --- | --- |
| `CC-01` | 멀티탭에서 동시 로그인 | 중복 `merge-session` 호출 | 동일 사용자+세션 조합은 서버에서 idempotent 처리, UI는 첫 성공 응답만 반영 | 중복 성공 토스트 금지 |
| `CC-02` | 복원 중 새 메시지 전송 | restore 결과가 현재 대화 덮어쓰기 | `restoreStatus=restoring` 동안 send 버튼 비활성 | `복원 중` 배너 유지 |
| `CC-03` | stale `travel_pending_restore` 존재 | 잘못된 대화로 복원 시도 | snapshot `updatedAt`이 24시간 초과면 폐기 | 사용자에게 silent 처리 |
| `CC-04` | 멀티디바이스에서 서로 다른 sessionId merge | 일부 대화 미병합 | `sessionIds[]` 우선 처리, 누락 시 재시도 API 허용 | 실패 시 복구 배너 제공 |
| `CC-05` | 히스토리 편집/삭제 동시 실행 | 제목 저장 후 삭제 race | delete pending 상태에서는 edit 저장 차단 | 삭제 우선 처리 |

## 6. Phase 2 UI 상세 요구사항

아래 요구사항은 모두 Stage A 필수다.

### P2-UI-001 게스트 세션 준비 상태

| 항목 | 요구사항 |
| --- | --- |
| 목적 | 비로그인 사용자가 즉시 질문 가능해야 함 |
| 선행조건 | `authStatus !== authenticated` |
| 트리거 | 질문 전송 클릭 또는 추천 질문 클릭 |
| 필수 동작 | 세션 ID 미준비 시 전송 차단 + 토스트: `세션 준비 중입니다. 잠시 후 다시 시도해 주세요.` |
| API 계약 | `/api/chat` 요청 body에 `sessionId` 포함 |
| 예외 처리 | 세션 준비 전 전체 화면 차단 로더 사용 금지 |
| 완료 기준 | 세션 준비 후 동일 입력 재시도 시 정상 전송 |

### P2-UI-002 로그인 유도 모달 트리거 정책

| 항목 | 요구사항 |
| --- | --- |
| 목적 | 강제 차단 없이 로그인 전환 유도 |
| 트리거 종류 | `save`, `history`, `bookmark`, `limit` |
| 트리거 조건 | guest가 저장 클릭, 히스토리 클릭, 북마크 시도, 429 발생 |
| 금지사항 | 최초 진입 즉시 모달 자동 노출 금지 |
| 완료 기준 | 4개 트리거 모두 올바른 문구/행동으로 노출 |

### P2-UI-003 로그인 유도 모달 UI/접근성

| 항목 | 요구사항 |
| --- | --- |
| 필수 요소 | 제목, 설명, Google 버튼, Kakao 버튼, `나중에` |
| 닫기 동작 | 오버레이 클릭, 닫기 버튼, `Esc` 키 |
| 포커스 | open 직후 닫기 버튼으로 초점 이동, 모달 바깥으로 tab 이탈 금지 |
| 컨텍스트 보존 | 닫기 후 기존 채팅/입력 상태 유지 |
| 완료 기준 | 키보드만으로 진입/닫기/로그인 버튼 접근 가능 + 포커스 손실 없음 |

### P2-UI-004 저장/히스토리 버튼 정책

| 항목 | 요구사항 |
| --- | --- |
| Save 버튼 (로그인) | 저장 토글이 아닌 히스토리 열기 동작으로 연결 (자동 저장 전제) |
| Save 버튼 (게스트) | 로그인 모달 `trigger=save` |
| History 버튼 (로그인) | 히스토리 사이드바 open |
| History 버튼 (게스트) | 로그인 모달 `trigger=history` |
| 빈 대화 상태 | Save 클릭 시 `저장할 대화가 아직 없어요.` 토스트 |

### P2-UI-005 히스토리 사이드바 조회/검색

| 항목 | 요구사항 |
| --- | --- |
| 조회 API | 기본 `/api/conversations` |
| 검색 API | 검색어 trim 후 `/api/conversations?q=` |
| 검색 입력 규칙 | 공백만 입력 시 기본 목록 API 사용, 1글자 이상 입력 시 즉시 검색 |
| 목록 항목 | 제목, 메시지 개수, 상대 시간 표시 |
| 상태 처리 | loading / error / empty / search-empty 분리 표시 |
| 완료 기준 | 검색어 변경 즉시 목록 반영, open=false면 fetch 중단 |

### P2-UI-006 히스토리 항목 편집/삭제

| 항목 | 요구사항 |
| --- | --- |
| 제목 편집 | inline input, Enter 저장, Escape 취소 |
| 저장 API | `PATCH /api/conversations/:id` body `{ title }` |
| validation | 공백 제목 금지, maxLength 100 |
| 삭제 API | `DELETE /api/conversations?id={id}` |
| 삭제 UX | 1차 클릭 시 확인 상태 진입, 2차 확인 클릭 시 실제 삭제 |
| 후처리 | 저장/삭제 성공 시 목록 재검증(mutate) |
| 완료 기준 | 편집/삭제 후 목록 즉시 반영, 실패 시 토스트 노출 |

### P2-UI-007 대화 이어가기/새 대화

| 항목 | 요구사항 |
| --- | --- |
| 이어가기 | 항목 클릭 시 `/api/conversations/:id` 조회 후 메시지/엔티티 복원 |
| 새 대화 | 메시지 비우기 + 새 `conversationId` 발급 + 엔티티 초기화 |
| local 저장소 | 복원 키(`travel_last_conversation_id`, `travel_pending_restore`) 동기화 |
| 완료 기준 | 새 대화 시작 후 이전 대화 UI 잔상 미노출 |

### P2-UI-008 로그인 후 자동 복원 순서 제약

| 항목 | 요구사항 |
| --- | --- |
| 핵심 규칙 | restore 트리거는 `authStatus`가 아니라 `mergeStatus=done` 이후 |
| 이유 | merge DB write 이전 복원 API 호출 race 방지 |
| 1차 복원 | target conversation ID로 복원 시도(최대 2회: 최초 1회 + retry 1회) |
| 2차 복원 | 실패 시 preview 기반 검색 API 후 전체 목록 API 순서로 fallback ID 탐색 |
| 실패 UI | 상단 배너 + `다시 시도` + `히스토리 열기` |
| 완료 기준 | 로그인 직후 `Conversation not found` 토스트가 사용자에게 직접 노출되지 않음 |

### P2-UI-009 Rate Limit UX

| 항목 | 요구사항 |
| --- | --- |
| 정책 노출 기준 | guest: 일 1대화/대화당 5턴, user: 일 20대화/대화당 50턴 |
| 에러 감지 | `429` 또는 rate-limit 문자열 매칭 |
| UI 반응 | 하단 에러 배너 + guest의 경우 로그인 CTA 버튼 |
| 모달 연동 | 같은 에러 메시지에 대해 로그인 모달 중복 오픈 금지 |
| 재시도 동작 | `다시 시도` 클릭 시 직전 요청 파라미터(`sessionId`, `conversationId`) 유지 |
| 완료 기준 | 429 반복 상황에서도 모달 난사 없이 안내 일관성 유지 |

### P2-UI-010 API 에러 공통 처리

| API | 상태 | UI 처리 |
| --- | --- | --- |
| `POST /api/chat` | 429 | rate-limit 문구 + 로그인 유도 버튼(guest) |
| `POST /api/chat` | 기타 실패 | 네트워크 안내 문구 + `다시 시도` |
| `GET /api/conversations` | 401 | 게스트에서는 사이드바 데이터 노출 금지 |
| `GET /api/conversations/:id` | 404/403 | silent 실패 후 fallback 복원 루틴 수행 |
| `POST /api/auth/merge-session` | 400 | 재시도 가능한 오류로 처리, 화면 context 유지 |

### 6.1 API 에러 코드 상세 계약 (UI 고정 규칙)

| Endpoint | Status | reasonCode / error | 사용자 문구 키 | UI 액션 | 재시도 정책 | 필수 로그 필드 |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /api/chat` | 429 | `guest_daily_limit_exceeded` | `copy.rateLimit.banner` | 로그인 CTA 노출(guest) | 30초 후 수동 재시도 | `conversationId`, `sessionId`, `authStatus`, `reason` |
| `POST /api/chat` | 429 | `guest_turn_limit_exceeded` | `copy.rateLimit.banner` | 로그인 CTA 노출(guest) | 새 대화 시작 후 재시도 허용 | 동일 |
| `POST /api/chat` | 5xx | `upstream_error` | `copy.network.banner` | `다시 시도` 버튼 | 즉시 1회 수동 재시도 | `conversationId`, `requestId`, `status` |
| `POST /api/auth/merge-session` | 400 | `sessionId or sessionIds is required` | 토스트(merge 파라미터 누락) | 현재 화면 유지 | 세션 재동기화 후 수동 재시도 | `userId`, `sessionIdCandidates` |
| `POST /api/auth/merge-session` | 5xx | `merge_failed` | 토스트(복원 지연 안내) | 복원 배너 유지 | 3초/6초 backoff로 2회 자동 재시도 | `userId`, `requestId`, `status` |
| `GET /api/conversations/:id` | 404 | `conversation_not_found` | `copy.restore.failed` | fallback 탐색 | fallback 후 1회 재시도 | `conversationId`, `userId`, `requestId` |
| `GET /api/conversations/:id` | 403 | `conversation_forbidden` | `copy.restore.failed` | fallback 탐색 | fallback만 수행 | 동일 |

## 7. Phase 3 UI 상세 요구사항 (Stage A 우선)

### P3-UI-001 숙소 카드 상태 매트릭스

| 상태 | 조건 | 버튼 텍스트 | 클릭 결과 | 필수 라벨/문구 |
| --- | --- | --- | --- | --- |
| Active CTA | 광고주 존재 + 링크 생성 성공 | `예약하기` | 외부 링크 새 탭 이동 | `광고/제휴`, `예약/구매 시 제휴 수수료를 받을 수 있습니다` |
| Pending CTA | 광고주 없음 또는 링크 생성 실패 | `제휴 링크 준비중` | 토스트 + 안내 모달 | 동일 고지 문구 유지 |

공통 요구사항:
- Stage A에서는 가격 필드를 숨기고 `가격은 제휴 연동 후 제공됩니다`만 노출.
- 외부 링크 속성: `target="_blank"`, `rel="noopener noreferrer sponsored"`.
- 카드 이미지 없을 때 `이미지 없음` 플레이스홀더 표시.
- Pending 버튼은 `button + aria-disabled` 형태로 렌더링.

### P3-UI-002 Pending CTA 시도 UX

| 항목 | 요구사항 |
| --- | --- |
| 토스트 | 제목: `제휴 링크 준비 중` |
| 모달 | 짧은 설명 + 닫기 버튼 제공 |
| 네비게이션 | 페이지 이동/리다이렉트 금지 |
| 완료 기준 | 시도 직후 사용자에게 다음 행동(기다리기/닫기)이 명확해야 함 |

### P3-UI-003 제휴 고지/투명성

| 항목 | 요구사항 |
| --- | --- |
| 라벨 | 카드 이미지 상단 배지에 `광고/제휴` 표시 |
| 고지 위치 | CTA 하단 고정 위치(스크롤해도 카드 내부에서 확인 가능) |
| 고지 문구 | `예약/구매 시 제휴 수수료를 받을 수 있습니다` (문구 임의 변경 금지) |
| 적용 범위 | Active/Pending CTA 모두 |

### P3-UI-004 비제휴 대안 카드 2개 병기

| 항목 | 요구사항 |
| --- | --- |
| 기본 개수 | 2개 |
| 정렬 우선순위 | `rating DESC`, `reviewCount DESC` |
| fallback | rating/reviewCount 누락분은 원본 순서로 보충 |
| 배치 위치 | 제휴 카드 블록 바로 아래 동일 메시지 컨텍스트에서 노출 |
| 중복 제거 | 제휴 카드와 동일 `productId`는 비제휴 대안에서 제외 |
| 동점 처리 | `rating`/`reviewCount` 동점이면 원본 순서 유지(stable sort) |
| 최소 데이터 보장 | 2개 미만이면 가능한 수만 노출 + `대안 데이터가 부족합니다` 안내 문구 추가 |
| 목적 | 제휴 결과만 강제 노출하지 않기 위한 컴플라이언스 충족 |

### P3-UI-005 이벤트 트래킹 UI 계약

이 섹션은 UI가 이벤트 API를 호출할 때 반드시 만족해야 하는 입력 계약이다.  
(`AffiliateEvent` 저장 API가 준비되면 즉시 적용)

필수 필드:

| 필드 | 규칙 |
| --- | --- |
| `eventType` | `impression` \| `outbound_click` \| `cta_attempt` |
| `provider` | 광고주 확정: `awin:{advertiserId}`, 미확정: `awin_pending:{category}` |
| `conversationId` | 대화 컨텍스트 존재 시 필수, 미존재 시 `null` 허용 |
| `productId` | 카드 단위 고유 ID(필수) |
| `category` | 카테고리 문자열(필수) |
| `isCtaEnabled` | CTA 활성 여부 boolean |
| `reasonCode` | `cta_attempt`일 때 `no_advertiser_for_category` |
| `userTimezone` | 프로필 IANA 우선, 없으면 브라우저 timezone |
| `idempotencyKey` | `impression:{conversationId_or_null}:{productId}:{local_or_utc_yyyy-mm-dd}` |

impression dedupe 정책:
- 동일 `conversationId + productId + local_day` 조합은 1일 1회만 기록
- `userTimezone` 없으면 `UTC day` 기준으로 dedupe

이벤트 전송 실패 정책:
- 이벤트 API 실패는 UI 렌더/클릭 흐름을 차단하면 안 된다.
- 이벤트 전송 timeout 기준: 2초.
- timeout 또는 5xx 발생 시 로컬 경고 로그 남기고 사용자 토스트는 노출하지 않는다.

### P3-UI-005A 트래킹 데이터 거버넌스/개인정보 규격

| 항목 | 규칙 |
| --- | --- |
| 최소 수집 원칙 | `AffiliateEvent`에는 이메일/전화번호/실명 저장 금지 |
| 식별자 정책 | `userId`는 내부 식별자만 저장, 외부 공유 금지 |
| `clickref` 정책 | `{conversationId}:{productId}` 형식만 허용, 자유 문자열 금지 |
| 보관 기간 | Stage A 이벤트 원본 365일, 이후 익명 집계만 유지 |
| 삭제 정책 | 사용자 삭제 요청 시 해당 `userId` 이벤트 비식별 처리 |
| 접근 제어 | admin 조회 API는 RBAC `admin` 이상만 접근 허용 |
| 감사 로그 | 이벤트 조회/내보내기 액션은 감사 로그로 남김 |

### P3-UI-006 타임존 표시 정책

| 항목 | 요구사항 |
| --- | --- |
| 저장 시각 | UTC (`occurredAt`) |
| 화면 표시 | 브라우저 로컬 타임존 변환 표시 |
| 우선순위 | 프로필 timezone > 브라우저 timezone > UTC fallback |

## 8. Stage B 선반영 요구사항 (미구현, 명세 고정)

### P3B-UI-001 가격/통화 실데이터 노출

| 항목 | 요구사항 |
| --- | --- |
| 조건 | Agoda API 연동 이후 |
| 표시 항목 | 가격, 통화, 재고/가용성 |
| 금지사항 | Stage A에서 mock 가격 노출 금지 |

### P3B-UI-002 제휴 링크 설정 UX

| 항목 | 요구사항 |
| --- | --- |
| 계정 기본값 | `affiliate_links_enabled` 토글 |
| 대화별 오버라이드 | `inherit` \| `enabled` \| `disabled` |
| 우선순위 | 대화별 오버라이드 > 계정 기본값 |
| 권한 | 대화 owner만 변경 가능, 비소유자 403 |

### P3B-UI-003 감사 로그/운영 알림 연동 표시

| 항목 | 요구사항 |
| --- | --- |
| 감사로그 필드 | `actorUserId`, `changedAt`, `fromValue`, `toValue`, `conversationId` |
| 보관 정책 | 365일 |
| 실패 알림 | purge 배치 실패 3회 후 Telegram `critical` |
| 경고 알림 | `redis_write_failed`는 Telegram `warning` |

### 8.1 Feature Flag / Rollback 규격

| Flag | 기본값(Dev) | 기본값(Prod) | 제어 대상 | 롤백 시 동작 |
| --- | --- | --- | --- | --- |
| `TRAVEL_AFFILIATE_CTA_ENABLED` | `true` | `true` | 제휴 CTA 노출/클릭 | `false`면 모든 CTA를 pending 상태로 강등 |
| `TRAVEL_AFFILIATE_TRACKING_ENABLED` | `true` | `true` | `impression/outbound_click/cta_attempt` 전송 | `false`면 이벤트 전송 중단, UI는 정상 동작 |
| `TRAVEL_RESTORE_AUTO_ENABLED` | `true` | `true` | 로그인 후 자동 복원 | `false`면 수동 히스토리 복원만 허용 |
| `TRAVEL_HISTORY_EDIT_ENABLED` | `true` | `true` | 제목 수정 기능 | `false`면 읽기 전용 목록 |

롤백 절차:
1. 장애 감지 후 5분 내 `TRAVEL_AFFILIATE_TRACKING_ENABLED=false`.
2. 클릭 오류 지속 시 10분 내 `TRAVEL_AFFILIATE_CTA_ENABLED=false`.
3. 복원 장애 급증 시 `TRAVEL_RESTORE_AUTO_ENABLED=false` 후 수동 복원 안내.
4. 플래그 변경 시 변경자/시각/사유를 운영 로그에 기록.

## 9. API 요청/응답 예시 (UI 개발 기준)

### 9.1 `POST /api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "파리 숙소 추천해줘" }
  ],
  "sessionId": "guest-session-uuid",
  "conversationId": "conversation-uuid"
}
```

`429` 예시:

```json
{
  "error": "Rate limit exceeded",
  "reason": "guest_daily_limit_exceeded"
}
```

### 9.2 `POST /api/auth/merge-session`

요청:

```json
{
  "sessionId": "guest-session-uuid"
}
```

성공:

```json
{
  "success": true,
  "mergedCount": 3,
  "refreshedSessionId": "new-session-uuid"
}
```

실패(세션 후보 없음):

```json
{
  "error": "sessionId or sessionIds is required"
}
```

### 9.3 `GET /api/conversations`

성공:

```json
{
  "conversations": [
    {
      "id": "conv_1",
      "title": "파리 숙소 비교",
      "createdAt": "2026-02-19T10:00:00.000Z",
      "updatedAt": "2026-02-19T10:05:00.000Z",
      "_count": { "messages": 8 }
    }
  ]
}
```

### 9.4 `PATCH /api/conversations/:id`

요청:

```json
{
  "title": "수정된 제목"
}
```

### 9.5 `POST /api/affiliate/event` (구현 예정 계약)

```json
{
  "conversationId": "conv_123",
  "userId": "user_123",
  "userTimezone": "Asia/Seoul",
  "provider": "awin_pending:accommodation",
  "eventType": "cta_attempt",
  "reasonCode": "no_advertiser_for_category",
  "productId": "hotel_987",
  "productName": "Hotel Example",
  "category": "accommodation",
  "isCtaEnabled": false
}
```

### 9.6 API 상태/사유코드 정합성 체크리스트

| 체크 ID | 검증 항목 | 합격 기준 |
| --- | --- | --- |
| `API-CHECK-01` | 429 응답에 `reason` 포함 | 모든 429 응답 payload에 `reason` 존재 |
| `API-CHECK-02` | merge 400 에러 문자열 | `sessionId or sessionIds is required` 정확히 일치 |
| `API-CHECK-03` | restore 404/403 구분 | 상태코드별 fallback 분기 정확 동작 |
| `API-CHECK-04` | event timeout 처리 | 2초 timeout 이후 UI 비차단 |
| `API-CHECK-05` | requestId 추적 | 에러 로그에 requestId 누락 없음 |

## 10. 문구(Copy) 고정 사전

아래 문구는 UX 일관성과 QA 자동 판정을 위해 고정 문자열로 취급한다.

| 키 | 문구 |
| --- | --- |
| `copy.session.preparing` | `세션 준비 중입니다. 잠시 후 다시 시도해 주세요.` |
| `copy.save.empty` | `저장할 대화가 아직 없어요.` |
| `copy.rateLimit.banner` | `요청이 너무 많아요. 잠시 후 다시 시도해 주세요.` |
| `copy.network.banner` | `답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.` |
| `copy.affiliate.pending.toast.title` | `제휴 링크 준비 중` |
| `copy.affiliate.disclosure` | `예약/구매 시 제휴 수수료를 받을 수 있습니다` |
| `copy.affiliate.price.pending` | `가격은 제휴 연동 후 제공됩니다` |
| `copy.restore.restoring` | `이전 대화를 복원하는 중...` |
| `copy.restore.failed` | `대화를 자동 복원하지 못했어요.` |

### 10.1 트리거별 모달 문구 매핑

| trigger | title | description |
| --- | --- | --- |
| `save` | `로그인하고 대화를 저장하세요` | `대화 내역을 저장하고 언제든 다시 보려면 로그인이 필요해요.` |
| `history` | `이전 대화를 보려면 로그인하세요` | `저장된 대화 내역을 보려면 로그인이 필요해요.` |
| `bookmark` | `북마크를 저장하려면 로그인하세요` | `북마크 기능을 사용하려면 로그인이 필요해요.` |
| `limit` | `계속 사용하려면 로그인하세요` | `게스트 한도에 도달했어요. 로그인하면 더 많은 대화를 이어갈 수 있어요.` |

## 11. 접근성/반응형/NFR 요구사항

### 11.1 접근성

- 모든 아이콘 버튼은 `aria-label` 필수.
- 모달은 `role="dialog"` + `aria-modal="true"` 필수.
- 상태 메시지는 색상만으로 전달하지 말고 텍스트를 함께 제공.
- 키보드 내비게이션만으로 히스토리 선택/편집/저장 가능해야 함.
- 명도 대비:
  - 일반 텍스트 4.5:1 이상
  - 대형 텍스트(18pt+ 또는 bold 14pt+) 3:1 이상
- 포커스 인디케이터:
  - 키보드 포커스 링은 배경 대비 3:1 이상
  - `:focus-visible` 상태에서 시각적 변화 2px 이상 확보
- 스크린리더:
  - 모달 open 시 title이 첫 읽기 대상이어야 함
  - 에러/복원 배너는 `aria-live="polite"` 또는 동등 수준 알림 제공

### 11.2 반응형

- 모바일(375px) 기준에서 채팅 입력, 모달, 카드 CTA가 잘리지 않아야 함.
- 터치 타겟은 클릭 가능한 모든 핵심 컨트롤에서 44px 이상 필수.
- 히스토리/모달 오버레이는 viewport 전체를 덮고 배경 스크롤 잠금 동작을 유지.
- 모바일 세로 기준에서 ChatInput + CTA 버튼이 키보드 오픈 시에도 가시 영역 내에 있어야 함.

브라우저/디바이스 지원 매트릭스:

| 플랫폼 | 브라우저 | 최소 버전 | 필수 검증 항목 |
| --- | --- | --- | --- |
| iOS | Safari | 17 | 모달 포커스, 키보드 오픈 시 입력 가시성 |
| Android | Chrome | 122 | 히스토리 오버레이, CTA 클릭 동작 |
| macOS | Chrome | 122 | 스트리밍/복원/히스토리 편집 |
| macOS | Safari | 17 | 모달/스크롤 잠금/외부 링크 |
| Windows | Edge | 122 | 에러 배너, 키보드 내비게이션 |

### 11.3 성능/안정성

- 히스토리 사이드바가 닫힌 상태에서는 대화 목록 fetch 호출 금지.
- 복원 실패 재시도 시 backoff(현재 구현 기준 400ms * 시도회수) 유지.
- 중복 모달 오픈 방지 로직 유지(`same error` 기준).
- 카드 이벤트 전송 실패가 UI 상호작용(CTA 클릭/모달 열기)을 블로킹하면 안 됨.

## 12. QA 테스트 시나리오

| ID | 시나리오 | 절차 | 기대 결과 |
| --- | --- | --- | --- |
| `TC-P2-01` | 게스트 세션 생성 | 비로그인으로 첫 질문 전송 | `travel_session_id` 저장 + 채팅 성공 |
| `TC-P2-02` | save 트리거 모달 | 게스트 상태에서 Save 클릭 | 로그인 모달(`save`) 노출 |
| `TC-P2-03` | history 트리거 모달 | 게스트 상태에서 History 클릭 | 로그인 모달(`history`) 노출 |
| `TC-P2-04` | bookmark 트리거 모달 | 게스트 상태에서 알림/북마크 클릭 | 로그인 모달(`bookmark`) 노출 |
| `TC-P2-05` | limit 트리거 모달 | 게스트 한도 초과 유도 | 429 배너 + 로그인 모달(`limit`) |
| `TC-P2-06` | 병합 후 자동복원 | guest 대화 후 로그인 | merge 완료 후 복원 성공 |
| `TC-P2-07` | 복원 fallback | 대상 ID 404 유도 | fallback 대화 복원 또는 실패 배너 |
| `TC-P2-08` | 히스토리 검색 | 로그인 후 검색어 입력 | `/api/conversations?q=` 결과 노출 |
| `TC-P2-09` | 제목 수정 | inline edit 후 Enter | PATCH 200 + 목록 갱신 |
| `TC-P2-10` | 제목 수정 취소 | inline edit 후 Escape | 원본 제목 유지 |
| `TC-P2-11` | 삭제 | 삭제 실행 | DELETE 200 + 목록 제거 |
| `TC-P2-12` | 새 대화 | 새 대화 버튼 클릭 | 메시지/엔티티/복원키 초기화 |
| `TC-P3A-01` | Active CTA | 광고주/링크 있는 카드 렌더 | `예약하기` 활성 + 외부 이동 |
| `TC-P3A-02` | Pending CTA | 광고주 없는 카드 렌더 | `제휴 링크 준비중` + 클릭 시 모달 |
| `TC-P3A-03` | 제휴 고지 | Active/Pending 각각 확인 | 고지 문구 동일 노출 |
| `TC-P3A-04` | 가격 비노출 | Stage A 카드 확인 | 가격 값 없음 + 대체 문구 |
| `TC-P3A-05` | 비제휴 대안 2개 | 결과 렌더 확인 | 최소 2개 병기 |
| `TC-P3A-06` | impression dedupe | 동일 카드 재노출 반복 | 1일 1회만 기록 |
| `TC-P3A-07` | `cta_attempt` reasonCode | Pending CTA 클릭 | `no_advertiser_for_category` 저장 |
| `TC-P3A-08` | timezone fallback | userTimezone 미수집 | UTC day 기준 dedupe |

### 12.1 요구사항-테스트 매핑

| Requirement ID | 핵심 검증 테스트 |
| --- | --- |
| `P2-UI-001` | `TC-P2-01` |
| `P2-UI-002` | `TC-P2-02`, `TC-P2-03`, `TC-P2-04`, `TC-P2-05` |
| `P2-UI-003` | `TC-P2-02`, `TC-P2-03` + 접근성 수동 점검 |
| `P2-UI-004` | `TC-P2-02`, `TC-P2-03`, `TC-P2-12` |
| `P2-UI-005` | `TC-P2-08` |
| `P2-UI-006` | `TC-P2-09`, `TC-P2-10`, `TC-P2-11` |
| `P2-UI-007` | `TC-P2-12` |
| `P2-UI-008` | `TC-P2-06`, `TC-P2-07` |
| `P2-UI-009` | `TC-P2-05` |
| `P3-UI-001` | `TC-P3A-01`, `TC-P3A-02`, `TC-P3A-04` |
| `P3-UI-002` | `TC-P3A-02` |
| `P3-UI-003` | `TC-P3A-03` |
| `P3-UI-004` | `TC-P3A-05` |
| `P3-UI-005` | `TC-P3A-06`, `TC-P3A-07`, `TC-P3A-08` |
| `P3-UI-006` | `TC-P3A-08` + 관리자 시간 표시 수동 점검 |

### 12.2 자동화 테스트/CI 게이트 규격

| Requirement ID | 자동화 타입 | 권장 테스트 파일 | CI 게이트 |
| --- | --- | --- | --- |
| `P2-UI-002` | 컴포넌트 테스트 | `apps/travel/src/components/modals/LoginPromptModal.test.tsx` | PR 필수 |
| `P2-UI-005` | 컴포넌트+API mocking | `apps/travel/src/components/history/HistorySidebar.test.tsx` | PR 필수 |
| `P2-UI-008` | 통합 테스트 | `apps/travel/src/components/chat/ChatPanel.restore.test.tsx` | PR 필수 |
| `P2-UI-009` | 통합 테스트 | `apps/travel/src/components/chat/ChatPanel.ratelimit.test.tsx` | PR 필수 |
| `P3-UI-001` | 컴포넌트 테스트 | `apps/travel/src/components/cards/AccommodationCard.test.tsx` | PR 필수 |
| `P3-UI-005` | 서비스/API 테스트 | `apps/travel/src/services/affiliate-event.service.test.ts` | main 병합 전 필수 |

CI 실행 규칙:
- PR 단계: 변경된 Requirement ID에 매핑된 테스트 100% 통과.
- main 병합 단계: 전체 test suite + lint + typecheck 통과.
- 배포 단계: smoke test(`restore`, `pending CTA`, `active CTA`) 통과 후 승인.

## 13. 릴리즈 게이트 (합격 기준)

### 13.0 운영 관측(Observability) 및 대응 규격

핵심 지표 산식:

| 지표 | 산식 | 집계 주기 | 소스 |
| --- | --- | --- | --- |
| `guest_429_rate` | guest `POST /api/chat` 중 429 / guest `POST /api/chat` 전체 | 5분/1일 | API access log |
| `merge_session_success_rate` | merge 200 / merge 전체 요청 | 5분/1일 | API log + app log |
| `conversation_restore_404_rate` | 로그인 직후 restore API 404 / 로그인 직후 restore API 전체 | 5분/1일 | FE telemetry + API log |
| `affiliate_outbound_ctr` | `outbound_click` / `impression` | 5분/1일 | AffiliateEvent |

알림 임계값:
- `merge_session_success_rate < 95%`가 10분 이상 지속 시 `critical`.
- `conversation_restore_404_rate > 2%`가 10분 이상 지속 시 `critical`.
- `guest_429_rate > 15%`가 30분 이상 지속 시 `warning`.

온콜 대응 순서:
1. Feature flag 완화(`tracking` -> `cta` -> `restore`) 순으로 영향 최소화.
2. 최근 배포 변경점 확인(15분 이내).
3. merge/restore API 샘플 로그 20건 추출 후 패턴 분석.
4. 임시 복구 후 근본 원인 티켓 생성.

### 13.1 Stage A 출시 전 필수 통과

1. P2-UI-001 ~ P2-UI-010 모두 구현/QA 통과.
2. P3-UI-001 ~ P3-UI-006 모두 구현/QA 통과.
3. 고정 Copy 키 문구가 코드와 일치.
4. `guest_429_rate`, `merge_session_success_rate`, `conversation_restore_404_rate` 측정 가능 상태.
5. known blocker 없음(critical/major 0건).
6. 운영 임계값 준수:
   - `merge_session_success_rate >= 95%`
   - `conversation_restore_404_rate <= 2%`

출시 증빙 산출물:
- UI 상태 스크린샷: Active CTA, Pending CTA, Restore 실패 배너, LoginPrompt 4트리거
- API 로그 샘플: `/api/chat 429`, `/api/auth/merge-session 200`, `/api/conversations/:id 404 fallback`
- 이벤트 로그 샘플: `impression`, `cta_attempt`, `outbound_click`

### 13.2 Stage B 진입 조건

1. Agoda API 자격정보와 API 계약 확정.
2. `ConversationPreference` 저장소와 권한 정책 구현 완료.
3. 감사로그/정리배치/Telegram 경보 파이프라인 검증 완료.

### 13.3 출시 증빙 승인 프로세스

| 단계 | 산출물 | 승인자 | 통과 기준 |
| --- | --- | --- | --- |
| `Gate-1` | UI 스크린샷 세트 | FE Lead | 상태 매트릭스 누락 없음 |
| `Gate-2` | API/이벤트 로그 샘플 | BE Lead | status/reasonCode 불일치 0건 |
| `Gate-3` | QA 실행 리포트 | QA Lead | Critical/High 결함 0건 |
| `Gate-4` | 운영 지표 확인표 | Product Owner | 임계값 위반 없음 |

승인 저장 규칙:
- 각 Gate 산출물은 릴리즈 노트에 링크로 첨부.
- 승인자/승인시각(UTC) 기록 필수.
- Gate 미통과 시 배포 차단.

## 14. 티켓 작성 규칙 (개발 실무용)

모든 UI 티켓은 아래 항목을 포함해야 한다.

| 필드 | 필수 여부 | 내용 |
| --- | --- | --- |
| Requirement ID | 필수 | 예: `P2-UI-008` |
| 대상 파일 | 필수 | 실제 수정 파일 경로 |
| API 계약 | 필수 | 요청/응답/에러 코드 |
| 상태 정의 | 필수 | loading/success/error/empty 등 |
| QA 항목 | 필수 | 최소 1개 수동 + 1개 자동 |
| 완료 조건 | 필수 | 본 문서 완료 기준 링크 |

티켓 분해 기준:
- 1개 티켓은 1개 Requirement ID를 기본 단위로 한다.
- API 변경이 포함되면 FE/BE 분리 티켓 + 공통 검증 티켓을 추가한다.
- Stage B 티켓은 Stage A 완료 이후 `blocked` 라벨로 관리한다.

## 15. 오픈 이슈 및 후속 액션

| 이슈 | 영향 | 우선순위 | 처리 상태 |
| --- | --- | --- | --- |
| Stage A 이벤트 API 미완성 | 클릭 퍼널 지표 누락 가능 | High | 완료 |
| Rate limit 리셋 KST 고정 미완료 | 일일 리셋 체감 불일치 | Medium | 완료 |
| guest cleanup 운영 실행 검증 미완료 | 데이터 잔존 리스크 | Medium | 진행 중 |

## 16. 변경 이력

| 버전 | 날짜 | 변경 내용 |
| --- | --- | --- |
| v2.7 | 2026-02-19 | `chat/merge-session/conversations/affiliate-event` API 에러 로그에 `requestId` 추적 필드 적용, API-CHECK-05 완료 처리 |
| v2.6 | 2026-02-19 | 마스터 체크리스트(Requirement/API/QA/Gate) 추가, Feature Flag 적용 상태 반영, 오픈 이슈 상태 업데이트 |
| v2.5 | 2026-02-19 | 사용자 여정, IA 우선순위, 비주얼 토큰, 인터랙션/모션, 상태보드, 카피 톤, UX 검증 계획 추가 |
| v2.4 | 2026-02-19 | 2주 단위 실행계획, 크리티컬 패스, 리스크/SLA, 배포 체크포인트 추가 |
| v2.3 | 2026-02-19 | API 에러 상세 계약, Feature Flag/롤백, 관측/승인/자동화/거버넌스 규격 추가 |
| v2.2 | 2026-02-19 | 요구사항-테스트 매핑, 이벤트 실패 정책, 출시 증빙 기준 추가 |
| v2.1 | 2026-02-19 | 상태 전이 표, 이벤트 idempotencyKey, 접근성/반응형 강제 기준 보강 |
| v2.0 | 2026-02-19 | Planner/Developer 공용 상세 요구사항서로 전면 재작성 |

## 17. 2주 단위 실행계획 (Project Plan)

기준일: 2026-02-19  
배포 목표일: 2026-04-03 (Stage A Production Rollout)

| Sprint | 기간 | 목표 | 포함 Requirement | 담당(Owner) | 완료 산출물 |
| --- | --- | --- | --- | --- | --- |
| `S0` | 2026-02-20 ~ 2026-02-24 | 구현 준비/기준선 고정 | `P2-UI-001~010` 설계 확정, `6.1` API 에러 계약 고정 | FE Lead, BE Lead, QA Lead | 티켓 분해, 테스트 템플릿, 플래그 기본값 적용 |
| `S1` | 2026-02-25 ~ 2026-03-10 | Phase 2 안정화 | `P2-UI-001~010`, `CC-01~05` | FE Lead + BE Lead | merge/restore 안정화, 히스토리 기능 완료, 429 UX 완료 |
| `S2` | 2026-03-11 ~ 2026-03-24 | Stage A 수익화 핵심 | `P3-UI-001~006`, `P3-UI-005A` | FE Lead + BE Lead | Active/Pending CTA, 이벤트 수집, 비제휴 대안 규칙 완료 |
| `S3` | 2026-03-25 ~ 2026-04-03 | 운영 검증/출시 | `13.0`, `13.1`, `13.3`, `12.2` | QA Lead + Product Owner | 운영지표 검증, Gate-1~4 승인, Production 배포 |

## 18. 크리티컬 패스 (Critical Path)

| CP ID | 선행 작업 | 후행 작업 | 지연 영향 | 완화 전략 |
| --- | --- | --- | --- | --- |
| `CP-01` | `POST /api/auth/merge-session` 안정화 | 로그인 후 자동복원(`P2-UI-008`) | 대화 복원 실패율 증가, 출시 지연 | merge API 우선 배포 + restore feature flag 분리 |
| `CP-02` | `POST /api/affiliate/event` 구현 | CTR/퍼널 지표 및 Gate-4 승인 | 수익화 성과 측정 불가 | tracking flag로 기능 분리, API 병행 개발 |
| `CP-03` | Feature Flag 런타임 반영 | 운영 롤백 절차 실행 | 장애 시 즉시 완화 불가 | S0에서 플래그 주입/검증 테스트 필수화 |
| `CP-04` | CI 자동화 테스트 확정(`12.2`) | Stage A 배포 승인 | 회귀 버그 누락 | PR 게이트에 Requirement 매핑 테스트 의무화 |

## 19. 리스크 레지스터 (Owner/SLA)

| Risk ID | 리스크 | 감지 신호 | Owner | 대응 SLA | 즉시 조치 |
| --- | --- | --- | --- | --- | --- |
| `R-01` | merge 실패율 급증 | `merge_session_success_rate < 95%` 10분 지속 | BE Lead | 30분 내 완화 | `TRAVEL_RESTORE_AUTO_ENABLED=false`, 로그 샘플 20건 분석 |
| `R-02` | 복원 404 급증 | `conversation_restore_404_rate > 2%` 10분 지속 | FE Lead | 30분 내 완화 | fallback 강제 + 수동 복원 안내 배너 유지 |
| `R-03` | CTA 클릭 장애 | outbound 클릭 5xx 급증 | FE Lead | 15분 내 완화 | `TRAVEL_AFFILIATE_CTA_ENABLED=false` |
| `R-04` | 이벤트 적재 장애 | event timeout/5xx 20% 초과 | BE Lead | 30분 내 완화 | `TRAVEL_AFFILIATE_TRACKING_ENABLED=false`, 큐/재처리 점검 |
| `R-05` | 모바일 UX 파손 | smoke test 실패(iOS/Android) | QA Lead | 1영업일 내 수정 배포 | hotfix branch 생성, 배포 전 Gate 재검증 |

## 20. 배포 체크포인트 (Release Checkpoints)

| Checkpoint | 날짜 | 목표 | 필수 통과 항목 | 승인자 |
| --- | --- | --- | --- | --- |
| `C1-Design Freeze` | 2026-02-24 | 요구사항/티켓 동결 | 문서 v2.7 동결, Requirement ID별 티켓 생성 완료 | Product Owner |
| `C2-P2 Ready` | 2026-03-10 | Phase 2 기능 준비 완료 | `P2-UI-001~010`, `CC-01~05`, 관련 자동화 테스트 통과 | FE Lead, BE Lead |
| `C3-P3 StageA Ready` | 2026-03-24 | Stage A 수익화 기능 준비 완료 | `P3-UI-001~006`, `P3-UI-005A`, API-CHECK 통과 | FE Lead, BE Lead, QA Lead |
| `C4-Go/No-Go` | 2026-04-02 | 배포 최종 판정 | Gate-1~4 통과, 운영 임계값 만족 | Product Owner |
| `C5-Production Rollout` | 2026-04-03 | 운영 배포 | 플래그 기본값 확인, 모니터링 알림 정상 | Product Owner, On-call |

## 21. 문서 변경관리 (Change Control)

| 항목 | 규칙 |
| --- | --- |
| 변경 권한 | FE Lead/BE Lead/QA Lead/Product Owner |
| 변경 승인 | 기능 요구 변경은 Product Owner 승인 필수 |
| 버전 정책 | 섹션 추가/정책 변경 시 minor 버전 증가(`v2.x`) |
| 기록 정책 | 변경 사유, 영향 범위, 반영 일시(UTC) 변경 이력에 기록 |
| 커뮤니케이션 | 변경 발생 당일 스프린트 채널 공지 필수 |

## 22. 사용자 여정 맵 (UX Journey Map)

### 22.1 핵심 여정 정의

| Journey ID | 사용자 목표 | 시작점 | 종료점 |
| --- | --- | --- | --- |
| `J-01` | 로그인 없이 빠르게 질문 시작 | `/travel` 첫 진입 | 첫 답변 수신 |
| `J-02` | 저장/히스토리 접근을 위해 로그인 전환 | Save/History 클릭 | 로그인 + 대화 복원 완료 |
| `J-03` | 추천 숙소 제휴 링크로 이동 | 숙소 카드 노출 | 외부 파트너 페이지 랜딩 |
| `J-04` | 제휴 링크 준비중 상태 이해 | Pending CTA 클릭 | 모달 확인 후 대화 지속 |
| `J-05` | 이전 대화 찾아서 이어가기 | 히스토리 오픈 | 선택 대화 복원 완료 |

### 22.2 여정별 페인포인트/디자인 대응

| Journey ID | 페인포인트 | 디자인 대응 | 측정 지표 |
| --- | --- | --- | --- |
| `J-01` | 세션 준비 지연으로 첫 질문 실패 | 즉시 피드백 토스트 + 전송 재시도 가능 상태 유지 | 첫 질문 성공률 |
| `J-02` | 로그인 직후 대화 유실 인지 | merge 이후 restore 고정 순서 + 실패 fallback 배너 | `conversation_restore_404_rate` |
| `J-03` | 광고성 불신 | `광고/제휴` 라벨 + 고지 문구 고정 | outbound CTR, 이탈률 |
| `J-04` | 비활성 CTA 혼란 | 토스트 + 안내 모달로 이유 명시 | `cta_attempt` 대비 이탈률 |
| `J-05` | 대화 찾기 어려움 | 검색/상대시간/메시지 수 표시 | 히스토리 재진입 성공률 |

## 23. 화면 IA 및 정보 우선순위

### 23.1 `/travel` 메인 화면 정보 계층

| 우선순위 | 영역 | 포함 정보 | 노출 규칙 |
| --- | --- | --- | --- |
| P0 | ChatInput | 현재 입력, 전송 버튼, 중단 버튼 | 항상 하단 고정 |
| P0 | 최신 메시지 | 사용자 질문/AI 응답 | 스크롤 최하단 자동 이동 |
| P1 | 시스템 배너 | 복원 중/복원 실패/에러 배너 | 해당 상태일 때만 노출 |
| P1 | 상단 액션 | 새 대화, 저장, 히스토리 | 항상 표시 |
| P2 | 추천 질문 | Empty state에서 3개 | 메시지 존재 시 숨김 |
| P2 | 제휴 카드 블록 | Active/Pending CTA, 고지, 대안 2개 | 숙소 추천 응답 시 노출 |

### 23.2 히스토리 사이드바 IA

| 우선순위 | 요소 | 목적 |
| --- | --- | --- |
| P0 | 검색 입력 | 특정 대화 빠른 탐색 |
| P0 | 대화 리스트 | 이어가기 대상 선택 |
| P1 | 새 대화 버튼 | 현재 컨텍스트 초기화 |
| P1 | 항목 액션(편집/삭제) | 대화 관리 |
| P2 | 로딩/에러/빈상태 메시지 | 상태 이해 |

### 23.3 모바일 IA 원칙

- 우선순위 1: 입력/응답 읽기 흐름 유지
- 우선순위 2: 모달/오버레이에서 단일 목적 행동 제공
- 우선순위 3: 보조 정보(상세 메타데이터)는 축약 후 확장

## 24. 비주얼 토큰 명세 (Design Tokens)

### 24.1 Typography

| Token | 크기/행간 | 굵기 | 사용처 |
| --- | --- | --- | --- |
| `--type-display` | `32/40` | 700 | Empty state 헤드라인 |
| `--type-h1` | `24/32` | 700 | 모달 제목 |
| `--type-h2` | `20/28` | 600 | 섹션 헤더 |
| `--type-body` | `16/24` | 400 | 본문 |
| `--type-body-sm` | `14/20` | 400 | 보조 본문 |
| `--type-caption` | `12/16` | 400 | 메타데이터/보조 라벨 |

### 24.2 Spacing / Radius / Elevation

| Token | 값 | 사용처 |
| --- | --- | --- |
| `--space-1` | 4px | 미세 간격 |
| `--space-2` | 8px | 버튼 내부 간격 |
| `--space-3` | 12px | 카드 내부 기본 |
| `--space-4` | 16px | 섹션 기본 간격 |
| `--space-6` | 24px | 블록 간격 |
| `--radius-sm` | 8px | 입력/작은 버튼 |
| `--radius-md` | 12px | 카드/모달 내부 요소 |
| `--radius-lg` | 16px | 모달/대형 카드 |
| `--shadow-1` | `0 2px 8px rgba(0,0,0,0.08)` | 기본 떠있는 요소 |
| `--shadow-2` | `0 8px 24px rgba(0,0,0,0.14)` | 모달/오버레이 카드 |

### 24.3 Color Semantics

| Token | 목적 |
| --- | --- |
| `--color-primary` | 주요 CTA/강조 |
| `--color-surface` | 카드/패널 배경 |
| `--color-text` | 기본 텍스트 |
| `--color-muted` | 보조 텍스트 |
| `--color-success` | 성공 상태 |
| `--color-warning` | 제한/주의 상태 |
| `--color-danger` | 오류/실패 상태 |

규칙:
- 색상값은 `apps/travel/src/app/globals.css`의 변수로만 관리.
- 컴포넌트에서 하드코딩 색상 직접 사용 금지(브랜드 CI 로고 제외).

## 25. 인터랙션/모션 명세

### 25.1 상태별 인터랙션

| 컴포넌트 | 상태 | 시각 변화 | 동작 규칙 |
| --- | --- | --- | --- |
| 버튼 | hover | 배경/보더 대비 +4~8% | 150ms 이내 전환 |
| 버튼 | pressed | scale `0.98` | 100ms, release 시 복원 |
| 버튼 | disabled | 대비 낮춤 + pointer 차단 | 클릭 이벤트 발생 금지 |
| 입력 | focus | 2px focus ring | 키보드 포커스 항상 가시화 |
| 카드 | hover | shadow-1 -> shadow-2 | 링크가 있을 때만 커서 pointer |
| 배너 | 등장 | fade+slideY 8px | 180ms 이내 |

### 25.2 모션 토큰

| Token | 값 | 사용처 |
| --- | --- | --- |
| `--motion-fast` | 120ms | hover/focus |
| `--motion-base` | 180ms | modal in/out |
| `--motion-slow` | 240ms | panel transition |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 기본 전환 |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` | 강조 전환 |

모션 접근성:
- `prefers-reduced-motion: reduce` 환경에서는 scale/slide 애니메이션 제거, opacity 전환만 유지.

## 26. 컴포넌트 상태 보드 (State Board)

디자인/개발 공통 상태 보드는 아래 조합을 모두 갖춰야 한다.

| 컴포넌트 | 필수 상태 |
| --- | --- |
| `ChatInput` | default, focus, loading, disabled, error |
| `LoginPromptModal` | closed, open, oauth-loading, oauth-error |
| `HistorySidebar` | closed, loading, loaded, empty, search-empty, error, edit-mode, delete-confirm |
| `AccommodationCard` | active-cta, pending-cta, no-image, low-data |
| `RestoreBanner` | hidden, restoring, failed, retrying |
| `RateLimitBanner` | hidden, visible-guest, visible-user |

에지 케이스 보드(필수):
- 매우 긴 제목(100자), 매우 긴 장소명, 이미지 깨짐, 네트워크 지연(2초+), API 5xx 반복.

## 27. 카피 톤 가이드 및 로컬라이즈 규칙

### 27.1 카피 톤

| 원칙 | 규칙 |
| --- | --- |
| 명확성 | 한 문장에 한 행동만 제시 |
| 공감 | 사용자 실수 단정 금지 (`잘못했습니다` 계열 금지) |
| 간결성 | 배너/토스트는 1문장 우선 |
| 일관성 | 동일 상태는 동일 키 문구 사용 |

금지 패턴:
- 과도한 감탄/모호 표현 (`잠깐만요!`, `문제가 있을 수도 있어요`)  
- 책임 회피 표현 (`어쩔 수 없습니다`)

### 27.2 로컬라이즈(i18n) 규칙

| 항목 | 규칙 |
| --- | --- |
| 키 네이밍 | `feature.scope.state.action` 형식 사용 |
| 길이 제한 | 버튼 12자 내외, 토스트 40자 내외, 배너 60자 내외 |
| 줄바꿈 | 의미 단위 줄바꿈 금지, 자동 줄바꿈만 허용 |
| fallback | 번역 누락 시 한국어 기본 문구 사용 |
| 변수 삽입 | `{count}`, `{platform}` 형태만 허용 |

## 28. UX 검증 계획 (Usability Validation Plan)

### 28.1 사용성 테스트 설계

| 항목 | 기준 |
| --- | --- |
| 대상 | 여행 계획 사용자 8명(신규 4, 재방문 4) |
| 환경 | 모바일 4명(iOS/Android), 데스크톱 4명 |
| 과제 T1 | guest로 첫 질문 -> 답변 확인 |
| 과제 T2 | Save 클릭 -> 로그인 -> 대화 복원 확인 |
| 과제 T3 | 숙소 카드 CTA(Active/Pending) 각각 수행 |
| 과제 T4 | 히스토리에서 검색/제목수정/삭제/이어가기 |

### 28.2 성공 기준

| 지표 | 목표 |
| --- | --- |
| Task Completion Rate | 90% 이상 |
| Time on Task (T2) | 120초 이내 |
| Critical Error Rate | 5% 이하 |
| SUS 점수 | 75점 이상 |

### 28.3 검증 산출물

- 세션 녹화 링크
- 태스크별 실패 지점 요약
- 우선순위 수정 백로그(High/Medium/Low)
- 수정 반영 후 재검증 결과
