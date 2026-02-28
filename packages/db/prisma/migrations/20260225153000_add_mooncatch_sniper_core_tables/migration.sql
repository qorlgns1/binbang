-- CreateTable
CREATE TABLE "watches" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "propertyId" BIGINT NOT NULL,
    "propertyName" TEXT,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "locale" TEXT NOT NULL DEFAULT 'ko',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastPolledAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_runs" (
    "id" BIGSERIAL NOT NULL,
    "watchId" TEXT NOT NULL,
    "polledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "pollRunId" BIGINT NOT NULL,
    "watchId" TEXT NOT NULL,
    "propertyId" BIGINT NOT NULL,
    "roomId" BIGINT NOT NULL,
    "ratePlanId" BIGINT NOT NULL,
    "remainingRooms" INTEGER,
    "freeCancellation" BOOLEAN,
    "freeCancellationDate" TIMESTAMP(3),
    "totalInclusive" DECIMAL(12,2),
    "currency" TEXT,
    "payloadHash" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" BIGSERIAL NOT NULL,
    "watchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'detected',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beforeHash" TEXT,
    "afterHash" TEXT,
    "meta" JSONB,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "watchId" TEXT,
    "alertEventId" BIGINT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watches_property_id_check_in_check_out_idx" ON "watches"("propertyId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "watches_status_updated_at_idx" ON "watches"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "watches_user_id_idx" ON "watches"("userId");

-- CreateIndex
CREATE INDEX "watches_email_idx" ON "watches"("email");

-- CreateIndex
CREATE INDEX "poll_runs_watch_id_polled_at_idx" ON "poll_runs"("watchId", "polledAt");

-- CreateIndex
CREATE INDEX "room_snapshots_watch_id_created_at_idx" ON "room_snapshots"("watchId", "createdAt");

-- CreateIndex
CREATE INDEX "room_snapshots_offer_lookup_idx" ON "room_snapshots"("propertyId", "roomId", "ratePlanId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "alert_events_eventKey_key" ON "alert_events"("eventKey");

-- CreateIndex
CREATE INDEX "alert_events_watch_id_type_detected_at_idx" ON "alert_events"("watchId", "type", "detectedAt");

-- CreateIndex
CREATE INDEX "notifications_alert_event_id_idx" ON "notifications"("alertEventId");

-- CreateIndex
CREATE INDEX "notifications_watch_id_idx" ON "notifications"("watchId");

-- CreateIndex
CREATE INDEX "consent_logs_user_id_created_at_idx" ON "consent_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "consent_logs_email_created_at_idx" ON "consent_logs"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "watches" ADD CONSTRAINT "watches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_runs" ADD CONSTRAINT "poll_runs_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_snapshots" ADD CONSTRAINT "room_snapshots_pollRunId_fkey" FOREIGN KEY ("pollRunId") REFERENCES "poll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_snapshots" ADD CONSTRAINT "room_snapshots_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alertEventId_fkey" FOREIGN KEY ("alertEventId") REFERENCES "alert_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
