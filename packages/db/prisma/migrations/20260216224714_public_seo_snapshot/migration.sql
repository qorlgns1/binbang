-- CreateEnum
CREATE TYPE "PredictionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- DropIndex
DROP INDEX "PriceQuote_caseId_active_unique_idx";

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

-- CreateTable
CREATE TABLE "TravelConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelEntity" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelEntity_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "PublicAvailabilityPrediction_publicPropertyId_predictedAt_idx" ON "PublicAvailabilityPrediction"("publicPropertyId", "predictedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicAvailabilityPrediction_publicPropertyId_predictedAt_key" ON "PublicAvailabilityPrediction"("publicPropertyId", "predictedAt");

-- CreateIndex
CREATE INDEX "TravelConversation_sessionId_idx" ON "TravelConversation"("sessionId");

-- CreateIndex
CREATE INDEX "TravelConversation_userId_idx" ON "TravelConversation"("userId");

-- CreateIndex
CREATE INDEX "TravelMessage_conversationId_idx" ON "TravelMessage"("conversationId");

-- CreateIndex
CREATE INDEX "TravelMessage_createdAt_idx" ON "TravelMessage"("createdAt");

-- CreateIndex
CREATE INDEX "TravelEntity_conversationId_idx" ON "TravelEntity"("conversationId");

-- AddForeignKey
ALTER TABLE "PublicAvailabilitySnapshot" ADD CONSTRAINT "PublicAvailabilitySnapshot_publicPropertyId_fkey" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicAvailabilityPrediction" ADD CONSTRAINT "PublicAvailabilityPrediction_publicPropertyId_fkey" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelConversation" ADD CONSTRAINT "TravelConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelMessage" ADD CONSTRAINT "TravelMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelEntity" ADD CONSTRAINT "TravelEntity_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
