import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { BillingEventType } from '../../enums.ts';
import { Case } from '../case/case.entity.ts';
import { ConditionMetEvent } from './condition-met-event.entity.ts';

@Entity('BillingEvent')
@Index(['caseId'])
export class BillingEvent extends CuidEntity {
  @Column({ type: 'varchar2', length: 30, unique: true })
  caseId!: string;

  @Column({ type: 'varchar2', length: 30, default: BillingEventType.CONDITION_MET_FEE })
  type!: BillingEventType;

  @Column({ type: 'varchar2', length: 30, unique: true })
  conditionMetEventId!: string;

  @Column({ type: 'number' })
  amountKrw!: number;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => Case,
    (c) => c.billingEvent,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caseId' })
  case!: Case;

  @OneToOne(
    () => ConditionMetEvent,
    (cme) => cme.billingEvent,
  )
  @JoinColumn({ name: 'conditionMetEventId' })
  conditionMetEvent!: ConditionMetEvent;
}
