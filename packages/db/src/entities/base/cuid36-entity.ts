import { createId } from '@paralleldrive/cuid2';
import { BeforeInsert, PrimaryColumn } from 'typeorm';

/**
 * cuid2 기본값을 유지하면서, legacy UUID(36자)도 저장할 수 있는 PK 베이스.
 */
export abstract class Cuid36Entity {
  @PrimaryColumn({ type: 'varchar2', length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = createId();
    }
  }
}
