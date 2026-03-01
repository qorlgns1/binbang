-- W4-D3-T2: 2년 경과 수신동의 재확인 대상 추출
-- 대상: 최신 동의 상태가 opt_in 이고, 마지막 opt_in 시점이 2년을 초과한 사용자/이메일

WITH consent_subjects AS (
  SELECT
    id,
    COALESCE(user_id, CONCAT('email:', LOWER(email))) AS subject_key,
    user_id,
    LOWER(email) AS email,
    accommodation_id,
    type,
    created_at
  FROM agoda_consent_logs
),
latest_consent AS (
  SELECT DISTINCT ON (subject_key)
    subject_key,
    user_id,
    email,
    accommodation_id,
    type,
    created_at
  FROM consent_subjects
  ORDER BY subject_key, created_at DESC, id DESC
)
SELECT
  subject_key,
  user_id,
  email,
  accommodation_id,
  type AS latest_consent_type,
  created_at AS latest_consent_at,
  NOW() - created_at AS elapsed_since_consent
FROM latest_consent
WHERE type = 'opt_in'
  AND created_at < (NOW() - INTERVAL '2 years')
ORDER BY created_at ASC;
