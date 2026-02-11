-- AlterTable
ALTER TABLE "FormSubmission" ADD COLUMN     "consentBillingOnConditionMet" BOOLEAN,
ADD COLUMN     "consentCapturedAt" TIMESTAMP(3),
ADD COLUMN     "consentServiceScope" BOOLEAN,
ADD COLUMN     "consentTexts" JSONB;
