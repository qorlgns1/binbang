#!/usr/bin/env bash

set -euo pipefail

# W4-D4-T1 staging smoke script
# Usage:
#   BASE_URL=https://staging.example.com \
#   INTERNAL_TOKEN=... \
#   ./scripts/mooncatch/staging-smoke.sh
#
# Optional:
#   ACCOMMODATION_ID_FOR_GO=acc_xxx

BASE_URL="${BASE_URL:-}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-}"
ACCOMMODATION_ID_FOR_GO="${ACCOMMODATION_ID_FOR_GO:-smoke-test-accommodation}"

if [[ -z "$BASE_URL" ]]; then
  echo "[error] BASE_URL is required"
  exit 1
fi

if [[ -z "$INTERNAL_TOKEN" ]]; then
  echo "[error] INTERNAL_TOKEN is required"
  exit 1
fi

echo "[1/4] health check"
curl -fsS "${BASE_URL%/}/api/health" >/dev/null
echo "  - ok"

echo "[2/4] poll due accommodations"
curl -fsS -X POST "${BASE_URL%/}/api/internal/accommodations/poll-due" \
  -H "x-mooncatch-internal-token: ${INTERNAL_TOKEN}" \
  -H "content-type: application/json" \
  -d '{"limit":20,"concurrency":3}' >/dev/null
echo "  - ok"

echo "[3/4] dispatch notifications"
curl -fsS -X POST "${BASE_URL%/}/api/internal/accommodations/notifications/dispatch" \
  -H "x-mooncatch-internal-token: ${INTERNAL_TOKEN}" \
  -H "content-type: application/json" \
  -d '{"limit":50}' >/dev/null
echo "  - ok"

echo "[4/4] clickout redirect"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL%/}/api/go?accommodationId=${ACCOMMODATION_ID_FOR_GO}&url=https%3A%2F%2Fwww.agoda.com")

if [[ "$STATUS_CODE" != "302" ]]; then
  echo "[error] clickout did not return 302 (status=${STATUS_CODE})"
  exit 1
fi

echo "  - ok"
echo
echo "[done] staging smoke checks passed"
