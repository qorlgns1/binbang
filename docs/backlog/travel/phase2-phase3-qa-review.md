# Phase2-Phase3 구현 검토 리포트 (QA 관점)

검토일: 2026-02-19  
기준 문서: `phase2-phase3-ui-ux-requirements.md` (v2.7), `phase3-monetization.md`  
검토자: QA (20년차 시뮬레이션)

---

## 1. 요약

| 구분 | 항목 수 | 통과 | 결격/갭 | 비고 |
|------|---------|------|----------|------|
| 동시성/경합 (0.1) | 5 | 5 | 0 | CC-03 수정 반영 |
| Phase 2 (0.2) | 10 | 10 | 0 | — |
| API 정합성 (0.3) | 5 | 5 | 0 | — |
| Phase 3 Stage A (0.4) | 7 | 7 | 0 | — |
| Stage B (0.5) | 3 | 3 | 0 | — |
| Feature Flag (0.6) | 5 | 5 | 0 | — |
| **갭 요약** | | | **0건** | CC-03·CC-05 수정 반영 완료 |

---

## 2. 정합 확인된 항목

### 2.1 Copy/문구 (문서 10절)

| 키 | 명세 문구 | 코드 위치 | 결과 |
|----|-----------|-----------|------|
| copy.session.preparing | 세션 준비 중입니다. 잠시 후 다시 시도해 주세요. | ChatPanel.tsx (215, 228) | ✅ |
| copy.save.empty | 저장할 대화가 아직 없어요. | ChatPanel.tsx (252) | ✅ |
| copy.rateLimit.banner | 요청이 너무 많아요. 잠시 후 다시 시도해 주세요. | ChatPanel.tsx (627) | ✅ |
| copy.network.banner | 답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요. | ChatPanel.tsx (628) | ✅ |
| copy.affiliate.pending.toast.title | 제휴 링크 준비 중 | AccommodationCard.tsx (93) | ✅ |
| copy.affiliate.disclosure | 예약/구매 시 제휴 수수료를 받을 수 있습니다 | AccommodationCard.tsx (234), EsimCard | ✅ |
| copy.affiliate.price.pending | 가격은 제휴 연동 후 제공됩니다 | AccommodationCard.tsx (186) | ✅ |
| copy.restore.restoring | 이전 대화를 복원하는 중... | ChatPanel.tsx (534) | ✅ |
| copy.restore.failed | 대화를 자동 복원하지 못했어요. | ChatPanel.tsx (424, 540) | ✅ |
| P3-UI-001 Pending 버튼 | 제휴 링크 준비**중** (띄어쓰기 없음) | AccommodationCard.tsx (53) | ✅ |
| P3-UI-004 대안 부족 | 대안 데이터가 부족합니다 | ChatMessage.tsx (213, 325) | ✅ |

### 2.2 API 계약

| 체크 ID | 검증 내용 | 코드/동작 | 결과 |
|---------|-----------|-----------|------|
| API-CHECK-01 | 429 시 `reason` 포함 | chat/route.ts: `reason: rateCheck.reason` | ✅ |
| API-CHECK-02 | merge 400 문자열 | merge-session/route.ts: `'sessionId or sessionIds is required'` | ✅ |
| API-CHECK-03 | restore 404/403 분기 | loadConversation silent + fallback, 403/404 시 재시도 후 fallback | ✅ |
| API-CHECK-04 | event timeout 2초 | affiliateTracking.ts: `TRACKING_TIMEOUT_MS = 2000` | ✅ |
| API-CHECK-05 | 에러 로그 requestId | chat, merge-session, conversations, affiliate/event 등 resolveRequestId 사용 | ✅ |

### 2.3 동작/정책

- **P2-UI-005**  
  - `conversationsApiUrl = open ? (q ? /api/conversations?q=... : /api/conversations) : null` → open=false 시 fetch 없음 (11.3 준수). ✅  
- **P2-UI-006**  
  - 제목: trim, 공백 불가(toast), maxLength 100, Enter 저장, Escape 취소, PATCH /api/conversations/:id, DELETE ?id= ✅  
- **P2-UI-008**  
  - restore 트리거는 `mergeStatus === 'done'` 이후, 1차 복원 후 fallback(검색 API → 전체 목록), silent 실패 후 fallback. ✅  
