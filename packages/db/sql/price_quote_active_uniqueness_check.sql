-- Returns violating caseIds when there are duplicate active quotes.
SELECT
  "caseId",
  COUNT(*) AS active_quote_count
FROM "PriceQuote"
WHERE "isActive" = true
GROUP BY "caseId"
HAVING COUNT(*) > 1
ORDER BY active_quote_count DESC, "caseId" ASC;
