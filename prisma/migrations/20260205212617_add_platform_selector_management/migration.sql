-- CreateEnum
CREATE TYPE "SelectorCategory" AS ENUM ('PRICE', 'AVAILABILITY', 'METADATA', 'PLATFORM_ID');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

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

-- AddForeignKey
ALTER TABLE "PlatformSelector" ADD CONSTRAINT "PlatformSelector_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSelector" ADD CONSTRAINT "PlatformSelector_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPattern" ADD CONSTRAINT "PlatformPattern_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectorChangeLog" ADD CONSTRAINT "SelectorChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
