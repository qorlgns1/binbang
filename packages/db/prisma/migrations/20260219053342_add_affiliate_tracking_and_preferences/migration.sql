-- CreateEnum
CREATE TYPE "AffiliateEventType" AS ENUM ('impression', 'cta_attempt', 'outbound_click');

-- CreateEnum
CREATE TYPE "ConversationAffiliateOverride" AS ENUM ('inherit', 'enabled', 'disabled');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "affiliateLinksEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "affiliate_events" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "userId" TEXT,
    "userTimezone" TEXT,
    "provider" TEXT NOT NULL,
    "eventType" "AffiliateEventType" NOT NULL,
    "reasonCode" TEXT,
    "idempotencyKey" TEXT,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" "AffiliateAdvertiserCategory" NOT NULL,
    "isCtaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_preferences" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "affiliateOverride" "ConversationAffiliateOverride" NOT NULL DEFAULT 'inherit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_preference_audit_logs" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromValue" "ConversationAffiliateOverride" NOT NULL,
    "toValue" "ConversationAffiliateOverride" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_preference_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_audit_job_states" (
    "jobName" TEXT NOT NULL,
    "isFailing" BOOLEAN NOT NULL DEFAULT false,
    "failedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "lastAlertCause" TEXT,
    "lastAlertSeverity" TEXT,
    "lastAlertSentAt" TIMESTAMP(3),
    "lastRunStartedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_audit_job_states_pkey" PRIMARY KEY ("jobName")
);

-- CreateTable
CREATE TABLE "affiliate_audit_purge_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "runStartedAt" TIMESTAMP(3) NOT NULL,
    "runFinishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "deletedCount" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_audit_purge_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_events_idempotencyKey_key" ON "affiliate_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "affiliate_events_provider_eventType_idx" ON "affiliate_events"("provider", "eventType");

-- CreateIndex
CREATE INDEX "affiliate_events_eventType_reasonCode_idx" ON "affiliate_events"("eventType", "reasonCode");

-- CreateIndex
CREATE INDEX "affiliate_events_category_eventType_idx" ON "affiliate_events"("category", "eventType");

-- CreateIndex
CREATE INDEX "affiliate_events_occurredAt_idx" ON "affiliate_events"("occurredAt");

-- CreateIndex
CREATE INDEX "affiliate_events_conversationId_productId_idx" ON "affiliate_events"("conversationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_preferences_conversationId_key" ON "conversation_preferences"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_preferences_affiliateOverride_idx" ON "conversation_preferences"("affiliateOverride");

-- CreateIndex
CREATE INDEX "affiliate_preference_audit_logs_conversationId_changedAt_idx" ON "affiliate_preference_audit_logs"("conversationId", "changedAt");

-- CreateIndex
CREATE INDEX "affiliate_preference_audit_logs_changedAt_idx" ON "affiliate_preference_audit_logs"("changedAt");

-- CreateIndex
CREATE INDEX "affiliate_audit_purge_runs_jobName_runStartedAt_idx" ON "affiliate_audit_purge_runs"("jobName", "runStartedAt");

-- CreateIndex
CREATE INDEX "affiliate_audit_purge_runs_status_createdAt_idx" ON "affiliate_audit_purge_runs"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "affiliate_events" ADD CONSTRAINT "affiliate_events_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_events" ADD CONSTRAINT "affiliate_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_preferences" ADD CONSTRAINT "conversation_preferences_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_preference_audit_logs" ADD CONSTRAINT "affiliate_preference_audit_logs_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_preference_audit_logs" ADD CONSTRAINT "affiliate_preference_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
