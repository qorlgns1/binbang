-- CreateTable
CREATE TABLE "LandingEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "source" TEXT,
    "sessionId" TEXT,
    "locale" TEXT,
    "path" TEXT NOT NULL DEFAULT '/',
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandingEvent_occurredAt_idx" ON "LandingEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "LandingEvent_eventName_occurredAt_idx" ON "LandingEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "LandingEvent_sessionId_idx" ON "LandingEvent"("sessionId");
