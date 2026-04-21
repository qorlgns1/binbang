import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { CaseStatus } from '../../enums.ts';
import { Case } from './case.entity.ts';

@Entity('CaseStatusLog')
@Index(['caseId'])
@Index(['createdAt'])
export class CaseStatusLog extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  caseId!: string;

  @Column({ type: 'varchar2', length: 30 })
  fromStatus!: CaseStatus;

  @Column({ type: 'varchar2', length: 30 })
  toStatus!: CaseStatus;

  @Column({ type: 'varchar2', length: 30 })
  changedById!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => Case,
    (c) => c.statusLogs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caseId' })
  case!: Case;
}
