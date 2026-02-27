#!/usr/bin/env bash

set -euo pipefail

# W6-D3 staging smoke script (W4-D4-T1 기반)
# Usage:
#   BASE_URL=https://staging.example.com \
#   INTERNAL_TOKEN=... \
#   ./scripts/binbang/staging-smoke.sh
#
# Optional:
#   ACCOMMODATION_ID=acc_xxx          # priceDropThreshold PATCH 테스트 + clickout 테스트에 사용
#   SESSION_COOKIE=next-auth.session-token=...  # PATCH 인증용 (없으면 PATCH 스텝 건너뜀)

BASE_URL="${BASE_URL:-}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-}"
ACCOMMODATION_ID="${ACCOMMODATION_ID:-}"
SESSION_COOKIE="${SESSION_COOKIE:-}"

if [[ -z "$BASE_URL" ]]; then
  echo "[error] BASE_URL is required"
  exit 1
fi

if [[ -z "$INTERNAL_TOKEN" ]]; then
  echo "[error] INTERNAL_TOKEN is required"
  exit 1
fi

STEP=0

next_step() {
  STEP=$((STEP + 1))
  echo "[$STEP] $1"
}

# ──────────────────────────────────────────────
# 1. Health check
# ──────────────────────────────────────────────
next_step "health check"
curl -fsS "${BASE_URL%/}/api/health" >/dev/null
echo "  - ok"

# ──────────────────────────────────────────────
# 2. Poll due accommodations
# ──────────────────────────────────────────────
next_step "poll due accommodations"
POLL_RESP=$(curl -fsS -X POST "${BASE_URL%/}/api/internal/accommodations/poll-due" \
  -H "x-binbang-internal-token: ${INTERNAL_TOKEN}" \
  -H "content-type: application/json" \
  -d '{"limit":20,"concurrency":3}')
POLL_DUE=$(echo "$POLL_RESP" | grep -o '"dueCount":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
POLL_SUCCESS=$(echo "$POLL_RESP" | grep -o '"successCount":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
echo "  - dueCount=${POLL_DUE}, successCount=${POLL_SUCCESS}"

# ──────────────────────────────────────────────
# 3. Dispatch notifications (이메일 + 카카오 포함)
# ──────────────────────────────────────────────
next_step "dispatch notifications (email + kakao)"
DISPATCH_RESP=$(curl -fsS -X POST "${BASE_URL%/}/api/internal/accommodations/notifications/dispatch" \
  -H "x-binbang-internal-token: ${INTERNAL_TOKEN}" \
  -H "content-type: application/json" \
  -d '{"limit":50}')
DISPATCHED=$(echo "$DISPATCH_RESP" | grep -o '"dispatched":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
FAILED=$(echo "$DISPATCH_RESP" | grep -o '"failed":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
echo "  - dispatched=${DISPATCHED}, failed=${FAILED}"

# ──────────────────────────────────────────────
# 4. priceDropThreshold PATCH (W6-D2, SESSION_COOKIE + ACCOMMODATION_ID 필요)
# ──────────────────────────────────────────────
next_step "priceDropThreshold PATCH (W6-D2)"
if [[ -z "$ACCOMMODATION_ID" || -z "$SESSION_COOKIE" ]]; then
  echo "  - skip (ACCOMMODATION_ID 또는 SESSION_COOKIE 미설정)"
else
  PATCH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH "${BASE_URL%/}/api/accommodations/${ACCOMMODATION_ID}" \
    -H "content-type: application/json" \
    -H "cookie: ${SESSION_COOKIE}" \
    -d '{"priceDropThreshold":0.05}')
  if [[ "$PATCH_STATUS" == "200" ]]; then
    echo "  - ok (threshold=5% 설정 성공)"
    # 원복
    curl -fsS -X PATCH "${BASE_URL%/}/api/accommodations/${ACCOMMODATION_ID}" \
      -H "content-type: application/json" \
      -H "cookie: ${SESSION_COOKIE}" \
      -d '{"priceDropThreshold":null}' >/dev/null
    echo "  - ok (threshold=null 원복)"
  else
    echo "  - [warn] PATCH returned HTTP ${PATCH_STATUS} (인증 만료 여부 확인)"
  fi
fi

# ──────────────────────────────────────────────
# 5. Clickout redirect
# ──────────────────────────────────────────────
next_step "clickout redirect (W4-D1)"
CLICKOUT_ID="${ACCOMMODATION_ID:-smoke-test-accommodation}"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL%/}/api/go?accommodationId=${CLICKOUT_ID}&url=https%3A%2F%2Fwww.agoda.com")

if [[ "$STATUS_CODE" != "302" ]]; then
  echo "[error] clickout did not return 302 (status=${STATUS_CODE})"
  exit 1
fi
echo "  - ok (302 redirect)"

echo
echo "[done] staging smoke checks passed (${STEP} steps)"
