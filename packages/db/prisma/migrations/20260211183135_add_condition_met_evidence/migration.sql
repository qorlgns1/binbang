-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "accommodationId" TEXT;

-- CreateTable
CREATE TABLE "ConditionMetEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "checkLogId" TEXT NOT NULL,
    "evidenceSnapshot" JSONB NOT NULL,
    "screenshotBase64" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConditionMetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConditionMetEvent_caseId_idx" ON "ConditionMetEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionMetEvent_caseId_checkLogId_key" ON "ConditionMetEvent"("caseId", "checkLogId");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionMetEvent" ADD CONSTRAINT "ConditionMetEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionMetEvent" ADD CONSTRAINT "ConditionMetEvent_checkLogId_fkey" FOREIGN KEY ("checkLogId") REFERENCES "CheckLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
