import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agoda shared catalog는 환경 스키마 migration이 아니라 전용 SQL로 관리한다.
 * 이 migration은 기존 버전 호환성을 위해 남겨두되, 신규 환경에서는 no-op이다.
 */
export class OracleTextIndexes1744000000001 implements MigrationInterface {
  name = 'OracleTextIndexes1744000000001';

  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