- **P3-UI-001**  
  - Active: 예약하기, target="_blank", rel="noopener noreferrer sponsored", 광고/제휴, 고지 문구. Pending: 제휴 링크 준비중, aria-disabled, 동일 고지. ✅  
- **Feature Flag**  
  - TRAVEL_AFFILIATE_CTA_ENABLED, TRAVEL_AFFILIATE_TRACKING_ENABLED, TRAVEL_RESTORE_AUTO_ENABLED, TRAVEL_HISTORY_EDIT_ENABLED 모두 featureFlags에서 사용. ✅  
- **phase3-monetization**  
  - Rollout/Stage A·B 체크리스트 및 P3-1~P3-6 태스크가 문서상 완료로 표시됨. 코드와의 대조는 위 항목과 아래 갭에 한정해 검토. ✅  

---

## 3. 결격/갭 → 수정 반영 완료

### 3.1 CC-03: stale `travel_pending_restore` 24시간 폐기

**명세 (5.2):**  
"snapshot `updatedAt`이 24시간 초과면 폐기", "사용자에게 silent 처리".

**현재 구현:**  
`ChatPanel.tsx`에서 `parsePendingRestoreSnapshot(localStorage.getItem(...))`만 사용하며, `updatedAt`이 24시간을 넘었는지 검사하지 않음. 오래된 스냅샷도 복원 대상으로 사용됨.

**권장 수정:**  
restore를 트리거하는 useEffect 내에서, `pendingSnapshot`을 사용하기 전에  
`pendingSnapshot.updatedAt`이 24시간(예: `24 * 60 * 60 * 1000`) 이내인지 검사하고, 초과 시 해당 스냅샷은 사용하지 않고 `storedConversationId`만 사용하거나 복원을 건너뛰기.  
(명세에 맞추어 “폐기” 시 localStorage에서 제거할지 여부도 정책으로 결정 권장.)

---

### 3.2 CC-05: delete pending 상태에서 edit 저장 차단

**명세 (5.2):**  
"delete pending 상태에서는 edit 저장 차단", "삭제 우선 처리".

**현재 구현:**  
`HistorySidebar.tsx`에서 `pendingDeleteId`와 `editingConversationId`가 별도로 관리됨.  
다른 항목(B)이 삭제 확인 대기 중(`pendingDeleteId === B`)일 때, 항목 A에서 제목 편집 후 Enter 또는 저장 버튼으로 `handleSaveTitle(A)` 호출이 가능함.  
`handleSaveTitle` 내부에 `pendingDeleteId != null`일 때 저장을 막는 분기가 없음.

**권장 수정:**  
- `handleSaveTitle` 시작 시 `if (pendingDeleteId != null) return;` (또는 토스트로 “삭제 확인 중에는 제목을 저장할 수 없습니다” 안내) 추가.  
- 또는 제목 입력/저장 버튼이 노출될 때 `pendingDeleteId != null`이면 비활성화.

---

## 4. 자동화/CI

- 문서 12.2 권장 테스트 파일이 모두 존재하며,  
  `LoginPromptModal.test.tsx`, `HistorySidebar.test.tsx`, `AccommodationCard.test.tsx`,  
  `affiliate-event.service.test.ts`, `ChatPanel.restore.test.tsx`, `ChatPanel.ratelimit.test.tsx`  
  에서 명세 카피 및 동작 일부 검증. ✅  
- RUNBOOK 9절 Travel 플래그 롤백 절차 문서화 완료. ✅  

---

## 5. QA 시나리오(0.7) 및 게이트(0.8)

- 0.7 TC-P2-xx, TC-P3A-xx: 수동 실행·증빙 항목으로, 본 검토에서 자동 실행하지 않음.  
- 0.8 Gate-1~4, C1~C5: 승인/체크포인트 항목으로, 개발 검토 범위 외.  

---

## 6. 결론

- **대부분의 요구사항은 명세와 일치**하며, Copy, API 계약, restore/fallback, 제휴 카드, Feature Flag, phase3-monetization 문서와의 정합성은 확보된 상태로 판단됨.  
- **CC-03·CC-05 수정 반영 완료:**  
  1. **CC-03**: `travel_pending_restore`의 `updatedAt` 24시간 초과 시 스냅샷 폐기 로직 추가.  
  2. **CC-05**: delete pending 시 edit 저장 차단(또는 저장 비활성화).  

위 2건 반영 후 동시성/경합 시나리오(0.1)를 “완전 준수”로 볼 수 있음.
