-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('RECEIVED', 'REVIEWING', 'WAITING_PAYMENT', 'ACTIVE_MONITORING', 'CONDITION_MET', 'BILLED', 'CLOSED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'RECEIVED',
    "assignedTo" TEXT,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusChangedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStatusLog" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fromStatus" "CaseStatus" NOT NULL,
    "toStatus" "CaseStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_submissionId_key" ON "Case"("submissionId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");

-- CreateIndex
CREATE INDEX "CaseStatusLog_caseId_idx" ON "CaseStatusLog"("caseId");

-- CreateIndex
CREATE INDEX "CaseStatusLog_createdAt_idx" ON "CaseStatusLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStatusLog" ADD CONSTRAINT "CaseStatusLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
