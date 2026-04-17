import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { User } from '../auth/user.entity.ts';

@Entity('SelectorChangeLog')
@Index(['entityType', 'entityId'])
@Index(['changedById'])
@Index(['createdAt'])
export class SelectorChangeLog extends CuidEntity {
  @Column({ type: 'varchar2', length: 50 })
  entityType!: string;

  @Column({ type: 'varchar2', length: 30 })
  entityId!: string;

  @Column({ type: 'varchar2', length: 20 })
  action!: string;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  field!: string | null;

  @Column({ type: 'clob', nullable: true })
  oldValue!: string | null;

  @Column({ type: 'clob', nullable: true })
  newValue!: string | null;

  @Column({ type: 'varchar2', length: 30 })
  changedById!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => User,
    (u) => u.selectorChangeLogs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'changedById' })
  changedBy!: User;
}
