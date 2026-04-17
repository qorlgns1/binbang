-- CreateTable
CREATE TABLE "agoda_hotels_search" (
    "hotelId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "countryCode" TEXT,
    "hotelNameKo" TEXT,
    "hotelNameEn" TEXT,
    "cityNameKo" TEXT,
    "cityNameEn" TEXT,
    "countryNameKo" TEXT,
    "countryNameEn" TEXT,
    "starRating" DOUBLE PRECISION,
    "ratingAverage" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "url" TEXT,
    "searchTextKo" TEXT NOT NULL DEFAULT '',
    "searchTextEn" TEXT NOT NULL DEFAULT '',
    "koSourcePresent" BOOLEAN NOT NULL DEFAULT false,
    "enSourcePresent" BOOLEAN NOT NULL DEFAULT false,
    "llmAliasFilled" BOOLEAN NOT NULL DEFAULT false,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agoda_hotels_search_pkey" PRIMARY KEY ("hotelId")
);

-- CreateIndex
CREATE INDEX "agoda_hotels_search_cityId_idx" ON "agoda_hotels_search"("cityId");

-- CreateIndex
CREATE INDEX "agoda_hotels_search_countryCode_cityId_idx" ON "agoda_hotels_search"("countryCode", "cityId");

-- CreateIndex
CREATE INDEX "agoda_hotels_search_hotelNameKo_trgm_idx" ON "agoda_hotels_search" USING GIN ("hotelNameKo" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "agoda_hotels_search_hotelNameEn_trgm_idx" ON "agoda_hotels_search" USING GIN ("hotelNameEn" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "agoda_hotels_search_searchTextKo_trgm_idx" ON "agoda_hotels_search" USING GIN ("searchTextKo" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "agoda_hotels_search_searchTextEn_trgm_idx" ON "agoda_hotels_search" USING GIN ("searchTextEn" gin_trgm_ops);
