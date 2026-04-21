import { booleanTransformer } from '../base/transformers.js';
import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('affiliate_audit_job_states')
export class AffiliateAuditJobState {
  @PrimaryColumn({ type: 'varchar2', length: 100 })
  jobName!: string;

  @Column({ type: 'smallint', default: 0, transformer: booleanTransformer })
  isFailing!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  failedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  recoveredAt!: Date | null;

  @Column({ type: 'number', default: 0 })
  retryCount!: number;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  lastErrorCode!: string | null;

  @Column({ type: 'clob', nullable: true })
  lastErrorMessage!: string | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  lastAlertCause!: string | null;

  @Column({ type: 'varchar2', length: 20, nullable: true })
  lastAlertSeverity!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastAlertSentAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastRunStartedAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
