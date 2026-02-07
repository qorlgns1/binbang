-- CreateEnum
CREATE TYPE "QuotaKey" AS ENUM ('MAX_ACCOMMODATIONS', 'CHECK_INTERVAL_MIN');

-- Drop old Role enum first (before creating Role table)
-- Step 1: Save role data temporarily (cast to TEXT to avoid enum dependency)
CREATE TEMP TABLE "_temp_user_roles" AS SELECT "id", "role"::TEXT AS "role" FROM "User";

-- Step 2: Drop the old role column and enum
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";

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

-- CreateTable (implicit M:N join tables)
CREATE TABLE "_PlanToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlanToRole_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE UNIQUE INDEX "PlanQuota_planId_key_key" ON "PlanQuota"("planId", "key");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "_PlanToRole_B_index" ON "_PlanToRole"("B");
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey (PlanQuota -> Plan)
ALTER TABLE "PlanQuota" ADD CONSTRAINT "PlanQuota_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (AuditLog -> User)
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (join tables)
ALTER TABLE "_PlanToRole" ADD CONSTRAINT "_PlanToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PlanToRole" ADD CONSTRAINT "_PlanToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable User: add new RBAC columns (before dropping role)
ALTER TABLE "User" ADD COLUMN "planId" TEXT;

-- AddForeignKey (User -> Plan)
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed Role records
INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
  ('role_user', 'USER', '기본 사용자', NOW(), NOW()),
  ('role_admin', 'ADMIN', '관리자', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Seed Plan records
INSERT INTO "Plan" ("id", "name", "description", "price", "interval", "createdAt", "updatedAt")
VALUES
  ('plan_free', 'FREE', '무료 플랜', 0, 'month', NOW(), NOW()),
  ('plan_pro', 'PRO', '프로 플랜', 9900, 'month', NOW(), NOW()),
  ('plan_biz', 'BIZ', '비즈니스 플랜', 29900, 'month', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Seed PlanQuota records
INSERT INTO "PlanQuota" ("id", "planId", "key", "value")
VALUES
  ('pq_free_max', 'plan_free', 'MAX_ACCOMMODATIONS', 5),
  ('pq_free_int', 'plan_free', 'CHECK_INTERVAL_MIN', 30),
  ('pq_pro_max', 'plan_pro', 'MAX_ACCOMMODATIONS', 20),
  ('pq_pro_int', 'plan_pro', 'CHECK_INTERVAL_MIN', 10),
  ('pq_biz_max', 'plan_biz', 'MAX_ACCOMMODATIONS', 100),
  ('pq_biz_int', 'plan_biz', 'CHECK_INTERVAL_MIN', 5)
ON CONFLICT ("planId", "key") DO NOTHING;

-- Seed Permission records
INSERT INTO "Permission" ("id", "action", "description", "createdAt")
VALUES
  ('perm_admin_access', 'admin:access', '관리자 페이지 접근', NOW()),
  ('perm_users_manage', 'users:manage', '사용자 관리', NOW()),
  ('perm_worker_restart', 'worker:restart', '워커 재시작', NOW()),
  ('perm_settings_manage', 'settings:manage', '시스템 설정 관리', NOW()),
  ('perm_acc_create', 'accommodation:create', '숙소 등록', NOW()),
  ('perm_acc_read', 'accommodation:read', '숙소 조회', NOW())
ON CONFLICT ("action") DO NOTHING;

-- Link Permissions to Roles (ADMIN)
INSERT INTO "_PermissionToRole" ("A", "B")
VALUES
  ('perm_admin_access', 'role_admin'),
  ('perm_users_manage', 'role_admin'),
  ('perm_worker_restart', 'role_admin'),
  ('perm_settings_manage', 'role_admin'),
  ('perm_acc_create', 'role_admin'),
  ('perm_acc_read', 'role_admin')
ON CONFLICT DO NOTHING;

-- Link Permissions to Roles (USER)
INSERT INTO "_PermissionToRole" ("A", "B")
VALUES
  ('perm_acc_create', 'role_user'),
  ('perm_acc_read', 'role_user')
ON CONFLICT DO NOTHING;

-- Link Plans to Roles (all plans get USER role)
INSERT INTO "_PlanToRole" ("A", "B")
VALUES
  ('plan_free', 'role_user'),
  ('plan_pro', 'role_user'),
  ('plan_biz', 'role_user')
ON CONFLICT DO NOTHING;

-- Data migration: map existing User.role enum to _RoleToUser join table
-- All users get USER role
INSERT INTO "_RoleToUser" ("A", "B")
SELECT 'role_user', "id" FROM "User"
ON CONFLICT DO NOTHING;

-- ADMIN users also get ADMIN role (using temp table)
INSERT INTO "_RoleToUser" ("A", "B")
SELECT 'role_admin', t."id" FROM "_temp_user_roles" t WHERE t."role" = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Drop temp table
DROP TABLE "_temp_user_roles";

-- Set all existing users to FREE plan
UPDATE "User" SET "planId" = 'plan_free' WHERE "planId" IS NULL;
