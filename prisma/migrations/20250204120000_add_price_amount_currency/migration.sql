-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN "lastPriceAmount" INTEGER,
ADD COLUMN "lastPriceCurrency" TEXT;

-- AlterTable
ALTER TABLE "CheckLog" ADD COLUMN "priceAmount" INTEGER,
ADD COLUMN "priceCurrency" TEXT;
