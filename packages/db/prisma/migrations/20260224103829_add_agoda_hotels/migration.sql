-- CreateTable
CREATE TABLE "agoda_hotels" (
    "hotelId" INTEGER NOT NULL,
    "hotelName" TEXT NOT NULL,
    "hotelTranslatedName" TEXT,
    "cityId" INTEGER NOT NULL,
    "cityName" TEXT,
    "countryName" TEXT,
    "countryCode" TEXT,
    "starRating" DOUBLE PRECISION,
    "ratingAverage" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "url" TEXT,

    CONSTRAINT "agoda_hotels_pkey" PRIMARY KEY ("hotelId")
);

-- CreateIndex
CREATE INDEX "agoda_hotels_cityId_idx" ON "agoda_hotels"("cityId");

-- CreateIndex
CREATE INDEX "agoda_hotels_countryCode_cityId_idx" ON "agoda_hotels"("countryCode", "cityId");
