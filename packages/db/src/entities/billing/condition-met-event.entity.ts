import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, Unique } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Case } from '../case/case.entity.ts';
import { CheckLog } from '../core/check-log.entity.ts';
import { BillingEvent } from './billing-event.entity.ts';

@Entity('ConditionMetEvent')
@Unique(['caseId', 'checkLogId'])
@Index(['caseId'])
export class ConditionMetEvent extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  caseId!: string;

  @Column({ type: 'varchar2', length: 30 })
  checkLogId!: string;

  @Column({ type: 'simple-json' })
  evidenceSnapshot!: object;

  @Column({ type: 'clob', nullable: true })
  screenshotBase64!: string | null;

  @Column({ type: 'timestamp with time zone' })
  capturedAt!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => Case,
    (c) => c.conditionMetEvents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caseId' })
  case!: Case;

  @ManyToOne(
    () => CheckLog,
    (log) => log.conditionMetEvents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'checkLogId' })
  checkLog!: CheckLog;

  @OneToOne(
    () => BillingEvent,
    (be) => be.conditionMetEvent,
  )
  billingEvent!: BillingEvent | null;
}
