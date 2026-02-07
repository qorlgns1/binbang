-- DropTable (ThroughputLog - 미배포 상태이므로 IF EXISTS)
DROP TABLE IF EXISTS "ThroughputLog";

-- CreateTable
CREATE TABLE "CheckCycle" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "concurrency" INTEGER NOT NULL,
    "browserPoolSize" INTEGER NOT NULL,
    "navigationTimeoutMs" INTEGER NOT NULL,
    "contentWaitMs" INTEGER NOT NULL,
    "maxRetries" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckCycle_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CheckLog" ADD COLUMN "cycleId" TEXT;
ALTER TABLE "CheckLog" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "CheckLog" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CheckLog" ADD COLUMN "previousStatus" "AvailabilityStatus";

-- CreateIndex
CREATE INDEX "CheckCycle_startedAt_idx" ON "CheckCycle"("startedAt");
CREATE INDEX "CheckCycle_concurrency_browserPoolSize_idx" ON "CheckCycle"("concurrency", "browserPoolSize");
CREATE INDEX "CheckLog_cycleId_idx" ON "CheckLog"("cycleId");

-- AddForeignKey
ALTER TABLE "CheckLog" ADD CONSTRAINT "CheckLog_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CheckCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
