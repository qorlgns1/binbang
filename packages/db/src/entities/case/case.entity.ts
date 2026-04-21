import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { CaseStatus } from '../../enums.ts';
import { Accommodation } from '../core/accommodation.entity.ts';
import { BillingEvent } from '../billing/billing-event.entity.ts';
import { ConditionMetEvent } from '../billing/condition-met-event.entity.ts';
import { PriceQuote } from '../billing/price-quote.entity.ts';
import { FormSubmission } from './form-submission.entity.ts';
import { CaseMessage } from './case-message.entity.ts';
import { CaseNotification } from './case-notification.entity.ts';
import { CaseStatusLog } from './case-status-log.entity.ts';

@Entity('Case')
@Index(['status'])
@Index(['createdAt'])
export class Case extends CuidEntity {
  @Column({ type: 'varchar2', length: 30, unique: true })
  submissionId!: string;

  @Column({ type: 'varchar2', length: 30, default: CaseStatus.RECEIVED })
  status!: CaseStatus;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  assignedTo!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  statusChangedAt!: Date;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  statusChangedBy!: string | null;

  @Column({ type: 'clob', nullable: true })
  note!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  ambiguityResult!: object | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  clarificationResolvedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paymentConfirmedAt!: Date | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  paymentConfirmedBy!: string | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  accommodationId!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToOne(
    () => FormSubmission,
    (fs) => fs.case,
  )
  @JoinColumn({ name: 'submissionId' })
  submission!: FormSubmission;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.cases,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation | null;

  @OneToMany(
    () => CaseStatusLog,
    (log) => log.case,
  )
  statusLogs!: CaseStatusLog[];

  @OneToMany(
    () => ConditionMetEvent,
    (evt) => evt.case,
  )
  conditionMetEvents!: ConditionMetEvent[];

  @OneToMany(
    () => CaseNotification,
    (n) => n.case,
  )
  notifications!: CaseNotification[];

  @OneToOne(
    () => BillingEvent,
    (be) => be.case,
  )
  billingEvent!: BillingEvent | null;

  @OneToMany(
    () => CaseMessage,
    (msg) => msg.case,
  )
  messages!: CaseMessage[];

  @OneToMany(
    () => PriceQuote,
    (q) => q.case,
  )
  priceQuotes!: PriceQuote[];
}
