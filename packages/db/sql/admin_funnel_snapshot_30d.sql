-- P0-9-T1: Admin funnel KPI SoT snapshot (UTC)
-- KPI aliases are fixed by contract: submitted / processed / paymentConfirmed / conditionMet
-- Baseline window: 2026-01-14T00:00:00Z ~ 2026-02-13T23:59:59.999Z

SET TIME ZONE 'UTC';

WITH params AS (
  SELECT
    TIMESTAMPTZ '2026-01-14T00:00:00Z' AS from_utc,
    TIMESTAMPTZ '2026-02-13T23:59:59.999Z' AS to_utc
),
submitted AS (
  SELECT count(DISTINCT fs."responseId")::int AS submitted
  FROM "FormSubmission" fs
  CROSS JOIN params p
  WHERE fs."createdAt" >= p.from_utc
    AND fs."createdAt" <= p.to_utc
),
processed AS (
  SELECT count(DISTINCT fs."id")::int AS processed
  FROM "FormSubmission" fs
  CROSS JOIN params p
  WHERE fs."status" = 'PROCESSED'
    AND fs."updatedAt" >= p.from_utc
    AND fs."updatedAt" <= p.to_utc
),
payment_confirmed AS (
  SELECT count(DISTINCT c."id")::int AS "paymentConfirmed"
  FROM "Case" c
  CROSS JOIN params p
  WHERE c."paymentConfirmedAt" IS NOT NULL
    AND c."paymentConfirmedAt" >= p.from_utc
    AND c."paymentConfirmedAt" <= p.to_utc
),
condition_met AS (
  SELECT count(DISTINCT be."caseId")::int AS "conditionMet"
  FROM "BillingEvent" be
  CROSS JOIN params p
  WHERE be."createdAt" >= p.from_utc
    AND be."createdAt" <= p.to_utc
)
SELECT
  p.from_utc,
  p.to_utc,
  s.submitted,
  pr.processed,
  pc."paymentConfirmed",
  cm."conditionMet"
FROM params p
CROSS JOIN submitted s
CROSS JOIN processed pr
CROSS JOIN payment_confirmed pc
CROSS JOIN condition_met cm;

WITH params AS (
  SELECT
    TIMESTAMPTZ '2026-01-14T00:00:00Z' AS from_utc,
    TIMESTAMPTZ '2026-02-13T23:59:59.999Z' AS to_utc
),
days AS (
  SELECT generate_series(
    (SELECT date(from_utc) FROM params),
    (SELECT date(to_utc) FROM params),
    INTERVAL '1 day'
  )::date AS day
),
submitted_by_day AS (
  SELECT
    date_trunc('day', timezone('UTC', fs."createdAt"))::date AS day,
    count(DISTINCT fs."responseId")::int AS submitted
  FROM "FormSubmission" fs
  CROSS JOIN params p
  WHERE fs."createdAt" >= p.from_utc
    AND fs."createdAt" <= p.to_utc
  GROUP BY 1
),
processed_by_day AS (
  SELECT
    date_trunc('day', timezone('UTC', fs."updatedAt"))::date AS day,
    count(DISTINCT fs."id")::int AS processed
  FROM "FormSubmission" fs
  CROSS JOIN params p
  WHERE fs."status" = 'PROCESSED'
    AND fs."updatedAt" >= p.from_utc
    AND fs."updatedAt" <= p.to_utc
  GROUP BY 1
),
payment_confirmed_by_day AS (
  SELECT
    date_trunc('day', timezone('UTC', c."paymentConfirmedAt"))::date AS day,
    count(DISTINCT c."id")::int AS "paymentConfirmed"
  FROM "Case" c
  CROSS JOIN params p
  WHERE c."paymentConfirmedAt" IS NOT NULL
    AND c."paymentConfirmedAt" >= p.from_utc
    AND c."paymentConfirmedAt" <= p.to_utc
  GROUP BY 1
),
condition_met_by_day AS (
  SELECT
    date_trunc('day', timezone('UTC', be."createdAt"))::date AS day,
    count(DISTINCT be."caseId")::int AS "conditionMet"
  FROM "BillingEvent" be
  CROSS JOIN params p
  WHERE be."createdAt" >= p.from_utc
    AND be."createdAt" <= p.to_utc
  GROUP BY 1
)
SELECT
  to_char(d.day, 'YYYY-MM-DD') AS date,
  COALESCE(s.submitted, 0) AS submitted,
  COALESCE(pr.processed, 0) AS processed,
  COALESCE(pc."paymentConfirmed", 0) AS "paymentConfirmed",
  COALESCE(cm."conditionMet", 0) AS "conditionMet"
FROM days d
LEFT JOIN submitted_by_day s ON s.day = d.day
LEFT JOIN processed_by_day pr ON pr.day = d.day
LEFT JOIN payment_confirmed_by_day pc ON pc.day = d.day
LEFT JOIN condition_met_by_day cm ON cm.day = d.day
ORDER BY d.day;
