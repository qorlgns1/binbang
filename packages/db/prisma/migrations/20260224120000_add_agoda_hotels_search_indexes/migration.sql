-- Enable trigram extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex (GIN trigram indexes for fast hotel search)
CREATE INDEX "agoda_hotels_hotelName_trgm_idx" ON "agoda_hotels" USING GIN ("hotelName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "agoda_hotels_hotelTranslatedName_trgm_idx" ON "agoda_hotels" USING GIN ("hotelTranslatedName" gin_trgm_ops);
