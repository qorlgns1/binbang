-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('AIRBNB', 'AGODA');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "QuotaKey" AS ENUM ('MAX_ACCOMMODATIONS', 'CHECK_INTERVAL_MIN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SelectorCategory" AS ENUM ('PRICE', 'AVAILABILITY', 'METADATA', 'PLATFORM_ID');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "FormQuestionField" AS ENUM ('CONTACT_CHANNEL', 'CONTACT_VALUE', 'TARGET_URL', 'CONDITION_DEFINITION', 'REQUEST_WINDOW', 'CHECK_FREQUENCY', 'BILLING_CONSENT', 'SCOPE_CONSENT');

-- CreateEnum
CREATE TYPE "FormSubmissionStatus" AS ENUM ('RECEIVED', 'NEEDS_REVIEW', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('RECEIVED', 'REVIEWING', 'NEEDS_CLARIFICATION', 'WAITING_PAYMENT', 'ACTIVE_MONITORING', 'CONDITION_MET', 'BILLED', 'CLOSED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('CONDITION_MET_FEE');

-- CreateEnum
CREATE TYPE "PredictionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "kakaoAccessToken" TEXT,
    "kakaoRefreshToken" TEXT,
    "kakaoTokenExpiry" TIMESTAMP(3),
    "planId" TEXT,
    "tutorialCompletedAt" TIMESTAMP(3),
    "tutorialDismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Accommodation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "url" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheck" TIMESTAMP(3),
    "lastStatus" "AvailabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastPrice" TEXT,
    "lastPriceAmount" INTEGER,
    "lastPriceCurrency" TEXT,
    "platformId" TEXT,
    "platformName" TEXT,
    "platformImage" TEXT,
    "platformDescription" TEXT,
    "addressCountry" TEXT,
    "addressRegion" TEXT,
    "addressLocality" TEXT,
    "postalCode" TEXT,
    "streetAddress" TEXT,
    "ratingValue" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "platformMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "CheckLog" (
    "id" TEXT NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL,
    "price" TEXT,
    "priceAmount" INTEGER,
    "priceCurrency" TEXT,
    "errorMessage" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "pricePerNight" INTEGER,
    "cycleId" TEXT,
    "durationMs" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "previousStatus" "AvailabilityStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProcessing" BOOLEAN NOT NULL DEFAULT false,
    "schedule" TEXT NOT NULL DEFAULT '*/30 * * * *',
    "accommodationsChecked" INTEGER NOT NULL DEFAULT 0,
    "lastCycleErrors" INTEGER NOT NULL DEFAULT 0,
    "lastCycleDurationMs" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeartbeatHistory" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "isProcessing" BOOLEAN NOT NULL DEFAULT false,
    "uptime" DOUBLE PRECISION,
    "workerId" TEXT NOT NULL DEFAULT 'singleton',

    CONSTRAINT "HeartbeatHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsChangeLog" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingsChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL,
    "description" TEXT,
    "minValue" TEXT,
    "maxValue" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "interval" TEXT NOT NULL DEFAULT 'month',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanQuota" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "key" "QuotaKey" NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "PlanQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "paymentProvider" TEXT,
    "externalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSelector" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "category" "SelectorCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "extractorCode" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSelector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformPattern" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "patternType" "PatternType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ko',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectorChangeLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelectorChangeLog_pkey" PRIMARY KEY ("id")
);

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
    "consentBillingOnConditionMet" BOOLEAN,
    "consentServiceScope" BOOLEAN,
    "consentCapturedAt" TIMESTAMP(3),
    "consentTexts" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormQuestionMapping" (
    "id" TEXT NOT NULL,
    "formKey" TEXT NOT NULL DEFAULT '*',
    "field" "FormQuestionField" NOT NULL,
    "questionItemId" TEXT,
    "questionTitle" TEXT NOT NULL,
    "expectedAnswer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormQuestionMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'RECEIVED',
    "assignedTo" TEXT,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusChangedBy" TEXT,
    "note" TEXT,
    "ambiguityResult" JSONB,
    "clarificationResolvedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "paymentConfirmedBy" TEXT,
    "accommodationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceQuote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "pricingPolicyVersion" TEXT NOT NULL,
    "inputsSnapshot" JSONB NOT NULL,
    "weightsSnapshot" JSONB NOT NULL,
    "computedAmountKrw" INTEGER NOT NULL,
    "roundedAmountKrw" INTEGER NOT NULL,
    "changeReason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "PublicProperty" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformPropertyKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "countryKey" TEXT,
    "cityKey" TEXT,
    "addressRegion" TEXT,
    "addressLocality" TEXT,
    "ratingValue" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastObservedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicAvailabilitySnapshot" (
    "id" TEXT NOT NULL,
    "publicPropertyId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "windowEndAt" TIMESTAMP(3) NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "availableCount" INTEGER NOT NULL,
    "unavailableCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "avgPriceAmount" INTEGER,
    "minPriceAmount" INTEGER,
    "maxPriceAmount" INTEGER,
    "currency" TEXT,
    "openRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicAvailabilitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicAvailabilityPrediction" (
    "id" TEXT NOT NULL,
    "publicPropertyId" TEXT NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextLikelyAvailableAt" TIMESTAMP(3),
    "confidence" "PredictionConfidence" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "windowDays" INTEGER NOT NULL DEFAULT 28,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicAvailabilityPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelEntity" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelEntity_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "_PlanToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlanToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Accommodation_userId_idx" ON "Accommodation"("userId");

-- CreateIndex
CREATE INDEX "Accommodation_isActive_idx" ON "Accommodation"("isActive");

-- CreateIndex
CREATE INDEX "CheckCycle_startedAt_idx" ON "CheckCycle"("startedAt");

-- CreateIndex
CREATE INDEX "CheckCycle_concurrency_browserPoolSize_idx" ON "CheckCycle"("concurrency", "browserPoolSize");

-- CreateIndex
CREATE INDEX "CheckLog_accommodationId_idx" ON "CheckLog"("accommodationId");

-- CreateIndex
CREATE INDEX "CheckLog_createdAt_idx" ON "CheckLog"("createdAt");

-- CreateIndex
CREATE INDEX "CheckLog_cycleId_idx" ON "CheckLog"("cycleId");

-- CreateIndex
CREATE INDEX "CheckLog_accommodationId_checkIn_checkOut_idx" ON "CheckLog"("accommodationId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "HeartbeatHistory_timestamp_idx" ON "HeartbeatHistory"("timestamp");

-- CreateIndex
CREATE INDEX "HeartbeatHistory_workerId_idx" ON "HeartbeatHistory"("workerId");

-- CreateIndex
CREATE INDEX "SettingsChangeLog_settingKey_idx" ON "SettingsChangeLog"("settingKey");

-- CreateIndex
CREATE INDEX "SettingsChangeLog_createdAt_idx" ON "SettingsChangeLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "SystemSettings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlanQuota_planId_key_key" ON "PlanQuota"("planId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "PlatformSelector_platform_category_isActive_idx" ON "PlatformSelector"("platform", "category", "isActive");

-- CreateIndex
CREATE INDEX "PlatformSelector_platform_isActive_priority_idx" ON "PlatformSelector"("platform", "isActive", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSelector_platform_category_name_key" ON "PlatformSelector"("platform", "category", "name");

-- CreateIndex
CREATE INDEX "PlatformPattern_platform_patternType_isActive_idx" ON "PlatformPattern"("platform", "patternType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPattern_platform_patternType_pattern_key" ON "PlatformPattern"("platform", "patternType", "pattern");

-- CreateIndex
CREATE INDEX "SelectorChangeLog_entityType_entityId_idx" ON "SelectorChangeLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SelectorChangeLog_changedById_idx" ON "SelectorChangeLog"("changedById");

-- CreateIndex
CREATE INDEX "SelectorChangeLog_createdAt_idx" ON "SelectorChangeLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_responseId_key" ON "FormSubmission"("responseId");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_receivedAt_idx" ON "FormSubmission"("receivedAt");

-- CreateIndex
CREATE INDEX "FormQuestionMapping_formKey_isActive_idx" ON "FormQuestionMapping"("formKey", "isActive");

-- CreateIndex
CREATE INDEX "FormQuestionMapping_isActive_idx" ON "FormQuestionMapping"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestionMapping_formKey_field_key" ON "FormQuestionMapping"("formKey", "field");

-- CreateIndex
CREATE UNIQUE INDEX "Case_submissionId_key" ON "Case"("submissionId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");

-- CreateIndex
CREATE INDEX "PriceQuote_caseId_idx" ON "PriceQuote"("caseId");

-- CreateIndex
CREATE INDEX "PriceQuote_caseId_isActive_idx" ON "PriceQuote"("caseId", "isActive");

-- CreateIndex
CREATE INDEX "CaseStatusLog_caseId_idx" ON "CaseStatusLog"("caseId");

-- CreateIndex
CREATE INDEX "CaseStatusLog_createdAt_idx" ON "CaseStatusLog"("createdAt");

-- CreateIndex
CREATE INDEX "ConditionMetEvent_caseId_idx" ON "ConditionMetEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionMetEvent_caseId_checkLogId_key" ON "ConditionMetEvent"("caseId", "checkLogId");

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

-- CreateIndex
CREATE INDEX "LandingEvent_occurredAt_idx" ON "LandingEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "LandingEvent_eventName_occurredAt_idx" ON "LandingEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "LandingEvent_sessionId_idx" ON "LandingEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PublicProperty_countryKey_cityKey_idx" ON "PublicProperty"("countryKey", "cityKey");

-- CreateIndex
CREATE INDEX "PublicProperty_isActive_idx" ON "PublicProperty"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProperty_platform_platformPropertyKey_key" ON "PublicProperty"("platform", "platformPropertyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProperty_platform_slug_key" ON "PublicProperty"("platform", "slug");

-- CreateIndex
CREATE INDEX "PublicAvailabilitySnapshot_snapshotDate_idx" ON "PublicAvailabilitySnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "PublicAvailabilitySnapshot_openRate_idx" ON "PublicAvailabilitySnapshot"("openRate");

-- CreateIndex
CREATE UNIQUE INDEX "PublicAvailabilitySnapshot_publicPropertyId_snapshotDate_key" ON "PublicAvailabilitySnapshot"("publicPropertyId", "snapshotDate");

-- CreateIndex
CREATE INDEX "PublicAvailabilityPrediction_publicPropertyId_predictedAt_idx" ON "PublicAvailabilityPrediction"("publicPropertyId", "predictedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicAvailabilityPrediction_publicPropertyId_predictedAt_key" ON "PublicAvailabilityPrediction"("publicPropertyId", "predictedAt");

-- CreateIndex
CREATE INDEX "TravelConversation_sessionId_idx" ON "TravelConversation"("sessionId");

-- CreateIndex
CREATE INDEX "TravelConversation_userId_idx" ON "TravelConversation"("userId");

-- CreateIndex
CREATE INDEX "TravelMessage_conversationId_idx" ON "TravelMessage"("conversationId");

-- CreateIndex
CREATE INDEX "TravelMessage_createdAt_idx" ON "TravelMessage"("createdAt");

-- CreateIndex
CREATE INDEX "TravelEntity_conversationId_idx" ON "TravelEntity"("conversationId");

-- CreateIndex
CREATE INDEX "CaseMessage_caseId_idx" ON "CaseMessage"("caseId");

-- CreateIndex
CREATE INDEX "CaseMessage_sentById_idx" ON "CaseMessage"("sentById");

-- CreateIndex
CREATE INDEX "CaseMessage_createdAt_idx" ON "CaseMessage"("createdAt");

-- CreateIndex
CREATE INDEX "_PlanToRole_B_index" ON "_PlanToRole"("B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accommodation" ADD CONSTRAINT "Accommodation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLog" ADD CONSTRAINT "CheckLog_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLog" ADD CONSTRAINT "CheckLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLog" ADD CONSTRAINT "CheckLog_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CheckCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeartbeatHistory" ADD CONSTRAINT "HeartbeatHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerHeartbeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsChangeLog" ADD CONSTRAINT "SettingsChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanQuota" ADD CONSTRAINT "PlanQuota_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSelector" ADD CONSTRAINT "PlatformSelector_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSelector" ADD CONSTRAINT "PlatformSelector_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPattern" ADD CONSTRAINT "PlatformPattern_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectorChangeLog" ADD CONSTRAINT "SelectorChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStatusLog" ADD CONSTRAINT "CaseStatusLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionMetEvent" ADD CONSTRAINT "ConditionMetEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionMetEvent" ADD CONSTRAINT "ConditionMetEvent_checkLogId_fkey" FOREIGN KEY ("checkLogId") REFERENCES "CheckLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNotification" ADD CONSTRAINT "CaseNotification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_conditionMetEventId_fkey" FOREIGN KEY ("conditionMetEventId") REFERENCES "ConditionMetEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicAvailabilitySnapshot" ADD CONSTRAINT "PublicAvailabilitySnapshot_publicPropertyId_fkey" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicAvailabilityPrediction" ADD CONSTRAINT "PublicAvailabilityPrediction_publicPropertyId_fkey" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelConversation" ADD CONSTRAINT "TravelConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelMessage" ADD CONSTRAINT "TravelMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelEntity" ADD CONSTRAINT "TravelEntity_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanToRole" ADD CONSTRAINT "_PlanToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanToRole" ADD CONSTRAINT "_PlanToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

