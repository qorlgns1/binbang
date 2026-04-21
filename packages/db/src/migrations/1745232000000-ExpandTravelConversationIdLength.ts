import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandTravelConversationIdLength1745232000000 implements MigrationInterface {
  name = 'ExpandTravelConversationIdLength1745232000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "TravelConversation" MODIFY ("id" VARCHAR2(36))`);
    await queryRunner.query(`ALTER TABLE "TravelMessage" MODIFY ("conversationId" VARCHAR2(36))`);
    await queryRunner.query(`ALTER TABLE "TravelEntity" MODIFY ("conversationId" VARCHAR2(36))`);
    await queryRunner.query(`ALTER TABLE "conversation_preferences" MODIFY ("conversationId" VARCHAR2(36))`);
    await queryRunner.query(`ALTER TABLE "affiliate_events" MODIFY ("conversationId" VARCHAR2(36))`);
    await queryRunner.query(`
      BEGIN
        EXECUTE IMMEDIATE 'DROP INDEX "IDX_apal_conv_changedAt"';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -1418 THEN
            RAISE;
          END IF;
      END;
    `);
    await queryRunner.query(`ALTER TABLE "affiliate_preference_audit_logs" MODIFY ("conversationId" VARCHAR2(36))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_apal_conv_changedAt" ON "affiliate_preference_audit_logs"("conversationId", "changedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_apal_conv_changedAt"`);
    await queryRunner.query(`ALTER TABLE "affiliate_preference_audit_logs" MODIFY ("conversationId" VARCHAR2(30))`);
    await queryRunner.query(`ALTER TABLE "affiliate_events" MODIFY ("conversationId" VARCHAR2(30))`);
    await queryRunner.query(`ALTER TABLE "conversation_preferences" MODIFY ("conversationId" VARCHAR2(30))`);
    await queryRunner.query(`ALTER TABLE "TravelEntity" MODIFY ("conversationId" VARCHAR2(30))`);
    await queryRunner.query(`ALTER TABLE "TravelMessage" MODIFY ("conversationId" VARCHAR2(30))`);
    await queryRunner.query(`ALTER TABLE "TravelConversation" MODIFY ("id" VARCHAR2(30))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_apal_conv_changedAt" ON "affiliate_preference_audit_logs"("conversationId", "changedAt")`,
    );
  }
}
