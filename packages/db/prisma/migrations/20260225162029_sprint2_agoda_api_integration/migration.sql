-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KRW',
ADD COLUMN     "lastEventAt" TIMESTAMP(3),
ADD COLUMN     "lastPolledAt" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'ko',
ALTER COLUMN "url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "agoda_poll_runs" (
    "id" BIGSERIAL NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "polledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agoda_poll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agoda_room_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "pollRunId" BIGINT NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "remainingRooms" INTEGER,
    "freeCancellation" BOOLEAN,
    "freeCancellationDate" TIMESTAMP(3),
    "totalInclusive" DECIMAL(12,2),
    "currency" TEXT,
    "payloadHash" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agoda_room_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agoda_alert_events" (
    "id" BIGSERIAL NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'detected',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beforeHash" TEXT,
    "afterHash" TEXT,
    "meta" JSONB,

    CONSTRAINT "agoda_alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agoda_notifications" (
    "id" BIGSERIAL NOT NULL,
    "accommodationId" TEXT,
    "alertEventId" BIGINT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agoda_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agoda_consent_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "accommodationId" TEXT,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agoda_consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agoda_poll_runs_accommodationId_polledAt_idx" ON "agoda_poll_runs"("accommodationId", "polledAt");

-- CreateIndex
CREATE INDEX "agoda_room_snapshots_accommodationId_createdAt_idx" ON "agoda_room_snapshots"("accommodationId", "createdAt");

-- CreateIndex
CREATE INDEX "agoda_room_snapshots_propertyId_roomId_ratePlanId_createdAt_idx" ON "agoda_room_snapshots"("propertyId", "roomId", "ratePlanId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agoda_alert_events_eventKey_key" ON "agoda_alert_events"("eventKey");

-- CreateIndex
CREATE INDEX "agoda_alert_events_accommodationId_type_detectedAt_idx" ON "agoda_alert_events"("accommodationId", "type", "detectedAt");

-- CreateIndex
CREATE INDEX "agoda_notifications_alertEventId_idx" ON "agoda_notifications"("alertEventId");

-- CreateIndex
CREATE INDEX "agoda_notifications_accommodationId_idx" ON "agoda_notifications"("accommodationId");

-- CreateIndex
CREATE INDEX "agoda_notifications_status_createdAt_idx" ON "agoda_notifications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "agoda_consent_logs_userId_createdAt_idx" ON "agoda_consent_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "agoda_consent_logs_email_createdAt_idx" ON "agoda_consent_logs"("email", "createdAt");

-- CreateIndex
CREATE INDEX "agoda_consent_logs_accommodationId_createdAt_idx" ON "agoda_consent_logs"("accommodationId", "createdAt");

-- CreateIndex
CREATE INDEX "Accommodation_platform_isActive_idx" ON "Accommodation"("platform", "isActive");

-- AddForeignKey
ALTER TABLE "agoda_poll_runs" ADD CONSTRAINT "agoda_poll_runs_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_room_snapshots" ADD CONSTRAINT "agoda_room_snapshots_pollRunId_fkey" FOREIGN KEY ("pollRunId") REFERENCES "agoda_poll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_room_snapshots" ADD CONSTRAINT "agoda_room_snapshots_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_alert_events" ADD CONSTRAINT "agoda_alert_events_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_notifications" ADD CONSTRAINT "agoda_notifications_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_notifications" ADD CONSTRAINT "agoda_notifications_alertEventId_fkey" FOREIGN KEY ("alertEventId") REFERENCES "agoda_alert_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_consent_logs" ADD CONSTRAINT "agoda_consent_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agoda_consent_logs" ADD CONSTRAINT "agoda_consent_logs_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
