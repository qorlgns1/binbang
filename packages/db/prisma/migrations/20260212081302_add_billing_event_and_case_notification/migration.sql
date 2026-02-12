-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('CONDITION_MET_FEE');

-- CreateTable
CREATE TABLE "CaseNotification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'KAKAO',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "BillingEventType" NOT NULL DEFAULT 'CONDITION_MET_FEE',
    "conditionMetEventId" TEXT NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseNotification_idempotencyKey_key" ON "CaseNotification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CaseNotification_caseId_idx" ON "CaseNotification"("caseId");

-- CreateIndex
CREATE INDEX "CaseNotification_status_idx" ON "CaseNotification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_caseId_key" ON "BillingEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_conditionMetEventId_key" ON "BillingEvent"("conditionMetEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_caseId_idx" ON "BillingEvent"("caseId");

-- AddForeignKey
ALTER TABLE "CaseNotification" ADD CONSTRAINT "CaseNotification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_conditionMetEventId_fkey" FOREIGN KEY ("conditionMetEventId") REFERENCES "ConditionMetEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
