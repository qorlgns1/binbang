-- CreateEnum
CREATE TYPE "FormSubmissionStatus" AS ENUM ('RECEIVED', 'NEEDS_REVIEW', 'REJECTED', 'PROCESSED');

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "status" "FormSubmissionStatus" NOT NULL DEFAULT 'RECEIVED',
    "rawPayload" JSONB NOT NULL,
    "formVersion" TEXT,
    "sourceIp" TEXT,
    "extractedFields" JSONB,
    "rejectionReason" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_responseId_key" ON "FormSubmission"("responseId");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_receivedAt_idx" ON "FormSubmission"("receivedAt");
