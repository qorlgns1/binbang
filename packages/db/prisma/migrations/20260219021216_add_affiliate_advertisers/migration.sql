-- CreateEnum
CREATE TYPE "AffiliateAdvertiserCategory" AS ENUM ('accommodation', 'flight', 'esim', 'car_rental', 'travel_package', 'other');

-- CreateTable
CREATE TABLE "affiliate_advertisers" (
    "id" TEXT NOT NULL,
    "advertiserId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AffiliateAdvertiserCategory" NOT NULL DEFAULT 'other',
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'awin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_advertisers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_advertisers_advertiserId_key" ON "affiliate_advertisers"("advertiserId");

-- CreateIndex
CREATE INDEX "affiliate_advertisers_category_idx" ON "affiliate_advertisers"("category");
