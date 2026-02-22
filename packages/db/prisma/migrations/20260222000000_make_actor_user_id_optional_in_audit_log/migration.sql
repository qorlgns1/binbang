-- AlterTable: 사용자 삭제 시 감사 로그 보존을 위해 actorUserId를 optional(nullable)로 변경
ALTER TABLE "affiliate_preference_audit_logs" ALTER COLUMN "actorUserId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "affiliate_preference_audit_logs" DROP CONSTRAINT "affiliate_preference_audit_logs_actorUserId_fkey";

-- AddForeignKey (SetNull: 사용자 삭제 시 actorUserId를 NULL로 설정)
ALTER TABLE "affiliate_preference_audit_logs" ADD CONSTRAINT "affiliate_preference_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
