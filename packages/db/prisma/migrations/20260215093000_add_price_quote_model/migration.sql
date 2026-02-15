-- CreateTable
CREATE TABLE "PriceQuote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "pricingPolicyVersion" TEXT NOT NULL,
    "inputsSnapshot" JSONB NOT NULL,
    "weightsSnapshot" JSONB NOT NULL,
    "computedAmountKrw" INTEGER NOT NULL,
    "roundedAmountKrw" INTEGER NOT NULL,
    "changeReason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceQuote_caseId_idx" ON "PriceQuote"("caseId");

-- CreateIndex
CREATE INDEX "PriceQuote_caseId_isActive_idx" ON "PriceQuote"("caseId", "isActive");

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
