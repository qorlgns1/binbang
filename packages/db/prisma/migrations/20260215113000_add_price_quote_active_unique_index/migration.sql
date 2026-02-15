-- Guard: prevent creating the unique index when duplicate active quotes already exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PriceQuote"
    WHERE "isActive" = true
    GROUP BY "caseId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create unique active quote index: duplicate active rows exist in PriceQuote';
  END IF;
END
$$;

-- Enforce one active quote per case at DB level.
CREATE UNIQUE INDEX "PriceQuote_caseId_active_unique_idx"
ON "PriceQuote" ("caseId")
WHERE "isActive" = true;
