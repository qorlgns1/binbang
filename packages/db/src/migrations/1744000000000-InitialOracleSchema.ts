import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialOracleSchema1744000000000 implements MigrationInterface {
  name = 'InitialOracleSchema1744000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Plan ──
    await queryRunner.query(`
      CREATE TABLE "Plan" (
        "id"          VARCHAR2(30)    NOT NULL,
        "name"        VARCHAR2(50)    NOT NULL,
        "description" VARCHAR2(500),
        "price"       NUMBER          DEFAULT 0 NOT NULL,
        "interval"    VARCHAR2(20)    DEFAULT 'month' NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Plan" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Plan_name" UNIQUE ("name")
      )
    `);

    // ── Role ──
    await queryRunner.query(`
      CREATE TABLE "Role" (
        "id"          VARCHAR2(30) NOT NULL,
        "name"        VARCHAR2(50) NOT NULL,
        "description" VARCHAR2(500),
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Role" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Role_name" UNIQUE ("name")
      )
    `);

    // ── Permission ──
    await queryRunner.query(`
      CREATE TABLE "Permission" (
        "id"          VARCHAR2(30) NOT NULL,
        "action"      VARCHAR2(100) NOT NULL,
        "description" VARCHAR2(500),
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Permission_action" UNIQUE ("action")
      )
    `);

    // ── Join: RolePermission ──
    await queryRunner.query(`
      CREATE TABLE "RolePermission" (
        "roleId"       VARCHAR2(30) NOT NULL,
        "permissionId" VARCHAR2(30) NOT NULL,
        CONSTRAINT "PK_RolePermission" PRIMARY KEY ("roleId", "permissionId"),
        CONSTRAINT "FK_RolePermission_role" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_RolePermission_permission" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE
      )
    `);

    // ── PlanRole ──
    await queryRunner.query(`
      CREATE TABLE "PlanRole" (
        "planId" VARCHAR2(30) NOT NULL,
        "roleId" VARCHAR2(30) NOT NULL,
        CONSTRAINT "PK_PlanRole" PRIMARY KEY ("planId", "roleId"),
        CONSTRAINT "FK_PlanRole_plan" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_PlanRole_role" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
      )
    `);

    // ── User ──
    await queryRunner.query(`
      CREATE TABLE "User" (
        "id"                        VARCHAR2(30)  NOT NULL,
        "name"                      VARCHAR2(255),
        "email"                     VARCHAR2(255),
        "emailVerified"             TIMESTAMP WITH TIME ZONE,
        "image"                     VARCHAR2(500),
        "password"                  VARCHAR2(255),
        "kakaoAccessToken"          CLOB,
        "kakaoRefreshToken"         CLOB,
        "kakaoTokenExpiry"          TIMESTAMP WITH TIME ZONE,
        "planId"                    VARCHAR2(30),
        "timezone"                  VARCHAR2(100),
        "affiliateLinksEnabled"     NUMBER(1) DEFAULT 1 NOT NULL,
        "tutorialCompletedAt"       TIMESTAMP WITH TIME ZONE,
        "tutorialDismissedAt"       TIMESTAMP WITH TIME ZONE,
        "createdAt"                 TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"                 TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_User" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_User_email" UNIQUE ("email"),
        CONSTRAINT "FK_User_plan" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL
      )
    `);

    // ── UserRole ──
    await queryRunner.query(`
      CREATE TABLE "UserRole" (
        "userId" VARCHAR2(30) NOT NULL,
        "roleId" VARCHAR2(30) NOT NULL,
        CONSTRAINT "PK_UserRole" PRIMARY KEY ("userId", "roleId"),
        CONSTRAINT "FK_UserRole_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_UserRole_role" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
      )
    `);

    // ── Account ──
    await queryRunner.query(`
      CREATE TABLE "Account" (
        "id"                       VARCHAR2(30)  NOT NULL,
        "userId"                   VARCHAR2(30)  NOT NULL,
        "type"                     VARCHAR2(100) NOT NULL,
        "provider"                 VARCHAR2(100) NOT NULL,
        "providerAccountId"        VARCHAR2(255) NOT NULL,
        "refresh_token"            CLOB,
        "access_token"             CLOB,
        "expires_at"               NUMBER,
        "token_type"               VARCHAR2(100),
        "scope"                    VARCHAR2(255),
        "id_token"                 CLOB,
        "session_state"            VARCHAR2(255),
        "refresh_token_expires_in" NUMBER,
        CONSTRAINT "PK_Account" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Account_provider" UNIQUE ("provider", "providerAccountId"),
        CONSTRAINT "FK_Account_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);

    // ── Session ──
    await queryRunner.query(`
      CREATE TABLE "Session" (
        "id"           VARCHAR2(30)  NOT NULL,
        "sessionToken" VARCHAR2(255) NOT NULL,
        "userId"       VARCHAR2(30)  NOT NULL,
        "expires"      TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_Session" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Session_token" UNIQUE ("sessionToken"),
        CONSTRAINT "FK_Session_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);

    // ── VerificationToken ──
    await queryRunner.query(`
      CREATE TABLE "VerificationToken" (
        "identifier" VARCHAR2(255) NOT NULL,
        "token"      VARCHAR2(255) NOT NULL,
        "expires"    TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_VerificationToken" PRIMARY KEY ("identifier"),
        CONSTRAINT "UQ_VerificationToken_token" UNIQUE ("token"),
        CONSTRAINT "UQ_VerificationToken_ident_token" UNIQUE ("identifier", "token")
      )
    `);

    // ── PlanQuota ──
    await queryRunner.query(`
      CREATE TABLE "PlanQuota" (
        "id"     VARCHAR2(30) NOT NULL,
        "planId" VARCHAR2(30) NOT NULL,
        "key"    VARCHAR2(30) NOT NULL,
        "value"  NUMBER       NOT NULL,
        CONSTRAINT "PK_PlanQuota" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PlanQuota_planId_key" UNIQUE ("planId", "key"),
        CONSTRAINT "FK_PlanQuota_plan" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE
      )
    `);

    // ── AuditLog ──
    await queryRunner.query(`
      CREATE TABLE "AuditLog" (
        "id"         VARCHAR2(30)  NOT NULL,
        "actorId"    VARCHAR2(30),
        "targetId"   VARCHAR2(30)  NOT NULL,
        "entityType" VARCHAR2(100) NOT NULL,
        "action"     VARCHAR2(100) NOT NULL,
        "oldValue"   CLOB,
        "newValue"   CLOB,
        "ipAddress"  VARCHAR2(50),
        "createdAt"  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_AuditLog" PRIMARY KEY ("id"),
        CONSTRAINT "FK_AuditLog_actor" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_AuditLog_target" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_AuditLog_actorId" ON "AuditLog"("actorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_AuditLog_targetId" ON "AuditLog"("targetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_AuditLog_createdAt" ON "AuditLog"("createdAt")`);

    // ── Subscription ──
    await queryRunner.query(`
      CREATE TABLE "Subscription" (
        "id"                     VARCHAR2(30) NOT NULL,
        "userId"                 VARCHAR2(30) NOT NULL,
        "planId"                 VARCHAR2(30) NOT NULL,
        "status"                 VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
        "currentPeriodStart"     TIMESTAMP WITH TIME ZONE NOT NULL,
        "currentPeriodEnd"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "canceledAt"             TIMESTAMP WITH TIME ZONE,
        "cancelReason"           VARCHAR2(500),
        "paymentProvider"        VARCHAR2(50),
        "externalSubscriptionId" VARCHAR2(255),
        "createdAt"              TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"              TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Subscription" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Subscription_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_Subscription_plan" FOREIGN KEY ("planId") REFERENCES "Plan"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_Subscription_userId" ON "Subscription"("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_Subscription_status" ON "Subscription"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_Subscription_periodEnd" ON "Subscription"("currentPeriodEnd")`);

    // ── SystemSettings ──
    await queryRunner.query(`
      CREATE TABLE "SystemSettings" (
        "key"         VARCHAR2(100)  NOT NULL,
        "value"       VARCHAR2(2000) NOT NULL,
        "type"        VARCHAR2(20)   DEFAULT 'string' NOT NULL,
        "category"    VARCHAR2(50)   NOT NULL,
        "description" VARCHAR2(500),
        "minValue"    VARCHAR2(50),
        "maxValue"    VARCHAR2(50),
        "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_SystemSettings" PRIMARY KEY ("key")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_SystemSettings_category" ON "SystemSettings"("category")`);

    // ── SettingsChangeLog ──
    await queryRunner.query(`
      CREATE TABLE "SettingsChangeLog" (
        "id"          VARCHAR2(30)   NOT NULL,
        "settingKey"  VARCHAR2(100)  NOT NULL,
        "oldValue"    VARCHAR2(2000) NOT NULL,
        "newValue"    VARCHAR2(2000) NOT NULL,
        "changedById" VARCHAR2(30)   NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_SettingsChangeLog" PRIMARY KEY ("id"),
        CONSTRAINT "FK_SettingsChangeLog_user" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_SettingsChangeLog_key" ON "SettingsChangeLog"("settingKey")`);
    await queryRunner.query(`CREATE INDEX "IDX_SettingsChangeLog_createdAt" ON "SettingsChangeLog"("createdAt")`);

    // ── PlatformSelector ──
    await queryRunner.query(`
      CREATE TABLE "PlatformSelector" (
        "id"            VARCHAR2(30) NOT NULL,
        "platform"      VARCHAR2(10) NOT NULL,
        "category"      VARCHAR2(20) NOT NULL,
        "name"          VARCHAR2(255) NOT NULL,
        "selector"      CLOB NOT NULL,
        "extractorCode" CLOB,
        "priority"      NUMBER DEFAULT 0 NOT NULL,
        "isActive"      NUMBER(1) DEFAULT 1 NOT NULL,
        "description"   VARCHAR2(500),
        "createdById"   VARCHAR2(30),
        "updatedById"   VARCHAR2(30),
        "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_PlatformSelector" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PlatformSelector_pcs" UNIQUE ("platform", "category", "name"),
        CONSTRAINT "FK_PlatformSelector_createdBy" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_PlatformSelector_updatedBy" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_PlatformSelector_pci" ON "PlatformSelector"("platform", "category", "isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PlatformSelector_pip" ON "PlatformSelector"("platform", "isActive", "priority")`,
    );

    // ── PlatformPattern ──
    await queryRunner.query(`
      CREATE TABLE "PlatformPattern" (
        "id"          VARCHAR2(30)  NOT NULL,
        "platform"    VARCHAR2(10)  NOT NULL,
        "patternType" VARCHAR2(20)  NOT NULL,
        "pattern"     VARCHAR2(500) NOT NULL,
        "locale"      VARCHAR2(10)  DEFAULT 'ko' NOT NULL,
        "isActive"    NUMBER(1) DEFAULT 1 NOT NULL,
        "priority"    NUMBER DEFAULT 0 NOT NULL,
        "createdById" VARCHAR2(30),
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_PlatformPattern" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PlatformPattern_ppp" UNIQUE ("platform", "patternType", "pattern"),
        CONSTRAINT "FK_PlatformPattern_createdBy" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_PlatformPattern_pti" ON "PlatformPattern"("platform", "patternType", "isActive")`,
    );

    // ── SelectorChangeLog ──
    await queryRunner.query(`
      CREATE TABLE "SelectorChangeLog" (
        "id"          VARCHAR2(30)  NOT NULL,
        "entityType"  VARCHAR2(50)  NOT NULL,
        "entityId"    VARCHAR2(30)  NOT NULL,
        "action"      VARCHAR2(20)  NOT NULL,
        "field"       VARCHAR2(100),
        "oldValue"    CLOB,
        "newValue"    CLOB,
        "changedById" VARCHAR2(30)  NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_SelectorChangeLog" PRIMARY KEY ("id"),
        CONSTRAINT "FK_SelectorChangeLog_user" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_SelectorChangeLog_entity" ON "SelectorChangeLog"("entityType", "entityId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_SelectorChangeLog_changedById" ON "SelectorChangeLog"("changedById")`);
    await queryRunner.query(`CREATE INDEX "IDX_SelectorChangeLog_createdAt" ON "SelectorChangeLog"("createdAt")`);

    // ── Accommodation ──
    await queryRunner.query(`
      CREATE TABLE "Accommodation" (
        "id"                  VARCHAR2(30)  NOT NULL,
        "userId"              VARCHAR2(30)  NOT NULL,
        "name"                VARCHAR2(500) NOT NULL,
        "platform"            VARCHAR2(10)  NOT NULL,
        "url"                 CLOB,
        "checkIn"             TIMESTAMP WITH TIME ZONE NOT NULL,
        "checkOut"            TIMESTAMP WITH TIME ZONE NOT NULL,
        "adults"              NUMBER DEFAULT 2 NOT NULL,
        "rooms"               NUMBER DEFAULT 1 NOT NULL,
        "children"            NUMBER DEFAULT 0 NOT NULL,
        "currency"            VARCHAR2(10)  DEFAULT 'KRW' NOT NULL,
        "locale"              VARCHAR2(10)  DEFAULT 'ko' NOT NULL,
        "isActive"            NUMBER(1) DEFAULT 1 NOT NULL,
        "priceDropThreshold"  NUMBER(5,4),
        "lastPolledAt"        TIMESTAMP WITH TIME ZONE,
        "lastEventAt"         TIMESTAMP WITH TIME ZONE,
        "lastCheck"           TIMESTAMP WITH TIME ZONE,
        "lastStatus"          VARCHAR2(20)  DEFAULT 'UNKNOWN' NOT NULL,
        "lastPrice"           VARCHAR2(255),
        "lastPriceAmount"     NUMBER,
        "lastPriceCurrency"   VARCHAR2(10),
        "platformId"          VARCHAR2(255),
        "platformName"        VARCHAR2(500),
        "platformImage"       CLOB,
        "platformDescription" CLOB,
        "addressCountry"      VARCHAR2(100),
        "addressRegion"       VARCHAR2(100),
        "addressLocality"     VARCHAR2(100),
        "postalCode"          VARCHAR2(20),
        "streetAddress"       VARCHAR2(500),
        "ratingValue"         BINARY_DOUBLE,
        "reviewCount"         NUMBER,
        "latitude"            BINARY_DOUBLE,
        "longitude"           BINARY_DOUBLE,
        "platformMetadata"    CLOB,
        "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Accommodation" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Accommodation_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_Accommodation_userId" ON "Accommodation"("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_Accommodation_isActive" ON "Accommodation"("isActive")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_Accommodation_platform_isActive" ON "Accommodation"("platform", "isActive")`,
    );

    // ── WorkerHeartbeat ──
    await queryRunner.query(`
      CREATE TABLE "WorkerHeartbeat" (
        "id"                    VARCHAR2(30)  DEFAULT 'singleton' NOT NULL,
        "startedAt"             TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "lastHeartbeatAt"       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "isProcessing"          NUMBER(1) DEFAULT 0 NOT NULL,
        "schedule"              VARCHAR2(100) DEFAULT '*/30 * * * *' NOT NULL,
        "accommodationsChecked" NUMBER DEFAULT 0 NOT NULL,
        "lastCycleErrors"       NUMBER DEFAULT 0 NOT NULL,
        "lastCycleDurationMs"   NUMBER,
        "updatedAt"             TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_WorkerHeartbeat" PRIMARY KEY ("id")
      )
    `);

    // ── HeartbeatHistory ──
    await queryRunner.query(`
      CREATE TABLE "HeartbeatHistory" (
        "id"          NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
        "timestamp"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "status"      VARCHAR2(20) NOT NULL,
        "isProcessing" NUMBER(1) DEFAULT 0 NOT NULL,
        "uptime"      BINARY_DOUBLE,
        "workerId"    VARCHAR2(30) DEFAULT 'singleton' NOT NULL,
        CONSTRAINT "PK_HeartbeatHistory" PRIMARY KEY ("id"),
        CONSTRAINT "FK_HeartbeatHistory_worker" FOREIGN KEY ("workerId") REFERENCES "WorkerHeartbeat"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_HeartbeatHistory_timestamp" ON "HeartbeatHistory"("timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_HeartbeatHistory_workerId" ON "HeartbeatHistory"("workerId")`);

    // ── CheckCycle ──
    await queryRunner.query(`
      CREATE TABLE "CheckCycle" (
        "id"                  VARCHAR2(30) NOT NULL,
        "startedAt"           TIMESTAMP WITH TIME ZONE NOT NULL,
        "completedAt"         TIMESTAMP WITH TIME ZONE,
        "durationMs"          NUMBER,
        "totalCount"          NUMBER DEFAULT 0 NOT NULL,
        "successCount"        NUMBER DEFAULT 0 NOT NULL,
        "errorCount"          NUMBER DEFAULT 0 NOT NULL,
        "concurrency"         NUMBER NOT NULL,
        "browserPoolSize"     NUMBER NOT NULL,
        "navigationTimeoutMs" NUMBER NOT NULL,
        "contentWaitMs"       NUMBER NOT NULL,
        "maxRetries"          NUMBER NOT NULL,
        "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_CheckCycle" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_CheckCycle_startedAt" ON "CheckCycle"("startedAt")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_CheckCycle_conc_pool" ON "CheckCycle"("concurrency", "browserPoolSize")`,
    );

    // ── CheckLog ──
    await queryRunner.query(`
      CREATE TABLE "CheckLog" (
        "id"               VARCHAR2(30) NOT NULL,
        "accommodationId"  VARCHAR2(30) NOT NULL,
        "userId"           VARCHAR2(30) NOT NULL,
        "status"           VARCHAR2(20) NOT NULL,
        "price"            VARCHAR2(255),
        "priceAmount"      NUMBER,
        "priceCurrency"    VARCHAR2(10),
        "errorMessage"     CLOB,
        "notificationSent" NUMBER(1) DEFAULT 0 NOT NULL,
        "checkIn"          TIMESTAMP WITH TIME ZONE,
        "checkOut"         TIMESTAMP WITH TIME ZONE,
        "pricePerNight"    NUMBER,
        "cycleId"          VARCHAR2(30),
        "durationMs"       NUMBER,
        "retryCount"       NUMBER DEFAULT 0 NOT NULL,
        "previousStatus"   VARCHAR2(20),
        "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_CheckLog" PRIMARY KEY ("id"),
        CONSTRAINT "FK_CheckLog_accommodation" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_CheckLog_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_CheckLog_cycle" FOREIGN KEY ("cycleId") REFERENCES "CheckCycle"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_CheckLog_accommodationId" ON "CheckLog"("accommodationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_CheckLog_createdAt" ON "CheckLog"("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_CheckLog_cycleId" ON "CheckLog"("cycleId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_CheckLog_acc_dates" ON "CheckLog"("accommodationId", "checkIn", "checkOut")`,
    );

    // ── FormSubmission ──
    await queryRunner.query(`
      CREATE TABLE "FormSubmission" (
        "id"                          VARCHAR2(30)  NOT NULL,
        "responseId"                  VARCHAR2(255) NOT NULL,
        "status"                      VARCHAR2(30)  DEFAULT 'RECEIVED' NOT NULL,
        "rawPayload"                  CLOB          NOT NULL,
        "formVersion"                 VARCHAR2(50),
        "sourceIp"                    VARCHAR2(50),
        "extractedFields"             CLOB,
        "rejectionReason"             VARCHAR2(500),
        "consentBillingOnConditionMet" NUMBER(1),
        "consentServiceScope"         NUMBER(1),
        "consentCapturedAt"           TIMESTAMP WITH TIME ZONE,
        "consentTexts"                CLOB,
        "receivedAt"                  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "createdAt"                   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"                   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_FormSubmission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_FormSubmission_responseId" UNIQUE ("responseId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_FormSubmission_status" ON "FormSubmission"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_FormSubmission_receivedAt" ON "FormSubmission"("receivedAt")`);

    // ── FormQuestionMapping ──
    await queryRunner.query(`
      CREATE TABLE "FormQuestionMapping" (
        "id"             VARCHAR2(30)  NOT NULL,
        "formKey"        VARCHAR2(50)  DEFAULT '*' NOT NULL,
        "field"          VARCHAR2(30)  NOT NULL,
        "questionItemId" VARCHAR2(255),
        "questionTitle"  VARCHAR2(500) NOT NULL,
        "expectedAnswer" VARCHAR2(500),
        "isActive"       NUMBER(1) DEFAULT 1 NOT NULL,
        "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_FormQuestionMapping" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_FormQuestionMapping_fkf" UNIQUE ("formKey", "field")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_FormQuestionMapping_fki" ON "FormQuestionMapping"("formKey", "isActive")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_FormQuestionMapping_isActive" ON "FormQuestionMapping"("isActive")`);

    // ── Case ──
    await queryRunner.query(`
      CREATE TABLE "Case" (
        "id"                      VARCHAR2(30)  NOT NULL,
        "submissionId"            VARCHAR2(30)  NOT NULL,
        "status"                  VARCHAR2(30)  DEFAULT 'RECEIVED' NOT NULL,
        "assignedTo"              VARCHAR2(100),
        "statusChangedAt"         TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "statusChangedBy"         VARCHAR2(100),
        "note"                    CLOB,
        "ambiguityResult"         CLOB,
        "clarificationResolvedAt" TIMESTAMP WITH TIME ZONE,
        "paymentConfirmedAt"      TIMESTAMP WITH TIME ZONE,
        "paymentConfirmedBy"      VARCHAR2(100),
        "accommodationId"         VARCHAR2(30),
        "createdAt"               TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"               TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Case" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Case_submissionId" UNIQUE ("submissionId"),
        CONSTRAINT "FK_Case_submission" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id"),
        CONSTRAINT "FK_Case_accommodation" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_Case_status" ON "Case"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_Case_createdAt" ON "Case"("createdAt")`);

    // ── PriceQuote ──
    await queryRunner.query(`
      CREATE TABLE "PriceQuote" (
        "id"                   VARCHAR2(30) NOT NULL,
        "caseId"               VARCHAR2(30) NOT NULL,
        "pricingPolicyVersion" VARCHAR2(50) NOT NULL,
        "inputsSnapshot"       CLOB         NOT NULL,
        "weightsSnapshot"      CLOB         NOT NULL,
        "computedAmountKrw"    NUMBER       NOT NULL,
        "roundedAmountKrw"     NUMBER       NOT NULL,
        "changeReason"         CLOB         NOT NULL,
        "isActive"             NUMBER(1) DEFAULT 1 NOT NULL,
        "createdBy"            VARCHAR2(30) NOT NULL,
        "createdAt"            TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"            TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_PriceQuote" PRIMARY KEY ("id"),
        CONSTRAINT "FK_PriceQuote_case" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_PriceQuote_caseId" ON "PriceQuote"("caseId")`);
    await queryRunner.query(`CREATE INDEX "IDX_PriceQuote_caseId_isActive" ON "PriceQuote"("caseId", "isActive")`);

    // ── CaseStatusLog ──
    await queryRunner.query(`
      CREATE TABLE "CaseStatusLog" (
        "id"          VARCHAR2(30) NOT NULL,
        "caseId"      VARCHAR2(30) NOT NULL,
        "fromStatus"  VARCHAR2(30) NOT NULL,
        "toStatus"    VARCHAR2(30) NOT NULL,
        "changedById" VARCHAR2(30) NOT NULL,
        "reason"      VARCHAR2(500),
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_CaseStatusLog" PRIMARY KEY ("id"),
        CONSTRAINT "FK_CaseStatusLog_case" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_CaseStatusLog_caseId" ON "CaseStatusLog"("caseId")`);
    await queryRunner.query(`CREATE INDEX "IDX_CaseStatusLog_createdAt" ON "CaseStatusLog"("createdAt")`);

    // ── ConditionMetEvent ──
    await queryRunner.query(`
      CREATE TABLE "ConditionMetEvent" (
        "id"               VARCHAR2(30) NOT NULL,
        "caseId"           VARCHAR2(30) NOT NULL,
        "checkLogId"       VARCHAR2(30) NOT NULL,
        "evidenceSnapshot" CLOB         NOT NULL,
        "screenshotBase64" CLOB,
        "capturedAt"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_ConditionMetEvent" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ConditionMetEvent_case_log" UNIQUE ("caseId", "checkLogId"),
        CONSTRAINT "FK_ConditionMetEvent_case" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ConditionMetEvent_checkLog" FOREIGN KEY ("checkLogId") REFERENCES "CheckLog"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ConditionMetEvent_caseId" ON "ConditionMetEvent"("caseId")`);

    // ── BillingEvent ──
    await queryRunner.query(`
      CREATE TABLE "BillingEvent" (
        "id"                  VARCHAR2(30)  NOT NULL,
        "caseId"              VARCHAR2(30)  NOT NULL,
        "type"                VARCHAR2(30)  DEFAULT 'CONDITION_MET_FEE' NOT NULL,
        "conditionMetEventId" VARCHAR2(30)  NOT NULL,
        "amountKrw"           NUMBER        NOT NULL,
        "description"         VARCHAR2(500),
        "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_BillingEvent" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_BillingEvent_caseId" UNIQUE ("caseId"),
        CONSTRAINT "UQ_BillingEvent_conditionMetEventId" UNIQUE ("conditionMetEventId"),
        CONSTRAINT "FK_BillingEvent_case" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_BillingEvent_conditionMetEvent" FOREIGN KEY ("conditionMetEventId") REFERENCES "ConditionMetEvent"("id")
      )
    `);

    // ── CaseNotification ──
    await queryRunner.query(`
      CREATE TABLE "CaseNotification" (
        "id"             VARCHAR2(30)  NOT NULL,
        "caseId"         VARCHAR2(30)  NOT NULL,
        "channel"        VARCHAR2(20)  DEFAULT 'KAKAO' NOT NULL,
        "status"         VARCHAR2(20)  DEFAULT 'PENDING' NOT NULL,
        "payload"        CLOB          NOT NULL,
        "sentAt"         TIMESTAMP WITH TIME ZONE,
        "failReason"     CLOB,
        "retryCount"     NUMBER DEFAULT 0 NOT NULL,
        "maxRetries"     NUMBER DEFAULT 3 NOT NULL,
        "idempotencyKey" VARCHAR2(255) NOT NULL,
        "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_CaseNotification" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_CaseNotification_idempotency" UNIQUE ("idempotencyKey"),
        CONSTRAINT "FK_CaseNotification_case" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_CaseNotification_caseId" ON "CaseNotification"("caseId")`);
    await queryRunner.query(`CREATE INDEX "IDX_CaseNotification_status" ON "CaseNotification"("status")`);

    // ── CaseMessage ──
    await queryRunner.query(`
      CREATE TABLE "CaseMessage" (
        "id"          VARCHAR2(30)  NOT NULL,
        "caseId"      VARCHAR2(30)  NOT NULL,
        "templateKey" VARCHAR2(100) NOT NULL,
        "channel"     VARCHAR2(50)  NOT NULL,
        "content"     CLOB          NOT NULL,
        "sentById"    VARCHAR2(30)  NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_CaseMessage" PRIMARY KEY ("id"),
        CONSTRAINT "FK_CaseMessage_case" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_CaseMessage_user" FOREIGN KEY ("sentById") REFERENCES "User"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_CaseMessage_caseId" ON "CaseMessage"("caseId")`);
    await queryRunner.query(`CREATE INDEX "IDX_CaseMessage_sentById" ON "CaseMessage"("sentById")`);
    await queryRunner.query(`CREATE INDEX "IDX_CaseMessage_createdAt" ON "CaseMessage"("createdAt")`);

    // ── LandingEvent ──
    await queryRunner.query(`
      CREATE TABLE "LandingEvent" (
        "id"        VARCHAR2(30)   NOT NULL,
        "eventName" VARCHAR2(100)  NOT NULL,
        "source"    VARCHAR2(100),
        "sessionId" VARCHAR2(100),
        "locale"    VARCHAR2(10),
        "path"      VARCHAR2(500)  DEFAULT '/' NOT NULL,
        "referrer"  VARCHAR2(1000),
        "userAgent" CLOB,
        "ipAddress" VARCHAR2(50),
        "occurredAt" TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_LandingEvent" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_LandingEvent_occurredAt" ON "LandingEvent"("occurredAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_LandingEvent_eventName" ON "LandingEvent"("eventName", "occurredAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_LandingEvent_sessionId" ON "LandingEvent"("sessionId")`);

    // ── agoda_poll_runs ──
    await queryRunner.query(`
      CREATE TABLE "agoda_poll_runs" (
        "id"              NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
        "accommodationId" VARCHAR2(30) NOT NULL,
        "polledAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "httpStatus"      NUMBER,
        "latencyMs"       NUMBER,
        "status"          VARCHAR2(20) NOT NULL,
        "error"           CLOB,
        "createdAt"       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_agoda_poll_runs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agoda_poll_runs_acc" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_poll_runs_acc_polled" ON "agoda_poll_runs"("accommodationId", "polledAt")`,
    );

    // ── agoda_room_snapshots ──
    await queryRunner.query(`
      CREATE TABLE "agoda_room_snapshots" (
        "id"                   NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
        "pollRunId"            NUMBER        NOT NULL,
        "accommodationId"      VARCHAR2(30)  NOT NULL,
        "propertyId"           VARCHAR2(50)  NOT NULL,
        "roomId"               VARCHAR2(50)  NOT NULL,
        "ratePlanId"           VARCHAR2(50)  NOT NULL,
        "remainingRooms"       NUMBER,
        "freeCancellation"     NUMBER(1),
        "freeCancellationDate" TIMESTAMP WITH TIME ZONE,
        "totalInclusive"       NUMBER(12,2),
        "currency"             VARCHAR2(10),
        "payloadHash"          VARCHAR2(64)  NOT NULL,
        "raw"                  CLOB,
        "createdAt"            TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_agoda_room_snapshots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agoda_room_snapshots_run" FOREIGN KEY ("pollRunId") REFERENCES "agoda_poll_runs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_agoda_room_snapshots_acc" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_room_snapshots_acc" ON "agoda_room_snapshots"("accommodationId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_room_snapshots_prop" ON "agoda_room_snapshots"("propertyId", "roomId", "ratePlanId", "createdAt")`,
    );

    // ── agoda_alert_events ──
    await queryRunner.query(`
      CREATE TABLE "agoda_alert_events" (
        "id"              NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
        "accommodationId" VARCHAR2(30)  NOT NULL,
        "type"            VARCHAR2(30)  NOT NULL,
        "eventKey"        VARCHAR2(255) NOT NULL,
        "offerKey"        VARCHAR2(255),
        "status"          VARCHAR2(20)  DEFAULT 'detected' NOT NULL,
        "detectedAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "beforeHash"      VARCHAR2(64),
        "afterHash"       VARCHAR2(64),
        "meta"            CLOB,
        CONSTRAINT "PK_agoda_alert_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_agoda_alert_events_key" UNIQUE ("eventKey"),
        CONSTRAINT "FK_agoda_alert_events_acc" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_alert_events_acc_type" ON "agoda_alert_events"("accommodationId", "type", "detectedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_alert_events_offer" ON "agoda_alert_events"("accommodationId", "type", "offerKey", "detectedAt")`,
    );

    // ── agoda_notifications ──
    await queryRunner.query(`
      CREATE TABLE "agoda_notifications" (
        "id"              NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
        "accommodationId" VARCHAR2(30),
        "alertEventId"    NUMBER       NOT NULL,
        "channel"         VARCHAR2(20) NOT NULL,
        "status"          VARCHAR2(20) NOT NULL,
        "attempt"         NUMBER DEFAULT 0 NOT NULL,
        "lastError"       CLOB,
        "sentAt"          TIMESTAMP WITH TIME ZONE,
        "createdAt"       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_agoda_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agoda_notifications_acc" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_agoda_notifications_alert" FOREIGN KEY ("alertEventId") REFERENCES "agoda_alert_events"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_agoda_notifications_alert" ON "agoda_notifications"("alertEventId")`);
    await queryRunner.query(`CREATE INDEX "IDX_agoda_notifications_acc" ON "agoda_notifications"("accommodationId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_notifications_status" ON "agoda_notifications"("status", "createdAt")`,
    );

    // ── agoda_consent_logs ──
    await queryRunner.query(`
      CREATE TABLE "agoda_consent_logs" (
        "id"              NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
        "userId"          VARCHAR2(30),
        "accommodationId" VARCHAR2(30),
        "email"           VARCHAR2(255) NOT NULL,
        "type"            VARCHAR2(20)  NOT NULL,
        "ipAddress"       VARCHAR2(50),
        "userAgent"       CLOB,
        "createdAt"       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_agoda_consent_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agoda_consent_logs_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_agoda_consent_logs_acc" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_consent_logs_user" ON "agoda_consent_logs"("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_consent_logs_email" ON "agoda_consent_logs"("email", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agoda_consent_logs_acc" ON "agoda_consent_logs"("accommodationId", "createdAt")`,
    );

    // ── PublicProperty ──
    await queryRunner.query(`
      CREATE TABLE "PublicProperty" (
        "id"                  VARCHAR2(30)  NOT NULL,
        "platform"            VARCHAR2(10)  NOT NULL,
        "platformPropertyKey" VARCHAR2(255) NOT NULL,
        "slug"                VARCHAR2(255) NOT NULL,
        "name"                VARCHAR2(500) NOT NULL,
        "sourceUrl"           CLOB          NOT NULL,
        "imageUrl"            CLOB,
        "description"         CLOB,
        "countryKey"          VARCHAR2(100),
        "cityKey"             VARCHAR2(100),
        "addressRegion"       VARCHAR2(100),
        "addressLocality"     VARCHAR2(100),
        "ratingValue"         BINARY_DOUBLE,
        "reviewCount"         NUMBER,
        "latitude"            BINARY_DOUBLE,
        "longitude"           BINARY_DOUBLE,
        "lastObservedAt"      TIMESTAMP WITH TIME ZONE,
        "isActive"            NUMBER(1) DEFAULT 1 NOT NULL,
        "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_PublicProperty" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PublicProperty_platform_key" UNIQUE ("platform", "platformPropertyKey"),
        CONSTRAINT "UQ_PublicProperty_platform_slug" UNIQUE ("platform", "slug")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_PublicProperty_country_city" ON "PublicProperty"("countryKey", "cityKey")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_PublicProperty_isActive" ON "PublicProperty"("isActive")`);

    // ── PublicAvailabilitySnapshot ──
    await queryRunner.query(`
      CREATE TABLE "PublicAvailabilitySnapshot" (
        "id"               VARCHAR2(30) NOT NULL,
        "publicPropertyId" VARCHAR2(30) NOT NULL,
        "snapshotDate"     DATE NOT NULL,
        "windowStartAt"    TIMESTAMP WITH TIME ZONE NOT NULL,
        "windowEndAt"      TIMESTAMP WITH TIME ZONE NOT NULL,
        "sampleSize"       NUMBER        NOT NULL,
        "availableCount"   NUMBER        NOT NULL,
        "unavailableCount" NUMBER        NOT NULL,
        "errorCount"       NUMBER        NOT NULL,
        "avgPriceAmount"   NUMBER,
        "minPriceAmount"   NUMBER,
        "maxPriceAmount"   NUMBER,
        "currency"         VARCHAR2(10),
        "openRate"         BINARY_DOUBLE,
        "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_PublicAvailabilitySnapshot" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PublicAvailSnap_prop_date" UNIQUE ("publicPropertyId", "snapshotDate"),
        CONSTRAINT "FK_PublicAvailSnap_prop" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_PublicAvailSnap_date" ON "PublicAvailabilitySnapshot"("snapshotDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_PublicAvailSnap_openRate" ON "PublicAvailabilitySnapshot"("openRate")`);

    // ── PublicAvailabilityPrediction ──
    await queryRunner.query(`
      CREATE TABLE "PublicAvailabilityPrediction" (
        "id"                    VARCHAR2(30) NOT NULL,
        "publicPropertyId"      VARCHAR2(30) NOT NULL,
        "predictedAt"           TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
        "nextLikelyAvailableAt" TIMESTAMP WITH TIME ZONE,
        "confidence"            VARCHAR2(10) NOT NULL,
        "reasoning"             CLOB         NOT NULL,
        "windowDays"            NUMBER DEFAULT 28 NOT NULL,
        "algorithmVersion"      VARCHAR2(20) DEFAULT 'v1.0' NOT NULL,
        "createdAt"             TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"             TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_PublicAvailabilityPrediction" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PublicAvailPred_prop_at" UNIQUE ("publicPropertyId", "predictedAt"),
        CONSTRAINT "FK_PublicAvailPred_prop" FOREIGN KEY ("publicPropertyId") REFERENCES "PublicProperty"("id") ON DELETE CASCADE
      )
    `);

    // ── TravelConversation ──
    await queryRunner.query(`
      CREATE TABLE "TravelConversation" (
        "id"           VARCHAR2(30)  NOT NULL,
        "sessionId"    VARCHAR2(100) NOT NULL,
        "userId"       VARCHAR2(30),
        "title"        VARCHAR2(500),
        "messageCount" NUMBER DEFAULT 0 NOT NULL,
        "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_TravelConversation" PRIMARY KEY ("id"),
        CONSTRAINT "FK_TravelConversation_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_TravelConversation_sessionId" ON "TravelConversation"("sessionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_TravelConversation_userId" ON "TravelConversation"("userId")`);

    // ── TravelMessage ──
    await queryRunner.query(`
      CREATE TABLE "TravelMessage" (
        "id"             VARCHAR2(30) NOT NULL,
        "conversationId" VARCHAR2(30) NOT NULL,
        "role"           VARCHAR2(20) NOT NULL,
        "content"        CLOB         NOT NULL,
        "toolCalls"      CLOB,
        "toolResults"    CLOB,
        "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_TravelMessage" PRIMARY KEY ("id"),
        CONSTRAINT "FK_TravelMessage_conv" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_TravelMessage_convId" ON "TravelMessage"("conversationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_TravelMessage_createdAt" ON "TravelMessage"("createdAt")`);

    // ── TravelEntity ──
    await queryRunner.query(`
      CREATE TABLE "TravelEntity" (
        "id"             VARCHAR2(30)  NOT NULL,
        "conversationId" VARCHAR2(30)  NOT NULL,
        "type"           VARCHAR2(50)  NOT NULL,
        "name"           VARCHAR2(500) NOT NULL,
        "latitude"       BINARY_DOUBLE,
        "longitude"      BINARY_DOUBLE,
        "metadata"       CLOB          NOT NULL,
        "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_TravelEntity" PRIMARY KEY ("id"),
        CONSTRAINT "FK_TravelEntity_conv" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_TravelEntity_convId" ON "TravelEntity"("conversationId")`);

    // ── Destination ──
    await queryRunner.query(`
      CREATE TABLE "Destination" (
        "id"          VARCHAR2(30)  NOT NULL,
        "slug"        VARCHAR2(100) NOT NULL,
        "nameKo"      VARCHAR2(200) NOT NULL,
        "nameEn"      VARCHAR2(200) NOT NULL,
        "country"     VARCHAR2(100) NOT NULL,
        "countryCode" VARCHAR2(10)  NOT NULL,
        "description" CLOB          NOT NULL,
        "highlights"  CLOB          NOT NULL,
        "weather"     CLOB,
        "currency"    VARCHAR2(10),
        "latitude"    BINARY_DOUBLE NOT NULL,
        "longitude"   BINARY_DOUBLE NOT NULL,
        "imageUrl"    CLOB,
        "published"   NUMBER(1) DEFAULT 0 NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_Destination" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Destination_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_Destination_country" ON "Destination"("country")`);
    await queryRunner.query(`CREATE INDEX "IDX_Destination_published" ON "Destination"("published")`);

    // ── affiliate_advertisers ──
    await queryRunner.query(`
      CREATE TABLE "affiliate_advertisers" (
        "id"           VARCHAR2(30)  NOT NULL,
        "advertiserId" NUMBER        NOT NULL,
        "name"         VARCHAR2(255) NOT NULL,
        "category"     VARCHAR2(30)  DEFAULT 'other' NOT NULL,
        "notes"        CLOB,
        "source"       VARCHAR2(50)  DEFAULT 'awin' NOT NULL,
        "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_affiliate_advertisers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_affiliate_advertisers_id" UNIQUE ("advertiserId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_affiliate_advertisers_cat" ON "affiliate_advertisers"("category")`);

    // ── affiliate_events ──
    await queryRunner.query(`
      CREATE TABLE "affiliate_events" (
        "id"             VARCHAR2(30)  NOT NULL,
        "conversationId" VARCHAR2(30),
        "userId"         VARCHAR2(30),
        "userTimezone"   VARCHAR2(100),
        "provider"       VARCHAR2(100) NOT NULL,
        "eventType"      VARCHAR2(30)  NOT NULL,
        "reasonCode"     VARCHAR2(100),
        "idempotencyKey" VARCHAR2(255),
        "productId"      VARCHAR2(255) NOT NULL,
        "productName"    VARCHAR2(500) NOT NULL,
        "category"       VARCHAR2(30)  NOT NULL,
        "isCtaEnabled"   NUMBER(1) DEFAULT 0 NOT NULL,
        "occurredAt"     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_affiliate_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_affiliate_events_idempotency" UNIQUE ("idempotencyKey"),
        CONSTRAINT "FK_affiliate_events_conv" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_affiliate_events_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_affiliate_events_prov_type" ON "affiliate_events"("provider", "eventType")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_affiliate_events_type_reason" ON "affiliate_events"("eventType", "reasonCode")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_affiliate_events_cat_type" ON "affiliate_events"("category", "eventType")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_affiliate_events_occurredAt" ON "affiliate_events"("occurredAt")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_affiliate_events_conv_prod" ON "affiliate_events"("conversationId", "productId")`,
    );

    // ── conversation_preferences ──
    await queryRunner.query(`
      CREATE TABLE "conversation_preferences" (
        "id"               VARCHAR2(30) NOT NULL,
        "conversationId"   VARCHAR2(30) NOT NULL,
        "affiliateOverride" VARCHAR2(20) DEFAULT 'inherit' NOT NULL,
        "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_conversation_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conv_pref_convId" UNIQUE ("conversationId"),
        CONSTRAINT "FK_conv_pref_conv" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_conv_pref_override" ON "conversation_preferences"("affiliateOverride")`);

    // ── affiliate_preference_audit_logs ──
    await queryRunner.query(`
      CREATE TABLE "affiliate_preference_audit_logs" (
        "id"             VARCHAR2(30) NOT NULL,
        "conversationId" VARCHAR2(30) NOT NULL,
        "actorUserId"    VARCHAR2(30),
        "fromValue"      VARCHAR2(20) NOT NULL,
        "toValue"        VARCHAR2(20) NOT NULL,
        "changedAt"      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_affiliate_pref_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_apal_conv" FOREIGN KEY ("conversationId") REFERENCES "TravelConversation"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_apal_actor" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_apal_conv_changedAt" ON "affiliate_preference_audit_logs"("conversationId", "changedAt")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_apal_changedAt" ON "affiliate_preference_audit_logs"("changedAt")`);

    // ── affiliate_audit_job_states ──
    await queryRunner.query(`
      CREATE TABLE "affiliate_audit_job_states" (
        "jobName"          VARCHAR2(100) NOT NULL,
        "isFailing"        NUMBER(1) DEFAULT 0 NOT NULL,
        "failedAt"         TIMESTAMP WITH TIME ZONE,
        "recoveredAt"      TIMESTAMP WITH TIME ZONE,
        "retryCount"       NUMBER DEFAULT 0 NOT NULL,
        "lastErrorCode"    VARCHAR2(100),
        "lastErrorMessage" CLOB,
        "lastAlertCause"   VARCHAR2(50),
        "lastAlertSeverity" VARCHAR2(20),
        "lastAlertSentAt"  TIMESTAMP WITH TIME ZONE,
        "lastRunStartedAt" TIMESTAMP WITH TIME ZONE,
        "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_affiliate_audit_job_states" PRIMARY KEY ("jobName")
      )
    `);

    // ── affiliate_audit_purge_runs ──
    await queryRunner.query(`
      CREATE TABLE "affiliate_audit_purge_runs" (
        "id"            VARCHAR2(30) NOT NULL,
        "jobName"       VARCHAR2(100) NOT NULL,
        "runStartedAt"  TIMESTAMP WITH TIME ZONE NOT NULL,
        "runFinishedAt" TIMESTAMP WITH TIME ZONE,
        "status"        VARCHAR2(20) NOT NULL,
        "deletedCount"  NUMBER DEFAULT 0 NOT NULL,
        "retryCount"    NUMBER DEFAULT 0 NOT NULL,
        "errorCode"     VARCHAR2(100),
        "errorMessage"  CLOB,
        "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        CONSTRAINT "PK_affiliate_audit_purge_runs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_aapr_job_started" ON "affiliate_audit_purge_runs"("jobName", "runStartedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aapr_status_created" ON "affiliate_audit_purge_runs"("status", "createdAt")`,
    );

    // ── TypeORM migrations table ──
    // (자동 생성되므로 별도 생성 불필요)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순으로 DROP
    const tables = [
      '"affiliate_audit_purge_runs"',
      '"affiliate_audit_job_states"',
      '"affiliate_preference_audit_logs"',
      '"conversation_preferences"',
      '"affiliate_events"',
      '"affiliate_advertisers"',
      '"Destination"',
      '"TravelEntity"',
      '"TravelMessage"',
      '"TravelConversation"',
      '"PublicAvailabilityPrediction"',
      '"PublicAvailabilitySnapshot"',
      '"PublicProperty"',
      '"agoda_consent_logs"',
      '"agoda_notifications"',
      '"agoda_alert_events"',
      '"agoda_room_snapshots"',
      '"agoda_poll_runs"',
      '"LandingEvent"',
      '"CaseMessage"',
      '"CaseNotification"',
      '"BillingEvent"',
      '"ConditionMetEvent"',
      '"PriceQuote"',
      '"CaseStatusLog"',
      '"Case"',
      '"FormQuestionMapping"',
      '"FormSubmission"',
      '"CheckLog"',
      '"CheckCycle"',
      '"HeartbeatHistory"',
      '"WorkerHeartbeat"',
      '"Accommodation"',
      '"SelectorChangeLog"',
      '"PlatformPattern"',
      '"PlatformSelector"',
      '"SettingsChangeLog"',
      '"SystemSettings"',
      '"AuditLog"',
      '"Subscription"',
      '"PlanQuota"',
      '"VerificationToken"',
      '"Session"',
      '"Account"',
      '"UserRole"',
      '"User"',
      '"PlanRole"',
      '"RolePermission"',
      '"Permission"',
      '"Role"',
      '"Plan"',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE ${table}`);
    }
  }
}
