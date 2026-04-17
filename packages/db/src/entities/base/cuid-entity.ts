import { createId } from '@paralleldrive/cuid2';
import { BeforeInsert, PrimaryColumn } from 'typeorm';

/**
 * Prisma의 @id @default(cuid()) 를 대체.
 * TypeORM 엔티티가 이 클래스를 extends 하면 자동으로 cuid2 PK를 생성한다.
 */
export abstract class CuidEntity {
  @PrimaryColumn({ type: 'varchar2', length: 30 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = createId();
    }
  }
}
