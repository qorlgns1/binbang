-- W4-D5-T2: MoonCatch 일일 운영 리포트 SQL
-- 기본 범위: 직전 1일(UTC day boundary 가정)

WITH bounds AS (
  SELECT
    date_trunc('day', NOW()) - INTERVAL '1 day' AS from_ts,
    date_trunc('day', NOW()) AS to_ts
),
notification_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
    COUNT(*) FILTER (WHERE status = 'suppressed') AS suppressed_count,
    COUNT(*) FILTER (WHERE status = 'queued') AS queued_count
  FROM agoda_notifications n
  CROSS JOIN bounds b
  WHERE n.created_at >= b.from_ts
    AND n.created_at < b.to_ts
),
false_positive_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE e.status = 'rejected_verify_failed') AS verify_rejected_count,
    COUNT(*) FILTER (
      WHERE e.status = 'detected'
        AND EXISTS (
          SELECT 1
          FROM agoda_notifications n
          WHERE n.alert_event_id = e.id
            AND n.status IN ('failed', 'suppressed')
        )
    ) AS delivery_issue_candidate_count
  FROM agoda_alert_events e
  CROSS JOIN bounds b
  WHERE e.detected_at >= b.from_ts
    AND e.detected_at < b.to_ts
),
clickout_stats AS (
  SELECT
    COUNT(*) AS clickout_count,
    COUNT(DISTINCT accommodation_id) AS clickout_accommodation_count
  FROM agoda_alert_events e
  CROSS JOIN bounds b
  WHERE e.type = 'clickout'
    AND e.detected_at >= b.from_ts
    AND e.detected_at < b.to_ts
)
SELECT
  b.from_ts AS range_from,
  b.to_ts AS range_to,
  ns.sent_count,
  ns.failed_count,
  ns.suppressed_count,
  ns.queued_count,
  (ns.sent_count + ns.failed_count) AS attempted_count,
  CASE
    WHEN (ns.sent_count + ns.failed_count) = 0 THEN 0
    ELSE ROUND((ns.sent_count::numeric / (ns.sent_count + ns.failed_count)) * 100, 2)
  END AS notification_success_rate_pct,
  fps.verify_rejected_count,
  fps.delivery_issue_candidate_count,
  cs.clickout_count,
  cs.clickout_accommodation_count
FROM bounds b
CROSS JOIN notification_stats ns
CROSS JOIN false_positive_stats fps
CROSS JOIN clickout_stats cs;

-- False-positive candidate details (최신 20건)
WITH bounds AS (
  SELECT
    date_trunc('day', NOW()) - INTERVAL '1 day' AS from_ts,
    date_trunc('day', NOW()) AS to_ts
)
SELECT
  e.id AS alert_event_id,
  e.accommodation_id,
  e.type,
  e.status,
  e.detected_at,
  (
    SELECT n.status
    FROM agoda_notifications n
    WHERE n.alert_event_id = e.id
    ORDER BY n.created_at DESC
    LIMIT 1
  ) AS latest_notification_status
FROM agoda_alert_events e
CROSS JOIN bounds b
WHERE e.detected_at >= b.from_ts
  AND e.detected_at < b.to_ts
  AND (
    e.status = 'rejected_verify_failed'
    OR EXISTS (
      SELECT 1
      FROM agoda_notifications n2
      WHERE n2.alert_event_id = e.id
        AND n2.status IN ('failed', 'suppressed')
    )
  )
ORDER BY e.detected_at DESC
LIMIT 20;

-- Clickout aggregation by accommodation (직전 1일)
WITH bounds AS (
  SELECT
    date_trunc('day', NOW()) - INTERVAL '1 day' AS from_ts,
    date_trunc('day', NOW()) AS to_ts
)
SELECT
  e.accommodation_id,
  COUNT(*) AS clickout_count
FROM agoda_alert_events e
CROSS JOIN bounds b
WHERE e.type = 'clickout'
  AND e.detected_at >= b.from_ts
  AND e.detected_at < b.to_ts
GROUP BY e.accommodation_id
ORDER BY clickout_count DESC, e.accommodation_id ASC;
