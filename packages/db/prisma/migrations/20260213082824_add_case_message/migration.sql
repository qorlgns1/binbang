-- CreateTable
CREATE TABLE "CaseMessage" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseMessage_caseId_idx" ON "CaseMessage"("caseId");

-- CreateIndex
CREATE INDEX "CaseMessage_sentById_idx" ON "CaseMessage"("sentById");

-- CreateIndex
CREATE INDEX "CaseMessage_createdAt_idx" ON "CaseMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
