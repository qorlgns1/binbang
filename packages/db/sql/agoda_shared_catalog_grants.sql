-- Example grants for the shared Agoda catalog.
-- Adjust grantees if the environment schema names change.

GRANT SELECT ON "agoda_hotels" TO BINBANG_DEV;
GRANT SELECT ON "agoda_hotels_search" TO BINBANG_DEV;

GRANT SELECT ON "agoda_hotels" TO BINBANG_PROD;
GRANT SELECT ON "agoda_hotels_search" TO BINBANG_PROD;
