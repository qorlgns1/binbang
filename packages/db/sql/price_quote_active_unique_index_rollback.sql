-- Rollback procedure for migration 20260215113000_add_price_quote_active_unique_index.
-- Use only when the unique active quote constraint must be reverted.

DROP INDEX IF EXISTS "PriceQuote_caseId_active_unique_idx";
