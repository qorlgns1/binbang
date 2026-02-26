#!/usr/bin/env bash

set -euo pipefail

# W6-D3 로컬 개발 서버 smoke test
#
# 사전 조건:
#   1. pnpm with-env pnpm dev  (또는 docker compose up) 으로 웹 서버 기동
#   2. MOONCATCH_INTERNAL_API_TOKEN 환경 변수 설정 (apps/web/.env.local)
#   3. DB에 활성 AGODA 숙소가 1건 이상 존재
#
# Usage:
#   ./scripts/mooncatch/local-smoke.sh
#
# 필요한 경우 PORT 또는 TOKEN 오버라이드:
#   PORT=3000 TOKEN=my-token ./scripts/mooncatch/local-smoke.sh
#
# 카카오 + priceDropThreshold 까지 테스트하려면:
#   ACCOMMODATION_ID=acc_xxx SESSION_COOKIE="next-auth.session-token=xxx" \
#   ./scripts/mooncatch/local-smoke.sh

PORT="${PORT:-3000}"
BASE_URL="http://localhost:${PORT}"

# .env.local에서 토큰 읽기 (없으면 TOKEN 환경 변수 사용)
if [[ -z "${TOKEN:-}" ]]; then
  ENV_FILE="apps/web/.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    TOKEN=$(grep -E '^MOONCATCH_INTERNAL_API_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
  fi
fi

if [[ -z "${TOKEN:-}" ]]; then
  echo "[error] MOONCATCH_INTERNAL_API_TOKEN을 apps/web/.env.local에 설정하거나 TOKEN=xxx로 전달하세요"
  exit 1
fi

ACCOMMODATION_ID="${ACCOMMODATION_ID:-}"
SESSION_COOKIE="${SESSION_COOKIE:-}"

echo "=== MoonCatch local smoke test ==="
echo "  BASE_URL : ${BASE_URL}"
echo "  TOKEN    : ${TOKEN:0:6}..."
echo ""

STEP=0
next_step() {
  STEP=$((STEP + 1))
  echo "[$STEP] $1"
}

# ──────────────────────────────────────────────
# 1. Health check
# ──────────────────────────────────────────────
next_step "health check"
HEALTH=$(curl -fsS "${BASE_URL}/api/health")
STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "  - status=${STATUS}"

# ──────────────────────────────────────────────
# 2. Poll (due accommodations)
# ──────────────────────────────────────────────
next_step "poll due accommodations"
POLL_RESP=$(curl -fsS -X POST "${BASE_URL}/api/internal/accommodations/poll-due" \
  -H "x-mooncatch-internal-token: ${TOKEN}" \
  -H "content-type: application/json" \
  -d '{"limit":5,"concurrency":2}')
DUE=$(echo "$POLL_RESP" | grep -o '"dueCount":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
OK=$(echo "$POLL_RESP" | grep -o '"successCount":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
FAIL=$(echo "$POLL_RESP" | grep -o '"failedCount":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
echo "  - due=${DUE}, success=${OK}, failed=${FAIL}"

# ──────────────────────────────────────────────
# 3. Dispatch notifications
# ──────────────────────────────────────────────
next_step "dispatch notifications"
DISPATCH_RESP=$(curl -fsS -X POST "${BASE_URL}/api/internal/accommodations/notifications/dispatch" \
  -H "x-mooncatch-internal-token: ${TOKEN}" \
  -H "content-type: application/json" \
  -d '{"limit":20}')
DISPATCHED=$(echo "$DISPATCH_RESP" | grep -o '"dispatched":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
FAILED=$(echo "$DISPATCH_RESP" | grep -o '"failed":[0-9]*' | head -1 | cut -d: -f2 || echo "?")
echo "  - dispatched=${DISPATCHED}, failed=${FAILED}"

# ──────────────────────────────────────────────
# 4. priceDropThreshold PATCH (W6-D2)
# ──────────────────────────────────────────────
next_step "priceDropThreshold PATCH (W6-D2)"
if [[ -z "$ACCOMMODATION_ID" || -z "$SESSION_COOKIE" ]]; then
  echo "  - skip (ACCOMMODATION_ID 또는 SESSION_COOKIE 미설정)"
else
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH "${BASE_URL}/api/accommodations/${ACCOMMODATION_ID}" \
    -H "content-type: application/json" \
    -H "cookie: ${SESSION_COOKIE}" \
    -d '{"priceDropThreshold":0.05}')
  if [[ "$CODE" == "200" ]]; then
    echo "  - ok (5% 임계값 설정)"
    curl -fsS -X PATCH "${BASE_URL}/api/accommodations/${ACCOMMODATION_ID}" \
      -H "content-type: application/json" \
      -H "cookie: ${SESSION_COOKIE}" \
      -d '{"priceDropThreshold":null}' >/dev/null
    echo "  - ok (null 원복)"
  else
    echo "  - [warn] HTTP ${CODE}"
  fi
fi

# ──────────────────────────────────────────────
# 5. Clickout redirect
# ──────────────────────────────────────────────
next_step "clickout redirect"
CLICKOUT_ID="${ACCOMMODATION_ID:-smoke-test-accommodation}"
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/api/go?accommodationId=${CLICKOUT_ID}&url=https%3A%2F%2Fwww.agoda.com")
if [[ "$CODE" == "302" ]]; then
  echo "  - ok (302)"
else
  echo "  - [warn] HTTP ${CODE} (302 expected)"
fi

echo ""
echo "[done] local smoke (${STEP} steps)"
