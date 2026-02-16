-- CreateEnum
CREATE TYPE "PredictionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "PublicProperty" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformPropertyKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "countryKey" TEXT,
    "cityKey" TEXT,
    "addressRegion" TEXT,
    "addressLocality" TEXT,
    "ratingValue" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastObservedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicAvailabilitySnapshot" (
    "id" TEXT NOT NULL,
    "publicPropertyId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "windowEndAt" TIMESTAMP(3) NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "availableCount" INTEGER NOT NULL,
    "unavailableCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "avgPriceAmount" INTEGER,
    "minPriceAmount" INTEGER,
    "maxPriceAmount" INTEGER,
    "currency" TEXT,
    "openRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicAvailabilitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicAvailabilityPrediction" (
    "id" TEXT NOT NULL,
    "publicPropertyId" TEXT NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextLikelyAvailableAt" TIMESTAMP(3),
    "confidence" "PredictionConfidence" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "windowDays" INTEGER NOT NULL DEFAULT 28,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicAvailabilityPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicProperty_countryKey_cityKey_idx" ON "PublicProperty"("countryKey", "cityKey");

-- CreateIndex
CREATE INDEX "PublicProperty_isActive_idx" ON "PublicProperty"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProperty_platform_platformPropertyKey_key" ON "PublicProperty"("platform", "platformPropertyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProperty_platform_slug_key" ON "PublicProperty"("platform", "slug");

-- CreateIndex
CREATE INDEX "PublicAvailabilitySnapshot_snapshotDate_idx" ON "PublicAvailabilitySnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "PublicAvailabilitySnapshot_openRate_idx" ON "PublicAvailabilitySnapshot"("openRate");

-- CreateIndex
CREATE UNIQUE INDEX "PublicAvailabilitySnapshot_publicPropertyId_snapshotDate_key" ON "PublicAvailabilitySnapshot"("publicPropertyId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "PublicAvailabilityPrediction_publicPropertyId_predictedAt_key" ON "PublicAvailabilityPrediction"("publicPropertyId", "predictedAt");

-- AddForeignKey
ALTER TABLE "PublicAvailabilitySnapshot" ADD CONSTRAINT "PublicAvailabilitySnapshot_publicPropertyId_fkey" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicAvailabilityPrediction" ADD CONSTRAINT "PublicAvailabilityPrediction_publicPropertyId_fkey" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
