-- CreateEnum
CREATE TYPE "FormQuestionField" AS ENUM (
    'CONTACT_CHANNEL',
    'CONTACT_VALUE',
    'TARGET_URL',
    'CONDITION_DEFINITION',
    'REQUEST_WINDOW',
    'CHECK_FREQUENCY',
    'BILLING_CONSENT',
    'SCOPE_CONSENT'
);

-- CreateTable
CREATE TABLE "FormQuestionMapping" (
    "id" TEXT NOT NULL,
    "formKey" TEXT NOT NULL DEFAULT '*',
    "field" "FormQuestionField" NOT NULL,
    "questionTitle" TEXT NOT NULL,
    "expectedAnswer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormQuestionMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestionMapping_formKey_field_key" ON "FormQuestionMapping"("formKey", "field");

-- CreateIndex
CREATE INDEX "FormQuestionMapping_formKey_isActive_idx" ON "FormQuestionMapping"("formKey", "isActive");

-- CreateIndex
CREATE INDEX "FormQuestionMapping_isActive_idx" ON "FormQuestionMapping"("isActive");
