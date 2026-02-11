-- AlterEnum
ALTER TYPE "CaseStatus" ADD VALUE 'NEEDS_CLARIFICATION';

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "ambiguityResult" JSONB,
ADD COLUMN     "clarificationResolvedAt" TIMESTAMP(3);
